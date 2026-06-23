import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { 
  School, LayoutDashboard, CalendarDays, BookOpen, 
  FileCheck, GraduationCap, ClipboardList, LogOut, User, Users, UserCheck, CheckSquare, FileSpreadsheet
} from 'lucide-react'
import { logout } from '../login/actions'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Classes & Sections', href: '/admin/classes', icon: CalendarDays },
    { name: 'Student Records', href: '/admin/students', icon: GraduationCap },
    { name: 'Demographics & Stats', href: '/admin/stats', icon: Users },
    { name: 'Daily Attendance', href: '/admin/attendance', icon: CheckSquare },
    { name: 'Teacher Management', href: '/admin/teachers', icon: UserCheck },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { name: 'Examinations', href: '/admin/exams', icon: FileCheck },
    { name: 'Promotion System', href: '/admin/promotion', icon: FileSpreadsheet },
    { name: 'System Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
  ]

  async function handleLogoutAction() {
    'use server'
    await logout()
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 bg-slate-900 border-r border-slate-800">
        {/* Brand Logo & Name */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="p-2 bg-brand-blue-700/10 rounded-xl border border-brand-blue-600/30">
            <School className="h-5 w-5 text-brand-blue-500" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block">PM SHRI KV</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Admin Portal</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3.5 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all font-medium text-sm group"
              >
                <Icon className="h-5 w-5 text-slate-500 group-hover:text-brand-blue-500 transition-colors" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 bg-brand-blue-700/20 border border-brand-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-brand-blue-500" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-white block truncate">{user.name}</span>
              <span className="text-[9px] text-brand-teal-500 font-bold uppercase block tracking-wider">Super Administrator</span>
              <ResetPasswordButton email={user.email || ''} />
            </div>
          </div>
          <form id="logout-form" action={handleLogoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-300 font-medium rounded-xl transition-all text-xs cursor-pointer border border-slate-705"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out Session
            </button>
          </form>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20">
          <h2 className="font-bold text-lg text-white">School Management Portal</h2>
          <div className="flex items-center gap-4">
            {/* Quick Session Display */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-slate-750 rounded-xl text-xs font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-teal-500" />
              Active Session: 2026-27
            </div>
          </div>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
