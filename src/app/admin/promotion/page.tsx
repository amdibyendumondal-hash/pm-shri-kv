import { db } from '@/lib/db'
import { PromotionForm } from './PromotionForm'

export const dynamic = 'force-dynamic'

export default async function PromotionPage() {
  const classesData = await db.class.findMany({
    include: {
      _count: {
        select: { students: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Student Promotion Manager</h1>
        <p className="text-sm text-slate-400">Batch-promote students to the next grade level for the new academic session</p>
      </div>

      <PromotionForm classes={classesData} />
    </div>
  )
}
