import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { StudentAnalyticsCharts } from './StudentAnalyticsCharts'
import { School, User, Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function StudentAnalyticsPage({ params }: PageProps) {
  const { id } = await params

  // 1. Fetch Student Demographics with Marks and Attendance
  const student = await db.student.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          students: { where: { status: 'ACTIVE' } }
        }
      },
      section: true,
      attendance: true,
      marks: {
        include: {
          exam: true,
          subject: true
        }
      }
    }
  })

  if (!student) {
    notFound()
  }

  // 2. Fetch all Classmates to calculate ranks
  const classmates = await db.student.findMany({
    where: { classId: student.classId, status: 'ACTIVE' },
    include: {
      marks: {
        include: { exam: true }
      }
    }
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

  // 3. Attendance Rate
  const validAttendance = student.attendance.filter(a => a.status !== 'HOLIDAY')
  const totalAttendance = validAttendance.length
  const presentCount = validAttendance.reduce((acc, a) => {
    if (a.status === 'PRESENT' || a.status === 'OD') return acc + 1
    if (a.status === 'HALF_PRESENT') return acc + 0.5
    return acc
  }, 0)
  const attendanceRate = totalAttendance > 0 
    ? Math.round((presentCount / totalAttendance) * 100) 
    : 100

  // 4. Student Average Marks obtained across all subjects
  let avgScore = 0
  if (student.marks.length > 0) {
    let totalPct = 0
    student.marks.forEach(m => {
      totalPct += (m.marksObtained / m.exam.maxMarks) * 100
    })
    avgScore = Math.round(totalPct / student.marks.length)
  }

  // 5. Exam Trends
  // Group marks by Exam Name
  const examIds = Array.from(new Set(student.marks.map(m => m.examId)))
  const examTrends = examIds.map(eId => {
    const marksForExam = student.marks.filter(m => m.examId === eId)
    const totalPct = marksForExam.reduce((acc, m) => acc + (m.marksObtained / m.exam.maxMarks) * 100, 0)
    const avg = marksForExam.length > 0 ? Math.round(totalPct / marksForExam.length) : 0
    return {
      name: marksForExam[0]?.exam.name || 'Exam',
      score: avg
    }
  })

  // 6. Subject-wise Scores (Average score per subject across all exams)
  const subjectIds = Array.from(new Set(student.marks.map(m => m.subjectId)))
  const subjectScores = subjectIds.map(subId => {
    const marksForSub = student.marks.filter(m => m.subjectId === subId)
    const totalPct = marksForSub.reduce((acc, m) => acc + (m.marksObtained / m.exam.maxMarks) * 150, 0) // Normalizing scaling
    const avgObtained = marksForSub.reduce((acc, m) => acc + m.marksObtained, 0) / marksForSub.length
    const avgMax = marksForSub.reduce((acc, m) => acc + m.exam.maxMarks, 0) / marksForSub.length
    return {
      subject: marksForSub[0]?.subject.name || 'Subject',
      obtained: Math.round(avgObtained * 10) / 10,
      max: avgMax,
      pct: Math.round((avgObtained / avgMax) * 100)
    }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-2xl flex items-center justify-center shrink-0">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <User className="h-7 w-7 text-brand-teal-500" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{student.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Class: <span className="font-bold text-slate-350">{student.class.name}-{student.section.name}</span></span>
              <span className="h-3 w-px bg-slate-800" />
              <span>Roll No: <span className="font-bold text-slate-350">{student.rollNo}</span></span>
              <span className="h-3 w-px bg-slate-800" />
              <span>Admission No: <span className="font-mono text-slate-350">{student.admissionNo}</span></span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-450">
          <Calendar className="h-4 w-4" />
          <span>Admission Date: {student.admissionDate}</span>
        </div>
      </div>

      {/* Analytics Visualizers */}
      <StudentAnalyticsCharts
        studentName={student.name}
        attendanceRate={attendanceRate}
        avgScore={avgScore}
        classRank={classRank}
        sectionRank={sectionRank}
        totalClassmates={totalClassmates}
        totalSectionmates={totalSectionmates}
        examTrends={examTrends}
        subjectScores={subjectScores}
      />
    </div>
  )
}
