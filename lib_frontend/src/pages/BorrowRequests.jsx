import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Search, Loader2, Library, ClipboardList, Users, LogOut, Check, X, UserCheck
} from 'lucide-react'

export default function BorrowRequests() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State
  const [borrowRequests, setBorrowRequests] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPendingOnly, setFilterPendingOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/api/borrow')
      setBorrowRequests(response.data)
      
      if (response.data.length > 0 && !selectedRequestId) {
        const pending = response.data.find((r) => r.status === 'PENDING')
        if (pending) {
          setSelectedRequestId(pending.id)
        } else {
          setSelectedRequestId(response.data[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch lending queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [user])

  // Handle Approve Action
  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/admin/approve/${id}`)
      await fetchRequests()
    } catch (err) {
      alert('Approval failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Reject Action
  const handleReject = async (id) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/admin/reject/${id}`)
      await fetchRequests()
    } catch (err) {
      alert('Rejection failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!user) return null

  // Filter requests
  const filteredRequests = borrowRequests.filter((req) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      (req.bookTitle?.toLowerCase() || '').includes(q) ||
      (req.userName?.toLowerCase() || '').includes(q) ||
      (req.isbn || '').includes(q)
    
    const matchesStatus = !filterPendingOnly || req.status === 'PENDING'
    return matchesSearch && matchesStatus
  })

  // Selected request details
  const selectedReq = borrowRequests.find((req) => req.id === selectedRequestId)
  const pendingCount = borrowRequests.filter((r) => r.status === 'PENDING').length

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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50/50 text-left transition"
            >
              <ClipboardList className="size-4.5" />
              Borrow Requests
              {pendingCount > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition"
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

        {/* User Profile Card */}
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

      {/* Main Split-Screen Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Lending Queue
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Approve shelf picks and monitor loans</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <button
                onClick={() => setFilterPendingOnly(!filterPendingOnly)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition active:scale-[0.98] ${
                  filterPendingOnly
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {filterPendingOnly ? 'Pending Only' : 'Show All'}
              </button>
            </div>
          </div>
        </header>

        {/* Master-Detail Split Layout */}
        <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1440px] mx-auto w-full">
          {/* Left panel: Active request list (5 columns) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4 max-h-[640px] overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 px-1">Lending Inbox</h3>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-slate-400 mx-auto" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">No requests match criteria.</p>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = req.id === selectedRequestId
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`w-full text-left rounded-xl p-4 border transition flex gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/20 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <BookOpen className="size-4.5" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-800 text-xs truncate max-w-[140px]">
                            {req.bookTitle}
                          </p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                            req.status === 'PENDING' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                              : req.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-600 border-blue-200/50'
                              : 'bg-green-50 text-green-600 border-green-200/50'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">Requester: {req.userName || `ID #${req.userId}`}</p>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">Logged: {new Date(req.requestDate).toLocaleDateString()}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right panel: Details of selected request (7 columns) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[480px]">
            {selectedReq ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Book Section */}
                  <div className="pb-6 border-b border-slate-100 flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-slate-800 leading-snug truncate">
                        {selectedReq.bookTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Author: {selectedReq.bookAuthor || selectedReq.author || 'Unknown Author'}</p>
                      
                      <div className="mt-3 flex gap-2 flex-wrap text-[10px] font-bold">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                          ISBN: {selectedReq.isbn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Requester Profile Summary */}
                  <div className="py-6 border-b border-slate-100 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requester Profile</h4>
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                        {selectedReq.userName?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{selectedReq.userName || `Student ID #${selectedReq.userId}`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lending Details */}
                  <div className="py-6 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lending Schedule</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400">Request Date</p>
                        <p className="font-bold text-slate-700 mt-0.5">{new Date(selectedReq.requestDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Default Schedule Duration</p>
                        <p className="font-bold text-blue-600 mt-0.5">14 Days Loan</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Panel */}
                <div className="mt-8 border-t border-slate-100 pt-6 flex justify-end gap-3">
                  {selectedReq.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleReject(selectedReq.id)}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-5 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <X className="size-4" />
                        Decline Request
                      </button>
                      <button
                        onClick={() => handleApprove(selectedReq.id)}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <Check className="size-4" />
                        Approve Borrow Request
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-500">
                      <UserCheck className="size-4 text-slate-400" />
                      Lending request has already been finalized: Status &quot;{selectedReq.status}&quot;
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <ClipboardList className="size-8 text-slate-300" />
                <p className="text-xs font-semibold mt-2">No request item selected</p>
                <p className="text-[10px] mt-0.5">Select a borrow card from the left panel to review.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
