import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home.jsx'
import BorrowRequests from './pages/BorrowRequests.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import InventoryManagement from './pages/InventoryManagement.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import LibrarianLogin from './pages/LibrarianLogin.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import BorrowHistory from './pages/BorrowHistory.jsx'
import ReturnStation from './pages/ReturnStation.jsx'
import BookScanner from './pages/BookScanner.jsx'
import GateLogs from './pages/GateLogs.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import RegisteredStudents from './pages/RegisteredStudents.jsx'
import StudentCatalog from './pages/StudentCatalog.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminReservations from './pages/AdminReservations.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<LibrarianLogin />} />
          <Route path="/lending" element={<BorrowRequests />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/gate-logs" element={<GateLogs />} />
          <Route path="/admin/students" element={<RegisteredStudents />} />
          <Route path="/admin/reservations" element={<AdminReservations />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/catalog" element={<StudentCatalog />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/history" element={<BorrowHistory />} />
          <Route path="/returns" element={<ReturnStation />} />
          <Route path="/scanner" element={<BookScanner />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
