# Attendance Sheets for Defaulter Testing (2022-2024)

## Overview
This folder contains **272 attendance Excel sheets** generated for defaulter system testing, covering 36 months from **January 2022 to December 2024**.

## File Structure

### Files Generated
- **Total Files**: 272 Excel sheets
- **Year 2022**: 88 files (11 months × 8 subjects)
- **Year 2023**: 96 files (12 months × 8 subjects)
- **Year 2024**: 88 files (11 months × 8 subjects)

### Naming Convention
```
Attendance_{STREAM}_{SUBJECT}_{MONTH}_{YEAR}.xlsx
```
Example: `Attendance_BSCIT_Database_Management_Systems_January_2022.xlsx`

## Data Details

### Streams Covered
1. **BSCIT** (Bachelor of Science in Information Technology)
2. **BSCDS** (Bachelor of Science in Data Science)

### Subjects per Stream

#### BSCIT Subjects
1. Database Management Systems (Dr. Meena Shah - TCH001)
2. Web Development (Prof. Ramesh Iyer - TCH002)
3. Operating Systems (Prof. Sneha Patel - TCH003)
4. Computer Networks (Prof. Karan Verma - TCH004)

#### BSCDS Subjects
1. AI Fundamentals (Prof. Amit Trivedi - TCH008)
2. Machine Learning (Prof. Kavita Joshi - TCH009)
3. Statistics for Data Science (Dr. Suresh Nair - TCH010)
4. Big Data Analytics (Prof. Rutuja Gokhale - TCH011)

### Students Included
- **BSCIT Division A**: 10 students (STU001-STU010)
- **BSCIT Division B**: 5 students (STU011-STU015)
- **BSCDS Division A**: 5 students (STU021-STU025)
- **BSCDS Division B**: 5 students (STU031-STU035)
- **Total**: 25 students

### Excel Sheet Columns
Each sheet contains the following columns:
1. **Student ID** - Unique student identifier
2. **Name** - Student full name
3. **Roll No** - Roll number
4. **Year** - Academic year (FY/SY/TY)
5. **Stream** - Course stream (BSCIT/BSCDS)
6. **Division** - Class division (A/B)
7. **Subject** - Subject name
8. **Teacher ID** - Teacher identifier
9. **Teacher Name** - Teacher full name
10. **Month** - Month number (1-12)
11. **Year** - Calendar year (2022-2024)
12. **Classes Held** - Total classes conducted (15-22 per month)
13. **Classes Attended** - Classes attended by student
14. **Classes Missed** - Classes missed by student
15. **Attendance Percentage** - Calculated percentage
16. **Status** - "Defaulter" (<75%) or "Regular" (≥75%)

## Student Attendance Profiles

### High Risk Defaulters (Below 60% Average)
- **STU005** (Arjun Iyer) - ~55% attendance
- **STU009** (Ritvik Ghosh) - ~60% attendance
- **STU013** (Rudra Shah) - ~58% attendance
- **STU024** (Atharv Gade) - ~52% attendance

### Moderate Risk (60-75% Range)
- **STU003** (Reyansh Mehta) - ~65% attendance
- **STU012** (Kaira Bhat) - ~68% attendance
- **STU022** (Samar Wagh) - ~64% attendance
- **STU033** (Shivani Jaiswal) - ~62% attendance

### Regular Students (Above 75%)
- Multiple students with 75-95% attendance rates
- Good attendance consistency across months

## Testing the Defaulter System

### Import Process
1. Ensure the database tables are set up (run `monthly_attendance_setup.sql`)
2. Import student and teacher data first
3. Use the generated Excel sheets to simulate attendance marking
4. The system will automatically update `monthly_attendance_summary` table

### Test Scenarios

#### 1. Monthly Defaulter List
- Select any month from 2022-2024
- Set threshold to 75%
- Expected: Students with <75% for that month appear

#### 2. Year-wise Analysis
- Filter by year (FY)
- Compare defaulters across all months of 2022, 2023, 2024

#### 3. Stream-wise Testing
- Test BSCIT stream separately
- Test BSCDS stream separately
- Verify subject-specific defaulters

#### 4. Division-wise Testing
- Test Division A and Division B separately
- Verify roll number ordering

#### 5. Multi-filter Combination
- Example: BSCIT + Division A + January 2023 + 75% threshold
- Should show specific defaulters for that combination

### Expected Defaulter Counts

Based on attendance rates, you should typically see:
- **4-6 defaulters** per subject per month (below 75% threshold)
- **Higher in certain months** due to random variation
- **Consistent defaulters** across multiple months

## How to Use These Files

### For Manual Testing
1. Open any Excel sheet
2. Review the attendance percentages
3. Verify Status column marks correctly (<75% = Defaulter)
4. Check data completeness

### For System Import
1. Upload sheets through the admin/teacher interface
2. Let the system process and aggregate data
3. Run defaulter reports with various filters
4. Export and verify Excel output

### For Database Direct Insert
If you want to insert this data directly into the database, you'll need to:
1. Read Excel files using a script
2. Insert into `monthly_attendance_summary` table
3. Trigger the `update_monthly_attendance()` procedure
4. Verify `student_attendance_stats` is updated

## Verification Queries

After importing data, run these queries:

```sql
-- Check total records
SELECT COUNT(*) FROM monthly_attendance_summary;

-- Check defaulters for a specific month
SELECT * FROM monthly_attendance_summary 
WHERE month = 1 AND year = 2022 AND attendance_percentage < 75;

-- Count defaulters by stream
SELECT stream, COUNT(*) as defaulter_count 
FROM monthly_attendance_summary 
WHERE attendance_percentage < 75 
GROUP BY stream;

-- Find consistent defaulters (appears in 3+ months)
SELECT student_id, COUNT(*) as months_defaulted 
FROM monthly_attendance_summary 
WHERE attendance_percentage < 75 
GROUP BY student_id 
HAVING COUNT(*) >= 3;
```

## Notes

- Attendance percentages have realistic variation (±10% from base rate)
- Classes held per month varies between 15-22 (realistic range)
- Some students are intentionally given low attendance for testing
- Data is consistent across all 36 months
- Each file is independent and can be tested separately

## Generation Details

- **Generated by**: `generate_attendance_sheets.py`
- **Date**: February 2026
- **Python Libraries**: pandas, openpyxl
- **Format**: .xlsx (Excel 2007+)

## File Size
- Average file size: ~12-15 KB per file
- Total folder size: ~3-4 MB

## Support
For issues or questions about these test files, check:
- Main README.md
- DEFAULTER_SYSTEM_README.md
- DEFAULTER_FIX_README.md
