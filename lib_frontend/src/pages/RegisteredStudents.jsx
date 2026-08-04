import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client.js'
import {
  Users,
  LogOut,
  Search,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  BookOpen,
  Library,
  ClipboardList,
  Clock,
  UserCheck,
  Download,
  ShieldAlert,
  BookMarked
, Banknote, History} from 'lucide-react'

export default function RegisteredStudents() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Admin-only page
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
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

  // Fetch profiles
  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/api/profile/all')
      
      const flatProfiles = response.data || []
      
      // Sort by creation date descending
      flatProfiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setProfiles(flatProfiles)
    } catch (err) {
      setError(err.message || 'Failed to fetch student profiles')
    } finally {
      setLoading(false)
    }
  }

  // Filter logs
  const filteredProfiles = profiles.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      (p.userName || '').toLowerCase().includes(q) ||
      (p.userEmail || '').toLowerCase().includes(q) ||
      (p.branch || '').toLowerCase().includes(q) ||
      (p.contactNumber || '').includes(q)
    )
  })

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

  const handleExport = () => {
    const headers = ['Student Name', 'Student Email', 'Branch', 'Year', 'Contact Number', 'Address', 'Registered At']
    const csvRows = [
      headers.join(','),
      ...filteredProfiles.map(p => [
        `"${p.userName || ''}"`,
        `"${p.userEmail || ''}"`,
        `"${p.branch || 'N/A'}"`,
        `"${p.year || ''}"`,
        `"${p.contactNumber || ''}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        `"${formatDateFull(p.createdAt)}"`
      ].join(','))
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `registered_students_${new Date().getTime()}.csv`)
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
      <aside className="w-64 border-r border-slate-200 glass-panel flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-slate-200">
            <img src="/logo.png" alt="BCOE-lib" className="h-9 w-9 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="font-bold tracking-tight text-slate-900 text-base">
              BCOE-lib
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <Library className="size-4.5" />
              Overview
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <BookOpen className="size-4.5" />
              Catalogue Inventory
            </button>
            <button
              onClick={() => navigate('/lending')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <ClipboardList className="size-4.5" />
              Borrow Requests
            </button>
            <button
              onClick={() => navigate('/returns')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <Users className="size-4.5" />
              Return Station
            </button>
            <button
              onClick={() => navigate('/admin/lost-books')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <ShieldAlert className="size-4.5" />
              Lost Books
            </button>
            <button
              onClick={() => navigate('/admin/gate-logs')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <Clock className="size-4.5" />
              Gate Logs
            </button>
            <button
              onClick={() => navigate('/admin/reservations')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <BookMarked className="size-4.5" />
              Book Reservations
            </button>
                        <button
              onClick={() => navigate('/admin/replacements')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <History className="size-4.5" />
              Replacement History
            </button>
            <button
              onClick={() => navigate('/admin/fines')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 text-left transition"
            >
              <Banknote className="size-4.5" />
              Fine Management
            </button>
            <button
              onClick={() => navigate('/admin/students')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
            >
              <UserCheck className="size-4.5" />
              Registered Students
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between rounded-xl glass-panel p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
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
                className="rounded-lg p-2 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Registered Students</h1>
                <p className="text-xs text-slate-500 mt-0.5">View all students who have completed their profiles</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={loading || filteredProfiles.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <button
                onClick={fetchProfiles}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, branch or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 glass-panel pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div id="error-message" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error Loading Profiles</p>
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

          {/* Profiles Table */}
          {!loading && (
            <div className="overflow-hidden rounded-xl border border-slate-200 glass-panel shadow-xl">
              {filteredProfiles.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-600">No student profiles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-slate-200 glass-panel">
                      <tr className="text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Student</th>
                        <th className="px-6 py-3 font-semibold">Branch & Year</th>
                        <th className="px-6 py-3 font-semibold">Contact & Address</th>
                        <th className="px-6 py-3 font-semibold">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-100 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm">{p.userName}</p>
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-[10px] text-slate-500 font-mono">
                                  ID: {p.userId || p.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{p.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <p>{p.branch || 'N/A'}</p>
                            <p className="text-slate-500 mt-0.5">Year {p.year}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 max-w-xs">
                            <p>{p.contactNumber || 'N/A'}</p>
                            <p className="text-slate-500 mt-0.5 truncate" title={p.address}>{p.address || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {formatDateFull(p.createdAt)}
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
            Showing {filteredProfiles.length} of {profiles.length} registered students
          </p>
        </div>
      </div>
    </div>
  )
}
