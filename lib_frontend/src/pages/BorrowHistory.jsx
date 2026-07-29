import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, ChevronLeft, Search, Clock, CheckCircle2, 
  XCircle, Loader2, Award, BookMarked, User, History as HistoryIcon, FileText, Banknote
} from 'lucide-react'

export default function BorrowHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State
  const [activeTab, setActiveTab] = useState('history') // 'history', 'reservations', 'fines'
  const [borrowRequests, setBorrowRequests] = useState([])
  const [reservations, setReservations] = useState([])
  const [fines, setFines] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const fetchHistory = async (showLoading = true) => {
    if (!user) return
    if (showLoading) setLoading(true)
    try {
      const [historyRes, resRes, finesRes] = await Promise.all([
        apiClient.get(`/api/borrow/user/${user.id}`),
        apiClient.get(`/api/reservations/user/${user.id}`),
        apiClient.get(`/api/fines/user/${user.id}`)
      ])
      setBorrowRequests(historyRes.data)
      setReservations(resRes.data)
      setFines(finesRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchHistory(true)
    const intervalId = setInterval(() => {
      fetchHistory(false)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [user])

  const handleCancelRequest = async (requestId) => {
    if (!user) return
    setCancellingId(requestId)
    try {
      await apiClient.delete(`/api/borrow/${requestId}/cancel?userId=${user.id}`)
      await fetchHistory(false)
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancellingId(null)
    }
  }

  const handleCancelReservation = async (resId) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setCancellingId(resId)
    try {
      await apiClient.delete(`/api/reservations/${resId}?userId=${user.id}`)
      await fetchHistory(false)
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancellingId(null)
    }
  }

  if (!user) return null

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filtered requests
  const filteredItems = borrowRequests
    .filter((item) => {
      const bookTitle = item.bookTitle?.toLowerCase() || ''
      const bookAuthor = (item.bookAuthor || item.author || '').toLowerCase()
      const bookIsbn = item.isbn || ''
      const query = searchQuery.toLowerCase()

      const matchesSearch = bookTitle.includes(query) || bookAuthor.includes(query) || bookIsbn.includes(query)
      const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

  // Filtered reservations
  const activeReservations = reservations
    .filter(r => r.status === 'PENDING')
    .filter(r => {
      const title = r.bookTitle?.toLowerCase() || ''
      const query = searchQuery.toLowerCase()
      return title.includes(query) || r.isbn?.includes(query)
    })
    .sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime())

  // Compute Stats
  const totalRead = borrowRequests.filter(r => r.status === 'RETURNED').length
  const currentReading = borrowRequests.filter(r => r.status === 'APPROVED').length
  const pendingReservations = reservations.filter(r => r.status === 'PENDING').length
  const unpaidFines = fines.filter(f => f.status === 'UNPAID').length

  return (
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Intellectual Log
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review and manage all historical borrow requests, active shelf pickups, and returned titles.
          </p>
        </section>

        {/* Dynamic Statistics Grid */}
        <section className="grid grid-cols-4 gap-2">
          <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl backdrop-blur-md flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="size-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{totalRead}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Returned</p>
          </div>

          <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl backdrop-blur-md flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="size-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{currentReading}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active</p>
          </div>

          <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl backdrop-blur-md flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookMarked className="size-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{pendingReservations}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reserved</p>
          </div>

          <div className="rounded-2xl border border-slate-200 glass-panel p-3 shadow-xl backdrop-blur-md flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Banknote className="size-4" />
            </div>
            <p className={`text-lg font-bold ${unpaidFines > 0 ? 'text-red-600' : 'text-slate-900'}`}>{unpaidFines}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unpaid</p>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-50 p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-600'}`}
          >
            Borrow History
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'reservations' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-600'}`}
          >
            Reservations
          </button>
          <button
            onClick={() => setActiveTab('fines')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'fines' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}
          >
            Fines {unpaidFines > 0 && <span className="ml-1 inline-block rounded-full bg-white/30 px-1.5 text-[9px]">{unpaidFines}</span>}
          </button>
        </div>

        {/* Search & Filter Controls */}
        <section className="rounded-2xl border border-slate-200 glass-panel p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 glass-input py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:glass-panel"
            />
          </div>

          {/* Quick status filter pills */}
          {activeTab === 'history' && (
            <div className="flex gap-1.5 flex-wrap">
              {['ALL', 'PENDING', 'APPROVED', 'RETURNED', 'REJECTED', 'CANCELLED', 'LOST'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-xl'
                      : 'glass-panel text-slate-500 hover:text-blue-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* List Feed */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Loader2 className="size-8 text-blue-500 animate-spin" />
              <span className="text-xs text-slate-500 mt-3">Syncing history catalog...</span>
            </div>
          ) : activeTab === 'fines' ? (
            fines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-12 text-center">
                <CheckCircle2 className="size-8 text-green-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-600">No fines recorded</p>
                <p className="text-xs text-slate-500 mt-1">You have a clean borrowing record!</p>
              </div>
            ) : (
              fines.map(fine => (
                <div key={fine.id} className={`rounded-2xl border p-4 shadow-sm ${
                  fine.status === 'UNPAID' ? 'bg-red-50 border-red-100' :
                  fine.status === 'PAID'   ? 'bg-green-50 border-green-100' :
                  'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/50 border border-black/5 text-red-400">
                      <Banknote className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-900 text-sm truncate pr-2">{fine.bookTitle}</h4>
                        <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          fine.status === 'PAID'   ? 'bg-green-100 text-green-800' :
                          fine.status === 'UNPAID' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {fine.status === 'PAID' ? <CheckCircle2 className="size-2.5" /> : <Clock className="size-2.5" />}
                          {fine.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Acc#: {fine.accessionNumber}</p>
                      <div className="mt-3 flex flex-col gap-1 border-t border-black/5 pt-2.5 text-[10px] font-medium text-slate-500">
                        <div className="flex justify-between">
                          <span>Delayed By</span>
                          <span className="font-bold text-orange-600">{fine.delayDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fine Amount</span>
                          <span className="font-bold text-red-600">₹{fine.totalFine}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Generated On</span>
                          <span className="text-slate-700">{formatDate(fine.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : activeTab === 'history' && filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">No matching logs found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or checking a different keyword.</p>
            </div>
          ) : activeTab === 'reservations' && activeReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">No active reservations found</p>
              <p className="text-xs text-slate-500 mt-1">You don't have any pending book reservations.</p>
            </div>
          ) : (
            (activeTab === 'history' ? filteredItems : activeReservations).map((item) => {
              let bgClass = 'bg-white border-slate-200'
              if (item.status === 'LOST') bgClass = 'bg-red-50 border-red-100'
              if (item.status === 'RETURNED') bgClass = 'bg-green-50 border-green-100'
              if (item.status === 'PENDING') bgClass = 'bg-amber-50 border-amber-100'
              if (item.status === 'APPROVED') bgClass = 'bg-blue-50 border-blue-100'
              if (item.status === 'REJECTED' || item.status === 'CANCELLED') bgClass = 'bg-slate-50 border-slate-200'
              
              // Status Styling
              let statusBadge = null

              switch (item.status) {
                case 'PENDING':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                      <Clock className="size-2.5" /> PENDING
                    </span>
                  )
                  break
                case 'APPROVED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">
                      <CheckCircle2 className="size-2.5" /> APPROVED
                    </span>
                  )
                  break
                case 'RETURNED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-800">
                      <CheckCircle2 className="size-2.5" /> RETURNED
                    </span>
                  )
                  break
                case 'REJECTED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800">
                      <XCircle className="size-2.5" /> REJECTED
                    </span>
                  )
                  break
                case 'CANCELLED':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                      <XCircle className="size-2.5" /> CANCELLED
                    </span>
                  )
                  break
                case 'LOST':
                  statusBadge = (
                    <span className="flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 text-[9px] font-bold text-red-900">
                      <XCircle className="size-2.5" /> LOST
                    </span>
                  )
                  break
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border ${bgClass} p-4 shadow-sm transition`}
                >
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/50 border border-black/5 text-slate-500">
                      <BookOpen className="size-5" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-900 text-sm truncate pr-2">
                          {item.bookTitle || 'Unknown Title'}
                        </h4>
                        {statusBadge}
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-0.5">
                        Author: {item.bookAuthor || item.author || 'Unknown Author'}
                      </p>
                      
                      <div className="mt-3 flex flex-col gap-1 border-t border-black/5 pt-2.5 text-[10px] font-medium text-slate-500">
                        <div className="flex justify-between">
                          <span>Book Name</span>
                          <span className="text-slate-700 font-semibold truncate max-w-[180px]">{item.bookTitle || 'Unknown Title'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ISBN</span>
                          <span className="font-mono text-slate-700">{item.isbn || 'N/A'}</span>
                        </div>
                        {activeTab === 'history' ? (
                          <>
                            {item.accessionNumber && (
                              <div className="flex justify-between">
                                <span>Accession No</span>
                                <span className="font-mono font-bold text-slate-700">{item.accessionNumber}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Borrow Date</span>
                              <span className="text-slate-700">{formatDate(item.approvedDate || item.requestDate)}</span>
                            </div>
                            {item.dueDate && item.status !== 'REJECTED' && item.status !== 'RETURNED' && item.status !== 'CANCELLED' && item.status !== 'LOST' && (() => {
                              const isOverdue = new Date(item.dueDate) < new Date()
                              return (
                                <div className="flex justify-between">
                                  <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                                    {isOverdue ? '⚠ Overdue!' : 'Due Date'}
                                  </span>
                                  <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                                    {formatDate(item.dueDate)}
                                  </span>
                                </div>
                              )
                            })()}
                            {item.status === 'RETURNED' && (
                              <div className="flex justify-between">
                                <span>Returned On</span>
                                <span className="text-green-700">{formatDate(item.returnedDate)}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span>Reserved On</span>
                            <span className="text-slate-700">{formatDate(item.reservationDate)}</span>
                          </div>
                        )}
                      </div>

                      {item.status === 'PENDING' && (
                        <div className="mt-3 flex justify-end border-t border-black/5 pt-2.5">
                          <button
                            type="button"
                            onClick={() => activeTab === 'history' ? handleCancelRequest(item.id) : handleCancelReservation(item.id)}
                            disabled={cancellingId === item.id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {cancellingId === item.id ? 'Cancelling...' : (activeTab === 'history' ? 'Cancel Request' : 'Cancel Reservation')}
                          </button>
                        </div>
                      )}
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
        <div className="flex items-center justify-around rounded-full border border-slate-200 glass-panel px-6 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-slate-100 text-blue-600 transition"
          >
            <HistoryIcon className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
