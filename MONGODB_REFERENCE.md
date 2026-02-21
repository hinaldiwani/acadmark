# MongoDB Quick Reference for AcadMark

This document provides quick MongoDB commands and queries for common operations in the AcadMark application.

## MongoDB Shell Commands

### Start MongoDB Shell
```bash
# Local MongoDB
mongosh

# MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/acadmark_attendance" --username <username>
```

### Show Databases
```javascript
show dbs
```

### Use Database
```javascript
use acadmark_attendance
```

### Show Collections
```javascript
show collections
```

## Common Queries

### Students

**Count all students:**
```javascript
db.students.countDocuments()
```

**Find all students:**
```javascript
db.students.find()
```

**Find students by stream:**
```javascript
db.students.find({ stream: "Computer Science" })
```

**Find students by year and division:**
```javascript
db.students.find({ year: "3", division: "A" })
```

**Get unique streams:**
```javascript
db.students.distinct("stream")
```

### Teachers

**Count all teachers:**
```javascript
db.teachers.countDocuments()
```

**Find teachers by subject:**
```javascript
db.teachers.find({ subject: "Mathematics" })
```

**Find all teachers:**
```javascript
db.teachers.find().pretty()
```

### Attendance Records

**Find attendance for a specific student:**
```javascript
db.attendancerecords.find({ studentId: "STU001" })
```

**Count attendance records:**
```javascript
db.attendancerecords.countDocuments()
```

**Find present records:**
```javascript
db.attendancerecords.find({ status: "P" })
```

**Get attendance for specific date:**
```javascript
db.attendancerecords.find({
  sessionDate: {
    $gte: ISODate("2026-01-01"),
    $lt: ISODate("2026-02-01")
  }
})
```

### Attendance Sessions

**Find all active sessions:**
```javascript
db.attendancesessions.find({ status: "active" })
```

**Find teacher's sessions:**
```javascript
db.attendancesessions.find({ teacherId: "T001" })
```

**Count completed sessions:**
```javascript
db.attendancesessions.countDocuments({ status: "completed" })
```

### Activity Logs

**Find admin activities:**
```javascript
db.activitylogs.find({ actorRole: "admin" }).sort({ timestamp: -1 }).limit(10)
```

**Find recent activities:**
```javascript
db.activitylogs.find().sort({ createdAt: -1 }).limit(20)
```

## Aggregation Queries

### Student Attendance Statistics

**Attendance percentage by student:**
```javascript
db.attendancerecords.aggregate([
  { $match: { studentId: "STU001" } },
  {
    $group: {
      _id: "$studentId",
      totalRecords: { $sum: 1 },
      present: {
        $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      studentId: "$_id",
      totalRecords: 1,
      present: 1,
      percentage: {
        $multiply: [{ $divide: ["$present", "$totalRecords"] }, 100]
      }
    }
  }
])
```

**Subject-wise attendance:**
```javascript
db.attendancerecords.aggregate([
  { $match: { studentId: "STU001" } },
  {
    $group: {
      _id: "$subject",
      total: { $sum: 1 },
      present: {
        $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      subject: "$_id",
      total: 1,
      present: 1,
      percentage: {
        $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2]
      }
    }
  }
])
```

### Teacher Statistics

**Sessions count per teacher:**
```javascript
db.attendancesessions.aggregate([
  {
    $group: {
      _id: "$teacherId",
      totalSessions: { $sum: 1 },
      totalPresent: { $sum: "$presentCount" },
      totalAbsent: { $sum: "$absentCount" }
    }
  }
])
```

### Stream/Division Statistics

**Students count by stream and division:**
```javascript
db.students.aggregate([
  {
    $group: {
      _id: { stream: "$stream", division: "$division" },
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      stream: "$_id.stream",
      division: "$_id.division",
      students: "$count"
    }
  },
  { $sort: { stream: 1, division: 1 } }
])
```

## Data Management

### Insert Sample Data

