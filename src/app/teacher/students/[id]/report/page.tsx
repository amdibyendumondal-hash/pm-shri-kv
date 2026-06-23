import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ReportCardPreview } from './ReportCardPreview'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function ReportCardPage({ params }: PageProps) {
  const { id } = await params

  // 1. Fetch Student Demographics with Marks and Attendance
  const student = await db.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
      attendance: true,
      marks: true,
    },
  })

  if (!student) {
    notFound()
  }

  // 2. Fetch all Exams corresponding to this Student's Class
  const exams = await db.exam.findMany({
    where: { classId: student.classId },
  })

  // 3. Fetch all Subjects to build the report sheet rows
  const subjects = await db.subject.findMany()

  // 4. Fetch all Classmates to calculate ranks
  const classmates = await db.student.findMany({
    where: { classId: student.classId, status: 'ACTIVE' },
    include: {
      marks: {
        include: { exam: true },
      },
    },
  })

  // Calculate average percentage score for each classmate across all exam records
  const classmatesAverages = classmates.map(c => {
    if (c.marks.length === 0) return { id: c.id, avg: 0 }
    let totalPct = 0
    c.marks.forEach(m => {
      totalPct += (m.marksObtained / m.exam.maxMarks) * 100
    })
    return { id: c.id, avg: totalPct / c.marks.length }
  })

  // Sort Classmates by averages descending to find class rank
  classmatesAverages.sort((a, b) => b.avg - a.avg)
  const classRank = classmatesAverages.findIndex(cs => cs.id === id) + 1
  const totalClassmates = classmates.length

  // Filter for Sectionmates and find section rank
  const sectionmates = classmates.filter(c => c.sectionId === student.sectionId)
  const sectionmatesAverages = classmatesAverages.filter(cs => 
    sectionmates.some(sm => sm.id === cs.id)
  )
  const sectionRank = sectionmatesAverages.findIndex(cs => cs.id === id) + 1
  const totalSectionmates = sectionmates.length

  // 5. Attendance Summary
  const validAttendance = student.attendance.filter(a => a.status !== 'HOLIDAY')
  const totalAttendance = validAttendance.length
  const presentCount = validAttendance.reduce((acc, a) => {
    if (a.status === 'PRESENT' || a.status === 'OD') return acc + 1
    if (a.status === 'HALF_PRESENT') return acc + 0.5
    return acc
  }, 0)

  return (
    <div className="max-w-4xl mx-auto py-6">
      <ReportCardPreview
        student={student}
        exams={exams}
        subjects={subjects}
        marks={student.marks}
        presentCount={presentCount}
        totalAttendance={totalAttendance}
        classRank={classRank}
        totalClassmates={totalClassmates}
        sectionRank={sectionRank}
        totalSectionmates={totalSectionmates}
      />
    </div>
  )
}
