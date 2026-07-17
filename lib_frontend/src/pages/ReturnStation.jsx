import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import {
  ChevronLeft, ScanLine, CheckCircle2,
  AlertCircle, Loader2, Laptop, UserCheck,
  Library, ClipboardList, BookOpen, Clock, Users, LogOut
, Bookmark
} from 'lucide-react'

export default function ReturnStation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State controls
  const [returnStatus, setReturnStatus] = useState('idle')
  const [isbn, setIsbn] = useState('')
  const [studentId, setStudentId] = useState('')
  const [accessionNumber, setAccessionNumber] = useState('')
  const [sessionHistory, setSessionHistory] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successDetails, setSuccessDetails] = useState(null)

  // Input refs for barcode gun and student ID
  const barcodeInputRef = useRef(null)
  const studentInputRef = useRef(null)
  const accessionInputRef = useRef(null)
  const isProcessing = useRef(false)

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  // Keep barcode gun input focused at all times except when user is typing student ID
  useEffect(() => {
    const keepFocused = () => {
      if (document.activeElement === studentInputRef.current || document.activeElement === accessionInputRef.current) {
        return
      }
      if (barcodeInputRef.current && returnStatus === 'idle') {
        barcodeInputRef.current.focus()
      }
    }

    keepFocused()
    const interval = setInterval(keepFocused, 1000)
    return () => clearInterval(interval)
  }, [returnStatus])

  // Handle USB Gun Scan Submit (auto trigger when barcode is entered via gun)
  const handleGunScanSubmit = (e) => {
    e.preventDefault()
    if (!isbn.trim() || !studentId.trim() || !accessionNumber.trim()) {
      setErrorMsg('Please specify Student ID, Book ISBN, and Accession Number.')
      setReturnStatus('error')
      return
    }
    processReturn(Number(studentId), isbn.trim(), accessionNumber.trim())
  }
  const processReturn = async (sId, isbnCode, accNum) => {
    setReturnStatus('processing')
    setErrorMsg('')

    try {
      const response = await apiClient.post('/api/borrow/return', null, {
        params: {
          userId: sId,
          isbn: isbnCode,
          accessionNumber: accNum
        }
      })

      const details = response.data
      setSuccessDetails(details)
      setReturnStatus('success')

      // Add to session logs
      setSessionHistory(prev => [
        {
          id: details.id,
          title: details.bookTitle || 'Unknown Title',
          student: details.userName || `Student #${sId}`,
          isbn: isbnCode,
          timestamp: new Date()
        },
        ...prev
      ])

      // Auto reset to idle after 4 seconds
      setTimeout(() => {
        setIsbn('')
        setAccessionNumber('')
        setReturnStatus('idle')
        setSuccessDetails(null)
      }, 4000)

    } catch (err) {
      setErrorMsg(err.message || 'Lending return processing failed.')
      setReturnStatus('error')
    }
  }

  const processExtend = async (sId, isbnCode, accNum) => {
    setReturnStatus('processing')
    setErrorMsg('')

    try {
      const response = await apiClient.post('/api/borrow/extend', null, {
        params: {
          userId: sId,
          isbn: isbnCode,
          accessionNumber: accNum
        }
      })

      const details = response.data
      setSuccessDetails(details)
      setReturnStatus('extension_success')

      // Add to session logs
      setSessionHistory(prev => [
        {
          id: details.id,
          title: details.bookTitle || 'Unknown Title',
          student: details.userName || `Student #${sId}`,
          isbn: isbnCode,
          timestamp: new Date(),
          isExtension: true
        },
        ...prev
      ])

      // Auto reset to idle after 4 seconds
      setTimeout(() => {
        setIsbn('')
        setAccessionNumber('')
        setReturnStatus('idle')
        setSuccessDetails(null)
      }, 4000)

    } catch (err) {
      setErrorMsg(err.message || 'Loan extension failed.')
      setReturnStatus('error')
    }
  }

  const handleExtendClick = (e) => {
    e.preventDefault()
    if (!isbn.trim() || !studentId.trim() || !accessionNumber.trim()) {
      setErrorMsg('Please specify Student ID, Book ISBN, and Accession Number to extend loan.')
      setReturnStatus('error')
      return
    }
    processExtend(Number(studentId), isbn.trim(), accessionNumber.trim())
  }

  return (
    <div className="h-screen flex text-white">
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
            >
              <ClipboardList className="size-4.5" />
              Borrow Requests
            </button>
            <button
              onClick={() => navigate('/admin/reservations')}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white text-left transition"
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/10 border border-white/20 text-left transition"
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
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Kiosk Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/20 glass-panel px-6 shadow-xl backdrop-blur-md">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition"
          >
            <ChevronLeft className="size-4" />
            Admin Overview
          </button>

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Laptop className="size-4" />
            </div>
            <span className="font-bold tracking-tight text-white text-sm">
              Return Station
            </span>
          </div>

          <div className="size-6 opacity-0" />
        </div>
      </header>

      {/* Main Kiosk Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md flex flex-col gap-6">

            {/* Status Views */}
            {returnStatus === 'idle' && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                  <ScanLine className="size-8 animate-pulse" />
                </div>

                <h2 className="text-2xl font-bold text-white">Waiting for Barcode Scan...</h2>
                <p className="text-xs text-blue-200 max-w-sm leading-relaxed">
                  Position the book&apos;s barcode 5-10cm below the hardware laser gun scanner.
                </p>

                {/* Form to capture barcode gun values */}
                <form onSubmit={handleGunScanSubmit} className="w-full glass-panel bg-white/5 border border-white/20 p-6 rounded-2xl shadow-xl text-left flex flex-col gap-4 mt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Barcode Gun Capture</h4>

                  <div>
                    <label className="text-[10px] font-bold text-blue-200 uppercase">Student User ID</label>
                    <input
                      ref={studentInputRef}
                      type="text"
                      required
                      placeholder="Enter Student ID (e.g. 1)"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-blue-200 uppercase">Book ISBN Code</label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      required
                      placeholder="Click here & Scan with Gun / Enter ISBN"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-blue-200 uppercase">Accession Number</label>
                    <input
                      ref={accessionInputRef}
                      type="text"
                      required
                      placeholder="Enter Accession Number"
                      value={accessionNumber}
                      onChange={(e) => setAccessionNumber(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 glass-input px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:glass-panel"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handleExtendClick}
                      className="rounded-xl border border-blue-500 text-blue-400 py-3 text-xs font-semibold hover:bg-blue-500/10 transition"
                    >
                      Extend Loan
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Process Return
                    </button>
                  </div>
                </form>
              </div>
            )}

            {returnStatus === 'processing' && (
              <div className="text-center py-12 flex flex-col items-center">
                <Loader2 className="size-10 text-blue-500 animate-spin" />
                <h3 className="font-bold text-white mt-4 text-sm">Processing Kiosk Return...</h3>
                <p className="text-xs text-blue-200 mt-1">Syncing transactions and updating inventory database</p>
              </div>
            )}

            {returnStatus === 'success' && successDetails && (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="size-8 animate-pulse" />
                </div>

                <h3 className="text-lg font-bold text-white">Return Successful!</h3>
                <p className="text-xs text-blue-200 max-w-xs leading-relaxed">
                  Book &quot;{successDetails.bookTitle}&quot; has been checked back in. Inventory availability incremented.
                </p>

                <div className="w-full glass-panel border border-white/20/80 p-5 rounded-2xl text-left text-xs flex flex-col gap-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Student</span>
                    <span className="font-bold text-white">{successDetails.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Book ISBN</span>
                    <span className="font-mono text-blue-100">{successDetails.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Borrow Date</span>
                    <span>{new Date(successDetails.requestDate || successDetails.borrowDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <span className="text-[10px] text-blue-200 mt-4 animate-pulse">Auto-resetting kiosk stream...</span>
              </div>
            )}

            {returnStatus === 'extension_success' && successDetails && (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex size-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <CheckCircle2 className="size-8 animate-pulse" />
                </div>

                <h3 className="text-lg font-bold text-white">Loan Extended!</h3>
                <p className="text-xs text-blue-200 max-w-xs leading-relaxed">
                  Book &quot;{successDetails.bookTitle}&quot; loan has been extended by 7 days. (Extensions: {successDetails.extensionCount}/2)
                </p>

                <div className="w-full glass-panel border border-white/20/80 p-5 rounded-2xl text-left text-xs flex flex-col gap-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Student</span>
                    <span className="font-bold text-white">{successDetails.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Book ISBN</span>
                    <span className="font-mono text-blue-100">{successDetails.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">New Due Date</span>
                    <span className="font-bold text-blue-400">{new Date(successDetails.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <span className="text-[10px] text-blue-200 mt-4 animate-pulse">Auto-resetting kiosk stream...</span>
              </div>
            )}

            {returnStatus === 'error' && (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle className="size-6" />
                </div>
                <h3 className="font-bold text-white">Kiosk Return Blocked</h3>
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl max-w-sm font-medium">
                  {errorMsg || 'An unknown error occurred while submitting.'}
                </p>
                <button
                  type="button"
                  onClick={() => setReturnStatus('idle')}
                  className="mt-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Reset Kiosk
                </button>
              </div>
            )}

          </div>
        </main>

        {/* Kiosk Session History Sidebar */}
        <aside className="w-full max-w-sm shrink-0 border-t lg:border-t-0 lg:border-l border-white/20 glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Kiosk Session Returns</h3>

            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
              {sessionHistory.length === 0 ? (
                <p className="text-blue-200 text-xs py-4 text-center">No books returned in this session.</p>
              ) : (
                sessionHistory.map((item, idx) => (
                  <div key={item.id || idx} className="rounded-xl border border-white/20 glass-panel p-3 flex gap-3 text-xs">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] ${item.isExtension ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {item.isExtension ? 'EXT' : 'OK'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-blue-200 mt-0.5">By: {item.student} {item.isExtension && '(Extended)'}</p>
                      <p className="text-[9px] text-blue-200 mt-1 font-mono">{item.isbn}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mt-6">
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Station Status</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                Kiosk Online
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </div>
  )
}
