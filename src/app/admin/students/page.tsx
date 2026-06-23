import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StudentRecordsBrowser } from './StudentRecordsBrowser'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch classes and sections for the select inputs
  const classes = await db.class.findMany({
    include: {
      sections: {
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Student Records Directory</h1>
        <p className="text-sm text-slate-400">View detailed student profiles, admission properties, welfare indicators, and fees class-wise</p>
      </div>

      <StudentRecordsBrowser classes={classes} />
    </div>
  )
}
