import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Plus, X, ScanLine, Loader2, PencilLine } from 'lucide-react'
import { apiClient } from '../api/client.js'
import { formatAndValidateIsbn } from '../utils/validation.js'

export default function AddAssetModal({
  isOpen,
  onClose,
  onSuccess,
  editingBook = null,
  isReplaceMode = false,
  originalAccession = '',
  studentId = ''
}) {
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [accessionNumbersList, setAccessionNumbersList] = useState([''])
  const [publisher, setPublisher] = useState('')
  const [edition, setEdition] = useState('')
  const [series, setSeries] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [price, setPrice] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState('')
  const [branch, setBranch] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [source, setSource] = useState('')
  const [classificationNumber, setClassificationNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (editingBook) {
        setIsbn(editingBook.isbn || '')
        setTitle(editingBook.title || '')
        setAuthor(editingBook.author || '')
        setPublisher(editingBook.publisher || '')
        setEdition(editingBook.edition || '')
        setSeries(editingBook.series || '')
        setPublicationYear(editingBook.publicationYear || '')
        setTotalPages(editingBook.totalPages || '')
        setPrice(editingBook.price ?? '')
        setBillNumber(editingBook.billNumber || '')
        setBillDate(editingBook.billDate || '')
        setBranch(editingBook.branch || '')
        setCategory(editingBook.category || '')
        setLanguage(editingBook.language || '')
        setSource(editingBook.source || '')
        setClassificationNumber(editingBook.classificationNumber || '')
        setQuantity(1)
        setAccessionNumbersList([editingBook.accessionNumber || ''])
      } else if (isReplaceMode) {
        setIsbn('')
        setTitle('')
        setAuthor('')
        setPublisher('')
        setEdition('')
        setSeries('')
        setPublicationYear('')
        setTotalPages('')
        setPrice('')
        setBillNumber('')
        setBillDate('')
        setBranch('')
        setCategory('')
        setLanguage('')
        setSource('')
        setClassificationNumber('')
        setQuantity(1)
        setAccessionNumbersList([originalAccession ? `${originalAccession}-R` : ''])
      } else {
        setIsbn('')
        setTitle('')
        setAuthor('')
        setPublisher('')
        setEdition('')
        setSeries('')
        setPublicationYear('')
        setTotalPages('')
        setPrice('')
        setBillNumber('')
        setBillDate('')
        setBranch('')
        setCategory('')
        setLanguage('')
        setSource('')
        setClassificationNumber('')
        setQuantity(1)
        setAccessionNumbersList([''])
      }
      setErrorMsg(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}) } catch (e) {}
      }
    }
  }, [])

  const initScanner = () => {
    try {
      const scanner = new Html5Qrcode('modal-camera-scanner')
      scannerRef.current = scanner
      scanner.start(
        { facingMode: 'environment' },
        {
          fps: 25,
          qrbox: (w) => ({ width: Math.floor(w * 0.7), height: Math.floor(w * 0.35) }),
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        (decodedText) => { setIsbn(decodedText.trim()); stopScanning() },
        () => {}
      ).catch(() => { setErrorMsg('Camera unavailable.'); setIsScanning(false) })
    } catch {
      setErrorMsg('Camera init failed.'); setIsScanning(false)
    }
  }

  const startScanning = () => {
    setIsScanning(true); setErrorMsg(null)
    setTimeout(initScanner, 100)
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => { if (scannerRef.current) scannerRef.current.clear() }).catch(() => { if (scannerRef.current) scannerRef.current.clear() })
      } catch {}
    }
    setIsScanning(false)
  }

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (editingBook || !isbn || isbn.trim().length < 10) return;
      try {
        const res = await apiClient.get(`/api/books/isbn/${encodeURIComponent(isbn.trim())}/details`);
        if (res.data) {
          if (!title) setTitle(res.data.title || '');
          if (!author) setAuthor(res.data.author || '');
          if (!publisher) setPublisher(res.data.publisher || '');
          if (!edition) setEdition(res.data.edition || '');
          if (!series) setSeries(res.data.series || '');
          if (!publicationYear) setPublicationYear(res.data.publicationYear || '');
          if (!category) setCategory(res.data.category || '');
          if (!totalPages) setTotalPages(res.data.totalPages || '');
          if (!language) setLanguage(res.data.language || '');
          if (!source) setSource(res.data.source || '');
          if (!classificationNumber) setClassificationNumber(res.data.classificationNumber || '');
        }
      } catch (err) {
        // Ignore errors
      }
    };
    
    const timeoutId = setTimeout(fetchBookDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [isbn, editingBook, title, author, publisher, edition, series, publicationYear, category, totalPages, language, source, classificationNumber]);

  const handleQuantityChange = (e) => {
    if (isReplaceMode) return;
    const val = Math.max(1, Number(e.target.value))
    setQuantity(val)
    setAccessionNumbersList(prev => {
      const next = [...prev]
      while (next.length < val) next.push('')
      while (next.length > val) next.pop()
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSaving(true)
    try {
      const validIsbn = formatAndValidateIsbn(isbn)
      if (!validIsbn) throw new Error('ISBN must be exactly 10 or 13 digits (excluding hyphens/spaces)')
      if (!title.trim()) throw new Error('Book title is required')
      if (!author.trim()) throw new Error('Author is required')

      const payload = {
        isbn: validIsbn, title: title.trim(), author: author.trim(),
        publisher: publisher.trim(), edition: edition.trim(), series: series.trim(),
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
        totalPages: totalPages ? parseInt(totalPages, 10) : null,
        price: price ? parseFloat(price) : null,
        billNumber: billNumber.trim(),
        billDate: billDate || null,
        branch: branch.trim(), category: category.trim(), language: language.trim(),
        source: source.trim(), classificationNumber: classificationNumber.trim()
      }

      if (isReplaceMode) {
        const replacementAcc = (accessionNumbersList[0] || '').trim()
        if (!replacementAcc) throw new Error('Accession number is required')
        if (!studentId) throw new Error('Student ID is missing')
        if (!originalAccession) throw new Error('Original Accession number is missing')

        await apiClient.post('/api/books/replace', {
          ...payload,
          quantity: 1,
          accessionNumbers: [replacementAcc],
          studentId: Number(studentId),
          originalAccessionNumber: originalAccession
        })
      } else if (editingBook) {
        const accessionNumber = (accessionNumbersList[0] || '').trim()
        if (!accessionNumber) throw new Error('Accession number is required')

        await apiClient.put(`/api/books/${editingBook.id}`, {
          ...payload,
          quantity: 1,
          accessionNumbers: [accessionNumber]
        })
      } else {
        const filledAccessions = accessionNumbersList.map(a => a.trim()).filter(Boolean)
        if (filledAccessions.length !== quantity) throw new Error('Enter accession numbers for all copies')

        await apiClient.post('/api/books', {
          ...payload,
          quantity,
          accessionNumbers: filledAccessions
        })
      }
      onSuccess()
    } catch (err) {
      setErrorMsg(err.message || (err.response?.data?.message) || 'Failed to register book asset')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-300 glass-panel shadow-2xl animate-in fade-in duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-300 bg-white/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              {isReplaceMode ? <Plus className="size-5 text-amber-500" /> : editingBook ? <PencilLine className="size-5 text-blue-500" /> : <Plus className="size-5 text-blue-500" />}
              {isReplaceMode ? 'Replace Lost Book' : editingBook ? 'Edit Book Copy' : 'Register New Asset Copies'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isReplaceMode ? `Mark ${originalAccession} as lost and add replacement copy.` : editingBook ? 'Update this copy and keep the same accession number.' : 'Add one or more physical book copies to the catalogue'}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="size-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-8 mt-4 text-xs text-red-600 font-medium bg-red-100 border border-red-200 p-3 rounded-xl">
            {errorMsg}
          </div>
        )}

        {isScanning ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center px-8">
            <div className="relative w-full aspect-video max-w-xs rounded-xl overflow-hidden border bg-black">
              <div id="modal-camera-scanner" className="w-full h-full" />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Align book barcode inside the frame</p>
            <button type="button" onClick={stopScanning} className="rounded-xl border border-slate-300 glass-panel px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
              Cancel Scan
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 bg-white/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="flex flex-col gap-5">
                {/* Book Details Group */}
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-300 pb-2">Book Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">ISBN <span className="text-red-600">*</span></label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text" required placeholder="e.g. 9780123456789" value={isbn}
                          onChange={(e) => setIsbn(e.target.value)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                        />
                        <button type="button" onClick={startScanning}
                          className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 transition border border-blue-200 shadow-sm"
                          title="Scan ISBN">
                          <ScanLine className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Title <span className="text-red-600">*</span></label>
                      <input type="text" required placeholder="e.g. Introduction to Algorithms" value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Author <span className="text-red-600">*</span></label>
                      <input type="text" required placeholder="e.g. Thomas H. Cormen" value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Publisher</label>
                      <input type="text" placeholder="e.g. MIT Press" value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Edition</label>
                      <input type="text" placeholder="e.g. 4th Edition" value={edition}
                        onChange={(e) => setEdition(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Series</label>
                      <input type="text" placeholder="e.g. Vol 1" value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Publication Year</label>
                      <input type="number" placeholder="e.g. 2022" value={publicationYear}
                        onChange={(e) => setPublicationYear(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Total Pages</label>
                      <input type="number" placeholder="e.g. 1312" value={totalPages}
                        onChange={(e) => setTotalPages(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Language</label>
                      <input type="text" placeholder="e.g. English" value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Purchase Details Group */}
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-300 pb-2">Purchase Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Price (₹)</label>
                      <input type="number" step="0.01" placeholder="e.g. 799.00" value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bill Number</label>
                      <input type="text" placeholder="e.g. BILL-2024" value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bill Date</label>
                      <input type="date" value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-5">
                {/* Library Details Group */}
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-300 pb-2">Library Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                      <input type="text" placeholder="e.g. CSE" value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                      <input type="text" placeholder="e.g. Reference" value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Source</label>
                      <input type="text" placeholder="e.g. Donated" value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Classification Number</label>
                      <input type="text" placeholder="e.g. 005.1" value={classificationNumber}
                        onChange={(e) => setClassificationNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm" />
                    </div>
                    {!editingBook && !isReplaceMode ? (
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity to Add <span className="text-red-600">*</span></label>
                        <input
                          type="number" required min={1} value={quantity}
                          onChange={handleQuantityChange}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-bold text-base shadow-sm"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">Entering the quantity will generate accession number fields below.</p>
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Accession Number</label>
                        <input
                          type="text"
                          readOnly={isReplaceMode}
                          value={accessionNumbersList[0] || ''}
                          onChange={(e) => setAccessionNumbersList([e.target.value])}
                          className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono shadow-sm ${isReplaceMode ? 'bg-slate-200' : 'bg-white'}`}
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">{isReplaceMode ? 'Replacement accession number is automatically assigned and read-only.' : 'The accession number is preserved while editing.'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accession Numbers Group */}
                {!editingBook && !isReplaceMode && (
                  <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-300 pb-2">
                      Accession Numbers ({quantity} {quantity === 1 ? 'copy' : 'copies'})
                    </h4>
                    <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
                      {accessionNumbersList.map((num, idx) => (
                        <div key={idx}>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Copy {idx + 1}</label>
                          <input
                            type="text"
                            required
                            placeholder={`e.g. ACC${String(idx + 1).padStart(4, '0')}`}
                            value={num}
                            onChange={(e) => {
                              const next = [...accessionNumbersList]
                              next[idx] = e.target.value
                              setAccessionNumbersList(next)
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-300 pt-5">
              <button type="button" onClick={handleClose}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className={`rounded-xl px-8 py-2.5 text-xs font-bold text-white hover:opacity-90 transition flex items-center gap-2 shadow-sm disabled:opacity-60 ${isReplaceMode ? 'bg-amber-600' : 'bg-blue-600'}`}>
                {saving ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : isReplaceMode ? 'Confirm Replacement' : editingBook ? 'Save Changes' : `Add ${quantity} ${quantity === 1 ? 'Copy' : 'Copies'}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
