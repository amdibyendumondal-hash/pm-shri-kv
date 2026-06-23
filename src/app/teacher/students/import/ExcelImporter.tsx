'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { importStudentsFromExcel } from '../../actions'
import { 
  FileSpreadsheet, Upload, ArrowRight, CheckCircle2, 
  AlertTriangle, RefreshCw, HelpCircle, Columns, ChevronRight 
} from 'lucide-react'

interface ExcelImporterProps {
  existingAdmissionNos: string[]
  classes: { id: string; name: string }[]
}

const REQUIRED_FIELDS = [
  { key: 'admissionNo', label: 'Admission Number' },
  { key: 'rollNo', label: 'Roll Number' },
  { key: 'name', label: 'Student Name' },
  { key: 'class', label: 'Class (e.g. Class 10)' },
  { key: 'section', label: 'Section (e.g. A)' },
  { key: 'gender', label: 'Gender (e.g. Male/Female)' },
  { key: 'fatherName', label: "Father's Name" },
  { key: 'motherName', label: "Mother's Name" },
  { key: 'mobile', label: 'Mobile Number' },
]

const OPTIONAL_FIELDS = [
  { key: 'admissionYear', label: 'Admission Year' },
  { key: 'studentCode', label: 'Student Code' },
  { key: 'admissionCategory', label: 'Admission Category (I-VI)' },
  { key: 'socialCategory', label: 'Social Category (Gen, SC, ST, OBC)' },
  { key: 'minority', label: 'Minority Status' },
  { key: 'physicallyDisabled', label: 'Physically Disabled (Yes/No)' },
  { key: 'singleGirlChild', label: 'Single Girl Child (Yes/No)' },
  { key: 'rte', label: 'RTE (Yes/No)' },
  { key: 'kvsWard', label: 'KVS Ward (Yes/No)' },
  { key: 'reimbursementClaimed', label: 'Reimbursement Claimed (Yes/No)' },
  
  { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)' },
  { key: 'bloodGroup', label: 'Blood Group' },
  { key: 'aadhaarNo', label: 'Aadhaar Number' },
  { key: 'religion', label: 'Religion' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'guardianName', label: 'Guardian Name' },
  { key: 'altMobile', label: 'Alternate Mobile' },
  { key: 'email', label: 'Email Address' },
  
  { key: 'village', label: 'Village / Street' },
  { key: 'postOffice', label: 'Post Office' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'pinCode', label: 'Pin Code' },
  
  { key: 'admissionDate', label: 'Admission Date (YYYY-MM-DD)' },
  { key: 'previousSchool', label: 'Previous School' },
  { key: 'house', label: 'House Name' },
  { key: 'aparId', label: 'APAR ID' },
  { key: 'penNo', label: 'PEN Number' },

  { key: 'tuitionFee', label: 'Tuition Fee (₹)' },
  { key: 'computerFee', label: 'Computer Fee (₹)' },
  { key: 'vvnFee', label: 'VVN Fee (₹)' },
  { key: 'computerScienceFee', label: 'Computer Science Fee (₹)' },
  { key: 'libraryFee', label: 'Library Fee (₹)' },
  { key: 'projectFee', label: 'Project Fee (₹)' },
]

