import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, QrCode, BarChart3, Users, Lock, Zap, ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (user) {
    if (user.role === 'ADMIN') {
      navigate('/admin')
    } else {
      navigate('/student')
    }
    return null
  }

  return (
    <div className="w-full text-white">
      <nav className="sticky top-0 z-50 border-b border-white/20 glass-panel backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="BCOE-lib" className="h-9 w-9 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
              <span className="hidden font-bold text-white sm:inline">
                BCOE<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">-lib</span>
              </span>
            </div>

            <div className="hidden gap-8 md:flex items-center">
              <a href="#features" className="text-sm font-medium text-blue-100 hover:text-white transition">Features</a>
              <a href="#workflow" className="text-sm font-medium text-blue-100 hover:text-white transition">Workflow</a>
              <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Student Login
              </Link>
              <Link
                to="/admin/login"
                className="rounded-lg border-2 border-violet-600 px-6 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50 transition"
              >
                Librarian Login
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-blue-100 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-white/20 py-4 space-y-3 md:hidden">
              <a href="#features" className="block text-sm font-medium text-blue-100 hover:text-white">Features</a>
              <a href="#workflow" className="block text-sm font-medium text-blue-100 hover:text-white">Workflow</a>
              <Link
                to="/login"
                className="block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-blue-700 transition"
              >
                Student Login
              </Link>
              <Link
                to="/admin/login"
                className="block rounded-lg border-2 border-violet-600 glass-panel px-4 py-2.5 text-sm font-semibold text-violet-600 text-center hover:bg-violet-50 transition"
              >
                Librarian Login
              </Link>
            </div>
          )}
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 h-96 w-96 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-96 w-96 bg-gradient-to-tr from-violet-400/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200">
            <Zap className="h-4 w-4" />
            Modern Library Management System
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Transform Your Library With <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Digital Innovation</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Seamless book management, intelligent borrowing, QR-based attendance, and real-time inventory tracking. Built for modern academic libraries.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 transition"
            >
              Student Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-600 glass-panel px-8 py-4 text-base font-semibold text-violet-600 hover:bg-violet-50 transition"
            >
              Admin Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 glass-panel px-8 py-4 text-base font-semibold text-white hover:border-white/30 hover:bg-white/10 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 glass-panel">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Powerful Features</h2>
            <p className="text-lg text-blue-100">Everything you need for modern library management</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: 'Smart QR Attendance',
                desc: 'Instant check-in/check-out with QR codes for seamless access tracking',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                desc: 'Dashboard with live borrowing stats, gate logs, and inventory insights',
              },
              {
                icon: BookOpen,
                title: 'ISBN Book Scanning',
                desc: 'Mobile camera app for quick book requests using barcode scanning',
              },
              {
                icon: Lock,
                title: 'Role-based Access',
                desc: 'Secure authentication with distinct student and admin interfaces',
              },
              {
                icon: Users,
                title: 'Borrow Management',
                desc: 'Request approval workflow with automated status updates',
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                desc: 'Built on modern tech stack for responsive performance',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/20 glass-panel p-8 shadow-xl hover:shadow-md hover:border-blue-200/50 transition group"
              >
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 p-3 text-blue-600 group-hover:from-blue-200 group-hover:to-violet-200 transition">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-blue-100">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Student Workflow</h2>
            <p className="text-lg text-blue-100">From registration to book return in seconds</p>
          </div>

          <div className="space-y-6">
            {[
              { num: '1', title: 'Register Account', desc: 'Create your student account with email and password' },
              { num: '2', title: 'Complete Profile', desc: 'Add branch, year, and contact information' },
              { num: '3', title: 'Scan Books', desc: 'Use camera to scan ISBN barcodes or manually search' },
              { num: '4', title: 'Request Borrowing', desc: 'Submit book requests for librarian approval' },
              { num: '5', title: 'Track Borrowing', desc: 'View history and manage your borrowed books' },
              { num: '6', title: 'Return Books', desc: 'Use return station kiosk for quick returns' },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="text-blue-100">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Ready to Transform Your Library?</h2>
          <p className="mb-8 text-lg text-blue-100">Join the BCOE-lib ecosystem and experience modern library management.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl glass-panel px-8 py-4 text-base font-semibold text-blue-600 shadow-xl hover:bg-white/10 transition"
          >
            Get Started Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/20 px-4 py-12 sm:px-6 lg:px-8 glass-panel">
        <div className="mx-auto max-w-6xl text-center text-sm text-blue-100">
          <p>© 2026 BCOE-lib. Built for modern academic libraries.</p>
        </div>
      </footer>
    </div>
  )
}
