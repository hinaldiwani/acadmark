import mysql.connector
import csv

# Connect to MySQL
conn = mysql.connector.connect(
    host='localhost',
    port=3305,
    user='hinal',
    password='hinal',
    database='markin_attendance'
)

cursor = conn.cursor()

# Read and insert students
inserted = 0
with open('students.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cursor.execute(
            "INSERT INTO student_details_db (student_id, student_name, roll_no, year, stream, division) VALUES (%s, %s, %s, %s, %s, %s)",
            (row['Student_ID'], row['Name'], row['Roll_No'], row['Year'], row['Stream'], row['Division'])
        )
        inserted += 1

conn.commit()
print(f"Successfully inserted {inserted} students")

# Verify counts
cursor.execute("SELECT year, stream, COUNT(*) as count FROM student_details_db GROUP BY year, stream ORDER BY year, stream")
print("\nDistribution:")
for row in cursor.fetchall():
    print(f"  {row[0]} {row[1]}: {row[2]} students")

cursor.close()
conn.close()
