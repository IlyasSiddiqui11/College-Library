import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { 
  Banknote, Loader2, BookOpen, FileText, History, User, LogOut, CheckCircle2, AlertCircle
} from 'lucide-react'

export default function StudentFines() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchFines = async () => {
      if (!user) return
      setLoading(true)
      try {
        const response = await apiClient.get(`/api/fines/user/${user.id}`)
        setFines(response.data)
      } catch (err) {
        console.error('Failed to fetch fines:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFines()
  }, [user])

  if (!user) return null

  const outstandingFines = fines.filter(f => f.status === 'PENDING' || f.status === 'UNPAID')
  const totalOutstanding = outstandingFines.reduce((acc, f) => acc + f.totalFine, 0)

  return (
    <div className="relative flex min-h-screen w-full flex-col text-slate-900 pb-32">
      <header className="sticky top-0 z-20 border-b border-slate-200 glass-panel px-4 py-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BCOE-lib" className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/student')} />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              My Fines
            </span>
          </div>
          
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="flex size-9 items-center justify-center rounded-full glass-panel text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-6 flex flex-col gap-6">
        <section className={`flex flex-col gap-1.5 glass-panel p-5 rounded-2xl border shadow-xl ${totalOutstanding > 0 ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase tracking-wider">
            Total Outstanding Fines
          </h1>
          <p className={`text-3xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{totalOutstanding}
          </p>
          {totalOutstanding > 0 && (
            <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="size-3" /> Please pay at the library desk to resume borrowing.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-slate-900">Fines History</h2>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="size-6 animate-spin text-slate-500" />
                <span className="text-xs text-slate-500 mt-2">Loading your fine history...</span>
              </div>
            ) : fines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 glass-panel px-4 py-8 text-center">
                <CheckCircle2 className="size-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No fines found</p>
                <p className="text-xs text-slate-500 mt-1">You have a clean record. Great job returning books on time!</p>
              </div>
            ) : (
              fines.map((fine) => (
                <div 
                  key={fine.id} 
                  className={`rounded-2xl border ${fine.status === 'PAID' ? 'border-slate-200' : 'border-red-200 bg-red-50/10'} glass-panel p-4 shadow-lg backdrop-blur-md`}
                >
                  <div className="flex gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${fine.status === 'PAID' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                      <Banknote className="size-5.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-900 truncate text-sm max-w-[180px]">
                          {fine.bookTitle}
                        </h4>
                        <span className={`text-[9px] font-bold border rounded-full px-2 py-0.5 tracking-wide ${
                          fine.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {fine.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2">
                        <span>Delay: <strong className="text-red-600">{fine.delayDays} days</strong> (₹{fine.delayAmount || 0})</span>
                        {fine.lostBookAmount > 0 && (
                          <span className="bg-red-50 text-red-600 px-1 rounded border border-red-100">Lost Book: ₹{fine.lostBookAmount}</span>
                        )}
                      </p>
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-[9px] text-slate-500">
                          <p>Issued: {new Date(fine.createdAt).toLocaleDateString()}</p>
                          {fine.status === 'PAID' && <p className="text-green-600 font-medium">Paid on: {new Date(fine.verificationDate).toLocaleDateString()}</p>}
                        </div>
                        <p className="text-sm font-bold text-slate-900">₹{fine.totalFine}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
        <div className="flex items-center justify-around rounded-full border border-slate-200 glass-panel px-2 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <BookOpen className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <FileText className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Catalog</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/student/fines')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full bg-white/25 text-blue-600 shadow-lg transition"
          >
            <Banknote className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Fines</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <History className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <User className="size-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
