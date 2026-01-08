import pool from "../../config/db.js";
import {
  getMappedStudents,
  createAttendanceSession,
  finalizeAttendanceSession,
  getTeacherStats,
  logAttendanceToAggregate,
} from "../services/attendanceService.js";

function buildActivityPayload(action, teacherId, meta = {}) {
  return pool.query(
    `INSERT INTO activity_logs (actor_role, actor_id, action, details, created_at) 
     VALUES ('teacher', ?, ?, ?, NOW())`,
    [teacherId, action, JSON.stringify(meta)]
  );
}

export async function teacherDashboard(req, res, next) {
  try {
    const teacherId = req.session.user.id;

    // Get teacher details including subject and stream
    const [teacher] = await pool.query(
      `SELECT teacher_id, name, subject, stream
       FROM teacher_details_db
       WHERE teacher_id = ?`,
      [teacherId]
    );

    const teacherInfo = teacher?.[0] || {};
    const stats = await getTeacherStats(teacherId);

    // Get unique streams from database
    const [streams] = await pool.query(
      `SELECT DISTINCT stream FROM student_details_db WHERE stream IS NOT NULL`
    );

    // Get unique divisions from database
    const [divisions] = await pool.query(
      `SELECT DISTINCT division FROM student_details_db WHERE division IS NOT NULL`
    );

    return res.json({
      ...stats,
      teacherInfo: {
        id: teacherInfo.teacher_id,
        name: teacherInfo.name,
        subject: teacherInfo.subject,
        stream: teacherInfo.stream,
      },
      streams: Array.isArray(streams) ? streams.map(s => s.stream) : [],
      divisions: Array.isArray(divisions) ? divisions.map(d => d.division) : [],
    });
  } catch (error) {
    return next(error);
  }
}

export async function mappedStudents(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const students = await getMappedStudents(teacherId);
    return res.json({ students });
  } catch (error) {
    return next(error);
  }
}

export async function startAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { subject, year, division, stream } = req.body;

    if (!subject || !year || !division || !stream) {
      return res
        .status(400)
        .json({ message: "Subject, year, division, and stream are required" });
    }

    const students = await getMappedStudents(teacherId);
    if (!students.length) {
      return res
        .status(404)
        .json({ message: "No students mapped to this teacher yet" });
    }

    const sessionId = await createAttendanceSession({
      teacherId,
      subject,
      year,
      division,
      stream,
    });

    await buildActivityPayload("START_ATTENDANCE", teacherId, {
      sessionId,
      subject,
      year,
      division,
      stream,
    });

    return res.json({
      message: "Attendance session started",
      sessionId,
      students,
    });
  } catch (error) {
    return next(error);
  }
}

export async function endAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { sessionId, subject, year, stream, division, attendance } = req.body;

    if (!sessionId || !Array.isArray(attendance) || !attendance.length) {
      return res
        .status(400)
        .json({ message: "Session ID and attendance list are required" });
    }

    const formatted = attendance.map((item) => ({
      studentId: item.studentId,
      status: item.status === "P" ? "P" : "A",
    }));

    const summary = await finalizeAttendanceSession(
      sessionId,
      teacherId,
      formatted
    );

    await logAttendanceToAggregate(formatted, {
      sessionId,
      teacherId,
      subject,
      year,
      stream,
      division,
      sessionDate: new Date(),
    });

    await buildActivityPayload("END_ATTENDANCE", teacherId, {
      sessionId,
      subject,
      year,
      division,
      stream,
      present: summary.present,
      absent: summary.absent,
    });

    return res.json({
      message: "Attendance recorded",
      summary,
    });
  } catch (error) {
    return next(error);
  }
}

export async function manualAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { studentId, status, reason } = req.body;

    if (!studentId || !status) {
      return res
        .status(400)
        .json({ message: "Student ID and status are required" });
    }

    await pool.query(
      `INSERT INTO manual_overrides 
        (teacher_id, student_id, status, reason, timestamp) 
       VALUES (?, ?, ?, ?, NOW())`,
      [teacherId, studentId, status === "P" ? "P" : "A", reason || null]
    );

    await buildActivityPayload("MANUAL_OVERRIDE", teacherId, {
      studentId,
      status,
      reason,
    });

    return res.json({ message: "Manual attendance override saved" });
  } catch (error) {
    return next(error);
  }
}

export async function teacherActivityLog(req, res, next) {
  try {
    const teacherId = req.session.user.id;

    const [rows] = await pool.query(
      `SELECT action, details, created_at
       FROM activity_logs
       WHERE actor_role = 'teacher' AND actor_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [teacherId]
    );

    return res.json({ activity: rows });
  } catch (error) {
    return next(error);
  }
}

export async function saveAttendanceBackup(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const {
      filename,
      fileContent,
      sessionId,
      subject,
      year,
      stream,
      division,
      startedAt,
      attendance,
    } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    await pool.query(
      `INSERT INTO attendance_backup 
        (filename, session_id, teacher_id, subject, year, stream, division, started_at, records, file_content, saved_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        filename,
        sessionId || null,
        teacherId,
        subject || null,
        year || null,
        stream || null,
        division || null,
        startedAt ? new Date(startedAt) : null,
        JSON.stringify(attendance || []),
        fileContent || null,
      ]
    );

    // log backup action
    await buildActivityPayload("BACKUP_ATTENDANCE", teacherId, {
      filename,
      sessionId,
    });

    return res.json({ message: "Backup saved" });
  } catch (error) {
    return next(error);
  }
}

