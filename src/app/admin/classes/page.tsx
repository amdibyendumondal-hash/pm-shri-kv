import { db } from '@/lib/db'
import { ClassForms } from './ClassForms'
import { DeleteClassOrSection } from './DeleteClassOrSection'
import { HouseManager } from './HouseManager'
import { GraduationCap, Users, User, Landmark, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClassesPage() {
  // 1. Fetch Classes
  const classesData = await db.class.findMany({
    orderBy: { name: 'asc' }
  })

  // 2. Fetch Teachers
  const teachersData = await db.user.findMany({
    where: { role: 'TEACHER' },
    select: {
      id: true,
      name: true,
      username: true
    },
    orderBy: { name: 'asc' }
  })

  // 3. Fetch Sections with their Class and Teacher details
  const sectionsDetailed = await db.section.findMany({
    include: {
      class: true,
      students: {
        where: { status: 'ACTIVE' }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Map sections for ClassForms component
  const sectionsData = sectionsDetailed.map(s => ({
    id: s.id,
    name: s.name,
    className: s.class.name,
    classTeacherId: s.classTeacherId
  }))

  // Group sections by Class ID for display list
  const classesDetailed = await db.class.findMany({
    include: {
      sections: {
        include: {
          students: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Fetch teacher names mapping for easy lookup
  const teacherMap: Record<string, string> = {}
  teachersData.forEach(t => {
    teacherMap[t.id] = t.name
  })

  // 4. Fetch School House groups
  const housesData = await db.house.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Classes & Sections</h1>
        <p className="text-sm text-slate-400">Configure school academic session classes, sections, and teacher mappings</p>
      </div>

      {/* Creation and Assignment Forms */}
      <ClassForms 
        classes={classesData} 
        teachers={teachersData} 
        sections={sectionsData} 
      />

      {/* Classes & Sections Structure Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Landmark className="h-4.5 w-4.5 text-brand-blue-500" />
          School Structure Directory
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classesDetailed.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm">
              No classes configured yet. Use the panel above to add your first class.
            </div>
          ) : (
            classesDetailed.map(cls => (
              <div key={cls.id} className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/30 rounded-xl text-brand-blue-500">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-extrabold text-white">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-700 uppercase">
                      {cls.sections.length} Sections
                    </span>
                    <DeleteClassOrSection id={cls.id} type="class" name={cls.name} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {cls.sections.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No sections configured for this class.</p>
                  ) : (
                    cls.sections.map(sec => {
                      const totalStudents = sec.students.length
                      const teacherName = sec.classTeacherId ? teacherMap[sec.classTeacherId] : 'Not Assigned'
                      return (
                        <div key={sec.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850/50 rounded-xl text-xs hover:border-slate-800 transition-colors">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-200 block">Section {sec.name}</span>
                            <div className="flex items-center gap-1.5 text-slate-450 text-[10px]">
                              <User className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[150px]">{teacherName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 font-semibold text-brand-teal-500 bg-brand-teal-500/5 px-2.5 py-1 border border-brand-teal-500/10 rounded-lg">
                              <Users className="h-3.5 w-3.5" />
                              <span>{totalStudents} Students</span>
                            </div>
                            <DeleteClassOrSection id={sec.id} type="section" name={`${cls.name} - Sec ${sec.name}`} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* House Divisions Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
        <div>
          <h3 className="font-extrabold text-white text-base">School House Group Settings</h3>
          <p className="text-xs text-slate-400">Create, rename, or remove student house groups</p>
        </div>
        <HouseManager houses={housesData} />
      </div>
    </div>
  )
}