**Insert a student:**
```javascript
db.students.insertOne({
  studentId: "STU001",
  studentName: "John Doe",
  rollNo: "101",
  year: "3",
  stream: "Computer Science",
  division: "A",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Insert a teacher:**
```javascript
db.teachers.insertOne({
  teacherId: "T001",
  name: "Prof. Jane Smith",
  subject: "Database Management",
  year: "3",
  stream: "Computer Science",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Update Data

**Update student information:**
```javascript
db.students.updateOne(
  { studentId: "STU001" },
  {
    $set: {
      division: "B",
      updatedAt: new Date()
    }
  }
)
```

**Update multiple records:**
```javascript
db.students.updateMany(
  { year: "2", stream: "Computer Science" },
  { $set: { year: "3", updatedAt: new Date() } }
)
```

### Delete Data

**Delete a specific student:**
```javascript
db.students.deleteOne({ studentId: "STU001" })
```

**Delete all students in a division:**
```javascript
db.students.deleteMany({ division: "Z" })
```

**Clear all attendance records (DANGEROUS):**
```javascript
db.attendancerecords.deleteMany({})
```

## Indexes

### View Indexes
```javascript
db.students.getIndexes()
db.attendancerecords.getIndexes()
```

### Create Custom Index
```javascript
// Create index on studentId for faster queries
db.attendancerecords.createIndex({ studentId: 1 })

// Create compound index
db.attendancerecords.createIndex({ studentId: 1, sessionDate: -1 })

// Create text index for search
db.students.createIndex({ studentName: "text", studentId: "text" })
```

## Backup and Restore

### Export Database
```bash
# Export entire database
mongodump --uri="mongodb://localhost:27017/acadmark_attendance" --out=./backup

# Export specific collection
mongodump --uri="mongodb://localhost:27017/acadmark_attendance" --collection=students --out=./backup
```

### Import Database
```bash
# Restore entire database
mongorestore --uri="mongodb://localhost:27017/acadmark_attendance" ./backup/acadmark_attendance

# Restore specific collection
mongorestore --uri="mongodb://localhost:27017/acadmark_attendance" --collection=students ./backup/acadmark_attendance/students.bson
```

### Export to JSON
```bash
mongoexport --uri="mongodb://localhost:27017/acadmark_attendance" --collection=students --out=students.json --pretty
```

### Import from JSON
```bash
mongoimport --uri="mongodb://localhost:27017/acadmark_attendance" --collection=students --file=students.json
```

## Performance Monitoring

### Check Query Performance
```javascript
db.attendancerecords.find({ studentId: "STU001" }).explain("executionStats")
```

### Database Statistics
```javascript
db.stats()
```

### Collection Statistics
```javascript
db.students.stats()
```

## Useful MongoDB Compass Queries

MongoDB Compass is a GUI tool for MongoDB. Here are filter queries you can use:

**Filter students by year:**
```json
{ "year": "3" }
```

**Filter attendance records by date range:**
```json
{
  "sessionDate": {
    "$gte": { "$date": "2026-01-01T00:00:00Z" },
    "$lt": { "$date": "2026-02-01T00:00:00Z" }
  }
}
```

**Filter present records:**
```json
{ "status": "P" }
```

## Tips and Best Practices

1. **Always use indexes** for frequently queried fields
2. **Use projections** to fetch only required fields:
   ```javascript
   db.students.find({}, { studentName: 1, rollNo: 1, _id: 0 })
   ```

3. **Use `lean()`** in Mongoose for read-only operations (better performance)

4. **Batch operations** for bulk inserts/updates:
   ```javascript
   db.students.bulkWrite([
     { insertOne: { document: { studentId: "S001", ... } } },
     { insertOne: { document: { studentId: "S002", ... } } }
   ])
   ```

5. **Regular backups** using `mongodump`

6. **Monitor performance** using MongoDB Atlas monitoring or `db.currentOp()`

## Troubleshooting

### Connection Issues
```javascript
// Test connection in mongosh
db.adminCommand({ ping: 1 })
```

### Check Database Size
```javascript
db.stats(1024*1024) // Size in MB
```

### Find Slow Queries
```javascript
db.setProfilingLevel(2) // Enable profiling
db.system.profile.find().sort({ ts: -1 }).limit(10) // View slow queries
```

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI tool

