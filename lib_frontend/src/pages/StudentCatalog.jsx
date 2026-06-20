import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Search, Library, Loader2, CheckCircle2, ChevronLeft, LogOut, AlertCircle, History, User, FileText
} from 'lucide-react'

export default function StudentCatalog() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [requestingIsbn, setRequestingIsbn] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/books')
      setBooks(res.data)
    } catch (err) {
      console.error('Failed to fetch books:', err)
      setErrorMsg('Failed to load catalog inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleRequestBorrow = async (isbn) => {
    if (!user || !profile) {
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
      await fetchBooks() // Refresh inventory counts
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

  if (!user) return null

  // Filter books
  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase()
    return (
      (book.title?.toLowerCase() || '').includes(q) ||
      (book.author?.toLowerCase() || '').includes(q) ||
      (book.isbn || '').includes(q)
    )
  })

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white pb-32">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
            <span className="text-xl font-bold tracking-tight text-white">
              BCOE-lib
            </span>
          </div>
          
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="flex size-9 items-center justify-center rounded-full glass-panel text-blue-100 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {/* OPAC Header Section */}
        <section className="flex flex-col gap-1.5 glass-panel p-5 rounded-2xl border border-white/20 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Library className="size-6 text-blue-400" />
            Library Catalog
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Browse and request books from the digital inventory.
          </p>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
            <input
              type="text"
              placeholder="Search title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/20 glass-input py-3 pl-10 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-blue-500 focus:glass-panel transition shadow-inner"
            />
          </div>

          {/* Library Rules Banner */}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
            <div className="shrink-0 text-blue-300 text-base">📋</div>
            <div className="text-[10px] text-blue-200 leading-relaxed">
              <span className="font-bold text-blue-100">Library Rules:</span>{' '}
              Max <span className="font-bold text-white">2 books</span> at a time &nbsp;•&nbsp;
              Loan duration: <span className="font-bold text-white">7 days</span>
            </div>
          </div>
        </section>

        {/* Status Messages */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <AlertCircle className="size-4 text-red-400 shrink-0" />
            <p className="text-xs font-medium text-red-200">{errorMsg}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="size-4 text-green-400 shrink-0" />
            <p className="text-xs font-medium text-green-200">{successMsg}</p>
          </div>
        )}

        {/* Book List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Available Books</h2>
            <span className="text-xs font-semibold text-blue-200">
              {filteredBooks.length} Results
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="size-8 animate-spin text-blue-400" />
              <p className="text-xs text-blue-200 mt-3 font-medium">Loading catalog...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 glass-panel px-4 py-12 text-center">
              <BookOpen className="size-8 text-blue-200/50 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-100">No books found</p>
              <p className="text-xs text-blue-200 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredBooks.map((book) => (
                <div 
                  key={book.isbn} 
                  className="rounded-2xl border border-white/20 glass-panel p-5 shadow-xl backdrop-blur-md flex flex-col gap-4"
                >
                  <div className="flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/20">
                      <BookOpen className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-base leading-tight">
                        {book.title}
                      </h4>
                      <p className="text-xs text-blue-200 mt-1 truncate">
                        {book.author || 'Unknown Author'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3 text-[10px] font-bold">
                        <span className="glass-panel text-blue-100 px-2 py-0.5 rounded-md border border-white/10">
                          ISBN: {book.isbn}
                        </span>
                        {book.availableCopies > 0 ? (
                          <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md border border-green-400/20">
                            {book.availableCopies} Available
                          </span>
                        ) : (
                          <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md border border-red-400/20">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRequestBorrow(book.isbn)}
                    disabled={requestingIsbn === book.isbn || book.availableCopies < 1}
                    className={`w-full rounded-xl py-3 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                      book.availableCopies > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 disabled:opacity-50'
                        : 'bg-white/10 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {requestingIsbn === book.isbn ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : book.availableCopies > 0 ? (
                      'Request to Borrow'
                    ) : (
                      'Not Available'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
        <div className="flex items-center justify-around rounded-full border border-white/20 glass-panel px-6 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-white/25 text-white shadow-lg transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <History className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
