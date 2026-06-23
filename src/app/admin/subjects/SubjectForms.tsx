'use client'

import { useState, useTransition } from 'react'
import { createSubject, updateSubject, deleteSubject } from '../actions'
import { Plus, Trash2, BookOpen, Pencil, X, Check } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
}

interface SubjectFormsProps {
  subjects: Subject[]
}

export function SubjectForms({ subjects }: SubjectFormsProps) {
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isPending, startTransition] = useTransition()
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  // Form Field States
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleStartEdit = (sub: Subject) => {
    setEditingSubject(sub)
    setName(sub.name)
    setCode(sub.code)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleCancelEdit = () => {
    setEditingSubject(null)
    setName('')
    setCode('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the subject "${name}"?`)) return
    startDeleteTransition(async () => {
      try {
        const res = await deleteSubject(id)
        if (res.error) {
          alert(res.error)
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete subject.')
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!name || !code) {
      setErrorMsg('Subject Name and Code are required.')
      return
    }

    startTransition(async () => {
      try {
        if (editingSubject) {
          const res = await updateSubject(editingSubject.id, name, code)
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Subject updated successfully!')
            setEditingSubject(null)
            setName('')
            setCode('')
          }
        } else {
          const formData = new FormData()
          formData.append('name', name)
          formData.append('code', code)

          const res = await createSubject(null, formData)
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Subject added successfully!')
            setName('')
            setCode('')
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Operation failed.')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create / Edit Subject Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/30 rounded-xl text-brand-blue-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          {editingSubject 
            ? `Modify curriculum properties for: ${editingSubject.name}`
            : 'Define academic curriculum or vocational subjects (e.g. Mathematics, Sanskrit)'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
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
              <label className="text-xs font-semibold text-slate-400" htmlFor="name">Subject Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Social Science"
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-650 text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="code">Subject Code</label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SOC101"
                className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-650 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {editingSubject && (
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
              ) : editingSubject ? (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Subject
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subjects Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Subject Curriculum List</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">Subject Code</th>
                <th className="py-3 font-semibold">Subject Name</th>
                <th className="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 italic">No subjects configured. Add one on the left.</td>
                </tr>
              ) : (
                subjects.map(sub => (
                  <tr key={sub.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 font-mono text-brand-teal-500 font-semibold">{sub.code}</td>
                    <td className="py-4 font-bold text-white">{sub.name}</td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(sub)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Edit Subject"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        disabled={isDeleting}
                        className="p-2 bg-red-955/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Delete Subject"
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
