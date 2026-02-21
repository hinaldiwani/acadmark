# 🚀 Complete Heroku Deployment Guide for AcadMark

This guide will walk you through deploying your AcadMark Attendance System to Heroku step-by-step. Follow each section carefully!

---

## 📋 Prerequisites

Before you start, make sure you have:

1. ✅ A **Heroku account** (sign up at https://signup.heroku.com/)
2. ✅ **Git** installed on your computer (download from https://git-scm.com/)
3. ✅ **Heroku CLI** installed (download from https://devcenter.heroku.com/articles/heroku-cli)
4. ✅ **GitHub Student Developer Pack** (optional, for free credits)

---

## 🎓 Step 1: Get Heroku Credits (GitHub Student Pack)

If you're a student, you can get **$13/month for 24 months** free!

1. Go to https://education.github.com/pack
2. Click "Get your Pack"
3. Verify your student status (use your college email)
4. Once approved, find "Heroku" in the pack
5. Click "Get access by connecting your GitHub account to Heroku"
6. Credits will be automatically applied to your account

> **Note:** Even without student credits, you can deploy but you'll need to add a payment method.

---

## 🛠️ Step 2: Install Heroku CLI

### For Windows:

1. Download the installer from: https://devcenter.heroku.com/articles/heroku-cli
2. Run the installer (64-bit recommended)
3. Open **PowerShell** and verify installation:
   ```powershell
   heroku --version
   ```

### For Mac:

```bash
brew tap heroku/brew && brew install heroku
```

### For Linux:

```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

---

## 🔐 Step 3: Login to Heroku

Open your terminal (PowerShell/Command Prompt) and run:

```powershell
heroku login
```

- This will open your browser
- Click "Log in" to authenticate
- Return to your terminal

---

## 📁 Step 4: Prepare Your Project

### 4.1 Initialize Git Repository (if not already done)

```powershell
cd "c:\COLLEGE CONTRO NKT CODING CLUB\MarkIn"
git init
git add .
git commit -m "Initial commit for Heroku deployment"
```

### 4.2 Create a Procfile

The Procfile tells Heroku how to run your app. It should already exist, but verify:

Create a file named `Procfile` (no extension) in your project root with:

```
web: node server.js
```

> **Important:** The file must be named exactly `Procfile` with a capital P and no file extension!

---

## 🌐 Step 5: Create Heroku App

Run this command to create a new Heroku app:

```powershell
heroku create acadmark-attendance
```

> **Note:** Replace `acadmark-attendance` with your preferred app name. It must be unique across all Heroku apps. If taken, try adding your name or a number.

Your app URL will be: `https://acadmark-attendance.herokuapp.com`

---

## 🗄️ Step 6: Add MySQL Database to Heroku

Heroku doesn't include a database by default. We need to add **JawsDB MySQL** or **ClearDB MySQL**.

### Option A: JawsDB MySQL (Recommended - Better Free Tier)

```powershell
heroku addons:create jawsdb:kitefin
```

The **kitefin plan** is free and includes:

- 5 MB storage
- 10 connections
- Good for testing/small projects

### Option B: ClearDB MySQL (Alternative)

```powershell
heroku addons:create cleardb:ignite
```

> **Important:** After adding the database, Heroku automatically sets the `JAWSDB_URL` or `CLEARDB_DATABASE_URL` environment variable.

---

## 🔧 Step 7: Configure Environment Variables

You need to set all your `.env` variables on Heroku.

### 7.1 Get Your Database URL

```powershell
heroku config:get JAWSDB_URL
```

This will return something like:

```
mysql://username:password@hostname:3306/database_name
```

### 7.2 Extract Database Credentials

From the URL above, extract:

- **DB_HOST**: The hostname (e.g., `abc123.jawsdb.com`)
- **DB_USER**: The username
- **DB_PASSWORD**: The password
- **DB_NAME**: The database name
- **DB_PORT**: `3306` (default MySQL port)

### 7.3 Set All Environment Variables

Run these commands one by one:

```powershell
# Database Configuration (replace with YOUR values from JAWSDB_URL)
heroku config:set DB_HOST=your-jawsdb-hostname
heroku config:set DB_USER=your-jawsdb-username
heroku config:set DB_PASSWORD=your-jawsdb-password
heroku config:set DB_NAME=your-jawsdb-database
heroku config:set DB_PORT=3306

# Session Secret (CHANGE THIS to a random string!)
heroku config:set SESSION_SECRET="your-super-secret-random-string-here-change-this"

# Admin Credentials (CHANGE THESE for security!)
heroku config:set ADMIN_USER=admin@markin
heroku config:set ADMIN_PASSWORD=YourSecurePassword123

# Node Environment
heroku config:set NODE_ENV=production
```

### 7.4 Verify All Variables Are Set

```powershell
heroku config
```

You should see all 8 environment variables listed.

---

## 🗃️ Step 8: Initialize Database Tables

After deploying, you need to create the database tables. We'll use Heroku's MySQL client.

### 8.1 Connect to Database

```powershell
heroku config:get JAWSDB_URL
```

Copy the entire URL, then:

```powershell
# For JawsDB
mysql -h your-hostname -u your-username -p your-database-name
```

When prompted, enter your password.

### 8.2 Run Database Setup Script

Once connected to MySQL:

```sql
-- Copy and paste the contents of database_setup.sql
-- OR upload the file and run:
source database_setup.sql;
```

Alternative method using Heroku CLI:

```powershell
# On Windows PowerShell
Get-Content database_setup.sql | heroku run bash -c "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME"
```

---

## 🚀 Step 9: Deploy Your Application

### 9.1 Push Code to Heroku

```powershell
git add .
git commit -m "Ready for Heroku deployment"
git push heroku main
```

> **Note:** If your branch is named `master`, use `git push heroku master`

### 9.2 Watch the Build Process

Heroku will:

1. ✅ Detect Node.js
2. ✅ Install dependencies from `package.json`
3. ✅ Build your app
4. ✅ Start the server

Look for this message:

```
remote: -----> Launching...
remote:        Released v1
remote:        https://your-app-name.herokuapp.com/ deployed to Heroku
```

---

## ✅ Step 10: Open Your Application

```powershell
heroku open
```

This will open your app in the browser at `https://your-app-name.herokuapp.com`

---

## 🔍 Step 11: Verify Deployment

### 11.1 Check Application Logs

```powershell
heroku logs --tail
```

Look for:

```
✅ Connected to MySQL database
✅ Database already initialized (13 tables found)
🚀 AcadMark server running at http://localhost:PORT
```

### 11.2 Test Login

1. Go to your app URL
2. Click "Admin Login"
3. Use the credentials you set in Step 7.3
4. You should see the Admin Dashboard

---

## 🎯 Step 12: Import Student & Teacher Data

1. Login as Admin
2. Go to "Import Data"
3. Download the template files
4. Fill in your student/teacher data
5. Upload and confirm import

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Application Error" Page

**Solution:** Check logs for errors

```powershell
heroku logs --tail
```

Common causes:

- Database not initialized
- Missing environment variables
- Port configuration issue

### Issue 2: Database Connection Failed

**Solution:** Verify database variables

```powershell
heroku config
```

Make sure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` are all set correctly.

### Issue 3: "Cannot find module" Error

**Solution:** Rebuild dependencies

```powershell
heroku run npm install
heroku restart
```

### Issue 4: App Crashes Immediately

**Solution:** Check if `Procfile` is correct

```powershell
cat Procfile
# Should show: web: node server.js
```

### Issue 5: Database Tables Not Created

**Solution:** Manually run the init script

```powershell
heroku run bash
# Inside the dyno:
node init-db.js
```

### Issue 6: Port Already in Use (EADDRINUSE)

**Solution:** This shouldn't happen on Heroku, but ensure your `server.js` uses:

```javascript
const PORT = process.env.PORT || 3000;
```

---

## 📊 Step 13: Monitor Your Application

### View App Metrics

```powershell
heroku metrics
```

### View Dyno Status

```powershell
heroku ps
```

### Restart Application

```powershell
heroku restart
```

### Scale Dynos (if needed)

```powershell
# Check current dynos
heroku ps

# Scale to 1 web dyno (free tier)
heroku ps:scale web=1
```

---

## 💰 Cost Management

### Free Tier Includes:

- 550-1000 free dyno hours/month
- 5 MB database storage (JawsDB Kitefin)
- Custom domain support

### With Student Pack:

- $13/month credit for 24 months
- Can upgrade to Hobby dyno ($7/month)
- More database storage

### Tips to Stay Free:

1. Use JawsDB Kitefin plan (free forever)
2. Don't exceed 1000 dyno hours/month
3. App sleeps after 30 min inactivity (free tier)
4. First request after sleep takes ~10 seconds

---

## 🔒 Security Best Practices

### 1. Change Default Credentials

```powershell
heroku config:set ADMIN_USER=your-secure-username
heroku config:set ADMIN_PASSWORD=YourVerySecurePassword123!
```

### 2. Use Strong Session Secret

```powershell
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
```

### 3. Enable HTTPS Only

Already enabled by default on Heroku!

### 4. Limit Database Access

JawsDB/ClearDB are only accessible from your Heroku app by default.

---

## 📱 Step 14: Add Custom Domain (Optional)

If you have a custom domain:

```powershell
heroku domains:add www.your-domain.com
```

Then update your DNS settings as instructed.

---

## 🔄 Updating Your Application

Whenever you make changes:

```powershell
git add .
git commit -m "Description of changes"
git push heroku main
```

Heroku automatically redeploys your app!

---

## 📞 Get Help

### Heroku Support

- Documentation: https://devcenter.heroku.com/
- Support: https://help.heroku.com/

### Application Logs

```powershell
heroku logs --tail
```

### Database Shell

```powershell
heroku run bash
```

### Restart App

```powershell
heroku restart
```

---

## ✨ Deployment Checklist

Before going live, ensure:

- [x] All environment variables are set
- [x] Database tables are created
- [x] Admin credentials are changed from defaults
- [x] Test login works
- [x] Import student/teacher data
- [x] Test attendance marking flow
- [x] Check logs for errors
- [x] Monitor dyno usage

---

## 🎉 You're Done!

Your AcadMark Attendance System is now live on Heroku!

**Your app URL:** `https://your-app-name.herokuapp.com`

Share this URL with teachers and students to start using the system.

---

## 💡 Quick Commands Reference

```powershell
# Login to Heroku
heroku login

# Create app
heroku create app-name

# Add database
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set KEY=VALUE

# View all config
heroku config

# Deploy
git push heroku main

# Open app
heroku open

# View logs
heroku logs --tail

# Restart app
heroku restart

# Run commands on Heroku
heroku run bash

# Scale dynos
heroku ps:scale web=1
```

---

**Need help?** Check the logs first with `heroku logs --tail` - most issues show clear error messages there!

Good luck with your deployment! 🚀
