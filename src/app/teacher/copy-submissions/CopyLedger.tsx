'use client'

import { useState, useEffect } from 'react'
import { submitNotebookRecords, getNotebookRecords } from '../actions'
import { 
  BookOpen, Calendar, Save, Printer, RefreshCw, 
  CheckCircle, AlertCircle, Info, HelpCircle
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface SubjectData {
  id: string
  name: string
  code: string
}

interface StudentNotebookRow {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  status: string // "SUBMITTED", "NOT_SUBMITTED", "LATE"
  quality: string // "EXCELLENT", "GOOD", "AVERAGE", "POOR", "N/A"
  remarks: string
}

interface CopyLedgerProps {
  classes: ClassData[]
  subjects: SubjectData[]
}

export function CopyLedger({ classes, subjects }: CopyLedgerProps) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  const [roster, setRoster] = useState<StudentNotebookRow[]>([])
  
  const [loading, setLoading] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Auto load sections and first-option picks
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      if (cls && cls.sections.length > 0) {
        setSelectedSectionId(cls.sections[0].id)
      }
    } else {
      setAvailableSections([])
      setSelectedSectionId('')
    }
  }, [selectedClassId, classes])

  // Auto select first subject if available
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  // Fetch student roster and checked logs
  const fetchRoster = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedSubjectId || !selectedDate) {
      setRoster([])
      return
    }
    setLoading(true)
    setMessage('')
    setErrorMsg('')
    try {
      const res = await getNotebookRecords(selectedClassId, selectedSectionId, selectedSubjectId, selectedDate)
      if (res.success && res.roster) {
        setRoster(res.roster)
      } else {
        setErrorMsg(res.error || 'Failed to fetch notebook records.')
      }
    } catch (err: any) {
      setErrorMsg('Failed to load notebook records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoster()
  }, [selectedClassId, selectedSectionId, selectedSubjectId, selectedDate])

  const handleStatusChange = (id: string, status: string) => {
    setRoster(prev =>
      prev.map(r => {
        if (r.id === id) {
          // If status is changed to NOT_SUBMITTED, auto set quality to N/A
          const quality = status === 'NOT_SUBMITTED' ? 'N/A' : (r.quality === 'N/A' ? 'GOOD' : r.quality)
          return { ...r, status, quality }
        }
        return r
      })
    )
  }

  const handleQualityChange = (id: string, quality: string) => {
    setRoster(prev =>
      prev.map(r => r.id === id ? { ...r, quality } : r)
    )
  }

  const handleRemarkChange = (id: string, remarks: string) => {
    setRoster(prev =>
      prev.map(r => r.id === id ? { ...r, remarks } : r)
    )
  }

  const handleSave = async () => {
    if (roster.length === 0 || !selectedSubjectId || !selectedDate) return
    setSavePending(true)
    setMessage('')
    setErrorMsg('')

    try {
      const formattedRecords = roster.map(r => ({
        studentId: r.id,
        status: r.status,
        quality: r.quality,
        remarks: r.remarks
      }))
      const res = await submitNotebookRecords(selectedDate, selectedSubjectId, formattedRecords)
      if (res.success) {
        setMessage('Notebook copy checking records saved successfully!')
        fetchRoster()
      } else {
        setErrorMsg(res.error || 'Failed to save notebook records.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save records.')
    } finally {
      setSavePending(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Get active text descriptors for printable sheet headers
  const getClassName = () => classes.find(c => c.id === selectedClassId)?.name || ''
  const getSectionName = () => availableSections.find(s => s.id === selectedSectionId)?.name || ''
  const getSubjectName = () => subjects.find(s => s.id === selectedSubjectId)?.name || ''

  return (
    <div className="space-y-6">
      {/* Printable Sheet Header - HIDDEN in browser, visible in print */}
      <div className="hidden print:block text-black p-4 text-center border-b-2 border-black space-y-1">
        <h2 className="text-xl font-bold uppercase tracking-wider">PM SHRI Kendriya Vidyalaya Mahuldiha</h2>
        <h3 className="text-base font-bold uppercase">Notebook Submission & Copy Checking Log</h3>
        <div className="flex justify-between items-center text-xs font-semibold pt-4">
          <span>Class: {getClassName()} - Section: {getSectionName()}</span>
          <span>Subject: {getSubjectName()}</span>
          <span>Date: {selectedDate}</span>
        </div>
      </div>

      {/* Selectors Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class Grade Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
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
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer disabled:opacity-50"
            >
              <option value="" className="bg-slate-900 text-white">Select Section...</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">Section {s.name}</option>
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
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full px-4 py-2 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Ledger table */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-xs flex items-center gap-2 print:hidden">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-teal-950/40 border border-teal-900/50 rounded-2xl text-teal-200 text-xs flex items-center gap-2 print:hidden">
          <CheckCircle className="h-5 w-5 text-brand-teal-500 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {selectedClassId && selectedSectionId && selectedSubjectId && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl print:bg-white print:border-none print:shadow-none print:p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm print:hidden">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-teal-500" />
              <span>Loading class copy ledger...</span>
            </div>
          ) : roster.length === 0 ? (
            <div className="py-20 text-center text-slate-500 italic text-sm print:hidden">
              No students found in the selected section.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm print:text-black">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider print:border-black print:text-black">
                      <th className="py-3 font-semibold text-center w-12 print:text-black">Roll</th>
                      <th className="py-3 font-semibold print:text-black">Student Name</th>
                      <th className="py-3 font-semibold text-center w-40 print:text-black">Submission Status</th>
                      <th className="py-3 font-semibold text-center w-40 print:text-black">Notebook Quality</th>
                      <th className="py-3 font-semibold print:text-black">Remarks / Correction Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 print:divide-black">
                    {roster.map(r => (
                      <tr key={r.id} className="hover:bg-slate-850/20 transition-colors print:hover:bg-transparent print:text-black">
                        <td className="py-3 font-bold text-center text-slate-450 print:text-black">{r.rollNo}</td>
                        <td className="py-3">
                          <div>
                            <span className="font-extrabold text-white block print:text-black">{r.name}</span>
                            <span className="text-[10px] text-slate-505 font-mono print:hidden">{r.admissionNo}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {/* Dropdown in browser, Text in print */}
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                            className="print:hidden px-3 py-1.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-center text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="SUBMITTED">Submitted</option>
                            <option value="LATE">Submitted Late</option>
                            <option value="NOT_SUBMITTED">Not Submitted</option>
                          </select>
                          <span className="hidden print:inline font-semibold text-xs">
                            {r.status === 'SUBMITTED' ? 'Submitted' : r.status === 'LATE' ? 'Late' : 'Not Submitted'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {/* Dropdown in browser, Text in print */}
                          <select
                            value={r.quality}
                            disabled={r.status === 'NOT_SUBMITTED'}
                            onChange={(e) => handleQualityChange(r.id, e.target.value)}
                            className="print:hidden px-3 py-1.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-center text-xs text-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="AVERAGE">Average</option>
                            <option value="POOR">Poor</option>
                            <option value="N/A">N/A</option>
                          </select>
                          <span className="hidden print:inline font-semibold text-xs">
                            {r.status === 'NOT_SUBMITTED' ? 'N/A' : r.quality}
                          </span>
                        </td>
                        <td className="py-3">
                          {/* Input in browser, Text in print */}
                          <input
                            type="text"
                            placeholder="Correction remarks..."
                            value={r.remarks}
                            onChange={(e) => handleRemarkChange(r.id, e.target.value)}
                            className="print:hidden w-full px-4 py-1.5 bg-slate-955 border border-slate-850 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs placeholder-slate-700"
                          />
                          <span className="hidden print:inline text-xs">{r.remarks || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons - HIDDEN in print */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-850 print:hidden">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="h-4 w-4 text-slate-550 shrink-0" />
                  <p>Check notebook quality only for submitted copies. Clicking Print generates an A4 co-educational record sheet.</p>
                </div>

                <div className="flex gap-3">
                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-855 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Print Record Sheet
                  </button>

                  {/* Save Button */}
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
                        Save Notebook Records
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
  )
}
