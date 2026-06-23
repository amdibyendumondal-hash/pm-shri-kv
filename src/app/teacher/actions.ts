'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// 1. Register Student
export async function registerStudent(prevState: any, formData: FormData) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  const admissionNo = formData.get('admissionNo') as string
  const rollNo = formData.get('rollNo') as string
  const name = formData.get('name') as string
  const classId = formData.get('classId') as string
  const sectionId = formData.get('sectionId') as string
  const gender = formData.get('gender') as string
  const dob = formData.get('dob') as string
  const bloodGroup = formData.get('bloodGroup') as string
  const aadhaarNo = formData.get('aadhaarNo') as string
  const category = formData.get('category') as string
  const religion = formData.get('religion') as string
  const nationality = formData.get('nationality') as string
  
  const fatherName = formData.get('fatherName') as string
  const motherName = formData.get('motherName') as string
  const guardianName = formData.get('guardianName') as string
  const mobile = formData.get('mobile') as string
  const altMobile = formData.get('altMobile') as string
  const email = formData.get('email') as string
  
  const village = formData.get('village') as string
  const postOffice = formData.get('postOffice') as string
  const district = formData.get('district') as string
  const state = formData.get('state') as string
  const pinCode = formData.get('pinCode') as string

  const admissionDate = formData.get('admissionDate') as string
  const previousSchool = formData.get('previousSchool') as string
  const house = formData.get('house') as string
  const aparId = formData.get('aparId') as string
  const penNo = formData.get('penNo') as string
  const photo = formData.get('photo') as string || null

  // New demographics
  const admissionYear = formData.get('admissionYear') as string || null
  const studentCode = formData.get('studentCode') as string || null
  const admissionCategory = formData.get('admissionCategory') as string || null
  const socialCategory = formData.get('socialCategory') as string || null
  const minority = formData.get('minority') as string || null
  const physicallyDisabled = formData.get('physicallyDisabled') as string || 'No'
  const singleGirlChild = formData.get('singleGirlChild') as string || 'No'
  const rte = formData.get('rte') as string || 'No'
  const kvsWard = formData.get('kvsWard') as string || 'No'
  const reimbursementClaimed = formData.get('reimbursementClaimed') as string || 'No'

  // New fee structure
  const tuitionFee = parseFloat(formData.get('tuitionFee') as string || '0')
  const computerFee = parseFloat(formData.get('computerFee') as string || '0')
  const vvnFee = parseFloat(formData.get('vvnFee') as string || '0')
  const computerScienceFee = parseFloat(formData.get('computerScienceFee') as string || '0')
  const libraryFee = parseFloat(formData.get('libraryFee') as string || '0')
  const projectFee = parseFloat(formData.get('projectFee') as string || '0')
  const totalFee = parseFloat(formData.get('totalFee') as string || '0')

  if (!admissionNo || !rollNo || !name || !classId || !sectionId || !gender || !dob || !category || !fatherName || !motherName || !mobile || !village || !postOffice || !district || !state || !pinCode || !admissionDate) {
    return { error: 'Please fill out all required fields.' }
  }

  try {
    const existing = await db.student.findUnique({ where: { admissionNo } })
    if (existing) return { error: `Admission Number ${admissionNo} is already registered.` }

    const student = await db.student.create({
      data: {
        admissionNo,
        rollNo,
        name,
        classId,
        sectionId,
        gender,
        dob,
        bloodGroup,
        aadhaarNo,
        category,
        religion,
        nationality,
        fatherName,
        motherName,
        guardianName,
        mobile,
        altMobile,
        email,
        village,
        postOffice,
        district,
        state,
        pinCode,
        admissionDate,
        previousSchool,
        house,
        aparId,
        penNo,
        photo,
        
        // Save new demographics
        admissionYear,
        studentCode,
        admissionCategory,
        socialCategory,
        minority,
        physicallyDisabled,
        singleGirlChild,
        rte,
        kvsWard,
        reimbursementClaimed,

        // Save new fees
        tuitionFee,
        computerFee,
        vvnFee,
        computerScienceFee,
        libraryFee,
        projectFee,
        totalFee
      }
    })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'REGISTER_STUDENT',
        details: `Registered student: ${name} (Admission No: ${admissionNo})`,
      }
    })

    revalidatePath('/teacher/students')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to register student.' }
  }
}

