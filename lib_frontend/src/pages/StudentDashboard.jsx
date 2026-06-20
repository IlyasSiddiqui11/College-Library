import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { 
  BookOpen, QrCode, ScanLine, Clock, Calendar, 
  GraduationCap, LogOut, History, User, CheckCircle2, AlertCircle, Loader2, Library, FileText
} from 'lucide-react'

export default function StudentDashboard() {
  const { user, profile, completeProfile, logout } = useAuth()
  const navigate = useNavigate()

  // State variables
  const [showQrModal, setShowQrModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [borrowRequests, setBorrowRequests] = useState([])
  const [gateLogs, setGateLogs] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState({
    insideLibrary: false,
    entryTime: null,
    activeLogId: null
  })
  const [loading, setLoading] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const scannerRef = useRef(null)
  const isProcessingQr = useRef(false)

  // Profile completion states
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState(1)
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate])

  // Fetch dynamic data
  const fetchData = async (showLoading = true) => {
    if (!user) return
    if (showLoading) setLoading(true)
    try {
      // 1. Get borrowing requests
      const borrowRes = await apiClient.get(`/api/borrow/user/${user.id}`)
      setBorrowRequests(borrowRes.data)

      // 2. Get gate logs
      const gateRes = await apiClient.get(`/api/gate/user/${user.id}`)
      
      // Flatten gate logs
      const flatLogs = []
      gateRes.data.forEach((log) => {
        flatLogs.push({
          id: log.id * 2,
          action: 'ENTRY',
          timestamp: log.entryTime
        })
        if (log.exitTime) {
          flatLogs.push({
            id: log.id * 2 + 1,
            action: 'EXIT',
            timestamp: log.exitTime
          })
        }
      })
      flatLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setGateLogs(flatLogs)

      // 3. Get gate status
      const statusRes = await apiClient.get(`/api/gate/status/${user.id}`)
      setAttendanceStatus(statusRes.data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchData(true)

    // Auto-refresh data every 5 seconds without showing loading spinner
    const intervalId = setInterval(() => {
      if (!isProcessingQr.current && !exiting) {
        fetchData(false)
      }
    }, 5000)

    return () => clearInterval(intervalId)
  }, [user])

  // Auto trigger profile completion modal if incomplete
  useEffect(() => {
    if (user && !profile && !loading) {
      setShowProfileModal(true)
    } else {
      setShowProfileModal(false)
    }
  }, [user, profile, loading])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaving(true)

    try {
      if (!branch.trim()) throw new Error('Academic branch is required')
      if (!contact.trim()) throw new Error('Contact number is required')
      if (!address.trim()) throw new Error('Residential address is required')

      await completeProfile(branch, year, contact, address)
      setShowProfileModal(false)
    } catch (err) {
      setProfileError(err.message || 'Failed to save academic profile')
    } finally {
      setProfileSaving(false)
    }
  }

  // Gate Scanner Logic
  useEffect(() => {
    if (showQrModal) {
      initScanner()
    } else {
      stopScanner()
    }
    return () => stopScanner()
  }, [showQrModal])

  const initScanner = () => {
    isProcessingQr.current = false
    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode('gate-scanner-view')
        scannerRef.current = scanner
        
        scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          (decodedText) => {
            if (decodedText === 'BCOE-LIB-GATE') {
               stopScanner()
               triggerGateCheckIn()
            } else {
               console.warn('Scanned incorrect code:', decodedText)
            }
          },
          (error) => {}
        ).catch(err => console.error('Failed to start scanner:', err))
      } catch (err) {
        console.error('Failed to create scanner:', err)
      }
    }, 100) // Slight delay to ensure DOM is ready
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) scannerRef.current.clear()
        }).catch(() => {
          if (scannerRef.current) scannerRef.current.clear()
        })
      } catch (err) {}
    }
  }

  // Gate Check-In API
  const triggerGateCheckIn = async () => {
    if (!user || isProcessingQr.current) return
    isProcessingQr.current = true
    try {
      await apiClient.post('/api/gate/scan', { userId: user.id })
      fetchData() // Refresh status and logs
      alert('Checked in successfully at the gate!')
      setShowQrModal(false)
    } catch (err) {
      alert('Check-in error: ' + (err.response?.data?.message || err.message))
      setShowQrModal(false)
    } finally {
      isProcessingQr.current = false
    }
  }

  // Gate Exit checkout trigger
  const handleExitLibrary = async () => {
    if (!user) return
    setExiting(true)
    try {
      await apiClient.post(`/api/gate/exit/${user.id}`)
      fetchData()
      alert('Successfully marked as OUTSIDE. Thank you for visiting!')
    } catch (err) {
      alert('Exit error: ' + err.message)
    } finally {
      setExiting(false)
    }
  }

  // Cancel borrow request
  const handleCancelRequest = async (requestId) => {
    if (!user) return
    setCancellingId(requestId)
    try {
      await apiClient.delete(`/api/borrow/${requestId}/cancel?userId=${user.id}`)
      await fetchData(false)
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancellingId(null)
    }
  }

  if (!user) return null

  // Compute stats
  // Compute stats
  const activeBorrows = borrowRequests
    .filter(req => req.status === 'APPROVED')
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
  const pendingRequests = borrowRequests
    .filter(req => req.status === 'PENDING')
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

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
      {/* Dynamic Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="text-xl font-bold tracking-tight text-white">
              BCOE-lib
            </span>
          </div>
          
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="flex size-9 items-center justify-center rounded-full glass-panel text-blue-100 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {/* Welcome Section */}
        <section className="flex flex-col gap-1.5 glass-panel p-5 rounded-2xl border border-white/20 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome Back, {user.name}
          </h1>
          <p className="text-xs text-blue-200">
            {profile ? (
              <span>
                {profile.branch} • Year {profile.year}
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="size-3.5" /> Action Required: Profile Incomplete
              </span>
            )}
          </p>
        </section>

        {/* Live Attendance Zone Status Card */}
        <section className="rounded-2xl border border-white/20 glass-panel p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Attendance State</p>
              <h3 className="text-sm font-bold text-white mt-0.5">Library Gate Status</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${attendanceStatus.insideLibrary ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className={`text-xs font-bold ${attendanceStatus.insideLibrary ? 'text-green-600' : 'text-blue-200'}`}>
                {attendanceStatus.insideLibrary ? 'INSIDE LIBRARY' : 'OUTSIDE'}
              </span>
            </div>
          </div>

          {attendanceStatus.insideLibrary && attendanceStatus.entryTime && (
            <div className="border-t border-white/20 pt-3 text-[11px] text-blue-200 font-medium">
              <span className="text-blue-200">Entered at:</span>
              <p className="font-semibold text-white mt-0.5">{formatDateFull(attendanceStatus.entryTime)}</p>
            </div>
          )}

          {attendanceStatus.insideLibrary && (
            <button
              onClick={handleExitLibrary}
              disabled={exiting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-xs font-bold text-white shadow-md shadow-red-500/10 hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {exiting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Processing Exit...
                </>
              ) : (
                'Exit Library Checkout'
              )}
            </button>
          )}
        </section>

        {/* Quick Action Shortcuts */}
        <section className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="flex h-36 flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-left text-white shadow-md shadow-blue-600/10 hover:shadow-lg transition active:scale-[0.98]"
          >
            <ScanLine className="size-7" />
            <div>
              <p className="font-semibold text-white">Scan Book</p>
              <p className="text-[11px] text-blue-100 mt-0.5">Borrow instantly by scanning shelf ISBN</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex h-36 flex-col justify-between rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 p-5 text-left text-white shadow-md shadow-teal-600/10 hover:shadow-lg transition active:scale-[0.98]"
          >
            <Library className="size-7" />
            <div>
              <p className="font-semibold text-white">Digital Catalog</p>
              <p className="text-[11px] text-teal-100 mt-0.5">Search and request books online</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="col-span-2 flex h-24 flex-row items-center justify-between rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-5 text-left text-white shadow-md shadow-purple-600/10 hover:shadow-lg transition active:scale-[0.98]"
          >
            <div>
              <p className="font-semibold text-white">QR Attendance</p>
              <p className="text-[11px] text-purple-100 mt-0.5">Instant gate check-in and zone entry</p>
            </div>
            <QrCode className="size-7" />
          </button>
        </section>

        {/* Profile Completion banner in dashboard if incomplete */}
        {!profile && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 backdrop-blur-md">
            <div className="flex gap-3">
              <GraduationCap className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Complete Your Profile
                </h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Enter your branch, student year, and address to enable barcode scanning and borrowing permissions.
                </p>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  Fill Details
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Current Borrows */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-white">Currently Borrowing</h2>
            <span className="text-xs font-semibold text-blue-200">
              {activeBorrows.length} Active Items
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="size-6 animate-spin text-blue-200" />
                <span className="text-xs text-blue-200 mt-2">Syncing with library database...</span>
              </div>
            ) : activeBorrows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 glass-panel px-4 py-8 text-center">
                <p className="text-sm font-medium text-blue-100">No books currently borrowed</p>
                <p className="text-xs text-blue-200 mt-1">Tap &quot;Scan Book&quot; to pick up your next academic read</p>
              </div>
            ) : (
              activeBorrows.map((req) => (
                <div 
                  key={req.id} 
                  className="rounded-2xl border border-white/20 glass-panel p-4 shadow-xl backdrop-blur-md"
                >
                  <div className="flex gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-5.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-white truncate text-sm">
                          {req.bookTitle}
                        </h4>
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/50 rounded-full px-2 py-0.5 tracking-wide">
                          APPROVED
                        </span>
                      </div>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Author: {req.bookAuthor || req.author || 'Unknown Author'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-blue-200 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Borrowed: {formatDateFull(req.requestDate).split(',')[0]}
                        </span>
                        {req.dueDate && (() => {
                          const isOverdue = new Date(req.dueDate) < new Date()
                          return (
                            <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-red-400' : 'text-amber-300'}`}>
                              <Calendar className="size-3" />
                              {isOverdue ? '⚠ Overdue: ' : 'Due: '}{formatDateFull(req.dueDate).split(',')[0]}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Pending requests */}
            {!loading && pendingRequests.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Awaiting Approval ({pendingRequests.length})</p>
                {pendingRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-semibold text-white truncate">{req.bookTitle}</p>
                      <p className="text-[10px] text-blue-200">ISBN: {req.isbn}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/40">
                        PENDING
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                        className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-400/30 px-2.5 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
                      >
                        {cancellingId === req.id ? (
                          <Loader2 className="size-2.5 animate-spin" />
                        ) : (
                          '✕ Cancel'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* GateLogs History Feed */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-white">Zone Logs</h2>
            <span className="text-xs text-blue-200 font-medium">Gate attendance</span>
          </div>

          <div className="rounded-2xl border border-white/20 glass-panel p-5 shadow-xl backdrop-blur-md">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-blue-200" />
              </div>
            ) : gateLogs.length === 0 ? (
              <p className="text-center text-xs text-blue-200 py-2">No gate entries logged yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {gateLogs.slice(0, 3).map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-3 items-center text-xs text-blue-100">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] ${
                      log.action === 'ENTRY' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {log.action === 'ENTRY' ? 'IN' : 'OUT'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Library Entrance Gate</p>
                      <p className="text-[10px] text-blue-200">{formatDateFull(log.timestamp)}</p>
                    </div>
                    <CheckCircle2 className={`size-4 shrink-0 ${log.action === 'ENTRY' ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 text-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="text-blue-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <h3 className="font-bold text-white text-lg">Scan Gate QR</h3>
            <p className="text-xs text-blue-200 mt-1">Point your camera at the library gate QR code</p>

            <div className="my-6 mx-auto overflow-hidden rounded-2xl border border-white/20 bg-black">
              <div id="gate-scanner-view" className="w-full min-h-[250px] text-white" />
            </div>

            <p className="text-[10px] text-blue-200">
              Only the official <strong>BCOE-LIB-GATE</strong> QR code will be accepted.
            </p>
          </div>
        </div>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 glass-panel p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <GraduationCap className="size-5 text-blue-600" />
              Academic Verification
            </h3>
            <p className="text-xs text-blue-200 mt-1">
              Please finalize your details to enable book borrowing.
            </p>

            {profileError && (
              <p className="mt-3 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">
                {profileError}
              </p>
            )}

            <form onSubmit={handleProfileSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Branch / Major</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Engineering"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y} className="bg-slate-900 text-white">Year {y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Contact Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555-0199"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Residential Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street Address, Dormitory, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving Details...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
        <div className="flex items-center justify-around rounded-full border border-white/20 glass-panel px-6 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-white/25 text-white shadow-lg transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Catalog</span>
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
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