export function ExcelImporter({ existingAdmissionNos, classes }: ExcelImporterProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fileName, setFileName] = useState('')
  const [rawRows, setRawRows] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Field mappings (DB field -> Excel header)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  
  // Validation previews
  const [validatedStudents, setValidatedStudents] = useState<any[]>([])
  const [hasErrors, setHasErrors] = useState(false)
  const [duplicateAlerts, setDuplicateAlerts] = useState<string[]>([])
  
  const [importPending, setImportPending] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null)

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Parse Excel file client-side
  const processFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Parse rows as raw JSON objects
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        if (jsonRows.length === 0) {
          alert('Excel file is empty.')
          return
        }

        // Get headers from first row
        const keys = Object.keys(jsonRows[0] as any)
        setHeaders(keys)
        setRawRows(jsonRows)

        // Attempt auto mapping
        const autoMap: Record<string, string> = {}
        const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]
        allFields.forEach(f => {
          // Find header matching DB field name or label
          const matchedHeader = keys.find(k => 
            k.toLowerCase() === f.key.toLowerCase() ||
            k.toLowerCase().includes(f.label.toLowerCase()) ||
            f.label.toLowerCase().includes(k.toLowerCase())
          )
          if (matchedHeader) {
            autoMap[f.key] = matchedHeader
          }
        })
        setMappings(autoMap)
        setStep(2)
      } catch (err) {
        alert('Failed to parse Excel file. Make sure it is a valid .xlsx or .csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Handle Mapping changes
  const handleMapChange = (dbKey: string, headerVal: string) => {
    setMappings(prev => ({
      ...prev,
      [dbKey]: headerVal
    }))
  }

  // Validate Mapped Rows
  const runValidation = () => {
    const studentsList: any[] = []
    const duplicateList: string[] = []
    let errorFound = false

    rawRows.forEach((row, idx) => {
      const student: any = { rowNum: idx + 2 } // 1-indexed header + Excel index
      let missingFields: string[] = []

      // Map required values
      REQUIRED_FIELDS.forEach(f => {
        const excelHeader = mappings[f.key]
        const val = excelHeader ? row[excelHeader] : ''
        student[f.key] = String(val).trim()

        if (!student[f.key]) {
          missingFields.push(f.label)
        }
      })

      // Map optional values
      OPTIONAL_FIELDS.forEach(f => {
        const excelHeader = mappings[f.key]
        const val = excelHeader ? row[excelHeader] : ''
        student[f.key] = String(val).trim()
      })

      // Add address defaults if empty or not mapped
      if (!student.village) student.village = 'Mahuldiha'
      if (!student.postOffice) student.postOffice = 'Mahuldiha'
      if (!student.district) student.district = 'Mayurbhanj'
      if (!student.state) student.state = 'Odisha'
      if (!student.pinCode) student.pinCode = '757041'

      student.missing = missingFields
      
      // Check duplicates
      const isDuplicate = existingAdmissionNos.includes(student.admissionNo)
      student.isDuplicate = isDuplicate
      if (isDuplicate) {
        duplicateList.push(student.admissionNo)
      }

      if (missingFields.length > 0) {
        errorFound = true
      }

      studentsList.push(student)
    })

    setValidatedStudents(studentsList)
    setDuplicateAlerts(duplicateList)
    setHasErrors(errorFound)
    setStep(3)
  }

  // Submit bulk upload
  const commitImport = async () => {
    setImportPending(true)
    try {
      const res = await importStudentsFromExcel(validatedStudents)
      if (res.error) {
        alert(res.error)
      } else {
        setImportResult({
          imported: res.imported || 0,
          duplicates: res.duplicates || 0
        })
        setStep(4)
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during import.')
    } finally {
      setImportPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* STEP 1: File Upload */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-full text-brand-teal-500 animate-pulse">
              <FileSpreadsheet className="h-10 w-10" />
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white mb-2">Upload Student Spreadsheet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload class roster records in Excel (.xlsx) or CSV format. Column matching helps map names, admission numbers, roll numbers, and parent details.
            </p>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 max-w-lg mx-auto cursor-pointer transition-all flex flex-col items-center justify-center h-52 relative ${
              dragActive ? 'border-brand-teal-500 bg-brand-teal-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
            }`}
          >
            <Upload className="h-10 w-10 text-slate-500 mb-3" />
            <p className="text-sm font-semibold text-slate-200">Drag and drop spreadsheet here, or <span className="text-brand-teal-500 underline">browse</span></p>
            <p className="text-xs text-slate-500 mt-1.5">Supports .xlsx, .xls, and .csv formats</p>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden" 
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="absolute inset-0 cursor-pointer" />
          </div>
        </div>
      )}

      {/* STEP 2: Field Mapping */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-xl text-brand-teal-500">
              <Columns className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Schema Column Matcher</h3>
              <p className="text-xs text-slate-400">Map database student schema keys to spreadsheet header fields</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Required Fields (Mandatory)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REQUIRED_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl">
                    <div>
                      <span className="text-sm font-bold text-white block">{field.label}</span>
                      <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider">Field ID: {field.key}</span>
                    </div>
                    <select
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMapChange(field.key, e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs w-48 cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-white">Select Excel Header...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-slate-900 text-white">{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Optional Profile, Demographic & Fee Fields</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPTIONAL_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-850 rounded-2xl">
                    <div>
                      <span className="text-sm font-bold text-white/80 block">{field.label}</span>
                      <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider">Field ID: {field.key}</span>
                    </div>
                    <select
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMapChange(field.key, e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-850 focus:border-brand-teal-500 rounded-xl text-white/90 outline-none text-xs w-48 cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-white">Select Excel Header...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-slate-900 text-white">{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-850">
            <button
              onClick={runValidation}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Verify Spreadsheet Rows
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Dry-Run Warnings */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Warnings Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange-500/10 border border-brand-orange-500/30 rounded-xl text-brand-orange-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white">Validation Reports</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Rows Detected:</span>
                <span className="font-bold text-white">{validatedStudents.length}</span>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400">Duplicate Alerts:</span>
                <span className={`font-bold ${duplicateAlerts.length > 0 ? 'text-red-400' : 'text-slate-405'}`}>
                  {duplicateAlerts.length} rows
                </span>
              </div>
            </div>

            {hasErrors && (
              <div className="p-3 bg-brand-orange-500/5 border border-brand-orange-500/10 text-brand-orange-550 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <p>Warning: Some student rows have missing mandatory data fields and might default to generic values.</p>
              </div>
            )}
          </div>

          {/* Validation Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Dry-Run Roster Preview</h3>
            
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider">
                    <th className="py-2.5">Row</th>
                    <th className="py-2.5">Admission No</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Class/Sec</th>
                    <th className="py-2.5">Parent Contact</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {validatedStudents.map(student => (
                    <tr key={student.rowNum} className={`hover:bg-slate-850/30 transition-colors ${
                      student.isDuplicate ? 'bg-red-950/10 text-red-300' : 'text-slate-300'
                    }`}>
                      <td className="py-3 font-semibold text-slate-500">#{student.rowNum}</td>
                      <td className="py-3 font-mono">{student.admissionNo || 'MISSING'}</td>
                      <td className="py-3 font-bold text-white">{student.name || 'MISSING'}</td>
                      <td className="py-3">{student.class} - {student.section}</td>
                      <td className="py-3">{student.mobile || 'MISSING'}</td>
                      <td className="py-3 text-right">
                        {student.isDuplicate ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">Duplicate</span>
                        ) : student.missing.length > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-brand-orange-500/10 text-brand-orange-500 border border-brand-orange-500/20 font-bold uppercase tracking-wider" title={`Missing: ${student.missing.join(', ')}`}>Incomplete</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-brand-teal-500/10 text-brand-teal-500 border border-brand-teal-500/20 font-bold uppercase tracking-wider">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-850 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Modify Column Mappings
              </button>
              
              <button
                onClick={commitImport}
                disabled={importPending}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 disabled:bg-brand-teal-900 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {importPending ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Commit Bulk Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Success Result */}
      {step === 4 && importResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-brand-teal-500/10 border border-brand-teal-500/30 rounded-full text-brand-teal-555">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
          
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">Import Complete!</h3>
            <p className="text-xs text-slate-400">Roster file uploaded and parsed successfully.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-950/50 p-4 border border-slate-850 rounded-2xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Imported Students</span>
              <span className="text-2xl font-black text-brand-teal-500">{importResult.imported}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Duplicates Skipped</span>
              <span className="text-2xl font-black text-slate-400">{importResult.duplicates}</span>
            </div>
          </div>

          <button
            onClick={() => {
              router.push('/teacher/students')
              router.refresh()
            }}
            className="px-6 py-3 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Open Student Directory
          </button>
        </div>
      )}
    </div>
  )
}
