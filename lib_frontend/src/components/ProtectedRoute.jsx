import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Loader2 } from 'lucide-react'

/**
 * Wraps a route to enforce authentication and optional role check.
 *
 * @param {string}    role       - Required role string e.g. 'ADMIN'. Omit to allow any logged-in user.
 * @param {string}    redirectTo - Where to send unauthorised users. Defaults to '/login'.
 * @param {ReactNode} children   - The page component to render when authorised.
 */
export default function ProtectedRoute({ role, redirectTo = '/login', children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  if (role && user.role !== role) {
    // Send to the correct home for the actual role
    const home = user.role === 'ADMIN' ? '/admin' : user.role === 'STAFF' ? '/staff' : '/student'
    return <Navigate to={home} replace />
  }

  return children
}
