'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from './actions'
import { Lock, Mail, AlertCircle, School, ArrowRight, RefreshCw, Info } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')

  // Simple and direct credentials sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsPending(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const res = await login(null, formData)
      
      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.success) {
        if (res.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/teacher/dashboard')
        }
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An error occurred during login.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-955 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-brand-orange-500/10 blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-4 z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-brand-blue-700/10 rounded-3xl border border-brand-blue-600/30 shadow-lg shadow-brand-blue-900/40 mb-4 animate-bounce duration-[4000ms]">
            <School className="h-10 w-10 text-brand-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            PM SHRI Kendriya Vidyalaya
          </h1>
          <p className="text-sm text-slate-400">
            Student Management System (SMS)
          </p>
        </div>

        {/* Card Body */}
        <div className="glass-dark border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {mode === 'signin' ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
              
              <form onSubmit={handleSignIn} className="space-y-5">
                {errorMsg && (
                  <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    <p className="line-clamp-2 text-xs">{errorMsg}</p>
                  </div>
                )}

                {/* Email Address Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="email">
                    Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-700/20 text-white rounded-2xl outline-none placeholder-slate-650 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-brand-blue-400 hover:text-brand-blue-300 font-bold transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-700/20 text-white rounded-2xl outline-none placeholder-slate-650 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-brand-blue-700 hover:bg-brand-blue-600 active:bg-brand-blue-800 disabled:bg-brand-blue-900/60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-blue-950/20 text-sm mt-8 cursor-pointer"
                >
                  {isPending ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Simplified Forgot Password Notification */}
              <h2 className="text-xl font-semibold text-white mb-2">Reset Password</h2>
              
              <div className="space-y-6 mt-4">
                <div className="flex gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-300 text-sm">
                  <Info className="h-5 w-5 shrink-0 text-brand-blue-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Self-service reset is disabled</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      To safeguard school records, password resets must be authorized manually. Please contact the Kendriya Vidyalaya System Administrator directly to update your credentials.
                    </p>
                  </div>
                </div>

                {/* Back to login option */}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 active:bg-slate-900/40 text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} PM SHRI KV Mahuldiha. All rights reserved.
        </p>
      </div>
    </div>
  )
}

