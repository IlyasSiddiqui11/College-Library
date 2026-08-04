import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client.js'
import { Users, Search, RefreshCw, AlertTriangle, Loader2, CheckCircle, XCircle, ShieldAlert, BadgeInfo } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar.jsx'

export default function AdminStaffManagement() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMsg, setSuccessMsg] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState(null) // 'approve', 'reject', 'inactive'
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Admin-only page
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const response = await apiClient.get('/api/staff/requests')
      const sorted = (response.data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRequests(sorted)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff requests')
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action, req) => {
    setModalAction(action)
    setSelectedRequest(req)
    setRemarks('')
    setIsModalOpen(true)
  }

  const submitAction = async () => {
    if (!selectedRequest || !modalAction) return
    
    setActionLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      let endpoint = ''
      let payload = { remarks }
      let params = ''

      if (modalAction === 'approve') {
        endpoint = `/api/staff/approve/${selectedRequest.id}`
        params = `?adminName=${encodeURIComponent(user.name)}`
      } else if (modalAction === 'reject') {
        endpoint = `/api/staff/reject/${selectedRequest.id}`
      } else if (modalAction === 'inactive') {
        endpoint = `/api/staff/inactive/${selectedRequest.id}`
      }

      const response = await apiClient.post(`${endpoint}${params}`, payload)
      setSuccessMsg(response.data || 'Action successful.')
      setIsModalOpen(false)
      fetchRequests()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.collegeEmail || '').toLowerCase().includes(q) ||
      (r.employeeId || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800"><Loader2 className="size-3 animate-spin"/> Pending</span>
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"><CheckCircle className="size-3"/> Approved</span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"><XCircle className="size-3"/> Rejected</span>
      case 'INACTIVE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800"><ShieldAlert className="size-3"/> Inactive</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">{status}</span>
    }
  }

  if (user?.role !== 'ADMIN') return null

  return (
    <div className="h-screen flex text-slate-900">
      <AdminSidebar user={user} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Users className="size-5 text-emerald-600" />
                Staff Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage staff verification requests and access control
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 transition"
                />
              </div>
              <button
                onClick={fetchRequests}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-75"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50/50">
                    <tr className="text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Staff Details</th>
                      <th className="px-6 py-3 font-semibold">Professional Info</th>
                      <th className="px-6 py-3 font-semibold">Contact</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm">{r.fullName}</p>
                          <p className="text-slate-500 mt-0.5 font-mono">ID: {r.employeeId}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Req: {formatDate(r.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{r.designation}</p>
                          <p className="text-slate-500 mt-0.5">{r.department}</p>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-semibold">{r.employmentType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">{r.collegeEmail}</p>
                          <p className="text-slate-500 mt-0.5">{r.mobileNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {getStatusBadge(r.status)}
                            {r.status !== 'PENDING' && (
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1" title={`Remarks: ${r.remarks || 'None'}`}>
                                <BadgeInfo className="size-3" />
                                {formatDate(r.approvalDate || r.updatedAt)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleActionClick('approve', r)}
                                  className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 font-bold hover:bg-emerald-100 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleActionClick('reject', r)}
                                  className="rounded-lg bg-red-50 text-red-700 px-3 py-1.5 font-bold hover:bg-red-100 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {r.status === 'APPROVED' && (
                              <button
                                onClick={() => handleActionClick('inactive', r)}
                                className="rounded-lg bg-slate-100 text-slate-700 px-3 py-1.5 font-bold hover:bg-slate-200 transition"
                              >
                                Mark Inactive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">
                          No requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">
              {modalAction} Staff Request
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to {modalAction} the request for <span className="font-bold">{selectedRequest?.fullName}</span>?
              {modalAction === 'approve' && ' They will receive an email with their auto-generated password.'}
            </p>
            
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any internal remarks here..."
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-emerald-600 min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={actionLoading}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition ${
                  modalAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading && <Loader2 className="size-4 animate-spin" />}
                Confirm {modalAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
