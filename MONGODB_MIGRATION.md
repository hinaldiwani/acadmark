# MongoDB Migration Guide

## Overview
This application has been successfully migrated from MySQL to MongoDB. This document explains the changes and how to set up and run the application.

## What Changed

### 1. Database Layer
- **From**: MySQL with `mysql2` driver
- **To**: MongoDB with Mongoose ODM

### 2. Database Configuration
- **File**: `config/db.js`
- Connection now uses Mongoose instead of MySQL connection pool
- Supports both MongoDB URI and individual connection parameters

### 3. Data Models (New)
Created Mongoose schemas in `src/models/`:
- `Student.js` - Student information and details
- `Teacher.js` - Teacher information and subjects
- `TeacherStudentMap.js` - Mapping between teachers and students
- `AttendanceSession.js` - Attendance session records
- `AttendanceRecord.js` - Individual attendance records
- `ActivityLog.js` - Activity and audit logs

### 4. Services Updated
- `adminService.js` - Uses Mongoose models and transactions
- `attendanceService.js` - MongoDB queries and aggregations

### 5. Controllers Updated
All controllers now use MongoDB:
- `adminController.js` - Admin dashboard and data management
- `authController.js` - Authentication using MongoDB
- `studentController.js` - Student features and attendance
- `teacherController.js` - Teacher features and session management

### 6. Dependencies
**Removed**:
- `mysql2` - MySQL driver
- `postgres` - PostgreSQL driver (was unused)

**Added**:
- `mongoose` ^8.0.0 - MongoDB ODM

## Setup Instructions

### Prerequisites
1. **MongoDB** installed and running
   - Local: [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)

### Installation Steps

#### 1. Install Dependencies
```bash
npm install
```

This will install the new `mongoose` package and remove old MySQL dependencies.

#### 2. Configure Environment Variables
Update your `.env` file with MongoDB connection details:

**For Local MongoDB**:
```env
MONGODB_URI=mongodb://localhost:27017/acadmark_attendance
# OR use individual parameters
DB_HOST=localhost
DB_PORT=27017
DB_NAME=acadmark_attendance
```

**For MongoDB Atlas (Cloud)**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acadmark_attendance?retryWrites=true&w=majority
```

Other environment variables remain the same:
```env
PORT=3000
SESSION_SECRET=your_secret_here
ADMIN_USER=admin@acadmark
ADMIN_PASSWORD=admin123
CAMPUS_LATITUDE=19.0760
CAMPUS_LONGITUDE=72.8777
CAMPUS_RADIUS_METERS=500
```

#### 3. Start the Application
```bash
npm start
# Or for development with auto-reload
npm run dev
```

The application will:
1. Connect to MongoDB
2. Create necessary indexes automatically
3. Start the server on the configured port

## Data Migration from MySQL

If you have existing data in MySQL that you want to migrate to MongoDB, follow these steps:

### Option 1: Export/Import via CSV/Excel

1. **Export from MySQL** using the admin panel's export feature
2. **Import to MongoDB** using the admin panel's import feature
   - Students: Upload students CSV/Excel file
   - Teachers: Upload teachers CSV/Excel file
   - Mappings: Confirm teacher-student mappings

### Option 2: Custom Migration Script

Create a migration script to transfer data:

```javascript
// migrate.js
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import Student from './src/models/Student.js';
import Teacher from './src/models/Teacher.js';
// ... import other models

async function migrate() {
  // Connect to MySQL
  const mysqlPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'markin_attendance'
  });

  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/acadmark_attendance');

  // Migrate Students
  const [students] = await mysqlPool.query('SELECT * FROM student_details_db');
  for (const student of students) {
    await Student.create({
      studentId: student.student_id,
      studentName: student.student_name,
      rollNo: student.roll_no,
      year: student.year,
      stream: student.stream,
      division: student.division
    });
  }

  // Migrate Teachers
  const [teachers] = await mysqlPool.query('SELECT * FROM teacher_details_db');
  for (const teacher of teachers) {
    await Teacher.create({
      teacherId: teacher.teacher_id,
      name: teacher.name,
      subject: teacher.subject,
      year: teacher.year,
      stream: teacher.stream
    });
  }

  console.log('Migration completed!');
  process.exit(0);
}

migrate().catch(console.error);
```

## Key Differences: MySQL vs MongoDB

### 1. Data Structure
- **MySQL**: Rigid table schemas with foreign keys
- **MongoDB**: Flexible document schemas with embedded data

### 2. Queries
**MySQL**:
```javascript
const [rows] = await pool.query('SELECT * FROM students WHERE year = ?', [year]);
```

**MongoDB**:
```javascript
const students = await Student.find({ year });
```

### 3. Transactions
**MySQL**:
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
// ... operations
await connection.commit();
```

**MongoDB**:
```javascript
const session = await mongoose.startSession();
await session.startTransaction();
// ... operations
await session.commitTransaction();
```

### 4. Joins
**MySQL**: Uses JOIN statements
**MongoDB**: Uses `$lookup` aggregation or populate for references

## Benefits of MongoDB Migration

1. **Flexible Schema**: Easy to add new fields without ALTER TABLE
2. **Scalability**: Better horizontal scaling capabilities
3. **JSON-like Documents**: Natural fit for JavaScript/Node.js applications
4. **Rich Query Language**: Powerful aggregation framework
5. **Cloud Ready**: Easy deployment with MongoDB Atlas
6. **No Complex Joins**: Embedded documents reduce need for joins

## Troubleshooting

### Connection Issues
**Problem**: Cannot connect to MongoDB
**Solution**:
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- For Atlas, whitelist your IP address

### Missing Data
**Problem**: Data doesn't appear after migration
**Solution**:
- Verify database name matches in connection string
- Check collection names (use MongoDB Compass or `mongosh`)
- Re-import data using admin panel

### Performance Issues
**Problem**: Slow queries
**Solution**:
- Indexes are created automatically by Mongoose schemas
- Use MongoDB Compass to analyze query performance
- Consider adding custom indexes for frequently queried fields

## Testing the Migration

1. **Login Test**: Verify admin, teacher, and student login
2. **Data Import**: Test importing students and teachers
3. **Attendance**: Create and finalize attendance sessions
4. **Reports**: Generate and download attendance reports
5. **Dashboard Stats**: Check that statistics display correctly

## Rollback Plan

If you need to rollback to MySQL:
1. Keep a backup of your MySQL database
2. The old MySQL code is in your git history
3. Revert changes and reinstall `mysql2` package

## Support & Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Mongoose Docs**: https://mongoosejs.com/docs/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **MongoDB Compass**: https://www.mongodb.com/products/compass (GUI tool)

## Next Steps

1. Update your `.env` file with MongoDB credentials
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Import your data using the admin panel
5. Test all features thoroughly

Happy migrating! 🚀
