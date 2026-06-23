'use client'

import { useActionState, useState } from 'react'
import { createHouse, deleteHouse, updateHouse } from '../actions'
import { Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react'

interface House {
  id: string
  name: string
}

interface HouseManagerProps {
  houses: House[]
}

export function HouseManager({ houses }: HouseManagerProps) {
  const [createState, createFormAction, createPending] = useActionState(createHouse, null)
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')
  const [updatePending, setUpdatePending] = useState(false)
  const [deletePendingId, setDeletePendingId] = useState('')

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  const handleCancelEdit = () => {
    setEditingId('')
    setEditingName('')
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return
    setUpdatePending(true)
    try {
      const res = await updateHouse(id, editingName.trim())
      if (res && res.error) {
        alert(res.error)
      } else {
        setEditingId('')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update house name.')
    } finally {
      setUpdatePending(false)
    }
  }

  const handleDeleteHouse = async (id: string, name: string) => {
    const confirmMsg = `Are you sure you want to delete the house group "${name}"? All assigned students will have their house group set to none. This cannot be undone.`
    if (!window.confirm(confirmMsg)) return

    setDeletePendingId(id)
    try {
      const res = await deleteHouse(id)
      if (res && res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete house.')
    } finally {
      setDeletePendingId('')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      {/* Create House Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">Create House Group</h3>
        </div>
        <p className="text-xs text-slate-400">Add a new student house division (e.g. Shivaji, Tagore, Ashoka, Raman)</p>

        <form action={createFormAction} className="space-y-4 pt-2">
          {createState?.error && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
              {createState.error}
            </div>
          )}
          {createState?.success && (
            <div className="p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
              House created successfully!
            </div>
          )}

          <div className="space-y-1.5">
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Shivaji"
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-indigo-500 rounded-xl text-white outline-none placeholder-slate-600 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={createPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            {createPending ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add House Group
              </>
            )}
          </button>
        </form>
      </div>

      {/* House Listings and Rename/Delete List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl md:col-span-2 space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" />
          Configured School House Groups
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {houses.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm italic">
              No school house groups configured yet. Use the form to configure your houses.
            </div>
          ) : (
            houses.map(h => {
              const isEditing = editingId === h.id
              return (
                <div key={h.id} className="p-4 bg-slate-955 border border-slate-850 rounded-2xl flex items-center justify-between gap-4">
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white outline-none text-xs"
                      />
                      <button
                        onClick={() => handleSaveEdit(h.id)}
                        disabled={updatePending}
                        className="p-1.5 bg-brand-teal-500/10 text-brand-teal-500 border border-brand-teal-500/20 hover:bg-brand-teal-500/20 rounded-lg cursor-pointer"
                        title="Save Changes"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-white text-sm block">{h.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">House Division</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStartEdit(h.id, h.name)}
                          className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/20 border border-transparent hover:border-indigo-900/30 rounded-lg transition-all cursor-pointer"
                          title="Rename House"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHouse(h.id, h.name)}
                          disabled={deletePendingId === h.id}
                          className="p-1.5 text-slate-555 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="Delete House"
                        >
                          {deletePendingId === h.id ? (
                            <div className="h-3.5 w-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
