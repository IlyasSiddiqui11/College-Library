import React, { useState } from 'react'
import { Mail, AlertTriangle, Loader2, X } from 'lucide-react'
import { apiClient } from '../api/client'

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient.post('/api/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] rounded-2xl border border-white/20 glass-panel p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-blue-200 hover:text-white transition"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-sm text-blue-200 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100/20 bg-red-500/10 p-3 text-xs font-medium text-red-200">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-green-100/20 bg-green-500/10 p-4 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <Mail className="size-5" />
            </div>
            <p className="text-sm font-medium text-green-200 mb-4">
              Check your email! A reset link has been sent to {email}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-blue-200" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-white/20 glass-input py-3 pl-11 pr-4 text-sm text-white placeholder:text-blue-200/50 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition duration-200 disabled:opacity-50"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
