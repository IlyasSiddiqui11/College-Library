import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  Plus, Search, Loader2, Download, RefreshCw, ChevronLeft, ChevronRight, PencilLine
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect.jsx'
import AddAssetModal from '../components/AddAssetModal.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx';

const PAGE_SIZE = 25

export default function InventoryManagement() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)

  // Add modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  // Filters
  const [filterBranch, setFilterBranch] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterAuthor, setFilterAuthor] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Redirect if not admin
  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'ADMIN') navigate('/student')
  }, [user, navigate])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/api/books')
      setBooks(response.data)
      setPage(0)
    } catch (err) {
      console.error('Failed to load books:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [user])

  const closeModal = () => {
    setShowAddModal(false)
    setEditingBook(null)
  }

  const openAddModal = () => {
    setEditingBook(null)
    setShowAddModal(true)
  }

  const openEditModal = (book) => {
    setEditingBook(book)
    setShowAddModal(true)
  }

  const handleDeleteCopy = async (id, accession) => {
    if (!window.confirm(`Delete copy with Accession Number: ${accession}?`)) return
    try {
      await apiClient.delete(`/api/books/${id}`)
      fetchBooks()
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  if (!user) return null

  // Filter options
  const branches = ['ALL', ...new Set(books.map(b => b.branch).filter(Boolean))]
  const categories = ['ALL', ...new Set(books.map(b => b.category).filter(Boolean))]
  const authors = ['ALL', ...new Set(books.map(b => b.author).filter(Boolean))]

  // Full search and filter
  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      (book.accessionNumber || '').toLowerCase().includes(q) ||
      (book.isbn || '').toLowerCase().includes(q) ||
      (book.title || '').toLowerCase().includes(q) ||
      (book.author || '').toLowerCase().includes(q) ||
      (book.publisher || '').toLowerCase().includes(q) ||
      (book.branch || '').toLowerCase().includes(q) ||
      (book.category || '').toLowerCase().includes(q) ||
      (book.status || '').toLowerCase().includes(q)

    const matchesBranch = filterBranch === 'ALL' || book.branch === filterBranch
    const matchesCategory = filterCategory === 'ALL' || book.category === filterCategory
    const matchesAuthor = filterAuthor === 'ALL' || book.author === filterAuthor
    const matchesStatus = filterStatus === 'ALL' || book.status === filterStatus
    return matchesSearch && matchesBranch && matchesCategory && matchesAuthor && matchesStatus
  })

  // Pagination
  const pageCount = Math.ceil(filteredBooks.length / PAGE_SIZE)
  const paginatedBooks = filteredBooks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleExport = () => {
    const headers = ['ID', 'Accession Number', 'ISBN', 'Title', 'Author', 'Publisher', 'Publication Year', 'Edition', 'Series',
      'Total Pages', 'Classification Number', 'Price', 'Source', 'Bill Number', 'Bill Date', 'Branch', 'Category', 'Language', 'Status', 'Created At', 'Updated At']
    const csvRows = [
      headers.join(','),
      ...filteredBooks.map(book => [
        `"${book.id || ''}"`,
        `"${book.accessionNumber || ''}"`,
        `"${book.isbn || ''}"`,
        `"${(book.title || '').replace(/"/g, '""')}"`,
        `"${(book.author || '').replace(/"/g, '""')}"`,
        `"${(book.publisher || '').replace(/"/g, '""')}"`,
        `"${book.publicationYear || ''}"`,
        `"${(book.edition || '').replace(/"/g, '""')}"`,
        `"${(book.series || '').replace(/"/g, '""')}"`,
        `"${book.totalPages || ''}"`,
        `"${(book.classificationNumber || '').replace(/"/g, '""')}"`,
        `"${book.price || ''}"`,
        `"${(book.source || '').replace(/"/g, '""')}"`,
        `"${book.billNumber || ''}"`,
        `"${book.billDate || ''}"`,
        `"${book.branch || ''}"`,
        `"${book.category || ''}"`,
        `"${book.language || ''}"`,
        `"${book.status || ''}"`,
        `"${book.createdAt || ''}"`,
        `"${book.updatedAt || ''}"`
      ].join(','))
    ]
    const csv = 'data:text/csv;charset=utf-8,' + csvRows.join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `catalog_inventory_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen flex text-slate-900">
      {/* Sidebar */}
      <AdminSidebar user={user} logout={logout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-300 glass-panel px-6 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Catalogue Inventory</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage all physical book copies</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search accession, ISBN, title, author, publisher..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                  className="w-72 rounded-xl border border-slate-300 glass-input py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition"
                />
              </div>
              <button
                onClick={fetchBooks}
                disabled={loading}
                className="flex items-center gap-1 rounded-xl border border-slate-300 glass-panel px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-60"
                title="Refresh"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={loading || filteredBooks.length === 0}
                className="flex items-center gap-1 rounded-xl border border-slate-300 glass-panel px-3 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 transition disabled:opacity-60"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Plus className="size-3.5" />
                Add Asset
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 flex flex-col gap-4">
          {/* Filters */}
          <div className="rounded-xl border border-slate-300 glass-panel p-4 flex flex-wrap gap-4 items-end">
            {[
              { label: 'Branch', value: filterBranch, setter: setFilterBranch, options: branches },
              { label: 'Category', value: filterCategory, setter: setFilterCategory, options: categories },
              { label: 'Author', value: filterAuthor, setter: setFilterAuthor, options: authors },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className="flex flex-col gap-1.5 min-w-[120px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
                <CustomSelect
                  value={value}
                  onChange={(val) => { setter(val); setPage(0) }}
                  options={options}
                  className="w-full"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <CustomSelect
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(0) }}
                options={[
                  { value: 'ALL', label: 'ALL' },
                  { value: 'AVAILABLE', label: 'AVAILABLE' },
                  { value: 'BORROWED', label: 'BORROWED' },
                  { value: 'LOST', label: 'LOST' },
                  { value: 'REPLACED', label: 'REPLACED' }
                ]}
                className="w-full"
              />
            </div>
            <div className="ml-auto text-xs text-slate-500 font-medium self-end pb-1">
              {filteredBooks.length} of {books.length} copies
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-300 glass-panel shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider bg-slate-100">
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Accession No.</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">ISBN</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Title</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Author</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Publisher</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Pub. Year</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Edition</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Series</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Pages</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Class. No.</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Price</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Source</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Bill No.</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Bill Date</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Branch</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Category</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Language</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">Status</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Created At</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Updated At</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={19} className="py-10 text-center"><Loader2 className="size-6 animate-spin text-slate-500 mx-auto" /></td></tr>
                  ) : paginatedBooks.length === 0 ? (
                    <tr><td colSpan={19} className="py-10 text-center text-slate-500 font-medium">No book copies match your filters.</td></tr>
                  ) : (
                    paginatedBooks.map((book) => {
                      const isBorrowed = book.status === 'BORROWED'
                      const isLost = book.status === 'LOST'
                      const isReplaced = book.status === 'REPLACED'
                      const formatDt = (dt) => dt ? new Date(dt).toLocaleDateString() : '—'

                      return (
                        <tr key={book.id} className="border-b border-slate-300 hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-bold text-amber-600 font-mono whitespace-nowrap">{book.accessionNumber}</td>
                          <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{book.isbn}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 max-w-[160px] truncate">{book.title}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{book.author || '—'}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{book.publisher || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.publicationYear || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.edition || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.series || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.totalPages || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.classificationNumber || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.price != null ? `₹${book.price}` : '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.source || '—'}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{book.billNumber || '—'}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{book.billDate || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.branch || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.category || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{book.language || '—'}</td>
                          <td className="py-3 px-3 text-center">
                            {isLost ? (
                              <span className="w-20 inline-block text-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[9px] border border-red-200 whitespace-nowrap">LOST</span>
                            ) : isReplaced ? (
                              <span className="w-20 inline-block text-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold text-[9px] border border-blue-200 whitespace-nowrap">REPLACED</span>
                            ) : isBorrowed ? (
                              <span className="w-20 inline-block text-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-bold text-[9px] border border-indigo-200 whitespace-nowrap">BORROWED</span>
                            ) : (
                              <span className="w-20 inline-block text-center px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold text-[9px] border border-green-200 whitespace-nowrap">AVAILABLE</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDt(book.createdAt)}</td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDt(book.updatedAt)}</td>
                          <td className="py-3 px-3 text-right">
                            {isBorrowed ? (
                              <button
                                onClick={() => navigate(`/admin/lost-books?accessionNumber=${encodeURIComponent(book.accessionNumber)}`)}
                                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition whitespace-nowrap"
                              >
                                Report Lost
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {!isReplaced && (
                                  <button
                                    onClick={() => openEditModal(book)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                                    title="Edit Copy"
                                  >
                                    <PencilLine className="size-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="border-t border-slate-300 px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {page + 1} of {pageCount} &nbsp;•&nbsp; {filteredBooks.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={closeModal}
        onSuccess={() => { closeModal(); fetchBooks(); }}
        editingBook={editingBook}
      />
    </div>
  )
}