// 2. Submit Daily Attendance
export async function submitAttendance(date: string, records: { studentId: string; status: string; remarks?: string }[]) {
  const teacher = await getCurrentUser()
  if (!teacher) throw new Error('Unauthorized.')

  if (!date || records.length === 0) {
    throw new Error('Missing date or attendance records.')
  }

  try {
    let created = 0
    let updated = 0

    for (const record of records) {
      // Check if attendance already exists for student on this date
      const existing = await db.attendance.findFirst({
        where: {
          studentId: record.studentId,
          date
        }
      })

      if (existing) {
        await db.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            remarks: record.remarks || null
          }
        })
        updated++
      } else {
        await db.attendance.create({
          data: {
            studentId: record.studentId,
            date,
            status: record.status,
            remarks: record.remarks || null
          }
        })
        created++
      }
    }

    // Trigger Audit Log
    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'SUBMIT_ATTENDANCE',
        details: `Submitted attendance for ${records.length} students on date: ${date} (${created} created, ${updated} updated).`,
      }
    })

    // Simulated SMS/Email Alert triggered for absentees
    const absentees = records.filter(r => r.status === 'ABSENT' || r.status === 'MEDICAL')
    for (const abs of absentees) {
      const student = await db.student.findUnique({ where: { id: abs.studentId } })
      if (student) {
        // Log notification to NotificationLog table
        await db.notificationLog.create({
          data: {
            type: 'SMS',
            recipient: student.mobile,
            message: `Dear Parent, your child ${student.name} is marked ABSENT today (${date}) at PM SHRI KV Mahuldiha.`,
            status: 'SENT'
          }
        })
      }
    }

    revalidatePath('/teacher/attendance')
    return { success: true, created, updated }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to submit attendance.')
  }
}

// 3. Submit Exam Marks (with automatic grading)
export async function submitMarks(
  examId: string, 
  subjectId: string, 
  scores: { studentId: string; marksObtained: number; remarks?: string }[]
) {
  const teacher = await getCurrentUser()
  if (!teacher) throw new Error('Unauthorized.')

  if (!examId || !subjectId || scores.length === 0) {
    throw new Error('Missing exam, subject, or score inputs.')
  }

  try {
    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new Error('Exam not found.')

    const subject = await db.subject.findUnique({ where: { id: subjectId } })
    if (!subject) throw new Error('Subject not found.')

    let entered = 0

    // Grade boundary calculations
    function calculateGrade(marks: number, max: number) {
      const pct = (marks / max) * 100
      if (pct >= 90) return 'A1'
      if (pct >= 80) return 'A2'
      if (pct >= 70) return 'B1'
      if (pct >= 60) return 'B2'
      if (pct >= 50) return 'C1'
      if (pct >= 40) return 'C2'
      if (pct >= 33) return 'D'
      return 'E' // Fail / Essential Repeat
    }

    for (const score of scores) {
      if (score.marksObtained > exam.maxMarks) {
        throw new Error(`Obtained marks cannot exceed maximum marks (${exam.maxMarks})`)
      }

      // Check if mark already exists for student, exam, and subject
      const existing = await db.mark.findFirst({
        where: {
          studentId: score.studentId,
          examId,
          subjectId
        }
      })

      const grade = calculateGrade(score.marksObtained, exam.maxMarks)

      if (existing) {
        await db.mark.update({
          where: { id: existing.id },
          data: {
            marksObtained: score.marksObtained,
            grade,
            remarks: score.remarks || null
          }
        })
      } else {
        await db.mark.create({
          data: {
            studentId: score.studentId,
            examId,
            subjectId,
            marksObtained: score.marksObtained,
            grade,
            remarks: score.remarks || null
          }
        })
      }
      entered++
    }

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'SUBMIT_MARKS',
        details: `Entered marks for ${entered} students in ${subject.name} (Exam: ${exam.name})`,
      }
    })

    revalidatePath('/teacher/marks')
    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to submit marks.')
  }
}

