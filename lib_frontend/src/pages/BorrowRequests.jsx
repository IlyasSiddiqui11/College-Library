import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  BookOpen, Search, Loader2, Library, ClipboardList, Users, LogOut, Check, X, QrCode,
  Clock,
  UserCheck
} from 'lucide-react'

export default function BorrowRequests() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State
  const [borrowRequests, setBorrowRequests] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAccessionInput, setShowAccessionInput] = useState(false)
  const [accessionNumber, setAccessionNumber] = useState('')

  // Student Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

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
  const handleApprove = async (id, accNum) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/admin/approve/${id}?accessionNumber=${encodeURIComponent(accNum || '')}`)
      await fetchRequests()
      setShowAccessionInput(false)
      setAccessionNumber('')
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

  // Handle View Profile
  const handleViewProfile = async (userId) => {
    setShowProfileModal(true)
    setProfileLoading(true)
    setProfileError(null)
    setSelectedProfile(null)
    try {
      const res = await apiClient.get(`/api/profile/${userId}`)
      setSelectedProfile(res.data)
    } catch (err) {
      setProfileError(err.message || 'Failed to fetch student profile')
    } finally {
      setProfileLoading(false)
    }
  }

  if (!user) return null

  // Filter requests
  const filteredRequests = borrowRequests
    .filter((req) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        (req.bookTitle?.toLowerCase() || '').includes(q) ||
        (req.userName?.toLowerCase() || '').includes(q) ||
        (req.isbn || '').includes(q)
      
      const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

  // Selected request details
  const selectedReq = borrowRequests.find((req) => req.id === selectedRequestId)
  const pendingCount = borrowRequests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="min-h-screen flex text-white">
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
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

        {/* User Profile Card */}
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

      {/* Main Split-Screen Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-white/20 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Lending Queue
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">Approve shelf picks and monitor loans</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search by student or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 rounded-xl border border-white/20 glass-input py-2 pl-9 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-indigo-500 focus:glass-panel transition"
                />
              </div>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'APPROVED', label: 'Pending Return' },
                  { id: 'RETURNED', label: 'Returned' },
                  { id: 'REJECTED', label: 'Rejected' },
                  { id: 'CANCELLED', label: 'Cancelled' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      filterStatus === f.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-blue-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Master-Detail Split Layout */}
        <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1440px] mx-auto w-full">
          {/* Left panel: Active request list (5 columns) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/20 glass-panel p-5 shadow-xl flex flex-col gap-4 max-h-[640px] overflow-hidden">
            <h3 className="text-sm font-bold text-white px-1">Lending Inbox</h3>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-blue-200 mx-auto" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <p className="text-blue-200 text-xs text-center py-8">No requests match criteria.</p>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = req.id === selectedRequestId
                  return (
                    <button
                      key={req.id}
                      onClick={() => {
                        setSelectedRequestId(req.id)
                        setShowAccessionInput(false)
                        setAccessionNumber('')
                      }}
                      className={`w-full text-left rounded-xl p-4 border transition flex gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/20 shadow-xl' 
                          : 'border-white/20 glass-panel/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg glass-panel text-blue-200">
                        <BookOpen className="size-4.5" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-white text-xs truncate max-w-[140px]">
                            {req.bookTitle}
                          </p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                            req.status === 'PENDING' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                              : req.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-600 border-blue-200/50'
                              : req.status === 'RETURNED'
                              ? 'bg-green-50 text-green-600 border-green-200/50'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-600 border-red-200/50'
                              : 'bg-slate-100 text-slate-500 border-slate-300/40'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-200 mt-0.5 truncate">Requester: {req.userName || `ID #${req.userId}`}</p>
                        <p className="text-[9px] text-blue-200 mt-2 font-medium">Logged: {new Date(req.requestDate).toLocaleDateString()}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right panel: Details of selected request (7 columns) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
            {selectedReq ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Book Section */}
                  <div className="pb-6 border-b border-white/20 flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-white leading-snug truncate">
                        {selectedReq.bookTitle}
                      </h2>
                      <p className="text-xs text-blue-200 mt-0.5">Author: {selectedReq.bookAuthor || selectedReq.author || 'Unknown Author'}</p>
                      
                      <div className="mt-3 flex gap-2 flex-wrap text-[10px] font-bold">
                        <span className="glass-panel text-blue-100 px-2 py-0.5 rounded-lg">
                          ISBN: {selectedReq.isbn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Requester Profile Summary */}
                  <div className="py-6 border-b border-white/20 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Requester Profile</h4>
                    <div className="flex items-center justify-between gap-3 glass-panel p-4 rounded-xl border border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                          {selectedReq.userName?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{selectedReq.userName || `Student ID #${selectedReq.userId}`}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleViewProfile(selectedReq.userId)}
                        className="px-3 py-1.5 text-[10px] font-bold text-blue-100 bg-white/10 hover:bg-white/20 hover:text-white rounded-lg transition"
                      >
                        View Full Profile
                      </button>
                    </div>
                  </div>

                  {/* Lending Details */}
                  <div className="py-6 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Lending Schedule</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-blue-200">Request Date</p>
                        <p className="font-bold text-white mt-0.5">{new Date(selectedReq.requestDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Default Schedule Duration</p>
                        <p className="font-bold text-blue-600 mt-0.5">14 Days Loan</p>
                      </div>
                      {selectedReq.accessionNumber && (
                        <div>
                          <p className="text-blue-200">Accession Number</p>
                          <p className="font-bold text-amber-300 mt-0.5 font-mono">{selectedReq.accessionNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Panel */}
                <div className="mt-8 border-t border-white/20 pt-6 flex justify-end gap-3">
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
                      
                      {showAccessionInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Up to 10-digit Accession No."
                            maxLength={10}
                            value={accessionNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '')
                              setAccessionNumber(val)
                            }}
                            className="w-48 rounded-xl border border-white/20 glass-input py-2.5 px-3 text-xs text-white placeholder:text-blue-200 outline-none focus:border-blue-500 transition"
                          />
                          <button
                            onClick={() => {
                              if (accessionNumber.length > 0 && accessionNumber.length <= 10) {
                                handleApprove(selectedReq.id, accessionNumber)
                              } else {
                                alert('Please enter up to 10 numbers for the accession number.')
                              }
                            }}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                          >
                            <Check className="size-4" />
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              setShowAccessionInput(false)
                              setAccessionNumber('')
                            }}
                            className="p-2.5 rounded-xl border border-white/20 glass-panel text-blue-200 hover:text-white transition flex items-center justify-center"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAccessionInput(true)}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                        >
                          <Check className="size-4" />
                          Approve Borrow Request
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2 p-4 glass-panel border border-white/20 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
                        <UserCheck className="size-4 text-blue-200" />
                        Lending request has already been finalized: Status &quot;{selectedReq.status}&quot;
                      </div>
                      {selectedReq.accessionNumber && (
                        <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-500/10 border border-amber-400/20 px-2 py-1 rounded-lg shrink-0">
                          Acc# {selectedReq.accessionNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-blue-200 py-12">
                <ClipboardList className="size-8 text-slate-300" />
                <p className="text-xs font-semibold mt-2">No request item selected</p>
                <p className="text-[10px] mt-0.5">Select a borrow card from the left panel to review.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 glass-panel p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserCheck className="size-5 text-blue-600" />
                Student Profile
              </h3>
              <button 
                type="button" 
                onClick={() => setShowProfileModal(false)}
                className="text-blue-200 hover:text-blue-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {profileLoading && (
              <div className="py-8 text-center">
                <Loader2 className="size-6 animate-spin text-blue-200 mx-auto" />
                <p className="text-xs text-blue-200 mt-2">Loading profile...</p>
              </div>
            )}

            {profileError && (
              <div className="py-6 text-center text-red-500">
                <p className="text-sm font-bold">{profileError}</p>
                <p className="text-xs mt-1 text-red-400">This student may not have completed their profile yet.</p>
              </div>
            )}

            {selectedProfile && !profileLoading && (
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Name</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.userName || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Email</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.userEmail || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Branch</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.branch || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Year</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.year || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Contact</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.contactNumber || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-blue-200 font-bold text-xs uppercase tracking-wider">Address</div>
                  <div className="col-span-2 text-white font-medium">{selectedProfile.address || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
