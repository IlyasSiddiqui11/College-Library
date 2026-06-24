import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { 
  BookOpen, Plus, Search, Library, Loader2, LogOut, ClipboardList, 
  Users, PlusCircle, MinusCircle, X, ScanLine, Camera, Clock,
  UserCheck, Download
} from 'lucide-react'

export default function InventoryManagement() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Add modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [totalCopies, setTotalCopies] = useState(5)
  const [publisher, setPublisher] = useState('')
  const [price, setPrice] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [accessionNumbers, setAccessionNumbers] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  
  // Scanner states
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef(null)

  const initScanner = () => {
    try {
      const scanner = new Html5Qrcode('modal-camera-scanner')
      scannerRef.current = scanner
      
      scanner.start(
        { facingMode: "environment" },
        {
          fps: 25,
          qrbox: (width, height) => {
            const widthRatio = width > 400 ? 0.7 : 0.85;
            const targetWidth = Math.floor(width * widthRatio);
            return {
              width: targetWidth,
              height: Math.floor(targetWidth * 0.5)
            };
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        (decodedText) => {
          setIsbn(decodedText.trim())
          stopScanning()
        },
        () => {}
      ).catch(err => {
        console.error('Failed to start scanner:', err)
        setErrorMsg('Camera access is restricted or unavailable.')
        setIsScanning(false)
      })
    } catch (err) {
      console.error('Failed to create html5-qrcode:', err)
      setErrorMsg('Camera initialization failed.')
      setIsScanning(false)
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setErrorMsg(null)
    setTimeout(() => {
      initScanner()
    }, 100)
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) scannerRef.current.clear()
        }).catch(() => {
          if (scannerRef.current) scannerRef.current.clear()
        })
      } catch (err) {
        console.warn('Scanner stop warning:', err)
      }
    }
    setIsScanning(false)
  }

  const closeModal = () => {
    stopScanning()
    setShowAddModal(false)
    setIsbn('')
    setTitle('')
    setAuthor('')
    setTotalCopies(5)
    setPublisher('')
    setPrice('')
    setPublicationYear('')
    setAccessionNumbers('')
    setErrorMsg(null)
  }

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/api/books')
      setBooks(response.data)
    } catch (err) {
      console.error('Failed to load books catalog:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [user])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch (e) {}
      }
    }
  }, [])

  // Handle Add Book Submission
  const handleAddBookSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSaving(true)

    try {
      if (!isbn.trim()) throw new Error('ISBN is required')
      if (!title.trim()) throw new Error('Book title is required')
      if (!author.trim()) throw new Error('Author is required')
      if (totalCopies < 1) throw new Error('Total copies must be at least 1')

      await apiClient.post('/api/books', {
        isbn,
        title,
        author,
        totalCopies,
        publisher,
        price: price ? parseFloat(price) : null,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : null
      })

      setShowAddModal(false)
      // Reset form
      setIsbn('')
      setTitle('')
      setAuthor('')
      setTotalCopies(5)
      setPublisher('')
      setPrice('')
      setPublicationYear('')

      // Refresh list
      fetchBooks()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register new book asset')
    } finally {
      setSaving(false)
    }
  }

  // Handle Update Inventory Inline
  const handleUpdateCopies = async (id, currentCopies, delta) => {
    const newCopies = currentCopies + delta
    if (newCopies < 1) return // Safeguard
    try {
      await apiClient.put(`/api/books/${id}/inventory`, null, {
        params: { totalCopies: newCopies }
      })
      // Refresh list
      fetchBooks()
    } catch (err) {
      alert('Error updating inventory stock: ' + err.message)
    }
  }

  if (!user) return null

  // Filter books list
  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase()
    return (
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q) ||
      book.isbn?.toLowerCase().includes(q)
    )
  })

  const handleExport = () => {
    const headers = ['ID', 'Title', 'Author', 'ISBN', 'Publisher', 'Price', 'Publication Year', 'Available Copies', 'Total Copies']
    const csvRows = [
      headers.join(','),
      ...filteredBooks.map(book => [
        `"${book.id}"`,
        `"${(book.title || '').replace(/"/g, '""')}"`,
        `"${(book.author || '').replace(/"/g, '""')}"`,
        `"${book.isbn || ''}"`,
        `"${(book.publisher || '').replace(/"/g, '""')}"`,
        `"${book.price || ''}"`,
        `"${book.publicationYear || ''}"`,
        `"${book.availableCopies}"`,
        `"${book.totalCopies}"`
      ].join(','))
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `catalog_inventory_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen flex text-white">
      {/* Sidebar Navigation */}
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <UserCheck className="size-4.5" />
              Registered Students
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between rounded-xl glass-panel p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-blue-200 font-medium">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-blue-200 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Asset Catalog
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">Manage digital register and copies stock</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || filteredBooks.length === 0}
                className="flex items-center gap-1 rounded-xl border border-white/20 glass-panel px-4 py-2 text-xs font-bold text-green-100 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 rounded-xl border border-white/20 glass-input py-2 pl-9 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-indigo-500 focus:glass-panel transition"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition"
              >
                <Plus className="size-3.5" />
                Add Asset
              </button>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          <div className="rounded-2xl border border-white/20 glass-panel p-6 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/20 text-blue-200 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4 font-semibold">Asset Info</th>
                    <th className="pb-3 pr-4 font-semibold">Author</th>
                    <th className="pb-3 pr-4 font-semibold">ISBN Code</th>
                    <th className="pb-3 pr-4 font-semibold">Publisher</th>
                    <th className="pb-3 pr-4 font-semibold">Price</th>
                    <th className="pb-3 pr-4 font-semibold">Year</th>
                    <th className="pb-3 pr-4 font-semibold text-center">In Shelf Stock</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Quick Stock Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <Loader2 className="size-6 animate-spin text-blue-200 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-blue-200 font-medium">
                        No book assets match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => {
                      const isOutOfStock = book.availableCopies < 1

                      return (
                        <tr key={book.id} className="border-b border-slate-50 hover:bg-white/10 transition">
                          <td className="py-4 font-bold text-white">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <BookOpen className="size-4.5" />
                              </div>
                              <div>
                                <p className="font-bold text-white truncate max-w-[220px]">{book.title}</p>
                                <p className="text-[10px] text-blue-200">ID: #{book.id}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 pr-4 text-blue-100 font-medium">
                            {book.author}
                          </td>
                          
                          <td className="py-4 pr-4 font-mono text-blue-200">
                            {book.isbn}
                          </td>

                          <td className="py-4 pr-4 text-blue-100">
                            {book.publisher || <span className="text-white/30">—</span>}
                          </td>

                          <td className="py-4 pr-4 text-blue-100">
                            {book.price != null ? `₹${book.price}` : <span className="text-white/30">—</span>}
                          </td>

                          <td className="py-4 pr-4 text-blue-100">
                            {book.publicationYear || <span className="text-white/30">—</span>}
                          </td>
                          
                          <td className="py-4 pr-4 text-center font-bold text-white">
                            <span className={isOutOfStock ? 'text-red-500' : 'text-white'}>
                              {book.availableCopies}
                            </span>
                            <span className="text-blue-200 font-medium"> / {book.totalCopies}</span>
                          </td>
                          
                          <td className="py-4 pr-4">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-[9px] border border-red-200/40">
                                OUT OF STOCK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold text-[9px] border border-green-200/40">
                                IN STOCK
                              </span>
                            )}
                          </td>

                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateCopies(book.id, book.totalCopies, 1)}
                                className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                title="Add Stock Copy"
                              >
                                <PlusCircle className="size-4" />
                              </button>
                              <button
                                disabled={book.totalCopies <= 1}
                                onClick={() => handleUpdateCopies(book.id, book.totalCopies, -1)}
                                className="flex size-7 items-center justify-center rounded-lg glass-panel text-blue-200 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                                title="Reduce Stock Copy"
                              >
                                <MinusCircle className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 glass-panel p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="size-5 text-blue-600" />
                Register New Asset
              </h3>
              <button 
                type="button" 
                onClick={closeModal}
                className="text-blue-200 hover:text-blue-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="mt-3 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            {isScanning ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="relative w-full aspect-square max-w-[240px] rounded-xl overflow-hidden border bg-black flex items-center justify-center">
                  <div id="modal-camera-scanner" className="w-full h-full text-white" />
                </div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                  Align Book Barcode inside the box
                </p>
                <button
                  type="button"
                  onClick={stopScanning}
                  className="rounded-xl border border-white/20 glass-panel px-4 py-2 text-xs font-semibold text-blue-100 hover:bg-white/10 transition"
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddBookSubmit} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">ISBN Code (Unique)</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 978-0-123456-78-9"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="flex-1 rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={startScanning}
                      className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 transition border border-blue-100"
                      title="Scan ISBN with Camera"
                    >
                      <ScanLine className="size-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Book Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Quantum Nature of Ethics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Author Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Julian S."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. Oxford University Press"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 725.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Publication Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2008"
                      value={publicationYear}
                      onChange={(e) => setPublicationYear(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>


                <div>
                  <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Total Copies</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Registering Asset...
                    </>
                  ) : (
                    'Register Book'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
