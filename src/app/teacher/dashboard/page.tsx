import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { 
  Users, ClipboardCheck, Award, FileSpreadsheet, 
  ArrowRight, School, UserPlus, Info, CheckCircle2, AlertCircle 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // 1. Find if teacher is class teacher of any section
  const section = await db.section.findFirst({
    where: { classTeacherId: user.id },
    include: { class: true }
  })

  // 2. Fetch all students in the assigned section, or fallback to first section in database
  let targetSection = section
  if (!targetSection) {
    targetSection = await db.section.findFirst({
      include: { class: true },
      orderBy: { class: { name: 'asc' } }
    })
  }

  let students: any[] = []
  let attendanceRate = 100
  let studentCount = 0

  if (targetSection) {
    students = await db.student.findMany({
      where: { 
        sectionId: targetSection.id,
        status: 'ACTIVE'
      },
      orderBy: { rollNo: 'asc' }
    })
    studentCount = students.length

    // Today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch today's attendance logs for this section's students
    const todayLogs = await db.attendance.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        date: today
      }
    })

    const validLogs = todayLogs.filter(l => l.status !== 'HOLIDAY')
    const presentCount = validLogs.reduce((acc, l) => {
      if (l.status === 'PRESENT' || l.status === 'OD') return acc + 1
      if (l.status === 'HALF_PRESENT') return acc + 0.5
      return acc
    }, 0)
    attendanceRate = validLogs.length > 0 
      ? Math.round((presentCount / validLogs.length) * 100)
      : 100
  }

  // Quick Action list
  const actions = [
    { title: 'Take Daily Attendance', desc: 'Mark present/absent checklist', href: '/teacher/attendance', icon: ClipboardCheck, color: 'text-brand-teal-500 bg-brand-teal-500/10 border-brand-teal-500/20 hover:border-brand-teal-500/50' },
    { title: 'Enter Exam Marks', desc: 'Grade subjects manually or via Excel', href: '/teacher/marks', icon: Award, color: 'text-brand-blue-500 bg-brand-blue-500/10 border-brand-blue-600/20 hover:border-brand-blue-500/50' },
    { title: 'Register Student', desc: 'Register a student profile & upload photo', href: '/teacher/students/add', icon: UserPlus, color: 'text-brand-orange-500 bg-brand-orange-500/10 border-brand-orange-500/20 hover:border-brand-orange-500/50' },
    { title: 'Excel Bulk Import', desc: 'Upload spreadsheet of student rosters', href: '/teacher/students/import', icon: FileSpreadsheet, color: 'text-slate-350 bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50' },
  ]

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-sm text-slate-400">Class management portal and action center</p>
        </div>
      </div>

      {/* Class Designation Callout */}
      {section ? (
        <div className="p-4 bg-brand-teal-600/10 border border-brand-teal-500/20 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-teal-600/20 rounded-2xl text-brand-teal-500 shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Class Teacher Designation</span>
              <span className="font-extrabold text-white text-sm">Assigned Class: {section.class.name} - Section {section.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <div>
              Students: <span className="text-brand-teal-500">{studentCount}</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              Today's Attendance: <span className="text-brand-teal-500">{attendanceRate}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-brand-orange-500/10 border border-brand-orange-500/20 rounded-3xl flex items-center gap-3">
          <Info className="h-5 w-5 text-brand-orange-500 shrink-0" />
          <p className="text-xs text-slate-300">
            You are currently not assigned as a Class Teacher. You can still use the system to manage subjects, upload marks, register students, and take attendance for any class level.
          </p>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map(act => {
          const Icon = act.icon
          return (
            <Link 
              key={act.title}
              href={act.href}
              className={`p-5 rounded-3xl border text-left flex flex-col justify-between h-40 transition-all cursor-pointer group ${act.color}`}
            >
              <div className="p-2.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-white transition-colors">{act.title}</h4>
                <p className="text-xs text-slate-450 mt-1 leading-normal">{act.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Roster / Roster Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {targetSection ? `${targetSection.class.name} - Section ${targetSection.name} Roster` : 'Student Roster'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Directory of students enrolled in this section</p>
          </div>
          <Link
            href="/teacher/students"
            className="inline-flex items-center text-xs font-bold text-brand-teal-500 hover:text-brand-teal-400 transition-colors"
          >
            Open Student Directory
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">Roll No</th>
                <th className="py-3 font-semibold">Admission No</th>
                <th className="py-3 font-semibold">Student Name</th>
                <th className="py-3 font-semibold text-center">Gender</th>
                <th className="py-3 font-semibold text-center">House</th>
                <th className="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">No student records found in this section.</td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                    <td className="py-3.5 font-bold text-slate-450 text-xs">{s.rollNo}</td>
                    <td className="py-3.5 font-mono text-slate-400 text-xs">{s.admissionNo}</td>
                    <td className="py-3.5 font-extrabold text-white">{s.name}</td>
                    <td className="py-3.5 text-center text-xs">{s.gender}</td>
                    <td className="py-3.5 text-center">
                      {s.house ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          s.house === 'Shivaji' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          s.house === 'Ashoka' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          s.house === 'Raman' ? 'bg-yellow-500/10 text-yellow-450 border-yellow-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {s.house}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right space-x-3">
                      <Link 
                        href={`/teacher/students/${s.id}/analytics`}
                        className="text-xs font-bold text-brand-teal-500 hover:text-brand-teal-400 transition-colors cursor-pointer"
                      >
                        Analytics
                      </Link>
                      <Link 
                        href={`/teacher/students/${s.id}/report`}
                        className="text-xs font-bold text-brand-blue-500 hover:text-brand-blue-400 transition-colors cursor-pointer"
                      >
                        Report Card
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
