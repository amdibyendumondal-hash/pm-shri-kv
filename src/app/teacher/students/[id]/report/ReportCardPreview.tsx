'use client'

import { useState } from 'react'
import { Printer, ArrowLeft, School, GraduationCap, Calendar, User, Award, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Exam {
  id: string
  name: string
  maxMarks: number
  passMarks: number
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Mark {
  id: string
  examId: string
  subjectId: string
  marksObtained: number
  grade: string
  remarks: string | null
}

interface Student {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  dob: string
  gender: string
  bloodGroup: string | null
  fatherName: string
  motherName: string
  mobile: string
  village: string
  postOffice: string
  district: string
  state: string
  pinCode: string
  photo: string | null
  class: {
    name: string
  }
  section: {
    name: string
  }
}

interface ReportCardPreviewProps {
  student: Student
  exams: Exam[]
  subjects: Subject[]
  marks: Mark[]
  presentCount: number
  totalAttendance: number
  classRank: number
  totalClassmates: number
  sectionRank: number
  totalSectionmates: number
}

export function ReportCardPreview({
  student,
  exams,
  subjects,
  marks,
  presentCount,
  totalAttendance,
  classRank,
  totalClassmates,
  sectionRank,
  totalSectionmates
}: ReportCardPreviewProps) {
  const [generalRemarks, setGeneralRemarks] = useState('Excellent academic progress. Consistently shows keen interest and active participation in class activities.')
  const [promotionStatus, setPromotionStatus] = useState('PROMOTED TO NEXT CLASS')
  
  const attendancePercentage = totalAttendance > 0 
    ? Math.round((presentCount / totalAttendance) * 100) 
    : 100

  // Calculate CBSE Grade based on percentage
  const calculateGrade = (pct: number) => {
    if (pct >= 90) return 'A1'
    if (pct >= 80) return 'A2'
    if (pct >= 70) return 'B1'
    if (pct >= 60) return 'B2'
    if (pct >= 50) return 'C1'
    if (pct >= 40) return 'C2'
    if (pct >= 33) return 'D'
    return 'E'
  }

  // Helper to get marks obtained for a specific subject and exam
  const getMark = (subjectId: string, examId: string) => {
    return marks.find(m => m.subjectId === subjectId && m.examId === examId)
  }

  // Calculate subject-wise totals
  const subjectTotals = subjects.map(sub => {
    let obtainedSum = 0
    let maxSum = 0
    let examCount = 0

    exams.forEach(exam => {
      const markRecord = getMark(sub.id, exam.id)
      if (markRecord) {
        obtainedSum += markRecord.marksObtained
        maxSum += exam.maxMarks
        examCount++
      }
    })

    const pct = maxSum > 0 ? (obtainedSum / maxSum) * 100 : 0
    const grade = maxSum > 0 ? calculateGrade(pct) : '-'

    return {
      subjectId: sub.id,
      obtainedSum,
      maxSum,
      pct: Math.round(pct * 10) / 10,
      grade
    }
  })

  // Calculate Grand Totals
  const grandObtained = subjectTotals.reduce((sum, item) => sum + item.obtainedSum, 0)
  const grandMax = subjectTotals.reduce((sum, item) => sum + item.maxSum, 0)
  const grandPct = grandMax > 0 ? Math.round((grandObtained / grandMax) * 1000) / 10 : 0
  const grandGrade = grandMax > 0 ? calculateGrade(grandPct) : '-'

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* Action Header (Hidden in print) */}
      <div className="no-print flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
        <Link
          href={`/teacher/students`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-brand-teal-950/20"
          >
            <Printer className="h-4 w-4" />
            Print Report Card
          </button>
        </div>
      </div>

      {/* Editor & Configuration Section (Hidden in print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-brand-teal-500" />
          Class Teacher remarks & Decision
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Teacher Remarks</label>
            <textarea
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              rows={2}
              className="block w-full px-4 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs leading-relaxed"
              placeholder="Enter qualitative comments..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Result / Promotion Decision</label>
            <select
              value={promotionStatus}
              onChange={(e) => setPromotionStatus(e.target.value)}
              className="block w-full px-4 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer h-10"
            >
              <option value="PROMOTED TO NEXT CLASS">Promoted to Next Class</option>
              <option value="RECOMMENDED FOR IMPROVEMENT">Recommended for Improvement</option>
              <option value="ESSENTIAL REPEAT">Essential Repeat (ER)</option>
              <option value="RESULT WITHHELD">Result Withheld</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Card Area */}
      <div className="print-card-wrapper bg-white text-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-200 font-sans mx-auto max-w-4xl selection:bg-slate-100">
        
        {/* REPORT CARD HEADER */}
        <div className="border-b-4 border-double border-brand-blue-900 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="h-16 w-16 bg-brand-blue-900 text-white rounded-full flex items-center justify-center shadow-md print:shadow-none">
              <School className="h-9 w-9 text-brand-teal-400" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black tracking-widest text-brand-teal-600 block uppercase">PM SHRI SCHOOL</span>
              <h1 className="text-2xl font-black text-brand-blue-900 leading-none tracking-tight">KENDRIYA VIDYALAYA MAHULDIHA</h1>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Mayurbhanj, Odisha - 757041 | CBSE Affiliated School
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <span className="inline-block px-6 py-1 bg-brand-blue-900 text-white text-xs font-black uppercase tracking-widest rounded-full">
              Academic Progress Report Card
            </span>
            <span className="block text-xs font-extrabold text-slate-500 mt-1">SESSION: 2025 - 2026</span>
          </div>
        </div>

        {/* STUDENT BIO PROFILE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-b border-slate-200">
          
          {/* Photo */}
          <div className="flex justify-center md:justify-start items-center">
            <div className="h-28 w-28 border-2 border-brand-blue-900/40 p-1 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm print:shadow-none">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="h-full w-full object-cover rounded-xl" />
              ) : (
                <User className="h-12 w-12 text-slate-300" />
              )}
            </div>
          </div>

          {/* Bio Grid */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Student Name</span>
              <span className="font-extrabold text-brand-blue-950 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Class & Sec</span>
              <span className="font-bold text-slate-800">{student.class.name} - {student.section.name}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Roll Number</span>
              <span className="font-bold text-slate-800"># {student.rollNo}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Admission Number</span>
              <span className="font-bold text-slate-800 font-mono">{student.admissionNo}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Date of Birth</span>
              <span className="font-bold text-slate-800">{student.dob}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Gender / Blood Gp</span>
              <span className="font-bold text-slate-800">{student.gender} {student.bloodGroup ? `/ ${student.bloodGroup}` : ''}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Father's Name</span>
              <span className="font-bold text-slate-800">{student.fatherName}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Mother's Name</span>
              <span className="font-bold text-slate-800">{student.motherName}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Contact Phone</span>
              <span className="font-bold text-slate-800">{student.mobile}</span>
            </div>
          </div>
        </div>

        {/* MARKS MATRIX TABLE */}
        <div className="py-6">
          <h2 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Award className="h-4 w-4 text-brand-teal-600" />
            I. Scholastic Areas (Academic Achievement)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-brand-blue-950 border-b border-slate-300">
                  <th className="border border-slate-300 p-2 text-left font-black w-44">Subject Name</th>
                  {exams.map(exam => (
                    <th key={exam.id} className="border border-slate-300 p-2 text-center font-black">
                      <span className="block">{exam.name}</span>
                      <span className="block text-[8px] font-bold text-slate-500">Max: {exam.maxMarks}</span>
                    </th>
                  ))}
                  <th className="border border-slate-300 p-2 text-center font-black bg-slate-200">
                    Grand Total
                  </th>
                  <th className="border border-slate-300 p-2 text-center font-black bg-slate-200">
                    Percentage
                  </th>
                  <th className="border border-slate-300 p-2 text-center font-black bg-brand-blue-900 text-white">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(sub => {
                  const totals = subjectTotals.find(t => t.subjectId === sub.id)
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="border border-slate-300 p-2.5 font-bold text-slate-850">
                        {sub.name}
                      </td>
                      {exams.map(exam => {
                        const markRecord = getMark(sub.id, exam.id)
                        const isFail = markRecord && markRecord.marksObtained < exam.passMarks
                        return (
                          <td key={exam.id} className="border border-slate-300 p-2 text-center font-semibold text-slate-700">
                            {markRecord ? (
                              <span className={isFail ? 'text-red-600 font-bold' : ''}>
                                {markRecord.marksObtained}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">-</span>
                            )}
                          </td>
                        )
                      })}
                      {/* Subtotal columns */}
                      <td className="border border-slate-300 p-2 text-center font-extrabold bg-slate-100/50">
                        {totals ? `${totals.obtainedSum} / ${totals.maxSum}` : '-'}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-extrabold bg-slate-100/50">
                        {totals ? `${totals.pct}%` : '-'}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-black bg-slate-50">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] ${
                          totals?.grade === 'E' ? 'text-red-600 bg-red-50' : 'text-brand-blue-900 bg-blue-50/50'
                        }`}>
                          {totals?.grade || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {/* Grand Total Row */}
                <tr className="bg-slate-150 font-black border-t-2 border-slate-400">
                  <td className="border border-slate-300 p-2.5 text-brand-blue-950 uppercase">
                    GRAND TOTAL
                  </td>
                  {exams.map(exam => {
                    const examMarks = marks.filter(m => m.examId === exam.id)
                    const totalObt = examMarks.reduce((sum, m) => sum + m.marksObtained, 0)
                    const maxPossible = examMarks.length * exam.maxMarks
                    return (
                      <td key={exam.id} className="border border-slate-300 p-2 text-center font-bold text-slate-800">
                        {examMarks.length > 0 ? `${totalObt} / ${maxPossible}` : '-'}
                      </td>
                    )
                  })}
                  <td className="border border-slate-300 p-2 text-center text-sm font-black bg-slate-200 text-brand-blue-950">
                    {grandObtained} / {grandMax}
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-sm font-black bg-slate-200 text-brand-blue-950">
                    {grandPct}%
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-sm font-black bg-brand-blue-900 text-white">
                    {grandGrade}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CO-SCHOLASTIC & ATTENDANCE PROFILE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-t border-slate-200">
          {/* Attendance and Ranks */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-brand-teal-600" />
              II. Attendance & Class Standings
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">School Attendance</span>
                <span className="font-extrabold text-slate-800 mt-1 block">
                  {presentCount} / {totalAttendance} Days ({attendancePercentage}%)
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Class Ranking</span>
                <span className="font-extrabold text-slate-800 mt-1 block">
                  Rank {classRank} of {totalClassmates} Students
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Section Standing</span>
                <span className="font-extrabold text-slate-800 mt-1 block">
                  Rank {sectionRank} of {totalSectionmates} Students
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Academic Status</span>
                <span className="font-extrabold text-brand-teal-600 mt-1 block uppercase">
                  {grandGrade === 'E' ? 'REMEDIAL' : 'QUALIFIED'}
                </span>
              </div>
            </div>
          </div>

          {/* Co-Scholastic Grades (Mock representation based on CBSE report structure) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-brand-teal-600" />
              III. Co-Scholastic Activities
            </h3>
            
            <table className="w-full border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-2 text-left">Activity / Domain</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Term I Grade</th>
                  <th className="border border-slate-305 p-2 text-center w-24">Term II Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Work Education (Skill-based)</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">A</td>
                  <td className="border border-slate-305 p-2 text-center font-bold text-slate-700">A</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Art Education (Visual & Performing)</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">A</td>
                  <td className="border border-slate-305 p-2 text-center font-bold text-slate-700">B</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Health & Physical Education / Sports</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">A</td>
                  <td className="border border-slate-305 p-2 text-center font-bold text-slate-700">A</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Discipline & Personal Hygiene</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">A</td>
                  <td className="border border-slate-305 p-2 text-center font-bold text-slate-700">A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TEACHER REMARKS & PROMOTION */}
        <div className="mt-4 p-4 border border-slate-300 bg-slate-50/50 rounded-2xl text-xs space-y-3">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Class Teacher's Qualitative Remarks</span>
            <p className="font-semibold text-slate-800 italic leading-relaxed pt-1">
              "{generalRemarks}"
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Promotion / Result Decision</span>
              <span className="font-black text-brand-blue-900 tracking-wide text-xs uppercase block pt-0.5">
                {promotionStatus}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">New Academic Session Starts</span>
              <span className="font-bold text-slate-700 block">April 06, 2026</span>
            </div>
          </div>
        </div>

        {/* GRADING SCALE LEGEND */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-[8px] text-slate-400 uppercase font-black tracking-wide block mb-1">Scholastic Grading Scale (CBSE)</span>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[8px] text-slate-500 font-bold text-center">
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">91-100: A1</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">81-90: A2</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">71-80: B1</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">61-70: B2</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">51-60: C1</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">41-50: C2</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">33-40: D</div>
            <div className="border border-slate-200 p-1 bg-slate-50 rounded">Below 33: E</div>
          </div>
        </div>

        {/* SIGNATURES BLOCK */}
        <div className="grid grid-cols-3 gap-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 mt-12 pt-8 border-t border-slate-200">
          <div className="space-y-10">
            <div className="h-6" /> {/* Spacer for physical signature */}
            <span className="block border-t border-dashed border-slate-300 pt-2 mx-4">Class Teacher Sign</span>
          </div>
          <div className="space-y-10">
            <div className="h-6" />
            <span className="block border-t border-dashed border-slate-300 pt-2 mx-4">Parent / Guardian Sign</span>
          </div>
          <div className="space-y-10 font-bold">
            <div className="h-6 flex items-center justify-center">
              <span className="text-[10px] font-black text-brand-blue-900/80 italic font-serif">Principal Seal</span>
            </div>
            <span className="block border-t border-dashed border-slate-300 pt-2 mx-4">School Principal Sign</span>
          </div>
        </div>

      </div>

      {/* Global CSS Injecting styles specific to Printing */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card-wrapper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          /* Fix margins for PDF print */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  )
}
