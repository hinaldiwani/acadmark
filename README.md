# 📚 AcadMark - Smart Attendance Management System

> Modern, web-based attendance tracking system for educational institutions

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen.svg)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.x-red.svg)](https://mongoosejs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 👨‍💼 Admin Dashboard

- **Import Management**: Bulk import teachers and students via CSV
- **Analytics**: Real-time statistics and insights
- **Activity Logs**: Track all system activities
- **Data Export**: Download templates and reports

### 👨‍🏫 Teacher Portal

- **Session Management**: Start, manage, and end attendance sessions
- **Real-time Marking**: Mark students present/absent with live updates
- **Manual Override**: Manually adjust attendance records
- **Excel Export**: Download attendance reports per session
- **Stream/Division Filtering**: Automatically loads mapped students

### 👨‍🎓 Student Portal

- **Attendance History**: View all attendance records
- **Statistics Dashboard**: Track attendance percentage
- **Monthly Summary**: Month-wise attendance breakdown
- **Subject-wise Analysis**: Performance per subject

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x or higher
- MongoDB 6.x or higher (or MongoDB Atlas account)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/acadmark-attendance.git
   cd acadmark-attendance
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up MongoDB**

   **Option A: Local MongoDB**
   - Install MongoDB: https://www.mongodb.com/try/download/community
   - Start MongoDB service: `mongod`

   **Option B: MongoDB Atlas (Cloud)**
   - Create free account at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get connection string

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB configuration
   ```

   Example `.env`:
   ```env
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/acadmark_attendance

   # For MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acadmark_attendance

   PORT=3000
   SESSION_SECRET=your_secret_here
   ADMIN_USER=admin@acadmark
   ADMIN_PASSWORD=admin123
   ```

5. **Start the application**

   ```bash
   npm start
   # Or for development with auto-reload
   npm run dev
   ```

   The server will start at http://localhost:3000

6. **Access the application**
   - Open browser: `http://localhost:3000`
   - Login as admin (default: `admin@acadmark` / `admin123`)

---

## 🔄 Migration from MySQL

If you're migrating from the MySQL version, see [MONGODB_MIGRATION.md](MONGODB_MIGRATION.md) for detailed instructions.

---

## 📖 Usage

### Admin Tasks

1. **Import Teachers**

   - Download template from admin dashboard
   - Fill in teacher details
   - Upload CSV/Excel file

2. **Import Students**
   - Download template from admin dashboard
   - Fill in student details
   - Upload CSV/Excel file

### Teacher Workflow

1. **Start Session**

   - Select subject, stream, and division
   - Click "Start Attendance"
   - Students are auto-loaded based on mapping

2. **Mark Attendance**

   - Toggle Present/Absent for each student
   - Use Manual Override if needed

3. **End Session**
   - Click "End Session"
   - Download Excel report

### Student Access

1. **View Dashboard**
   - Login with student ID
   - View attendance statistics
   - Check recent attendance records

---

## 🗂️ Project Structure

```
acadmark/
├── config/
│   └── db.js                 # Database configuration
├── public/
│   ├── css/
│   │   └── style.css        # Application styles
│   ├── js/
│   │   ├── main.js          # Shared utilities
│   │   ├── login.js         # Login page logic
│   │   ├── admin.js         # Admin dashboard logic
│   │   ├── teacher.js       # Teacher dashboard logic
│   │   └── student.js       # Student dashboard logic
│   └── templates/           # CSV templates
├── src/
│   ├── controllers/         # Route handlers
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── teacherController.js
│   │   └── studentController.js
│   ├── services/            # Business logic
│   │   ├── adminService.js
│   │   └── attendanceService.js
│   ├── models/              # Mongoose models (MongoDB schemas)
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── TeacherStudentMap.js
│   │   ├── AttendanceSession.js
│   │   ├── AttendanceRecord.js
│   │   └── ActivityLog.js
│   ├── middlewares/         # Express middlewares
│   │   └── authMiddleware.js
│   ├── routes/              # Route definitions
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── teacherRoutes.js
│   │   └── studentRoutes.js
│   └── app.js              # Express app setup
├── views/                   # HTML templates
│   ├── login.html
│   ├── admin.html
│   ├── teacher.html
│   └── student.html
├── uploads/                 # File uploads directory
├── .env                     # Environment variables
├── MONGODB_MIGRATION.md     # MongoDB migration guide
├── server.js               # Application entry point
└── package.json            # Dependencies
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/acadmark_attendance
# Or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acadmark_attendance

# Alternative: Individual Parameters
DB_HOST=localhost
DB_PORT=27017
DB_NAME=acadmark_attendance

# Session Configuration
SESSION_SECRET=your-super-secret-random-string

# Admin Credentials
ADMIN_USER=admin@acadmark
ADMIN_PASSWORD=admin123

# Campus Location (for geolocation features)
CAMPUS_LATITUDE=19.0760
CAMPUS_LONGITUDE=72.8777
CAMPUS_RADIUS_METERS=500
```

---

## 🗄️ Database Schema

The application uses 9 main tables:

1. **admin_details_db** - Admin user accounts
2. **teacher_details_db** - Teacher information
3. **student_details_db** - Student information
4. **teacher_student_map** - Teacher-student mappings
5. **attendance_sessions** - Active attendance sessions
6. **attendance_records** - Session attendance records
7. **attendance_monthly_aggregate** - Monthly attendance data
8. **attendance_backup_aggregate** - Historical attendance backup
9. **activity_logs** - System activity tracking

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:

- Render (Free)
- Railway
- Heroku
- VPS (DigitalOcean, AWS, etc.)

---

## 🔒 Security Features

- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Secure cookie handling
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CSRF token support (recommended for production)

---

## 🧪 Testing

Run the automated test suite:

```bash
node test_app.js
```

Manual testing checklist available in `TESTING_REPORT.md`

---

## 📊 Features Roadmap

- [ ] Email notifications
- [ ] SMS integration for attendance alerts
- [ ] Mobile app (React Native)
- [ ] Biometric integration
- [ ] QR code attendance
- [ ] Parent portal
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Mohammed Sirajuddin Khan** - Initial work

---

## 🙏 Acknowledgments

- Express.js for the web framework
- MySQL for the database
- Inter font for typography
- All contributors who helped test and improve the system

---

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Email: sirajuddinkhan7718@gmail.com

---

## 📸 Screenshots

### Login Page

Clean, modern login interface for all user roles.

### Admin Dashboard

Comprehensive admin panel with import/export features.

### Teacher Dashboard

Intuitive session management and attendance marking.

### Student Portal

Simple, clear attendance history and statistics.

---

**Made with ❤️ by Sirajuddin Khan for educational institutions**
