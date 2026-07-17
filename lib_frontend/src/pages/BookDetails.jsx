import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  BookOpen, ChevronLeft, Loader2, CheckCircle2, AlertCircle, Library
} from 'lucide-react'

export default function BookDetails() {
  const { isbn } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isbn) return
      setLoading(true)
      setErrorMsg('')
      try {
        const res = await apiClient.get(`/api/books/isbn/${encodeURIComponent(isbn)}/details`)
        setBook(res.data)
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load book details')
        setBook(null)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [isbn])

  const handleRequestBorrow = async () => {
    if (!user || !profile) {
      setErrorMsg('Please complete your profile from the Dashboard first to borrow books.')
      return
    }
    if (!book?.isbn) return

    setRequesting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await apiClient.post('/api/borrow/request', {
        userId: user.id,
        isbn: book.isbn
      })
      setSuccessMsg('Borrow request submitted! Wait for librarian approval.')
      const res = await apiClient.get(`/api/books/isbn/${encodeURIComponent(book.isbn)}/details`)
      setBook(res.data)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit borrow request')
    } finally {
      setRequesting(false)
      setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 5000)
    }
  }

  if (!user) return null

  const isAvailable = book?.availability === 'Available'

  const detailRows = book
    ? [
        { label: 'ISBN', value: book.isbn },
        { label: 'Title', value: book.title },
        { label: 'Author', value: book.author },
        { label: 'Publisher', value: book.publisher },
        { label: 'Edition', value: book.edition },
        { label: 'Series', value: book.series },
        { label: 'Publication Year', value: book.publicationYear },
        { label: 'Category', value: book.category },
        { label: 'Branch', value: book.branch },
        { label: 'Language', value: book.language },
      ].filter((row) => row.value !== null && row.value !== undefined && String(row.value).trim() !== '')
    : []

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white pb-20">
      <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition"
          >
            <ChevronLeft className="size-4" />
            Catalog
          </button>
          <span className="text-sm font-bold tracking-wider uppercase text-blue-400">Book Details</span>
          <div className="size-6 opacity-0" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="size-8 animate-spin text-blue-400" />
            <p className="text-xs text-blue-200 mt-3">Loading details...</p>
          </div>
        ) : !book ? (
          <div className="rounded-2xl border border-dashed border-white/20 glass-panel px-4 py-12 text-center">
            <BookOpen className="size-8 text-blue-200/50 mx-auto mb-3" />
            <p className="text-sm font-bold text-blue-100">Book not found</p>
            <p className="text-xs text-blue-200 mt-1">{errorMsg || 'This title is not in the catalog.'}</p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-white/20 glass-panel p-5 shadow-xl flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/20">
                  <Library className="size-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-white leading-snug">{book.title}</h1>
                  <p className="text-xs text-blue-200 mt-1">{book.author || 'Unknown Author'}</p>
                  <div className="mt-2">
                    {isAvailable ? (
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md border border-green-400/20">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4">
                {detailRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-blue-300 font-semibold">{row.label}</span>
                    <span className="col-span-2 text-white font-medium break-words">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 flex items-center gap-2">
                <AlertCircle className="size-4 text-red-400 shrink-0" />
                <p className="text-xs font-medium text-red-200">{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                <p className="text-xs font-medium text-green-200">{successMsg}</p>
              </div>
            )}

            <button
              onClick={handleRequestBorrow}
              disabled={requesting || !isAvailable}
              className={`w-full rounded-xl py-3.5 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                isAvailable
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 disabled:opacity-50'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {requesting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : isAvailable ? (
                'Request to Borrow'
              ) : (
                'Not Available'
              )}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
