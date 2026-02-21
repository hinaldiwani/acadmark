# Defaulter Management System - Implementation Summary

## ✅ Completed Features

### 1. Database Tables Created

#### **monthly_attendance_summary**
- Tracks attendance for each student by month (January to December)
- Calculates attendance percentage per subject per month
- Automatically flags students as defaulters if attendance < 75%
- Columns: student details, subject, month, year, total lectures, attended lectures, percentage, is_defaulter flag

#### **student_attendance_stats**
- Overall attendance statistics per student per subject
- Used for quick dashboard display
- Auto-calculates defaulter status

#### **defaulter_history**
- Maintains history of all generated defaulter lists
- Tracks who generated the list (admin/teacher) and when
- Used for audit trails

### 2. Stored Procedure & Triggers

#### **update_monthly_attendance()**
- Automatically updates monthly attendance summary
- Calculates attendance percentage
- Sets defaulter status (TRUE if < 75%)
- Updates both monthly and overall stats

#### **Triggers**
- `after_attendance_insert`: Auto-updates attendance after each session
- `after_attendance_update`: Updates when attendance is modified

### 3. Student Dashboard Features

**New API Response includes:**
```json
{
  "defaulterStatus": {
    "isDefaulter": true/false,
    "defaulterSubjects": ["Subject1", "Subject2"],
    "message": "⚠️ You are a defaulter! Your attendance is below 75%."
  },
  "defaulterDetails": [
    {
      "subject": "Mathematics",
      "attendance_percentage": 68.5,
      "total_lectures": 40,
      "attended_lectures": 27,
      "is_defaulter": true,
      "month": 1,
      "month_name": "January"
    }
  ]
}
```

### 4. Admin Features

#### **GET /api/admin/defaulters**
Get defaulter list with filters:
- `month` - Filter by specific month (1-12)
- `year` - Filter by year
- `stream` - Filter by stream
- `division` - Filter by division
- `subject` - Filter by subject
- `type` - 'monthly' or 'overall'

#### **GET /api/admin/defaulters/download**
Download defaulter list as Excel file with same filters

#### **POST /api/admin/attendance/update-monthly**
Manually trigger monthly attendance update

### 5. Teacher Features

#### **GET /api/teacher/defaulters**
Get defaulter list for teacher's subjects/stream

#### **GET /api/teacher/defaulters/download**
Download defaulter list as Excel file for their classes

### 6. Excel Export Features

**Excel file includes:**
- Student ID, Name, Roll No
- Year, Stream, Division
- Subject
- Month and Year
- Total Lectures & Attended Lectures
- Attendance Percentage
- Formatted headers with styling

## API Endpoints

### Student
- **GET /api/student/dashboard** - Includes defaulter status

### Admin
- **GET /api/admin/defaulters?month=1&year=2026&stream=CS&division=A** - Get defaulter list
- **GET /api/admin/defaulters/download?month=1&year=2026** - Download Excel
- **POST /api/admin/attendance/update-monthly** - Update monthly stats

### Teacher
- **GET /api/teacher/defaulters?month=1&year=2026** - Get defaulter list
- **GET /api/teacher/defaulters/download?month=1** - Download Excel

## How It Works

### 1. Attendance Recording
When attendance is marked in any session, triggers automatically:
1. Update `attendance_backup_aggregate` table
2. Trigger fires `update_monthly_attendance()` procedure
3. Procedure calculates monthly statistics
4. Sets `is_defaulter = TRUE` if attendance < 75%
5. Updates both `monthly_attendance_summary` and `student_attendance_stats`

### 2. Student Dashboard
When student logs in:
1. System checks `student_attendance_stats` for overall status
2. Checks `monthly_attendance_summary` for current month
3. Displays warning message if defaulter
4. Shows which subjects have < 75% attendance

### 3. Generating Defaulter List
Admin/Teacher can:
1. View defaulter list in real-time
2. Filter by month, year, stream, division, subject
3. Download as Excel file
4. System saves generation history for audit

## Database Schema

```sql
-- Example query to get defaulters for January 2026
SELECT * FROM monthly_attendance_summary 
WHERE month = 1 
  AND year_value = 2026 
  AND is_defaulter = TRUE
ORDER BY stream, division, roll_no;

-- Example query for overall defaulters
SELECT * FROM student_attendance_stats 
WHERE is_defaulter = TRUE;
```

## Testing the System

1. **Verify Tables Created:**
```bash
mysql -u root markin_attendance -e "SHOW TABLES;"
```

2. **Test Student Dashboard:**
```bash
# Login as student and check dashboard
GET http://localhost:3000/api/student/dashboard
```

3. **Test Admin Defaulter List:**
```bash
# Get defaulters for current month
GET http://localhost:3000/api/admin/defaulters?month=1&year=2026

# Download as Excel
GET http://localhost:3000/api/admin/defaulters/download?month=1&year=2026
```

4. **Test Teacher Defaulter List:**
```bash
GET http://localhost:3000/api/teacher/defaulters
GET http://localhost:3000/api/teacher/defaulters/download
```

## Files Modified/Created

### New Files:
- `monthly_attendance_setup.sql` - Database setup
- `src/services/defaulterService.js` - Defaulter management service

### Modified Files:
- `src/controllers/studentController.js` - Added defaulter status
- `src/controllers/adminController.js` - Added defaulter functions
- `src/controllers/teacherController.js` - Added defaulter functions
- `src/routes/adminRoutes.js` - Added defaulter routes
- `src/routes/teacherRoutes.js` - Added defaulter routes

## Notes

- Attendance percentage threshold is set to 75%
- Monthly data is automatically calculated via triggers
- Defaulter status updates in real-time after each attendance session
- History is maintained for all generated defaulter lists
- Excel files are generated on-demand with proper formatting
