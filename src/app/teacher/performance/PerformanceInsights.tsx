'use client'

import { useState, useEffect } from 'react'
import { saveThresholdConfig } from '../actions'
import { 
  Brain, Sliders, Save, Award, AlertCircle, Sparkles, 
  TrendingUp, TrendingDown, BookOpen, User, RefreshCw, ChevronRight, X
} from 'lucide-react'

interface Student {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  gender: string
  classId: string
  sectionId: string
  marks: {
    id: string
    marksObtained: number
    subjectId: string
    subject: {
      name: string
    }
    examId: string
    exam: {
      name: string
      maxMarks: number
      passMarks: number
    }
  }[]
  attendance: {
    id: string
    status: string
  }[]
  class: {
    name: string
  }
  section: {
    name: string
  }
}

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
  exams: {
    id: string
    name: string
    academicYear: string
  }[]
}

interface SubjectData {
  id: string
  name: string
  code: string
}

interface PerformanceInsightsProps {
  classes: ClassData[]
  subjects: SubjectData[]
  students: Student[]
  initialThresholds: {
    remedialMax: number
    giftedMin: number
  }
}

interface AIConsultantMessage {
  role: 'user' | 'assistant'
  text: string
}

export function PerformanceInsights({ 
  classes, 
  subjects, 
  students, 
  initialThresholds 
}: PerformanceInsightsProps) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('OVERALL')
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL')
  
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [availableExams, setAvailableExams] = useState<{ id: string; name: string; academicYear: string }[]>([])
  
  // Custom threshold criteria config
  const [remedialMax, setRemedialMax] = useState(initialThresholds.remedialMax)
  const [giftedMin, setGiftedMin] = useState(initialThresholds.giftedMin)
  const [savingConfig, setSavingConfig] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // AI Assistant States
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<string>('')
  const [aiLog, setAiLog] = useState<AIConsultantMessage[]>([])
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)

  // 1. Auto load sections and exams on class change
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      setAvailableExams(cls ? cls.exams : [])
      
      if (cls && cls.sections.length > 0) {
        setSelectedSectionId(cls.sections[0].id)
      }
      setSelectedExamId('OVERALL')
    } else {
      setAvailableSections([])
      setAvailableExams([])
      setSelectedSectionId('')
      setSelectedExamId('OVERALL')
    }
  }, [selectedClassId, classes])

  // Save criteria config
  const handleSaveThresholds = async () => {
    setSavingConfig(true)
    setSaveSuccess(false)
    try {
      const res = await saveThresholdConfig(remedialMax, giftedMin)
      if (res.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(res.error || 'Failed to save config.')
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.')
    } finally {
      setSavingConfig(false)
    }
  }

  // Group and score calculation
  const getScoredStudents = () => {
    if (!selectedClassId || !selectedSectionId) return []

    const classSectionStudents = students.filter(s => 
      s.classId === selectedClassId && s.sectionId === selectedSectionId
    )

    return classSectionStudents.map(s => {
      // Filter marks by selected exam and subject
      const filteredMarks = s.marks.filter(m => {
        const examMatch = selectedExamId === 'OVERALL' || m.examId === selectedExamId
        const subjectMatch = selectedSubjectId === 'ALL' || m.subjectId === selectedSubjectId
        return examMatch && subjectMatch
      })

      let scorePct = 0
      if (filteredMarks.length > 0) {
        const totalPct = filteredMarks.reduce((acc, m) => acc + (m.marksObtained / m.exam.maxMarks) * 100, 0)
        scorePct = Math.round(totalPct / filteredMarks.length)
      }

      // Calculate attendance rate
      const validAttendance = s.attendance.filter(a => a.status !== 'HOLIDAY')
      const presentCount = validAttendance.reduce((acc, a) => {
        if (a.status === 'PRESENT' || a.status === 'OD') return acc + 1
        if (a.status === 'HALF_PRESENT') return acc + 0.5
        return acc
      }, 0)
      const attendanceRate = validAttendance.length > 0
        ? Math.round((presentCount / validAttendance.length) * 100)
        : 100

      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        gender: s.gender,
        score: scorePct,
        attendance: attendanceRate,
        rawMarks: filteredMarks
      }
    }).sort((a, b) => b.score - a.score) // Rank descending
  }

  const scoredList = getScoredStudents()

  // Divide cohorts
  const remedialStudents = scoredList.filter(s => s.score < remedialMax)
  const giftedStudents = scoredList.filter(s => s.score >= giftedMin)
  const mediocreStudents = scoredList.filter(s => s.score >= remedialMax && s.score < giftedMin)

  const totalCount = scoredList.length
  const remedialPct = totalCount > 0 ? Math.round((remedialStudents.length / totalCount) * 100) : 0
  const mediocrePct = totalCount > 0 ? Math.round((mediocreStudents.length / totalCount) * 100) : 0
  const giftedPct = totalCount > 0 ? Math.round((giftedStudents.length / totalCount) * 100) : 0

  // Heuristic AI performance diagnosis generator
  const triggerAIDiagnostic = (studentId: string) => {
    const s = scoredList.find(x => x.id === studentId)
    if (!s) return

    setAiSidebarOpen(true)
    setAiAnalyzing(true)
    
    // Push user message log
    const userPrompt: AIConsultantMessage = {
      role: 'user',
      text: `Analyze academic performance for student: ${s.name} (Roll No: ${s.rollNo})`
    }
    setAiLog([userPrompt])

    setTimeout(() => {
      // Compile subject performance analysis
      const subjectsAnalysis = s.rawMarks.map(m => ({
        subject: m.subject.name,
        score: Math.round((m.marksObtained / m.exam.maxMarks) * 100)
      })).sort((a, b) => a.score - b.score)

      const weakSubjects = subjectsAnalysis.filter(x => x.score < remedialMax).map(x => `${x.subject} (${x.score}%)`)
      const strongSubjects = subjectsAnalysis.filter(x => x.score >= giftedMin).map(x => `${x.subject} (${x.score}%)`)
      
      const cohort = s.score < remedialMax ? 'REMEDIAL' : s.score >= giftedMin ? 'GIFTED' : 'MEDIOCRE'
      
      let diagnosticReport = `🤖 **GEMINI CLASSROOM PERFORMANCE DIAGNOSIS**\n\n`
      diagnosticReport += `### 📊 Student Profile Summary:\n`
      diagnosticReport += `- **Name**: ${s.name}\n`
      diagnosticReport += `- **Roll Number**: ${s.rollNo}\n`
      diagnosticReport += `- **Average Score**: \`${s.score}%\`\n`
      diagnosticReport += `- **Classroom Cohort**: \`${cohort}\` (Threshold Criteria: Remedial < ${remedialMax}%, Gifted >= ${giftedMin}%)\n`
      diagnosticReport += `- **Attendance Rate**: \`${s.attendance}%\`\n\n`

      diagnosticReport += `### 🔍 Subject Performance Analysis:\n`
      if (strongSubjects.length > 0) {
        diagnosticReport += `- 🌟 **Academic Strengths**: ${strongSubjects.join(', ')}\n`
      } else {
        diagnosticReport += `- 🌟 **Academic Strengths**: Stable across middle-tier categories. No subjects exceed the gifted threshold of ${giftedMin}%.\n`
      }
      
      if (weakSubjects.length > 0) {
        diagnosticReport += `- ⚠️ **Academic Weaknesses**: ${weakSubjects.join(', ')}\n`
      } else {
        diagnosticReport += `- ⚠️ **Academic Weaknesses**: None. All subjects are maintained above the remedial threshold of ${remedialMax}%.\n`
      }

      diagnosticReport += `\n### 💡 Key Diagnostic Insights & Correlation:\n`
      // Attendance correlation
      if (s.attendance < 85) {
        diagnosticReport += `- 📅 **Attendance Alert**: The student's attendance is currently at **${s.attendance}%**, which is below the recommended **85%** rate. There is a strong correlation between missed lectures and their overall score of **${s.score}%**. Regular attendance must be prioritized.\n`
      } else {
        diagnosticReport += `- 📅 **Attendance Status**: Excellent attendance of **${s.attendance}%**. Learning gaps are cognitive or instruction-based rather than presence-based.\n`
      }

      // Performance based advice
      if (cohort === 'REMEDIAL') {
        diagnosticReport += `- 🎯 **Focus Areas**: Student falls into the remedial category. They require immediate classroom adjustments and structured supervision.\n`
      } else if (cohort === 'GIFTED') {
        diagnosticReport += `- 🎯 **Focus Areas**: Student demonstrates gifted metrics. They require advanced challenge problems and peer leadership opportunities to maintain interest and drive.\n`
      } else {
        diagnosticReport += `- 🎯 **Focus Areas**: Student is mediocre/average. Focus should be on boosting them to the next bracket through minor support tweaks.\n`
      }

      diagnosticReport += `\n### 📋 AI Action Plan & Improvement Strategies:\n`
      if (cohort === 'REMEDIAL') {
        diagnosticReport += `1. **Remedial Practice Sheets**: Provide foundational worksheets in ${weakSubjects.length > 0 ? weakSubjects.map(x => x.split(' ')[0]).join(', ') : 'Mathematics/Science'} focusing on basic concepts.\n`
        diagnosticReport += `2. **Peer Mentorship**: Match ${s.name} with a gifted classmate during group assignments.\n`
        diagnosticReport += `3. **Daily Copy Tracking**: Ensure their notebook corrections are checked daily (utilize the Notebook Submission tab).\n`
        diagnosticReport += `4. **Parent Alignment**: Share the daily attendance ledger metrics with parents to resolve the ${s.attendance}% presence rate.\n`
      } else if (cohort === 'GIFTED') {
        diagnosticReport += `1. **Higher-Order Problem Sheets**: Assign Olympiad-tier questions in ${strongSubjects.length > 0 ? strongSubjects.map(x => x.split(' ')[0]).join(', ') : 'core topics'}.\n`
        diagnosticReport += `2. **Classroom Coach Role**: Appoint ${s.name} as a peer tutor to assist classmates in remedial brackets. This reinforces their own conceptual understanding.\n`
        diagnosticReport += `3. **Advanced Projects**: Invite them to upload interactive HTML5 templates or GeoGebra simulations to explain math theorems to the class.\n`
      } else {
        diagnosticReport += `1. **Targeted Weakness Review**: Review their performance in ${weakSubjects.length > 0 ? weakSubjects.map(x => x.split(' ')[0]).join(', ') : 'weak subjects'} and clear specific doubts.\n`
        diagnosticReport += `2. **Regular Revision Tests**: Encourage weekly self-testing on uploaded Study Materials PDF slides.\n`
        diagnosticReport += `3. **Self-Check Motivation**: Motivate the student to achieve >${giftedMin}% in the next exam to graduate to the Gifted cohort.\n`
      }

      const aiReply: AIConsultantMessage = {
        role: 'assistant',
        text: diagnosticReport
      }

      setAiLog(prev => [...prev, aiReply])
      setAiAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Selection & Threshold Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Dropdown Selectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-brand-teal-500" />
            Roster & Exam Filter
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Class Grade Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Class Grade</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Select Class Grade...</option>
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
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer disabled:opacity-50"
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
                disabled={!selectedClassId}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer disabled:opacity-50"
              >
                <option value="OVERALL" className="bg-slate-955 text-white">Overall Average Across Exams</option>
                {availableExams.map(e => (
                  <option key={e.id} value={e.id} className="bg-slate-955 text-white">{e.name} ({e.academicYear})</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Subject filter</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="ALL" className="bg-slate-955 text-white">All Combined Subjects</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id} className="bg-slate-955 text-white">{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sliders Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-brand-teal-500" />
              Adjust Category Criteria
            </h3>
            
            {/* Remedial Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-450">Remedial Student Threshold</span>
                <span className="text-red-400 font-bold">&lt; {remedialMax}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                value={remedialMax}
                onChange={(e) => setRemedialMax(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Gifted Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-455">Gifted Student Threshold</span>
                <span className="text-brand-teal-500 font-bold">&gt;= {giftedMin}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={giftedMin}
                onChange={(e) => setGiftedMin(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-teal-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveThresholds}
            disabled={savingConfig}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 border border-slate-750 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {savingConfig ? (
              <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
            ) : saveSuccess ? (
              <span className="text-brand-teal-500 font-bold flex items-center gap-1">✔ Settings Saved</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Custom Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cohorts Classification Display */}
      {selectedClassId && selectedSectionId && (
        <div className="space-y-6">
          {/* Analytics Summary Bar */}
          <div className="glass-dark border border-slate-850 rounded-3xl p-5 shadow-lg space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-brand-teal-500 font-bold uppercase tracking-wider">Cohort Distribution</span>
                <h2 className="text-sm font-black text-white">Class Metrics Summary</h2>
              </div>
              <div className="text-xs text-slate-400">
                Total Class Size: <span className="font-extrabold text-white">{totalCount} Students</span>
              </div>
            </div>

            {totalCount > 0 ? (
              <div className="space-y-2">
                {/* Visual Cohort Bar */}
                <div className="h-4 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-850">
                  <div style={{ width: `${remedialPct}%` }} className="bg-red-500/80 transition-all" title={`Remedial: ${remedialPct}%`} />
                  <div style={{ width: `${mediocrePct}%` }} className="bg-amber-500/80 transition-all" title={`Mediocre: ${mediocrePct}%`} />
                  <div style={{ width: `${giftedPct}%` }} className="bg-brand-teal-500/80 transition-all" title={`Gifted: ${giftedPct}%`} />
                </div>
                {/* Legends */}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 flex-wrap gap-4 pt-1">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Remedial: {remedialStudents.length} ({remedialPct}%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Mediocre: {mediocreStudents.length} ({mediocrePct}%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-teal-500" /> Gifted: {giftedStudents.length} ({giftedPct}%)</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs italic">
                No active marks records compiled for this class and exam. Group percentages will display once scores are entered.
              </div>
            )}
          </div>

          {/* Side-by-Side Student Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Remedial Column */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-extrabold text-white text-sm">Remedial Cohort</h3>
                </div>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20">
                  {remedialStudents.length} Students
                </span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {remedialStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 text-xs italic">No students in this tier.</div>
                ) : (
                  remedialStudents.map((s, idx) => (
                    <div key={s.id} className="p-3.5 bg-slate-950 border border-slate-850/80 hover:border-red-950 rounded-2xl flex items-center justify-between gap-3 group transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-red-950/20 border border-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-505 block mt-0.5">Roll No: {s.rollNo} • Avg: <span className="font-mono font-bold text-red-400">{s.score}%</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerAIDiagnostic(s.id)}
                        className="text-[10px] bg-red-950/30 border border-red-900/30 text-red-300 hover:text-white px-2.5 py-1.5 rounded-xl font-bold transition-all hover:bg-red-900/20 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Ask
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Mediocre Column */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h3 className="font-extrabold text-white text-sm">Mediocre Cohort</h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20">
                  {mediocreStudents.length} Students
                </span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {mediocreStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 text-xs italic">No students in this tier.</div>
                ) : (
                  mediocreStudents.map((s) => (
                    <div key={s.id} className="p-3.5 bg-slate-955 border border-slate-850/80 hover:border-amber-950 rounded-2xl flex items-center justify-between gap-3 group transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-505 block mt-0.5">Roll No: {s.rollNo} • Avg: <span className="font-mono font-bold text-amber-400">{s.score}%</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerAIDiagnostic(s.id)}
                        className="text-[10px] bg-amber-950/30 border border-amber-900/30 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-xl font-bold transition-all hover:bg-amber-900/20 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Ask
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Gifted Column */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-teal-500 animate-pulse" />
                  <h3 className="font-extrabold text-white text-sm">Gifted Cohort</h3>
                </div>
                <span className="px-2 py-0.5 bg-brand-teal-500/10 text-brand-teal-400 text-[10px] font-bold rounded-lg border border-brand-teal-500/20">
                  {giftedStudents.length} Students
                </span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {giftedStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 text-xs italic">No students in this tier.</div>
                ) : (
                  giftedStudents.map((s) => (
                    <div key={s.id} className="p-3.5 bg-slate-950 border border-slate-850/80 hover:border-brand-teal-950 rounded-2xl flex items-center justify-between gap-3 group transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-brand-teal-950/20 border border-brand-teal-900/30 rounded-lg flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-brand-teal-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-505 block mt-0.5">Roll No: {s.rollNo} • Avg: <span className="font-mono font-bold text-brand-teal-400">{s.score}%</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerAIDiagnostic(s.id)}
                        className="text-[10px] bg-brand-teal-950/30 border border-brand-teal-900/30 text-brand-teal-300 hover:text-white px-2.5 py-1.5 rounded-xl font-bold transition-all hover:bg-brand-teal-900/20 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Ask
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Assistant Chat Sidebar Overlay */}
      {aiSidebarOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-955 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-slide-in">
          {/* Header */}
          <div className="h-16 border-b border-slate-850 px-6 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-teal-500/10 rounded-xl border border-brand-teal-500/20 text-brand-teal-500 shrink-0">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Gemini Classroom Coach</h3>
                <p className="text-[10px] text-slate-500">Active performance analysis and strategies</p>
              </div>
            </div>

            <button
              onClick={() => {
                setAiSidebarOpen(false)
                setAiLog([])
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Dialog Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {aiLog.map((log, index) => {
              const isAi = log.role === 'assistant'
              return (
                <div key={index} className={`flex gap-3.5 ${isAi ? 'justify-start' : 'justify-end'}`}>
                  {isAi && (
                    <div className="h-8 w-8 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <Brain className="h-4.5 w-4.5 text-brand-teal-500" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    isAi 
                      ? 'bg-slate-900 border border-slate-850 text-slate-300 space-y-3' 
                      : 'bg-brand-teal-600 text-white font-semibold'
                  }`}>
                    {/* Render helper to format markdown headers/bullets */}
                    {log.text.split('\n').map((line, lIdx) => {
                      if (line.startsWith('🤖') || line.startsWith('###')) {
                        return <h4 key={lIdx} className="font-extrabold text-white text-xs border-b border-slate-850/60 pb-1 mt-3 mb-1 first:mt-0">{line.replace('###', '')}</h4>
                      }
                      if (line.startsWith('-')) {
                        return <p key={lIdx} className="pl-4 relative before:absolute before:left-1.5 before:top-2 before:h-1.5 before:w-1.5 before:bg-brand-teal-500 before:rounded-full text-slate-350">{line.replace('-', '').trim()}</p>
                      }
                      if (line.match(/^[0-9]\./)) {
                        return <p key={lIdx} className="pl-2 font-medium text-slate-300 mt-2">{line}</p>
                      }
                      return <p key={lIdx} className="text-slate-350">{line}</p>
                    })}
                  </div>

                  {!isAi && (
                    <div className="h-8 w-8 bg-brand-teal-500/20 border border-brand-teal-500/40 rounded-lg flex items-center justify-center shrink-0">
                      <User className="h-4.5 w-4.5 text-brand-teal-500" />
                    </div>
                  )}
                </div>
              )
            })}

            {aiAnalyzing && (
              <div className="flex gap-3 justify-start items-center text-slate-500 text-xs">
                <div className="h-8 w-8 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-lg flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4 animate-spin text-brand-teal-500" />
                </div>
                <span>Gemini is compiling student statistics and generating improvement plan...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
