import BottomNav from '../components/BottomNav.jsx';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  BookOpen, ChevronLeft, User, Mail, Briefcase, Building2,
  Clock, Loader2, History, FileText, CheckCircle2, Banknote
} from 'lucide-react'

export default function StaffProfile() {
  const { user, staffProfile, fetchStaffProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [borrowRequests, setBorrowRequests] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState({ insideLibrary: false })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/staff/login')
    } else if (user.role !== 'STAFF') {
      navigate('/student')
    }
  }, [user, navigate, authLoading])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [borrowRes, statusRes] = await Promise.all([
        apiClient.get(`/api/borrow/user/${user.id}`),
        apiClient.get(`/api/gate/status/${user.id}`)
      ])
      setBorrowRequests(borrowRes.data)
      setAttendanceStatus(statusRes.data)
      await fetchStaffProfile()
    } catch (err) {
      console.error('Error loading staff profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadData()
    const intervalId = setInterval(() => loadData(), 10000)
    return () => clearInterval(intervalId)
  }, [user])

  if (!user || user.role !== 'STAFF') return null

  const totalBorrowedCount = borrowRequests.length
  const activeBorrowsCount = borrowRequests.filter(r => r.status === 'APPROVED').length
  const returnedCount = borrowRequests.filter(r => r.status === 'RETURNED').length

  const displayName = staffProfile?.fullName || user.name

  const profileRows = staffProfile
    ? [
        { label: 'Employee ID', value: staffProfile.employeeId, icon: <User className="size-3 text-slate-500 shrink-0" /> },
        { label: 'Email Address', value: user.email, icon: <Mail className="size-3 text-slate-500 shrink-0" /> },
        { label: 'Department', value: staffProfile.department, icon: <Building2 className="size-3 text-slate-500 shrink-0" /> },
        { label: 'Designation', value: staffProfile.designation, icon: <Briefcase className="size-3 text-slate-500 shrink-0" /> },
      ].filter(r => r.value)
    : []

  return (
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </button>
          <span className="text-sm font-bold tracking-wider uppercase text-emerald-600">Staff Profile</span>
          <div className="size-6 opacity-0" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Loader2 className="size-8 text-emerald-500 animate-spin" />
            <span className="text-xs text-slate-500 mt-3">Loading staff profile...</span>
          </div>
        ) : (
          <>
            {/* Avatar and Basic Info */}
            <section className="rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md flex flex-col items-center gap-4 text-center">
              <div className="flex size-24 items-center justify-center rounded-full bg-emerald-600 text-white font-semibold text-3xl shadow-md ring-4 ring-white">
                {displayName?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{displayName}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                {staffProfile?.designation && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">{staffProfile.designation}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                <Clock className="size-3 text-slate-500" />
                Library Status:{' '}
                <span className={attendanceStatus.insideLibrary ? 'text-green-600 animate-pulse' : 'text-slate-500'}>
                  {attendanceStatus.insideLibrary ? 'INSIDE' : 'OUTSIDE'}
                </span>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-slate-900">{totalBorrowedCount}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Total Loans</p>
              </div>
              <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-emerald-600">{activeBorrowsCount}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Active</p>
              </div>
              <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-green-600">{returnedCount}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Returned</p>
              </div>
            </section>

            {/* Profile Details Card */}
            <section className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl backdrop-blur-md">
              <div className="pb-4 border-b border-slate-200 mb-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Details</h3>
              </div>

              {staffProfile ? (
                <div className="flex flex-col gap-4">
                  {profileRows.map((row) => (
                    <div key={row.label}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        {row.icon} {row.label}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={row.value || 'N/A'}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 glass-panel/40 px-3.5 py-3 text-xs text-slate-700 outline-none transition"
                      />
                    </div>
                  ))}

                  {/* Staff ID (system) */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="size-3 text-slate-500 shrink-0" /> Staff User ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.id || 'N/A'}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 glass-panel/40 px-3.5 py-3 text-xs text-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Profile Status */}
                  <div className={`mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${staffProfile.profileCompleted ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <CheckCircle2 className="size-4 shrink-0" />
                    {staffProfile.profileCompleted ? 'Profile Verified & Active' : 'Profile Pending Completion'}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No profile data found. Please contact the administrator.</p>
              )}
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
