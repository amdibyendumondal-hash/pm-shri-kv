'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// 1. Create Class
export async function createClass(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized access.' }
  }

  const name = formData.get('name') as string
  if (!name) return { error: 'Class name is required.' }

  try {
    const currentSession = await db.academicSession.findFirst({
      where: { isCurrent: true }
    })
    if (!currentSession) return { error: 'No active academic session found.' }

    // Check if class already exists in this session
    const existing = await db.class.findFirst({
      where: { name, sessionId: currentSession.id }
    })
    if (existing) return { error: 'Class already exists in the current session.' }

    const newClass = await db.class.create({
      data: {
        name,
        sessionId: currentSession.id
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_CLASS',
        details: `Created new class: ${name}`,
      }
    })

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create class.' }
  }
}

// 2. Create Section
export async function createSection(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized access.' }
  }

  const classId = formData.get('classId') as string
  const name = formData.get('name') as string
  const teacherId = formData.get('teacherId') as string || null

  if (!classId || !name) {
    return { error: 'Class and Section name are required.' }
  }

  try {
    const targetClass = await db.class.findUnique({ where: { id: classId } })
    if (!targetClass) return { error: 'Class not found.' }

    // Check if section already exists in this class
    const existing = await db.section.findFirst({
      where: { name, classId }
    })
    if (existing) return { error: 'Section already exists in this class.' }

    const newSec = await db.section.create({
      data: {
        name,
        classId,
        classTeacherId: teacherId || undefined
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_SECTION',
        details: `Created section: ${name} in ${targetClass.name}`,
      }
    })

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create section.' }
  }
}

// 3. Assign Class Teacher
export async function assignClassTeacher(formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Unauthorized.')
  }

  const sectionId = formData.get('sectionId') as string
  const teacherId = formData.get('teacherId') as string || null

  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      include: { class: true }
    })
    if (!section) throw new Error('Section not found.')

    await db.section.update({
      where: { id: sectionId },
      data: { classTeacherId: teacherId }
    })

    let teacherName = 'None'
    if (teacherId) {
      const teacherUser = await db.user.findUnique({ where: { id: teacherId } })
      if (teacherUser) teacherName = teacherUser.name
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'ASSIGN_CLASS_TEACHER',
        details: `Assigned teacher ${teacherName} to ${section.class.name}-${section.name}`,
      }
    })

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to assign class teacher.' }
  }
}

// 4. Create Subject
export async function createSubject(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const name = formData.get('name') as string
  const code = formData.get('code') as string

  if (!name || !code) return { error: 'Name and Code are required.' }

  try {
    const existing = await db.subject.findFirst({
      where: {
        OR: [{ name }, { code }]
      }
    })
    if (existing) return { error: 'Subject name or code already exists.' }

    await db.subject.create({
      data: { name, code }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_SUBJECT',
        details: `Created subject: ${name} (${code})`,
      }
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create subject.' }
  }
}

// 5. Delete Subject
export async function deleteSubject(id: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Unauthorized.')
  }

  try {
    const subject = await db.subject.findUnique({ where: { id } })
    if (!subject) throw new Error('Subject not found.')

    // Check if it has marks linked to it
    const marksCount = await db.mark.count({ where: { subjectId: id } })
    if (marksCount > 0) {
      throw new Error('Cannot delete subject because it has recorded examination marks.')
    }

    await db.subject.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_SUBJECT',
        details: `Deleted subject: ${subject.name}`,
      }
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete subject.' }
  }
}

// 6. Create Exam
export async function createExam(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const name = formData.get('name') as string
  const classId = formData.get('classId') as string
  const maxMarks = parseFloat(formData.get('maxMarks') as string)
  const passMarks = parseFloat(formData.get('passMarks') as string)

  if (!name || !classId || isNaN(maxMarks) || isNaN(passMarks)) {
    return { error: 'All fields are required and must be valid numbers.' }
  }

  try {
    const activeSession = await db.academicSession.findFirst({ where: { isCurrent: true } })
    if (!activeSession) return { error: 'No active academic session found.' }

    const targetClass = await db.class.findUnique({ where: { id: classId } })
    if (!targetClass) return { error: 'Class not found.' }

    await db.exam.create({
      data: {
        name,
        academicYear: activeSession.name,
        maxMarks,
        passMarks,
        classId
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_EXAM',
        details: `Created exam: ${name} for ${targetClass.name} (Max Marks: ${maxMarks})`,
      }
    })

    revalidatePath('/admin/exams')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create exam.' }
  }
}