export async function getAttendanceHistory(req, res, next) {
  try {
    const teacherId = req.session.user.id;

    const [rows] = await pool.query(
      `SELECT id, filename, session_id, subject, year, stream, division, started_at, saved_at
       FROM attendance_backup
       WHERE teacher_id = ?
       ORDER BY saved_at DESC
       LIMIT 100`,
      [teacherId]
    );

    return res.json({ history: rows });
  } catch (error) {
    return next(error);
  }
}

export async function downloadAttendanceBackup(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const backupId = req.params.id;

    const [backup] = await pool.query(
      `SELECT filename, file_content 
       FROM attendance_backup 
       WHERE id = ? AND teacher_id = ?`,
      [backupId, teacherId]
    );

    if (!backup || !Array.isArray(backup) || backup.length === 0) {
      return res.status(404).json({ message: "Backup not found" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${backup[0].filename}"`
    );
    return res.send(backup[0].file_content);
  } catch (error) {
    return next(error);
  }
}

export async function exportAttendanceExcel(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const {
      sessionId,
      subject,
      stream,
      division,
      startedAt,
      teacherName,
      summary,
      students,
    } = req.body;

    // Import xlsx-js-style for styled Excel files
    const XLSX = await import("xlsx-js-style");

    // Create workbook and worksheet
    const wb = XLSX.default.utils.book_new();

    // Prepare data with college header
    const data = [];

    // College header (row 1)
    data.push([
      "Sheth N.K.T.T. College of Commerce & Sheth J.T.T. College of Arts (Autonomous) Thane West - 400601",
    ]);
    data.push([]); // Empty row

    // Session metadata
    data.push(["Attendance Report"]);
    data.push([]);
    data.push(["Session ID:", sessionId || ""]);
    data.push(["Subject:", subject || ""]);
    data.push(["Stream:", stream || ""]);
    data.push(["Division:", division || ""]);
    data.push(["Teacher:", teacherName || ""]);
    data.push([
      "Date & Time:",
      startedAt ? new Date(startedAt).toLocaleString() : "",
    ]);
    data.push(["Present:", summary?.present || 0]);
    data.push(["Absent:", summary?.absent || 0]);
    data.push([]);

    // Student attendance header (row 13)
    data.push(["Roll No", "Student ID", "Name", "Status"]);

    // Student rows
    if (students && students.length) {
      students.forEach((student) => {
        data.push([
          student.rollNo || "",
          student.studentId || "",
          student.name || "",
          student.status === "P" ? "Present" : "Absent",
        ]);
      });
    }

    // Create worksheet from data
    const ws = XLSX.default.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, // Roll No
      { wch: 15 }, // Student ID
      { wch: 30 }, // Name
      { wch: 12 }, // Status
    ];

    // Merge cells for header (college name)
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Merge A1:D1 for college name
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Merge A3:D3 for "Attendance Report"
    ];

    // Apply styling to cells
    // College header (A1)
    if (ws["A1"]) {
      ws["A1"].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // "Attendance Report" header (A3)
    if (ws["A3"]) {
      ws["A3"].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center" },
      };
    }

    // Header row for student table (row 13, 0-indexed as row 12)
    const headerRow = 12;
    ["A", "B", "C", "D"].forEach((col) => {
      const cellRef = col + (headerRow + 1);
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    // Apply color coding to student rows based on status
    const dataStartRow = 13; // Row 14 in 1-indexed (data starts after header)
    if (students && students.length) {
      students.forEach((student, idx) => {
        const rowNum = dataStartRow + idx + 1;

        // Color all cells in the row
        ["A", "B", "C", "D"].forEach((col) => {
          const cellRef = col + rowNum;
          if (ws[cellRef]) {
            const isPresent = student.status === "P";
            // Light green for Present (#90EE90), Light red for Absent (#FFB6C1)
            ws[cellRef].s = {
              fill: {
                fgColor: { rgb: isPresent ? "90EE90" : "FFB6C1" },
              },
            };
          }
        });
      });
    }

    // Add worksheet to workbook
    XLSX.default.utils.book_append_sheet(wb, ws, "Attendance");

    // Generate buffer
    const excelBuffer = XLSX.default.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Generate filename
    const timestamp = new Date(startedAt || Date.now())
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/[/:]/g, "-")
      .replace(", ", "_");

    const subjectName = (subject || "session").replace(/\s+/g, "_");
    const filename = `${timestamp}_${subjectName}_attendance_record.xlsx`;

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  } catch (error) {
    console.error("Excel export error:", error);
    return next(error);
  }
}
