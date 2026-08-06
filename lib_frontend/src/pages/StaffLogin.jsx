import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Mail, Lock, User, AlertTriangle, Loader2, Eye, EyeOff, CheckCircle, Hash, Phone, Building2, Briefcase, ChevronDown } from 'lucide-react'
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx'
import { apiClient } from "../api/client"

export default function StaffLogin() {
  const { login, changePassword, user } = useAuth()
  const navigate = useNavigate()

  const [isRequestAccess, setIsRequestAccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [isEmploymentDropdownOpen, setIsEmploymentDropdownOpen] = useState(false)
  const [isChangePasswordMode, setIsChangePasswordMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tempUser, setTempUser] = useState(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Request Access Form State
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    collegeEmail: '',
    mobileNumber: '',
    department: '',
    designation: '',
    employmentType: ''
  })

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  React.useEffect(() => {
    if (user && !isChangePasswordMode) {
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else if (user.role === 'STAFF') {
        navigate('/staff')
      } else {
        navigate('/student')
      }
    }
  }, [user, navigate, isChangePasswordMode])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (isRequestAccess) {
        if (!formData.fullName.trim() || !formData.employeeId.trim() || !formData.collegeEmail.trim()) {
          throw new Error('Please fill in all required fields.')
        }
        
        const response = await apiClient.post('/api/staff/request-access', formData)
        setSuccessMsg(response.data || 'Your staff verification request has been submitted successfully. Please wait for Admin approval before logging in.')
        
        // Reset form
        setIsRequestAccess(false)
        setFormData({
          fullName: '', employeeId: '', collegeEmail: '', mobileNumber: '', department: '', designation: '', employmentType: ''
        })
      } else {
        const logged = await login(email, password)
        if (logged.requiresPasswordChange) {
          setTempUser(logged)
          setIsChangePasswordMode(true)
        } else {
          if (logged.role === 'ADMIN') {
            navigate('/admin')
          } else if (logged.role === 'STAFF') {
            navigate('/staff')
          } else {
            navigate('/student')
          }
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError(err.message || 'An error occurred during submission')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      await changePassword(tempUser.id, newPassword)
      
      // Update local storage to remove requiresPasswordChange flag just in case, but really we can just navigate now.
      const updatedUser = { ...tempUser, requiresPasswordChange: false }
      localStorage.setItem('library_user', JSON.stringify(updatedUser))
      
      setSuccessMsg("Password changed successfully! Redirecting...")
      setTimeout(() => {
        if (updatedUser.role === 'ADMIN') {
          navigate('/admin')
        } else if (updatedUser.role === 'STAFF') {
          navigate('/staff')
        } else {
          navigate('/student')
        }
      }, 1000)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError(err.message || 'Failed to change password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden items-center justify-center p-4 bg-[#f8fafc]">
      <div className="absolute left-[-100px] top-[-100px] size-[400px] rounded-full bg-emerald-100 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] size-[400px] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />

      <div className="relative flex w-full max-w-[460px] mx-auto flex-col gap-6 z-10">
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2 pb-2">
            <img src="/logo.png" alt="Smart Library" className="h-10 w-10 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')} />
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              Staff <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Portal</span>
            </p>
          </div>
          <p className="text-center text-sm text-slate-500">
            Smart Library Management System
          </p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 glass-panel p-8 shadow-[0_20px_50px_rgba(16,185,129,0.04)] backdrop-blur-xl">
          <div className="mb-8 grid grid-cols-2 rounded-lg glass-panel p-1">
            <button
              type="button"
              onClick={() => {
                setIsRequestAccess(false)
                setError(null)
                setSuccessMsg(null)
              }}
              className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                !isRequestAccess ? 'bg-white text-emerald-600 shadow-md relative z-10' : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRequestAccess(true)
                setError(null)
                setSuccessMsg(null)
              }}
              className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                isRequestAccess ? 'bg-white text-emerald-600 shadow-md relative z-10' : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Request Access
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-900">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-900">
              <CheckCircle className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isRequestAccess ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee ID</label>
                    <div className="relative mt-1.5">
                      <Hash className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleInputChange} placeholder="EMP12345" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">College Email</label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <input type="email" name="collegeEmail" required value={formData.collegeEmail} onChange={handleInputChange} placeholder="staff@university.edu" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <input type="text" name="mobileNumber" required value={formData.mobileNumber} onChange={handleInputChange} placeholder="+1234567890" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</label>
                    <div className="relative mt-1.5">
                      <Building2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      <input type="text" name="department" required value={formData.department} onChange={handleInputChange} placeholder="Computer Science" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Designation</label>
                    <div className="relative mt-1.5">
                      <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      <input type="text" name="designation" required value={formData.designation} onChange={handleInputChange} placeholder="Professor" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Employment Type</label>
                  
                  <div className="relative mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEmploymentDropdownOpen(!isEmploymentDropdownOpen)}
                      className={`flex w-full items-center justify-between rounded-xl border py-3.5 px-4 text-sm outline-none transition bg-white ${
                        isEmploymentDropdownOpen ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-emerald-600'
                      }`}
                    >
                      <span className={formData.employmentType ? 'text-slate-900' : 'text-slate-500'}>
                        {formData.employmentType || 'Select Type'}
                      </span>
                      <ChevronDown className={`size-4 text-slate-400 transition-transform ${isEmploymentDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isEmploymentDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setIsEmploymentDropdownOpen(false)}
                        ></div>
                        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/5 overflow-hidden origin-top animate-in fade-in zoom-in-95 duration-200">
                          {['Full-Time', 'Part-Time', 'Contract'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, employmentType: type })
                                setIsEmploymentDropdownOpen(false)
                              }}
                              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                formData.employmentType === type
                                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <select name="employmentType" required value={formData.employmentType} onChange={handleInputChange} className="sr-only" tabIndex={-1}>
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </>
            ) : (
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
                      placeholder="staff@university.edu"
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] text-emerald-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-10 text-sm outline-none transition focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isChangePasswordMode && (
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-75"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : isRequestAccess ? (
                  'Submit Request'
                ) : (
                  'Sign In as Staff'
                )}
              </button>
            )}
          </form>

          {isChangePasswordMode && (
            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-5 mt-4">
              <div className="text-sm text-slate-600 mb-2">
                This is your first time logging in. Please change your password to continue.
              </div>
              
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
                    className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-10 text-sm outline-none transition focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition"
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-10 text-sm outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-75"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          )}

          {!isRequestAccess && !isChangePasswordMode && (
            <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs">
              <span className="text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setIsRequestAccess(true)
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="font-bold text-emerald-600 hover:underline"
              >
                Request Access
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
        }} 
      />
    </div>
  )
}
