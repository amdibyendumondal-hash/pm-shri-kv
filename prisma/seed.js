const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.mark.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.student.deleteMany()
  await prisma.section.deleteMany()
  await prisma.class.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.academicSession.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Users
  const adminPasswordHash = await bcrypt.hash('123456', 10)
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'amdibyendumondal@gmail.com',
      passwordHash: adminPasswordHash,
      name: 'Dibyendu Mondal (PGT Math)',
      role: 'ADMIN',
      email: 'amdibyendumondal@gmail.com',
    },
  })

  const teacher = await prisma.user.create({
    data: {
      username: 'teacher',
      passwordHash: teacherPasswordHash,
      name: 'Mrs. Ranjana Sharma (PGT Computer Science)',
      role: 'TEACHER',
      email: 'ranjana.teacher@gmail.com',
    },
  })

  console.log('Created admin and teacher users.')

  // 2. Create Academic Sessions
  const currentSession = await prisma.academicSession.create({
    data: {
      name: '2026-2027',
      isCurrent: true,
    },
  })

  await prisma.academicSession.create({
    data: {
      name: '2027-2028',
      isCurrent: false,
    },
  })

  // 3. Create Classes
  const class1 = await prisma.class.create({
    data: { name: 'Class 1', sessionId: currentSession.id },
  })
  const class2 = await prisma.class.create({
    data: { name: 'Class 2', sessionId: currentSession.id },
  })
  const class9 = await prisma.class.create({
    data: { name: 'Class 9', sessionId: currentSession.id },
  })
  const class10 = await prisma.class.create({
    data: { name: 'Class 10', sessionId: currentSession.id },
  })

  // 4. Create Sections
  await prisma.section.create({
    data: { name: 'A', classId: class1.id },
  })
  await prisma.section.create({
    data: { name: 'B', classId: class1.id },
  })
  const sec9A = await prisma.section.create({
    data: { name: 'A', classId: class9.id, classTeacherId: teacher.id },
  })
  const sec10A = await prisma.section.create({
    data: { name: 'A', classId: class10.id },
  })

  console.log('Created classes and sections.')

  // 5. Create Subjects
  const math = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH101' } })
  const science = await prisma.subject.create({ data: { name: 'Science', code: 'SCI101' } })
  const english = await prisma.subject.create({ data: { name: 'English', code: 'ENG101' } })
  const hindi = await prisma.subject.create({ data: { name: 'Hindi', code: 'HIN101' } })
  const cs = await prisma.subject.create({ data: { name: 'Computer Science', code: 'CS101' } })

  console.log('Created subjects.')

  // 6. Create Exams
  const ut1 = await prisma.exam.create({
    data: {
      name: 'Unit Test 1',
      academicYear: '2026-2027',
      maxMarks: 40,
      passMarks: 13,
      classId: class10.id,
    },
  })

  const halfYearly = await prisma.exam.create({
    data: {
      name: 'Half Yearly',
      academicYear: '2026-2027',
      maxMarks: 80,
      passMarks: 26,
      classId: class10.id,
    },
  })

  // 7. Create Mock Students
  const studentsData = [
    {
      admissionNo: 'KV-2026-001',
      rollNo: '1',
      name: 'Aarav Sharma',
      gender: 'Male',
      dob: '2011-04-12',
      bloodGroup: 'O+',
      aadhaarNo: '1234-5678-9012',
      category: 'General',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Rajesh Sharma',
      motherName: 'Mrs. Sunita Sharma',
      mobile: '9876543210',
      village: 'Mahuldiha',
      postOffice: 'Mahuldiha',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757041',
      admissionDate: '2026-04-05',
      house: 'Shivaji',
      aparId: 'APAR-2026-101',
      penNo: 'PEN-987654',
      classId: class10.id,
      sectionId: sec10A.id,
    },
    {
      admissionNo: 'KV-2026-002',
      rollNo: '2',
      name: 'Ananya Mishra',
      gender: 'Female',
      dob: '2011-08-23',
      bloodGroup: 'A+',
      aadhaarNo: '9876-5432-1098',
      category: 'General',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Alok Mishra',
      motherName: 'Mrs. Preeti Mishra',
      mobile: '9876543211',
      village: 'Karanjia',
      postOffice: 'Karanjia',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757037',
      admissionDate: '2026-04-06',
      house: 'Raman',
      aparId: 'APAR-2026-102',
      penNo: 'PEN-987655',
      classId: class10.id,
      sectionId: sec10A.id,
    },
    {
      admissionNo: 'KV-2026-003',
      rollNo: '3',
      name: 'Rahul Naik',
      gender: 'Male',
      dob: '2011-12-05',
      bloodGroup: 'B+',
      aadhaarNo: '2345-6789-0123',
      category: 'ST',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Jiban Naik',
      motherName: 'Mrs. Laxmi Naik',
      mobile: '9876543212',
      village: 'Mahuldiha',
      postOffice: 'Mahuldiha',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757041',
      admissionDate: '2026-04-06',
      house: 'Ashoka',
      aparId: 'APAR-2026-103',
      penNo: 'PEN-987656',
      classId: class10.id,
      sectionId: sec10A.id,
    },
    {
      admissionNo: 'KV-2026-004',
      rollNo: '4',
      name: 'Priya Das',
      gender: 'Female',
      dob: '2011-02-14',
      bloodGroup: 'AB+',
      aadhaarNo: '3456-7890-1234',
      category: 'OBC',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Manoj Das',
      motherName: 'Mrs. Rita Das',
      mobile: '9876543213',
      village: 'Baripada',
      postOffice: 'Baripada',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757001',
      admissionDate: '2026-04-07',
      house: 'Tagore',
      aparId: 'APAR-2026-104',
      penNo: 'PEN-987657',
      classId: class10.id,
      sectionId: sec10A.id,
    },
    {
      admissionNo: 'KV-2026-005',
      rollNo: '5',
      name: 'Aditya Mohanty',
      gender: 'Male',
      dob: '2011-05-30',
      bloodGroup: 'O-',
      aadhaarNo: '4567-8901-2345',
      category: 'General',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Subodh Mohanty',
      motherName: 'Mrs. Gita Mohanty',
      mobile: '9876543214',
      village: 'Mahuldiha',
      postOffice: 'Mahuldiha',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757041',
      admissionDate: '2026-04-07',
      house: 'Shivaji',
      aparId: 'APAR-2026-105',
      penNo: 'PEN-987658',
      classId: class10.id,
      sectionId: sec10A.id,
    },
    // Mock students for Class 9-A
    {
      admissionNo: 'KV-2026-006',
      rollNo: '1',
      name: 'Rohan Behera',
      gender: 'Male',
      dob: '2012-07-15',
      bloodGroup: 'B+',
      aadhaarNo: '5678-9012-3456',
      category: 'SC',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Kailash Behera',
      motherName: 'Mrs. Kamala Behera',
      mobile: '9876543215',
      village: 'Mahuldiha',
      postOffice: 'Mahuldiha',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757041',
      admissionDate: '2026-04-05',
      house: 'Ashoka',
      classId: class9.id,
      sectionId: sec9A.id,
    },
    {
      admissionNo: 'KV-2026-007',
      rollNo: '2',
      name: 'Sushree Patra',
      gender: 'Female',
      dob: '2012-09-10',
      bloodGroup: 'A-',
      aadhaarNo: '6789-0123-4567',
      category: 'OBC',
      religion: 'Hindu',
      nationality: 'Indian',
      fatherName: 'Mr. Niranjan Patra',
      motherName: 'Mrs. Sabita Patra',
      mobile: '9876543216',
      village: 'Karanjia',
      postOffice: 'Karanjia',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pinCode: '757037',
      admissionDate: '2026-04-06',
      house: 'Raman',
      classId: class9.id,
      sectionId: sec9A.id,
    }
  ]

  const students = []
  for (const data of studentsData) {
    const student = await prisma.student.create({ data })
    students.push(student)
  }

  console.log(`Created ${students.length} students.`)

  // 8. Create Mock Attendance
  const dates = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06']
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT', 'PRESENT']

  for (const s of students) {
    for (let i = 0; i < dates.length; i++) {
      let status = statuses[i]
      if (s.name === 'Rahul Naik' && i === 2) status = 'LEAVE'
      if (s.name === 'Rahul Naik' && i === 3) status = 'MEDICAL'
      if (s.name === 'Aditya Mohanty' && i === 1) status = 'ABSENT'

      await prisma.attendance.create({
        data: {
          studentId: s.id,
          date: dates[i],
          status,
          remarks: status !== 'PRESENT' ? 'Informed parent' : undefined
        }
      })
    }
  }

  console.log('Created mock attendance logs.')

  // 9. Create Mock Marks
  const class10Students = students.filter(s => s.classId === class10.id)
  const subjectList = [math, science, english, hindi, cs]

  const marksMappingUT1 = {
    'Aarav Sharma': [35, 38, 32, 34, 39],
    'Ananya Mishra': [38, 39, 36, 37, 40],
    'Rahul Naik': [22, 18, 25, 24, 20],
    'Priya Das': [28, 30, 31, 29, 32],
    'Aditya Mohanty': [15, 12, 18, 14, 16]
  }

  const marksMappingHY = {
    'Aarav Sharma': [72, 75, 68, 70, 78],
    'Ananya Mishra': [76, 78, 74, 75, 79],
    'Rahul Naik': [45, 40, 52, 48, 44],
    'Priya Das': [58, 62, 64, 60, 66],
    'Aditya Mohanty': [32, 28, 38, 30, 34]
  }

  function getGrade(pct) {
    if (pct >= 90) return 'A1'
    if (pct >= 80) return 'A2'
    if (pct >= 70) return 'B1'
    if (pct >= 60) return 'B2'
    if (pct >= 50) return 'C1'
    if (pct >= 40) return 'C2'
    if (pct >= 33) return 'D'
    return 'E'
  }

  for (const s of class10Students) {
    // UT1 Marks
    const ut1Scores = marksMappingUT1[s.name] || [25, 25, 25, 25, 25]
    for (let j = 0; j < subjectList.length; j++) {
      const markVal = ut1Scores[j]
      const pct = (markVal / 40) * 100
      await prisma.mark.create({
        data: {
          studentId: s.id,
          examId: ut1.id,
          subjectId: subjectList[j].id,
          marksObtained: markVal,
          grade: getGrade(pct),
          remarks: markVal >= 35 ? 'Excellent work' : markVal >= 25 ? 'Good performance' : markVal >= 13 ? 'Needs improvement' : 'Requires special attention'
        }
      })
    }

    // HY Marks
    const hyScores = marksMappingHY[s.name] || [50, 50, 50, 50, 50]
    for (let j = 0; j < subjectList.length; j++) {
      const markVal = hyScores[j]
      const pct = (markVal / 80) * 100
      await prisma.mark.create({
        data: {
          studentId: s.id,
          examId: halfYearly.id,
          subjectId: subjectList[j].id,
          marksObtained: markVal,
          grade: getGrade(pct),
          remarks: markVal >= 70 ? 'Excellent work' : markVal >= 50 ? 'Good performance' : markVal >= 26 ? 'Needs improvement' : 'Requires special attention'
        }
      })
    }
  }

  // 10. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      username: admin.username,
      action: 'INITIAL_SEED',
      details: 'System initial database seed created successfully.',
    }
  })

  console.log('Seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
