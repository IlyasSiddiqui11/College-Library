import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, AlertTriangle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { apiClient } from '../api/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      await apiClient.post('/api/auth/reset-password', {
        token,
        newPassword: password
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-[460px] rounded-2xl border border-white/20 glass-panel p-8 shadow-[0_20px_50px_rgba(0,74,198,0.04)] backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-10 w-10 rounded-xl object-cover" />
            <p className="text-2xl font-bold tracking-tight text-white">
              BCOE<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">-lib</span>
            </p>
          </div>
          <h1 className="text-xl font-bold text-white mt-4">Reset Password</h1>
          <p className="text-center text-sm text-blue-200 mt-2">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertTriangle className="size-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-green-100 bg-green-50 p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-green-900">Password Reset Complete!</h3>
            <p className="text-sm text-green-700 mb-6">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                New Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={!token}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/20 glass-input py-3.5 pl-11 pr-10 text-sm text-white placeholder:text-blue-200 outline-none transition focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  disabled={!token}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/20 glass-input py-3.5 pl-11 pr-10 text-sm text-white placeholder:text-blue-200 outline-none transition focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition duration-200 hover:shadow-xl hover:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-75"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
