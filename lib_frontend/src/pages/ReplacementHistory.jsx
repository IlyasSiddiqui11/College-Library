import { useState, useEffect } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../api/client'
import {
  Search, History, Download
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function ReplacementHistory() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [replacements, setReplacements] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  const fetchReplacements = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/replacements')
      setReplacements(res.data || [])
    } catch (err) {
      console.error('Error fetching replacements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplacements()
  }, [])

  const filteredItems = replacements.filter(item => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      (item.originalTitle?.toLowerCase().includes(query)) ||
      (item.originalIsbn?.includes(query)) ||
      (item.replacementTitle?.toLowerCase().includes(query)) ||
      (item.replacementIsbn?.includes(query)) ||
      (item.studentName?.toLowerCase().includes(query))
    )
    const matchesUserType = userTypeFilter === 'ALL' || item.userRole === userTypeFilter
    return matchesSearch && matchesUserType
  })

  // Date formatter
  
  const handleExport = () => {
    const userHeader = userTypeFilter === 'STUDENT' ? 'STUDENT' : userTypeFilter === 'STAFF' ? 'STAFF' : 'USER'
    const headers = ['Original Title', 'Original Accession', 'Replacement Title', 'Replacement Accession', `${userHeader} Name`, 'Replaced By', 'Date']
    const csvRows = [
      headers.join(','),
      ...filteredItems.map(item => {
        return [
          `"${(item.originalTitle || '').replace(/"/g, '""')}"`,
          `"${(item.originalAccession || '')}"`,
          `"${(item.replacementTitle || '').replace(/"/g, '""')}"`,
          `"${(item.replacementAccession || '')}"`,
          `"${(item.studentName || '').replace(/"/g, '""')}"`,
          `"${(item.replacedByAdmin || '')}"`,
          `"${item.replacementDate ? new Date(item.replacementDate).toLocaleString() : ''}"`
        ].join(',')
      })
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `replacement_history_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="h-screen flex text-slate-900">
      <AdminSidebar user={user} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <History className="size-5 text-indigo-600" />
                Replacement History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {filteredItems.length} records found • Track and manage books replaced due to loss or damage
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CustomSelect
                value={userTypeFilter}
                onChange={(val) => setUserTypeFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Users' },
                  { value: 'STUDENT', label: 'Students' },
                  { value: 'STAFF', label: 'Staff' }
                ]}
                className="w-32"
              />
              {/* Search */}
              <input
                type="text"
                placeholder="Search by title, ISBN, or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-xl border border-slate-200 glass-input py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition"
              />

              <button
                onClick={handleExport}
                disabled={loading || filteredItems.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 glass-panel px-3.5 py-2 text-xs font-bold text-green-600 hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                <Download className="size-3.5" />
                Export
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full bg-slate-50">

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading replacements...</p>
            </div>
          </div>
        )}

        {/* Content Table */}
        {!loading && filteredItems.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Replacement Info</th>
                    <th className="px-6 py-4">Original Book</th>
                    <th className="px-6 py-4">Replacement Book</th>
                    <th className="px-6 py-4">{userTypeFilter === 'STUDENT' ? 'STUDENT' : userTypeFilter === 'STAFF' ? 'STAFF' : 'USER'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">{formatDate(item.replacementDate)}</span>
                          <span className="text-xs text-slate-500">By Admin: {item.replacedByAdmin}</span>
                          {item.remarks && (
                            <span className="mt-1 text-xs text-slate-500 italic max-w-[150px] truncate" title={item.remarks}>
                              "{item.remarks}"
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-900 max-w-[200px] truncate">{item.originalTitle}</p>
                          <p className="text-[10px] text-slate-500">Acc No: <span className="font-mono text-slate-700 font-semibold">{item.originalAccessionNumber}</span></p>
                          <p className="text-[10px] text-slate-500">ISBN: {item.originalIsbn}</p>
                          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">
                            REPLACED
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-900 max-w-[200px] truncate">{item.replacementTitle}</p>
                          <p className="text-[10px] text-slate-500">Acc No: <span className="font-mono text-slate-700 font-semibold">{item.replacementAccessionNumber}</span></p>
                          <p className="text-[10px] text-slate-500">ISBN: {item.replacementIsbn}</p>
                          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            AVAILABLE
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {item.studentName && item.studentName !== 'Unknown' ? (
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                              {item.studentName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{item.studentName}</span>
                                {userTypeFilter === 'ALL' && item.userRole === 'STAFF' && (
                                  <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 tracking-wider">
                                    STAFF
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">ID: {item.studentId}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Student</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-400">
              <History className="size-8" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">No replacements found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {searchQuery ? "We couldn't find any replacements matching your search criteria." : "There are currently no book replacements recorded in the system."}
            </p>
          </div>
        )}

      </main>
      </div>
    </div>
  )
}
