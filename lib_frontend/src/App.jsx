import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import BorrowRequests from './pages/BorrowRequests.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminStaffManagement from './pages/AdminStaffManagement.jsx'
import InventoryManagement from './pages/InventoryManagement.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import LibrarianLogin from './pages/LibrarianLogin.jsx'
import StaffLogin from './pages/StaffLogin.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import StaffProfile from './pages/StaffProfile.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import BorrowHistory from './pages/BorrowHistory.jsx'
import ReturnStation from './pages/ReturnStation.jsx'
import BookScanner from './pages/BookScanner.jsx'
import GateLogs from './pages/GateLogs.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import RegisteredStudents from './pages/RegisteredStudents.jsx'
import StudentCatalog from './pages/StudentCatalog.jsx'
import BookDetails from './pages/BookDetails.jsx'
import LostBooks from './pages/LostBooks.jsx'
import BookReservations from './pages/BookReservations.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminFines from './pages/AdminFines.jsx'
import ReplacementHistory from './pages/ReplacementHistory.jsx'
import StudentFines from './pages/StudentFines.jsx'

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        {/* Global toast provider — replaces per-page custom notification state */}
        <Toaster position="top-center" richColors closeButton />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/admin/login" element={<LibrarianLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* Staff routes */}
          <Route path="/staff" element={<ProtectedRoute role="STAFF"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/dashboard" element={<Navigate to="/staff" replace />} />
          <Route path="/staff/profile" element={<ProtectedRoute role="STAFF"><StaffProfile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/lending" element={<ProtectedRoute role="ADMIN"><BorrowRequests /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute role="ADMIN"><AdminStaffManagement /></ProtectedRoute>} />
          <Route path="/admin/gate-logs" element={<ProtectedRoute role="ADMIN"><GateLogs /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="ADMIN"><RegisteredStudents /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute role="ADMIN"><InventoryManagement /></ProtectedRoute>} />
          <Route path="/admin/lost-books" element={<ProtectedRoute role="ADMIN"><LostBooks /></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute role="ADMIN"><BookReservations /></ProtectedRoute>} />
          <Route path="/admin/replacements" element={<ProtectedRoute role="ADMIN"><ReplacementHistory /></ProtectedRoute>} />
          <Route path="/admin/fines" element={<ProtectedRoute role="ADMIN"><AdminFines /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute role="ADMIN"><BookScanner /></ProtectedRoute>} />
          <Route path="/returns" element={<ProtectedRoute role="ADMIN"><ReturnStation /></ProtectedRoute>} />

          {/* Student / shared routes */}
          <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/catalog" element={<StudentCatalog />} />
          <Route path="/catalog/:isbn" element={<BookDetails />} />
          <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><BorrowHistory /></ProtectedRoute>} />
          <Route path="/student/fines" element={<ProtectedRoute><StudentFines /></ProtectedRoute>} />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

export default App