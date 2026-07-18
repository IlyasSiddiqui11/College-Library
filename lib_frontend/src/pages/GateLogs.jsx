import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client.js'
import {
  Users,
  Clock,
  LogOut,
  LogIn,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Library,
  ClipboardList,
  UserCheck,
  BookOpen,
  ShieldAlert,
  BookMarked
} from 'lucide-react'

export default function GateLogs() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('ALL')

  // Admin-only page
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  // Fetch gate logs
  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/api/gate/logs')
      
      // Map sessions into a single row with entry and exit times
      const sessionLogs = response.data.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail || 'N/A',
        branch: log.branch || 'N/A',
        year: log.year,
        entryTime: log.entryTime,
        exitTime: log.exitTime,
        status: log.exitTime ? 'OUTSIDE' : 'INSIDE'
      }))
      
      // Sort by entryTime descending
      sessionLogs.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      setLogs(sessionLogs)
    } catch (err) {
      setError(err.message || 'Failed to fetch gate logs')
    } finally {
      setLoading(false)
    }
  }

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      (log.userName || '').toLowerCase().includes(q) ||
      (log.userEmail || '').toLowerCase().includes(q)
    const matchesFilter = filterBy === 'ALL' || log.status === filterBy
    return matchesSearch && matchesFilter
  })

  // Calculate statistics
  const totalStudents = new Set(logs.map((l) => l.userId)).size
  
  // Format Date Helper: 26 May 2026, 10:45 AM
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
    hours = hours ? hours : 12 // the hour '0' should be '12'
    const minutes = d.getMinutes().toString().padStart(2, '0')
    
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
  }

  const todayLogs = logs.filter(
    (l) =>
      new Date(l.entryTime).toDateString() === new Date().toDateString()
  )
  
  // Currently inside: number of logs that have status === 'INSIDE'
  const currentlyInside = logs.filter(l => l.status === 'INSIDE').length

  const handleExport = () => {
    const headers = ['Student Name', 'Student Email', 'Branch', 'Year', 'Entry Time', 'Exit Time', 'Status']
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.userName || ''}"`,
        `"${log.userEmail || ''}"`,
        `"${log.branch || 'N/A'}"`,
        `"${log.year || ''}"`,
        `"${formatDateFull(log.entryTime)}"`,
        `"${formatDateFull(log.exitTime)}"`,
        `"${log.status}"`
      ].join(','))
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `gate_logs_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (user?.role !== 'ADMIN') {
    return null
  }

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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
            >
              <Clock className="size-4.5" />
              Gate Logs
            </button>
            <button
              onClick={() => navigate('/returns')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <Users className="size-4.5" />
              Return Station
            </button>
            <button
              onClick={() => navigate('/admin/students')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <UserCheck className="size-4.5" />
              Registered Students
            </button>
            <button
              onClick={() => navigate('/admin/lost-books')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <ShieldAlert className="size-4.5" />
              Lost Books
            </button>
            <button
              onClick={() => navigate('/admin/reservations')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <BookMarked className="size-4.5" />
              Book Reservations
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
        <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg p-2 hover:bg-white/10 transition"
              >
                <ArrowLeft className="h-5 w-5 text-blue-100" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Gate Logs</h1>
                <p className="text-xs text-blue-200 mt-0.5">Real-time library access monitoring</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={loading || filteredLogs.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 glass-panel px-3.5 py-2 text-xs font-bold text-green-100 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 glass-panel px-3.5 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-75"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-white/20 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-white">{totalStudents}</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Currently Inside</p>
                  <p className="mt-2 text-3xl font-bold text-white">{currentlyInside}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-green-600">
                  <LogIn className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Today's Entries</p>
                  <p className="mt-2 text-3xl font-bold text-white">{todayLogs.filter(l => l.action === 'ENTRY').length}</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/20 glass-panel pl-9 pr-4 py-2 text-sm placeholder:text-blue-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              {['ALL', 'INSIDE', 'OUTSIDE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterBy(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterBy === type
                      ? 'bg-blue-600 text-white'
                      : 'glass-panel text-white hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error Loading Logs</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Logs Table */}
          {!loading && (
            <div className="overflow-hidden rounded-xl border border-white/20 glass-panel shadow-xl">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-blue-100">No gate logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-white/20 glass-panel">
                      <tr className="text-blue-200 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Student</th>
                        <th className="px-6 py-3 font-semibold">Branch</th>
                        <th className="px-6 py-3 font-semibold">Entry Time</th>
                        <th className="px-6 py-3 font-semibold">Exit Time</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/10 transition">
                          <td className="px-6 py-4 font-bold text-white">
                            <div>
                              <p className="font-bold text-white">{log.userName}</p>
                              <p className="text-[10px] text-blue-200 mt-0.5">{log.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-blue-100">
                            {log.branch || 'N/A'}
                            {log.year && ` - Year ${log.year}`}
                          </td>
                          <td className="px-6 py-4 text-blue-200">
                            {formatDateFull(log.entryTime)}
                          </td>
                          <td className="px-6 py-4 text-blue-200">
                            {formatDateFull(log.exitTime)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                log.status === 'INSIDE'
                                  ? 'bg-green-50 text-green-700 border-green-200/40'
                                  : 'glass-panel text-white border-white/20/40'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Records count */}
          <p className="text-xs text-blue-200 font-medium">
            Showing {filteredLogs.length} of {logs.length} records
          </p>
        </div>
      </div>
    </div>
  )
}
