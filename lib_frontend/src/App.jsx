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
import BookDetails from './pages/BookDetails.jsx'
import LostBooks from './pages/LostBooks.jsx'
import BookReservations from './pages/BookReservations.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/admin/login" element={<LibrarianLogin />} />
          <Route path="/lending" element={<BorrowRequests />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/gate-logs" element={<GateLogs />} />
          <Route path="/admin/students" element={<RegisteredStudents />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/catalog" element={<StudentCatalog />} />
          <Route path="/catalog/:isbn" element={<BookDetails />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/history" element={<BorrowHistory />} />
          <Route path="/returns" element={<ReturnStation />} />
          <Route path="/scanner" element={<BookScanner />} />
          <Route path="/admin/lost-books" element={<LostBooks />} />
          <Route path="/admin/reservations" element={<BookReservations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
