import { useEffect, useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  AlertCircle, CheckCircle2, Loader2, Search, RefreshCw
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar.jsx';

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
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')

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
      setSuccessMsg('Book copy marked as LOST and removed from catalogue inventory.')
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
    return sortedLostBooks.filter(item => {
      const matchesSearch = !q ||
        (item.accessionNumber || '').toLowerCase().includes(q) ||
        (item.isbn || '').toLowerCase().includes(q) ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.author || '').toLowerCase().includes(q) ||
        (item.studentName || '').toLowerCase().includes(q) ||
        (item.studentEmail || '').toLowerCase().includes(q) ||
        (item.reason || '').toLowerCase().includes(q)
      
      const matchesUserType = userTypeFilter === 'ALL' || item.userRole === userTypeFilter
      return matchesSearch && matchesUserType
    })
  }, [sortedLostBooks, searchQuery, userTypeFilter])

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
  useEffect(() => {
    if (errorMsg) {
      setTimeout(() => {
        const el = document.querySelector('.bg-red-50, #error-message, .text-red-600')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [errorMsg])


  return (
    <div className="h-screen flex text-slate-900">
      {/* Sidebar */}
      <AdminSidebar user={user} logout={logout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Lost Books</h1>
              <p className="text-xs text-slate-500 mt-0.5">Report lost copies and review past records</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLostBooks}
                disabled={loadingList}
                className="flex items-center gap-1 rounded-xl border border-slate-200 glass-panel px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={filteredLostBooks.length === 0}
                className="flex items-center gap-1 rounded-xl border border-slate-200 glass-panel px-3 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 transition disabled:opacity-60"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Report Panel */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Find Borrowed Copy</h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter accession number"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                  className="w-full rounded-xl border border-slate-200 glass-input py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
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
              <div className="rounded-xl border border-red-500/30 bg-red-100 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-green-500/30 bg-green-100 p-3 text-xs text-green-700 flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {details && (
              <form onSubmit={handleMarkLost} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-100 p-4">
                {/* Book info */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📖 Book Information</p>
                  <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                    <p><span className="text-slate-400">Title:</span> {details.title}</p>
                    <p><span className="text-slate-400">Author:</span> {details.author}</p>
                    <p><span className="text-slate-400">ISBN:</span> <span className="font-mono">{details.isbn}</span></p>
                    <p><span className="text-slate-400">Accession:</span> <span className="font-mono text-amber-600 font-bold">{details.accessionNumber}</span></p>
                    {details.bookBranch && <p><span className="text-slate-400">Branch:</span> {details.bookBranch}</p>}
                    {details.bookCategory && <p><span className="text-slate-400">Category:</span> {details.bookCategory}</p>}
                    {details.price != null && <p><span className="text-slate-400">Price:</span> ₹{details.price}</p>}
                  </div>
                </div>

                {/* Student info */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🎓 Student Information</p>
                  <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                    <p><span className="text-slate-400">Name:</span> {details.studentName}</p>
                    <p><span className="text-slate-400">Email:</span> {details.studentEmail}</p>
                    <p><span className="text-slate-400">Branch / Year:</span> {details.studentBranch} / {details.studentYear}</p>
                  </div>
                </div>

                {/* Borrow info */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📅 Borrow Information</p>
                  <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                    <p><span className="text-slate-400">Borrowed:</span> {formatFull(details.borrowDate)}</p>
                    <p><span className="text-slate-400">Due:</span> <span className={new Date(details.dueDate) < new Date() ? 'text-red-600 font-bold' : ''}>{formatFull(details.dueDate)}</span></p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reason <span className="text-red-600">*</span></label>
                  <input
                    type="text" required value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Student reported book misplaced"
                    className="mt-1 w-full rounded-lg border border-slate-200 glass-input px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks</label>
                  <textarea
                    rows={2} value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional additional notes"
                    className="mt-1 w-full rounded-lg border border-slate-200 glass-input px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
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
          <section className="lg:col-span-3 rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Reported Lost Books
              </h3>
              <div className="flex items-center gap-2">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-44 rounded-xl border border-slate-200 glass-input py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{filteredLostBooks.length} records</span>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
                    <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="size-6 animate-spin text-slate-500 mx-auto" /></td></tr>
                  ) : filteredLostBooks.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">No lost books reported yet.</td></tr>
                  ) : (
                    filteredLostBooks.map((item) => (
                      <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="py-3 pr-3 font-mono text-amber-600 font-bold whitespace-nowrap">{item.accessionNumber}</td>
                        <td className="py-3 pr-3 text-slate-900 font-semibold max-w-[120px] truncate">{item.title}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-600 font-semibold">{item.studentName}</p>
                            {item.userRole === 'STAFF' && (
                              <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 tracking-wider">
                                STAFF
                              </span>
                            )}
                          </div>
                          {item.userRole !== 'STAFF' && (
                            <p className="text-[10px] text-slate-400">{item.studentBranch} / Yr {item.studentYear}</p>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">{formatDt(item.borrowDate)}</td>
                        <td className="py-3 pr-3 text-slate-600 max-w-[100px] truncate" title={item.reason}>{item.reason}</td>
                        <td className="py-3 pr-3 text-green-600 font-semibold whitespace-nowrap">{item.price != null ? `₹${item.price}` : 'N/A'}</td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">{formatFull(item.reportedAt)}</td>
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
