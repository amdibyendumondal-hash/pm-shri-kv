'use client'

import { useState, useTransition } from 'react'
import { createExam, updateExam, deleteExam } from '../actions'
import { Plus, Trash2, FileCheck, Pencil, X, Check } from 'lucide-react'

interface ClassData {
  id: string
  name: string
}

interface ExamData {
  id: string
  name: string
  academicYear: string
  maxMarks: number
  passMarks: number
  class: {
    id: string
    name: string
  }
}

interface ExamFormsProps {
  classes: ClassData[]
  exams: ExamData[]
}

export function ExamForms({ classes, exams }: ExamFormsProps) {
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isPending, startTransition] = useTransition()
  const [editingExam, setEditingExam] = useState<ExamData | null>(null)

  // Form Field States
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [maxMarks, setMaxMarks] = useState('')
  const [passMarks, setPassMarks] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleStartEdit = (exam: ExamData) => {
    setEditingExam(exam)
    setName(exam.name)
    setClassId(exam.class.id)
    setMaxMarks(String(exam.maxMarks))
    setPassMarks(String(exam.passMarks))
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleCancelEdit = () => {
    setEditingExam(null)
    setName('')
    setClassId('')
    setMaxMarks('')
    setPassMarks('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleDelete = async (id: string, name: string, className: string) => {
    if (!confirm(`Are you sure you want to delete the exam "${name}" for ${className}? This will clear all recorded marks for this exam!`)) return
    startDeleteTransition(async () => {
      try {
        const res = await deleteExam(id)
        if (res.error) {
          alert(res.error)
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete exam.')
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const numericMax = parseFloat(maxMarks)
    const numericPass = parseFloat(passMarks)

    if (!name || isNaN(numericMax) || isNaN(numericPass)) {
      setErrorMsg('All fields are required and must be valid numbers.')
      return
    }

    startTransition(async () => {
      try {
        if (editingExam) {
          const res = await updateExam(editingExam.id, name, numericMax, numericPass)
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Exam updated successfully!')
            setEditingExam(null)
            setName('')
            setClassId('')
            setMaxMarks('')
            setPassMarks('')
          }
        } else {
          if (!classId) {
            setErrorMsg('Target Class is required.')
            return
          }
          const formData = new FormData()
          formData.append('name', name)
          formData.append('classId', classId)
          formData.append('maxMarks', maxMarks)
          formData.append('passMarks', passMarks)

          const res = await createExam(null, formData)
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Exam created successfully!')
            setName('')
            setClassId('')
            setMaxMarks('')
            setPassMarks('')
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Operation failed.')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create / Edit Exam Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/30 rounded-xl text-brand-blue-500">
            <FileCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">
            {editingExam ? 'Edit Examination' : 'Create Examination'}
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          {editingExam 
            ? `Modify settings for: ${editingExam.name} (${editingExam.class.name})`
            : 'Configure examination structures (e.g. Unit Test 1, Half Yearly) for class grades'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-955/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
              {successMsg}
            </div>
          )}

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="name">Exam Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Unit Test 1"
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-650 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="classId">Target Class</label>
              <select
                id="classId"
                name="classId"
                required
                disabled={!!editingExam}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="maxMarks">Max Marks</label>
                <input
                  id="maxMarks"
                  name="maxMarks"
                  type="number"
                  required
                  min="1"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="e.g. 40"
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-650 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="passMarks">Pass Marks</label>
                <input
                  id="passMarks"
                  name="passMarks"
                  type="number"
                  required
                  min="1"
                  value={passMarks}
                  onChange={(e) => setPassMarks(e.target.value)}
                  placeholder="e.g. 13"
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-650 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {editingExam && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-blue-700 hover:bg-brand-blue-600 active:bg-brand-blue-800 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : editingExam ? (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Exam
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Exams Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Active Examinations Directory</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">Class</th>
                <th className="py-3 font-semibold">Exam Name</th>
                <th className="py-3 font-semibold text-center">Max Marks</th>
                <th className="py-3 font-semibold text-center">Pass Marks</th>
                <th className="py-3 font-semibold text-center">Academic Year</th>
                <th className="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">No exams configured. Add one on the left.</td>
                </tr>
              ) : (
                exams.map(exam => (
                  <tr key={exam.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 font-extrabold text-white">{exam.class.name}</td>
                    <td className="py-4 font-medium text-slate-100">{exam.name}</td>
                    <td className="py-4 text-center text-brand-teal-500 font-bold">{exam.maxMarks}</td>
                    <td className="py-4 text-center text-brand-orange-500 font-bold">{exam.passMarks}</td>
                    <td className="py-4 text-center text-slate-405 font-medium">{exam.academicYear}</td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(exam)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Edit Exam"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id, exam.name, exam.class.name)}
                        disabled={isDeleting}
                        className="p-2 bg-red-955/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Delete Exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
