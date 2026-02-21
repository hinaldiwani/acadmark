import pool from "../../config/db.js";
import ExcelJS from "exceljs";

class DefaulterService {
    /**
     * Get defaulter list for a specific month with custom threshold
     */
    async getDefaulterList(filters = {}) {
        const { month, year, stream, division, subject, threshold = 75 } = filters;

        let query = `
      SELECT 
        mas.student_id,
        mas.student_name,
        mas.roll_no,
        mas.year,
        mas.stream,
        mas.division,
        mas.subject,
        mas.month,
        mas.year_value,
        mas.total_lectures,
        mas.attended_lectures,
        mas.attendance_percentage,
        CASE 
          WHEN mas.month = 1 THEN 'January'
          WHEN mas.month = 2 THEN 'February'
          WHEN mas.month = 3 THEN 'March'
          WHEN mas.month = 4 THEN 'April'
          WHEN mas.month = 5 THEN 'May'
          WHEN mas.month = 6 THEN 'June'
          WHEN mas.month = 7 THEN 'July'
          WHEN mas.month = 8 THEN 'August'
          WHEN mas.month = 9 THEN 'September'
          WHEN mas.month = 10 THEN 'October'
          WHEN mas.month = 11 THEN 'November'
          WHEN mas.month = 12 THEN 'December'
        END as month_name
      FROM monthly_attendance_summary mas
      WHERE mas.attendance_percentage < ?
    `;

        const params = [threshold];

        if (month) {
            query += ` AND mas.month = ?`;
            params.push(month);
        }

        if (year) {
            query += ` AND mas.year_value = ?`;
            params.push(year);
        }

        if (stream) {
            query += ` AND mas.stream = ?`;
            params.push(stream);
        }

        if (division) {
            query += ` AND mas.division = ?`;
            params.push(division);
        }

        if (subject) {
            query += ` AND mas.subject = ?`;
            params.push(subject);
        }

        query += ` ORDER BY mas.year_value DESC, mas.month DESC, mas.stream, mas.division, mas.student_id`;

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Get overall defaulters (across all subjects) with custom threshold
     */
    async getOverallDefaulters(filters = {}) {
        const { stream, division, year, threshold = 75 } = filters;

        let query = `
      SELECT 
        sas.student_id,
        sd.student_name,
        sd.roll_no,
        sd.year,
        sd.stream,
        sd.division,
        sas.subject,
        sas.total_lectures,
        sas.attended_lectures,
        sas.attendance_percentage
      FROM student_attendance_stats sas
      JOIN student_details_db sd ON sas.student_id = sd.student_id
      WHERE sas.attendance_percentage < ?
    `;

        const params = [threshold];

        if (stream) {
            query += ` AND sd.stream = ?`;
            params.push(stream);
        }

        if (division) {
            query += ` AND sd.division = ?`;
            params.push(division);
        }

        if (year) {
            query += ` AND sd.year = ?`;
            params.push(year);
        }

        query += ` ORDER BY sd.stream, sd.division, sd.student_id, sas.subject`;

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Generate Excel file for defaulter list
     */
    async generateDefaulterExcel(defaulters, options = {}) {
        const { month, year, type = "monthly", threshold = 75 } = options;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Defaulter List");

        // Add title row with threshold information
        worksheet.mergeCells('A1:L1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = `Defaulter List - Students with Attendance Below ${threshold}%`;
        titleRow.getCell(1).font = { bold: true, size: 14 };
        titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        titleRow.height = 25;

        // Set column headers
        const headers =
            type === "monthly"
                ? [
                    "Student ID",
                    "Name",
                    "Roll No",
                    "Year",
                    "Stream",
                    "Division",
                    "Subject",
                    "Month",
                    "Year",
                    "Total Lectures",
                    "Attended",
                    "Attendance %",
                ]
                : [
                    "Student ID",
                    "Name",
                    "Roll No",
                    "Year",
                    "Stream",
                    "Division",
                    "Subject",
                    "Total Lectures",
                    "Attended",
                    "Attendance %",
                ];

        worksheet.addRow(headers);

        // Style header row
        worksheet.getRow(2).font = { bold: true };
        worksheet.getRow(2).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };

        // Add data rows
        defaulters.forEach((defaulter) => {
            const row =
                type === "monthly"
                    ? [
                        defaulter.student_id,
                        defaulter.student_name,
                        defaulter.roll_no,
                        defaulter.year,
                        defaulter.stream,
                        defaulter.division,
                        defaulter.subject,
                        defaulter.month_name || defaulter.month,
                        defaulter.year_value,
                        defaulter.total_lectures,
                        defaulter.attended_lectures,
                        defaulter.attendance_percentage,
                    ]
                    : [
                        defaulter.student_id,
                        defaulter.student_name,
                        defaulter.roll_no,
                        defaulter.year,
                        defaulter.stream,
                        defaulter.division,
                        defaulter.subject,
                        defaulter.total_lectures,
                        defaulter.attended_lectures,
                        defaulter.attendance_percentage,
                    ];

            worksheet.addRow(row);
        });

        // Auto-fit columns
        worksheet.columns.forEach((column) => {
            column.width = 15;
        });

        return workbook;
    }

    /**
     * Save defaulter generation to history
     */
    async saveDefaulterHistory(defaulters, generatedBy, role) {
        if (defaulters.length === 0) return;

        const values = defaulters.map((d) => [
            d.student_id,
            d.student_name,
            d.roll_no,
            d.year,
            d.stream,
            d.division,
            d.subject,
            d.month,
            d.year_value,
            d.attendance_percentage,
            generatedBy,
            role,
        ]);

        const query = `
      INSERT INTO defaulter_history 
      (student_id, student_name, roll_no, year, stream, division, subject, 
       month, year_value, attendance_percentage, generated_by, generated_by_role)
      VALUES ?
    `;

        await pool.query(query, [values]);
    }

    /**
     * Get student's defaulter status
     */
    async getStudentDefaulterStatus(studentId) {
        const query = `
      SELECT 
        sas.subject,
        sas.total_lectures,
        sas.attended_lectures,
        sas.attendance_percentage,
        sas.is_defaulter,
        mas.month,
        mas.year_value,
        CASE 
          WHEN mas.month = 1 THEN 'January'
          WHEN mas.month = 2 THEN 'February'
          WHEN mas.month = 3 THEN 'March'
          WHEN mas.month = 4 THEN 'April'
          WHEN mas.month = 5 THEN 'May'
          WHEN mas.month = 6 THEN 'June'
          WHEN mas.month = 7 THEN 'July'
          WHEN mas.month = 8 THEN 'August'
          WHEN mas.month = 9 THEN 'September'
          WHEN mas.month = 10 THEN 'October'
          WHEN mas.month = 11 THEN 'November'
          WHEN mas.month = 12 THEN 'December'
        END as month_name
      FROM student_attendance_stats sas
      LEFT JOIN monthly_attendance_summary mas 
        ON sas.student_id = mas.student_id 
        AND sas.subject = mas.subject
        AND mas.month = MONTH(CURRENT_DATE)
        AND mas.year_value = YEAR(CURRENT_DATE)
      WHERE sas.student_id = ?
      ORDER BY sas.subject
    `;

        const [rows] = await pool.query(query, [studentId]);

        const isDefaulter = rows.some((row) => row.is_defaulter);
        const defaulterSubjects = rows
            .filter((row) => row.is_defaulter)
            .map((row) => row.subject);

        return {
            isDefaulter,
            defaulterSubjects,
            details: rows,
        };
    }

    /**
     * Update monthly attendance summaries (call this after marking attendance)
     */
    async updateMonthlyAttendance() {
        await pool.query("CALL update_monthly_attendance()");
    }
}

export default new DefaulterService();
