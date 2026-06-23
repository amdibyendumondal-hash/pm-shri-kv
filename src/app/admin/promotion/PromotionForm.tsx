'use client'

import { useActionState, useEffect } from 'react'
import { promoteStudents } from '../actions'
import { GraduationCap, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ClassData {
  id: string
  name: string
  _count?: {
    students: number
  }
}

interface PromotionFormProps {
  classes: ClassData[]
}

export function PromotionForm({ classes }: PromotionFormProps) {
  const [state, formAction, isPending] = useActionState(promoteStudents, null)

  useEffect(() => {
    if (state?.success) {
      // Trigger canvas-confetti celebration
      const duration = 3 * 1000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#1d4ed8', '#0d9488', '#ea580c']
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#1d4ed8', '#0d9488', '#ea580c']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [state])

  const handlePromoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(e.currentTarget)
    const sourceId = data.get('sourceClassId') as string
    const targetId = data.get('targetClassId') as string

    const sourceClass = classes.find(c => c.id === sourceId)
    const targetClass = classes.find(c => c.id === targetId)

    if (!sourceClass || !targetClass) return

    const confirmMsg = `Are you sure you want to promote students from "${sourceClass.name}" to "${targetClass.name}"?\n\nThis will update all active students inside ${sourceClass.name} to become members of ${targetClass.name} (assigned to the first configured section).`
    
    if (!confirm(confirmMsg)) {
      e.preventDefault()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Promotion Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 lg:col-span-7">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-orange-500/10 border border-brand-orange-500/30 rounded-xl text-brand-orange-500">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white">Batch Student Promotion</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          At the end of an academic session, promote students to the next class level in bulk (e.g. promoting Class 9 to Class 10). 
          Students' personal profiles, historical logs, attendance history, and past grades are automatically preserved and carried forward.
        </p>

        <form onSubmit={handlePromoteSubmit} action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-xs">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-4 bg-teal-950/40 border border-teal-900/50 rounded-2xl text-teal-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sparkles className="h-4 w-4 text-brand-teal-500 animate-spin" />
                Promotion Complete!
              </div>
              <p>Successfully promoted students to the new class level. Check out the student profiles!</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Source Class */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="sourceClassId">Source Class (From)</label>
              <select
                id="sourceClassId"
                name="sourceClassId"
                required
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-brand-orange-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              >
                <option value="">Select Source...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c._count?.students || 0} Students)</option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div className="shrink-0 p-2 bg-slate-800/80 rounded-full border border-slate-700 hidden sm:block">
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>

            {/* Target Class */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="targetClassId">Target Class (To)</label>
              <select
                id="targetClassId"
                name="targetClassId"
                required
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-brand-orange-500 rounded-xl text-white outline-none text-sm cursor-pointer"
              >
                <option value="">Select Target...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-orange-500 hover:bg-brand-orange-600 active:bg-brand-orange-700 text-white font-semibold rounded-2xl text-sm transition-colors cursor-pointer"
          >
            {isPending ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <GraduationCap className="h-4.5 w-4.5" />
                Commit Batch Promotion
              </>
            )}
          </button>
        </form>
      </div>

      {/* Information Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-5 space-y-4">
        <div className="flex items-center gap-3 text-brand-orange-500">
          <AlertTriangle className="h-5 w-5" />
          <h4 className="font-bold text-white">Promotion Warning</h4>
        </div>
        <div className="text-xs text-slate-350 space-y-3 leading-relaxed">
          <p>Before initiating class promotion, verify that:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Target Class has been configured in the system.</li>
            <li>All subject marks have been compiled for the source class.</li>
            <li>Section configurations exist for the target class level.</li>
          </ul>
          <p className="p-3 bg-brand-orange-500/5 border border-brand-orange-500/10 rounded-xl text-brand-orange-500 text-[10px] font-semibold">
            WARNING: This batch operation updates the class assignments of all active students in the source class in a single transaction. Please double-check class selections before committing.
          </p>
        </div>
      </div>
    </div>
  )
}