// 7. Delete Exam
export async function deleteExam(id: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Unauthorized.')
  }

  try {
    const exam = await db.exam.findUnique({ where: { id }, include: { class: true } })
    if (!exam) throw new Error('Exam not found.')

    // Check if it has marks linked to it
    const marksCount = await db.mark.count({ where: { examId: id } })
    if (marksCount > 0) {
      throw new Error('Cannot delete exam because it has recorded student scores.')
    }

    await db.exam.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_EXAM',
        details: `Deleted exam: ${exam.name} for ${exam.class.name}`,
      }
    })

    revalidatePath('/admin/exams')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete exam.' }
  }
}

// 8. Promote Students (Class to Class)
export async function promoteStudents(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const sourceClassId = formData.get('sourceClassId') as string
  const targetClassId = formData.get('targetClassId') as string

  if (!sourceClassId || !targetClassId) {
    return { error: 'Both Source Class and Target Class are required.' }
  }

  if (sourceClassId === targetClassId) {
    return { error: 'Source Class and Target Class cannot be the same.' }
  }

  try {
    const sourceClass = await db.class.findUnique({ where: { id: sourceClassId }, include: { students: true } })
    const targetClass = await db.class.findUnique({ where: { id: targetClassId }, include: { sections: true } })

    if (!sourceClass || !targetClass) {
      return { error: 'Selected classes not found.' }
    }

    if (sourceClass.students.length === 0) {
      return { error: 'No students found in the source class to promote.' }
    }

    if (targetClass.sections.length === 0) {
      return { error: 'Target class has no sections configured. Please configure target sections first.' }
    }

    const defaultTargetSection = targetClass.sections[0]

    // Promote all active students in the source class
    const activeStudents = sourceClass.students.filter(s => s.status === 'ACTIVE')

    // Update them all to the target class and first section
    const updatedCount = await db.student.updateMany({
      where: {
        classId: sourceClassId,
        status: 'ACTIVE'
      },
      data: {
        classId: targetClassId,
        sectionId: defaultTargetSection.id
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'PROMOTE_CLASS_STUDENTS',
        details: `Promoted ${updatedCount.count} students from ${sourceClass.name} to ${targetClass.name} (assigned to Section ${defaultTargetSection.name})`,
      }
    })

    revalidatePath('/admin/promotion')
    return { success: true, count: updatedCount.count }
  } catch (error: any) {
    return { error: error.message || 'Failed to promote students.' }
  }
}

// 9. Delete Class
export async function deleteClass(idOrFormData: string | FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized access.' }
  }

  const id = typeof idOrFormData === 'string' ? idOrFormData : idOrFormData.get('id') as string
  if (!id) return { error: 'Class ID is required.' }

  try {
    const cls = await db.class.findUnique({ where: { id } })
    if (!cls) return { error: 'Class not found.' }

    // Check if the class has active students
    const studentCount = await db.student.count({
      where: { classId: id, status: 'ACTIVE' }
    })
    if (studentCount > 0) {
      return { error: 'Cannot delete class because active student records exist.' }
    }

    // Delete exams and sections under the class first
    await db.exam.deleteMany({ where: { classId: id } })
    await db.section.deleteMany({ where: { classId: id } })

    // Now delete class
    await db.class.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_CLASS',
        details: `Deleted class: ${cls.name}`,
      }
    })

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete class.' }
  }
}

// 10. Delete Section
export async function deleteSection(idOrFormData: string | FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized access.' }
  }

  const id = typeof idOrFormData === 'string' ? idOrFormData : idOrFormData.get('id') as string
  if (!id) return { error: 'Section ID is required.' }

  try {
    const sec = await db.section.findUnique({ where: { id }, include: { class: true } })
    if (!sec) return { error: 'Section not found.' }

    // Check active students
    const studentCount = await db.student.count({
      where: { sectionId: id, status: 'ACTIVE' }
    })
    if (studentCount > 0) {
      return { error: 'Cannot delete section because active student records exist.' }
    }

    await db.section.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_SECTION',
        details: `Deleted section: ${sec.name} in ${sec.class.name}`,
      }
    })

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete section.' }
  }
}

// 11. Create Teacher
export async function createTeacher(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string || null
  const password = formData.get('password') as string

  if (!name || !username || !password) {
    return { error: 'Name, Username, and Password are required.' }
  }

  try {
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return { error: 'Username is already taken.' }
    }

    const passwordHash = await hashPassword(password)

    await db.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role: 'TEACHER'
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_TEACHER',
        details: `Created teacher account: ${name} (${username})`,
      }
    })

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create teacher account.' }
  }
}

// 12. Delete Teacher
export async function deleteTeacher(idOrFormData: string | FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const id = typeof idOrFormData === 'string' ? idOrFormData : idOrFormData.get('id') as string
  if (!id) return { error: 'Teacher ID is required.' }

  try {
    const teacher = await db.user.findUnique({ where: { id } })
    if (!teacher) return { error: 'Teacher not found.' }

    // Unassign teacher from any sections
    await db.section.updateMany({
      where: { classTeacherId: id },
      data: { classTeacherId: null }
    })

    await db.user.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_TEACHER',
        details: `Deleted teacher account: ${teacher.name} (${teacher.username})`,
      }
    })

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete teacher account.' }
  }
}

