import { db } from '@/lib/db'
import { AuditLogsList } from './AuditLogsList'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const logsData = await db.auditLog.findMany({
    orderBy: { timestamp: 'desc' }
  })

  // Format date object to string to avoid serialization warnings
  const serializedLogs = logsData.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString()
  }))

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-white">System Audit Logs</h1>
        <p className="text-sm text-slate-400">Security event log and system change tracking history</p>
      </div>

      <AuditLogsList logs={serializedLogs} />
    </div>
  )
}
