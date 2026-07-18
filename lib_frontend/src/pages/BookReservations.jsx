import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  BookMarked, RefreshCw, Loader2, Library, ClipboardList, BookOpen,
  Users, Clock, UserCheck, ShieldAlert, LogOut, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'

function StatusBadge({ status }) {
  if (status === 'PENDING') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/50">PENDING</span>
  )
  if (status === 'FULFILLED') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200/50">FULFILLED</span>
  )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200/50">CANCELLED</span>
  )
}

const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function BookReservations() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'ADMIN') navigate('/student')
  }, [user, navigate])

  const fetchReservations = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await apiClient.get('/api/reservations')
      setReservations(res.data)
    } catch (err) {
      console.error('Failed to fetch reservations:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchReservations()
  }, [user, fetchReservations])

  if (!user) return null

  const filtered = reservations
    .filter(r => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (r.bookTitle || '').toLowerCase().includes(q) ||
        (r.isbn || '').toLowerCase().includes(q) ||
        (r.user?.name || '').toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate))

  const pendingCount = reservations.filter(r => r.status === 'PENDING').length

  return (
    <div className="h-screen flex text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/20 glass-panel flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-6 py-6 border-b border-white/20">
            <img src="/logo.png" alt="BCOE-lib" className="h-9 w-9 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="font-bold tracking-tight text-white text-base">BCOE-lib</span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <Library className="size-4.5" /> Overview
            </button>
            <button onClick={() => navigate('/lending')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <ClipboardList className="size-4.5" /> Borrow Requests
            </button>
            <button onClick={() => navigate('/inventory')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <BookOpen className="size-4.5" /> Catalog Inventory
            </button>
            <button onClick={() => navigate('/admin/gate-logs')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <Clock className="size-4.5" /> Gate Logs
            </button>
            <button onClick={() => navigate('/returns')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <Users className="size-4.5" /> Return Station
            </button>
            <button onClick={() => navigate('/admin/students')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <UserCheck className="size-4.5" /> Registered Students
            </button>
            <button onClick={() => navigate('/admin/lost-books')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition">
              <ShieldAlert className="size-4.5" /> Lost Books
            </button>
            <button onClick={() => navigate('/admin/reservations')} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition">
              <BookMarked className="size-4.5" />
              Book Reservations
              {pendingCount > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between rounded-xl glass-panel p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-blue-200 font-medium">Administrator</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-blue-200 hover:text-red-600 hover:bg-red-50 transition">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <BookMarked className="size-5 text-amber-400" />
                Book Reservations
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">
                {pendingCount} pending • {reservations.length} total reservations
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search by student, title, ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-56 rounded-xl border border-white/20 glass-input py-2 px-3 text-xs text-white placeholder:text-blue-200 outline-none focus:border-indigo-500 transition"
              />

              {/* Status Filter */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchReservations(false)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 glass-panel px-3.5 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-75"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Pending', value: reservations.filter(r => r.status === 'PENDING').length, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/10 border-amber-400/20', icon: AlertCircle },
              { label: 'Fulfilled', value: reservations.filter(r => r.status === 'FULFILLED').length, color: 'text-green-400', bg: 'from-green-500/10 to-emerald-500/10 border-green-400/20', icon: CheckCircle2 },
              { label: 'Cancelled', value: reservations.filter(r => r.status === 'CANCELLED').length, color: 'text-red-400', bg: 'from-red-500/10 to-rose-500/10 border-red-400/20', icon: XCircle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-2xl border glass-panel p-5 shadow-xl bg-gradient-to-br ${bg}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`size-5 ${color}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reservations Table */}
          <div className="rounded-2xl border border-white/20 glass-panel shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Reservation Queue</h3>
              <span className="text-xs text-blue-200">{filtered.length} records</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-blue-400" />
                <p className="text-xs text-blue-200 mt-3">Loading reservations...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookMarked className="size-10 text-blue-200/30 mb-3" />
                <p className="text-sm font-semibold text-blue-100">No reservations found</p>
                <p className="text-xs text-blue-200 mt-1">Reservations will appear here when students reserve unavailable books.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      <th className="text-left px-6 py-3">Student</th>
                      <th className="text-left px-6 py-3">Book Title</th>
                      <th className="text-left px-6 py-3">ISBN</th>
                      <th className="text-left px-6 py-3">Reserved On</th>
                      <th className="text-left px-6 py-3">Fulfilled On</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`border-b border-white/5 transition hover:bg-white/5 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-[10px]">
                              {(r.user?.name || 'ST').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{r.user?.name || `User #${r.user?.id}`}</p>
                              <p className="text-[10px] text-blue-200">{r.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white max-w-[200px] truncate">{r.bookTitle || '—'}</p>
                          <p className="text-[10px] text-blue-200 mt-0.5">{r.bookAuthor || ''}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-blue-200">{r.isbn || '—'}</td>
                        <td className="px-6 py-4 text-blue-200">{formatDate(r.reservationDate)}</td>
                        <td className="px-6 py-4 text-blue-200">{formatDate(r.fulfilledDate)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
