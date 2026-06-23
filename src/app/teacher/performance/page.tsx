import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getThresholdConfig } from '../actions'
import { PerformanceInsights } from './PerformanceInsights'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    redirect('/login')
  }

  // Fetch classes and sections
  const classes = await db.class.findMany({
    include: {
      sections: true,
      exams: true
    },
    orderBy: { name: 'asc' }
  })

  // Fetch subjects
  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' }
  })

  // Fetch student roster with marks and attendance
  const students = await db.student.findMany({
    where: { status: 'ACTIVE' },
    include: {
      class: true,
      section: true,
      marks: {
        include: {
          exam: true,
          subject: true
        }
      },
      attendance: true
    }
  })

  // Fetch threshold configuration
  const thresholdRes = await getThresholdConfig()
  const thresholdConfig = thresholdRes.success && thresholdRes.config 
    ? thresholdRes.config 
    : { remedialMax: 35, giftedMin: 75 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Performance Insights & AI Coach</h1>
        <p className="text-sm text-slate-405 mt-1">
          Classify student cohorts into Remedial, Mediocre, and Gifted tiers. Tune threshold configs and request AI diagnostics.
        </p>
      </div>

      <PerformanceInsights 
        classes={classes} 
        subjects={subjects} 
        students={students} 
        initialThresholds={thresholdConfig} 
      />
    </div>
  )
}
