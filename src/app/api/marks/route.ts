import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  const teacher = await getCurrentUser()
  if (!teacher) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId')
  const examId = searchParams.get('examId')
  const subjectId = searchParams.get('subjectId')

  if (!sectionId || !examId || !subjectId) {
    return NextResponse.json({ error: 'Missing sectionId, examId, or subjectId parameters.' }, { status: 400 })
  }

  try {
    // Query active students in section and include marks matching examId and subjectId
    const students = await db.student.findMany({
      where: {
        sectionId,
        status: 'ACTIVE'
      },
      include: {
        marks: {
          where: {
            examId,
            subjectId
          }
        }
      },
      orderBy: { rollNo: 'asc' }
    })

    const formattedStudents = students.map(s => {
      const mark = s.marks[0]
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        marksObtained: mark ? mark.marksObtained : '',
        grade: mark ? mark.grade : '',
        remarks: mark ? mark.remarks : ''
      }
    })

    return NextResponse.json({ success: true, students: formattedStudents })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch student roster.' }, { status: 500 })
  }
}
