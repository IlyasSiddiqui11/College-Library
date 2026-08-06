import React, { useState, useEffect } from 'react'
import { Mail, AlertTriangle, Loader2, X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { apiClient } from '../api/client'

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setEmail('')
      setOtp('')
      setResetToken('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
      setSuccessMsg(null)
      setLoading(false)
    }
  }, [isOpen])

  // Lock body scroll when modal open to prevent layout shift (mobile keyboard)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      await apiClient.post('/api/auth/forgot-password', { email })
      setSuccessMsg('A verification code has been sent to your registered email address.')
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await apiClient.post('/api/auth/verify-reset-otp', { email, otp })
      if (res.token) {
        setResetToken(res.token)
        setStep(3)
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      await apiClient.post('/api/auth/resend-reset-otp', { email })
      setSuccessMsg('A new verification code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      await apiClient.post('/api/auth/reset-password', {
        token: resetToken,
        newPassword
      })
      setSuccessMsg('Your password has been reset successfully. Please log in with your new password.')
      setStep(4) // Success state
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] rounded-2xl border border-slate-200 glass-panel p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-blue-600 transition"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-6">
          {step === 1 && "Enter your email address to receive a verification code."}
          {step === 2 && "Enter the 6-digit verification code sent to your email."}
          {step === 3 && "Create a new password for your account."}
          {step === 4 && "Password Reset Complete!"}
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-900">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && step !== 4 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-900">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-slate-200 glass-input py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-blue-200/50 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-slate-900 transition duration-200 disabled:opacity-50"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Sending...</>
              ) : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Verification Code (OTP)
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-200 glass-input py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-blue-200/50 outline-none transition focus:border-blue-500 tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-slate-900 transition duration-200 disabled:opacity-50"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Verifying...</>
              ) : 'Verify Code'}
            </button>
            
            <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition mt-1 text-center"
            >
                Didn't receive a code? Resend OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                New Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 glass-input py-3 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 glass-input py-3 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-slate-900 transition duration-200 disabled:opacity-50"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Resetting...</>
              ) : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="size-5" />
                </div>
                <p className="text-sm font-medium text-green-900 mb-4">
                    {successMsg}
                </p>
                <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
                >
                    Close & Login
                </button>
            </div>
        )}
      </div>
    </div>
  )
}
