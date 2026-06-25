import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!sectionId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing parameters.' }, { status: 400 })
    }

    // Fetch active students in section along with their attendance logs for the target date range
    const studentsWithAttendance = await db.student.findMany({
      where: {
        sectionId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        rollNo: true,
        admissionNo: true,
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            date: true,
            status: true
          }
        }
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    return NextResponse.json({ success: true, data: studentsWithAttendance })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
