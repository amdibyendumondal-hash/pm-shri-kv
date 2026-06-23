import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AttendanceBrowser } from './AttendanceBrowser'

export const dynamic = 'force-dynamic'

export default async function AdminAttendancePage() {
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
        <h1 className="text-2xl font-black text-white">Daily Attendance Ledger</h1>
        <p className="text-sm text-slate-400 font-medium">Monitor class-wise student presence, holidays, On-Duty (OD) statuses, and daily attendance statistics</p>
      </div>

      <AttendanceBrowser classes={classes} />
    </div>
  )
}
