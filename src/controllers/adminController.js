import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

import pool from "../../config/db.js";
import defaulterService from "../services/defaulterService.js";
import notificationService from "../services/notificationService.js";

import {
  parseStudentImport,
  parseTeacherImport,
  upsertStudents,
  upsertTeachers,
  upsertMappings,
  getRecentImportActivity,
  autoMapStudentsToTeachers,
} from "../services/adminService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

function ensureImportSession(req) {
  if (!req.session.importQueue) {
    req.session.importQueue = {
      students: [],
      teachers: [],
    };
  }
  return req.session.importQueue;
}

export async function handleStudentImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Upload file is required" });
    }

    const students = parseStudentImport(req.file.path).filter(
      (row) => row.studentId,
    );
    const queue = ensureImportSession(req);
    queue.students = students;

    return res.json({
      message: "Student file processed successfully",
      total: students.length,
      preview: students,
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file) {
      fs.rm(req.file.path, { force: true }, () => {});
    }
  }
}

export async function handleTeacherImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Upload file is required" });
    }

    const teachers = parseTeacherImport(req.file.path).filter(
      (row) => row.teacherId,
    );
    const queue = ensureImportSession(req);
    queue.teachers = teachers;

    return res.json({
      message: "Teacher file processed successfully",
      total: teachers.length,
      preview: teachers,
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file) {
      fs.rm(req.file.path, { force: true }, () => {});
    }
  }
}

