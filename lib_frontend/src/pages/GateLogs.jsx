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
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { PageShell } from '../components/PageShell.jsx'

export default function GateLogs() {
  const { user } = useAuth()
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
      
      // Flatten sessions into individual entry and exit actions
      const flatLogs = []
      response.data.forEach((log) => {
        // Entry action
        flatLogs.push({
          id: log.id * 2,
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail || 'N/A',
          branch: log.branch || 'N/A',
          year: log.year,
          action: 'ENTRY',
          timestamp: log.entryTime,
          status: log.exitTime ? 'OUTSIDE' : 'INSIDE'
        })
        
        // Exit action (if checked out)
        if (log.exitTime) {
          flatLogs.push({
            id: log.id * 2 + 1,
            userId: log.userId,
            userName: log.userName,
            userEmail: log.userEmail || 'N/A',
            branch: log.branch || 'N/A',
            year: log.year,
            action: 'EXIT',
            timestamp: log.exitTime,
            status: 'OUTSIDE'
          })
        }
      })
      
      // Sort by timestamp descending
      flatLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setLogs(flatLogs)
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
    const matchesFilter = filterBy === 'ALL' || log.action === filterBy
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
      new Date(l.timestamp).toDateString() === new Date().toDateString()
  )
  
  // Currently inside: number of ENTRY logs that have status === 'INSIDE'
  const currentlyInside = logs.filter(l => l.action === 'ENTRY' && l.status === 'INSIDE').length

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <PageShell>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg p-2 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Gate Logs</h1>
                <p className="mt-1 text-sm text-slate-600">Real-time library access monitoring</p>
              </div>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-75"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Analytics Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{totalStudents}</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Currently Inside</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{currentlyInside}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-green-600">
                  <LogIn className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today's Entries</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{todayLogs.filter(l => l.action === 'ENTRY').length}</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              {['ALL', 'ENTRY', 'EXIT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterBy(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterBy === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
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
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-600">No gate logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{log.userName}</p>
                              <p className="text-sm text-slate-500">{log.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {log.branch || 'N/A'}
                            {log.year && ` - Year ${log.year}`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {log.action === 'ENTRY' ? (
                                <>
                                  <LogIn className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">Entry</span>
                                </>
                              ) : (
                                <>
                                  <LogOut className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">Exit</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDateFull(log.timestamp)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                log.status === 'INSIDE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-700'
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
          <p className="mt-4 text-sm text-slate-600">
            Showing {filteredLogs.length} of {logs.length} records
          </p>
        </div>
      </div>
    </PageShell>
  )
}
