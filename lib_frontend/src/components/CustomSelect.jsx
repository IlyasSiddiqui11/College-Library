import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  className = '', 
  placeholder = 'Select option' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options to an array of objects
  const normalizedOptions = options.map(opt => 
    typeof opt === 'object' ? opt : { value: opt, label: opt }
  )

  const selectedOption = normalizedOptions.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 glass-input px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
      >
        <span className="truncate mr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 glass-panel shadow-xl">
          <ul className="py-1">
            {normalizedOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">No options</li>
            ) : (
              normalizedOptions.map((opt, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`cursor-pointer px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-100 ${
                    value === opt.value ? 'bg-blue-50 font-bold text-blue-700' : ''
                  }`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
