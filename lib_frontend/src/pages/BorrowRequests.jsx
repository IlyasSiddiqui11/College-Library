import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  BookOpen, Search, Loader2, ClipboardList, Check, X, UserCheck, Download, CheckCircle2, AlertCircle
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function BorrowRequests() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [borrowRequests, setBorrowRequests] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [accessionNumber, setAccessionNumber] = useState('')
  const [availableCopies, setAvailableCopies] = useState([])
  const [copiesLoading, setCopiesLoading] = useState(false)
  const [copySearch, setCopySearch] = useState('')

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

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

  const selectedReq = borrowRequests.find((req) => req.id === selectedRequestId)

  useEffect(() => {
    const loadCopies = async () => {
      if (!selectedReq || selectedReq.status !== 'PENDING' || !selectedReq.isbn) {
        setAvailableCopies([])
        setAccessionNumber('')
        setCopySearch('')
        return
      }
      setCopiesLoading(true)
      setAccessionNumber('')
      setCopySearch('')
      try {
        const res = await apiClient.get(`/api/books/isbn/${encodeURIComponent(selectedReq.isbn)}/available-copies`)
        setAvailableCopies(res.data || [])
      } catch (err) {
        console.error('Failed to load available copies:', err)
        setAvailableCopies([])
      } finally {
        setCopiesLoading(false)
      }
    }
    loadCopies()
  }, [selectedReq?.id, selectedReq?.isbn, selectedReq?.status])

  const handleApprove = async (id, accNum) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/admin/approve/${id}?accessionNumber=${encodeURIComponent(accNum.trim())}`)
      await fetchRequests()
      window.dispatchEvent(new Event('refresh-sidebar'))
      setAccessionNumber('')
      showNotification('Borrow request approved successfully!', 'success')
    } catch (err) {
      showNotification('Approval failed: ' + err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/admin/reject/${id}`)
      await fetchRequests()
      window.dispatchEvent(new Event('refresh-sidebar'))
      showNotification('Borrow request rejected successfully.', 'success')
    } catch (err) {
      showNotification('Rejection failed: ' + err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmApprove = (id, accNum) => {
    if (!accNum || !accNum.trim()) {
      showNotification('Please select an accession number to issue.', 'error')
      return
    }
    handleApprove(id, accNum)
  }

  const confirmReject = (id) => {
    handleReject(id)
  }

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

  const filteredRequests = borrowRequests
    .filter((req) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        q === '' ||
        (req.bookTitle?.toLowerCase() || '').includes(q) ||
        (req.userName?.toLowerCase() || '').includes(q) ||
        (req.isbn || '').includes(q)
      
      const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus
      const matchesUserType = userTypeFilter === 'ALL' || req.userRole === userTypeFilter
      return matchesSearch && matchesStatus && matchesUserType
    })
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

  // Auto-select first item when filter changes if current selection is invalid
  useEffect(() => {
    if (!loading) {
      if (filteredRequests.length > 0) {
        const isSelectedValid = filteredRequests.some(r => r.id === selectedRequestId);
        if (!isSelectedValid) {
          setSelectedRequestId(filteredRequests[0].id);
        }
      } else {
        setSelectedRequestId(null);
      }
    }
  }, [filterStatus, userTypeFilter, searchQuery, borrowRequests, loading]);

  if (!user) return null

  const pendingCount = borrowRequests.filter((r) => r.status === 'PENDING').length

  const filteredCopies = availableCopies.filter((copy) =>
    (copy.accessionNumber || '').toLowerCase().includes(copySearch.toLowerCase())
  )

  const handleExport = () => {
    const headers = ['Request ID', 'Book Title', 'Book Author', 'ISBN', 'Requester Name', 'Requester ID', 'Request Date', 'Due Date', 'Accession Number', 'Status', 'Approved Date', 'Returned Date', 'Rejected/Cancelled Date']
    const csvRows = [
      headers.join(','),
      ...filteredRequests.map(req => {
        const approvedDate = req.approvedDate ? new Date(req.approvedDate).toLocaleString() : ''
        const returnedDate = req.returnedDate ? new Date(req.returnedDate).toLocaleString() : ''
        let rejectedDate = ''
        if ((req.status === 'REJECTED' || req.status === 'CANCELLED') && req.updatedAt) {
          rejectedDate = new Date(req.updatedAt).toLocaleString()
        }

        return [
          `"${req.id}"`,
          `"${(req.bookTitle || '').replace(/"/g, '""')}"`,
          `"${(req.bookAuthor || req.author || '').replace(/"/g, '""')}"`,
          `"${req.isbn || ''}"`,
          `"${(req.userName || '').replace(/"/g, '""')}"`,
          `"${req.userId || ''}"`,
          `"${new Date(req.requestDate).toLocaleString()}"`,
          `"${req.dueDate ? new Date(req.dueDate).toLocaleString() : ''}"`,
          `"${req.accessionNumber || ''}"`,
          `"${req.status}"`,
          `"${approvedDate}"`,
          `"${returnedDate}"`,
          `"${rejectedDate}"`
        ].join(',')
      })
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `borrow_requests_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen flex text-slate-900">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-right-8 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}
      <AdminSidebar user={user} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Lending Queue
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Assign physical copies and monitor loans</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || filteredRequests.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 rounded-xl border border-slate-200 glass-input py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:glass-panel transition"
                />
              </div>

              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 glass-input px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white shadow-sm transition-all"
              >
                <option value="ALL">All Users</option>
                <option value="STUDENT">Students</option>
                <option value="STAFF">Staff</option>
              </select>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'APPROVED', label: 'Pending Return' },
                  { id: 'RETURNED', label: 'Returned' },
                  { id: 'REJECTED', label: 'Rejected' },
                  { id: 'CANCELLED', label: 'Cancelled' },
                  { id: 'LOST', label: 'Lost' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      filterStatus === f.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1440px] mx-auto w-full">
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl flex flex-col gap-4 max-h-[640px] overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 px-1">Lending Inbox</h3>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-slate-500 mx-auto" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-8">No requests match criteria.</p>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = req.id === selectedRequestId
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`w-full text-left rounded-xl p-4 border transition flex gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/20 shadow-xl' 
                          : 'border-slate-200 glass-panel/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg glass-panel text-slate-500">
                        <BookOpen className="size-4.5" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                            {req.bookTitle}
                          </p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                            req.status === 'PENDING' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                              : req.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-600 border-blue-200/50'
                              : req.status === 'RETURNED'
                              ? 'bg-green-50 text-green-600 border-green-200/50'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-600 border-red-200/50'
                              : req.status === 'LOST'
                              ? 'bg-red-600 text-white border-red-700/40'
                              : 'bg-slate-100 text-slate-500 border-slate-300/40'
                          }`}>
                            {req.status === 'APPROVED' ? 'ISSUED' : req.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-500 truncate">{req.userName || `ID #${req.userId}`}</p>
                          {req.userRole === 'STAFF' && (
                            <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 tracking-wider">
                              STAFF
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">ISBN: {req.isbn || '—'}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[9px] text-slate-500 font-medium">{new Date(req.requestDate).toLocaleDateString()}</p>
                          {req.status === 'PENDING' && (
                            <span className="text-[9px] font-bold text-green-600">
                              {req.availableCopies ?? 0} avail.
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-200 glass-panel p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
            {selectedReq ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="pb-6 border-b border-slate-200 flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-slate-900 leading-snug truncate">
                        {selectedReq.bookTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Author: {selectedReq.bookAuthor || selectedReq.author || 'Unknown Author'}</p>
                      
                      <div className="mt-3 flex gap-2 flex-wrap text-[10px] font-bold">
                        <span className="glass-panel text-slate-600 px-2 py-0.5 rounded-lg">
                          ISBN: {selectedReq.isbn}
                        </span>
                        {selectedReq.edition && (
                          <span className="glass-panel text-slate-600 px-2 py-0.5 rounded-lg">
                            Edition: {selectedReq.edition}
                          </span>
                        )}
                        {selectedReq.branch && (
                          <span className="glass-panel text-slate-600 px-2 py-0.5 rounded-lg">
                            Branch: {selectedReq.branch}
                          </span>
                        )}
                        {selectedReq.category && (
                          <span className="glass-panel text-slate-600 px-2 py-0.5 rounded-lg">
                            Category: {selectedReq.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="py-6 border-b border-slate-200 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Information</h4>
                    <div className="flex items-center justify-between gap-3 glass-panel p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full pfp-circle bg-blue-600 text-white font-bold text-sm">
                          {selectedReq.userName?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">{selectedReq.userName || `User ID #${selectedReq.userId}`}</p>
                            {selectedReq.userRole === 'STAFF' && (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 tracking-wider">
                                STAFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleViewProfile(selectedReq.userId)}
                        className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-white/20 hover:text-blue-600 rounded-lg transition"
                      >
                        View Full Profile
                      </button>
                    </div>
                  </div>

                  <div className="py-6 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lending Schedule</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500">Requested Date</p>
                        <p className="font-bold text-slate-900 mt-0.5">{new Date(selectedReq.requestDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Default Schedule Duration</p>
                        <p className="font-bold text-blue-600 mt-0.5">7 Days Loan</p>
                      </div>
                      {selectedReq.accessionNumber && (
                        <div>
                          <p className="text-slate-500">Issued Accession</p>
                          <p className="font-bold text-amber-600 mt-0.5 font-mono">{selectedReq.accessionNumber}</p>
                        </div>
                      )}
                      {selectedReq.dueDate && (
                        <div>
                          <p className="text-slate-500">Due Date</p>
                          <p className="font-bold text-red-600 mt-0.5">{new Date(selectedReq.dueDate).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedReq.extensionCount !== undefined && selectedReq.extensionCount > 0 && (
                        <div>
                          <p className="text-slate-500">Extensions Used</p>
                          <p className="font-bold text-blue-600 mt-0.5">{selectedReq.extensionCount} / 2 Times</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedReq.status === 'PENDING' && (
                    <div className="pb-6 flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Available Copies ({availableCopies.length})
                      </h4>
                      {copiesLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading available copies...
                        </div>
                      ) : availableCopies.length === 0 ? (
                        <p className="text-xs text-amber-600 glass-panel border border-amber-400/20 rounded-xl p-3">
                          No available copies for this ISBN. Cannot approve until a copy is returned.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search accession numbers..."
                              value={copySearch}
                              onChange={(e) => setCopySearch(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 glass-input py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                            />
                          </div>
                          <CustomSelect
                            value={accessionNumber}
                            onChange={(val) => setAccessionNumber(val)}
                            options={filteredCopies.map((copy) => ({ value: copy.accessionNumber, label: copy.accessionNumber }))}
                            placeholder="Select accession number to issue..."
                            className="w-full"
                          />
                          <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 mt-1">
                            {filteredCopies.map((copy) => (
                              <label
                                key={copy.id}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs cursor-pointer transition ${
                                  accessionNumber === copy.accessionNumber
                                    ? 'border-blue-500 bg-blue-500/20 text-white'
                                    : 'border-white/15 glass-panel text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="accession"
                                  checked={accessionNumber === copy.accessionNumber}
                                  onChange={() => setAccessionNumber(copy.accessionNumber)}
                                  className="accent-blue-500"
                                />
                                <span className="font-mono font-bold text-amber-600">{copy.accessionNumber}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-200 pt-6 flex justify-end gap-3">
                  {selectedReq.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => confirmReject(selectedReq.id)}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-5 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <X className="size-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => confirmApprove(selectedReq.id, accessionNumber)}
                        disabled={actionLoading || !accessionNumber || availableCopies.length === 0}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <Check className="size-4" />
                        Approve Request
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2 p-4 glass-panel border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <UserCheck className="size-4 text-slate-500" />
                        Lending request has already been finalized: Status &quot;{selectedReq.status}&quot;
                      </div>
                      {selectedReq.accessionNumber && (
                        <span className="text-[10px] font-bold text-amber-600 font-mono bg-amber-100 border border-amber-400/20 px-2 py-1 rounded-lg shrink-0">
                          Acc# {selectedReq.accessionNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <ClipboardList className="size-8 text-slate-500" />
                <p className="text-xs font-semibold mt-2">No request item selected</p>
                <p className="text-[10px] mt-0.5">Select a borrow card from the left panel to review.</p>
              </div>
            )}
          </div>
        </main>
      </div>


      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 glass-panel p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="size-5 text-blue-600" />
                Student Profile
              </h3>
              <button 
                type="button" 
                onClick={() => setShowProfileModal(false)}
                className="text-slate-500 hover:text-blue-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {profileLoading && (
              <div className="py-8 text-center">
                <Loader2 className="size-6 animate-spin text-slate-500 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading profile...</p>
              </div>
            )}

            {profileError && (
              <div className="py-6 text-center text-red-500">
                <p className="text-sm font-bold">{profileError}</p>
                <p className="text-xs mt-1 text-red-600">This student may not have completed their profile yet.</p>
              </div>
            )}

            {selectedProfile && !profileLoading && (
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Name</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.userName || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Email</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.userEmail || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Branch</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.branch || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Year</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.year || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Contact</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.contactNumber || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Address</div>
                  <div className="col-span-2 text-slate-900 font-medium">{selectedProfile.address || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
