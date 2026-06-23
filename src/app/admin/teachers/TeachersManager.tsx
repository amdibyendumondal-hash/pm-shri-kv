'use client'

import { useState, useTransition } from 'react'
import { createTeacher, updateTeacher, deleteTeacher } from '../actions'
import { Plus, UserPlus, Users, Trash2, ShieldCheck, Mail, Key, User, Pencil, X, Check } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  username: string
  email: string | null
  createdAt: Date
}

interface TeachersManagerProps {
  teachers: Teacher[]
}

export function TeachersManager({ teachers }: TeachersManagerProps) {
  const [deletePendingId, setDeletePendingId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Form Field States
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleStartEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setName(teacher.name)
    setUsername(teacher.username)
    setEmail(teacher.email || '')
    setPassword('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleCancelEdit = () => {
    setEditingTeacher(null)
    setName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleDeleteTeacher = async (id: string, name: string) => {
    const confirmMsg = `Are you sure you want to delete the teacher account for "${name}"? They will lose access immediately.`
    if (!window.confirm(confirmMsg)) return

    setDeletePendingId(id)
    try {
      const res = await deleteTeacher(id)
      if (res && res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete teacher.')
    } finally {
      setDeletePendingId('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!name || !username) {
      setErrorMsg('Full Name and Username are required.')
      return
    }

    startTransition(async () => {
      try {
        if (editingTeacher) {
          const res = await updateTeacher(
            editingTeacher.id,
            name,
            username,
            email || null,
            password || undefined
          )
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Teacher account updated successfully!')
            setEditingTeacher(null)
            setName('')
            setUsername('')
            setEmail('')
            setPassword('')
          }
        } else {
          if (!password) {
            setErrorMsg('Password is required for new accounts.')
            return
          }
          const formData = new FormData()
          formData.append('name', name)
          formData.append('username', username)
          formData.append('email', email)
          formData.append('password', password)

          const res = await createTeacher(null, formData)
          if (res && res.error) {
            setErrorMsg(res.error)
          } else {
            setSuccessMsg('Teacher account created successfully!')
            setName('')
            setUsername('')
            setEmail('')
            setPassword('')
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Operation failed.')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create / Edit Teacher Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1 h-fit">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-xl text-brand-teal-500">
            <UserPlus className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">
            {editingTeacher ? 'Edit Teacher Account' : 'Add Teacher Account'}
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          {editingTeacher 
            ? `Modify settings for faculty member: ${editingTeacher.name}` 
            : 'Register a new class educator account to grant access to rosters and grading books'}
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

          <div className="space-y-3">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S. K. Mahanta"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none placeholder-slate-700 text-xs"
                />
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-650" />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Username</label>
              <div className="relative">
                <input
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. skmahanta"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none placeholder-slate-700 text-xs"
                />
                <ShieldCheck className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-650" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address (Optional)</label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sk@gmail.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none placeholder-slate-700 text-xs"
                />
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-650" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                {editingTeacher ? 'New Password (Leave blank to keep current)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required={!editingTeacher}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingTeacher ? 'Enter new password...' : 'Minimum 6 characters'}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none placeholder-slate-700 text-xs"
                />
                <Key className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-650" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editingTeacher && (
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
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-teal-600 hover:bg-brand-teal-505 active:bg-brand-teal-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : editingTeacher ? (
                <>
                  <Check className="h-4.5 w-4.5" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  Create Teacher Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Teacher Directory List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/30 rounded-xl text-brand-blue-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">School Faculty Directory</h3>
            <p className="text-xs text-slate-400">Total registered teachers: {teachers.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-850 text-slate-450 uppercase tracking-wider">
                <th className="py-2.5 font-semibold">Name</th>
                <th className="py-2.5 font-semibold">Username</th>
                <th className="py-2.5 font-semibold">Email</th>
                <th className="py-2.5 font-semibold">Registered</th>
                <th className="py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">No teacher accounts configured. Use the form to add one.</td>
                </tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-850/20 text-slate-350 transition-colors">
                    <td className="py-3.5 font-bold text-white">{t.name}</td>
                    <td className="py-3.5 font-mono">{t.username}</td>
                    <td className="py-3.5 text-slate-400">{t.email || '-'}</td>
                    <td className="py-3.5 text-slate-450">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-1.5 text-slate-550 hover:text-brand-teal-500 hover:bg-brand-teal-500/10 border border-transparent hover:border-brand-teal-500/25 rounded-lg transition-all cursor-pointer"
                        title="Edit teacher details"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id, t.name)}
                        disabled={deletePendingId === t.id}
                        className="p-1.5 text-slate-550 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Delete teacher account"
                      >
                        {deletePendingId === t.id ? (
                          <div className="h-3.5 w-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mx-auto" />
                        )}
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
