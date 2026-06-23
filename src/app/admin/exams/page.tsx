import { db } from '@/lib/db'
import { ExamForms } from './ExamForms'

export const dynamic = 'force-dynamic'

export default async function ExamsPage() {
  // 1. Fetch Classes
  const classesData = await db.class.findMany({
    orderBy: { name: 'asc' }
  })

  // 2. Fetch Exams with Class details
  const examsData = await db.exam.findMany({
    include: {
      class: true
    },
    orderBy: [
      { class: { name: 'asc' } },
      { name: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Academic Examinations</h1>
        <p className="text-sm text-slate-400">Configure examination structures, mark distributions, and target class schedules</p>
      </div>

      <ExamForms classes={classesData} exams={examsData} />
    </div>
  )
}
