import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client.js'
import {
  Users, Clock, LogIn, Search, RefreshCw, Download, AlertTriangle, Loader2, ArrowLeft, UserCheck
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx';
import RoleBadge from '../components/RoleBadge.jsx'

export default function GateLogs() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('ALL')
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [availableMonths, setAvailableMonths] = useState([]) // [{year, month}]

  // Admin-only page
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'GATE_GUARD') {
      navigate('/student')
    }
  }, [user, navigate])

  useEffect(() => {
    if (error) {
      const el = document.getElementById('error-message')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [error])

  // Fetch available months (past records) once on mount
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const res = await apiClient.get('/api/gate/available-months')
        setAvailableMonths(res.data || [])
        // Default to most recent month with records if exists
        if (res.data && res.data.length > 0) {
          setSelectedYear(res.data[0].year)
          setSelectedMonth(res.data[0].month)
        }
      } catch (err) {
        console.error('Failed to fetch available months:', err)
      }
    }
    fetchAvailableMonths()
  }, [])

  // Fetch logs when month/year changes
  useEffect(() => {
    fetchLogs()
  }, [selectedMonth, selectedYear])

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiClient.get(`/api/gate/monthly?year=${selectedYear}&month=${selectedMonth}`),
        apiClient.get(`/api/gate/monthly/stats?year=${selectedYear}&month=${selectedMonth}`)
      ])
      
      // Map sessions into a single row with entry and exit times
      const sessionLogs = logsRes.data.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail || 'N/A',
        branch: log.branch || 'N/A',
        year: log.year,
        userRole: log.userRole,
        entryTime: log.entryTime,
        exitTime: log.exitTime,
        status: log.exitTime ? 'OUTSIDE' : 'INSIDE'
      }))
      
      // Sort by entryTime descending
      sessionLogs.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      setLogs(sessionLogs)
      setMonthlyStats(statsRes.data)
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
    const matchesStatus = filterBy === 'ALL' || log.status === filterBy
    const matchesBranch = branchFilter === 'ALL' || log.branch === branchFilter
    const actualRole = log.userRole || log.role || 'STUDENT'
    const matchesUserType = userTypeFilter === 'ALL' || actualRole === userTypeFilter
    return matchesSearch && matchesStatus && matchesBranch && matchesUserType
  })

  // Calculate unique branch options
  const uniqueBranches = [...new Set(logs.map(log => log.branch).filter(b => b && b !== 'N/A'))].sort()
  const branchOptions = ['ALL', ...uniqueBranches].map(b => ({ value: b, label: b }))

  // Calculate statistics
  const totalStudents = new Set(logs.map((l) => l.userId)).size

  // ── Smart year/month options ─────────────────────────────────────
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Years: all years with records
  const recordYears = [...new Set(availableMonths.map(m => m.year))]
  const yearOptions = recordYears.length > 0 
    ? recordYears.sort((a, b) => b - a).map(y => ({ value: y, label: String(y) }))
    : [{ value: currentYear, label: String(currentYear) }]

  // Months for selectedYear:
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const recordMonthsForYear = new Set(
    availableMonths.filter(m => m.year === selectedYear).map(m => m.month)
  )
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter(m => recordMonthsForYear.has(m))
    .map(m => ({ value: m, label: MONTH_NAMES[m - 1] }))

  // Fallback if no records found for selected year (e.g. brand new system)
  if (monthOptions.length === 0) {
    monthOptions.push({ value: currentMonth, label: MONTH_NAMES[currentMonth - 1] })
  }

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

  // Monthly stats fallback
  const totalEntries = monthlyStats?.totalEntries || logs.length
  const avgDaily = monthlyStats?.averageDailyVisitors || 0
  const insideCount = monthlyStats?.studentsCurrentlyInside || logs.filter(l => l.status === 'INSIDE').length

  const handleExport = () => {
    const userHeader = userTypeFilter === 'STUDENT' ? 'STUDENT' : userTypeFilter === 'STAFF' ? 'STAFF' : 'USER'
    const headers = [`${userHeader} Name`, `${userHeader} Email`, 'Branch', 'Year', 'Entry Time', 'Exit Time', 'Status']
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
    <div className="h-screen flex text-slate-900">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar user={user} logout={logout} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg p-2 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Gate Logs</h1>
                <p className="text-xs text-slate-500 mt-0.5">Real-time library access monitoring</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={loading || filteredLogs.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Entries (Month)</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{totalEntries}</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <LogIn className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Currently Inside</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{insideCount}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-green-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Unique Students</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{totalStudents}</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-slate-200 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. Daily Visitors</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{avgDaily}</p>
                </div>
                <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 glass-panel pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <CustomSelect
                value={userTypeFilter}
                onChange={(val) => setUserTypeFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Users' },
                  { value: 'STUDENT', label: 'Students' },
                  { value: 'STAFF', label: 'Staff' }
                ]}
                className="w-32"
              />
              <CustomSelect
                value={branchFilter}
                onChange={(val) => setBranchFilter(val)}
                options={branchOptions}
                className="w-32"
              />
              <CustomSelect
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(Number(val))}
                options={monthOptions}
                className="w-36"
              />
              <CustomSelect
                value={selectedYear}
                onChange={(val) => setSelectedYear(Number(val))}
                options={yearOptions}
                className="w-24"
              />
              {['ALL', 'INSIDE', 'OUTSIDE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterBy(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterBy === type
                      ? 'bg-blue-600 text-white'
                      : 'glass-panel text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div id="error-message" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
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
            <div className="overflow-hidden rounded-xl border border-slate-200 glass-panel shadow-xl">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-600">No gate logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-slate-200 glass-panel">
                      <tr className="text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">{userTypeFilter === 'STUDENT' ? 'STUDENT' : userTypeFilter === 'STAFF' ? 'STAFF' : 'USER'}</th>
                        <th className="px-6 py-3 font-semibold">Branch</th>
                        <th className="px-6 py-3 font-semibold">Entry Time</th>
                        <th className="px-6 py-3 font-semibold">Exit Time</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-100 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">{log.userName}</p>
                                {userTypeFilter === 'ALL' && <RoleBadge role={log.userRole || log.role || 'STUDENT'} />}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{log.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {log.branch || 'N/A'}
                            {log.year && ` - Year ${log.year}`}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatDateFull(log.entryTime)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatDateFull(log.exitTime)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                log.status === 'INSIDE'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
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
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredLogs.length} of {logs.length} records
          </p>
        </div>
      </div>
    </div>
  )
}
