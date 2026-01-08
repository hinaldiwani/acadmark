import csv
import random

# Indian first names
first_names = [
    "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva",
    "Advait", "Pranav", "Vedant", "Aryan", "Reyansh", "Aadhya", "Ananya", "Pari", "Anika", "Saanvi",
    "Sara", "Diya", "Navya", "Kiara", "Myra", "Ira", "Riya", "Avni", "Kavya", "Anvi",
    "Rahul", "Amit", "Priya", "Neha", "Rohan", "Sneha", "Vikram", "Anjali", "Karan", "Pooja",
    "Siddharth", "Divya", "Manish", "Ritika", "Varun", "Ishita", "Nikhil", "Tanvi", "Akash", "Megha",
    "Gaurav", "Shreya", "Harsh", "Nidhi", "Shubham", "Anushka", "Rajesh", "Meera", "Suresh", "Lakshmi",
    "Deepa", "Vijay", "Swati", "Naveen", "Bhavna", "Ramesh", "Sunita", "Mahesh", "Rekha", "Prakash",
    "Kavita", "Dinesh", "Seema", "Ashok", "Geeta", "Mukesh", "Nisha", "Ravi", "Anjana", "Sandeep",
    "Preeti", "Rohit", "Sonia", "Vikas", "Ritu", "Sunil", "Anita", "Manoj", "Priyanka", "Ajay",
    "Neelam", "Praveen", "Kiran", "Sanjay", "Madhuri", "Sapna", "Deepak", "Alka", "Yash", "Sakshi",
    "Ayush", "Tanya", "Kabir", "Sana", "Vihaan", "Zara", "Advika", "Arnav", "Samaira", "Dhruv",
    "Anaya", "Rudra", "Shanaya", "Aarush", "Ahana", "Shivansh", "Navika", "Veer", "Palak", "Arush",
    "Advik", "Pihu", "Aanya", "Vivaan", "Nitya", "Krish", "Mira", "Aayan", "Zoya", "Aaradhya",
    "Shlok", "Mahika", "Devansh", "Roshni", "Kabir", "Mishka", "Rian", "Amaira", "Arnav", "Ishani",
    "Parth", "Aarohi", "Tanish", "Avika", "Aditya", "Drishti", "Aryan", "Aarna", "Viraj", "Kiaan"
]

last_names = [
    "Kumar", "Singh", "Sharma", "Gupta", "Verma", "Patel", "Reddy", "Nair", "Desai", "Iyer",
    "Mehta", "Joshi", "Rao", "Deshmukh", "Agarwal", "Malhotra", "Pandey", "Mishra", "Kapoor", "Tiwari",
    "Saxena", "Chopra", "Sinha", "Bansal", "Khanna", "Bhatia", "Dutta", "Goyal", "Arora", "Roy",
    "Bhatt", "Jain", "Menon", "Pillai", "Nambiar", "Krishnan", "Srinivasan", "Subramanian", "Raman", "Narayanan",
    "Shah", "Modi", "Gandhi", "Thakur", "Yadav", "Chauhan", "Rajput", "Bisht", "Rawat", "Garg",
    "Aggarwal", "Sethi", "Kohli", "Bose", "Das", "Sen", "Chatterjee", "Mukherjee", "Banerjee", "Ghosh",
    "Kulkarni", "Patil", "Pawar", "Shinde", "Jadhav", "Chavan", "Sawant", "More", "Gaikwad", "Kamble",
    "Rana", "Bhandari", "Soni", "Jha", "Dubey", "Tripathi", "Upadhyay", "Shukla", "Dwivedi", "Pandey",
    "Rane", "Kadam", "Bhosale", "Mane", "Salvi", "Naik", "Shirke", "Wagh", "Raut", "Thorat",
    "Saini", "Gill", "Sandhu", "Virk", "Grewal", "Dhillon", "Brar", "Sidhu", "Randhawa", "Mann"
]

streams = ["BSCIT", "BSCDS", "BSCCA", "BSCAIML"]
divisions = ["A", "B", "C"]
years = ["FY", "SY", "TY"]

students = []
used_names = set()
student_id = 1

# Generate 500 students
for year in years:
    for stream in streams:
        # Calculate students per stream per year (500 / 3 years / 4 streams ≈ 42 per group)
        students_in_group = 42 if year != "TY" else 41  # TY gets 41 to make total 500
        
        roll_no = 1
        for i in range(students_in_group):
            # Generate unique name
            while True:
                first = random.choice(first_names)
                last = random.choice(last_names)
                full_name = f"{first} {last}"
                if full_name not in used_names:
                    used_names.add(full_name)
                    break
            
            # Assign division (rotate through A, B, C)
            division = divisions[i % 3]
            
            # Create student ID based on stream and sequential number
            stream_prefix = {"BSCIT": "1", "BSCDS": "2", "BSCCA": "3", "BSCAIML": "4"}[stream]
            year_prefix = {"FY": "0", "SY": "1", "TY": "2"}[year]
            stu_id = f"STU{year_prefix}{stream_prefix}{str(student_id).zfill(3)}"
            
            students.append({
                "Student_ID": stu_id,
                "Name": full_name,
                "Roll_No": str(roll_no),
                "Year": year,
                "Stream": stream,
                "Division": division
            })
            
            roll_no += 1
            student_id += 1

# Write to CSV
with open('students.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["Student_ID", "Name", "Roll_No", "Year", "Stream", "Division"], quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(students)

print(f"Generated {len(students)} students")
print(f"FY: {sum(1 for s in students if s['Year'] == 'FY')}")
print(f"SY: {sum(1 for s in students if s['Year'] == 'SY')}")
print(f"TY: {sum(1 for s in students if s['Year'] == 'TY')}")
