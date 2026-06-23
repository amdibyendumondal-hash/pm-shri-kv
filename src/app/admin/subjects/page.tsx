import { db } from '@/lib/db'
import { SubjectForms } from './SubjectForms'

export const dynamic = 'force-dynamic'

export default async function SubjectsPage() {
  const subjectsData = await db.subject.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Subject Curriculum</h1>
        <p className="text-sm text-slate-400">Configure core, vocational, and elective subjects taught at PM SHRI KV</p>
      </div>

      <SubjectForms subjects={subjectsData} />
    </div>
  )
}
