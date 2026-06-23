import { db } from '@/lib/db'
import { StudentAddForm } from './StudentAddForm'

export const dynamic = 'force-dynamic'

export default async function AddStudentPage() {
  // Fetch classes and sections to map them in the dropdown
  const classesData = await db.class.findMany({
    include: {
      sections: true
    },
    orderBy: { name: 'asc' }
  })

  const mappedClasses = classesData.map(c => ({
    id: c.id,
    name: c.name,
    sections: c.sections.map(s => ({
      id: s.id,
      name: s.name
    }))
  }))

  const housesData = await db.house.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Student Registration</h1>
        <p className="text-sm text-slate-400">Register a new student profile in the school registry</p>
      </div>

      <StudentAddForm classes={mappedClasses} houses={housesData} />
    </div>
  )
}
