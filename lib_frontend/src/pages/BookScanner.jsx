import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { apiClient } from '../api/client.js'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { BookOpen, Camera, Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft, Search } from 'lucide-react'

export default function BookScanner() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [scanStatus, setScanStatus] = useState('idle')
  const [scannedIsbn, setScannedIsbn] = useState('')
  const [manualIsbn, setManualIsbn] = useState('')
  const [bookDetails, setBookDetails] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [borrowing, setBorrowing] = useState(false)

  const scannerRef = useRef(null)
  const isProcessing = useRef(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const initScanner = () => {
    try {
      const scanner = new Html5Qrcode('scanner-view')
      scannerRef.current = scanner
      
      scanner.start(
        { facingMode: "environment" },
        {
          fps: 25,
          qrbox: (width, height) => {
            // Optimize scan area for barcodes (wider than tall)
            const widthRatio = width > 400 ? 0.7 : 0.85;
            const targetWidth = Math.floor(width * widthRatio);
            return {
              width: targetWidth,
              height: Math.floor(targetWidth * 0.5)
            };
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        onScanSuccess,
        onScanError
      ).catch(err => {
        console.error('Failed to start scanner:', err)
        setErrorMsg('Camera access is restricted or unavailable.')
        setScanStatus('error')
      })
    } catch (err) {
      console.error('Failed to create html5-qrcode:', err)
      setErrorMsg('Camera initialization failed.')
      setScanStatus('error')
    }
  }

  const startScanner = () => {
    isProcessing.current = false
    setScanStatus('scanning')
    setErrorMsg('')
    setBookDetails(null)

    setTimeout(() => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear()
            initScanner()
          }).catch(() => {
            scannerRef.current.clear()
            initScanner()
          })
        } catch(e) {
          scannerRef.current.clear()
          initScanner()
        }
      } else {
        initScanner()
      }
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) scannerRef.current.clear()
        }).catch(() => {
          if (scannerRef.current) scannerRef.current.clear()
        })
      } catch (err) {
        console.warn('Scanner stop warning:', err)
      }
    }
  }

  useEffect(() => {
    startScanner()
    return () => stopScanner()
  }, [])

  const onScanSuccess = (decodedText) => {
    if (isProcessing.current) return
    isProcessing.current = true
    
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(console.warn)
      } catch(e) {}
    }
    resolveBook(decodedText)
  }

  const onScanError = () => {
  }

  const resolveBook = async (isbn) => {
    setScannedIsbn(isbn)
    setScanStatus('searching')
    setErrorMsg('')

    try {
      const response = await apiClient.get(`/api/books/isbn/${isbn}`)
      setBookDetails(response.data)
      setScanStatus('found')
    } catch (err) {
      setBookDetails(null)
      setErrorMsg(err.message || 'Book not found in database.')
      setScanStatus('error')
    }
  }

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (!manualIsbn.trim()) return
    stopScanner()
    resolveBook(manualIsbn.trim())
  }

  const handleRequestBorrow = async () => {
    if (!user || !scannedIsbn) return
    setBorrowing(true)
    setErrorMsg('')

    try {
      await apiClient.post('/api/borrow/request', {
        userId: user.id,
        isbn: scannedIsbn
      })
      setScanStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit borrow request')
      setScanStatus('error')
    } finally {
      setBorrowing(false)
    }
  }

  return (
    <div className="min-h-screen w-full text-white text-white flex flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/20 text-white/90 px-4 backdrop-blur-md">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </button>
          
          <span className="text-sm font-bold tracking-wider uppercase text-blue-500">
            Book Scanner
          </span>

          <div className="size-6 opacity-0" />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto w-full justify-center">
        <div className={scanStatus === 'scanning' ? 'flex flex-col items-center gap-6' : 'hidden'}>
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden border border-white/20 bg-black/80 flex items-center justify-center">
            <div className="absolute inset-4 rounded-xl border border-white/20 pointer-events-none" />
            <div className="absolute left-4 top-4 size-5 border-t-2 border-l-2 border-blue-500 pointer-events-none" />
            <div className="absolute right-4 top-4 size-5 border-t-2 border-r-2 border-blue-500 pointer-events-none" />
            <div className="absolute left-4 bottom-4 size-5 border-b-2 border-l-2 border-blue-500 pointer-events-none" />
            <div className="absolute right-4 bottom-4 size-5 border-b-2 border-r-2 border-blue-500 pointer-events-none" />
            
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 animate-bounce pointer-events-none" />

            <div id="scanner-view" className="w-full h-full text-white" />
          </div>

          <div className="w-full max-w-[320px] glass-panel border border-white/20 p-4 rounded-2xl text-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <Camera className="size-3" /> Live Feed Active
            </span>
            <p className="text-xs text-slate-300 mt-2">
              Center the ISBN barcode or book QR code in the viewport area
            </p>
          </div>
        </div>

        {scanStatus === 'searching' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="size-10 text-blue-500 animate-spin" />
            <h3 className="font-bold text-slate-200 mt-4 text-sm uppercase tracking-wider">Resolving shelf ISBN...</h3>
            <p className="text-xs text-blue-200 mt-1.5">Querying central inventory database</p>
          </div>
        )}

        {scanStatus === 'found' && bookDetails && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-white/20 glass-panel p-6 shadow-xl text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <BookOpen className="size-6" />
              </div>
              
              <h3 className="text-lg font-bold text-white mt-4">{bookDetails.title}</h3>
              <p className="text-xs text-blue-200 mt-1">Author: {bookDetails.author}</p>
              
              <div className="mt-4 border-t border-white/20 pt-4 flex flex-col gap-2.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-blue-200">ISBN-13 Code</span>
                  <span className="font-semibold text-slate-200 font-mono">{bookDetails.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Availability</span>
                  <span className={`font-semibold ${bookDetails.status === 'AVAILABLE' ? 'text-green-400' : 'text-amber-300'}`}>
                    {bookDetails.status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRequestBorrow}
                disabled={borrowing || bookDetails.status !== 'AVAILABLE'}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {borrowing ? 'Submitting Request...' : 'Confirm & Request Borrow'}
              </button>
              
              <button
                type="button"
                onClick={startScanner}
                className="w-full rounded-xl border border-white/20 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Cancel & Rescan
              </button>
            </div>
          </div>
        )}

        {scanStatus === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <CheckCircle2 className="size-8 animate-pulse" />
            </div>
            
            <h3 className="text-lg font-bold text-white mt-4">Borrow Request Submitted!</h3>
            <p className="text-xs text-blue-200 mt-2 max-w-xs leading-relaxed">
              Your lending request has been logged. Please proceed to the library desk to pick up the book once the librarian approves.
            </p>

            <div className="mt-8 flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => navigate('/student')}
                className="w-full rounded-xl glass-panel py-3.5 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Return to Dashboard
              </button>
              
              <button
                type="button"
                onClick={startScanner}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Scan Another Book
              </button>
            </div>
          </div>
        )}

        {scanStatus === 'error' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertCircle className="size-5" />
              </div>
              <h3 className="font-semibold text-white mt-3 text-sm">Failed to Resolve Book</h3>
              <p className="text-xs text-blue-200 mt-1.5">{errorMsg || 'An unknown error occurred.'}</p>
            </div>

            <button
              type="button"
              onClick={startScanner}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="size-3.5" /> Try Scanning Again
            </button>
          </div>
        )}

        <div className={scanStatus === 'scanning' ? 'mt-8 border-t border-white/20 pt-6' : 'hidden'}>
          <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider text-center">Cannot Scan? Entry Fallback</h4>
          <form onSubmit={handleManualSearch} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-blue-200" />
              <input
                type="text"
                placeholder="Enter ISBN Code manually"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
                className="w-full rounded-xl border border-white/20 text-white/60 py-3.5 pl-10 pr-4 text-xs text-white placeholder:text-blue-200 outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl glass-panel px-4 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Search
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
