'use client'

import { useState, useEffect } from 'react'
import { submitAttendance } from '../actions'
import { 
  ClipboardCheck, Calendar, Check, AlertCircle, 
  HelpCircle, CheckSquare, XSquare, Info, RefreshCw 
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface AttendanceSheetProps {
  classes: ClassData[]
  defaultSectionId: string
  defaultClassId: string
}

interface StudentRow {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  status: string
  remarks: string
}

export function AttendanceSheet({ classes, defaultClassId, defaultSectionId }: AttendanceSheetProps) {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId)
  const [selectedSectionId, setSelectedSectionId] = useState(defaultSectionId)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [isHoliday, setIsHoliday] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      
      // Auto-select first section if current selection is invalid
      if (cls && cls.sections.length > 0) {
        const hasSection = cls.sections.some(s => s.id === selectedSectionId)
        if (!hasSection) {
          setSelectedSectionId(cls.sections[0].id)
        }
      }
    } else {
      setAvailableSections([])
      setSelectedSectionId('')
    }
  }, [selectedClassId, classes])

  // Fetch students on Class, Section, or Date change
  const fetchRoster = async () => {
    if (!selectedSectionId || !selectedDate) {
      setStudents([])
      return
    }
    setLoading(true)
    setMessage('')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/attendance?sectionId=${selectedSectionId}&date=${selectedDate}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        // Detect if this day is already marked as a holiday
        const allHoliday = data.students.length > 0 && data.students.every((s: StudentRow) => s.status === 'HOLIDAY')
        setIsHoliday(allHoliday)
      } else {
        setErrorMsg(data.error || 'Failed to fetch student roster.')
      }
    } catch (err: any) {
      setErrorMsg('Failed to load roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoster()
  }, [selectedSectionId, selectedDate])

  // Toggle holiday mode
  const handleHolidayToggle = (checked: boolean) => {
    setIsHoliday(checked)
    if (checked) {
      setStudents(prev => prev.map(s => ({ ...s, status: 'HOLIDAY' })))
    } else {
      setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })))
    }
  }

  // Update specific student status
  const handleStatusChange = (id: string, status: string) => {
    setStudents(prev => 
      prev.map(s => s.id === id ? { ...s, status } : s)
    )
  }

  // Update specific student remarks
  const handleRemarkChange = (id: string, remarks: string) => {
    setStudents(prev => 
      prev.map(s => s.id === id ? { ...s, remarks } : s)
    )
  }

  // Mark all shortcuts
  const markAll = (status: string) => {
    if (isHoliday) return
    setStudents(prev => 
      prev.map(s => ({ ...s, status }))
    )
  }

  // Save attendance
  const handleSave = async () => {
    if (students.length === 0) return
    setSavePending(true)
    setMessage('')
    setErrorMsg('')

    const records = students.map(s => ({
      studentId: s.id,
      status: s.status,
      remarks: s.remarks
    }))

    try {
      const res = await submitAttendance(selectedDate, records)
      if (res.success) {
        setMessage(`Attendance compiled successfully! Checked ${records.length} profiles.`)
        fetchRoster()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save attendance.')
    } finally {
      setSavePending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector Dashboard Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">Select Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
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
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Holiday Toggle & Quick Bulk Controls */}
        {students.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-850 justify-between">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-white font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHoliday}
                  onChange={(e) => handleHolidayToggle(e.target.checked)}
                  className="rounded border-slate-800 text-brand-teal-500 bg-slate-950 focus:ring-0 focus:ring-offset-0 h-4.5 w-4.5 cursor-pointer"
                />
                Mark Date as Holiday / Sunday
              </label>

              {!isHoliday && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => markAll('PRESENT')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-805 hover:bg-slate-800 text-brand-teal-500 hover:text-brand-teal-400 font-semibold rounded-lg text-xs border border-slate-800 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="h-4 w-4" />
                    All Present
                  </button>
                  <button
                    onClick={() => markAll('ABSENT')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-805 hover:bg-slate-800 text-red-500 hover:text-red-400 font-semibold rounded-lg text-xs border border-slate-800 transition-colors cursor-pointer"
                  >
                    <XSquare className="h-4 w-4" />
                    All Absent
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-xs text-slate-500">
              Roster count: <span className="font-bold text-slate-350">{students.length} students</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Ledger Sheet */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-teal-950/40 border border-teal-900/50 rounded-2xl text-teal-200 text-xs flex items-center gap-2">
          <Check className="h-5 w-5 text-brand-teal-500 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {selectedSectionId && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-teal-500" />
              <span>Loading class roster...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-slate-500 italic text-sm">
              No active students found in the selected section.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                      <th className="py-3 font-semibold text-center w-12">Roll</th>
                      <th className="py-3 font-semibold">Student Name</th>
                      <th className="py-3 font-semibold text-center w-80">Attendance Status</th>
                      <th className="py-3 font-semibold w-64">Remarks / Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="py-4 font-bold text-center text-slate-450">{s.rollNo}</td>
                        <td className="py-4">
                          <div>
                            <span className="font-extrabold text-white block">{s.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{s.admissionNo}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {isHoliday ? (
                            <span className="inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg text-xs tracking-wide uppercase">
                              Holiday / Sunday
                            </span>
                          ) : (
                            <div className="inline-flex p-1 bg-slate-950 border border-slate-850 rounded-2xl gap-1.5">
                              {[
                                { label: 'P', value: 'PRESENT', color: 'peer-checked:bg-brand-teal-600 peer-checked:text-white text-slate-400' },
                                { label: 'A', value: 'ABSENT', color: 'peer-checked:bg-red-600 peer-checked:text-white text-slate-400' },
                                { label: 'HP', value: 'HALF_PRESENT', color: 'peer-checked:bg-amber-600 peer-checked:text-white text-slate-400' },
                                { label: 'OD', value: 'OD', color: 'peer-checked:bg-indigo-600 peer-checked:text-white text-slate-400' }
                              ].map(btn => (
                                <label key={btn.value} className="relative cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${s.id}`}
                                    value={btn.value}
                                    checked={s.status === btn.value}
                                    onChange={() => handleStatusChange(s.id, btn.value)}
                                    className="peer sr-only"
                                  />
                                  <span className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${btn.color} hover:bg-slate-900`}>
                                    {btn.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <input
                            type="text"
                            placeholder={isHoliday ? 'Holiday' : 'e.g. Sick, parent called'}
                            disabled={isHoliday}
                            value={s.remarks || ''}
                            onChange={(e) => handleRemarkChange(s.id, e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs placeholder-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit panel */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-850">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="h-4 w-4 text-slate-550 shrink-0" />
                  <p>
                    {isHoliday 
                      ? 'Roster will be saved as holiday records. School attendance statistics will exclude this date.'
                      : 'Absent marks will automatically trigger simulated parent SMS alerts.'}
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={savePending}
                  className="inline-flex items-center gap-1.5 px-8 py-3 bg-brand-teal-600 hover:bg-brand-teal-505 active:bg-brand-teal-700 disabled:bg-brand-teal-900 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-lg shadow-brand-teal-950/20"
                >
                  {savePending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Attendance Records
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
