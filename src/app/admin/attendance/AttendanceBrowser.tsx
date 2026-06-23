'use client'

import { useState, useEffect, useTransition } from 'react'
import { getDailyAttendanceLogs } from '../actions'
import { 
  Calendar, Users, RefreshCw, CheckCircle2, XCircle, 
  AlertTriangle, ShieldCheck, Search, Info, HelpCircle
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface AttendanceLog {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  status: string
  remarks: string
}

interface AttendanceBrowserProps {
  classes: ClassData[]
}

export function AttendanceBrowser({ classes }: AttendanceBrowserProps) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isPending, startTransition] = useTransition()

  // Sync sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      if (cls && cls.sections.length > 0) {
        setSelectedSectionId(cls.sections[0].id)
      } else {
        setSelectedSectionId('')
      }
    } else {
      setAvailableSections([])
      setSelectedSectionId('')
      setAttendanceLogs([])
    }
  }, [selectedClassId, classes])

  // Fetch daily attendance logs when section or date changes
  useEffect(() => {
    if (!selectedSectionId || !selectedDate) {
      setAttendanceLogs([])
      return
    }

    startTransition(async () => {
      try {
        const data = await getDailyAttendanceLogs(selectedSectionId, selectedDate)
        setAttendanceLogs(data)
      } catch (err) {
        alert('Failed to load daily attendance logs.')
      }
    })
  }, [selectedSectionId, selectedDate])

  // Search filter
  const filteredLogs = attendanceLogs.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculations
  const totalStudents = attendanceLogs.length
  const presentCount = attendanceLogs.filter(l => l.status === 'PRESENT').length
  const absentCount = attendanceLogs.filter(l => l.status === 'ABSENT').length
  const halfPresentCount = attendanceLogs.filter(l => l.status === 'HALF_PRESENT').length
  const odCount = attendanceLogs.filter(l => l.status === 'OD').length
  const holidayCount = attendanceLogs.filter(l => l.status === 'HOLIDAY').length
  const unmarkedCount = attendanceLogs.filter(l => l.status === 'UNMARKED').length

  const hasUnmarked = unmarkedCount > 0
  const isAllHoliday = totalStudents > 0 && holidayCount === totalStudents

  // Attendance rate formula: (PRESENT + OD + 0.5 * HALF_PRESENT) / (TOTAL - HOLIDAY)
  const denominator = totalStudents - holidayCount
  let attendanceRate = 0
  if (denominator > 0) {
    attendanceRate = Math.round(((presentCount + odCount + 0.5 * halfPresentCount) / denominator) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Selection Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Class Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">Select Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassId}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900 text-white">Select Section...</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">Section {s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Ledger Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            />
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Search Filter</label>
            <div className="relative">
              <input
                type="text"
                disabled={!selectedSectionId}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll no..."
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Content */}
      {selectedSectionId && (
        <div className="space-y-6">
          {isPending ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm shadow-xl">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-blue-500" />
              <span>Querying daily attendance ledger...</span>
            </div>
          ) : totalStudents === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl py-20 text-center text-slate-500 italic text-sm shadow-xl">
              No active students configured in this section yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Attendance Stats */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                  <h3 className="font-extrabold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-brand-blue-500" />
                    Daily Attendance Summary
                  </h3>

                  {/* Attendance Rate Dial / Meter */}
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-950/20 border border-slate-850 rounded-2xl p-4">
                    {isAllHoliday ? (
                      <div className="text-center space-y-1">
                        <span className="inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black rounded-full text-[10px] tracking-wide uppercase">
                          School Holiday
                        </span>
                        <div className="text-3xl font-black text-white pt-2">HOLIDAY</div>
                        <p className="text-xs text-slate-500 font-medium">Exchanged from daily statistics</p>
                      </div>
                    ) : hasUnmarked ? (
                      <div className="text-center space-y-1">
                        <span className="inline-flex px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black rounded-full text-[10px] tracking-wide uppercase">
                          Unmarked Ledger
                        </span>
                        <div className="text-3xl font-black text-slate-400 pt-2">{unmarkedCount} Left</div>
                        <p className="text-xs text-slate-500 font-medium">Attendance not saved/completed</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        {/* Attendance Percentage Ring */}
                        <div className="relative h-28 w-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="56"
                              cy="56"
                              r="48"
                              className="stroke-slate-800"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="56"
                              cy="56"
                              r="48"
                              className={`transition-all duration-500 ${
                                attendanceRate >= 85 ? 'stroke-brand-teal-500' :
                                attendanceRate >= 75 ? 'stroke-brand-blue-500' :
                                'stroke-red-500'
                              }`}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 48}
                              strokeDashoffset={2 * Math.PI * 48 * (1 - attendanceRate / 100)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{attendanceRate}%</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Attendance</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stat Breakdown Roster */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        Total Active Students
                      </span>
                      <span className="font-extrabold text-white">{totalStudents}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-teal-500" />
                        Present
                      </span>
                      <span className="font-extrabold text-brand-teal-400">{presentCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                        On Duty (OD)
                      </span>
                      <span className="font-extrabold text-indigo-400">{odCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Half Present
                      </span>
                      <span className="font-extrabold text-amber-400">{halfPresentCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Absent
                      </span>
                      <span className="font-extrabold text-red-400">{absentCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                      <span className="text-slate-400 font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        Holiday / Sunday
                      </span>
                      <span className="font-extrabold text-purple-400">{holidayCount}</span>
                    </div>

                    {unmarkedCount > 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-amber-950/10 border border-amber-900/20 rounded-xl">
                        <span className="text-amber-400 font-semibold flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Unmarked Records
                        </span>
                        <span className="font-black text-amber-400">{unmarkedCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl text-[10px] text-slate-500 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Formula</strong>: Rate = (Present + OD + 0.5 * Half) / (Total - Holiday). On-Duty (OD) is computed as fully present (1.0 weight) without triggering alert notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Roster Logs Table */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-sm">Attendance Register Ledger</h3>
                    <span className="text-xs text-slate-400">Shown: {filteredLogs.length} profiles</span>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 italic text-sm">
                      No matching student records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider">
                            <th className="py-3 font-semibold text-center w-12">Roll</th>
                            <th className="py-3 font-semibold">Student Profile</th>
                            <th className="py-3 font-semibold text-center w-32">Status</th>
                            <th className="py-3 font-semibold">Remarks / Explanation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredLogs.map(student => (
                            <tr key={student.id} className="hover:bg-slate-850/20 text-slate-350 transition-colors">
                              <td className="py-3.5 font-bold text-center text-slate-450">{student.rollNo}</td>
                              <td className="py-3.5">
                                <div>
                                  <span className="font-extrabold text-white block">{student.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{student.admissionNo}</span>
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  student.status === 'PRESENT' ? 'bg-brand-teal-500/10 text-brand-teal-400 border-brand-teal-500/20' :
                                  student.status === 'ABSENT' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  student.status === 'HALF_PRESENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  student.status === 'OD' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  student.status === 'HOLIDAY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  'bg-slate-800 text-slate-450 border-slate-700'
                                }`}>
                                  {student.status === 'PRESENT' ? 'Present' :
                                   student.status === 'ABSENT' ? 'Absent' :
                                   student.status === 'HALF_PRESENT' ? 'Half Present' :
                                   student.status === 'OD' ? 'On Duty' :
                                   student.status === 'HOLIDAY' ? 'Holiday' :
                                   'Unmarked'}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-400 italic font-medium">
                                {student.remarks || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roster Unselected Placeholder */}
      {!selectedSectionId && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl py-24 text-center text-slate-500 shadow-xl space-y-3 flex flex-col items-center">
          <Calendar className="h-10 w-10 text-slate-700 animate-pulse" />
          <h4 className="font-bold text-slate-400">Class Selection Required</h4>
          <p className="text-xs text-slate-500 max-w-sm">Please select a Class Grade and Section above to display the daily attendance ledger and statistics.</p>
        </div>
      )}
    </div>
  )
}
