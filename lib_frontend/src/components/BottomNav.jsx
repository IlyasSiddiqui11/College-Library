import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { BookOpen, FileText, History, User, Banknote } from 'lucide-react'

export default function BottomNav() {
  const { user, hasFine } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  if (!user || (user.role !== 'STUDENT' && user.role !== 'STAFF')) return null

  const isStaff = user.role === 'STAFF'

  const homeRoute = isStaff ? '/staff' : '/student'
  const profileRoute = isStaff ? '/staff/profile' : '/student/profile'

  const navItems = [
    { label: 'Home', path: homeRoute, icon: BookOpen },
    { label: 'Catalogue', path: '/catalog', icon: FileText },
    { label: 'History', path: '/history', icon: History, hasAlert: hasFine },
    { label: 'Fines', path: '/student/fines', icon: Banknote },
    { label: 'Profile', path: profileRoute, icon: User }
  ]

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-sm">
      <div className="flex items-center justify-around rounded-full border border-slate-200 glass-panel px-2 py-2 shadow-xl shadow-black/20 backdrop-blur-lg">
        {navItems.map((item) => {
          const isActive = path === item.path
          
          let colorClass = isStaff 
            ? 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
            : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
            
          if (isActive) {
            colorClass = isStaff 
              ? 'bg-slate-100 text-emerald-600 shadow-sm'
              : 'bg-slate-100 text-blue-600 shadow-sm'
          } else if (item.hasAlert) {
            colorClass = 'text-red-600 animate-pulse hover:bg-red-50'
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition ${colorClass}`}
            >
              <item.icon className="size-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
