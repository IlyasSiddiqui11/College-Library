import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Mail, Lock, AlertTriangle, Loader2, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react'

export default function LibrarianLogin() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const logged = await login(email, password)
      if (logged.role !== 'ADMIN') {
        throw new Error('This account does not have librarian privileges. Please use the student login.')
      }
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-12"
    >
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

      <div className="relative flex w-full max-w-[460px] flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-blue-100 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-10 w-10 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <p className="text-2xl font-bold tracking-tight text-white">
              BCOE<span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">-lib</span> Admin
            </p>
          </div>
          <p className="text-center text-sm text-blue-200">
            BCOE-lib Admin Access
          </p>
        </div>

        <div className="w-full rounded-2xl border border-white/20 glass-panel p-8 shadow-[0_20px_50px_rgba(139,92,246,0.04)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-100 px-4 py-2.5">
            <Shield className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">LIBRARIAN ACCESS REQUIRED</span>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-700">
              <AlertTriangle className="size-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="librarian@university.edu"
                  className="w-full rounded-xl border border-white/20 glass-panel py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-blue-200 outline-none transition focus:border-violet-600 focus:glass-panel"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Password
                </label>
                <button type="button" className="text-[11px] text-violet-600 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/20 glass-panel py-3.5 pl-11 pr-10 text-sm text-white placeholder:text-blue-200 outline-none transition focus:border-violet-600 focus:glass-panel"
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/10 transition duration-200 hover:shadow-xl hover:shadow-violet-600/20 active:scale-[0.98] disabled:opacity-75"
              style={{
                backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="size-4" />
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs">
            <span className="text-blue-200">
              Are you a student?{' '}
            </span>
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:underline"
            >
              Use Student Login
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="text-[11px] font-semibold text-violet-700 mb-2">🔒 Secure Access</p>
          <p className="text-[11px] text-violet-600">
            This portal is restricted to librarians and administrators only. If you don't have credentials, contact the system administrator.
          </p>
        </div>

        <p className="text-center text-[10px] tracking-wide text-blue-200">
          © 2026 BCOE-lib. Admin Portal.
        </p>
      </div>
    </div>
  )
}
