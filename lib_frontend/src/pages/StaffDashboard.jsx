import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { LogOut, AlertCircle, Loader2, Library, GraduationCap, CheckCircle } from 'lucide-react'

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)
  
  useEffect(() => {
    if (!user) {
      navigate('/staff/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    } else if (user.role !== 'STAFF') {
      navigate('/student')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && user.role === 'STAFF') {
      fetchStaffProfile()
    }
  }, [user])

  const fetchStaffProfile = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/api/staff/profile/user/${user.id}`)
      const fetchedProfile = response.data
      setProfile(fetchedProfile)
      if (!fetchedProfile.profileCompleted) {
        setShowProfileModal(true)
      }
    } catch (err) {
      console.error('Error fetching staff profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaving(true)

    try {
      await apiClient.post(`/api/staff/profile/complete/${user.id}`)
      setShowProfileModal(false)
      fetchStaffProfile() // refresh
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to complete profile')
    } finally {
      setProfileSaving(false)
    }
  }

  if (!user || user.role !== 'STAFF') return null

  return (
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32 bg-[#f8fafc]">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Staff Portal
            </span>
          </div>
          
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="flex size-9 items-center justify-center rounded-full glass-panel text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-12">
             <Loader2 className="size-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-1.5 glass-panel p-5 rounded-2xl border border-slate-200 shadow-xl bg-white">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Welcome Back, {profile?.fullName || user.name}
              </h1>
              <p className="text-xs text-slate-500">
                {profile?.profileCompleted ? (
                  <span>
                    {profile.designation} • {profile.department}
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="size-3.5" /> Action Required: Profile Incomplete
                  </span>
                )}
              </p>
            </section>

            {profile?.profileCompleted ? (
              <section className="rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl text-center bg-white">
                 <div className="flex justify-center mb-4">
                    <Library className="size-12 text-emerald-600" />
                 </div>
                 <h2 className="text-lg font-bold text-slate-900">Dashboard Under Construction</h2>
                 <p className="text-sm text-slate-500 mt-2">
                    Your profile is fully verified. We are rolling out staff-specific modules soon.
                 </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <GraduationCap className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Complete Your Profile
                    </h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Please confirm your details to activate your account and gain access to the library modules.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(true)}
                      className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                    >
                      Verify Details
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Profile Completion Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-600" />
              Verify Profile Details
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Please review the details approved by the administrator.
            </p>

            {profileError && (
              <p className="mb-4 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">
                {profileError}
              </p>
            )}

            <div className="flex flex-col gap-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-bold text-slate-900">{profile.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-bold text-slate-900">{profile.employeeId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Department</span>
                <span className="font-bold text-slate-900">{profile.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Designation</span>
                <span className="font-bold text-slate-900">{profile.designation}</span>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="flex items-start gap-2 mb-4">
                 <input type="checkbox" id="confirmDetails" required className="mt-1" />
                 <label htmlFor="confirmDetails" className="text-[11px] text-slate-600 leading-tight">
                   I verify that the above details are correct and I agree to the library policies.
                 </label>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  'Confirm & Complete Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
