import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  Library, LogOut, ChevronLeft, Loader2, Bookmark,
  BookOpen, Users, ClipboardList, Clock, UserCheck, ArrowLeft
} from 'lucide-react'

export default function AdminReservations() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/borrow')
      const reserved = res.data.filter(req => req.status === 'RESERVED')
      // Sort by requestDate ascending (FIFO queue)
      reserved.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())
      setReservations(reserved)
    } catch (err) {
      console.error('Failed to fetch reservations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchReservations()
    }
  }, [user])

  if (!user) return null

  return (
    <div className="h-screen flex text-white">
      {/* Admin Sidebar Navigation */}
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <ClipboardList className="size-4.5" />
              Borrow Requests
            </button>
            <button
              onClick={() => navigate('/admin/reservations')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/10 border border-white/20 text-left transition"
            >
              <Bookmark className="size-4.5" />
              Reserve Books
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

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between rounded-xl glass-panel p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-blue-200 font-medium">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-blue-200 hover:text-red-600 hover:bg-red-50 transition"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg p-2 hover:bg-white/10 transition"
              >
                <ArrowLeft className="h-5 w-5 text-blue-100" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Bookmark className="size-5 text-blue-400" /> Reserved Books
                </h1>
                <p className="text-xs text-blue-200 mt-0.5">Students waiting for unavailable books</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 glass-panel p-6 shadow-xl flex flex-col gap-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Reservation Queue (FIFO)</h3>
              </div>
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                Total: {reservations.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/20 text-blue-200 font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Queue Pos</th>
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Book Title</th>
                    <th className="pb-3 font-semibold">ISBN</th>
                    <th className="pb-3 font-semibold">Reservation Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <Loader2 className="size-6 animate-spin text-blue-200 mx-auto" />
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-blue-200 font-medium">
                        No active reservations.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((req, idx) => (
                      <tr key={req.id} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="py-4 font-bold text-blue-400">#{idx + 1}</td>
                        <td className="py-4 font-bold text-white">{req.userName || `Student #${req.userId}`}</td>
                        <td className="py-4 font-bold text-white">{req.bookTitle}</td>
                        <td className="py-4 text-blue-200">{req.isbn}</td>
                        <td className="py-4 text-blue-200">{new Date(req.requestDate).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
