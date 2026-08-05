import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  BookOpen, QrCode, ScanLine, Clock, Calendar,
  Briefcase, LogOut, History, User, CheckCircle2, AlertCircle, Loader2, Library, FileText, Banknote
} from 'lucide-react'

export default function StaffDashboard() {
  const { user, staffProfile, fetchStaffProfile, logout, hasFine, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [showQrModal, setShowQrModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [borrowRequests, setBorrowRequests] = useState([])
  const [reservations, setReservations] = useState([])
  const [gateLogs, setGateLogs] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState({
    insideLibrary: false,
    entryTime: null,
    activeLogId: null
  })
  const [loading, setLoading] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const scannerRef = useRef(null)
  const isProcessingQr = useRef(false)
  const profileChecked = useRef(false)

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3500)
  }

  // Redirect guards
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/staff/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    } else if (user.role === 'STUDENT') {
      navigate('/student')
    }
  }, [user, navigate, authLoading])

  // Fetch all dashboard data
  const fetchData = async (showLoading = true) => {
    if (!user) return
    if (showLoading) setLoading(true)
    try {
      const [borrowRes, resRes, gateRes, statusRes] = await Promise.all([
        apiClient.get(`/api/borrow/user/${user.id}`),
        apiClient.get(`/api/reservations/user/${user.id}`),
        apiClient.get(`/api/gate/user/${user.id}`),
        apiClient.get(`/api/gate/status/${user.id}`)
      ])

      setBorrowRequests(borrowRes.data)
      setReservations(resRes.data)

      const flatLogs = []
      gateRes.data.forEach((log) => {
        flatLogs.push({ id: log.id * 2, action: 'ENTRY', timestamp: log.entryTime })
        if (log.exitTime) {
          flatLogs.push({ id: log.id * 2 + 1, action: 'EXIT', timestamp: log.exitTime })
        }
      })
      flatLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setGateLogs(flatLogs)
      setAttendanceStatus(statusRes.data)
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'STAFF') return
    fetchData(true)
    const intervalId = setInterval(() => {
      if (!isProcessingQr.current && !exiting) fetchData(false)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [user])

  // Auto-open profile modal if not completed
  useEffect(() => {
    if (user && !loading) {
      if (!profileChecked.current) {
        profileChecked.current = true
        if (staffProfile && !staffProfile.profileCompleted) {
          setShowProfileModal(true)
        }
      }
      if (staffProfile?.profileCompleted) {
        setShowProfileModal(false)
      }
    }
  }, [user, staffProfile, loading])

  // Profile completion submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaving(true)
    try {
      await apiClient.post(`/api/staff/profile/complete/${user.id}`)
      setShowProfileModal(false)
      showNotification('Profile completed successfully! Welcome aboard.', 'success')
      fetchStaffProfile()
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to complete profile')
    } finally {
      setProfileSaving(false)
    }
  }

  // Gate QR Scanner
  useEffect(() => {
    if (showQrModal) initScanner()
    else stopScanner()
    return () => stopScanner()
  }, [showQrModal])

  const initScanner = () => {
    isProcessingQr.current = false
    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode('staff-gate-scanner-view')
        scannerRef.current = scanner
        scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          (decodedText) => {
            if (decodedText === 'BCOE-LIB-GATE') {
              stopScanner()
              triggerGateCheckIn()
            }
          },
          () => {}
        ).catch(err => console.error('Failed to start scanner:', err))
      } catch (err) {
        console.error('Failed to create scanner:', err)
      }
    }, 100)
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

  const triggerGateCheckIn = async () => {
    if (!user || isProcessingQr.current) return
    isProcessingQr.current = true
    try {
      await apiClient.post('/api/gate/scan', { userId: user.id })
      fetchData()
      showNotification('Checked in successfully at the gate!', 'success')
      setShowQrModal(false)
    } catch (err) {
      showNotification('Check-in error: ' + (err.response?.data?.message || err.message), 'error')
      setShowQrModal(false)
    } finally {
      isProcessingQr.current = false
    }
  }

  const handleExitLibrary = async () => {
    if (!user) return
    setExiting(true)
    try {
      await apiClient.post(`/api/gate/exit/${user.id}`)
      fetchData()
      showNotification('Successfully marked as OUTSIDE. Thank you for visiting!', 'success')
    } catch (err) {
      showNotification('Exit error: ' + err.message, 'error')
    } finally {
      setExiting(false)
    }
  }

  const handleCancelRequest = async (requestId) => {
    if (!user) return
    setCancellingId(requestId)
    try {
      await apiClient.delete(`/api/borrow/${requestId}/cancel?userId=${user.id}`)
      await fetchData(false)
    } catch (err) {
      showNotification('Cancel failed: ' + (err.response?.data?.message || err.message), 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const handleCancelReservation = async (reservationId) => {
    if (!user) return
    setCancellingId(`res-${reservationId}`)
    try {
      await apiClient.delete(`/api/reservations/${reservationId}?userId=${user.id}`)
      await fetchData(false)
    } catch (err) {
      showNotification('Cancel failed: ' + (err.response?.data?.message || err.message), 'error')
    } finally {
      setCancellingId(null)
    }
  }

  if (!user || user.role !== 'STAFF') return null

  const activeBorrows = borrowRequests
    .filter(req => req.status === 'APPROVED')
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
  const pendingRequests = borrowRequests
    .filter(req => req.status === 'PENDING')
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

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
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32 bg-[#f8fafc]">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-sm rounded-xl px-4 py-3 shadow-2xl transition-all animate-in slide-in-from-top-5 fade-in ${
          notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'error' ? <AlertCircle className="size-5 shrink-0" /> : <CheckCircle2 className="size-5 shrink-0" />}
            <p className="text-sm font-semibold leading-tight">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="text-xl font-bold tracking-tight text-slate-900">Staff Portal</span>
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

      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {/* Welcome Section */}
        <section className="flex flex-col gap-1.5 glass-panel p-5 rounded-2xl border border-slate-200 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome Back, {staffProfile?.fullName || user.name}
          </h1>
          <p className="text-xs text-slate-500">
            {staffProfile?.profileCompleted ? (
              <span>{staffProfile.designation} • {staffProfile.department}</span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="size-3.5" /> Action Required: Profile Incomplete
              </span>
            )}
          </p>
        </section>

        {/* Profile incomplete banner */}
        {staffProfile && !staffProfile.profileCompleted && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 backdrop-blur-md">
            <div className="flex gap-3">
              <Briefcase className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">Complete Your Profile</h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Confirm your details to activate your account and gain full library access.
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

        {/* Gate Status Card */}
        <section className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance State</p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Library Gate Status</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${attendanceStatus.insideLibrary ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className={`text-xs font-bold ${attendanceStatus.insideLibrary ? 'text-green-600' : 'text-slate-500'}`}>
                {attendanceStatus.insideLibrary ? 'INSIDE LIBRARY' : 'OUTSIDE'}
              </span>
            </div>
          </div>

          {attendanceStatus.insideLibrary && attendanceStatus.entryTime && (
            <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 font-medium">
              <span className="text-slate-500">Entered at:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{formatDateFull(attendanceStatus.entryTime)}</p>
            </div>
          )}

          {attendanceStatus.insideLibrary && (
            <button
              onClick={handleExitLibrary}
              disabled={exiting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-xs font-bold text-white shadow-md shadow-red-500/10 hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {exiting ? (
                <><Loader2 className="size-3.5 animate-spin" />Processing Exit...</>
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
              <p className="font-semibold text-white">Digital Catalogue</p>
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

        {/* Currently Borrowing */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-slate-900">Currently Borrowing</h2>
            <span className="text-xs font-semibold text-slate-500">{activeBorrows.length} Active Items</span>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="size-6 animate-spin text-slate-500" />
                <span className="text-xs text-slate-500 mt-2">Syncing with library database...</span>
              </div>
            ) : activeBorrows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">No books currently borrowed</p>
                <p className="text-xs text-slate-500 mt-1">Tap "Scan Book" to pick up your next read</p>
              </div>
            ) : (
              activeBorrows.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 glass-panel p-4 shadow-xl backdrop-blur-md">
                  <div className="flex gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-5.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{req.bookTitle}</h4>
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/50 rounded-full px-2 py-0.5 tracking-wide">APPROVED</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Author: {req.bookAuthor || req.author || 'Unknown Author'}</p>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-col gap-0.5">
                        <p>ISBN: {req.isbn || 'N/A'}</p>
                        {req.accessionNumber && <p className="text-amber-600 font-medium font-mono">Accession No: {req.accessionNumber}</p>}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Borrowed: {formatDateFull(req.requestDate).split(',')[0]}
                        </span>
                        {req.dueDate && (() => {
                          const isOverdue = new Date(req.dueDate) < new Date()
                          return (
                            <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Approval ({pendingRequests.length})</p>
                {pendingRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-semibold text-slate-900 truncate">{req.bookTitle}</p>
                      <p className="text-[10px] text-slate-500">ISBN: {req.isbn}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/40">PENDING</span>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                        className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-400/30 px-2.5 py-1 text-[9px] font-bold text-red-600 hover:bg-red-500/30 transition disabled:opacity-50"
                      >
                        {cancellingId === req.id ? <Loader2 className="size-2.5 animate-spin" /> : '✕ Cancel'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reservations */}
            {!loading && reservations.filter(r => r.status === 'PENDING').length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waitlist Reservations ({reservations.filter(r => r.status === 'PENDING').length})</p>
                {reservations.filter(r => r.status === 'PENDING').map((req) => (
                  <div key={`res-${req.id}`} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-semibold text-slate-900 truncate">{req.bookTitle || 'Unknown Title'}</p>
                      <p className="text-[10px] text-slate-500">ISBN: {req.isbn}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200/40">{req.status}</span>
                      {req.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(req.id)}
                          disabled={cancellingId === `res-${req.id}`}
                          className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-400/30 px-2.5 py-1 text-[9px] font-bold text-red-600 hover:bg-red-500/30 transition disabled:opacity-50"
                        >
                          {cancellingId === `res-${req.id}` ? <Loader2 className="size-2.5 animate-spin" /> : '✕ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gate Logs */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-slate-900">Zone Logs</h2>
            <span className="text-xs text-slate-500 font-medium">Gate attendance</span>
          </div>
          <div className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl backdrop-blur-md">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-slate-500" /></div>
            ) : gateLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-2">No gate entries logged yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {gateLogs.slice(0, 3).map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-3 items-center text-xs text-slate-600">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] ${log.action === 'ENTRY' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {log.action === 'ENTRY' ? 'IN' : 'OUT'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">Library Entrance Gate</p>
                      <p className="text-[10px] text-slate-500">{formatDateFull(log.timestamp)}</p>
                    </div>
                    <CheckCircle2 className={`size-4 shrink-0 ${log.action === 'ENTRY' ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* QR Gate Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowQrModal(false)} className="text-slate-500 hover:text-blue-600 font-bold">✕</button>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Scan Gate QR</h3>
            <p className="text-xs text-slate-500 mt-1">Point your camera at the library gate QR code</p>
            <div className="my-6 mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-black">
              <div id="staff-gate-scanner-view" className="w-full min-h-[250px] text-slate-900" />
            </div>
            <p className="text-[10px] text-slate-500">Only the official <strong>BCOE-LIB-GATE</strong> QR code will be accepted.</p>
          </div>
        </div>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && staffProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              Verify Profile Details
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Please review the details approved by the administrator.</p>

            {profileError && (
              <p className="mb-4 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">{profileError}</p>
            )}

            <div className="flex flex-col gap-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-bold text-slate-900">{staffProfile.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-bold text-slate-900">{staffProfile.employeeId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Department</span>
                <span className="font-bold text-slate-900">{staffProfile.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Designation</span>
                <span className="font-bold text-slate-900">{staffProfile.designation}</span>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="flex items-start gap-2 mb-4">
                <input type="checkbox" id="confirmStaffDetails" required className="mt-1" />
                <label htmlFor="confirmStaffDetails" className="text-[11px] text-slate-600 leading-tight">
                  I verify that the above details are correct and I agree to the library policies.
                </label>
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
              >
                {profileSaving ? (
                  <><Loader2 className="size-3.5 animate-spin" />Completing Profile...</>
                ) : (
                  'Confirm & Complete Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
        <div className="flex items-center justify-around rounded-full border border-slate-200 glass-panel px-4 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full bg-slate-100 text-emerald-600 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Catalogue</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition ${hasFine ? 'text-red-600 animate-pulse hover:bg-red-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'}`}
          >
            <History className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/fines')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition"
          >
            <Banknote className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Fines</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/staff/profile')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
