'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithFirebaseEmail, verifyLocalCredentials, loginWithLocalCredentials } from './actions'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail 
} from 'firebase/auth'
import { Lock, Mail, AlertCircle, School, ArrowRight, RefreshCw, KeyRound } from 'lucide-react'

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')

  // Firebase Email/Password Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsPending(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Try to authenticate with Firebase client-side
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
        user = userCredential.user
      } catch (fbErr: any) {
        console.warn('Firebase sign-in failed, checking local fallback...', fbErr.code)
        
        // If user not found in Firebase, verify if they exist in our local database
        const localCheck = await verifyLocalCredentials(email.trim(), password)
        if (localCheck.success) {
          // User exists locally with correct password! Register them in Firebase now.
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
            user = userCredential.user
          } catch (createErr: any) {
            console.warn('Firebase registration failed, authenticating via database fallback...', createErr.code)
            
            // Try to log in directly via local database credentials
            const localLogin = await loginWithLocalCredentials(email.trim(), password)
            if (localLogin.success) {
              if (localLogin.role === 'ADMIN') {
                router.push('/admin/dashboard')
              } else {
                router.push('/teacher/dashboard')
              }
              router.refresh()
              return // Exit successfully
            }
            
            if (createErr.code === 'auth/operation-not-allowed') {
              throw new Error('Email/Password sign-in is disabled in your Firebase console. Please go to Authentication > Sign-in method in Firebase Console and enable "Email/Password".')
            }
            throw createErr
          }
        } else {
          // If local check failed (wrong password or unregistered email), throw custom error
          throw new Error(localCheck.error || 'Invalid email or password.')
        }
      }
      
      if (user && user.email) {
        // 2. Authenticate on server actions using verified email
        const res = await loginWithFirebaseEmail(user.email)
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
      }
    } catch (err: any) {
      console.error(err)
      let customErr = 'Invalid email or password.'
      if (err.code === 'auth/user-not-found') customErr = 'User not found.'
      if (err.code === 'auth/wrong-password') customErr = 'Incorrect password.'
      if (err.code === 'auth/operation-not-allowed') {
        customErr = 'Email/Password sign-in is disabled in your Firebase console. Please go to Authentication > Sign-in method in Firebase Console and enable "Email/Password".'
      }
      setErrorMsg(err.message || customErr)
    } finally {
      setIsPending(false)
    }
  }

  // Firebase Google Login Sign-In
  const handleGoogleSignIn = async () => {
    setIsPending(true)
    setErrorMsg('')
    setSuccessMsg('')

    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      if (user.email) {
        const res = await loginWithFirebaseEmail(user.email)
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
      }
    } catch (err: any) {
      console.error(err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google Login failed.')
      }
    } finally {
      setIsPending(false)
    }
  }

  // Firebase Password Reset Flow
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsPending(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSuccessMsg('Reset password link has been sent to your email address!')
      setEmail('')
      // Back to signin after brief moment
      setTimeout(() => {
        setMode('signin')
      }, 5000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to send password reset email.')
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
              
              <form onSubmit={handleEmailSignIn} className="space-y-5">
                {errorMsg && (
                  <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    <p className="line-clamp-2 text-xs">{errorMsg}</p>
                  </div>
                )}

                {/* Email Address Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
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

              {/* Google login divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-slate-800" />
                <span className="text-[10px] text-slate-500 font-bold px-3 uppercase tracking-wider">or sign in with</span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Google sign-in button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isPending}
                className="w-full flex items-center justify-center py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 active:bg-slate-900/40 text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Google Account Auth</span>
              </button>
            </>
          ) : (
            <>
              {/* Forgot Password Flow */}
              <h2 className="text-xl font-semibold text-white mb-2">Reset Password</h2>
              <p className="text-xs text-slate-400 mb-6">Enter your registered email address, and we will send you a secure link to reset your account credentials.</p>
              
              <form onSubmit={handlePasswordReset} className="space-y-5">
                {errorMsg && (
                  <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    <p className="line-clamp-2 text-xs">{errorMsg}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-3 p-4 bg-teal-950/40 border border-teal-900/50 rounded-2xl text-teal-200 text-sm">
                    <KeyRound className="h-5 w-5 shrink-0 text-brand-teal-500" />
                    <p className="text-xs">{successMsg}</p>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reset-email">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-700/20 text-white rounded-2xl outline-none placeholder-slate-650 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Submit Reset Link */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-brand-blue-700 hover:bg-brand-blue-600 active:bg-brand-blue-800 disabled:bg-brand-blue-900/60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-blue-950/20 text-sm mt-6 cursor-pointer"
                >
                  {isPending ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>Send Secure Reset Link</span>
                  )}
                </button>

                {/* Back to login option */}
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setErrorMsg('')
                      setSuccessMsg('')
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
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
