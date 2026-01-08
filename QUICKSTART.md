# 🚀 Quick Start Guide - AcadMark with MongoDB

Get up and running with AcadMark in 5 minutes!

## Prerequisites ✅

- **Node.js** 22.x or higher → [Download](https://nodejs.org/)
- **MongoDB** 6.x or higher → [Download](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free)

## Setup Steps

### 1️⃣ Install and Setup

**Windows (PowerShell):**
```powershell
# Run the setup script
.\setup.ps1
```

**Linux/Mac:**
```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

**Or manually:**
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2️⃣ Configure MongoDB

Edit `.env` file:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/acadmark_attendance
```

**For MongoDB Atlas (Cloud - Free tier available):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acadmark_attendance?retryWrites=true&w=majority
```

### 3️⃣ Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- No need to start - it's always running in the cloud!

### 4️⃣ Start Application

```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 AcadMark server running at http://localhost:3000
```

### 5️⃣ Login

Open browser: **http://localhost:3000**

**Admin Login (Default):**
- Username: `admin@acadmark`
- Password: `admin123`

⚠️ **Change these credentials in production!**

## First Time Setup

### Import Students

1. Go to Admin Dashboard
2. Click **"Students"** tab
3. Click **"Download Template"** to get Excel template
4. Fill in student details:
   - Student_ID
   - Name
   - Roll_No
   - Year
   - Stream
   - Division
5. Upload the filled Excel file
6. Click **"Confirm Import"**

### Import Teachers

1. Go to Admin Dashboard
2. Click **"Teachers"** tab
3. Click **"Download Template"** to get Excel template
4. Fill in teacher details:
   - Teacher_ID
   - Name
   - Subject
   - Year
   - Stream
5. Upload the filled Excel file
6. Click **"Confirm Import"**

### Map Teachers to Students

1. In Admin Dashboard, go to **"Mappings"** tab
2. Select Teacher and Students to map
3. Click **"Confirm Mapping"**

## Testing the System

### As Teacher

1. **Logout** from admin
2. **Login** as teacher using Teacher_ID (no password needed)
3. **Start Attendance Session**:
   - Select Subject, Year, Stream, Division
   - Click "Start Attendance"
4. **Mark Attendance**:
   - Toggle Present/Absent for each student
   - Click "End Attendance"
5. **Download Report**:
   - Click "Export to Excel"

### As Student

1. **Logout** from teacher
2. **Login** as student using Student_ID (no password needed)
3. **View Dashboard**:
   - See attendance statistics
   - View attendance history
   - Check subject-wise breakdown

## 📁 Sample Data

Want to test quickly? Here's sample data you can import:

### Sample Students (students.csv)
```csv
Student_ID,Name,Roll_No,Year,Stream,Division
S001,John Doe,101,3,Computer Science,A
S002,Jane Smith,102,3,Computer Science,A
S003,Mike Johnson,103,3,Computer Science,A
S004,Sarah Williams,104,3,Computer Science,B
S005,Tom Brown,105,3,Computer Science,B
```

### Sample Teachers (teachers.csv)
```csv
Teacher_ID,Name,Subject,Year,Stream
T001,Prof. Alice Johnson,Database Management,3,Computer Science
T002,Prof. Bob Wilson,Web Development,3,Computer Science
T003,Prof. Carol Davis,Data Structures,2,Computer Science
```

## Common Issues & Solutions

### ❌ Cannot connect to MongoDB

**Problem:** Application shows "Unable to connect to MongoDB"

**Solutions:**
1. **Local MongoDB**: Make sure MongoDB is running (`mongod`)
2. **Check connection string** in `.env` file
3. **MongoDB Atlas**: Verify your IP is whitelisted in Atlas dashboard

### ❌ Port already in use

**Problem:** "Port 3000 is already in use"

**Solution:** Change port in `.env`:
```env
PORT=3001
```

### ❌ Login not working

**Problem:** Cannot login with admin credentials

**Solution:**
1. Check `.env` file for correct admin credentials
2. Default is `admin@acadmark` / `admin123`
3. Make sure there are no extra spaces

### ❌ Import fails

**Problem:** CSV/Excel import shows error

**Solution:**
1. Download fresh template from admin panel
2. Don't change column headers
3. Ensure all required fields are filled
4. Check for special characters in data

## Environment Variables Explained

```env
# MongoDB connection string (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/acadmark_attendance

# Server port (default: 3000)
PORT=3000

# Session secret for security (change in production!)
SESSION_SECRET=your-secret-key-here

# Admin login credentials
ADMIN_USER=admin@acadmark
ADMIN_PASSWORD=admin123

# Campus location for geolocation-based attendance (optional)
CAMPUS_LATITUDE=19.0760
CAMPUS_LONGITUDE=72.8777
CAMPUS_RADIUS_METERS=500
```

## MongoDB Atlas Quick Setup

Want to use cloud MongoDB? Follow these steps:

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: Click "Build a Database" → Choose FREE tier
3. **Create User**: Set username and password
4. **Whitelist IP**: Add `0.0.0.0/0` (allows all IPs - for testing only!)
5. **Get Connection String**: Click "Connect" → "Connect your application"
6. **Update .env**: Paste connection string in `MONGODB_URI`

## Development vs Production

### Development
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/acadmark_attendance
SESSION_SECRET=dev_secret_123
```

### Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/acadmark_attendance
SESSION_SECRET=very_long_random_secure_string_here
ADMIN_PASSWORD=strong_secure_password_here
```

## Next Steps

- ✅ Application running? Great!
- 📚 Learn MongoDB queries: [MONGODB_REFERENCE.md](MONGODB_REFERENCE.md)
- 🔧 Need help migrating data? [MONGODB_MIGRATION.md](MONGODB_MIGRATION.md)
- 📖 Full documentation: [README.md](README.md)

## Useful Commands

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Check MongoDB status
mongosh
> show dbs

# View MongoDB data (using Compass GUI)
# Download: https://www.mongodb.com/products/compass
```

## Getting Help

- 📚 Check [README.md](README.md) for detailed docs
- 🔍 Review [MONGODB_REFERENCE.md](MONGODB_REFERENCE.md) for queries
- 🐛 Found a bug? Check troubleshooting section above
- 💬 Need more help? Check MongoDB documentation

## Success! 🎉

You're all set! Here's what you can do now:

1. ✅ Import your students and teachers
2. ✅ Create attendance sessions
3. ✅ Mark attendance
4. ✅ Generate reports
5. ✅ Monitor statistics

**Happy tracking attendance! 📊**