// 13. Create House
export async function createHouse(prevState: any, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const name = formData.get('name') as string
  if (!name) return { error: 'House name is required.' }

  try {
    const existing = await db.house.findUnique({ where: { name } })
    if (existing) return { error: 'House name already exists.' }

    await db.house.create({ data: { name } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'CREATE_HOUSE',
        details: `Created house: ${name}`,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to create house.' }
  }
}

// 14. Update House Name
export async function updateHouse(id: string, newName: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  if (!id || !newName) return { error: 'House ID and New Name are required.' }

  try {
    const house = await db.house.findUnique({ where: { id } })
    if (!house) return { error: 'House not found.' }

    // Check if new name exists
    const duplicate = await db.house.findFirst({
      where: { name: newName, NOT: { id } }
    })
    if (duplicate) return { error: 'New house name already exists.' }

    // Update students assigned to this house
    await db.student.updateMany({
      where: { house: house.name },
      data: { house: newName }
    })

    // Update house
    await db.house.update({
      where: { id },
      data: { name: newName }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'UPDATE_HOUSE',
        details: `Renamed house from "${house.name}" to "${newName}"`,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to rename house.' }
  }
}

// 15. Delete House
export async function deleteHouse(idOrFormData: string | FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  const id = typeof idOrFormData === 'string' ? idOrFormData : idOrFormData.get('id') as string
  if (!id) return { error: 'House ID is required.' }

  try {
    const house = await db.house.findUnique({ where: { id } })
    if (!house) return { error: 'House not found.' }

    // Set house field to null for all students in this house
    await db.student.updateMany({
      where: { house: house.name },
      data: { house: null }
    })

    // Delete house
    await db.house.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'DELETE_HOUSE',
        details: `Deleted house: ${house.name}`,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete house.' }
  }
}

// 16. Update Teacher Account
export async function updateTeacher(id: string, name: string, username: string, email: string | null, password?: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  if (!id || !name || !username) {
    return { error: 'ID, Name, and Username are required.' }
  }

  try {
    const existing = await db.user.findFirst({
      where: { username, NOT: { id } }
    })
    if (existing) {
      return { error: 'Username is already taken by another account.' }
    }

    const data: any = {
      name,
      username,
      email
    }

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' }
      }
      data.passwordHash = await hashPassword(password)
    }

    await db.user.update({
      where: { id },
      data
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'UPDATE_TEACHER',
        details: `Updated teacher account: ${name} (${username})`,
      }
    })

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to update teacher.' }
  }
}

// 17. Update Subject
export async function updateSubject(id: string, name: string, code: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  if (!id || !name || !code) {
    return { error: 'ID, Name, and Code are required.' }
  }

  try {
    const existing = await db.subject.findFirst({
      where: {
        OR: [{ name }, { code }],
        NOT: { id }
      }
    })
    if (existing) {
      return { error: 'Subject name or code already exists on another subject.' }
    }

    await db.subject.update({
      where: { id },
      data: { name, code }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'UPDATE_SUBJECT',
        details: `Updated subject: ${name} (${code})`,
      }
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to update subject.' }
  }
}

// 18. Update Exam
export async function updateExam(id: string, name: string, maxMarks: number, passMarks: number) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  if (!id || !name || isNaN(maxMarks) || isNaN(passMarks)) {
    return { error: 'ID, Name, Max Marks, and Pass Marks are required.' }
  }

  try {
    await db.exam.update({
      where: { id },
      data: {
        name,
        maxMarks,
        passMarks
      }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: 'UPDATE_EXAM',
        details: `Updated exam: ${name} (Max Marks: ${maxMarks}, Pass Marks: ${passMarks})`,
      }
    })

    revalidatePath('/admin/exams')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to update exam.' }
  }
}

// 19. Get Students By Section
export async function getStudentsBySection(sectionId: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Unauthorized.')
  }

  return db.student.findMany({
    where: { sectionId, status: 'ACTIVE' },
    orderBy: { rollNo: 'asc' }
  })
}

// 20. Get Daily Attendance Logs
export async function getDailyAttendanceLogs(sectionId: string, date: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Unauthorized.')
  }

  const students = await db.student.findMany({
    where: { sectionId, status: 'ACTIVE' },
    include: {
      attendance: {
        where: { date }
      }
    },
    orderBy: { rollNo: 'asc' }
  })

  return students.map(s => {
    const att = s.attendance[0]
    return {
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      admissionNo: s.admissionNo,
      status: att ? att.status : 'UNMARKED',
      remarks: att ? att.remarks || '' : ''
    }
  })
}
