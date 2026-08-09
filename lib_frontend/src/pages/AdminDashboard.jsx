import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  Users, ClipboardList, ArrowRight, ShieldAlert, Loader2, LogOut, Check, X, RefreshCw
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State controls
  const [borrowRequests, setBorrowRequests] = useState([])
  const [gateLogs, setGateLogs] = useState([])
  const [dashboardOverview, setDashboardOverview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [accessionNumber, setAccessionNumber] = useState('')
  const [availableCopies, setAvailableCopies] = useState([])
  const [copiesLoading, setCopiesLoading] = useState(false)

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
      // Fire all network requests concurrently
      const [borrowRes, dashboardRes] = await Promise.all([
        apiClient.get('/api/borrow'),
        apiClient.get('/api/dashboard/today')
      ]);

      setBorrowRequests(borrowRes.data)
      setDashboardOverview(dashboardRes.data)

      // 4. Update gate logs for the live feed (already present in dashboardData)
      const gateLogsResponse = dashboardRes.data.todaysGateActivity || []
      
      // Flatten sessions into individual entry and exit actions for the dashboard feed
      const flatLogs = []
      gateLogsResponse.forEach(session => {
        if (session.entryTime) {
          flatLogs.push({ id: session.id + '-in', action: 'ENTRY', userId: session.userId, userName: session.userName, userRole: session.userRole, timestamp: session.entryTime })
        }
        if (session.exitTime) {
          flatLogs.push({ id: session.id + '-out', action: 'EXIT', userId: session.userId, userName: session.userName, userRole: session.userRole, timestamp: session.exitTime })
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
    loadData(false)

    // Auto-refresh data every 30 seconds without showing loading spinner
    const intervalId = setInterval(() => {
      loadData(false)
    }, 30000)

    return () => clearInterval(intervalId)
  }, [user])

  // Handle Quick Approval
  const handleApprove = async (id, accNum) => {
    if (!accNum || accNum.trim() === '') {
      alert('Please select an accession number.')
      return
    }
    setActionLoadingId(id)
    try {
      await apiClient.post(`/api/admin/approve/${id}?accessionNumber=${encodeURIComponent(accNum.trim())}`)
      await loadData()
      window.dispatchEvent(new Event('refresh-sidebar'))
      setApprovingId(null)
      setAccessionNumber('')
      setAvailableCopies([])
    } catch (err) {
      alert('Approval error: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const startApprove = async (req) => {
    setApprovingId(req.id)
    setAccessionNumber('')
    setAvailableCopies([])
    setCopiesLoading(true)
    try {
      const res = await apiClient.get(`/api/books/isbn/${encodeURIComponent(req.isbn)}/available-copies`)
      setAvailableCopies(res.data || [])
    } catch (err) {
      alert('Could not load available copies: ' + err.message)
      setApprovingId(null)
    } finally {
      setCopiesLoading(false)
    }
  }

  // Handle Quick Rejection
  const handleReject = async (id) => {
    setActionLoadingId(id)
    try {
      await apiClient.post(`/api/admin/reject/${id}`)
      await loadData()
      window.dispatchEvent(new Event('refresh-sidebar'))
    } catch (err) {
      alert('Rejection error: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  if (!user) return null

  // Compute metrics from old lists for backwards compatibility with unchanged components
  const pendingRequests = borrowRequests.filter(req => req.status === 'PENDING')

  // Dashboard Overview Metrics
  const todaysEntries = dashboardOverview?.todaysEntries || 0
  const todaysExits = dashboardOverview?.todaysExits || 0
  const studentsCurrentlyInside = dashboardOverview?.studentsCurrentlyInside || 0
  const todaysBorrowRequests = dashboardOverview?.todaysBorrowRequests || 0
  const totalLostBooks = dashboardOverview?.totalLostBooks || 0

  return (
    <div className="h-screen flex text-slate-900">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar user={user} logout={logout} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header App Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                System Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Live academic catalogue and gate metrics</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => loadData(false)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition"
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
            <div className="relative rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  TODAY
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-4">Today's Check-Ins</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-slate-500" /> : todaysEntries}
              </h3>
            </div>

            {/* Stat 2 */}
            <div className="relative rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <LogOut className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  TODAY
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-4">Today's Check-Outs</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-slate-500" /> : todaysExits}
              </h3>
            </div>

            {/* Stat 3 */}
            <div className="relative rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Users className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-4">Currently Inside</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-slate-500" /> : studentsCurrentlyInside}
              </h3>
            </div>

            {/* Stat 4 */}
            <div className="relative rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ClipboardList className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  TODAY
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-4">Today's Borrow Requests</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-slate-500" /> : todaysBorrowRequests}
              </h3>
            </div>

            {/* Stat 4 */}
            <div className="relative rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl backdrop-blur-md overflow-hidden">
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
              <p className="text-sm font-semibold text-slate-500 mt-4">Requests Awaiting</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <Loader2 className="size-5 animate-spin text-slate-500" /> : pendingRequests.length}
              </h3>
            </div>
          </section>

          {/* Master-Detail Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Queue</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Asset borrow requests awaiting administrative approval</p>
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
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
                          <Loader2 className="size-6 animate-spin text-slate-500 mx-auto" />
                        </td>
                      </tr>
                    ) : borrowRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No borrow requests logged in queue.
                        </td>
                      </tr>
                    ) : (
                      [...borrowRequests]
                        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                        .slice(0, 5)
                        .map((req) => (
                        <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-100 transition">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{req.userName || `User #${req.userId}`}</span>
                              <RoleBadge role={req.userRole} />
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="font-bold text-slate-900 max-w-[200px] truncate">{req.bookTitle}</p>
                            <p className="text-[10px] text-slate-500">ISBN: {req.isbn}</p>
                          </td>
                          <td className="py-4 text-slate-500">
                            {new Date(req.requestDate).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {req.status === 'PENDING' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200/40">
                                PENDING
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200/40">
                                ISSUED
                              </span>
                            )}
                            {req.status === 'RETURNED' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-green-50 text-green-700 font-bold text-[9px] border border-green-200/40">
                                RETURNED
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-red-50 text-red-700 font-bold text-[9px] border border-red-200/40">
                                REJECTED
                              </span>
                            )}
                            {req.status === 'CANCELLED' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-slate-100 text-slate-500 font-bold text-[9px] border border-slate-300/40">
                                CANCELLED
                              </span>
                            )}
                            {req.status === 'LOST' && (
                              <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-red-600 text-white font-bold text-[9px] border border-red-700/40">
                                LOST
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex justify-end gap-1.5">
                                {approvingId === req.id ? (
                                  <div className="flex items-center gap-1.5">
                                    {copiesLoading ? (
                                      <Loader2 className="size-4 animate-spin text-slate-500" />
                                    ) : (
                                      <CustomSelect
                                        value={accessionNumber}
                                        onChange={(val) => setAccessionNumber(val)}
                                        options={availableCopies.map((copy) => ({ value: copy.accessionNumber, label: copy.accessionNumber }))}
                                        placeholder="Select copy..."
                                        className="w-36"
                                      />
                                    )}
                                    <button
                                      disabled={actionLoadingId === req.id || !accessionNumber}
                                      onClick={() => handleApprove(req.id, accessionNumber)}
                                      className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                                      title="Confirm Approve"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => {
                                        setApprovingId(null)
                                        setAccessionNumber('')
                                        setAvailableCopies([])
                                      }}
                                      className="flex size-7 items-center justify-center rounded-lg border border-slate-200 glass-panel hover:text-blue-600 transition"
                                      title="Cancel"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => startApprove(req)}
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
                              <span className={`text-[10px] font-semibold italic pr-1 ${req.status === 'REJECTED' || req.status === 'CANCELLED' || req.status === 'LOST' ? 'text-red-600' : 'text-green-600'}`}>Complete</span>
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
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gate Monitor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time scan feeds from entrance</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 flex flex-col gap-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-slate-500" />
                  </div>
                ) : gateLogs.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No recent entry logs.</p>
                ) : (
                  gateLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id || idx} className="flex items-start gap-3 p-3 glass-panel rounded-xl">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        log.action === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.action === 'ENTRY' ? 'IN' : 'OUT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {log.userName || `User ID #${log.userId}`}
                          </p>
                          <RoleBadge role={log.userRole} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {log.action === 'ENTRY' ? 'Checked into Library' : 'Checked out of Library'}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-1">
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
