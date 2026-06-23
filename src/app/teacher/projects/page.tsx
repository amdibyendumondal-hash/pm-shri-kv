import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProjects } from '../actions'
import ProjectManager from './ProjectManager'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const res = await getProjects()
  const projects = res.success ? (res.projects || []) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">GeoGebra & HTML Project Lab</h1>
        <p className="text-sm text-slate-405 mt-1">
          Upload, manage, and present interactive Math/Science simulations on classroom projectors.
        </p>
      </div>
      
      <ProjectManager initialProjects={projects} teacherId={user.id} teacherName={user.name} />
    </div>
  )
}
