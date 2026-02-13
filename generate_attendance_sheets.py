"""
Generate 36 attendance Excel sheets (Jan 2022 - Dec 2024) for defaulter testing
Each sheet contains student attendance data with varied attendance patterns
"""

import pandas as pd
from datetime import datetime, timedelta
import random
import os

# Sample students data with varied attendance patterns
students_data = [
    {'student_id': 'STU001', 'name': 'Aarav Patel', 'roll_no': '1', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.85},
    {'student_id': 'STU002', 'name': 'Ananya Sharma', 'roll_no': '2', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.92},
    {'student_id': 'STU003', 'name': 'Reyansh Mehta', 'roll_no': '3', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.65},
    {'student_id': 'STU004', 'name': 'Siya Menon', 'roll_no': '4', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.78},
    {'student_id': 'STU005', 'name': 'Arjun Iyer', 'roll_no': '5', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.55},
    {'student_id': 'STU006', 'name': 'Aadhya Deshmukh', 'roll_no': '6', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.88},
    {'student_id': 'STU007', 'name': 'Kabir Reddy', 'roll_no': '7', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.95},
    {'student_id': 'STU008', 'name': 'Saanvi Jain', 'roll_no': '8', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.72},
    {'student_id': 'STU009', 'name': 'Ritvik Ghosh', 'roll_no': '9', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.60},
    {'student_id': 'STU010', 'name': 'Tanishka Das', 'roll_no': '10', 'year': 'FY', 'stream': 'BSCIT', 'division': 'A', 'attendance_rate': 0.82},
    {'student_id': 'STU011', 'name': 'Devansh Pillai', 'roll_no': '1', 'year': 'FY', 'stream': 'BSCIT', 'division': 'B', 'attendance_rate': 0.90},
    {'student_id': 'STU012', 'name': 'Kaira Bhat', 'roll_no': '2', 'year': 'FY', 'stream': 'BSCIT', 'division': 'B', 'attendance_rate': 0.68},
    {'student_id': 'STU013', 'name': 'Rudra Shah', 'roll_no': '3', 'year': 'FY', 'stream': 'BSCIT', 'division': 'B', 'attendance_rate': 0.58},
    {'student_id': 'STU014', 'name': 'Advika Patil', 'roll_no': '4', 'year': 'FY', 'stream': 'BSCIT', 'division': 'B', 'attendance_rate': 0.85},
    {'student_id': 'STU015', 'name': 'Krishna Chavan', 'roll_no': '5', 'year': 'FY', 'stream': 'BSCIT', 'division': 'B', 'attendance_rate': 0.93},
    {'student_id': 'STU021', 'name': 'Riya Tiwari', 'roll_no': '1', 'year': 'FY', 'stream': 'BSCDS', 'division': 'A', 'attendance_rate': 0.87},
    {'student_id': 'STU022', 'name': 'Samar Wagh', 'roll_no': '2', 'year': 'FY', 'stream': 'BSCDS', 'division': 'A', 'attendance_rate': 0.64},
    {'student_id': 'STU023', 'name': 'Esha Pawar', 'roll_no': '3', 'year': 'FY', 'stream': 'BSCDS', 'division': 'A', 'attendance_rate': 0.91},
    {'student_id': 'STU024', 'name': 'Atharv Gade', 'roll_no': '4', 'year': 'FY', 'stream': 'BSCDS', 'division': 'A', 'attendance_rate': 0.52},
    {'student_id': 'STU025', 'name': 'Riddhi Khatri', 'roll_no': '5', 'year': 'FY', 'stream': 'BSCDS', 'division': 'A', 'attendance_rate': 0.79},
    {'student_id': 'STU031', 'name': 'Rhea Banerjee', 'roll_no': '1', 'year': 'FY', 'stream': 'BSCDS', 'division': 'B', 'attendance_rate': 0.88},
    {'student_id': 'STU032', 'name': 'Aditya Tandon', 'roll_no': '2', 'year': 'FY', 'stream': 'BSCDS', 'division': 'B', 'attendance_rate': 0.70},
    {'student_id': 'STU033', 'name': 'Shivani Jaiswal', 'roll_no': '3', 'year': 'FY', 'stream': 'BSCDS', 'division': 'B', 'attendance_rate': 0.62},
    {'student_id': 'STU034', 'name': 'Yash Rane', 'roll_no': '4', 'year': 'FY', 'stream': 'BSCDS', 'division': 'B', 'attendance_rate': 0.94},
    {'student_id': 'STU035', 'name': 'Anvi Acharya', 'roll_no': '5', 'year': 'FY', 'stream': 'BSCDS', 'division': 'B', 'attendance_rate': 0.83},
]

