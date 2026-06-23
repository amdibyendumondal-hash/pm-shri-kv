'use client'

import { useActionState, useState } from 'react'
import { createClass, createSection, assignClassTeacher } from '../actions'
import { Plus, UserCheck, CalendarDays, BookOpen, User } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  username: string
}

interface ClassFormsProps {
  classes: { id: string; name: string }[]
  teachers: Teacher[]
  sections: { id: string; name: string; className: string; classTeacherId: string | null }[]
}

export function ClassForms({ classes, teachers, sections }: ClassFormsProps) {
  const [classState, classFormAction, classPending] = useActionState(createClass, null)
  const [sectionState, sectionFormAction, sectionPending] = useActionState(createSection, null)
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [assignMessage, setAssignMessage] = useState('')
  const [assignError, setAssignError] = useState('')
  const [assignPending, setAssignPending] = useState(false)

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSection) return
    setAssignPending(true)
    setAssignMessage('')
    setAssignError('')

    const formData = new FormData()
    formData.append('sectionId', selectedSection)
    if (selectedTeacher) {
      formData.append('teacherId', selectedTeacher)
    }

    try {
      const res = await assignClassTeacher(formData)
      if (res.error) {
        setAssignError(res.error)
      } else {
        setAssignMessage('Class teacher assigned successfully!')
      }
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign class teacher.')
    } finally {
      setAssignPending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Create Class */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/30 rounded-xl text-brand-blue-500">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">Create New Class</h3>
        </div>
        <p className="text-xs text-slate-400">Add a new grade level for the active session (e.g. Class 11, Class 12)</p>
        
        <form action={classFormAction} className="space-y-4 pt-2">
          {classState?.error && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
              {classState.error}
            </div>
          )}
          {classState?.success && (
            <div className="p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
              Class created successfully!
            </div>
          )}
          <div className="space-y-1.5">
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Class 3"
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-600 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={classPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-blue-700 hover:bg-brand-blue-600 active:bg-brand-blue-800 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            {classPending ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Class
              </>
            )}
          </button>
        </form>
      </div>

      {/* Create Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-xl text-brand-teal-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">Create Section</h3>
        </div>
        <p className="text-xs text-slate-400">Configure sections for existing classes (e.g. Section A, B)</p>

        <form action={sectionFormAction} className="space-y-4 pt-2">
          {sectionState?.error && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
              {sectionState.error}
            </div>
          )}
          {sectionState?.success && (
            <div className="p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
              Section created successfully!
            </div>
          )}

          <div className="space-y-3">
            <select
              name="classId"
              required
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="">Select Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              name="name"
              type="text"
              required
              placeholder="e.g. A"
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none placeholder-slate-600 text-sm"
            />

            <select
              name="teacherId"
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="">Optional: Class Teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={sectionPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-teal-600 hover:bg-brand-teal-500 active:bg-brand-teal-750 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            {sectionPending ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Section
              </>
            )}
          </button>
        </form>
      </div>

      {/* Assign Class Teacher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-orange-500/10 border border-brand-orange-500/30 rounded-xl text-brand-orange-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">Assign Class Teacher</h3>
        </div>
        <p className="text-xs text-slate-400">Map class educators to class sections</p>

        <form onSubmit={handleAssignTeacher} className="space-y-4 pt-2">
          {assignError && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
              {assignError}
            </div>
          )}
          {assignMessage && (
            <div className="p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
              {assignMessage}
            </div>
          )}

          <div className="space-y-3">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              required
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-orange-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="">Select Section...</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.className} - Section {s.name}</option>
              ))}
            </select>

            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-orange-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="">Remove / Select Teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={assignPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-orange-500 hover:bg-brand-orange-600 active:bg-brand-orange-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            {assignPending ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Assign Teacher
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
