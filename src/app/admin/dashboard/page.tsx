import { db } from '@/lib/db'
import { DashboardCharts } from './DashboardCharts'
import { 
  Users, BookOpen, CheckCircle, TrendingUp, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, ClipboardList, School 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // 1. Fetch Counts
  const totalStudents = await db.student.count()
  const totalTeachers = await db.user.count({ where: { role: 'TEACHER' } })
  const totalSubjects = await db.subject.count()
  
  // 2. Fetch Attendance and calculate Rate
  const attendanceLogs = await db.attendance.findMany()
  const validLogs = attendanceLogs.filter(a => a.status !== 'HOLIDAY')
  const totalAttendanceRecords = validLogs.length
  const presentRecords = validLogs.reduce((acc, a) => {
    if (a.status === 'PRESENT' || a.status === 'OD') return acc + 1
    if (a.status === 'HALF_PRESENT') return acc + 0.5
    return acc
  }, 0)
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100)
    : 100

  // 3. Class-wise Stats
  const classes = await db.class.findMany({
    include: {
      students: true
    }
  })
  const classStats = classes.map(c => ({
    name: c.name,
    students: c.students.length
  }))

  // 4. Attendance rate by Date (trends)
  const attendanceDates = Array.from(new Set(attendanceLogs.map(a => a.date))).sort()
  const attendanceTrends = attendanceDates.map(date => {
    const logsForDate = attendanceLogs.filter(a => a.date === date && a.status !== 'HOLIDAY')
    const present = logsForDate.reduce((acc, a) => {
      if (a.status === 'PRESENT' || a.status === 'OD') return acc + 1
      if (a.status === 'HALF_PRESENT') return acc + 0.5
      return acc
    }, 0)
    const total = logsForDate.length
    return {
      date,
      present,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 100
    }
  })

  // 5. Fetch Marks & Performance
  const studentsWithMarks = await db.student.findMany({
    include: {
      marks: true,
      class: true,
      section: true
    }
  })

  // Calculate student average grades
  const studentPerformance = studentsWithMarks.map(s => {
    if (s.marks.length === 0) {
      return { id: s.id, name: s.name, class: s.class.name, section: s.section.name, avg: 0, rollNo: s.rollNo }
    }
    // Convert all marks to percentage (taking maxMarks of exam into account)
    let totalPct = 0
    s.marks.forEach(m => {
      // Find maximum marks for this exam. Since we don't have direct maxMarks on Mark, we include exam
    })
    return { id: s.id, name: s.name, class: s.class.name, section: s.section.name, avg: 0, rollNo: s.rollNo }
  })

  // Let's implement a better average marks calculation:
  const marksDetailed = await db.mark.findMany({
    include: {
      exam: true,
      student: {
        include: {
          class: true,
          section: true
        }
      }
    }
  })

  // Group marks by student ID
  const studentPerformanceMap: Record<string, { name: string; class: string; section: string; totalPct: number; count: number; rollNo: string }> = {}
  marksDetailed.forEach(m => {
    const sId = m.studentId
    if (!studentPerformanceMap[sId]) {
      studentPerformanceMap[sId] = {
        name: m.student.name,
        class: m.student.class.name,
        section: m.student.section.name,
        rollNo: m.student.rollNo,
        totalPct: 0,
        count: 0
      }
    }
    const pct = (m.marksObtained / m.exam.maxMarks) * 100
    studentPerformanceMap[sId].totalPct += pct
    studentPerformanceMap[sId].count += 1
  })

  const performers = Object.entries(studentPerformanceMap).map(([id, info]) => ({
    id,
    name: info.name,
    class: info.class,
    section: info.section,
    rollNo: info.rollNo,
    avg: Math.round((info.totalPct / info.count) * 10) / 10
  }))

  const topPerformers = [...performers].sort((a, b) => b.avg - a.avg).slice(0, 5)
  const lowPerformers = [...performers].filter(p => p.avg < 50).sort((a, b) => a.avg - b.avg).slice(0, 5)

  // 6. Grade distribution
  const gradeCounts: Record<string, number> = {}
  marksDetailed.forEach(m => {
    gradeCounts[m.grade] = (gradeCounts[m.grade] || 0) + 1
  })
  const gradeDistribution = Object.entries(gradeCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a,b) => a.name.localeCompare(b.name))

  // 7. Recent Audit Logs
  const recentLogs = await db.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400">School analytics and live monitoring logs</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="p-2.5 bg-brand-blue-700/10 rounded-2xl border border-brand-blue-600/30 text-brand-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{totalStudents}</h2>
          <div className="flex items-center gap-1.5 text-xs text-brand-teal-500 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Active Enrollments</span>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Teachers</span>
            <div className="p-2.5 bg-brand-teal-600/10 rounded-2xl border border-brand-teal-500/30 text-brand-teal-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{totalTeachers}</h2>
          <div className="flex items-center gap-1.5 text-xs text-brand-teal-500 font-semibold">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Staff Registered</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <CheckCircle className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2.5 bg-brand-orange-500/10 rounded-2xl border border-brand-orange-500/30 text-brand-orange-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{attendanceRate}%</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Average overall attendance</span>
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <BookOpen className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curriculum Subjects</span>
            <div className="p-2.5 bg-brand-blue-600/10 rounded-2xl border border-brand-blue-500/30 text-brand-blue-500">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{totalSubjects}</h2>
          <div className="flex items-center gap-1.5 text-xs text-brand-teal-500 font-semibold">
            <span>Core & Vocational</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <DashboardCharts 
        classStats={classStats} 
        attendanceTrends={attendanceTrends} 
        gradeDistribution={gradeDistribution} 
      />

      {/* Lists Section: Top Performers & Low Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ArrowUpRight className="h-4.5 w-4.5 text-brand-teal-500" />
            Top Performers (Class 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 font-semibold">Student</th>
                  <th className="py-3 font-semibold text-center">Roll No</th>
                  <th className="py-3 font-semibold text-center">Class</th>
                  <th className="py-3 font-semibold text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {topPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">No records available</td>
                  </tr>
                ) : (
                  topPerformers.map(p => (
                    <tr key={p.id} className="text-slate-350 hover:bg-slate-850/30 transition-colors">
                      <td className="py-3.5 font-medium text-white">{p.name}</td>
                      <td className="py-3.5 text-center">{p.rollNo}</td>
                      <td className="py-3.5 text-center">{p.class}-{p.section}</td>
                      <td className="py-3.5 text-right font-bold text-brand-teal-500">{p.avg}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Performers / At Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-brand-orange-500" />
            Students at Risk (Avg &lt; 50%)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 font-semibold">Student</th>
                  <th className="py-3 font-semibold text-center">Roll No</th>
                  <th className="py-3 font-semibold text-center">Class</th>
                  <th className="py-3 font-semibold text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {lowPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">No students currently at risk</td>
                  </tr>
                ) : (
                  lowPerformers.map(p => (
                    <tr key={p.id} className="text-slate-350 hover:bg-slate-850/30 transition-colors">
                      <td className="py-3.5 font-medium text-white">{p.name}</td>
                      <td className="py-3.5 text-center">{p.rollNo}</td>
                      <td className="py-3.5 text-center">{p.class}-{p.section}</td>
                      <td className="py-3.5 text-right font-bold text-brand-orange-500">{p.avg}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ClipboardList className="h-4.5 w-4.5 text-brand-blue-500" />
          Recent System Actions
        </h3>
        <div className="space-y-3.5">
          {recentLogs.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">No action logs found</div>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="flex items-start justify-between gap-4 p-3 bg-slate-950/40 border border-slate-850 rounded-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">{log.username}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
