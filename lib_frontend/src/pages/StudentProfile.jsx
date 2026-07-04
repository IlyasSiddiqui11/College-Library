import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, ChevronLeft, User, Mail, Phone, GraduationCap, 
  MapPin, Clock, Loader2, Save, Edit2, History, FileText, ChevronDown
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
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
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

  const loadProfileData = async (showLoading = true) => {
    if (!user) return
    if (showLoading) {
      setLoading(true)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
    try {
      // 1. Sync authentication context profile
      const prof = await fetchProfile()
      
      // 2. Initialize fields (only on initial load)
      if (showLoading) {
        setName(user.name || '')
        if (prof) {
          setBranch(prof.branch || '')
          setYear(prof.year || 1)
          setContact(prof.contactNumber || '')
          setAddress(prof.address || '')
        }
      }

      // 3. Get borrowing stats
      const borrowRes = await apiClient.get(`/api/borrow/user/${user.id}`)
      setBorrowRequests(borrowRes.data)

      // 4. Get gate attendance status
      const statusRes = await apiClient.get(`/api/gate/status/${user.id}`)
      setAttendanceStatus(statusRes.data)
    } catch (err) {
      console.error('Error loading profile details:', err)
      if (showLoading) setErrorMsg('Failed to sync profile data. Please try again.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadProfileData(true)
    const intervalId = setInterval(() => {
      loadProfileData(false)
    }, 5000)
    return () => clearInterval(intervalId)
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
    <div className="relative flex min-h-screen w-full flex-col text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition"
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
            <span className="text-xs text-blue-200 mt-3">Syncing profile registration details...</span>
          </div>
        ) : (
          <>
            {/* Header Avatar and Basic Info */}
            <section className="rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md flex flex-col items-center gap-4 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-600 text-white font-bold text-3xl shadow-xl shadow-blue-600/10">
                {name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">{name}</h1>
                <p className="text-xs text-blue-200 mt-0.5">{user.email}</p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-white/20 text-[10px] font-bold text-blue-100 uppercase tracking-wide">
                <Clock className="size-3 text-blue-200" />
                Library Status: {' '}
                <span className={attendanceStatus.insideLibrary ? 'text-green-600 animate-pulse' : 'text-blue-200'}>
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
              <div className="rounded-2xl border border-white/20 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-white">{totalBorrowedCount}</p>
                <p className="text-[8px] font-bold text-blue-200 uppercase mt-0.5">Total Loans</p>
              </div>
              <div className="rounded-2xl border border-white/20 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-blue-600">{activeBorrowsCount}</p>
                <p className="text-[8px] font-bold text-blue-200 uppercase mt-0.5">Active</p>
              </div>
              <div className="rounded-2xl border border-white/20 glass-panel p-3 shadow-xl text-center">
                <p className="text-base font-extrabold text-green-600">{returnedCount}</p>
                <p className="text-[8px] font-bold text-blue-200 uppercase mt-0.5">Returned</p>
              </div>
            </section>

            {/* Profile Details Form Card */}
            <section className="rounded-2xl border border-white/20 glass-panel p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-center pb-4 border-b border-white/20 mb-5">
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Academic Details</h3>
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
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3 text-blue-200 shrink-0" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-input px-3.5 py-3 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel disabled:glass-panel/40 disabled:text-blue-200 disabled:border-white/20 transition"
                  />
                </div>

                {/* Student ID (Read Only) */}
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3 text-blue-200 shrink-0" /> Student ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.id || 'N/A'}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-panel/40 px-3.5 py-3 text-xs text-blue-200 outline-none border-white/20 transition"
                  />
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="size-3 text-blue-200 shrink-0" /> Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-panel/40 px-3.5 py-3 text-xs text-blue-200 outline-none border-white/20 transition"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="size-3 text-blue-200 shrink-0" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={!isEditing}
                    placeholder="e.g. +1 555-0199"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-input px-3.5 py-3 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel disabled:glass-panel/40 disabled:text-blue-200 disabled:border-white/20 transition"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="size-3 text-blue-200 shrink-0" /> Academic Branch
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    placeholder="e.g. Mechanical Engineering"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-input px-3.5 py-3 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel disabled:glass-panel/40 disabled:text-blue-200 disabled:border-white/20 transition"
                  />
                </div>

                {/* Year */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="size-3 text-blue-200 shrink-0" /> Academic Year
                  </label>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => isEditing && setYearDropdownOpen(!yearDropdownOpen)}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-input px-3.5 py-3 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel disabled:glass-panel/40 disabled:text-blue-200 disabled:border-white/20 transition flex justify-between items-center"
                  >
                    <span>Year {year}</span>
                    <ChevronDown className="size-3 text-blue-200" />
                  </button>
                  {yearDropdownOpen && isEditing && (
                    <>
                      <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-lg border border-white/20 glass-panel shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                        {[1, 2, 3, 4].map(y => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => {
                              setYear(y);
                              setYearDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-3 text-xs transition ${
                              year === y ? 'bg-indigo-600/30 text-white font-bold' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            Year {y}
                          </button>
                        ))}
                      </div>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setYearDropdownOpen(false)} 
                      />
                    </>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="size-3 text-blue-200 shrink-0" /> Residential Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    disabled={!isEditing}
                    placeholder="Dormitory Block, Room #, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/20 glass-input px-3.5 py-3 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel disabled:glass-panel/40 disabled:text-blue-200 disabled:border-white/20 resize-none transition"
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
                      className="flex-1 rounded-xl border border-white/20 py-3 text-xs font-bold text-blue-100 hover:bg-white/10 transition"
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
        <div className="flex items-center justify-around rounded-full border border-white/20 glass-panel px-6 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <History className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-white/25 text-white shadow-lg transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
