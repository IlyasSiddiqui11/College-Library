import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, ChevronLeft, Search, Clock, CheckCircle2, 
  XCircle, Loader2, Award, BookMarked, User, History as HistoryIcon
} from 'lucide-react'

export default function BorrowHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State
  const [borrowRequests, setBorrowRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const fetchHistory = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await apiClient.get(`/api/borrow/user/${user.id}`)
      setBorrowRequests(response.data)
    } catch (err) {
      console.error('Error fetching borrowing history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user])

  if (!user) return null

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filtered requests
  const filteredItems = borrowRequests.filter((item) => {
    const bookTitle = item.bookTitle?.toLowerCase() || ''
    const bookAuthor = (item.bookAuthor || item.author || '').toLowerCase()
    const bookIsbn = item.isbn || ''
    const query = searchQuery.toLowerCase()

    const matchesSearch = bookTitle.includes(query) || bookAuthor.includes(query) || bookIsbn.includes(query)
    const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Compute Stats
  const totalRead = borrowRequests.filter(r => r.status === 'RETURNED').length
  const currentReading = borrowRequests.filter(r => r.status === 'APPROVED').length

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </button>
          
          <span className="text-sm font-bold tracking-wider uppercase text-blue-600">
            Reading History
          </span>

          <div className="size-6 opacity-0" />
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        {/* Intro */}
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Intellectual Log
          </h1>
          <p className="text-xs text-blue-200 leading-relaxed">
            Review and manage all historical borrow requests, active shelf pickups, and returned titles.
          </p>
        </section>

        {/* Dynamic Statistics Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/20 glass-panel p-4 shadow-xl backdrop-blur-md flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{totalRead}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Books Returned</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 glass-panel p-4 shadow-xl backdrop-blur-md flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookMarked className="size-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{currentReading}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Active Borrows</p>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <section className="rounded-2xl border border-white/20 glass-panel p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/20 glass-input py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-indigo-500 focus:glass-panel"
            />
          </div>

          {/* Quick status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {['ALL', 'PENDING', 'APPROVED', 'RETURNED', 'REJECTED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-xl'
                    : 'glass-panel text-blue-200 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* List Feed */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Loader2 className="size-8 text-blue-500 animate-spin" />
              <span className="text-xs text-blue-200 mt-3">Syncing history catalog...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 glass-panel px-4 py-12 text-center">
              <p className="text-sm font-semibold text-blue-100">No matching logs found</p>
              <p className="text-xs text-blue-200 mt-1">Try adjusting your filters or checking a different keyword.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              // Status Styling
              let statusBadge = null
              let borderClass = 'border-white/20 glass-panel'

              switch (item.status) {
                case 'PENDING':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200/40">
                      <Clock className="size-2.5" /> PENDING
                    </span>
                  )
                  break
                case 'APPROVED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200/40">
                      <CheckCircle2 className="size-2.5" /> APPROVED
                    </span>
                  )
                  break
                case 'RETURNED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 border border-green-200/40">
                      <CheckCircle2 className="size-2.5" /> RETURNED
                    </span>
                  )
                  break
                case 'REJECTED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 border border-red-200/40">
                      <XCircle className="size-2.5" /> REJECTED
                    </span>
                  )
                  borderClass = 'border-red-100 bg-red-50/10'
                  break
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition ${borderClass}`}
                >
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl glass-panel text-blue-200">
                      <BookOpen className="size-5" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-white text-sm truncate pr-2">
                          {item.bookTitle || 'Unknown Title'}
                        </h4>
                        {statusBadge}
                      </div>
                      
                      <p className="text-xs text-blue-200 mt-0.5">
                        Author: {item.bookAuthor || item.author || 'Unknown Author'}
                      </p>
                      
                      <div className="mt-3 flex flex-col gap-1 border-t border-white/20 pt-2.5 text-[10px] font-medium text-blue-200">
                        <div className="flex justify-between">
                          <span>ISBN</span>
                          <span className="font-mono text-blue-100">{item.isbn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date Submitted</span>
                          <span>{formatDate(item.requestDate)}</span>
                        </div>
                        {item.approvedDate && (
                          <div className="flex justify-between">
                            <span>Date Approved</span>
                            <span>{formatDate(item.approvedDate)}</span>
                          </div>
                        )}
                        {item.status === 'RETURNED' && (
                          <div className="flex justify-between">
                            <span>Returned On</span>
                            <span className="text-green-600">{formatDate(item.returnedDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>

      {/* Bottom sticky navigation */}
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
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-white/25 text-white shadow-lg transition"
          >
            <HistoryIcon className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
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
