import { useState, useEffect, useCallback } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  BookMarked, RefreshCw, Loader2, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar.jsx';
import RoleBadge from '../components/RoleBadge.jsx';

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
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')
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
      const actualRole = r.userRole || r.role || 'STUDENT'
      const matchesUserType = userTypeFilter === 'ALL' || actualRole === userTypeFilter
      return matchesSearch && matchesStatus && matchesUserType
    })
    .sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate))

  const pendingCount = reservations.filter(r => r.status === 'PENDING').length

  return (
    <div className="h-screen flex text-slate-900">
      {/* Sidebar */}
      <AdminSidebar user={user} logout={logout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <BookMarked className="size-5 text-amber-400" />
                Book Reservations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
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
                className="w-56 rounded-xl border border-slate-200 glass-input py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition"
              />

              {/* Status Filter */}
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

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
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
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
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
              { label: 'Fulfilled', value: reservations.filter(r => r.status === 'FULFILLED').length, color: 'text-green-600', bg: 'from-green-500/10 to-emerald-500/10 border-green-400/20', icon: CheckCircle2 },
              { label: 'Cancelled', value: reservations.filter(r => r.status === 'CANCELLED').length, color: 'text-red-600', bg: 'from-red-500/10 to-rose-500/10 border-red-400/20', icon: XCircle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-2xl border glass-panel p-5 shadow-xl bg-gradient-to-br ${bg}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`size-5 ${color}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reservations Table */}
          <div className="rounded-2xl border border-slate-200 glass-panel shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Reservation Queue</h3>
              <span className="text-xs text-slate-500">{filtered.length} records</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-blue-600" />
                <p className="text-xs text-slate-500 mt-3">Loading reservations...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookMarked className="size-10 text-blue-200/30 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No reservations found</p>
                <p className="text-xs text-slate-500 mt-1">Reservations will appear here when students reserve unavailable books.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="text-left px-6 py-3">{userTypeFilter === 'STUDENT' ? 'STUDENT' : userTypeFilter === 'STAFF' ? 'STAFF' : 'USER'}</th>
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
                        className={`border-b border-white/5 transition hover:bg-slate-100 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full pfp-circle bg-blue-600 text-white font-bold text-[10px]">
                              {(r.user?.name || 'ST').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">{r.user?.name || `User #${r.user?.id}`}</p>
                                {userTypeFilter === 'ALL' && <RoleBadge role={r.userRole || r.role || 'STUDENT'} />}
                              </div>
                              <p className="text-[10px] text-slate-500">{r.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 max-w-[200px] truncate">{r.bookTitle || '—'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{r.bookAuthor || ''}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">{r.isbn || '—'}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(r.reservationDate)}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(r.fulfilledDate)}</td>
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
