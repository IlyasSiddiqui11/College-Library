import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Users, ClipboardList, ArrowRight, ShieldAlert,
  Library, Loader2, LogOut, Check, X, RefreshCw, LogIn, Clock,
  UserCheck
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State controls
  const [books, setBooks] = useState([])
  const [borrowRequests, setBorrowRequests] = useState([])
  const [gateLogs, setGateLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [accessionNumber, setAccessionNumber] = useState('')

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // 1. Fetch books
      const booksRes = await apiClient.get('/api/books')
      setBooks(booksRes.data)

      // 2. Fetch borrow requests
      const borrowRes = await apiClient.get('/api/borrow')
      setBorrowRequests(borrowRes.data)

      // 3. Fetch gate logs
      const gateRes = await apiClient.get('/api/gate/logs')
      
      // Flatten sessions into individual entry and exit actions for the dashboard feed
      const flatLogs = []
      gateRes.data.forEach((log) => {
        // Entry action
        flatLogs.push({
          id: log.id * 2,
          userId: log.userId,
          userName: log.userName,
          action: 'ENTRY',
          timestamp: log.entryTime
        })
        
        // Exit action
        if (log.exitTime) {
          flatLogs.push({
            id: log.id * 2 + 1,
            userId: log.userId,
            userName: log.userName,
            action: 'EXIT',
            timestamp: log.exitTime
          })
        }
      })
      
      // Sort flat logs by timestamp desc
      flatLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setGateLogs(flatLogs)
    } catch (err) {
      console.error('Error fetching admin overview metrics:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadData(true)

    // Auto-refresh data every 5 seconds without showing loading spinner
    const intervalId = setInterval(() => {
      loadData(false)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [user])

  // Handle Quick Approval
  const handleApprove = async (id, accNum) => {
    if (!accNum || accNum.trim() === '') {
      alert('Please enter an accession number.')
      return
    }
    setActionLoadingId(id)
    try {
      await apiClient.post(`/api/admin/approve/${id}?accessionNumber=${encodeURIComponent(accNum.trim())}`)
      await loadData()
      setApprovingId(null)
      setAccessionNumber('')
    } catch (err) {
      alert('Approval error: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle Quick Rejection
  const handleReject = async (id) => {
    setActionLoadingId(id)
    try {
      await apiClient.post(`/api/admin/reject/${id}`)
      await loadData()
    } catch (err) {
      alert('Rejection error: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  if (!user) return null

  // Compute metrics
  const totalBooksCount = books.reduce((acc, book) => acc + (book.totalCopies || 0), 0)
  const liveBorrowsCount = borrowRequests.filter(req => req.status === 'APPROVED').length
  const totalCheckIns = gateLogs.filter(log => log.action === 'ENTRY').length
  const totalCheckOuts = gateLogs.filter(log => log.action === 'EXIT').length
  const pendingRequests = borrowRequests.filter(req => req.status === 'PENDING')

  return (
    <div className="h-screen flex text-white">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 border-r border-white/20 glass-panel flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-white/20">
            <img src="/logo.png" alt="BCOE-lib" className="h-9 w-9 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="font-bold tracking-tight text-white text-base">
              BCOE-lib
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
            >
              <Library className="size-4.5" />
              Overview
            </button>
            <button
              onClick={() => navigate('/lending')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <ClipboardList className="size-4.5" />
              Borrow Requests
              {pendingRequests.length > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <BookOpen className="size-4.5" />
              Catalog Inventory
            </button>
            <button
              onClick={() => navigate('/admin/gate-logs')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <Clock className="size-4.5" />
              Gate Logs
            </button>
            <button
              onClick={() => navigate('/returns')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <Users className="size-4.5" />
              Return Station Kiosk
            </button>
            <button
              onClick={() => navigate('/admin/students')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <UserCheck className="size-4.5" />
              Registered Students
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between rounded-xl glass-panel p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-blue-200 font-medium">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-blue-200 hover:text-red-600 hover:bg-red-50 transition"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header App Bar */}
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                System Overview
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">Live academic catalog and gate metrics</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => loadData(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3.5 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 active:scale-[0.98] transition"
              >
                <RefreshCw className="size-3.5" />
                Sync
              </button>
              
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              
              <div className="items-center gap-2 hidden md:flex">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Aegis Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <main className="flex-1 p-8 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">
          {/* Stat Metrics Row */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Stat 1 */}
            <div className="relative rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Library className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-200 mt-4">Total Inventory</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-blue-200" /> : totalBooksCount}
              </h3>
            </div>

            {/* Stat 2 */}
            <div className="relative rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ClipboardList className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-200 mt-4">Live Borrows</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-blue-200" /> : liveBorrowsCount}
              </h3>
            </div>

            {/* Stat 3 */}
            <div className="relative rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Users className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  IN
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-200 mt-4">Total Check-Ins</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-blue-200" /> : totalCheckIns}
              </h3>
            </div>

            {/* Stat Check-Outs */}
            <div className="relative rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <LogOut className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  OUT
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-200 mt-4">Total Check-Outs</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-blue-200" /> : totalCheckOuts}
              </h3>
            </div>

            {/* Stat 4 */}
            <div className="relative rounded-2xl border border-white/20 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert className="size-5" />
                </div>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-blue-200 mt-4">Requests Awaiting</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-blue-200" /> : pendingRequests.length}
              </h3>
            </div>
          </section>

          {/* Master-Detail Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Review Queue</h3>
                  <p className="text-xs text-blue-200 mt-0.5">Asset borrow requests awaiting administrative approval</p>
                </div>
                <button
                  onClick={() => navigate('/lending')}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Manage All <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/20 text-blue-200 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Requester</th>
                      <th className="pb-3 font-semibold">Asset Title</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <Loader2 className="size-6 animate-spin text-blue-200 mx-auto" />
                        </td>
                      </tr>
                    ) : borrowRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-blue-200 font-medium">
                          No borrow requests logged in queue.
                        </td>
                      </tr>
                    ) : (
                      [...borrowRequests]
                        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                        .slice(0, 5)
                        .map((req) => (
                        <tr key={req.id} className="border-b border-slate-50 hover:bg-white/10 transition">
                          <td className="py-4 font-bold text-white">
                            {req.userName || `Student #${req.userId}`}
                          </td>
                          <td className="py-4">
                            <p className="font-bold text-white max-w-[200px] truncate">{req.bookTitle}</p>
                            <p className="text-[10px] text-blue-200">ISBN: {req.isbn}</p>
                          </td>
                          <td className="py-4 text-blue-200">
                            {new Date(req.requestDate).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {req.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200/40">
                                PENDING
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200/40">
                                APPROVED
                              </span>
                            )}
                            {req.status === 'RETURNED' && (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold text-[9px] border border-green-200/40">
                                RETURNED
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-[9px] border border-red-200/40">
                                REJECTED
                              </span>
                            )}
                            {req.status === 'CANCELLED' && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[9px] border border-slate-300/40">
                                CANCELLED
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex justify-end gap-1.5">
                                {approvingId === req.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Accession No."
                                      maxLength={10}
                                      value={accessionNumber}
                                      onChange={(e) => setAccessionNumber(e.target.value.replace(/\D/g, ''))}
                                      className="w-28 rounded-lg border border-white/20 glass-input px-2 py-1 text-[10px] text-white placeholder:text-blue-200 outline-none focus:border-blue-500 transition"
                                      autoFocus
                                    />
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => handleApprove(req.id, accessionNumber)}
                                      className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
                                      title="Confirm Approve"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => {
                                        setApprovingId(null)
                                        setAccessionNumber('')
                                      }}
                                      className="flex size-7 items-center justify-center rounded-lg border border-white/20 glass-panel hover:text-white transition"
                                      title="Cancel"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => {
                                        setApprovingId(req.id)
                                        setAccessionNumber('')
                                      }}
                                      className="flex size-7 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                                      title="Approve Request"
                                    >
                                      <Check className="size-4" />
                                    </button>
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => handleReject(req.id)}
                                      className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                      title="Reject Request"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className={`text-[10px] font-semibold italic pr-1 ${req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'text-red-400' : 'text-green-400'}`}>Complete</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-time Gate Monitor */}
            <div className="lg:col-span-4 rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-white">Gate Monitor</h3>
                <p className="text-xs text-blue-200 mt-0.5">Real-time scan feeds from entrance</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 flex flex-col gap-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-blue-200" />
                  </div>
                ) : gateLogs.length === 0 ? (
                  <p className="text-blue-200 text-xs text-center py-4">No recent entry logs.</p>
                ) : (
                  gateLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id || idx} className="flex items-start gap-3 p-3 glass-panel rounded-xl">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        log.action === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.action === 'ENTRY' ? 'IN' : 'OUT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white">
                          {log.userName || `Student ID #${log.userId}`}
                        </p>
                        <p className="text-[10px] text-blue-200 mt-0.5">
                          {log.action === 'ENTRY' ? 'Checked into Library' : 'Checked out of Library'}
                        </p>
                        <p className="text-[9px] text-blue-200 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
