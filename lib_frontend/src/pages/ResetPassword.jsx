import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, AlertTriangle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { apiClient } from '../api/client'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (!token) throw new Error('Invalid or missing reset token.')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      if (password !== confirmPassword) throw new Error('Passwords do not match')
      
      await apiClient.post('/api/auth/reset-password', { 
        token, 
        newPassword: password 
      })
      
      setSuccessMsg('Your password has been reset successfully. You can now sign in.')
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data || err.message || 'An error occurred during submission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <div className="relative flex w-full max-w-[460px] flex-col gap-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-10 w-10 rounded-xl object-cover" />
            <p className="text-2xl font-bold tracking-tight text-white">
              BCOE<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">-lib</span>
            </p>
          </div>
          <p className="text-center text-sm text-blue-200">
            Reset Password
          </p>
        </div>

        <div className="w-full rounded-2xl border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]" style={{background: 'rgba(15,23,42,0.85)'}}>
          
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-all duration-200 mb-6"
          >
            <ArrowLeft className="size-4" /> Back to Login
          </button>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-xs font-medium text-green-300">
              <div className="size-2 mt-1 rounded-full bg-green-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                New Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl py-3.5 pl-11 pr-10 text-sm outline-none transition focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl py-3.5 pl-11 pr-10 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition duration-200 hover:shadow-xl hover:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-75"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] tracking-wide text-blue-200">
          © 2026 BCOE-lib. Built on secure REST Architecture.
        </p>
      </div>
    </div>
  )
}
