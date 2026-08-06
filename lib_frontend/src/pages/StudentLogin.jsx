import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Mail, Lock, User, AlertTriangle, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx'

export default function StudentLogin() {
  const { login, register, verifyRegistrationOtp, resendRegistrationOtp, user } = useAuth()
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)

  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    }
  }, [user, navigate])

  React.useEffect(() => {
    if (error) {
      const el = document.getElementById('error-message')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (showOtp) {
        if (otp.length !== 6) throw new Error('OTP must be exactly 6 digits')
        await verifyRegistrationOtp(email, otp)
        setSuccessMsg('Email verified successfully! You can now sign in.')
        setShowOtp(false)
        setIsRegister(false)
        setOtp('')
        setPassword('')
      } else if (isRegister) {
        if (!name.trim()) throw new Error('Name is required')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        
        await register(name, email, password)
        setSuccessMsg('Account created! Please check your email for the 6-digit OTP.')
        setShowOtp(true)
      } else {
        const logged = await login(email, password)
        if (logged.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/student')
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('verify your email')) {
         setSuccessMsg('Please check your email for the verification OTP.')
         setError(null)
         setShowOtp(true)
      } else {
         setError(err.message || 'An error occurred during submission')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      setLoading(true)
      await resendRegistrationOtp(email)
      setSuccessMsg('A new OTP has been sent to your email.')
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden items-center justify-center p-4 bg-[#f8fafc]">
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-blue-100 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <div className="relative flex w-full max-w-[460px] mx-auto flex-col gap-6 z-10">
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="Smart Library" className="h-10 w-10 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              Smart <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Library</span>
            </p>
          </div>
          <p className="text-center text-sm text-slate-500">
            Smart Library Management System
          </p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 glass-panel p-8 shadow-[0_20px_50px_rgba(0,74,198,0.04)] backdrop-blur-xl">
          {!showOtp && (
            <div className="mb-8 grid grid-cols-2 rounded-lg glass-panel p-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false)
                  setError(null)
                  setSuccessMsg(null)
                }}
                className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  !isRegister ? 'bg-white text-blue-600 shadow-md relative z-10' : 'text-slate-500 hover:text-blue-600'
                }`}
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
                className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  isRegister ? 'bg-white text-blue-600 shadow-md relative z-10' : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {showOtp && (
             <div className="mb-6 text-center">
               <h3 className="text-lg font-bold text-slate-900">Verify Your Email</h3>
               <p className="text-xs text-slate-500 mt-1">We sent a 6-digit code to {email}</p>
             </div>
          )}

          {error && (
            <div id="error-message" className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-900">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-900">
              <CheckCircle className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!showOtp && isRegister && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full rounded-xl border border-slate-200 glass-panel py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:glass-panel"
                  />
                </div>
              </div>
            )}

            {!showOtp && (
              <>
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
                      className="w-full rounded-xl border border-slate-200 glass-panel py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:glass-panel"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Password
                    </label>
                    {!isRegister && (
                      <button 
                        type="button" 
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
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
                      className="w-full rounded-xl border border-slate-200 glass-panel py-3.5 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:glass-panel"
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
              </>
            )}

            {showOtp && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  6-Digit OTP
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
                    className="w-full text-center tracking-[0.5em] font-mono rounded-xl border border-slate-200 glass-panel py-3.5 pl-11 pr-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:glass-panel"
                  />
                </div>
              </div>
            )}

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
              ) : showOtp ? (
                'Verify Email'
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In to Smart Library'
              )}
            </button>
          </form>

          {showOtp && (
            <div className="mt-6 text-center text-xs">
              <span className="text-slate-500">Didn't receive the code? </span>
              <button
                type="button"
                disabled={loading}
                onClick={handleResendOtp}
                className="font-bold text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
              <br />
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false)
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="mt-4 font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Back to Login
              </button>
            </div>
          )}

          {!showOtp && (
            <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs">
              <span className="text-slate-500">
                {isRegister ? 'Already have an account? ' : 'New to Smart Library? '}
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
          )}
        </div>

        <p className="text-center text-[10px] tracking-wide text-slate-500">
          © 2026 Smart Library. Built on secure REST Architecture.
        </p>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => { 
          setIsForgotModalOpen(false)
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
        }} 
      />
    </div>
  )
}
