'use client'

import { useState, useEffect, useTransition } from 'react'
import { getStudentsBySection } from '../actions'
import { GraduationCap, Users, RefreshCw, Eye, Search, DollarSign, X, ShieldAlert, Award } from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface Student {
  id: string
  admissionNo: string
  rollNo: string
  name: string
  gender: string
  dob: string
  bloodGroup: string | null
  aadhaarNo: string | null
  category: string
  religion: string | null
  nationality: string
  fatherName: string
  motherName: string
  guardianName: string | null
  mobile: string
  altMobile: string | null
  email: string | null
  village: string
  postOffice: string
  district: string
  state: string
  pinCode: string
  admissionDate: string
  previousSchool: string | null
  house: string | null
  aparId: string | null
  penNo: string | null
  photo: string | null
  status: string
  
  // New demographic fields
  admissionYear: string | null
  studentCode: string | null
  admissionCategory: string | null
  socialCategory: string | null
  minority: string | null
  physicallyDisabled: string | null
  singleGirlChild: string | null
  rte: string | null
  kvsWard: string | null
  reimbursementClaimed: string | null

  // Fees Structure
  tuitionFee: number | null
  computerFee: number | null
  vvnFee: number | null
  computerScienceFee: number | null
  libraryFee: number | null
  projectFee: number | null
  totalFee: number | null
}

interface StudentRecordsBrowserProps {
  classes: ClassData[]
}

