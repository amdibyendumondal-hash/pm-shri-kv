'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { submitMarks } from '../actions'
import { 
  Award, FileCheck, Check, AlertCircle, Info, 
  Upload, Save, RefreshCw, HelpCircle, Columns, Printer
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface ExamData {
  id: string
  name: string
  academicYear: string
  maxMarks: number
  passMarks: number
  classId: string
}

interface SubjectData {
  id: string
  name: string
  code: string
}

interface MarksSheetProps {
  classes: ClassData[]
  exams: ExamData[]
  subjects: SubjectData[]
  defaultClassId: string
  defaultSectionId: string
}

interface StudentRow {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  marksObtained: number | ''
  grade: string
  remarks: string
}

export function MarksSheet({ classes, exams, subjects, defaultClassId, defaultSectionId }: MarksSheetProps) {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId)
  const [selectedSectionId, setSelectedSectionId] = useState(defaultSectionId)
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [availableExams, setAvailableExams] = useState<ExamData[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  
  const [loading, setLoading] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Selected Exam Max Marks and Passing Marks metadata
  const currentExam = exams.find(e => e.id === selectedExamId)

  // 1. Load sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      
      // Filter exams for this class
      const classExams = exams.filter(e => e.classId === selectedClassId)
      setAvailableExams(classExams)

      // Auto select first section
      if (cls && cls.sections.length > 0) {
        const hasSection = cls.sections.some(s => s.id === selectedSectionId)
        if (!hasSection) {
          setSelectedSectionId(cls.sections[0].id)
        }
      }
      // Auto select first exam
      if (classExams.length > 0) {
        const hasExam = classExams.some(e => e.id === selectedExamId)
        if (!hasExam) {
          setSelectedExamId(classExams[0].id)
        }
      } else {
        setSelectedExamId('')
      }
    } else {
      setAvailableSections([])
      setAvailableExams([])
      setSelectedSectionId('')
      setSelectedExamId('')
    }
  }, [selectedClassId, classes, exams])

  // 2. Fetch marks roster
  const fetchMarksRoster = async () => {
    if (!selectedSectionId || !selectedExamId || !selectedSubjectId) {
      setStudents([])
      return
    }
    setLoading(true)
    setMessage('')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/marks?sectionId=${selectedSectionId}&examId=${selectedExamId}&subjectId=${selectedSubjectId}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
      } else {
        setErrorMsg(data.error || 'Failed to fetch student marks.')
      }
    } catch (err: any) {
      setErrorMsg('Failed to load marks roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarksRoster()
  }, [selectedSectionId, selectedExamId, selectedSubjectId])

  // Automatic Grade calculation helper
  const calculateGrade = (score: number, max: number) => {
    const pct = (score / max) * 100
    if (pct >= 90) return 'A1'
    if (pct >= 80) return 'A2'
    if (pct >= 70) return 'B1'
    if (pct >= 60) return 'B2'
    if (pct >= 50) return 'C1'
    if (pct >= 40) return 'C2'
    if (pct >= 33) return 'D'
    return 'E'
  }

  // Update marks and recalculate grade
  const handleMarksChange = (id: string, value: string) => {
    const numericVal = value === '' ? '' : parseFloat(value)
    if (numericVal !== '' && isNaN(numericVal)) return
    
    // Check upper limit
    if (currentExam && numericVal !== '' && numericVal > currentExam.maxMarks) {
      alert(`Obtained marks cannot exceed exam maximum marks (${currentExam.maxMarks})`)
      return
    }

    setStudents(prev => 
      prev.map(s => {
        if (s.id === id) {
          const grade = numericVal === '' ? '' : calculateGrade(numericVal, currentExam?.maxMarks || 100)
          return { ...s, marksObtained: numericVal, grade }
        }
        return s
      })
    )
  }

  const handleRemarkChange = (id: string, remarks: string) => {
    setStudents(prev => 
      prev.map(s => s.id === id ? { ...s, remarks } : s)
    )
  }

  // Excel Bulk Marks Upload Parser
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentExam) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet)

        if (rows.length === 0) {
          alert('Excel file is empty.')
          return
        }

        // Map columns
        // Expecting keys like: "Roll No" or "rollNo", "Marks" or "marksObtained", "Remarks"
        let matchedCount = 0
        const updatedStudents = students.map(s => {
          // Find matching row in excel
          const matchedRow = rows.find(r => 
            String(r['Roll No'] || r['rollNo'] || r['RollNo']).trim() === String(s.rollNo).trim() ||
            String(r['Student Name'] || r['Name'] || r['studentName']).trim().toLowerCase() === s.name.toLowerCase()
          )

          if (matchedRow) {
            const rawMarks = matchedRow['Marks Obtained'] || matchedRow['marksObtained'] || matchedRow['Marks'] || matchedRow['marks']
            const remarksVal = matchedRow['Remarks'] || matchedRow['remarks'] || ''

            const marksObtained = rawMarks !== undefined && rawMarks !== '' ? parseFloat(rawMarks) : ''
            
            if (marksObtained !== '' && !isNaN(marksObtained) && marksObtained <= currentExam.maxMarks) {
              const grade = calculateGrade(marksObtained, currentExam.maxMarks)
              matchedCount++
              return { 
                ...s, 
                marksObtained, 
                grade, 
                remarks: remarksVal 
              }
            }
          }
          return s
        })

        setStudents(updatedStudents)
        alert(`Successfully parsed spreadsheet! Matched and updated marks for ${matchedCount} students. Click "Save Marks Records" below to commit changes to database.`)
      } catch (err) {
        alert('Failed to parse marks sheet. Ensure it has "Roll No" and "Marks" columns.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Save marks
  const handleSave = async () => {
    if (students.length === 0 || !currentExam || !selectedSubjectId) return
    setSavePending(true)
    setMessage('')
    setErrorMsg('')

    // Format score objects. Exclude blank values or alert
    const scores = students.map(s => ({
      studentId: s.id,
      marksObtained: s.marksObtained === '' ? 0 : s.marksObtained,
      remarks: s.remarks
    }))

    try {
      const res = await submitMarks(selectedExamId, selectedSubjectId, scores)
      if (res.success) {
        setMessage('Exam grades compiled and saved successfully!')
        fetchMarksRoster()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save marks.')
    } finally {
      setSavePending(false)
    }
  }

  // Cohort stats calculations for printing
  const getClassName = () => classes.find(c => c.id === selectedClassId)?.name || ''
  const getSectionName = () => availableSections.find(s => s.id === selectedSectionId)?.name || ''
  const getSubjectName = () => subjects.find(s => s.id === selectedSubjectId)?.name || ''
  const getExamName = () => currentExam?.name || ''
  const getAcademicYear = () => currentExam?.academicYear || ''

  const appearedStudents = students.filter(s => s.marksObtained !== '')
  const totalAppeared = appearedStudents.length
  const totalPassed = appearedStudents.filter(s => {
    if (currentExam) {
      return (s.marksObtained as number) >= currentExam.passMarks
    }
    return false
  }).length
  const passingPercentage = totalAppeared > 0 ? ((totalPassed / totalAppeared) * 100).toFixed(1) : '0.0'

  const maxMarks = currentExam?.maxMarks || 100
  const getPct = (score: number) => (score / maxMarks) * 100

  const bracket1 = appearedStudents.filter(s => getPct(s.marksObtained as number) < 33).length
  const bracket2 = appearedStudents.filter(s => {
    const p = getPct(s.marksObtained as number)
    return p >= 33 && p < 45
  }).length
  const bracket3 = appearedStudents.filter(s => {
    const p = getPct(s.marksObtained as number)
    return p >= 45 && p < 60
  }).length
  const bracket4 = appearedStudents.filter(s => {
    const p = getPct(s.marksObtained as number)
    return p >= 60 && p < 75
  }).length
  const bracket5 = appearedStudents.filter(s => getPct(s.marksObtained as number) >= 75).length

  return (
    <div className="space-y-6">
      {/* Interactive Screen View - Hiddin in Print */}
      <div className="print:hidden space-y-6">
        {/* Selection Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Exam Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Exam</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Select Exam...</option>
                {availableExams.map(e => (
                  <option key={e.id} value={e.id} className="bg-slate-900 text-white">{e.name} ({e.academicYear})</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Select Subject...</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Exam Details and Excel Marks Import shortcut */}
          {selectedSubjectId && selectedExamId && students.length > 0 && currentExam && (
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-850 justify-between">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div>
                  Max Marks: <span className="font-bold text-brand-teal-500">{currentExam.maxMarks}</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <div>
                  Pass Marks: <span className="font-bold text-brand-orange-500">{currentExam.passMarks}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Excel Format Help Tooltip */}
                <div className="relative group">
                  <button
                    type="button"
                    className="p-2 bg-slate-805 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Spreadsheet column guide"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 bottom-full mb-2.5 hidden group-hover:block w-72 p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl text-[10px] text-slate-305 space-y-2.5 z-30 pointer-events-none">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-850 pb-1.5">
                      <Columns className="h-3.5 w-3.5 text-brand-teal-500" />
                      Excel Formatting Guide
                    </p>
                    <p className="leading-relaxed">To bulk upload student marks, upload a spreadsheet (.xlsx, .xls, or .csv) containing the following columns:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li><strong className="text-white">Roll No</strong> (or <code className="text-brand-teal-400">rollNo</code>)</li>
                      <li><strong className="text-white">Marks</strong> (or <code className="text-brand-teal-400">marksObtained</code> / <code className="text-brand-teal-400">Marks Obtained</code>)</li>
                      <li><strong className="text-white">Remarks</strong> (Optional)</li>
                    </ul>
                    <p className="text-slate-500 leading-relaxed pt-1.5 border-t border-slate-850">Note: Students can also be matched by their name if the Roll No column is missing.</p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    id="excel-marks-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-marks-upload"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-805 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Bulk Import Marks via Excel
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Roster Entries Table */}
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

        {selectedSubjectId && selectedExamId && selectedSectionId && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-teal-500" />
                <span>Loading class roster...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-slate-500 italic text-sm">
                No students found in the selected section.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                        <th className="py-3 font-semibold text-center w-12">Roll</th>
                        <th className="py-3 font-semibold">Student Name</th>
                        <th className="py-3 font-semibold text-center w-36">Obtained Marks</th>
                        <th className="py-3 font-semibold text-center w-28">Auto Grade</th>
                        <th className="py-3 font-semibold">Remarks / Teacher Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {students.map(s => {
                        const isFail = s.marksObtained !== '' && currentExam && s.marksObtained < currentExam.passMarks
                        return (
                          <tr key={s.id} className="hover:bg-slate-850/20 transition-colors">
                            <td className="py-4 font-bold text-center text-slate-450">{s.rollNo}</td>
                            <td className="py-4">
                              <div>
                                <span className="font-extrabold text-white block">{s.name}</span>
                                <span className="text-[10px] text-slate-505 font-mono">{s.admissionNo}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  max={currentExam?.maxMarks || 100}
                                  step="0.5"
                                  value={s.marksObtained}
                                  onChange={(e) => handleMarksChange(s.id, e.target.value)}
                                  className={`w-24 px-3 py-1.5 bg-slate-955 border rounded-xl text-center font-bold text-sm outline-none ${
                                    isFail ? 'border-red-900 focus:border-red-500 text-red-400 bg-red-950/10' : 'border-slate-800 focus:border-brand-teal-500 text-white'
                                  }`}
                                  placeholder={`0-${currentExam?.maxMarks || 100}`}
                                />
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <span className={`inline-flex px-3 py-1 border rounded-lg font-black text-xs ${
                                s.grade === 'E' 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                  : s.grade.startsWith('A')
                                  ? 'bg-brand-teal-500/10 text-brand-teal-500 border-brand-teal-500/20'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {s.grade || '-'}
                              </span>
                            </td>
                            <td className="py-4">
                              <input
                                type="text"
                                placeholder="e.g. Excellent, regular attendee"
                                value={s.remarks}
                                onChange={(e) => handleRemarkChange(s.id, e.target.value)}
                                className="w-full px-4 py-1.5 bg-slate-955 border border-slate-850 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs placeholder-slate-700"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Submit / Action panel */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-850">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info className="h-4 w-4 text-slate-550 shrink-0" />
                    <p>Passing Threshold: {currentExam?.passMarks || 0} marks ({currentExam ? Math.round(currentExam.passMarks / currentExam.maxMarks * 100) : 0}%). Auto Grade is computed instantly.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-855 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      Print Marks Summary
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={savePending}
                      className="inline-flex items-center gap-1.5 px-8 py-3 bg-brand-teal-600 hover:bg-brand-teal-505 active:bg-brand-teal-700 disabled:bg-brand-teal-900 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-lg shadow-brand-teal-950/20"
                    >
                      {savePending ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Marks Records
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Print-Only Layout */}
      {selectedSubjectId && selectedExamId && selectedSectionId && students.length > 0 && (
        <div className="hidden print:block text-black p-6 bg-white space-y-6">
          <div className="text-center border-b-2 border-black pb-4 space-y-1">
            <h2 className="text-2xl font-bold uppercase tracking-wider">PM SHRI Kendriya Vidyalaya Mahuldiha</h2>
            <h3 className="text-base font-bold uppercase text-slate-700">Class Marks Summary & Cohort Performance Ledger</h3>
            <div className="grid grid-cols-3 text-xs font-semibold pt-4 text-left gap-y-2">
              <div>Class: <span className="font-bold">{getClassName()}</span></div>
              <div>Section: <span className="font-bold">Section {getSectionName()}</span></div>
              <div>Subject: <span className="font-bold">{getSubjectName()}</span></div>
              <div>Exam: <span className="font-bold">{getExamName()}</span></div>
              <div>Academic Year: <span className="font-bold">{getAcademicYear()}</span></div>
              <div>Max Marks: <span className="font-bold">{currentExam?.maxMarks}</span></div>
            </div>
          </div>

          {/* Cohort Performance Statistics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-black p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase border-b border-black pb-2 mb-2">Cohort Summary</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold">Total Students Appeared:</td>
                    <td className="py-1 text-right font-bold">{totalAppeared}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Total Passed:</td>
                    <td className="py-1 text-right font-bold text-green-700">{totalPassed}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Passing Percentage:</td>
                    <td className="py-1 text-right font-bold text-blue-700">{passingPercentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border border-black p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase border-b border-black pb-2 mb-2">Score Distribution</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold">Above 75% (Distinction):</td>
                    <td className="py-1 text-right font-bold">{bracket5}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">60% - 75% (First Class):</td>
                    <td className="py-1 text-right font-bold">{bracket4}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">45% - 60% (Average):</td>
                    <td className="py-1 text-right font-bold">{bracket3}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">33% - 45% (Satisfactory):</td>
                    <td className="py-1 text-right font-bold">{bracket2}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Below 33% (Remedial):</td>
                    <td className="py-1 text-right font-bold text-red-600">{bracket1}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Marks Ledger */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase">Student Roster & Score Ledger</h4>
            <table className="w-full text-left text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 border-b border-black text-black">
                  <th className="p-2 border border-black font-bold text-center w-12">Roll</th>
                  <th className="p-2 border border-black font-bold">Student Name</th>
                  <th className="p-2 border border-black font-bold text-center w-28">Admission No</th>
                  <th className="p-2 border border-black font-bold text-center w-28">Marks Obtained</th>
                  <th className="p-2 border border-black font-bold text-center w-20">Percentage</th>
                  <th className="p-2 border border-black font-bold text-center w-16">Grade</th>
                  <th className="p-2 border border-black font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const pct = s.marksObtained !== '' && currentExam ? ((s.marksObtained as number) / currentExam.maxMarks * 100).toFixed(1) : '-'
                  return (
                    <tr key={s.id} className="border-b border-black">
                      <td className="p-2 border border-black text-center font-bold">{s.rollNo}</td>
                      <td className="p-2 border border-black font-semibold">{s.name}</td>
                      <td className="p-2 border border-black text-center font-mono">{s.admissionNo}</td>
                      <td className="p-2 border border-black text-center font-bold">{s.marksObtained === '' ? 'ABS' : s.marksObtained}</td>
                      <td className="p-2 border border-black text-center">{pct}{pct !== '-' ? '%' : ''}</td>
                      <td className="p-2 border border-black text-center font-bold">{s.grade || '-'}</td>
                      <td className="p-2 border border-black text-xs">{s.remarks || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-3 gap-12 pt-16 text-center text-xs font-bold">
            <div className="border-t border-black pt-2">Class Teacher Signature</div>
            <div className="border-t border-black pt-2">Subject Teacher Signature</div>
            <div className="border-t border-black pt-2">Principal Signature</div>
          </div>
        </div>
      )}
    </div>
  )
}
