import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  Users, UserCheck, Heart, ShieldAlert, Award, 
  Sparkles, Baby, HelpCircle, BarChart3
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch all active students and their class/section info
  const students = await db.student.findMany({
    where: { status: 'ACTIVE' },
    include: {
      class: true,
      section: true
    }
  })

  // Helper functions
  const isBoy = (gender: string) => {
    const g = gender.toLowerCase()
    return g === 'male' || g === 'boy' || g === 'm'
  }

  const isGirl = (gender: string) => {
    const g = gender.toLowerCase()
    return g === 'female' || g === 'girl' || g === 'f'
  }

  const getSocialCategory = (s: any) => {
    const cat = s.socialCategory || s.category
    if (cat === 'General') return 'Gen'
    return cat || 'Gen'
  }

  // General counts
  const totalCount = students.length
  const boysCount = students.filter(s => isBoy(s.gender)).length
  const girlsCount = students.filter(s => isGirl(s.gender)).length
  const sgcCount = students.filter(s => s.singleGirlChild === 'Yes').length
  const minorityCount = students.filter(s => s.minority && s.minority !== 'Not applicable' && s.minority !== 'No').length
  const disabledCount = students.filter(s => s.physicallyDisabled === 'Yes').length
  const rteCount = students.filter(s => s.rte === 'Yes').length

  // Social category breakdown counts
  const socialCategories = ['Gen', 'OBC', 'SC', 'ST']
  
  const socialStats = socialCategories.map(cat => {
    const catStudents = students.filter(s => getSocialCategory(s) === cat)
    const boys = catStudents.filter(s => isBoy(s.gender)).length
    const girls = catStudents.filter(s => isGirl(s.gender)).length
    return {
      category: cat,
      boys,
      girls,
      total: catStudents.length
    }
  })

  // Admission category breakdown counts
  const admissionCategories = ['I', 'II', 'III', 'IV', 'V', 'VI']
  const admissionStats = admissionCategories.map(cat => {
    const count = students.filter(s => s.admissionCategory === cat).length
    return {
      category: `Category ${cat}`,
      count
    }
  })
  
  // Count for other/unspecified admission category
  const unspecifiedAdmissionCount = students.filter(s => !s.admissionCategory || !admissionCategories.includes(s.admissionCategory)).length
  if (unspecifiedAdmissionCount > 0) {
    admissionStats.push({
      category: 'Others / General',
      count: unspecifiedAdmissionCount
    })
  }

  // Class-wise statistics grouping
  const classes = await db.class.findMany({
    include: {
      sections: {
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })

  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id)
    
    // Group by section
    const sectionBreakdown = cls.sections.map(sec => {
      const secStudents = classStudents.filter(s => s.sectionId === sec.id)
      const secBoys = secStudents.filter(s => isBoy(s.gender)).length
      const secGirls = secStudents.filter(s => isGirl(s.gender)).length
      
      const genBoys = secStudents.filter(s => isBoy(s.gender) && getSocialCategory(s) === 'Gen').length
      const genGirls = secStudents.filter(s => isGirl(s.gender) && getSocialCategory(s) === 'Gen').length
      const obcBoys = secStudents.filter(s => isBoy(s.gender) && getSocialCategory(s) === 'OBC').length
      const obcGirls = secStudents.filter(s => isGirl(s.gender) && getSocialCategory(s) === 'OBC').length
      const scBoys = secStudents.filter(s => isBoy(s.gender) && getSocialCategory(s) === 'SC').length
      const scGirls = secStudents.filter(s => isGirl(s.gender) && getSocialCategory(s) === 'SC').length
      const stBoys = secStudents.filter(s => isBoy(s.gender) && getSocialCategory(s) === 'ST').length
      const stGirls = secStudents.filter(s => isGirl(s.gender) && getSocialCategory(s) === 'ST').length

      return {
        sectionId: sec.id,
        sectionName: sec.name,
        total: secStudents.length,
        boys: secBoys,
        girls: secGirls,
        sgc: secStudents.filter(s => s.singleGirlChild === 'Yes').length,
        minority: secStudents.filter(s => s.minority && s.minority !== 'Not applicable' && s.minority !== 'No').length,
        rte: secStudents.filter(s => s.rte === 'Yes').length,
        disabled: secStudents.filter(s => s.physicallyDisabled === 'Yes').length,
        social: {
          gen: { boys: genBoys, girls: genGirls, total: genBoys + genGirls },
          obc: { boys: obcBoys, girls: obcGirls, total: obcBoys + obcGirls },
          sc: { boys: scBoys, girls: scGirls, total: scBoys + scGirls },
          st: { boys: stBoys, girls: stGirls, total: stBoys + stGirls }
        }
      }
    })

    const classBoys = classStudents.filter(s => isBoy(s.gender)).length
    const classGirls = classStudents.filter(s => isGirl(s.gender)).length

    return {
      classId: cls.id,
      className: cls.name,
      total: classStudents.length,
      boys: classBoys,
      girls: classGirls,
      sgc: classStudents.filter(s => s.singleGirlChild === 'Yes').length,
      minority: classStudents.filter(s => s.minority && s.minority !== 'Not applicable' && s.minority !== 'No').length,
      rte: classStudents.filter(s => s.rte === 'Yes').length,
      disabled: classStudents.filter(s => s.physicallyDisabled === 'Yes').length,
      sections: sectionBreakdown
    }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Enrollment & Demographics Statistics</h1>
        <p className="text-sm text-slate-400">Class-wise statistics, gender distribution, admission category enrollment, and welfare summaries</p>
      </div>

      {/* Top Level Metric Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl border border-brand-blue-500/20 bg-brand-blue-500/10 flex items-center justify-center text-brand-blue-500 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Active Enrollment</span>
          <span className="text-3xl font-black text-white mt-1 block">{totalCount}</span>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal-500" />
            Co-educational roster
          </div>
        </div>

        {/* Gender Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl border border-brand-teal-500/20 bg-brand-teal-500/10 flex items-center justify-center text-brand-teal-500 group-hover:scale-110 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Gender Breakdown</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-blue-400">{boysCount} <span className="text-[10px] text-slate-500 font-semibold uppercase">Boys</span></span>
            <span className="text-2xl font-black text-pink-400">{girlsCount} <span className="text-[10px] text-slate-500 font-semibold uppercase">Girls</span></span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            Ratio: {boysCount > 0 ? (girlsCount / boysCount).toFixed(2) : 0} girls per boy
          </div>
        </div>

        {/* Welfare Toggles */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl border border-pink-500/20 bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Single Girl Child (SGC)</span>
          <span className="text-3xl font-black text-pink-400 mt-1 block">{sgcCount}</span>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            Special girl incentive scheme
          </div>
        </div>

        {/* Minority / RTE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Award className="h-6 w-6" />
          </div>
          <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Welfare & RTE</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-xl font-black text-indigo-400">{rteCount} <span className="text-[10px] text-slate-500 font-semibold">RTE</span></span>
            <span className="text-xl font-black text-purple-400">{minorityCount} <span className="text-[10px] text-slate-500 font-semibold">Minority</span></span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            Physically Disabled: <span className="text-white font-bold">{disabledCount} students</span>
          </div>
        </div>
      </div>

      {/* Grid: Social Categories & Admission Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Social Category Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-brand-teal-500" />
            Social Category & Gender-wise Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">Category</th>
                  <th className="py-2.5 font-semibold text-center text-blue-400">Boys (Male)</th>
                  <th className="py-2.5 font-semibold text-center text-pink-400">Girls (Female)</th>
                  <th className="py-2.5 font-semibold text-right">Total Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {socialStats.map(stat => (
                  <tr key={stat.category} className="hover:bg-slate-850/20 text-slate-300">
                    <td className="py-3 font-extrabold text-white">{stat.category}</td>
                    <td className="py-3 text-center font-bold text-blue-400/90">{stat.boys}</td>
                    <td className="py-3 text-center font-bold text-pink-400/90">{stat.girls}</td>
                    <td className="py-3 text-right font-black text-brand-blue-400">{stat.total}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-800 font-bold bg-slate-950/25">
                  <td className="py-3 text-white uppercase font-black">Grand Total</td>
                  <td className="py-3 text-center text-blue-400 font-black">{boysCount}</td>
                  <td className="py-3 text-center text-pink-400 font-black">{girlsCount}</td>
                  <td className="py-3 text-right text-brand-teal-400 font-black">{totalCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Admission Category Enrollment */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-brand-blue-500" />
            Admission Category Distribution
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">Category Priority</th>
                  <th className="py-2.5 font-semibold text-right">Registered Count</th>
                  <th className="py-2.5 font-semibold text-right w-32">Percentage Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {admissionStats.map(stat => {
                  const share = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0
                  return (
                    <tr key={stat.category} className="hover:bg-slate-850/20 text-slate-300">
                      <td className="py-3 font-extrabold text-white">{stat.category}</td>
                      <td className="py-3 text-right font-black text-slate-200">{stat.count}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-brand-teal-400">{share}%</span>
                          <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                            <div className="bg-brand-teal-500 h-full rounded-full" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Class-wise Details Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-brand-blue-500" />
          Class & Section Demographic Roster
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="py-3 pl-3">Class/Section</th>
                <th className="py-3 text-center">Total</th>
                <th className="py-3 text-center text-blue-400">Boys</th>
                <th className="py-3 text-center text-pink-400">Girls</th>
                <th className="py-3 text-center text-pink-500">SGC</th>
                <th className="py-3 text-center text-purple-400">Minority</th>
                <th className="py-3 text-center text-indigo-400">RTE</th>
                <th className="py-3 text-center text-amber-500">Disabled</th>
                <th className="py-3 text-center border-l border-slate-800/80">GEN (B/G)</th>
                <th className="py-3 text-center">OBC (B/G)</th>
                <th className="py-3 text-center">SC (B/G)</th>
                <th className="py-3 text-center">ST (B/G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {classStats.map(cls => {
                if (cls.total === 0) return null
                return (
                  <tr key={cls.classId} className="hover:bg-slate-850/10 text-slate-350 transition-colors font-medium">
                    <td className="py-3.5 pl-3 font-extrabold text-white">{cls.className}</td>
                    <td className="py-3.5 text-center font-black text-white">{cls.total}</td>
                    <td className="py-3.5 text-center font-bold text-blue-400">{cls.boys}</td>
                    <td className="py-3.5 text-center font-bold text-pink-400">{cls.girls}</td>
                    <td className="py-3.5 text-center font-black text-pink-500">{cls.sgc}</td>
                    <td className="py-3.5 text-center font-bold text-purple-400">{cls.minority}</td>
                    <td className="py-3.5 text-center font-bold text-indigo-400">{cls.rte}</td>
                    <td className="py-3.5 text-center font-bold text-amber-500">{cls.disabled}</td>
                    
                    {/* Social Categories for whole Class (aggregated) */}
                    {(() => {
                      const gen = statSocialCategorySum(cls.sections, 'gen')
                      const obc = statSocialCategorySum(cls.sections, 'obc')
                      const sc = statSocialCategorySum(cls.sections, 'sc')
                      const st = statSocialCategorySum(cls.sections, 'st')
                      return (
                        <>
                          <td className="py-3.5 text-center border-l border-slate-800/80 font-mono text-[10px]">
                            {gen.total} <span className="text-slate-500">({gen.boys}/{gen.girls})</span>
                          </td>
                          <td className="py-3.5 text-center font-mono text-[10px]">
                            {obc.total} <span className="text-slate-500">({obc.boys}/{obc.girls})</span>
                          </td>
                          <td className="py-3.5 text-center font-mono text-[10px]">
                            {sc.total} <span className="text-slate-500">({sc.boys}/{sc.girls})</span>
                          </td>
                          <td className="py-3.5 text-center font-mono text-[10px]">
                            {st.total} <span className="text-slate-500">({st.boys}/{st.girls})</span>
                          </td>
                        </>
                      )
                    })()}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Helper to sum subcategories across sections
function statSocialCategorySum(sections: any[], key: 'gen' | 'obc' | 'sc' | 'st') {
  return sections.reduce((acc, sec) => {
    const data = sec.social[key]
    return {
      boys: acc.boys + data.boys,
      girls: acc.girls + data.girls,
      total: acc.total + data.total
    }
  }, { boys: 0, girls: 0, total: 0 })
}
