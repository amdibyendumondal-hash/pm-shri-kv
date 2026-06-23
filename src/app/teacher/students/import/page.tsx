import { db } from '@/lib/db'
import { ExcelImporter } from './ExcelImporter'

export const dynamic = 'force-dynamic'

export default async function ExcelImportPage() {
  // Query all existing student admission numbers to pass as a duplicate check list
  const existingStudents = await db.student.findMany({
    select: { admissionNo: true }
  })
  const existingAdmissionNos = existingStudents.map(s => s.admissionNo)

  // Query classes list
  const classesData = await db.class.findMany({
    select: { id: true, name: true }
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">Excel Roster Import</h1>
        <p className="text-sm text-slate-400">Import student profiles in bulk using Excel (.xlsx) or CSV files</p>
      </div>

      <ExcelImporter 
        existingAdmissionNos={existingAdmissionNos} 
        classes={classesData} 
      />
    </div>
  )
}
