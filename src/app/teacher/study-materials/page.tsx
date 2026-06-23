import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getStudyMaterials } from '../actions'
import { MaterialsManager } from './MaterialsManager'

export const dynamic = 'force-dynamic'

export default async function StudyMaterialsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    redirect('/login')
  }

  // Fetch all classes
  const classes = await db.class.findMany({
    orderBy: { name: 'asc' }
  })

  // Fetch all subjects
  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' }
  })

  // Fetch existing study materials
  const res = await getStudyMaterials()
  const materials = res.success ? (res.list || []) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Study Materials Lab</h1>
        <p className="text-sm text-slate-405 mt-1">
          Upload PDF textbooks, lecture slides, or revision notes to project and present on active classroom whiteboards.
        </p>
      </div>

      <MaterialsManager 
        initialMaterials={materials} 
        classes={classes} 
        subjects={subjects} 
        teacherId={user.id}
        teacherName={user.name}
      />
    </div>
  )
}
