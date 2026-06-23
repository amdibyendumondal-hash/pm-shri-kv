'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { KeyRound, RefreshCw, Check } from 'lucide-react'

interface ResetPasswordButtonProps {
  email: string
}

export function ResetPasswordButton({ email }: ResetPasswordButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleReset = async () => {
    if (!email) {
      alert('No email registered for this account.')
      return
    }
    const confirmMsg = `Send a password reset email to ${email}? You will be logged out to complete the reset.`
    if (!window.confirm(confirmMsg)) return

    setIsPending(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
      alert('Password reset link sent to your email! Logging out...')
      
      // Submit the logout form
      const logoutForm = document.getElementById('logout-form') as HTMLFormElement | null
      if (logoutForm) {
        logoutForm.submit()
      } else {
        window.location.href = '/login'
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send password reset email. Make sure your email is correct.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={isPending}
      type="button"
      className="mt-1.5 text-[9px] text-brand-teal-500 hover:text-brand-teal-400 font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 outline-none"
      title="Reset account credentials"
    >
      {isPending ? (
        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
      ) : success ? (
        <Check className="h-2.5 w-2.5 text-brand-teal-450" />
      ) : (
        <KeyRound className="h-2.5 w-2.5" />
      )}
      <span>Reset / Change Password</span>
    </button>
  )
}
