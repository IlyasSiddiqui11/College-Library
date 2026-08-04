import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  Banknote, Search, Loader2, Check, Clock, Download, ShieldAlert
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function AdminFines() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [fines, setFines] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [billNumbers, setBillNumbers] = useState({})

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  const fetchFines = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/api/fines?size=1000&sort=createdAt,desc')
      if (response.data && response.data.content) {
        setFines(response.data.content)
      } else {
        setFines([])
      }
    } catch (err) {
      console.error('Failed to fetch fines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFines()
  }, [user])

  const handleMarkAsPaid = async (fineId) => {
    setActionLoadingId(fineId)
    try {
      const fineBillNumber = billNumbers[fineId] || ''
      if (!fineBillNumber) {
        throw new Error("Bill Number is required")
      }
      if (fineBillNumber.length > 15) {
        throw new Error("Bill Number must not exceed 15 digits")
      }
      await apiClient.put(`/api/fines/${fineId}/status?adminName=${encodeURIComponent(user.name)}`, {
        status: 'PAID',
        billNumber: fineBillNumber
      })
      await fetchFines()
    } catch (err) {
      alert('Failed to mark as paid: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleBillNumberChange = (id, val) => {
    // only allow digits, up to 15
    const digitsOnly = val.replace(/\D/g, '').slice(0, 15)
    setBillNumbers(prev => ({ ...prev, [id]: digitsOnly }))
  }

  if (!user) return null

  const filteredFines = fines
    .filter((fine) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        (fine.studentName?.toLowerCase() || '').includes(q) ||
        (fine.enrollmentNumber?.toLowerCase() || '').includes(q) ||
        (fine.bookTitle?.toLowerCase() || '').includes(q)
      
      const matchesStatus = filterStatus === 'ALL' || fine.status === filterStatus
      return matchesSearch && matchesStatus
    })

  const pendingCount = fines.filter((r) => r.status === 'PENDING').length
  const unpaidCount = fines.filter((r) => r.status === 'UNPAID').length

  const totalFineCollected = fines
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + (f.totalFine || 0), 0)

  const totalPendingAmount = fines
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + (f.totalFine || 0), 0)

  const totalUnpaidAmount = fines
    .filter(f => f.status === 'UNPAID')
    .reduce((sum, f) => sum + (f.totalFine || 0), 0)

  const handleExport = () => {
    const headers = ['Fine ID', 'Student', 'Email', 'Book Title', 'Delay Days', 'Delay Amount (Rs)', 'Lost Book Amount (Rs)', 'Total Fine (Rs)', 'Status', 'Verified By', 'Verification Date', 'Bill Number']
    const csvRows = [
      headers.join(','),
      ...filteredFines.map(fine => {
        return [
          `"${fine.id}"`,
          `"${(fine.studentName || '').replace(/"/g, '""')}"`,
          `"${(fine.enrollmentNumber || '').replace(/"/g, '""')}"`,
          `"${(fine.bookTitle || '').replace(/"/g, '""')}"`,
          `"${fine.delayDays || 0}"`,
          `"${fine.delayAmount || 0}"`,
          `"${fine.lostBookAmount || 0}"`,
          `"${fine.totalFine || 0}"`,
          `"${fine.status}"`,
          `"${fine.verifiedBy || ''}"`,
          `"${fine.verificationDate ? new Date(fine.verificationDate).toLocaleString() : ''}"`,
          `"${fine.billNumber || ''}"`
        ].join(',')
      })
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `fines_report_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen flex text-slate-900">
      <AdminSidebar user={user} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Fine Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Track overdue fines and manage payments</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || filteredFines.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student or book..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 rounded-xl border border-slate-200 glass-input py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:glass-panel transition"
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'PAID', label: 'Paid' },
                  { id: 'UNPAID', label: 'Unpaid' }
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

        <main className="flex-1 p-8 grid grid-cols-1 gap-8 max-w-[1440px] mx-auto w-full">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-sm flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <Banknote className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
                <p className="text-2xl font-black text-slate-900">₹{totalFineCollected}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-sm flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Verification</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900">₹{totalPendingAmount}</p>
                  <p className="text-xs font-bold text-slate-500">({pendingCount} requests)</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-sm flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Unpaid</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900">₹{totalUnpaidAmount}</p>
                  <p className="text-xs font-bold text-slate-500">({unpaidCount} students)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 glass-panel p-5 shadow-xl flex flex-col gap-4 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 px-1">Fines Log</h3>
            
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-4 font-semibold">Student</th>
                    <th className="pb-3 px-4 font-semibold">Book Title</th>
                    <th className="pb-3 px-4 font-semibold text-center">Delay</th>
                    <th className="pb-3 px-4 font-semibold text-right">Delay (₹)</th>
                    <th className="pb-3 px-4 font-semibold text-right">Lost (₹)</th>
                    <th className="pb-3 px-4 font-semibold text-right">Total (₹)</th>
                    <th className="pb-3 px-4 font-semibold text-center">Status</th>
                    <th className="pb-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="size-6 animate-spin text-slate-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredFines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                        No fines found.
                      </td>
                    </tr>
                  ) : (
                    filteredFines.map((fine) => (
                      <tr key={fine.id} className="border-b border-slate-50 hover:bg-slate-100 transition">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900">{fine.studentName}</p>
                          <p className="text-[10px] text-slate-500">{fine.enrollmentNumber}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 max-w-[200px] truncate" title={fine.bookTitle}>
                            {fine.bookTitle}
                          </p>
                          <p className="text-[10px] text-slate-500">Acc#: {fine.accessionNumber || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-red-600">{fine.delayDays} days</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-semibold text-slate-700">₹{fine.delayAmount}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-semibold text-slate-700">₹{fine.lostBookAmount}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-bold text-slate-900">₹{fine.totalFine}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {fine.status === 'PENDING' && (
                            <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200/40">
                              PENDING
                            </span>
                          )}
                          {fine.status === 'PAID' && (
                            <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-green-50 text-green-700 font-bold text-[9px] border border-green-200/40">
                              PAID
                            </span>
                          )}
                          {fine.status === 'UNPAID' && (
                            <span className="inline-block w-[72px] text-center py-0.5 rounded-sm bg-red-50 text-red-700 font-bold text-[9px] border border-red-200/40">
                              UNPAID
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-center justify-center gap-2">
                            {fine.status !== 'PAID' ? (
                              <>
                                <input 
                                  type="text" 
                                  placeholder="Bill Number (Max 15)" 
                                  maxLength={15}
                                  className="text-[10px] px-2 py-1 rounded border border-slate-200 w-32"
                                  value={billNumbers[fine.id] || ''}
                                  onChange={(e) => handleBillNumberChange(fine.id, e.target.value)}
                                />
                                <button
                                  disabled={actionLoadingId === fine.id}
                                  onClick={() => handleMarkAsPaid(fine.id)}
                                  className="flex items-center justify-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-green-700 disabled:opacity-50 mt-1"
                                >
                                  {actionLoadingId === fine.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                  Mark Paid
                                </button>
                              </>
                            ) : (
                              <div className="text-[9px] text-slate-500 text-center">
                                <p>Verified by {fine.verifiedBy}</p>
                                <p>{new Date(fine.verificationDate).toLocaleDateString()}</p>
                                {fine.billNumber && <p className="font-bold text-slate-700 mt-0.5">Bill: {fine.billNumber}</p>}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
