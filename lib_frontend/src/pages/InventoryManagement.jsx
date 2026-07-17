import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  BookOpen, Plus, Search, Library, Loader2, LogOut, ClipboardList,
  Users, X, ScanLine, Clock, ShieldAlert,
  UserCheck, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight, PencilLine
} from 'lucide-react'

const PAGE_SIZE = 25

export default function InventoryManagement() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  // Add modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [accessionNumbersList, setAccessionNumbersList] = useState([''])
  const [publisher, setPublisher] = useState('')
  const [edition, setEdition] = useState('')
  const [series, setSeries] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [price, setPrice] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState('')
  const [branch, setBranch] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Filters
  const [filterBranch, setFilterBranch] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterAuthor, setFilterAuthor] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const [editingBook, setEditingBook] = useState(null)

  // Scanner
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef(null)

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

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}) } catch (e) {}
      }
    }
  }, [])

  // Scanner logic
  const initScanner = () => {
    try {
      const scanner = new Html5Qrcode('modal-camera-scanner')
      scannerRef.current = scanner
      scanner.start(
        { facingMode: 'environment' },
        {
          fps: 25,
          qrbox: (w) => ({ width: Math.floor(w * 0.7), height: Math.floor(w * 0.35) }),
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        (decodedText) => { setIsbn(decodedText.trim()); stopScanning() },
        () => {}
      ).catch(() => { setErrorMsg('Camera unavailable.'); setIsScanning(false) })
    } catch {
      setErrorMsg('Camera init failed.'); setIsScanning(false)
    }
  }

  const startScanning = () => {
    setIsScanning(true); setErrorMsg(null)
    setTimeout(initScanner, 100)
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => { if (scannerRef.current) scannerRef.current.clear() }).catch(() => { if (scannerRef.current) scannerRef.current.clear() })
      } catch {}
    }
    setIsScanning(false)
  }

  const closeModal = () => {
    stopScanning()
    setShowAddModal(false)
    setEditingBook(null)
    setIsbn(''); setTitle(''); setAuthor(''); setPublisher(''); setEdition('')
    setSeries(''); setPublicationYear(''); setTotalPages(''); setPrice('')
    setBillNumber(''); setBillDate(''); setBranch(''); setCategory(''); setLanguage('')
    setQuantity(1); setAccessionNumbersList(['']); setErrorMsg(null)
  }

  const openAddModal = () => {
    setEditingBook(null)
    setShowAddModal(true)
  }

  const openEditModal = (book) => {
    setEditingBook(book)
    setIsbn(book.isbn || '')
    setTitle(book.title || '')
    setAuthor(book.author || '')
    setPublisher(book.publisher || '')
    setEdition(book.edition || '')
    setSeries(book.series || '')
    setPublicationYear(book.publicationYear || '')
    setTotalPages(book.totalPages || '')
    setPrice(book.price ?? '')
    setBillNumber(book.billNumber || '')
    setBillDate(book.billDate || '')
    setBranch(book.branch || '')
    setCategory(book.category || '')
    setLanguage(book.language || '')
    setQuantity(1)
    setAccessionNumbersList([book.accessionNumber || ''])
    setErrorMsg(null)
    setShowAddModal(true)
  }

  const handleQuantityChange = (e) => {
    const val = Math.max(1, Number(e.target.value))
    setQuantity(val)
    setAccessionNumbersList(prev => {
      const next = [...prev]
      while (next.length < val) next.push('')
      while (next.length > val) next.pop()
      return next
    })
  }

  const handleAddBookSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSaving(true)
    try {
      if (!isbn.trim()) throw new Error('ISBN is required')
      if (!title.trim()) throw new Error('Book title is required')
      if (!author.trim()) throw new Error('Author is required')

      if (editingBook) {
        const accessionNumber = (accessionNumbersList[0] || '').trim()
        if (!accessionNumber) throw new Error('Accession number is required')

        await apiClient.put(`/api/books/${editingBook.id}`, {
          isbn: isbn.trim(), title: title.trim(), author: author.trim(),
          quantity: 1, accessionNumbers: [accessionNumber],
          publisher: publisher.trim(), edition: edition.trim(), series: series.trim(),
          publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
          totalPages: totalPages ? parseInt(totalPages, 10) : null,
          price: price ? parseFloat(price) : null,
          billNumber: billNumber.trim(),
          billDate: billDate || null,
          branch: branch.trim(), category: category.trim(), language: language.trim()
        })
      } else {
        const filledAccessions = accessionNumbersList.map(a => a.trim()).filter(Boolean)
        if (filledAccessions.length !== quantity) throw new Error('Enter accession numbers for all copies')

        await apiClient.post('/api/books', {
          isbn: isbn.trim(), title: title.trim(), author: author.trim(),
          quantity, accessionNumbers: filledAccessions,
          publisher: publisher.trim(), edition: edition.trim(), series: series.trim(),
          publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
          totalPages: totalPages ? parseInt(totalPages, 10) : null,
          price: price ? parseFloat(price) : null,
          billNumber: billNumber.trim(),
          billDate: billDate || null,
          branch: branch.trim(), category: category.trim(), language: language.trim()
        })
      }
      closeModal(); fetchBooks()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register book asset')
    } finally {
      setSaving(false)
    }
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
    const headers = ['ID', 'Accession Number', 'ISBN', 'Title', 'Author', 'Publisher', 'Edition', 'Series',
      'Publication Year', 'Total Pages', 'Price', 'Bill Number', 'Bill Date', 'Branch', 'Category', 'Language', 'Status', 'Created At', 'Updated At']
    const csvRows = [
      headers.join(','),
      ...filteredBooks.map(book => [
        `"${book.id || ''}"`,
        `"${book.accessionNumber || ''}"`,
        `"${book.isbn || ''}"`,
        `"${(book.title || '').replace(/"/g, '""')}"`,
        `"${(book.author || '').replace(/"/g, '""')}"`,
        `"${(book.publisher || '').replace(/"/g, '""')}"`,
        `"${(book.edition || '').replace(/"/g, '""')}"`,
        `"${(book.series || '').replace(/"/g, '""')}"`,
        `"${book.publicationYear || ''}"`,
        `"${book.totalPages || ''}"`,
        `"${book.price || ''}"`,
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
              { path: '/inventory', icon: BookOpen, label: 'Catalog Inventory', active: true },
              { path: '/admin/gate-logs', icon: Clock, label: 'Gate Logs' },
              { path: '/returns', icon: Users, label: 'Return Station' },
              { path: '/admin/students', icon: UserCheck, label: 'Registered Students' },
              { path: '/admin/lost-books', icon: ShieldAlert, label: 'Lost Books' },
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
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-6 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Catalog Inventory</h1>
              <p className="text-xs text-blue-200 mt-0.5">Manage all physical book copies</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search accession, ISBN, title, author, publisher..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                  className="w-72 rounded-xl border border-white/20 glass-input py-2 pl-9 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-indigo-500 transition"
                />
              </div>
              <button
                onClick={fetchBooks}
                disabled={loading}
                className="flex items-center gap-1 rounded-xl border border-white/20 glass-panel px-3 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 transition disabled:opacity-60"
                title="Refresh"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={loading || filteredBooks.length === 0}
                className="flex items-center gap-1 rounded-xl border border-white/20 glass-panel px-3 py-2 text-xs font-bold text-green-100 hover:bg-white/10 transition disabled:opacity-60"
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
          <div className="rounded-xl border border-white/20 glass-panel p-4 flex flex-wrap gap-4 items-end">
            {[
              { label: 'Branch', value: filterBranch, setter: setFilterBranch, options: branches },
              { label: 'Category', value: filterCategory, setter: setFilterCategory, options: categories },
              { label: 'Author', value: filterAuthor, setter: setFilterAuthor, options: authors },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className="flex flex-col gap-1.5 min-w-[120px]">
                <label className="text-[10px] font-bold text-blue-200 uppercase">{label}</label>
                <select
                  value={value}
                  onChange={(e) => { setter(e.target.value); setPage(0) }}
                  className="rounded-lg border border-white/20 glass-input px-2.5 py-1.5 text-xs text-white bg-slate-900 outline-none focus:border-indigo-500"
                >
                  {options.map(o => <option key={o} value={o} className="bg-slate-900 text-white">{o}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-[10px] font-bold text-blue-200 uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
                className="rounded-lg border border-white/20 glass-input px-2.5 py-1.5 text-xs text-white bg-slate-900 outline-none focus:border-indigo-500"
              >
                <option value="ALL" className="bg-slate-900 text-white">ALL</option>
                <option value="AVAILABLE" className="bg-slate-900 text-white">AVAILABLE</option>
                <option value="BORROWED" className="bg-slate-900 text-white">BORROWED</option>
              </select>
            </div>
            <div className="ml-auto text-xs text-blue-200 font-medium self-end pb-1">
              {filteredBooks.length} of {books.length} copies
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/20 glass-panel shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/20 text-blue-200 uppercase tracking-wider bg-white/5">
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Accession No.</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">ISBN</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Title</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Author</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Publisher</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Edition</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Series</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Pub. Year</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Pages</th>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">Price</th>
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
                    <tr><td colSpan={19} className="py-10 text-center"><Loader2 className="size-6 animate-spin text-blue-200 mx-auto" /></td></tr>
                  ) : paginatedBooks.length === 0 ? (
                    <tr><td colSpan={19} className="py-10 text-center text-blue-200 font-medium">No book copies match your filters.</td></tr>
                  ) : (
                    paginatedBooks.map((book) => {
                      const isBorrowed = book.status === 'BORROWED'
                      const formatDt = (dt) => dt ? new Date(dt).toLocaleDateString() : '—'

                      return (
                        <tr key={book.id} className="border-b border-white/10 hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-bold text-amber-300 font-mono whitespace-nowrap">{book.accessionNumber}</td>
                          <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">{book.isbn}</td>
                          <td className="py-3 px-3 font-semibold text-white max-w-[160px] truncate">{book.title}</td>
                          <td className="py-3 px-3 text-blue-100 whitespace-nowrap">{book.author || '—'}</td>
                          <td className="py-3 px-3 text-blue-100 whitespace-nowrap">{book.publisher || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.edition || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.series || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.publicationYear || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.totalPages || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.price != null ? `₹${book.price}` : '—'}</td>
                          <td className="py-3 px-3 text-blue-100 whitespace-nowrap">{book.billNumber || '—'}</td>
                          <td className="py-3 px-3 text-blue-100 whitespace-nowrap">{book.billDate || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.branch || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.category || '—'}</td>
                          <td className="py-3 px-3 text-blue-100">{book.language || '—'}</td>
                          <td className="py-3 px-3 text-center">
                            {isBorrowed ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold text-[9px] border border-blue-500/20 whitespace-nowrap">BORROWED</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold text-[9px] border border-green-500/20 whitespace-nowrap">AVAILABLE</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-blue-200 whitespace-nowrap">{formatDt(book.createdAt)}</td>
                          <td className="py-3 px-3 text-blue-200 whitespace-nowrap">{formatDt(book.updatedAt)}</td>
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
                                <button
                                  onClick={() => openEditModal(book)}
                                  className="p-1 rounded text-blue-300 hover:text-blue-100 hover:bg-white/10 transition"
                                  title="Edit Copy"
                                >
                                  <PencilLine className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCopy(book.id, book.accessionNumber)}
                                  className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-white/10 transition"
                                  title="Delete Copy"
                                >
                                  <Trash2 className="size-4" />
                                </button>
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
              <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-blue-200">
                  Page {page + 1} of {pageCount} &nbsp;•&nbsp; {filteredBooks.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-white/20 text-blue-200 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="p-1.5 rounded-lg border border-white/20 text-blue-200 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Asset Modal - Wide, Two Column */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl border border-white/20 glass-panel shadow-2xl animate-in fade-in duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-white/20">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {editingBook ? <PencilLine className="size-5 text-blue-500" /> : <Plus className="size-5 text-blue-500" />}
                  {editingBook ? 'Edit Book Copy' : 'Register New Asset Copies'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {editingBook ? 'Update this copy and keep the same accession number.' : 'Add one or more physical book copies to the catalog'}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
                <X className="size-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-8 mt-4 text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            {isScanning ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center px-8">
                <div className="relative w-full aspect-video max-w-xs rounded-xl overflow-hidden border bg-black">
                  <div id="modal-camera-scanner" className="w-full h-full" />
                </div>
                <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Align book barcode inside the frame</p>
                <button type="button" onClick={stopScanning} className="rounded-xl border border-white/20 glass-panel px-5 py-2 text-xs font-semibold text-blue-100 hover:bg-white/10 transition">
                  Cancel Scan
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddBookSubmit} className="px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="flex flex-col gap-5">
                    {/* Book Details Group */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-b border-white/10 pb-2">📚 Book Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-blue-200 uppercase">ISBN <span className="text-red-400">*</span></label>
                          <div className="mt-1 flex gap-2">
                            <input
                              type="text" required placeholder="e.g. 9780123456789" value={isbn}
                              onChange={(e) => setIsbn(e.target.value)}
                              className="flex-1 rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <button type="button" onClick={startScanning}
                              className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50/10 px-3 text-blue-400 hover:bg-blue-50/20 transition border border-white/10"
                              title="Scan ISBN">
                              <ScanLine className="size-4" />
                            </button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Title <span className="text-red-400">*</span></label>
                          <input type="text" required placeholder="e.g. Introduction to Algorithms" value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Author <span className="text-red-400">*</span></label>
                          <input type="text" required placeholder="e.g. Thomas H. Cormen" value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Publisher</label>
                          <input type="text" placeholder="e.g. MIT Press" value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Edition</label>
                          <input type="text" placeholder="e.g. 4th Edition" value={edition}
                            onChange={(e) => setEdition(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Series</label>
                          <input type="text" placeholder="e.g. Vol 1" value={series}
                            onChange={(e) => setSeries(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Publication Year</label>
                          <input type="number" placeholder="e.g. 2022" value={publicationYear}
                            onChange={(e) => setPublicationYear(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Total Pages</label>
                          <input type="number" placeholder="e.g. 1312" value={totalPages}
                            onChange={(e) => setTotalPages(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Language</label>
                          <input type="text" placeholder="e.g. English" value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Purchase Details Group */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-b border-white/10 pb-2">🧾 Purchase Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Price (₹)</label>
                          <input type="number" step="0.01" placeholder="e.g. 799.00" value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Bill Number</label>
                          <input type="text" placeholder="e.g. BILL-2024" value={billNumber}
                            onChange={(e) => setBillNumber(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Bill Date</label>
                          <input type="date" value={billDate}
                            onChange={(e) => setBillDate(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-5">
                    {/* Library Details Group */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-b border-white/10 pb-2">🏛️ Library Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Branch</label>
                          <input type="text" placeholder="e.g. CSE" value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-blue-200 uppercase">Category</label>
                          <input type="text" placeholder="e.g. Reference" value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                        </div>
                        {!editingBook ? (
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-blue-200 uppercase">Quantity to Add <span className="text-red-400">*</span></label>
                            <input
                              type="number" required min={1} value={quantity}
                              onChange={handleQuantityChange}
                              className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold text-base"
                            />
                            <p className="text-[10px] text-blue-300 mt-1.5">Entering the quantity will generate accession number fields below.</p>
                          </div>
                        ) : (
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-blue-200 uppercase">Accession Number</label>
                            <input
                              type="text"
                              value={accessionNumbersList[0] || ''}
                              onChange={(e) => setAccessionNumbersList([e.target.value])}
                              className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                            />
                            <p className="text-[10px] text-blue-300 mt-1.5">The accession number is preserved while editing.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accession Numbers Group */}
                    {!editingBook && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-b border-white/10 pb-2">
                          🏷️ Accession Numbers ({quantity} {quantity === 1 ? 'copy' : 'copies'})
                        </h4>
                        <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
                          {accessionNumbersList.map((num, idx) => (
                            <div key={idx}>
                              <label className="text-[10px] font-bold text-blue-200 uppercase">Copy {idx + 1}</label>
                              <input
                                type="text"
                                required
                                placeholder={`e.g. ACC${String(idx + 1).padStart(4, '0')}`}
                                value={num}
                                onChange={(e) => {
                                  const next = [...accessionNumbersList]
                                  next[idx] = e.target.value
                                  setAccessionNumbersList(next)
                                }}
                                className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button type="button" onClick={closeModal}
                    className="rounded-xl border border-white/20 glass-panel px-6 py-2.5 text-xs font-semibold text-blue-100 hover:bg-white/10 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="rounded-xl bg-blue-600 px-8 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
                    {saving ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : editingBook ? 'Save Changes' : `Add ${quantity} ${quantity === 1 ? 'Copy' : 'Copies'}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
