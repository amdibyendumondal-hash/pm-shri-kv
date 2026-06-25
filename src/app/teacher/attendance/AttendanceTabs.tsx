'use client'

import { useState } from 'react'
import { AttendanceSheet } from './AttendanceSheet'
import { AttendanceReport } from './AttendanceReport'
import { ClipboardCheck, CalendarRange } from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface AttendanceTabsProps {
  classes: ClassData[]
  defaultClassId: string
  defaultSectionId: string
}

export function AttendanceTabs({ classes, defaultClassId, defaultSectionId }: AttendanceTabsProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'report'>('daily')

  return (
    <div className="space-y-6">
      {/* Tab Selector - Hidden on Print */}
      <div className="flex border-b border-slate-800 gap-6 print:hidden">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'daily'
              ? 'border-brand-teal-500 text-brand-teal-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="h-4.5 w-4.5" />
          Daily Register
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'report'
              ? 'border-brand-teal-500 text-brand-teal-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarRange className="h-4.5 w-4.5" />
          Monthly / Period Reports
        </button>
      </div>

      {/* Render selected view */}
      {activeTab === 'daily' ? (
        <AttendanceSheet
          classes={classes}
          defaultClassId={defaultClassId}
          defaultSectionId={defaultSectionId}
        />
      ) : (
        <AttendanceReport
          classes={classes}
          defaultClassId={defaultClassId}
          defaultSectionId={defaultSectionId}
        />
      )}
    </div>
  )
}