// 4. Excel / CSV Bulk Import Student Roster
export async function importStudentsFromExcel(studentsList: any[]) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!studentsList || studentsList.length === 0) {
    return { error: 'No student records to import.' }
  }

  try {
    let importedCount = 0
    let duplicateCount = 0

    // Fetch classes and sections to map them
    const classes = await db.class.findMany({ include: { sections: true } })

    for (const studentData of studentsList) {
      // Find class and section
      const matchedClass = classes.find(
        c => c.name.toLowerCase() === String(studentData.class).toLowerCase()
      )
      if (!matchedClass) continue

      const matchedSection = matchedClass.sections.find(
        s => s.name.toLowerCase() === String(studentData.section).toLowerCase()
      )
      if (!matchedSection) continue

      // Check duplicate
      const existing = await db.student.findUnique({
        where: { admissionNo: String(studentData.admissionNo) }
      })

      if (existing) {
        duplicateCount++
        continue
      }

      const cleanFloat = (val: any) => {
        if (val === undefined || val === null || val === '') return 0
        const cleanStr = String(val).replace(/[^0-9.]/g, '')
        const parsed = parseFloat(cleanStr)
        return isNaN(parsed) ? 0 : parsed
      }

      const tuitionFee = cleanFloat(studentData.tuitionFee)
      const computerFee = cleanFloat(studentData.computerFee)
      const vvnFee = cleanFloat(studentData.vvnFee)
      const computerScienceFee = cleanFloat(studentData.computerScienceFee)
      const libraryFee = cleanFloat(studentData.libraryFee)
      const projectFee = cleanFloat(studentData.projectFee)
      const totalFee = tuitionFee + computerFee + vvnFee + computerScienceFee + libraryFee + projectFee

      // Determine DB category field value from socialCategory or category input
      let categoryVal = 'General'
      const socialCat = studentData.socialCategory || studentData.category
      if (socialCat) {
        const trimmed = String(socialCat).trim().toLowerCase()
        if (trimmed === 'gen' || trimmed === 'general') categoryVal = 'General'
        else if (trimmed === 'obc') categoryVal = 'OBC'
        else if (trimmed === 'sc') categoryVal = 'SC'
        else if (trimmed === 'st') categoryVal = 'ST'
        else categoryVal = String(socialCat).trim()
      }

      await db.student.create({
        data: {
          admissionNo: String(studentData.admissionNo),
          rollNo: String(studentData.rollNo || '1'),
          name: String(studentData.name),
          gender: String(studentData.gender || 'Male'),
          dob: String(studentData.dob || '2015-01-01'),
          category: categoryVal,
          fatherName: String(studentData.fatherName || 'Father Name'),
          motherName: String(studentData.motherName || 'Mother Name'),
          mobile: String(studentData.mobile || '0000000000'),
          village: String(studentData.village || 'Mahuldiha'),
          postOffice: String(studentData.postOffice || 'Mahuldiha'),
          district: String(studentData.district || 'Mayurbhanj'),
          state: String(studentData.state || 'Odisha'),
          pinCode: String(studentData.pinCode || '757041'),
          admissionDate: String(studentData.admissionDate || '2026-04-01'),
          house: studentData.house ? String(studentData.house) : null,
          classId: matchedClass.id,
          sectionId: matchedSection.id,

          // Optional parent & personal details
          bloodGroup: studentData.bloodGroup ? String(studentData.bloodGroup) : null,
          aadhaarNo: studentData.aadhaarNo ? String(studentData.aadhaarNo) : null,
          religion: studentData.religion ? String(studentData.religion) : null,
          nationality: studentData.nationality ? String(studentData.nationality) : 'Indian',
          guardianName: studentData.guardianName ? String(studentData.guardianName) : null,
          altMobile: studentData.altMobile ? String(studentData.altMobile) : null,
          email: studentData.email ? String(studentData.email) : null,
          previousSchool: studentData.previousSchool ? String(studentData.previousSchool) : null,
          aparId: studentData.aparId ? String(studentData.aparId) : null,
          penNo: studentData.penNo ? String(studentData.penNo) : null,

          // Demographics & welfare indicators
          admissionYear: studentData.admissionYear ? String(studentData.admissionYear) : null,
          studentCode: studentData.studentCode ? String(studentData.studentCode) : null,
          admissionCategory: studentData.admissionCategory ? String(studentData.admissionCategory) : null,
          socialCategory: studentData.socialCategory ? String(studentData.socialCategory) : null,
          minority: studentData.minority ? String(studentData.minority) : null,
          physicallyDisabled: studentData.physicallyDisabled ? String(studentData.physicallyDisabled) : 'No',
          singleGirlChild: studentData.singleGirlChild ? String(studentData.singleGirlChild) : 'No',
          rte: studentData.rte ? String(studentData.rte) : 'No',
          kvsWard: studentData.kvsWard ? String(studentData.kvsWard) : 'No',
          reimbursementClaimed: studentData.reimbursementClaimed ? String(studentData.reimbursementClaimed) : 'No',

          // Fees breakdown
          tuitionFee,
          computerFee,
          vvnFee,
          computerScienceFee,
          libraryFee,
          projectFee,
          totalFee
        }
      })
      importedCount++
    }

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'EXCEL_IMPORT_STUDENTS',
        details: `Imported ${importedCount} students via Excel/CSV bulk sheet upload (${duplicateCount} duplicate rows skipped).`,
      }
    })

    revalidatePath('/teacher/students')
    return { success: true, imported: importedCount, duplicates: duplicateCount }
  } catch (error: any) {
    return { error: error.message || 'Failed to complete excel student import.' }
  }
}

