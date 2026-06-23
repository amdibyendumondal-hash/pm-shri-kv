import Link from 'next/link'
import { School, ArrowRight, UserCheck, BarChart3, FileSpreadsheet, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-blue-700/10 rounded-2xl border border-brand-blue-600/30">
              <School className="h-6 w-6 text-brand-blue-500" />
            </div>
            <div>
              <span className="font-bold text-lg text-white block leading-none">PM SHRI KV</span>
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">Mahuldiha Portal</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#stats" className="hover:text-white transition-colors">Statistics</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-blue-700 hover:bg-brand-blue-600 active:bg-brand-blue-800 text-white font-medium rounded-2xl transition-all shadow-lg shadow-brand-blue-900/30 text-sm cursor-pointer"
            >
              Access SMS
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden flex-1 flex items-center">
        {/* Gradients */}
        <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue-700/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-teal-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange-500/10 border border-brand-orange-500/30 rounded-full text-brand-orange-500 text-xs font-semibold uppercase tracking-wider">
                🏫 PM SHRI School Initiative
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Empowering Education through <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-500 via-brand-teal-500 to-brand-orange-500">Digital Governance</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Welcome to the official Student Management System of PM SHRI Kendriya Vidyalaya Mahuldiha. An integrated platform for teachers, admins, and parents to track academic records, daily attendance, and progress reports.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-brand-blue-700 hover:bg-brand-blue-600 text-white font-semibold rounded-2xl shadow-xl shadow-brand-blue-900/30 transition-all text-base cursor-pointer"
                >
                  Administrator Login
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-2xl transition-all text-base cursor-pointer"
                >
                  Teacher Login
                </Link>
              </div>
            </div>

            {/* Right Column: Mini Announcements Grid */}
            <div className="lg:col-span-5">
              <div className="glass-dark border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="font-bold text-lg text-white">Announcements</h3>
                  <span className="h-2 w-2 rounded-full bg-brand-orange-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-[10px] text-brand-teal-500 font-bold uppercase">Academic Session 2026-27</span>
                    <h4 className="text-sm font-semibold text-white">New Admission Portal Active</h4>
                    <p className="text-xs text-slate-400">Class teacher lists and academic session configuration has been initialized.</p>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-[10px] text-brand-orange-500 font-bold uppercase">Examination</span>
                    <h4 className="text-sm font-semibold text-white">Unit Test 1 Grading Schedule</h4>
                    <p className="text-xs text-slate-400">Marks entering portal for Unit Test 1 will remain open for class teachers till next week.</p>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-[10px] text-brand-blue-500 font-bold uppercase">Reports</span>
                    <h4 className="text-sm font-semibold text-white">Digital ID Card Generation</h4>
                    <p className="text-xs text-slate-400">Class teachers can now generate and print digital student ID cards directly from profiles.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-950 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">System Core Capabilities</h2>
            <p className="text-slate-400 text-base">
              A comprehensive suite of modern educational management tools designed to streamline administrative workflows.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 text-left hover:border-brand-blue-700/50 transition-all group">
              <div className="p-3 bg-brand-blue-700/10 rounded-2xl w-fit group-hover:bg-brand-blue-700/20 transition-colors">
                <UserCheck className="h-6 w-6 text-brand-blue-500" />
              </div>
              <h3 className="font-bold text-lg text-white">Attendance Register</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Take class-wise daily attendance ledger, calculate monthly percentages, and monitor flags for low attendance.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 text-left hover:border-brand-teal-500/50 transition-all group">
              <div className="p-3 bg-brand-teal-600/10 rounded-2xl w-fit group-hover:bg-brand-teal-600/20 transition-colors">
                <FileSpreadsheet className="h-6 w-6 text-brand-teal-500" />
              </div>
              <h3 className="font-bold text-lg text-white">Excel Import Automation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Bulk upload student registration details via spreadsheet file column-matching schema validation.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 text-left hover:border-brand-orange-500/50 transition-all group">
              <div className="p-3 bg-brand-orange-500/10 rounded-2xl w-fit group-hover:bg-brand-orange-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-brand-orange-500" />
              </div>
              <h3 className="font-bold text-lg text-white">Student Progression</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Interactive radar/radar charts representing student performance trends, subject metrics, and risk alert engines.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 text-left hover:border-brand-blue-700/50 transition-all group">
              <div className="p-3 bg-brand-blue-600/10 rounded-2xl w-fit group-hover:bg-brand-blue-600/20 transition-colors">
                <FileText className="h-6 w-6 text-brand-blue-500" />
              </div>
              <h3 className="font-bold text-lg text-white">Report Card Generator</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                One-click generation of professional printable PDF report cards with automated grading calculations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-slate-900 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <span className="text-5xl font-black text-white block">100%</span>
              <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Secure JWT Auth</span>
            </div>
            <div className="space-y-2">
              <span className="text-5xl font-black text-brand-teal-500 block">7+</span>
              <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Sample Students Pre-Seeded</span>
            </div>
            <div className="space-y-2">
              <span className="text-5xl font-black text-brand-orange-500 block">SQLite</span>
              <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Zero-Config Local Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-850 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2.5">
            <School className="h-5 w-5 text-brand-blue-500" />
            <span className="text-slate-400 font-bold">PM SHRI Kendriya Vidyalaya Mahuldiha</span>
          </div>
          <p>© {new Date().getFullYear()} School Management System. Built for PM SHRI KV.</p>
        </div>
      </footer>
    </div>
  )
}
