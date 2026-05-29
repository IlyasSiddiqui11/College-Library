import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, ChevronLeft, User, Mail, Phone, GraduationCap, 
  MapPin, Clock, Loader2, Save, Edit2, History
} from 'lucide-react'

export default function StudentProfile() {
  const { user, profile, fetchProfile } = useAuth()
  const navigate = useNavigate()

  // State controls
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Edit fields
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState(1)
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')

  // Statistics & status
  const [borrowRequests, setBorrowRequests] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState({
    insideLibrary: false,
    entryTime: null,
    activeLogId: null
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const loadProfileData = async () => {
    if (!user) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      // 1. Sync authentication context profile
      const prof = await fetchProfile()
      
      // 2. Initialize fields
      setName(user.name || '')
      if (prof) {
        setBranch(prof.branch || '')
        setYear(prof.year || 1)
        setContact(prof.contactNumber || '')
        setAddress(prof.address || '')
      }

      // 3. Get borrowing stats
      const borrowRes = await apiClient.get(`/api/borrow/user/${user.id}`)
      setBorrowRequests(borrowRes.data)

      // 4. Get gate attendance status
      const statusRes = await apiClient.get(`/api/gate/status/${user.id}`)
      setAttendanceStatus(statusRes.data)
    } catch (err) {
      console.error('Error loading profile details:', err)
      setErrorMsg('Failed to sync profile data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setSaving(true)

    try {
      if (!name.trim()) throw new Error('Full Name is required')
      if (!branch.trim()) throw new Error('Academic branch is required')
      if (!contact.trim()) throw new Error('Phone number is required')
      if (!address.trim()) throw new Error('Residential address is required')

      // Call complete profile API (which supports upsert / updates in our backend)
      await apiClient.post('/api/profile/complete', {
        userId: user.id,
        name: name.trim(),
        branch: branch.trim(),
        year,
        contactNumber: contact.trim(),
        address: address.trim()
      })

      // Update local storage session name so welcome back reflects it!
      const stored = localStorage.getItem('library_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.name = name.trim()
        localStorage.setItem('library_user', JSON.stringify(parsed))
      }
      user.name = name.trim()

      setSuccessMsg('Academic profile updated successfully!')
      setIsEditing(false)
      await loadProfileData()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to persist academic profile changes')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  // Compute stats
  const totalBorrowedCount = borrowRequests.length
  const activeBorrowsCount = borrowRequests.filter(r => r.status === 'APPROVED').length
  const returnedCount = borrowRequests.filter(r => r.status === 'RETURNED').length

  // Format date helper: 26 May 2026, 10:45 AM
  const formatDateFull = (dateString) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    
    let hours = d.getHours()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const minutes = d.getMinutes().toString().padStart(2, '0')
    
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F8FAFC] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </button>
          
          <span className="text-sm font-bold tracking-wider uppercase text-blue-600">
            Student Profile
          </span>

          <div className="size-6 opacity-0" />
        </div>
      </header>

      {/* Main Profile Area */}
      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        
        {loading ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Loader2 className="size-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 mt-3">Syncing profile registration details...</span>
          </div>
        ) : (
          <>
            {/* Header Avatar and Basic Info */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md flex flex-col items-center gap-4 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-600 text-white font-bold text-3xl shadow-xl shadow-blue-600/10">
                {name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800">{name}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                <Clock className="size-3 text-slate-400" />
                Library Status: {' '}
                <span className={attendanceStatus.insideLibrary ? 'text-green-600 animate-pulse' : 'text-slate-500'}>
                  {attendanceStatus.insideLibrary ? 'INSIDE' : 'OUTSIDE'}
                </span>
              </div>
            </section>

            {/* Notifications */}
            {errorMsg && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-green-600 font-medium bg-green-50 p-2.5 rounded-lg border border-green-100">
                {successMsg}
              </p>
            )}

            {/* Profile Statistics Grid */}
            <section className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm text-center">
                <p className="text-base font-extrabold text-slate-800">{totalBorrowedCount}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Total Loans</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm text-center">
                <p className="text-base font-extrabold text-blue-600">{activeBorrowsCount}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Active</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm text-center">
                <p className="text-base font-extrabold text-green-600">{returnedCount}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Returned</p>
              </div>
            </section>

            {/* Profile Details Form Card */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100/60 mb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Details</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    <Edit2 className="size-3" /> Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3 text-slate-400 shrink-0" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white disabled:bg-slate-100/40 disabled:text-slate-500 disabled:border-slate-100 transition"
                  />
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="size-3 text-slate-400 shrink-0" /> Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100/40 px-3.5 py-3 text-xs text-slate-500 outline-none border-slate-100 transition"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="size-3 text-slate-400 shrink-0" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={!isEditing}
                    placeholder="e.g. +1 555-0199"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white disabled:bg-slate-100/40 disabled:text-slate-500 disabled:border-slate-100 transition"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="size-3 text-slate-400 shrink-0" /> Academic Branch
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    placeholder="e.g. Mechanical Engineering"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white disabled:bg-slate-100/40 disabled:text-slate-500 disabled:border-slate-100 transition"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="size-3 text-slate-400 shrink-0" /> Academic Year
                  </label>
                  <select
                    disabled={!isEditing}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white disabled:bg-slate-100/40 disabled:text-slate-500 disabled:border-slate-100 transition"
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="size-3 text-slate-400 shrink-0" /> Residential Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    disabled={!isEditing}
                    placeholder="Dormitory Block, Room #, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white disabled:bg-slate-100/40 disabled:text-slate-500 disabled:border-slate-100 resize-none transition"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        loadProfileData()
                      }}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-3.5" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </section>
          </>
        )}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
        <div className="flex items-center justify-around rounded-full border border-white/60 bg-white/80 px-6 py-2 shadow-xl shadow-slate-200/50 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 transition"
          >
            <History className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center gap-0.5 text-blue-600"
          >
            <User className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
