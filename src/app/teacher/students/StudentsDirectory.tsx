'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Eye, BarChart3, FileText, Contact, School, ArrowRight, UserSquare2, Trash2 } from 'lucide-react'
import { deleteStudent } from '../actions'

interface Student {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  gender: string
  house: string | null
  mobile: string
  class: {
    id: string
    name: string
  }
  section: {
    id: string
    name: string
  }
}

interface ClassData {
  id: string
  name: string
}

interface StudentsDirectoryProps {
  students: Student[]
  classes: ClassData[]
}

export function StudentsDirectory({ students, classes }: StudentsDirectoryProps) {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [deletePendingId, setDeletePendingId] = useState('')

  const handleDeleteStudent = async (id: string, name: string) => {
    const confirmMsg = `Are you sure you want to delete the student record for "${name}"? This action cannot be undone.`
    if (!window.confirm(confirmMsg)) return

    setDeletePendingId(id)
    try {
      const res = await deleteStudent(id)
      if (res && res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.')
    } finally {
      setDeletePendingId('')
    }
  }

  // Filter students dynamically on client
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase())

    const matchesClass = classFilter === '' || s.class.id === classFilter
    const matchesSection = sectionFilter === '' || s.section.name === sectionFilter

    return matchesSearch && matchesClass && matchesSection
  })

  // Unique sections list
  const uniqueSections = ['A', 'B', 'C']

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search students by name, roll, or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-brand-teal-500 rounded-2xl text-white outline-none placeholder-slate-650 text-sm"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <School className="h-5 w-5 text-slate-500" />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-brand-teal-500 rounded-2xl text-white outline-none text-sm cursor-pointer"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-brand-teal-500 rounded-2xl text-white outline-none text-sm cursor-pointer"
          >
            <option value="">All Sections</option>
            {uniqueSections.map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">Class</th>
                <th className="py-3 font-semibold text-center">Roll</th>
                <th className="py-3 font-semibold">Admission No</th>
                <th className="py-3 font-semibold">Student Name</th>
                <th className="py-3 font-semibold text-center">House</th>
                <th className="py-3 font-semibold">Contact No</th>
                <th className="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">No student records found matching the query.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 font-bold text-white">{student.class.name} - {student.section.name}</td>
                    <td className="py-4 text-center font-bold text-slate-450 text-xs">{student.rollNo}</td>
                    <td className="py-4 font-mono text-xs text-slate-400">{student.admissionNo}</td>
                    <td className="py-4 font-extrabold text-white">{student.name}</td>
                    <td className="py-4 text-center">
                      {student.house ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          student.house === 'Shivaji' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          student.house === 'Ashoka' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          student.house === 'Raman' ? 'bg-yellow-500/10 text-yellow-450 border-yellow-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {student.house}
                        </span>
                      ) : (
                        <span className="text-slate-650 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 font-medium text-xs text-slate-400">{student.mobile}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-750 flex items-center justify-center"
                          title="View Profile Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/teacher/students/${student.id}/idcard`}
                          className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-750 flex items-center justify-center"
                          title="Generate ID Card"
                        >
                          <UserSquare2 className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/teacher/students/${student.id}/analytics`}
                          className="p-2 bg-brand-teal-500/10 border border-brand-teal-500/20 text-brand-teal-555 hover:bg-brand-teal-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="View Progress Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/teacher/students/${student.id}/report`}
                          className="p-2 bg-brand-blue-700/10 border border-brand-blue-600/20 text-brand-blue-500 hover:bg-brand-blue-600/20 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Download Report Card"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          disabled={deletePendingId === student.id}
                          className="p-2 bg-red-950/20 border border-red-900/25 hover:border-red-900/40 text-red-400 hover:bg-red-950/30 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="Delete Student Record"
                        >
                          {deletePendingId === student.id ? (
                            <div className="h-4 w-4 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
