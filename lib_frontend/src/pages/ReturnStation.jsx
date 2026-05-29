import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { 
  ChevronLeft, ScanLine, CheckCircle2, 
  AlertCircle, Loader2, Laptop 
} from 'lucide-react'

export default function ReturnStation() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State controls
  const [returnStatus, setReturnStatus] = useState('idle')
  const [isbn, setIsbn] = useState('')
  const [studentId, setStudentId] = useState('')
  const [sessionHistory, setSessionHistory] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successDetails, setSuccessDetails] = useState(null)

  // Invisible input ref for barcode gun
  const barcodeInputRef = useRef(null)
  const scannerRef = useRef(null)

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/student')
    }
  }, [user, navigate])

  // Keep barcode gun input focused at all times
  useEffect(() => {
    const keepFocused = () => {
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
    if (!isbn.trim() || !studentId.trim()) {
      setErrorMsg('Please specify both Student ID and Book ISBN.')
      setReturnStatus('error')
      return
    }
    processReturn(Number(studentId), isbn.trim())
  }

  // Camera QR scanner integration
  const startCameraScanner = () => {
    setReturnStatus('scanning')
    setErrorMsg('')
    
    setTimeout(() => {
      try {
        if (scannerRef.current) {
          scannerRef.current.clear()
        }

        const scanner = new Html5QrcodeScanner(
          'kiosk-camera-scanner',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        )
        scannerRef.current = scanner
        scanner.render((text) => {
          scanner.clear().catch(e => console.error(e))
          scannerRef.current = null
          
          if (!studentId) {
            setErrorMsg('Please specify Student ID manually before scanning the ISBN barcode.')
            setReturnStatus('error')
          } else {
            processReturn(Number(studentId), text.trim())
          }
        }, () => {})
      } catch (err) {
        setErrorMsg('Camera access failed or is blocked.')
        setReturnStatus('error')
      }
    }, 150)
  }

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(e => console.warn(e))
      scannerRef.current = null
    }
    setReturnStatus('idle')
  }

  // Process return request
  const processReturn = async (sId, isbnCode) => {
    setReturnStatus('processing')
    setErrorMsg('')
    
    try {
      const response = await apiClient.post('/api/borrow/return', null, {
        params: {
          userId: sId,
          isbn: isbnCode
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
        setReturnStatus('idle')
        setSuccessDetails(null)
      }, 4000)

    } catch (err) {
      setErrorMsg(err.message || 'Lending return processing failed.')
      setReturnStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Kiosk Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ChevronLeft className="size-4" />
            Admin Overview
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Laptop className="size-4" />
            </div>
            <span className="font-bold tracking-tight text-slate-800 text-sm">
              Return Station Kiosk
            </span>
          </div>

          <div className="size-6 opacity-0" />
        </div>
      </header>

      {/* Main Kiosk Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Kiosk Panel */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="w-full max-w-md flex flex-col gap-6">
            
            {/* Status Views */}
            {returnStatus === 'idle' && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                  <ScanLine className="size-8 animate-pulse" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800">Waiting for Barcode Scan...</h2>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Position the book&apos;s barcode 5-10cm below the hardware laser gun scanner, or use the camera scanning widget.
                </p>

                {/* Form to capture barcode gun values */}
                <form onSubmit={handleGunScanSubmit} className="w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex flex-col gap-4 mt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barcode Gun Capture</h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Student User ID</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Student ID (e.g. 1)"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Book ISBN Code</label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      required
                      placeholder="Click here & Scan with Gun / Enter ISBN"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Use Camera Stream
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

            {returnStatus === 'scanning' && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div id="kiosk-camera-scanner" className="w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border bg-black text-slate-800" />
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel Camera Scan
                </button>
              </div>
            )}

            {returnStatus === 'processing' && (
              <div className="text-center py-12 flex flex-col items-center">
                <Loader2 className="size-10 text-blue-500 animate-spin" />
                <h3 className="font-bold text-slate-800 mt-4 text-sm">Processing Kiosk Return...</h3>
                <p className="text-xs text-slate-400 mt-1">Syncing transactions and updating inventory database</p>
              </div>
            )}

            {returnStatus === 'success' && successDetails && (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="size-8 animate-pulse" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">Return Successful!</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Book &quot;{successDetails.bookTitle}&quot; has been checked back in. Inventory availability incremented.
                </p>

                <div className="w-full bg-white border border-slate-200/80 p-5 rounded-2xl text-left text-xs flex flex-col gap-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student</span>
                    <span className="font-bold text-slate-700">{successDetails.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Book ISBN</span>
                    <span className="font-mono text-slate-600">{successDetails.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Borrow Date</span>
                    <span>{new Date(successDetails.requestDate || successDetails.borrowDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 mt-4 animate-pulse">Auto-resetting kiosk stream...</span>
              </div>
            )}

            {returnStatus === 'error' && (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle className="size-6" />
                </div>
                <h3 className="font-bold text-slate-800">Kiosk Return Blocked</h3>
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
        <aside className="w-full max-w-sm shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Kiosk Session Returns</h3>
            
            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
              {sessionHistory.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No books returned in this session.</p>
              ) : (
                sessionHistory.map((item, idx) => (
                  <div key={item.id || idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex gap-3 text-xs">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold text-[10px]">
                      OK
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {item.student}</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">{item.isbn}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Station Status</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Kiosk Online
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
