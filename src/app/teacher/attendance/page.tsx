import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AttendanceSheet } from './AttendanceSheet'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const user = await getCurrentUser()
  if (!user) return null

  // 1. Fetch all classes and their sections
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

  // 2. Find if this teacher is assigned as a Class Teacher
  const section = await db.section.findFirst({
    where: { classTeacherId: user.id },
    include: { class: true }
  })

  // Set default selection values
  let defaultClassId = ''
  let defaultSectionId = ''

  if (section) {
    defaultClassId = section.classId
    defaultSectionId = section.id
  } else if (classesData.length > 0) {
    defaultClassId = classesData[0].id
    if (classesData[0].sections.length > 0) {
      defaultSectionId = classesData[0].sections[0].id
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Daily Attendance Ledger</h1>
        <p className="text-sm text-slate-400">Compile daily attendance logs and trigger automatic notification alerts for absentees</p>
      </div>

      <AttendanceSheet 
        classes={mappedClasses} 
        defaultClassId={defaultClassId} 
        defaultSectionId={defaultSectionId} 
      />
    </div>
  )
}
