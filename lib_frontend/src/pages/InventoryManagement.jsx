import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Plus, Search, Library, Loader2, LogOut, ClipboardList, 
  Users, PlusCircle, MinusCircle, X 
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
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

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
        totalCopies
      })

      setShowAddModal(false)
      // Reset form
      setIsbn('')
      setTitle('')
      setAuthor('')
      setTotalCopies(5)

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

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/10">
              <BookOpen className="size-4.5" />
            </div>
            <span className="font-bold tracking-tight text-slate-800 text-base">
              Sanctuary Admin
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition"
            >
              <Library className="size-4.5" />
              Overview
            </button>
            <button
              onClick={() => navigate('/lending')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition"
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
              onClick={() => navigate('/returns')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition"
            >
              <Users className="size-4.5" />
              Return Station Kiosk
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Asset Catalog
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage digital register and copies stock</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Asset Info</th>
                    <th className="pb-3 font-semibold">Author</th>
                    <th className="pb-3 font-semibold">ISBN Code</th>
                    <th className="pb-3 font-semibold text-center">In Shelf Stock</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Quick Stock Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="size-6 animate-spin text-slate-400 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No book assets match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => {
                      const isOutOfStock = book.availableCopies < 1

                      return (
                        <tr key={book.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <BookOpen className="size-4.5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 truncate max-w-[220px]">{book.title}</p>
                                <p className="text-[10px] text-slate-400">ID: #{book.id}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 text-slate-600 font-medium">
                            {book.author}
                          </td>
                          
                          <td className="py-4 font-mono text-slate-500">
                            {book.isbn}
                          </td>
                          
                          <td className="py-4 text-center font-bold text-slate-700">
                            <span className={isOutOfStock ? 'text-red-500' : 'text-slate-800'}>
                              {book.availableCopies}
                            </span>
                            <span className="text-slate-400 font-medium"> / {book.totalCopies}</span>
                          </td>
                          
                          <td className="py-4">
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
                                className="flex size-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40"
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
          <div className="w-full max-w-sm rounded-2xl border border-white bg-white/95 p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Plus className="size-5 text-blue-600" />
                Register New Asset
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="mt-3 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleAddBookSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ISBN Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 978-0-123456-78-9"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Quantum Nature of Ethics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Author Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Julian S."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Copies</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
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
          </div>
        </div>
      )}
    </div>
  )
}
