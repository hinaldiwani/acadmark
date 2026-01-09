# Defaulter List Generation with Custom Threshold - Usage Guide

## ✨ New Feature: Custom Attendance Threshold

Both **Admin** and **Teacher** dashboards now support generating defaulter lists with a **custom attendance threshold**.

---

## 📋 API Endpoints

### Admin Endpoints

#### 1. Get Defaulter List
```
GET /api/admin/defaulters?threshold=70&month=1&year=2026
```

**Parameters:**
- `threshold` (optional, default: 75) - Minimum attendance percentage (students below this are defaulters)
- `month` (optional) - Filter by month (1-12)
- `year` (optional) - Filter by year
- `stream` (optional) - Filter by stream
- `division` (optional) - Filter by division
- `subject` (optional) - Filter by subject
- `type` (optional, default: 'monthly') - 'monthly' or 'overall'

**Response:**
```json
{
  "defaulters": [
    {
      "student_id": "STU001",
      "student_name": "John Doe",
      "roll_no": "101",
      "year": "2",
      "stream": "CS",
      "division": "A",
      "subject": "Mathematics",
      "attendance_percentage": 68.5,
      "total_lectures": 40,
      "attended_lectures": 27
    }
  ],
  "count": 1,
  "threshold": 70
}
```

#### 2. Download Defaulter List as Excel
```
GET /api/admin/defaulters/download?threshold=80&month=1&year=2026
```

**Same parameters as above**

**Response:** Excel file download with filename format:
```
Defaulter_List_80%_January_2026_1736427845123.xlsx
```

---

### Teacher Endpoints

#### 1. Get Defaulter List
```
GET /api/teacher/defaulters?threshold=70&month=1
```

**Parameters:**
- `threshold` (optional, default: 75) - Minimum attendance percentage
- `month` (optional) - Filter by month (1-12)
- `year` (optional) - Filter by year
- `type` (optional, default: 'monthly') - 'monthly' or 'overall'

**Note:** Teacher endpoints automatically filter by the teacher's assigned stream and subject.

#### 2. Download Defaulter List as Excel
```
GET /api/teacher/defaulters/download?threshold=65
```

---

## 🖥️ Frontend Implementation Example

### Admin Dashboard - Generate Defaulter List Button

```html
<!-- Add this button to admin dashboard -->
<button onclick="generateDefaulterList()">📊 Generate Defaulter List</button>

<script>
async function generateDefaulterList() {
  // Ask user for threshold
  const threshold = prompt("Enter minimum attendance percentage (0-100):", "75");
  
  if (!threshold || threshold < 0 || threshold > 100) {
    alert("Please enter a valid percentage between 0 and 100");
    return;
  }

  // Optional: Ask for month
  const month = prompt("Enter month (1-12, or leave blank for all months):", "");
  const year = prompt("Enter year (or leave blank for current year):", new Date().getFullYear());

  // Build query parameters
  const params = new URLSearchParams({
    threshold: threshold,
    type: 'monthly'
  });
  
  if (month) params.append('month', month);
  if (year) params.append('year', year);

  try {
    // Download the Excel file
    const response = await fetch(`/api/admin/defaulters/download?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to generate defaulter list');
      return;
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Defaulter_List_${threshold}%_${month || 'All'}_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert(`✅ Defaulter list generated successfully!\nThreshold: ${threshold}%\nTotal defaulters: Check the downloaded file`);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate defaulter list. Please try again.');
  }
}
</script>
```

### Teacher Dashboard - Generate Defaulter List Button

```html
<!-- Add this button to teacher dashboard -->
<button onclick="generateTeacherDefaulterList()">📊 Generate My Defaulter List</button>

<script>
async function generateTeacherDefaulterList() {
  // Ask user for threshold
  const threshold = prompt("Enter minimum attendance percentage (0-100):", "75");
  
  if (!threshold || threshold < 0 || threshold > 100) {
    alert("Please enter a valid percentage between 0 and 100");
    return;
  }

  const month = prompt("Enter month (1-12, or leave blank for all months):", "");

  const params = new URLSearchParams({
    threshold: threshold,
    type: 'monthly'
  });
  
  if (month) params.append('month', month);

  try {
    const response = await fetch(`/api/teacher/defaulters/download?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to generate defaulter list');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `My_Defaulter_List_${threshold}%_${month || 'All'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert(`✅ Defaulter list generated successfully!\nThreshold: ${threshold}%`);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate defaulter list.');
  }
}
</script>
```

---

## 📊 Excel File Format

The generated Excel file includes:

### Header
- **Title Row:** "Defaulter List - Students with Attendance Below XX%"
  - Merged across all columns
  - Bold, centered, larger font

### Data Columns
1. Student ID
2. Name
3. Roll No
4. Year
5. Stream
6. Division
7. Subject
8. Month (for monthly reports)
9. Year (for monthly reports)
10. Total Lectures
11. Attended Lectures
12. Attendance %

### Styling
- Header row with gray background
- Bold headers
- Auto-fit column widths
- Professional formatting

---

## 🎯 Use Cases

### Example 1: Find students below 75% (standard)
```javascript
GET /api/admin/defaulters/download?threshold=75
```

### Example 2: Find students below 80% for January 2026
```javascript
GET /api/admin/defaulters/download?threshold=80&month=1&year=2026
```

### Example 3: Find CS stream students below 70%
```javascript
GET /api/admin/defaulters/download?threshold=70&stream=CS
```

### Example 4: Overall defaulters (all months) below 65%
```javascript
GET /api/admin/defaulters/download?threshold=65&type=overall
```

---

## 🔧 Testing the Feature

### Using cURL:

```bash
# Test admin endpoint
curl -X GET "http://localhost:3000/api/admin/defaulters?threshold=70&month=1&year=2026" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Download Excel file
curl -X GET "http://localhost:3000/api/admin/defaulters/download?threshold=80" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  --output defaulters.xlsx
```

### Using Browser Console:

```javascript
// Get defaulter list data
fetch('/api/admin/defaulters?threshold=70&month=1&year=2026')
  .then(res => res.json())
  .then(data => console.log(data));

// Download Excel file
window.open('/api/admin/defaulters/download?threshold=75');
```

---

## 📝 Notes

- **Default threshold:** 75% (if not specified)
- **Valid range:** 0-100
- **File naming:** Includes threshold in filename for easy identification
- **Activity logging:** All downloads are logged in the activity_logs table
- **History tracking:** Defaulter list generations are saved in defaulter_history table
- **Permissions:** 
  - Admin: Can see all students
  - Teacher: Only sees their assigned stream/subject students

---

## 🚀 Quick Start

1. **Login as Admin or Teacher**
2. **Navigate to Dashboard**
3. **Click "Generate Defaulter List" button**
4. **Enter desired threshold** (e.g., 75)
5. **Optional: Enter month and year filters**
6. **Click OK to generate and download Excel file**

The Excel file will be downloaded automatically with all students whose attendance is below the specified threshold!
