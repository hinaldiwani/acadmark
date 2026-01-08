# Changelog

All notable changes to the AcadMark project will be documented in this file.

## [2.0.0] - 2026-01-08

### 🚀 Major Changes - MongoDB Migration

#### Changed
- **Database System**: Migrated from MySQL to MongoDB
- **ORM/Driver**: Replaced `mysql2` with `mongoose` ODM
- **Connection Management**: Updated from MySQL connection pool to Mongoose connection
- **All Database Queries**: Converted SQL queries to MongoDB/Mongoose queries
- **Data Models**: Created Mongoose schemas for all entities

#### Added
- **New Models** (`src/models/`):
  - `Student.js` - Student information schema
  - `Teacher.js` - Teacher information schema  
  - `TeacherStudentMap.js` - Teacher-student relationship schema
  - `AttendanceSession.js` - Attendance session schema
  - `AttendanceRecord.js` - Individual attendance records schema
  - `ActivityLog.js` - Activity logging schema

- **Documentation**:
  - `MONGODB_MIGRATION.md` - Comprehensive migration guide
  - `MONGODB_REFERENCE.md` - MongoDB query reference and examples
  - `MIGRATION_SUMMARY.md` - Migration summary and checklist
  - Updated `README.md` with MongoDB setup instructions

- **Setup Scripts**:
  - `setup.ps1` - Windows PowerShell setup script
  - `setup.sh` - Linux/Mac bash setup script

- **Configuration**:
  - MongoDB connection support via `MONGODB_URI` environment variable
  - Fallback to individual connection parameters (DB_HOST, DB_PORT, DB_NAME)
  - Support for MongoDB Atlas connection strings

#### Updated Services
- `src/services/adminService.js`:
  - Converted to use Mongoose models
  - Updated bulk operations for students and teachers
  - Implemented MongoDB transactions
  - Updated activity logging

- `src/services/attendanceService.js`:
  - Replaced SQL queries with MongoDB queries
  - Implemented aggregation pipelines for statistics
  - Updated session management using Mongoose
  - Simplified attendance record storage

#### Updated Controllers
- `src/controllers/adminController.js`:
  - Updated to use MongoDB models
  - Converted aggregation queries for dashboard stats
  - Updated Excel export functionality
  - Implemented MongoDB-based backup system

- `src/controllers/authController.js`:
  - Updated authentication to use Mongoose models
  - Replaced SQL queries with MongoDB queries
  - Maintained same authentication logic

- `src/controllers/studentController.js`:
  - Converted to MongoDB/Mongoose
  - Updated attendance marking with MongoDB
  - Implemented aggregation for monthly summaries
  - Updated activity logs

- `src/controllers/teacherController.js`:
  - Updated session management with MongoDB
  - Converted attendance operations
  - Updated reporting and export functions
  - Implemented MongoDB-based backup system

#### Updated Configuration
- `config/db.js`:
  - Replaced MySQL connection pool with Mongoose connection
  - Added connection event handlers
  - Improved error handling

- `server.js`:
  - Updated to use MongoDB connection
  - Removed MySQL-specific initialization
  - Added MongoDB connection verification

- `.env.example`:
  - Updated with MongoDB connection parameters
  - Removed MySQL-specific variables
  - Added examples for local and Atlas connections

#### Removed
- Dependency: `mysql2` (MySQL driver)
- Dependency: `postgres` (unused PostgreSQL driver)
- SQL schema files (replaced with Mongoose schemas)
- MySQL-specific connection pooling code

#### Dependencies
**Added**:
- `mongoose` ^8.0.0 - MongoDB object modeling

**Removed**:
- `mysql2` ^3.11.3 - MySQL client
- `postgres` ^3.4.7 - PostgreSQL client (was unused)

#### Benefits
- ✅ Better scalability with document-based storage
- ✅ Flexible schema evolution
- ✅ Native JSON support
- ✅ Better performance for read-heavy operations
- ✅ Easier cloud deployment (MongoDB Atlas)
- ✅ Simplified data modeling
- ✅ Built-in indexing and aggregation framework

### 🔧 Technical Details

#### Schema Comparison

**Students**:
- MySQL: `student_details_db` table
- MongoDB: `students` collection with Student model

**Teachers**:
- MySQL: `teacher_details_db` table
- MongoDB: `teachers` collection with Teacher model

**Attendance**:
- MySQL: Multiple monthly tables (`attendance_backup_2024_01`, etc.)
- MongoDB: Single `attendancerecords` collection with date indexing

#### Query Examples

**Before (MySQL)**:
```javascript
const [students] = await pool.query(
  'SELECT * FROM student_details_db WHERE stream = ?',
  [stream]
);
```

**After (MongoDB)**:
```javascript
const students = await Student.find({ stream }).lean();
```

#### Transaction Changes

**Before (MySQL)**:
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
// operations
await connection.commit();
```

**After (MongoDB)**:
```javascript
const session = await mongoose.startSession();
await session.startTransaction();
// operations
await session.commitTransaction();
```

### 📋 Migration Checklist

- [x] Update package.json dependencies
- [x] Replace database connection configuration
- [x] Create Mongoose schemas/models
- [x] Update all service layer functions
- [x] Update all controller functions
- [x] Update server initialization
- [x] Update environment configuration
- [x] Create migration documentation
- [x] Create MongoDB reference guide
- [x] Update README with new instructions
- [x] Create setup scripts
- [x] Test all features
- [x] Verify no SQL injection vulnerabilities
- [x] Validate data consistency

### 🧪 Testing

All features have been tested and verified:
- ✅ User authentication (admin, teacher, student)
- ✅ Student import via CSV/Excel
- ✅ Teacher import via CSV/Excel
- ✅ Teacher-student mapping
- ✅ Attendance session creation
- ✅ Attendance marking
- ✅ Session finalization
- ✅ Report generation and export
- ✅ Dashboard statistics
- ✅ Activity logging
- ✅ Data backup and restore

### 📚 Documentation

Complete documentation provided:
- Installation guide (README.md)
- Migration guide (MONGODB_MIGRATION.md)
- MongoDB reference (MONGODB_REFERENCE.md)
- Migration summary (MIGRATION_SUMMARY.md)
- Setup scripts (setup.ps1, setup.sh)

### 🔐 Security

- ✅ Mongoose built-in query sanitization (prevents NoSQL injection)
- ✅ Schema validation at database level
- ✅ Environment variable configuration
- ✅ Session management unchanged
- ✅ Authentication logic preserved

### ⚡ Performance

Improvements:
- Faster document retrieval
- Efficient aggregation pipelines
- Better indexing strategy
- Reduced join operations
- Optimized query patterns

### 🌐 Deployment

Now supports:
- Local MongoDB deployment
- MongoDB Atlas (cloud)
- Docker containerization (with MongoDB image)
- Heroku with MongoDB addon
- Any platform supporting MongoDB

---

## [1.0.0] - Previous Version

### Features
- Admin dashboard with import management
- Teacher portal for attendance management
- Student portal for viewing attendance
- CSV import/export functionality
- MySQL database backend
- Express.js server
- Session-based authentication

---

## Migration Notes

**From v1.0.0 to v2.0.0**:
1. Backup your MySQL data before migration
2. Export data using admin panel
3. Update to v2.0.0
4. Configure MongoDB connection
5. Import data using admin panel
6. Verify all features work correctly

See [MONGODB_MIGRATION.md](MONGODB_MIGRATION.md) for detailed migration steps.

---

**Version**: 2.0.0  
**Release Date**: January 8, 2026  
**Status**: Stable  
**Breaking Changes**: Yes (database system change)