// 5. Delete Student
export async function deleteStudent(idOrFormData: string | FormData) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  const id = typeof idOrFormData === 'string' ? idOrFormData : idOrFormData.get('id') as string
  if (!id) return { error: 'Student ID is required.' }

  try {
    const student = await db.student.findUnique({ where: { id } })
    if (!student) return { error: 'Student not found.' }

    await db.student.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'DELETE_STUDENT',
        details: `Deleted student: ${student.name} (Admission No: ${student.admissionNo})`,
      }
    })

    revalidatePath('/teacher/students')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete student.' }
  }
}

// 6. Create Project
export async function createProject(name: string, type: string, content: string) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!name || !type || !content) {
    return { error: 'Please provide project name, type, and content.' }
  }

  try {
    const project = await db.project.create({
      data: {
        name,
        type,
        content,
        teacherId: teacher.id,
        teacherName: teacher.name,
      }
    })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'CREATE_PROJECT',
        details: `Created ${type} project: ${name} (ID: ${project.id})`,
      }
    })

    revalidatePath('/teacher/projects')
    return { success: true, project }
  } catch (error: any) {
    return { error: error.message || 'Failed to create project.' }
  }
}

// 7. Delete Project
export async function deleteProject(id: string) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!id) return { error: 'Project ID is required.' }

  try {
    const project = await db.project.findUnique({ where: { id } })
    if (!project) return { error: 'Project not found.' }

    if (teacher.role !== 'ADMIN' && project.teacherId !== teacher.id) {
      return { error: 'You are not authorized to delete this project.' }
    }

    await db.project.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'DELETE_PROJECT',
        details: `Deleted project: ${project.name} (ID: ${id})`,
      }
    })

    revalidatePath('/teacher/projects')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete project.' }
  }
}

// 8. Fetch All Projects
export async function getProjects() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, projects }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch projects.' }
  }
}

// 9. Submit Notebook Copy Submission Records
export async function submitNotebookRecords(
  date: string,
  subjectId: string,
  records: { studentId: string; status: string; quality: string; remarks?: string }[]
) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!date || !subjectId || records.length === 0) {
    return { error: 'Missing date, subject, or records.' }
  }

  try {
    let created = 0
    let updated = 0

    for (const record of records) {
      const existing = await db.notebookSubmission.findFirst({
        where: {
          studentId: record.studentId,
          subjectId,
          date
        }
      })

      if (existing) {
        await db.notebookSubmission.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            quality: record.quality,
            remarks: record.remarks || null
          }
        })
        updated++
      } else {
        await db.notebookSubmission.create({
          data: {
            studentId: record.studentId,
            subjectId,
            date,
            status: record.status,
            quality: record.quality,
            remarks: record.remarks || null
          }
        })
        created++
      }
    }

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'SUBMIT_NOTEBOOK_RECORDS',
        details: `Submitted notebook checking list for ${records.length} students on date: ${date} (${created} created, ${updated} updated).`,
      }
    })

    revalidatePath('/teacher/copy-submissions')
    return { success: true, created, updated }
  } catch (error: any) {
    return { error: error.message || 'Failed to submit notebook records.' }
  }
}