export async function confirmImport(req, res, next) {
  try {
    const queue = ensureImportSession(req);
    const { mappings = [], clearExisting = false } = req.body;

    const results = {
      students: { inserted: 0 },
      teachers: { inserted: 0 },
      mappings: { inserted: 0 },
      cleared: { students: 0, teachers: 0 },
    };

    // Clear existing data if requested
    if (clearExisting) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Clear mappings first (foreign key dependency)
        await connection.query("DELETE FROM teacher_student_map");

        if (queue.students.length) {
          const [studentsResult] = await connection.query(
            "DELETE FROM student_details_db",
          );
          results.cleared.students = studentsResult.affectedRows;
        }

        if (queue.teachers.length) {
          const [teachersResult] = await connection.query(
            "DELETE FROM teacher_details_db",
          );
          results.cleared.teachers = teachersResult.affectedRows;
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    if (queue.students.length) {
      results.students = await upsertStudents(
        queue.students,
        req.session.user.id,
      );
    }

    if (queue.teachers.length) {
      results.teachers = await upsertTeachers(
        queue.teachers,
        req.session.user.id,
      );
    }

    if (Array.isArray(mappings) && mappings.length) {
      results.mappings = await upsertMappings(mappings, req.session.user.id);
    }

    // Automatically map students to teachers based on year and stream
    if (queue.students.length || queue.teachers.length) {
      try {
        const autoMappingResult = await autoMapStudentsToTeachers(
          req.session.user.id,
        );
        results.autoMappings = autoMappingResult;
      } catch (error) {
        console.error("Auto-mapping error:", error);
        // Continue even if auto-mapping fails
      }
    }

    req.session.importQueue = { students: [], teachers: [] };

    // Notify about data import
    notificationService.notifyDataImport({
      adminId: req.session.user.id,
      adminName: req.session.user.name,
      studentsCount: results.students.inserted,
      teachersCount: results.teachers.inserted,
      mappingsCount: results.mappings.inserted,
    });

    return res.json({
      message: "Import confirmed successfully",
      results,
    });
  } catch (error) {
    return next(error);
  }
}

export function getImportPreview(req, res) {
  const queue = ensureImportSession(req);
  return res.json({
    students: queue.students.slice(0, 10),
    teachers: queue.teachers.slice(0, 10),
  });
}

export async function fetchImportActivity(req, res, next) {
  try {
    const activity = await getRecentImportActivity();
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
}

export async function fetchDashboardStats(req, res, next) {
  try {
    const [studentCount] = await pool.query(
      `SELECT COUNT(*) as count FROM student_details_db`,
    );
    const [teacherCount] = await pool.query(
      `SELECT COUNT(*) as count FROM teacher_details_db`,
    );

    // Get distinct streams from student records
    const [streamsList] = await pool.query(
      `SELECT DISTINCT stream FROM student_details_db 
       WHERE stream IS NOT NULL AND stream != ''
       ORDER BY stream`,
    );

    // Get distinct divisions from student records
    const [divisionsList] = await pool.query(
      `SELECT DISTINCT division FROM student_details_db 
       WHERE division IS NOT NULL AND division != ''
       ORDER BY division`,
    );

    // Get stream-division combinations with student counts
    const [streamDivisionCounts] = await pool.query(
      `SELECT stream, division, COUNT(*) as students
       FROM student_details_db
       WHERE stream IS NOT NULL AND division IS NOT NULL
       GROUP BY stream, division
       ORDER BY stream, division`,
    );

    return res.json({
      students: studentCount?.[0]?.count || 0,
      teachers: teacherCount?.[0]?.count || 0,
      streams: streamsList.map((s) => s.stream),
      divisions: divisionsList.map((d) => d.division),
      streamDivisionCounts: streamDivisionCounts || [],
    });
  } catch (error) {
    return next(error);
  }
}

export async function downloadTemplate(req, res) {
  const { type } = req.params;
  const { stream, division, year } = req.query;
  const allowed = ["students", "teachers"];

  if (!allowed.includes(type)) {
    return res.status(404).json({ message: "Template not found" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      type === "students" ? "Students" : "Teachers",
    );

    if (type === "students") {
      // Define columns for students
      worksheet.columns = [
        { header: "Student_ID", key: "student_id", width: 15 },
        { header: "Name", key: "student_name", width: 30 },
        { header: "Roll_No", key: "roll_no", width: 12 },
        { header: "Year", key: "year", width: 10 },
        { header: "Stream", key: "stream", width: 15 },
        { header: "Division", key: "division", width: 12 },
      ];

      // Build query with optional filters
      let query = `SELECT student_id, student_name, roll_no, year, stream, division
                   FROM student_details_db
                   WHERE 1=1`;
      const params = [];

      if (stream && stream !== "ALL") {
        query += ` AND stream = ?`;
        params.push(stream);
      }

      if (division && division !== "ALL") {
        query += ` AND division = ?`;
        params.push(division);
      }

      if (year && year !== "ALL") {
        query += ` AND year = ?`;
        params.push(year);
      }

      query += ` ORDER BY year, stream, division, student_id`;

      // Fetch student data from database
      const [students] = await pool.query(query, params);

      // Add rows
      if (students && Array.isArray(students)) {
        students.forEach((student) => {
          worksheet.addRow(student);
        });
      }

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    } else if (type === "teachers") {
      // Define columns for teachers
      worksheet.columns = [
        { header: "Teacher_ID", key: "teacher_id", width: 15 },
        { header: "Name", key: "name", width: 30 },
        { header: "Subject", key: "subject", width: 35 },
        { header: "Year", key: "year", width: 10 },
        { header: "Stream", key: "stream", width: 15 },
      ];

      // Fetch teacher data from database
      const [teachers] = await pool.query(
        `SELECT teacher_id, name, subject, year, stream
         FROM teacher_details_db
         ORDER BY year, stream, name`,
      );

      // Add rows
      if (teachers && Array.isArray(teachers)) {
        teachers.forEach((teacher) => {
          worksheet.addRow(teacher);
        });
      }

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    }

    // Set response headers for Excel download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    // Generate filename based on filters
    let filename = type;
    if (type === "students" && (stream || division || year)) {
      const parts = [];
      if (year && year !== "ALL") parts.push(year);
      if (stream && stream !== "ALL") parts.push(stream);
      if (division && division !== "ALL") parts.push(division);

      // Add "All" labels for filters
      if (year === "ALL") parts.push("All_Years");
      if (stream === "ALL") parts.push("All_Streams");
      if (division === "ALL") parts.push("All_Divisions");

      filename = parts.length > 0 ? parts.join("_") + "_students" : "students";
    }
    filename += `_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating template:", error);
    return res.status(500).json({
      message: "Failed to generate export file",
      error: error.message,
    });
  }
}

export async function getAttendanceHistory(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, filename, session_id, teacher_id, subject, year, stream, division, started_at, saved_at
       FROM attendance_backup
       ORDER BY saved_at DESC
       LIMIT 200`,
    );

    return res.json({ history: rows });
  } catch (error) {
    return next(error);
  }
}

export async function downloadAttendanceBackup(req, res, next) {
  try {
    const backupId = req.params.id;

    const [backup] = await pool.query(
      `SELECT filename, file_content FROM attendance_backup WHERE id = ?`,
      [backupId],
    );

    if (!backup || !Array.isArray(backup) || backup.length === 0) {
      return res.status(404).json({ message: "Backup not found" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${backup[0].filename}"`,
    );
    return res.send(backup[0].file_content);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAllData(req, res, next) {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete data from all tables except attendance backups
      await connection.query(`DELETE FROM student_details_db`);
      await connection.query(`DELETE FROM teacher_details_db`);
      await connection.query(`DELETE FROM teacher_student_map`);
      await connection.query(`DELETE FROM attendance_sessions`);
      await connection.query(`DELETE FROM attendance_records`);
      await connection.query(
        `DELETE FROM activity_logs WHERE actor_role != 'admin'`,
      );

      // Log the action
      await connection.query(
        `INSERT INTO activity_logs 
          (actor_role, actor_id, action, details, created_at) 
         VALUES ('admin', ?, 'DELETE_ALL_DATA', ?, NOW())`,
        [
          req.session.user.id,
          JSON.stringify({ timestamp: new Date().toISOString() }),
        ],
      );

      await connection.commit();

      return res.json({
        message: "All data deleted successfully",
        collectionsCleared: [
          "students",
          "teachers",
          "teacherStudentMaps",
          "attendanceSessions",
          "attendanceRecords",
        ],
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
}

export async function clearAttendanceHistory(req, res, next) {
  try {
    const [result] = await pool.query(`DELETE FROM attendance_backup`);

    // Log the action
    await pool.query(
      `INSERT INTO activity_logs 
        (actor_role, actor_id, action, details, created_at) 
       VALUES ('admin', ?, 'CLEAR_ATTENDANCE_HISTORY', ?, NOW())`,
      [
        req.session.user.id,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          recordsDeleted: result.affectedRows,
        }),
      ],
    );

    return res.json({
      message: "Attendance history cleared successfully",
      recordsDeleted: result.affectedRows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function triggerAutoMapping(req, res, next) {
  try {
    const result = await autoMapStudentsToTeachers(req.session.user.id);

    return res.json({
      message: "Students automatically mapped to teachers",
      mapped: result.mapped,
    });
  } catch (error) {
    return next(error);
  }
}

// Defaulter List Management

export async function getDefaulterList(req, res, next) {
  try {
    const {
      month,
      year,
      stream,
      division,
      subject,
      type = "monthly",
      threshold = 75,
    } = req.query;

    let defaulters;
    if (type === "overall") {
      defaulters = await defaulterService.getOverallDefaulters({
        stream,
        division,
        year,
        threshold: parseFloat(threshold),
      });
    } else {
      defaulters = await defaulterService.getDefaulterList({
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        stream,
        division,
        subject,
        threshold: parseFloat(threshold),
      });
    }

    if (defaulters.length === 0) {
      return res.json({
        defaulters: [],
        count: 0,
        threshold: parseFloat(threshold),
        message:
          "No defaulters found. This could mean either no students are below the threshold, or no attendance data exists yet.",
      });
    }

    return res.json({
      defaulters,
      count: defaulters.length,
      threshold: parseFloat(threshold),
    });
  } catch (error) {
    console.error("Defaulter list error:", error);
    return res.status(500).json({
      message:
        "Failed to generate defaulter list. Please ensure attendance has been marked for students.",
      error: error.message,
    });
  }
}

export async function downloadDefaulterList(req, res, next) {
  try {
    const {
      month,
      year,
      stream,
      division,
      subject,
      type = "monthly",
      threshold = 75,
    } = req.query;

    let defaulters;
    if (type === "overall") {
      defaulters = await defaulterService.getOverallDefaulters({
        stream,
        division,
        year,
        threshold: parseFloat(threshold),
      });
    } else {
      defaulters = await defaulterService.getDefaulterList({
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        stream,
        division,
        subject,
        threshold: parseFloat(threshold),
      });
    }

    if (defaulters.length === 0) {
      return res.status(404).json({
        message:
          "No defaulters found. This could mean either no students are below the threshold, or no attendance data exists yet. Please ensure attendance has been marked for students.",
      });
    }

    const workbook = await defaulterService.generateDefaulterExcel(defaulters, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      type,
      threshold: parseFloat(threshold),
    });

    // Save to history
    await defaulterService.saveDefaulterHistory(
      defaulters,
      req.session.user.id,
      "admin",
    );

    // Notify about defaulter generation
    notificationService.notifyDefaulterGenerated({
      userId: req.session.user.id,
      userName: req.session.user.name,
      role: "admin",
      count: defaulters.length,
      threshold: parseFloat(threshold),
      filters: { month, year, stream, division, subject, type },
    });

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs 
        (actor_role, actor_id, action, details, created_at) 
       VALUES ('admin', ?, 'DOWNLOAD_DEFAULTER_LIST', ?, NOW())`,
      [
        req.session.user.id,
        JSON.stringify({
          count: defaulters.length,
          threshold: parseFloat(threshold),
          filters: { month, year, stream, division, subject },
        }),
      ],
    );

    const filename = `Defaulter_List_${threshold}%_${month || "All"}_${year || new Date().getFullYear()}_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function updateMonthlyAttendance(req, res, next) {
  try {
    await defaulterService.updateMonthlyAttendance();

    await pool.query(
      `INSERT INTO activity_logs 
        (actor_role, actor_id, action, details, created_at) 
       VALUES ('admin', ?, 'UPDATE_MONTHLY_ATTENDANCE', ?, NOW())`,
      [
        req.session.user.id,
        JSON.stringify({ timestamp: new Date().toISOString() }),
      ],
    );

    return res.json({
      message: "Monthly attendance updated successfully",
    });
  } catch (error) {
    return next(error);
  }
}

// Teacher Information
export async function getTeachersInfo(req, res, next) {
  try {
    const query = `
      SELECT 
        t.teacher_id,
        t.name as teacher_name,
        t.subject,
        t.year,
        t.stream,
        COALESCE(
          GROUP_CONCAT(
            DISTINCT CASE 
              WHEN s.year = t.year AND s.stream = t.stream 
              THEN s.division 
            END 
            ORDER BY s.division 
            SEPARATOR ', '
          ), 
          'N/A'
        ) as divisions,
        COUNT(
          DISTINCT CASE 
            WHEN s.year = t.year AND s.stream = t.stream 
            THEN tsm.student_id 
          END
        ) as student_count
      FROM teacher_details_db t
      LEFT JOIN teacher_student_map tsm ON t.teacher_id = tsm.teacher_id
      LEFT JOIN student_details_db s ON tsm.student_id = s.student_id
      GROUP BY t.teacher_id, t.year, t.stream, t.subject, t.name
      ORDER BY t.name, t.year, t.stream
    `;

    const [teachers] = await pool.query(query);

    return res.json({
      teachers: teachers || [],
      count: teachers?.length || 0,
    });
  } catch (error) {
    console.error("Get teachers info error:", error);
    return res.status(500).json({
      message: "Failed to fetch teachers information",
      error: error.message,
    });
  }
}

// Student Information by Stream and Division
export async function getStudentsInfo(req, res, next) {
  try {
    const { year, stream, division } = req.query;

    if (!year || !stream || !division) {
      return res.status(400).json({
        message: "Year, stream, and division are required",
      });
    }

    // Get students
    const studentsQuery = `
      SELECT 
        student_id,
        student_name,
        roll_no,
        year,
        stream,
        division
      FROM student_details_db
      WHERE year = ? AND stream = ? AND division = ?
      ORDER BY roll_no
    `;
    const [students] = await pool.query(studentsQuery, [
      year,
      stream,
      division,
    ]);

    // Get subjects taught in this stream and division
    const subjectsQuery = `
      SELECT DISTINCT t.subject
      FROM teacher_details_db t
      JOIN teacher_student_map tsm ON t.teacher_id = tsm.teacher_id
      JOIN student_details_db s ON tsm.student_id = s.student_id
      WHERE s.year = ? AND s.stream = ? AND s.division = ?
      ORDER BY t.subject
    `;
    const [subjects] = await pool.query(subjectsQuery, [
      year,
      stream,
      division,
    ]);

    // Get teachers teaching this stream and division
    const teachersQuery = `
      SELECT DISTINCT 
        t.teacher_id,
        t.name as teacher_name,
        t.subject
      FROM teacher_details_db t
      JOIN teacher_student_map tsm ON t.teacher_id = tsm.teacher_id
      JOIN student_details_db s ON tsm.student_id = s.student_id
      WHERE s.year = ? AND s.stream = ? AND s.division = ?
      ORDER BY t.name
    `;
    const [teachers] = await pool.query(teachersQuery, [
      year,
      stream,
      division,
    ]);

    return res.json({
      students: students || [],
      subjects: subjects?.map((s) => s.subject) || [],
      teachers: teachers || [],
      year,
      stream,
      division,
      count: students?.length || 0,
    });
  } catch (error) {
    console.error("Get students info error:", error);
    return next(error);
  }
}
