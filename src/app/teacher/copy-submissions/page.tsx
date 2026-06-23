import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CopyLedger } from './CopyLedger'

export const dynamic = 'force-dynamic'

export default async function CopySubmissionsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    redirect('/login')
  }

  // Fetch all classes and their sections for selection
  const classes = await db.class.findMany({
    include: {
      sections: true
    },
    orderBy: { name: 'asc' }
  })

  // Fetch all subjects for copy checking selection
  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-black text-white">Notebook Checking Ledger</h1>
        <p className="text-sm text-slate-405 mt-1">
          Log daily student notebook copy submissions, quality checks, and remarks. Print clean class lists to paper records.
        </p>
      </div>

      <CopyLedger classes={classes} subjects={subjects} />
    </div>
  )
}
