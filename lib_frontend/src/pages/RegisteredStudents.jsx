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
  UserCheck
} from 'lucide-react'

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

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen flex text-white">
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
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
                <h1 className="text-xl font-bold tracking-tight text-white">Registered Students</h1>
                <p className="text-xs text-blue-200 mt-0.5">View all students who have completed their profiles</p>
              </div>
            </div>
            <button
              onClick={fetchProfiles}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 glass-panel px-3.5 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-75"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
              <input
                type="text"
                placeholder="Search by name, email, branch or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/20 glass-panel pl-9 pr-4 py-2 text-sm placeholder:text-blue-200 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
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
            <div className="overflow-hidden rounded-xl border border-white/20 glass-panel shadow-xl">
              {filteredProfiles.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-blue-100">No student profiles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-white/20 glass-panel">
                      <tr className="text-blue-200 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Student</th>
                        <th className="px-6 py-3 font-semibold">Branch & Year</th>
                        <th className="px-6 py-3 font-semibold">Contact & Address</th>
                        <th className="px-6 py-3 font-semibold">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.map((p) => (
                        <tr key={p.id} className="hover:bg-white/10 transition">
                          <td className="px-6 py-4 font-bold text-white">
                            <div>
                              <p className="font-bold text-white text-sm">{p.userName}</p>
                              <p className="text-xs text-blue-200 mt-0.5">{p.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-blue-100">
                            <p>{p.branch || 'N/A'}</p>
                            <p className="text-blue-200 mt-0.5">Year {p.year}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-blue-100 max-w-xs">
                            <p>{p.contactNumber || 'N/A'}</p>
                            <p className="text-blue-200 mt-0.5 truncate" title={p.address}>{p.address || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-blue-200 font-medium">
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
          <p className="text-xs text-blue-200 font-medium">
            Showing {filteredProfiles.length} of {profiles.length} registered students
          </p>
        </div>
      </div>
    </div>
  )
}
