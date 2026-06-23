'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteClass, deleteSection } from '../actions'

interface DeleteClassOrSectionProps {
  id: string
  type: 'class' | 'section'
  name: string
}

export function DeleteClassOrSection({ id, type, name }: DeleteClassOrSectionProps) {
  const [pending, setPending] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmMsg = `Are you sure you want to delete this ${type}: "${name}"? This action cannot be undone.`
    if (!window.confirm(confirmMsg)) return

    setPending(true)
    try {
      const res = type === 'class' ? await deleteClass(id) : await deleteSection(id)
      if (res && res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || `Failed to delete ${type}.`)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-1.5 text-slate-550 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
      title={`Delete ${type}`}
    >
      {pending ? (
        <div className="h-3.5 w-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