export function StudentRecordsBrowser({ classes }: StudentRecordsBrowserProps) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isPending, startTransition] = useTransition()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Load sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
      if (cls && cls.sections.length > 0) {
        setSelectedSectionId(cls.sections[0].id)
      } else {
        setSelectedSectionId('')
      }
    } else {
      setAvailableSections([])
      setSelectedSectionId('')
      setStudents([])
    }
  }, [selectedClassId, classes])

  // Fetch student records when section changes
  useEffect(() => {
    if (!selectedSectionId) {
      setStudents([])
      return
    }

    startTransition(async () => {
      try {
        const data = await getStudentsBySection(selectedSectionId)
        setStudents(data as any)
      } catch (err) {
        alert('Failed to load student directory records.')
      }
    })
  }, [selectedSectionId])

  // Filter students by search query
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentCode && s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Selector Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Class Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">Select Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassId}
              className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900 text-white">Select Section...</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">Section {s.name}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Search Students</label>
            <div className="relative">
              <input
                type="text"
                disabled={!selectedSectionId}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, adm no, or code..."
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-blue-500 rounded-xl text-white outline-none placeholder-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-650" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Student Directory Table */}
      {selectedSectionId && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {isPending ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-blue-500" />
              <span>Loading student records...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-slate-500 italic text-sm">
              {searchQuery ? 'No student profiles matched your search.' : 'No active student records found in this section.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand-blue-500" />
                  <h3 className="font-bold text-white text-sm">Registered Students Directory</h3>
                </div>
                <span className="text-xs text-slate-405 font-medium">Total: {filteredStudents.length} profiles</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 uppercase tracking-wider">
                      <th className="py-3 font-semibold text-center w-12">Roll</th>
                      <th className="py-3 font-semibold">Student Name</th>
                      <th className="py-3 font-semibold">Admission No</th>
                      <th className="py-3 font-semibold">Student Code</th>
                      <th className="py-3 font-semibold text-center">Gender</th>
                      <th className="py-3 font-semibold text-center">Social Cat</th>
                      <th className="py-3 font-semibold text-center">RTE</th>
                      <th className="py-3 font-semibold text-center">SGC</th>
                      <th className="py-3 font-semibold text-center">Fees Total</th>
                      <th className="py-3 font-semibold text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-850/20 text-slate-350 transition-colors">
                        <td className="py-3.5 font-bold text-center text-slate-450">{s.rollNo}</td>
                        <td className="py-3.5 font-extrabold text-white">{s.name}</td>
                        <td className="py-3.5 font-mono">{s.admissionNo}</td>
                        <td className="py-3.5 font-mono text-slate-400">{s.studentCode || 'N/A'}</td>
                        <td className="py-3.5 text-center">{s.gender}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            s.socialCategory === 'Gen' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            s.socialCategory === 'OBC' ? 'bg-brand-teal-500/10 text-brand-teal-400 border-brand-teal-500/20' :
                            s.socialCategory === 'SC' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            s.socialCategory === 'ST' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-slate-800 text-slate-450 border-slate-700'
                          }`}>
                            {s.socialCategory || s.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`font-bold ${s.rte === 'Yes' ? 'text-brand-teal-500' : 'text-slate-500'}`}>
                            {s.rte || 'No'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`font-bold ${s.singleGirlChild === 'Yes' ? 'text-pink-500' : 'text-slate-500'}`}>
                            {s.singleGirlChild || 'No'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-brand-blue-400">
                          ₹ {s.totalFee || 0}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all cursor-pointer inline-flex items-center"
                            title="View all details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail View Modal PopUp */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border border-brand-blue-500/30 bg-brand-blue-500/10 flex items-center justify-center text-brand-blue-500">
                  <GraduationCap className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base leading-none">{selectedStudent.name}</h4>
                  <span className="text-[10px] text-slate-500 mt-1 block">Student File Details Folder</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scroll */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-950/20 border border-slate-850 p-4 rounded-2xl">
                <div className="h-24 w-24 rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedStudent.photo ? (
                    <img src={selectedStudent.photo} alt="Photo" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-10 w-10 text-slate-755" />
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs w-full">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Admission Year</span>
                    <span className="font-bold text-slate-300">{selectedStudent.admissionYear || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Student Code</span>
                    <span className="font-bold text-slate-300 font-mono">{selectedStudent.studentCode || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Admission Category</span>
                    <span className="font-bold text-slate-300">Category {selectedStudent.admissionCategory || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Social Category</span>
                    <span className="font-bold text-slate-300">{selectedStudent.socialCategory || selectedStudent.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">RTE Status</span>
                    <span className={`font-bold ${selectedStudent.rte === 'Yes' ? 'text-brand-teal-500' : 'text-slate-400'}`}>{selectedStudent.rte || 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Single Girl Child</span>
                    <span className={`font-bold ${selectedStudent.singleGirlChild === 'Yes' ? 'text-pink-500' : 'text-slate-400'}`}>{selectedStudent.singleGirlChild || 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">KVS Ward</span>
                    <span className="font-bold text-slate-300">{selectedStudent.kvsWard || 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-black block">Reimbursement</span>
                    <span className="font-bold text-slate-300">{selectedStudent.reimbursementClaimed || 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Personal & Parent details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-extrabold text-white text-xs uppercase border-b border-slate-800 pb-1.5 tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-brand-blue-500" />
                    Personal & Guardian details
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Father's Name</span>
                      <span className="font-bold text-slate-300">{selectedStudent.fatherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mother's Name</span>
                      <span className="font-bold text-slate-300">{selectedStudent.motherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contact Phone</span>
                      <span className="font-bold text-slate-300">{selectedStudent.mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email Address</span>
                      <span className="font-bold text-slate-300">{selectedStudent.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Date of Birth</span>
                      <span className="font-bold text-slate-300">{selectedStudent.dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gender</span>
                      <span className="font-bold text-slate-300">{selectedStudent.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Minority Group</span>
                      <span className="font-bold text-slate-300">{selectedStudent.minority || 'Not applicable'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Disabled</span>
                      <span className="font-bold text-slate-300">{selectedStudent.physicallyDisabled || 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-white text-xs uppercase border-b border-slate-800 pb-1.5 tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-brand-orange-500" />
                    Residential Address
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Village / Street</span>
                      <span className="font-bold text-slate-300">{selectedStudent.village}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Post Office</span>
                      <span className="font-bold text-slate-300">{selectedStudent.postOffice}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">District / State</span>
                      <span className="font-bold text-slate-300">{selectedStudent.district}, {selectedStudent.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PIN Code</span>
                      <span className="font-bold text-slate-300">{selectedStudent.pinCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Structure Breakdown */}
              <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h5 className="font-extrabold text-white text-xs uppercase border-b border-slate-800 pb-1.5 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-brand-teal-500" />
                  Fees Structure Breakdown
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Tuition Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.tuitionFee || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Computer Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.computerFee || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">VVN Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.vvnFee || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Computer Science Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.computerScienceFee || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Library Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.libraryFee || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Project Fee</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">₹ {selectedStudent.projectFee || 0}</span>
                  </div>
                  <div className="p-3 bg-brand-teal-900/10 border border-brand-teal-900/30 rounded-xl col-span-2 flex items-center justify-between px-4">
                    <span className="text-xs text-brand-teal-400 font-bold uppercase tracking-wider">Total Fees Summary</span>
                    <span className="font-black text-brand-teal-500 text-sm">₹ {selectedStudent.totalFee || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-250 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
