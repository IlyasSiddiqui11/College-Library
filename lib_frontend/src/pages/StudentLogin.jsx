import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Mail, Lock, User, BookOpen, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function StudentLogin() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
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
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Name is required')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        
        await register(name, email, password)
        setSuccessMsg('Account created successfully! Please sign in.')
        setIsRegister(false)
        setPassword('')
        setName('')
        setEmail('')
      } else {
        const logged = await login(email, password)
        if (logged.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/student')
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during submission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-12"
    >
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <div className="relative flex w-full max-w-[460px] flex-col gap-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-10 w-10 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <p className="text-2xl font-bold tracking-tight text-white">
              BCOE<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">-lib</span>
            </p>
          </div>
          <p className="text-center text-sm text-blue-200">
            Smart Library Management System
          </p>
        </div>

        <div className="w-full rounded-2xl border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]" style={{background: 'rgba(15,23,42,0.85)'}}>
          <div className="mb-8 grid grid-cols-2 rounded-xl p-1" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setError(null)
                setSuccessMsg(null)
              }}
              className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                !isRegister
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={!isRegister ? {backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 4px 15px rgba(37,99,235,0.4)'} : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setError(null)
                setSuccessMsg(null)
              }}
              className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                isRegister
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={isRegister ? {backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 4px 15px rgba(37,99,235,0.4)'} : {}}
            >
              Register
            </button>
          </div>

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
            {isRegister && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="glass-input w-full rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
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
                  className="glass-input w-full rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Password
                </label>
                {!isRegister && (
                  <button type="button" className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition">
                    Forgot Password?
                  </button>
                )}
              </div>
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

            <button
              type="submit"
              disabled={loading}
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
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In to BCOE-lib'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs">
            <span className="text-blue-200">
              {isRegister ? 'Already have an account? ' : 'New to BCOE-lib? '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError(null)
                setSuccessMsg(null)
              }}
              className="font-bold text-blue-600 hover:underline"
            >
              {isRegister ? 'Sign In' : 'Register Account'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] tracking-wide text-blue-200">
          © 2026 BCOE-lib. Built on secure REST Architecture.
        </p>
      </div>
    </div>
  )
}
