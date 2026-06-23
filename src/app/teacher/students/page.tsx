import Link from 'next/link'
import { db } from '@/lib/db'
import { StudentsDirectory } from './StudentsDirectory'
import { UserPlus, FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  // 1. Fetch Students
  const studentsData = await db.student.findMany({
    where: { status: 'ACTIVE' },
    include: {
      class: true,
      section: true
    },
    orderBy: [
      { class: { name: 'asc' } },
      { section: { name: 'asc' } },
      { rollNo: 'asc' }
    ]
  })

  // 2. Fetch Classes
  const classesData = await db.class.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Student Directory</h1>
          <p className="text-sm text-slate-400">Search and manage student registry cards, reports, and ID generation</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/students/import"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 border border-slate-700 font-semibold rounded-2xl transition-colors text-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Bulk Import Excel
          </Link>
          <Link
            href="/teacher/students/add"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-teal-600 hover:bg-brand-teal-505 active:bg-brand-teal-700 text-white font-semibold rounded-2xl transition-colors text-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Register Student
          </Link>
        </div>
      </div>

      <StudentsDirectory students={studentsData} classes={classesData} />
    </div>
  )
}
