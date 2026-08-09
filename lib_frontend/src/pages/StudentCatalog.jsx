import BottomNav from '../components/BottomNav.jsx';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Search, Library, Loader2, CheckCircle2, LogOut, AlertCircle, History, User, FileText
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect.jsx'

export default function StudentCatalog() {
  const { user, profile, staffProfile, hasFine, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [requestingIsbn, setRequestingIsbn] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [filterBranch, setFilterBranch] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterAuthor, setFilterAuthor] = useState('ALL')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate, authLoading])

  const homeRoute = user?.role === 'STAFF' ? '/staff' : '/student'
  const profileRoute = user?.role === 'STAFF' ? '/staff/profile' : '/student/profile'

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/books/catalog')
      setBooks(res.data)
    } catch (err) {
      console.error('Failed to fetch books:', err)
      setErrorMsg('Failed to load catalogue inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const isProfileComplete = user?.role === 'STAFF' ? staffProfile?.profileCompleted : !!profile;

  const handleRequestBorrow = async (isbn) => {
    if (!user || !isProfileComplete) {
      setErrorMsg('Please complete your profile from the Dashboard first to borrow books.')
      return
    }

    setRequestingIsbn(isbn)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await apiClient.post('/api/borrow/request', {
        userId: user.id,
        isbn: isbn
      })
      setSuccessMsg('Borrow request submitted! Wait for librarian approval.')
      await fetchBooks()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit borrow request')
    } finally {
      setRequestingIsbn(null)
      setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 5000)
    }
  }

  const handleReserveBook = async (isbn) => {
    if (!user || !isProfileComplete) {
      setErrorMsg('Please complete your profile from the Dashboard first to reserve books.')
      return
    }

    setRequestingIsbn(isbn)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await apiClient.post('/api/reservations', {
        userId: user.id,
        isbn: isbn
      })
      setSuccessMsg('Book reserved successfully! You will be notified when it becomes available.')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reserve book')
    } finally {
      setRequestingIsbn(null)
      setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 5000)
    }
  }

  if (!user) return null

  const branches = ['ALL', ...new Set(books.map(b => b.branch).filter(Boolean))]
  const categories = ['ALL', ...new Set(books.map(b => b.category).filter(Boolean))]
  const authors = ['ALL', ...new Set(books.map(b => b.author).filter(Boolean))]

  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (book.title || '').toLowerCase().includes(q) ||
      (book.author || '').toLowerCase().includes(q) ||
      (book.isbn || '').includes(q) ||
      (book.branch || '').toLowerCase().includes(q) ||
      (book.category || '').toLowerCase().includes(q) ||
      (book.edition || '').toLowerCase().includes(q)

    const matchesBranch = filterBranch === 'ALL' || book.branch === filterBranch
    const matchesCategory = filterCategory === 'ALL' || book.category === filterCategory
    const matchesAuthor = filterAuthor === 'ALL' || book.author === filterAuthor
    const matchesTitle = !filterTitle.trim() || (book.title || '').toLowerCase().includes(filterTitle.toLowerCase())
    const isAvailable = book.availability === 'Available'
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'AVAILABLE' && isAvailable) ||
      (filterStatus === 'BORROWED' && !isAvailable)

    return matchesSearch && matchesBranch && matchesCategory && matchesAuthor && matchesTitle && matchesStatus
  })
  useEffect(() => {
    if (errorMsg) {
      setTimeout(() => {
        const el = document.querySelector('.bg-red-50, #error-message, .text-red-600')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [errorMsg])


  return (
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32">
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Smart Library" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="text-xl font-bold tracking-tight text-slate-900">Smart Library</span>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="flex size-9 items-center justify-center rounded-full glass-panel text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        <section className="flex flex-col gap-3 glass-panel p-5 rounded-2xl border border-slate-200 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Library className="size-6 text-blue-600" />
            Library Catalogue
          </h1>
          <p className="text-xs text-slate-500">Browse book titles and request a copy from the library.</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, author, isbn, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 glass-input py-3 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Branch</label>
              <CustomSelect
                value={filterBranch}
                onChange={(val) => setFilterBranch(val)}
                options={branches}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Category</label>
              <CustomSelect
                value={filterCategory}
                onChange={(val) => setFilterCategory(val)}
                options={categories}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Author</label>
              <CustomSelect
                value={filterAuthor}
                onChange={(val) => setFilterAuthor(val)}
                options={authors}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Title</label>
              <input
                type="text"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                placeholder="Filter by title"
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Availability</label>
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: 'ALL', label: 'ALL' },
                  { value: 'AVAILABLE', label: 'Available' },
                  { value: 'BORROWED', label: 'Unavailable' }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-100 px-3 py-2.5">
            <span className="shrink-0 text-base">📋</span>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-600">Rules:</span> Max <span className="font-bold text-slate-900">{user?.role === 'STAFF' ? '4 books' : '2 books'}</span> active &nbsp;•&nbsp; Duration: <span className="font-bold text-slate-900">{user?.role === 'STAFF' ? 'No limit' : '7 days'}</span> &nbsp;•&nbsp; Max <span className="font-bold text-slate-900">2 reservations</span>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/50 bg-red-100 p-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <AlertCircle className="size-4 text-red-600 shrink-0" />
            <p className="text-xs font-medium text-red-700">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-green-500/50 bg-green-100 p-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="size-4 text-green-600 shrink-0" />
            <p className="text-xs font-medium text-green-700">{successMsg}</p>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Catalogue</h2>
            <span className="text-xs font-semibold text-slate-500">{filteredBooks.length} Titles</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 mt-3 font-medium">Loading catalogue...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-12 text-center">
              <BookOpen className="size-8 text-blue-200/50 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">No books found</p>
              <p className="text-xs text-slate-500 mt-1">Try different filters or search terms</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredBooks.map((book) => {
                const isAvailable = book.availability === 'Available'
                const isLost = book.availability === 'Lost'

                return (
                  <div
                    key={book.isbn}
                    className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl backdrop-blur-md flex flex-col gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/catalog/${encodeURIComponent(book.isbn)}`)}
                      className="flex gap-4 text-left w-full"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 border border-blue-200">
                        <BookOpen className="size-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
                          {book.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {book.author || 'Unknown Author'}
                        </p>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-slate-600">
                          <div>
                            <span className="text-slate-400 font-semibold">ISBN:</span>{' '}
                            <span className="font-mono">{book.isbn}</span>
                          </div>
                          {book.edition && (
                            <div>
                              <span className="text-slate-400 font-semibold">Edition:</span>{' '}
                              <span>{book.edition}</span>
                            </div>
                          )}
                          {book.branch && (
                            <div>
                              <span className="text-slate-400 font-semibold">Branch:</span>{' '}
                              <span>{book.branch}</span>
                            </div>
                          )}
                          {book.category && (
                            <div>
                              <span className="text-slate-400 font-semibold">Category:</span>{' '}
                              <span>{book.category}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center gap-3 text-[10px] font-bold">
                          {isAvailable ? (
                            <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-md border border-green-400/20">
                              Available
                            </span>
                          ) : isLost ? (
                            <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-400/20">
                              Lost
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => isAvailable ? handleRequestBorrow(book.isbn) : handleReserveBook(book.isbn)}
                      disabled={requestingIsbn === book.isbn || isLost}
                      className={`w-full rounded-xl py-3 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                        isAvailable
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 disabled:opacity-50'
                          : isLost
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20 disabled:opacity-50'
                      }`}
                    >
                      {requestingIsbn === book.isbn ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Processing...
                        </>
                      ) : isAvailable ? (
                        'Request to Borrow'
                      ) : isLost ? (
                        'Book Lost'
                      ) : (
                        'Reserve Book'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