# Subject and teacher mapping
subjects_mapping = {
    'BSCIT': [
        {'subject': 'Database Management Systems', 'teacher_id': 'TCH001', 'teacher_name': 'Dr. Meena Shah'},
        {'subject': 'Web Development', 'teacher_id': 'TCH002', 'teacher_name': 'Prof. Ramesh Iyer'},
        {'subject': 'Operating Systems', 'teacher_id': 'TCH003', 'teacher_name': 'Prof. Sneha Patel'},
        {'subject': 'Computer Networks', 'teacher_id': 'TCH004', 'teacher_name': 'Prof. Karan Verma'},
    ],
    'BSCDS': [
        {'subject': 'AI Fundamentals', 'teacher_id': 'TCH008', 'teacher_name': 'Prof. Amit Trivedi'},
        {'subject': 'Machine Learning', 'teacher_id': 'TCH009', 'teacher_name': 'Prof. Kavita Joshi'},
        {'subject': 'Statistics for Data Science', 'teacher_id': 'TCH010', 'teacher_name': 'Dr. Suresh Nair'},
        {'subject': 'Big Data Analytics', 'teacher_id': 'TCH011', 'teacher_name': 'Prof. Rutuja Gokhale'},
    ]
}

def generate_attendance_for_month(year, month, subject_info, stream):
    """Generate attendance sheet for a specific month"""
    
    # Filter students by stream
    stream_students = [s for s in students_data if s['stream'] == stream]
    
    # Number of classes in a month (15-22 working days)
    num_classes = random.randint(15, 22)
    
    attendance_records = []
    
    for student in stream_students:
        # Determine if student is present based on their attendance rate
        # Add some randomness
        base_rate = student['attendance_rate']
        monthly_rate = base_rate + random.uniform(-0.1, 0.1)
        monthly_rate = max(0.3, min(0.98, monthly_rate))  # Keep between 30% and 98%
        
        classes_attended = int(num_classes * monthly_rate)
        classes_missed = num_classes - classes_attended
        
        record = {
            'Student ID': student['student_id'],
            'Name': student['name'],
            'Roll No': student['roll_no'],
            'Year': student['year'],
            'Stream': student['stream'],
            'Division': student['division'],
            'Subject': subject_info['subject'],
            'Teacher ID': subject_info['teacher_id'],
            'Teacher Name': subject_info['teacher_name'],
            'Month': month,
            'Year': year,
            'Classes Held': num_classes,
            'Classes Attended': classes_attended,
            'Classes Missed': classes_missed,
            'Attendance Percentage': round((classes_attended / num_classes) * 100, 2),
            'Status': 'Defaulter' if (classes_attended / num_classes) < 0.75 else 'Regular'
        }
        attendance_records.append(record)
    
    return attendance_records

def create_excel_sheets():
    """Create 36 Excel sheets for Jan 2022 to Dec 2024"""
    
    output_dir = 'attendance_sheets_2022_2024'
    os.makedirs(output_dir, exist_ok=True)
    
    start_date = datetime(2022, 1, 1)
    months_generated = 0
    
    print("Generating 36 attendance sheets from Jan 2022 to Dec 2024...")
    print("=" * 70)
    
    for i in range(36):
        current_date = start_date + timedelta(days=i*30)
        year = current_date.year
        month = current_date.month
        month_name = current_date.strftime('%B')
        
        # Generate for each stream and subject
        for stream, subjects in subjects_mapping.items():
            for subject_info in subjects:
                records = generate_attendance_for_month(year, month, subject_info, stream)
                
                if records:
                    df = pd.DataFrame(records)
                    
                    # Create filename
                    filename = f"{output_dir}/Attendance_{stream}_{subject_info['subject'].replace(' ', '_')}_{month_name}_{year}.xlsx"
                    
                    # Create Excel with formatting
                    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                        df.to_excel(writer, index=False, sheet_name='Attendance')
                        
                        # Get workbook and worksheet
                        workbook = writer.book
                        worksheet = writer.sheets['Attendance']
                        
                        # Auto-adjust column widths
                        for column in worksheet.columns:
                            max_length = 0
                            column = [cell for cell in column]
                            for cell in column:
                                try:
                                    if len(str(cell.value)) > max_length:
                                        max_length = len(cell.value)
                                except:
                                    pass
                            adjusted_width = min(max_length + 2, 50)
                            worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
                    
                    months_generated += 1
                    
                    # Count defaulters
                    defaulters = len([r for r in records if r['Status'] == 'Defaulter'])
                    print(f"✓ {filename}")
                    print(f"  Stream: {stream} | Subject: {subject_info['subject']}")
                    print(f"  Month: {month_name} {year} | Students: {len(records)} | Defaulters: {defaulters}")
                    print()
    
    print("=" * 70)
    print(f"✅ Generated {months_generated} attendance sheets successfully!")
    print(f"📁 Files saved in: {output_dir}/")
    print("\nDefaulter Testing Guide:")
    print("- Defaulter threshold: 75%")
    print("- Students with <75% attendance are marked as defaulters")
    print("- Data covers 36 months (Jan 2022 - Dec 2024)")
    print("- Multiple subjects and streams included")
    print("- Realistic attendance patterns with variation")

if __name__ == "__main__":
    create_excel_sheets()