// 10. Fetch Notebook Records
export async function getNotebookRecords(classId: string, sectionId: string, subjectId: string, date: string) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!classId || !sectionId || !subjectId || !date) {
    return { error: 'Missing query fields.' }
  }

  try {
    // Fetch students in the section
    const students = await db.student.findMany({
      where: { classId, sectionId, status: 'ACTIVE' },
      orderBy: { rollNo: 'asc' }
    })

    // Fetch submissions
    const submissions = await db.notebookSubmission.findMany({
      where: {
        subjectId,
        date,
        student: {
          classId,
          sectionId
        }
      }
    })

    // Map submissions to students
    const roster = students.map(s => {
      const sub = submissions.find(sub => sub.studentId === s.id)
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        status: sub ? sub.status : 'NOT_SUBMITTED',
        quality: sub ? sub.quality : 'N/A',
        remarks: sub ? (sub.remarks || '') : ''
      }
    })

    return { success: true, roster }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch notebook records.' }
  }
}

// 11. Upload Study Material notes/PDF
export async function uploadStudyMaterial(
  title: string,
  description: string,
  classId: string,
  subjectId: string,
  content: string,
  fileName: string
) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!title || !classId || !subjectId || !content || !fileName) {
    return { error: 'Title, Class, Subject, and File attachment are required.' }
  }

  try {
    const material = await db.studyMaterial.create({
      data: {
        title,
        description: description || null,
        classId,
        subjectId,
        content,
        fileName,
        teacherId: teacher.id,
        teacherName: teacher.name
      }
    })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'UPLOAD_STUDY_MATERIAL',
        details: `Uploaded study material: ${title} (${fileName}) for class ID: ${classId}`,
      }
    })

    revalidatePath('/teacher/study-materials')
    return { success: true, material }
  } catch (error: any) {
    return { error: error.message || 'Failed to upload study material.' }
  }
}

// 12. Delete Study Material
export async function deleteStudyMaterial(id: string) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  if (!id) return { error: 'Study Material ID is required.' }

  try {
    const material = await db.studyMaterial.findUnique({ where: { id } })
    if (!material) return { error: 'Study material not found.' }

    if (teacher.role !== 'ADMIN' && material.teacherId !== teacher.id) {
      return { error: 'You are not authorized to delete this study material.' }
    }

    await db.studyMaterial.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: teacher.id,
        username: teacher.username,
        action: 'DELETE_STUDY_MATERIAL',
        details: `Deleted study material: ${material.title}`,
      }
    })

    revalidatePath('/teacher/study-materials')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete study material.' }
  }
}

// 13. Fetch Study Materials
export async function getStudyMaterials(classId?: string, subjectId?: string) {
  try {
    const filter: any = {}
    if (classId) filter.classId = classId
    if (subjectId) filter.subjectId = subjectId

    const list = await db.studyMaterial.findMany({
      where: filter,
      include: {
        class: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, list }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch study materials.' }
  }
}

// 14. Save Threshold Settings
export async function saveThresholdConfig(remedialMax: number, giftedMin: number) {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  try {
    const config = await db.thresholdConfig.upsert({
      where: { teacherId: teacher.id },
      update: { remedialMax, giftedMin },
      create: { teacherId: teacher.id, remedialMax, giftedMin }
    })

    return { success: true, config }
  } catch (error: any) {
    return { error: error.message || 'Failed to save configuration.' }
  }
}

// 15. Fetch Threshold Settings
export async function getThresholdConfig() {
  const teacher = await getCurrentUser()
  if (!teacher) return { error: 'Unauthorized.' }

  try {
    const config = await db.thresholdConfig.findUnique({
      where: { teacherId: teacher.id }
    })
    return { success: true, config: config || { remedialMax: 35, giftedMin: 75 } }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch configuration.' }
  }
}
