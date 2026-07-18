import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Library,
  Loader2,
  LogOut,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  RefreshCw,
  BookMarked
} from 'lucide-react'

function exportToCsv(rows, filename) {
  const csv = rows.map(row =>
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LostBooks() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [accessionNumber, setAccessionNumber] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const [loadingDetails, setLoadingDetails] = useState(false)
  const [details, setDetails] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [lostBooks, setLostBooks] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'ADMIN') navigate('/student')
  }, [user, navigate])

  const fetchLostBooks = async () => {
    setLoadingList(true)
    try {
      const response = await apiClient.get('/api/lost-books')
      setLostBooks(response.data || [])
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load lost book reports.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => { fetchLostBooks() }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const prefill = params.get('accessionNumber')
    if (prefill) {
      setAccessionNumber(prefill)
      void handleFind(prefill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleFind = async (explicitAccession) => {
    const target = (explicitAccession ?? accessionNumber).trim()
    if (!target) { setErrorMsg('Please enter an accession number.'); return }

    setLoadingDetails(true); setDetails(null); setErrorMsg(''); setSuccessMsg('')
    try {
      const response = await apiClient.get(`/api/lost-books/find/${encodeURIComponent(target)}`)
      setDetails(response.data)
      setAccessionNumber(target)
    } catch (err) {
      setErrorMsg(err.message || 'No active approved borrow found for this accession number.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleMarkLost = async (e) => {
    e.preventDefault()
    if (!details) { setErrorMsg('Find a borrowed copy first.'); return }
    if (!reason.trim()) { setErrorMsg('Reason is required.'); return }

    setSubmitting(true); setErrorMsg(''); setSuccessMsg('')
    try {
      await apiClient.post('/api/lost-books', {
        accessionNumber: details.accessionNumber,
        reason: reason.trim(),
        remarks: remarks.trim(),
        reportedByAdmin: user?.name || 'Admin'
      })
      setSuccessMsg('Book copy marked as LOST and removed from catalog inventory.')
      setReason(''); setRemarks(''); setDetails(null); setAccessionNumber('')
      await fetchLostBooks()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to mark this copy as lost.')
    } finally {
      setSubmitting(false)
    }
  }

  const sortedLostBooks = useMemo(() =>
    [...lostBooks].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()),
    [lostBooks]
  )

  const filteredLostBooks = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return sortedLostBooks
    return sortedLostBooks.filter(item =>
      (item.accessionNumber || '').toLowerCase().includes(q) ||
      (item.isbn || '').toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.studentName || '').toLowerCase().includes(q) ||
      (item.studentEmail || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    )
  }, [sortedLostBooks, searchQuery])

  const getExportRows = () => {
    const headers = [
      'Accession', 'ISBN', 'Title', 'Author',
      'Student Name', 'Student Email', 'Branch', 'Year',
      'Borrow Date', 'Due Date', 'Reason', 'Remarks', 'Price', 'Reported By', 'Reported At'
    ]
    const rows = filteredLostBooks.map(item => [
      item.accessionNumber || '',
      item.isbn || '',
      item.title || '',
      item.author || '',
      item.studentName || '',
      item.studentEmail || '',
      item.studentBranch || '',
      item.studentYear || '',
      item.borrowDate ? new Date(item.borrowDate).toLocaleDateString() : '',
      item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '',
      item.reason || '',
      item.remarks || '',
      item.price || '',
      item.reportedByAdmin || '',
      item.reportedAt ? new Date(item.reportedAt).toLocaleString() : ''
    ])
    return [headers, ...rows]
  }

  const handleExport = () => exportToCsv(getExportRows(), `lost_books_${Date.now()}.csv`)

  if (!user) return null

  const formatDt = (dt) => dt ? new Date(dt).toLocaleDateString() : 'N/A'
  const formatFull = (dt) => dt ? new Date(dt).toLocaleString() : 'N/A'

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
            {[
              { path: '/admin', icon: Library, label: 'Overview' },
              { path: '/lending', icon: ClipboardList, label: 'Borrow Requests' },
              { path: '/inventory', icon: BookOpen, label: 'Catalog Inventory' },
              { path: '/admin/gate-logs', icon: Clock, label: 'Gate Logs' },
              { path: '/returns', icon: Users, label: 'Return Station' },
              { path: '/admin/students', icon: UserCheck, label: 'Registered Students' },
              { path: '/admin/lost-books', icon: ShieldAlert, label: 'Lost Books', active: true },
              { path: '/admin/reservations', icon: BookMarked, label: 'Book Reservations' },
            ].map(({ path, icon: Icon, label, active }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-left transition ${active ? 'text-blue-600 bg-blue-50/50' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="size-4.5" />
                {label}
              </button>
            ))}
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
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Lost Books</h1>
              <p className="text-xs text-blue-200 mt-0.5">Report lost copies and review past records</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLostBooks}
                disabled={loadingList}
                className="flex items-center gap-1 rounded-xl border border-white/20 glass-panel px-3 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 transition disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={filteredLostBooks.length === 0}
                className="flex items-center gap-1 rounded-xl border border-white/20 glass-panel px-3 py-2 text-xs font-bold text-green-100 hover:bg-white/10 transition disabled:opacity-60"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Report Panel */}
          <section className="lg:col-span-2 rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Find Borrowed Copy</h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-blue-200" />
                <input
                  type="text"
                  placeholder="Enter accession number"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                  className="w-full rounded-xl border border-white/20 glass-input py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleFind()}
                disabled={loadingDetails}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-70"
              >
                {loadingDetails ? <Loader2 className="size-3.5 animate-spin" /> : 'Find'}
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-200 flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {details && (
              <form onSubmit={handleMarkLost} className="flex flex-col gap-4 rounded-xl border border-white/20 bg-white/5 p-4">
                {/* Book info */}
                <div>
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">📖 Book Information</p>
                  <div className="text-xs text-blue-100 flex flex-col gap-1.5">
                    <p><span className="text-blue-300">Title:</span> {details.title}</p>
                    <p><span className="text-blue-300">Author:</span> {details.author}</p>
                    <p><span className="text-blue-300">ISBN:</span> <span className="font-mono">{details.isbn}</span></p>
                    <p><span className="text-blue-300">Accession:</span> <span className="font-mono text-amber-300 font-bold">{details.accessionNumber}</span></p>
                    {details.bookBranch && <p><span className="text-blue-300">Branch:</span> {details.bookBranch}</p>}
                    {details.bookCategory && <p><span className="text-blue-300">Category:</span> {details.bookCategory}</p>}
                    {details.price != null && <p><span className="text-blue-300">Price:</span> ₹{details.price}</p>}
                  </div>
                </div>

                {/* Student info */}
                <div>
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">🎓 Student Information</p>
                  <div className="text-xs text-blue-100 flex flex-col gap-1.5">
                    <p><span className="text-blue-300">Name:</span> {details.studentName}</p>
                    <p><span className="text-blue-300">Email:</span> {details.studentEmail}</p>
                    <p><span className="text-blue-300">Branch / Year:</span> {details.studentBranch} / {details.studentYear}</p>
                  </div>
                </div>

                {/* Borrow info */}
                <div>
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">📅 Borrow Information</p>
                  <div className="text-xs text-blue-100 flex flex-col gap-1.5">
                    <p><span className="text-blue-300">Borrowed:</span> {formatFull(details.borrowDate)}</p>
                    <p><span className="text-blue-300">Due:</span> <span className={new Date(details.dueDate) < new Date() ? 'text-red-400 font-bold' : ''}>{formatFull(details.dueDate)}</span></p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase">Reason <span className="text-red-400">*</span></label>
                  <input
                    type="text" required value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Student reported book misplaced"
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase">Remarks</label>
                  <textarea
                    rows={2} value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional additional notes"
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="size-3.5 animate-spin" />Marking...</> : '⚠ Mark as Lost'}
                </button>
              </form>
            )}
          </section>

          {/* Records Table */}
          <section className="lg:col-span-3 rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Reported Lost Books
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-blue-200" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-44 rounded-xl border border-white/20 glass-input py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-xs text-blue-200 whitespace-nowrap">{filteredLostBooks.length} records</span>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/20 text-blue-200 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-3">Accession</th>
                    <th className="pb-3 pr-3">Title</th>
                    <th className="pb-3 pr-3">Student</th>
                    <th className="pb-3 pr-3">Borrow</th>
                    <th className="pb-3 pr-3">Reason</th>
                    <th className="pb-3 pr-3">Price</th>
                    <th className="pb-3">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="size-6 animate-spin text-blue-200 mx-auto" /></td></tr>
                  ) : filteredLostBooks.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-blue-200">No lost books reported yet.</td></tr>
                  ) : (
                    filteredLostBooks.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="py-3 pr-3 font-mono text-amber-300 font-bold whitespace-nowrap">{item.accessionNumber}</td>
                        <td className="py-3 pr-3 text-white font-semibold max-w-[120px] truncate">{item.title}</td>
                        <td className="py-3 pr-3">
                          <p className="text-blue-100 font-semibold">{item.studentName}</p>
                          <p className="text-[10px] text-blue-300">{item.studentBranch} / Yr {item.studentYear}</p>
                        </td>
                        <td className="py-3 pr-3 text-blue-200 whitespace-nowrap">{formatDt(item.borrowDate)}</td>
                        <td className="py-3 pr-3 text-blue-100 max-w-[100px] truncate" title={item.reason}>{item.reason}</td>
                        <td className="py-3 pr-3 text-green-300 font-semibold whitespace-nowrap">{item.price != null ? `₹${item.price}` : 'N/A'}</td>
                        <td className="py-3 text-blue-200 whitespace-nowrap">{formatFull(item.reportedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
