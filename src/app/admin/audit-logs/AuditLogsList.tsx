'use client'

import { useState } from 'react'
import { Search, Filter, ShieldAlert, Clock, User } from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  username: string
  action: string
  details: string
  timestamp: Date | string
}

interface AuditLogsListProps {
  logs: AuditLog[]
}

export function AuditLogsList({ logs }: AuditLogsListProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  // Get all unique actions for filter list
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort()

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = actionFilter === '' || log.action === actionFilter

    return matchesSearch && matchesFilter
  })

  function getActionBadge(action: string) {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'LOGOUT':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      case 'INITIAL_SEED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'CREATE_CLASS':
      case 'CREATE_SECTION':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      case 'PROMOTE_CLASS_STUDENTS':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search logs by username or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-brand-blue-500 rounded-2xl text-white outline-none placeholder-slate-600 text-sm"
          />
        </div>

        {/* Action Type Select */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-brand-blue-500 rounded-2xl text-white outline-none text-sm cursor-pointer"
          >
            <option value="">All Action Types</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">User</th>
                <th className="py-3 font-semibold">Action</th>
                <th className="py-3 font-semibold">Details</th>
                <th className="py-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">No audit logs match the filters.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <span className="font-bold text-white text-xs">{log.username}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 max-w-xs md:max-w-md">
                      <p className="text-xs text-slate-350 leading-relaxed truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400 text-[10px] font-medium">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
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
