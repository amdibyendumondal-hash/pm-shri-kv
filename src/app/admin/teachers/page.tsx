import { db } from '@/lib/db'
import { TeachersManager } from './TeachersManager'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TeachersPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch all teacher accounts
  const teachers = await db.user.findMany({
    where: { role: 'TEACHER' },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Teacher Management</h1>
        <p className="text-sm text-slate-400">Manage school faculty credentials, accounts, and system registration</p>
      </div>

      <TeachersManager teachers={teachers} />
    </div>
  )
}
