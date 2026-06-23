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
  const date = searchParams.get('date')

  if (!sectionId || !date) {
    return NextResponse.json({ error: 'Missing sectionId or date parameter.' }, { status: 400 })
  }

  try {
    // Query active students in section and include attendance for the specific date
    const students = await db.student.findMany({
      where: {
        sectionId,
        status: 'ACTIVE'
      },
      include: {
        attendance: {
          where: { date }
        }
      },
      orderBy: { rollNo: 'asc' }
    })

    const formattedStudents = students.map(s => {
      const att = s.attendance[0]
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        status: att ? att.status : 'PRESENT', // default to PRESENT if unmarked
        remarks: att ? att.remarks : ''
      }
    })

    return NextResponse.json({ success: true, students: formattedStudents })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch student roster.' }, { status: 500 })
  }
}
