import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { 
  School, LayoutDashboard, Users, UserPlus, 
  FileSpreadsheet, ClipboardCheck, Award, LogOut, User, Presentation,
  BookCheck, BookOpen, Brain
} from 'lucide-react'
import { logout } from '../login/actions'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'

interface TeacherLayoutProps {
  children: React.ReactNode
}

export default async function TeacherLayout({ children }: TeacherLayoutProps) {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const navItems = [
    { name: 'Teacher Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Student Directory', href: '/teacher/students', icon: Users },
    { name: 'Register New Student', href: '/teacher/students/add', icon: UserPlus },
    { name: 'Daily Attendance Ledger', href: '/teacher/attendance', icon: ClipboardCheck },
    { name: 'Notebook Checking Ledger', href: '/teacher/copy-submissions', icon: BookCheck },
    { name: 'Marks Entry Gradebook', href: '/teacher/marks', icon: Award },
    { name: 'Study Materials Lab', href: '/teacher/study-materials', icon: BookOpen },
    { name: 'GeoGebra & HTML Projects', href: '/teacher/projects', icon: Presentation },
    { name: 'Performance Insights & AI', href: '/teacher/performance', icon: Brain },
    { name: 'Excel / CSV Bulk Import', href: '/teacher/students/import', icon: FileSpreadsheet },
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
          <div className="p-2 bg-brand-teal-600/10 rounded-xl border border-brand-teal-500/30">
            <School className="h-5 w-5 text-brand-teal-500" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block">PM SHRI KV</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Teacher Portal</span>
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
                <Icon className="h-5 w-5 text-slate-500 group-hover:text-brand-teal-500 transition-colors" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 bg-brand-teal-500/20 border border-brand-teal-500/30 rounded-xl flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-brand-teal-500" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-white block truncate">{user.name}</span>
              <span className="text-[9px] text-brand-teal-500 font-bold uppercase block tracking-wider">Class Educator</span>
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
          <h2 className="font-bold text-lg text-white">Educator Workspace</h2>
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
