'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, Printer, RefreshCw, AlertCircle, Info, 
  ChevronRight, ClipboardCheck, Award, FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface AttendanceReportProps {
  classes: ClassData[]
  defaultClassId: string
  defaultSectionId: string
}

interface StudentAttendanceData {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  attendance: {
    date: string
    status: string
  }[]
}

export function AttendanceReport({ classes, defaultClassId, defaultSectionId }: AttendanceReportProps) {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId)
  const [selectedSectionId, setSelectedSectionId] = useState(defaultSectionId)
  const [reportType, setReportType] = useState<'month' | 'range'>('month')
  
  // Set default month to current month
  const currentYearMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  })

  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [studentsData, setStudentsData] = useState<StudentAttendanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Handle Class Change to load sections
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
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

  // 2. Adjust dates when month picker is used
  useEffect(() => {
    if (reportType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const end = new Date(year, month, 0).toISOString().split('T')[0]
      setStartDate(start)
      setEndDate(end)
    }
  }, [selectedMonth, reportType])

  // 3. Fetch report from API
  const handleFetchReport = async () => {
    if (!selectedSectionId || !startDate || !endDate) {
      setErrorMsg('Please select class, section, and date range.')
      return
    }
    
    setLoading(true)
    setErrorMsg('')
    setStudentsData([])

    try {
      const res = await fetch(`/api/attendance/report?sectionId=${selectedSectionId}&startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      if (json.success) {
        setStudentsData(json.data)
      } else {
        setErrorMsg(json.error || 'Failed to fetch attendance data.')
      }
    } catch (err: any) {
      setErrorMsg('Failed to load attendance report.')
    } finally {
      setLoading(false)
    }
  }

  // Auto fetch on load or when filters change
  useEffect(() => {
    handleFetchReport()
  }, [selectedSectionId, startDate, endDate])

  // Helper selectors
  const getClassName = () => classes.find(c => c.id === selectedClassId)?.name || ''
  const getSectionName = () => availableSections.find(s => s.id === selectedSectionId)?.name || ''

  // Compute unique active dates where attendance was recorded (Working Days)
  const uniqueWorkingDates = Array.from(
    new Set(studentsData.flatMap(s => s.attendance.map(a => a.date)))
  ).sort()
  
  const totalWorkingDays = uniqueWorkingDates.length

  // Calculate statistics for each student
  const studentSummaries = studentsData.map(s => {
    const present = s.attendance.filter(a => a.status === 'PRESENT').length
    const absent = s.attendance.filter(a => a.status === 'ABSENT').length
    const leave = s.attendance.filter(a => a.status === 'LEAVE' || a.status === 'MEDICAL').length
    const percentage = totalWorkingDays > 0 ? (present / totalWorkingDays) * 100 : 100
    
    return {
      ...s,
      present,
      absent,
      leave,
      percentage
    }
  })

  // Class-wide average attendance
  const averageAttendance = studentSummaries.length > 0
    ? (studentSummaries.reduce((sum, s) => sum + s.percentage, 0) / studentSummaries.length).toFixed(1)
    : '0.0'

  // Excel Exporter for attendance report
  const handleExportExcel = () => {
    if (studentSummaries.length === 0) {
      alert('No data to export.')
      return
    }

    const excelRows = studentSummaries.map(s => {
      const row: any = {
        'Roll No': s.rollNo,
        'Student Name': s.name,
        'Admission No': s.admissionNo,
        'Total Working Days': totalWorkingDays,
        'Days Present': s.present,
        'Days Absent': s.absent,
        'Days on Leave': s.leave,
        'Attendance %': `${s.percentage.toFixed(1)}%`
      }

      // If daily details fit, add columns for each date
      if (totalWorkingDays <= 31) {
        uniqueWorkingDates.forEach(date => {
          const record = s.attendance.find(a => a.date === date)
          const dayNum = date.split('-')[2]
          row[`Day ${dayNum} (${date})`] = record ? record.status : 'N/A'
        })
      }

      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report')

    // Auto-fit column widths
    const maxLens = Object.keys(excelRows[0]).map(key => {
      let maxLen = key.length
      excelRows.forEach(row => {
        const valStr = String((row as any)[key] || '')
        if (valStr.length > maxLen) {
          maxLen = valStr.length
        }
      })
      return { wch: maxLen + 2 }
    })
    worksheet['!cols'] = maxLens

    XLSX.writeFile(workbook, `Attendance_Report_Class_${getClassName()}_Sec_${getSectionName()}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* 1. Selection Controls Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
            <label className="text-xs font-semibold text-slate-400">Section</label>
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

          {/* Report Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Period Selection Method</label>
            <div className="flex bg-slate-955 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setReportType('month')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reportType === 'month' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-205'
                }`}
              >
                Single Month
              </button>
              <button
                type="button"
                onClick={() => setReportType('range')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reportType === 'range' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-205'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Date Picker Controls based on type */}
          <div className="space-y-1.5">
            {reportType === 'month' ? (
              <>
                <label className="text-xs font-semibold text-slate-400">Choose Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full px-4 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
                />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-2 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-2 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Error Display */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-xs flex items-center gap-2 print:hidden">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* 3. Report Results Dashboard */}
      {selectedSectionId && (
        <div className="space-y-6">
          {/* Summary Stat Cards - Hidden on Print */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
              <div className="p-3 bg-brand-teal-500/10 rounded-xl border border-brand-teal-500/20 shrink-0">
                <ClipboardCheck className="h-5 w-5 text-brand-teal-500" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Class / Section</span>
                <span className="text-base font-black text-white">{getClassName()} - Section {getSectionName()}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
              <div className="p-3 bg-brand-blue-500/10 rounded-xl border border-brand-blue-500/20 shrink-0">
                <Calendar className="h-5 w-5 text-brand-blue-500" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">School Working Days</span>
                <span className="text-base font-black text-white">{totalWorkingDays} days in period</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
              <div className="p-3 bg-brand-orange-500/10 rounded-xl border border-brand-orange-500/20 shrink-0">
                <Award className="h-5 w-5 text-brand-orange-500" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Attendance</span>
                <span className="text-base font-black text-white">{averageAttendance}%</span>
              </div>
            </div>
          </div>

          {/* Roster & Grid Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl print:bg-white print:border-none print:shadow-none print:p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm print:hidden">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-teal-500" />
                <span>Generating attendance report...</span>
              </div>
            ) : studentsData.length === 0 ? (
              <div className="py-20 text-center text-slate-500 italic text-sm print:hidden">
                No active student attendance logs found for this period.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Printable Header */}
                <div className="hidden print:block text-black text-center border-b-2 border-black pb-4 mb-6 space-y-1">
                  <h2 className="text-2xl font-bold uppercase tracking-wider">PM SHRI Kendriya Vidyalaya Mahuldiha</h2>
                  <h3 className="text-sm font-bold uppercase text-slate-700">Official Student Attendance Register Ledger</h3>
                  <div className="grid grid-cols-4 text-xs font-semibold pt-4 text-left gap-y-1">
                    <div>Class Grade: <span className="font-bold">{getClassName()}</span></div>
                    <div>Section: <span className="font-bold">Section {getSectionName()}</span></div>
                    <div>Period: <span className="font-bold">{startDate} to {endDate}</span></div>
                    <div>Total Working Days: <span className="font-bold">{totalWorkingDays}</span></div>
                  </div>
                </div>

                {/* Day-by-day detailed matrix layout if range <= 31 days */}
                {totalWorkingDays <= 31 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse print:text-black">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider print:border-black print:text-black font-bold">
                          <th className="py-3 px-1 text-center w-8 border border-slate-850 print:border-black">Roll</th>
                          <th className="py-3 px-2 w-44 border border-slate-850 print:border-black">Student Name</th>
                          {/* Render date headers showing just the day number */}
                          {uniqueWorkingDates.map(date => {
                            const dayNum = date.split('-')[2]
                            return (
                              <th 
                                key={date} 
                                className="py-3 text-center border border-slate-850 print:border-black w-6 text-[10px]"
                                title={date}
                              >
                                {dayNum}
                              </th>
                            )
                          })}
                          <th className="py-3 px-1 text-center w-10 border border-slate-850 print:border-black text-brand-teal-500 print:text-black">P</th>
                          <th className="py-3 px-1 text-center w-10 border border-slate-850 print:border-black text-red-450 print:text-black">A</th>
                          <th className="py-3 px-1 text-center w-10 border border-slate-850 print:border-black text-brand-orange-500 print:text-black">L</th>
                          <th className="py-3 px-2 text-center w-16 border border-slate-850 print:border-black font-extrabold">Pct</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 print:divide-black">
                        {studentSummaries.map(s => (
                          <tr key={s.id} className="hover:bg-slate-850/20 print:hover:bg-transparent text-slate-300 print:text-black">
                            <td className="py-2 px-1 text-center font-bold border border-slate-850 print:border-black">{s.rollNo}</td>
                            <td className="py-2 px-2 font-extrabold text-white print:text-black border border-slate-850 print:border-black truncate max-w-[176px]">{s.name}</td>
                            
                            {/* Render daily checks */}
                            {uniqueWorkingDates.map(date => {
                              const record = s.attendance.find(a => a.date === date)
                              let display = '-'
                              let colorClass = 'text-slate-600'
                              
                              if (record) {
                                if (record.status === 'PRESENT') {
                                  display = 'P'
                                  colorClass = 'text-brand-teal-500 font-bold'
                                } else if (record.status === 'ABSENT') {
                                  display = 'A'
                                  colorClass = 'text-red-500 font-bold'
                                } else if (record.status === 'LEAVE' || record.status === 'MEDICAL') {
                                  display = 'L'
                                  colorClass = 'text-brand-orange-500 font-bold'
                                }
                              }
                              
                              return (
                                <td 
                                  key={date} 
                                  className={`py-2 text-center border border-slate-850 print:border-black text-[9px] ${colorClass}`}
                                >
                                  {display}
                                </td>
                              )
                            })}
                            
                            <td className="py-2 px-1 text-center border border-slate-850 print:border-black font-bold text-brand-teal-500 print:text-black">{s.present}</td>
                            <td className="py-2 px-1 text-center border border-slate-850 print:border-black font-bold text-red-500 print:text-black">{s.absent}</td>
                            <td className="py-2 px-1 text-center border border-slate-850 print:border-black font-bold text-brand-orange-500 print:text-black">{s.leave}</td>
                            <td className="py-2 px-2 text-center border border-slate-850 print:border-black font-black text-white print:text-black">
                              {s.percentage.toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Summary Roster View for wide custom ranges */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse print:text-black">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-450 uppercase text-xs tracking-wider print:border-black print:text-black font-bold">
                          <th className="py-3 px-3 text-center w-16 border border-slate-850 print:border-black">Roll</th>
                          <th className="py-3 px-3 border border-slate-850 print:border-black">Admission No</th>
                          <th className="py-3 px-4 border border-slate-850 print:border-black">Student Name</th>
                          <th className="py-3 px-3 text-center border border-slate-850 print:border-black">Working Days</th>
                          <th className="py-3 px-3 text-center border border-slate-850 print:border-black text-brand-teal-500 print:text-black">Days Present</th>
                          <th className="py-3 px-3 text-center border border-slate-850 print:border-black text-red-450 print:text-black">Days Absent</th>
                          <th className="py-3 px-3 text-center border border-slate-850 print:border-black text-brand-orange-500 print:text-black">Days on Leave</th>
                          <th className="py-3 px-4 text-center border border-slate-850 print:border-black font-extrabold">Attendance Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 print:divide-black">
                        {studentSummaries.map(s => (
                          <tr key={s.id} className="hover:bg-slate-850/20 print:hover:bg-transparent text-slate-300 print:text-black">
                            <td className="py-3 px-3 text-center font-bold border border-slate-850 print:border-black">{s.rollNo}</td>
                            <td className="py-3 px-3 font-mono text-xs border border-slate-850 print:border-black">{s.admissionNo}</td>
                            <td className="py-3 px-4 font-extrabold text-white print:text-black border border-slate-850 print:border-black">{s.name}</td>
                            <td className="py-3 px-3 text-center border border-slate-850 print:border-black">{totalWorkingDays}</td>
                            <td className="py-3 px-3 text-center border border-slate-850 print:border-black font-bold text-brand-teal-500 print:text-black">{s.present}</td>
                            <td className="py-3 px-3 text-center border border-slate-850 print:border-black font-bold text-red-500 print:text-black">{s.absent}</td>
                            <td className="py-3 px-3 text-center border border-slate-850 print:border-black font-bold text-brand-orange-500 print:text-black">{s.leave}</td>
                            <td className="py-3 px-4 text-center border border-slate-850 print:border-black font-black text-white print:text-black">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs border ${
                                s.percentage >= 75 
                                  ? 'bg-brand-teal-500/10 text-brand-teal-500 border-brand-teal-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              } print:border-none print:bg-transparent print:p-0`}>
                                {s.percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Print Signatures - Visible only on Print */}
                <div className="hidden print:grid grid-cols-3 gap-12 pt-20 text-center text-xs font-bold">
                  <div className="border-t border-black pt-2">Class Teacher Signature</div>
                  <div className="border-t border-black pt-2">Verifying Officer Signature</div>
                  <div className="border-t border-black pt-2">Principal Signature</div>
                </div>

                {/* Browser Actions Panel */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-850 print:hidden">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info className="h-4 w-4 text-slate-550 shrink-0" />
                    <p>Legend: P = Present | A = Absent | L = Leave / Medical. Click Print to download official A4 ledger.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-855 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-brand-teal-500" />
                      Export Spreadsheet
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-brand-teal-950/20"
                    >
                      <Printer className="h-4 w-4" />
                      Print Attendance Register
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
