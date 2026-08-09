import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Library, BookOpen, ClipboardList, Users, ShieldAlert, 
  Clock, BookMarked, History, Banknote, UserCheck, LogOut 
} from 'lucide-react';
import { apiClient } from '../api/client.js';

export default function AdminSidebar({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [pendingBorrowCount, setPendingBorrowCount] = useState(0);
  const [pendingReservationCount, setPendingReservationCount] = useState(0);
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [pendingFineCount, setPendingFineCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const [borrowRes, resRes, staffRes, finesRes] = await Promise.all([
          apiClient.get('/api/borrow'),
          apiClient.get('/api/reservations'),
          apiClient.get('/api/staff/requests'),
          apiClient.get('/api/fines?size=1000')
        ]);
        if (isMounted) {
          const pendingBorrows = borrowRes.data.filter(r => r.status === 'PENDING').length;
          const pendingRes = resRes.data.filter(r => r.status === 'PENDING').length;
          const pendingStaff = (staffRes.data || []).filter(r => r.status === 'PENDING').length;
          const pendingFines = (finesRes.data?.content || []).filter(r => r.status === 'PENDING').length;
          setPendingBorrowCount(pendingBorrows);
          setPendingReservationCount(pendingRes);
          setPendingStaffCount(pendingStaff);
          setPendingFineCount(pendingFines);
        }
      } catch (err) {
        console.error('Failed to fetch pending counts for sidebar:', err);
      }
    };

    fetchCounts();
    // Poll every 10 seconds to keep counts accurate across pages
    const intervalId = setInterval(fetchCounts, 10000);
    window.addEventListener('refresh-sidebar', fetchCounts);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('refresh-sidebar', fetchCounts);
    };
  }, []);

  const getLinkClass = (path) => {
    const isActive = path === '/admin' ? currentPath === '/admin' : currentPath.startsWith(path);
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition text-left ${
      isActive
        ? 'text-blue-600 bg-blue-50/50'
        : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
    }`;
  };

  return (
    <aside className="w-64 h-full border-r border-slate-200 glass-panel flex flex-col justify-between shrink-0 overflow-y-auto">
      <div className="flex flex-col">
        {/* Logo Brand */}
        <div className="flex items-center gap-2 px-6 py-6 border-b border-slate-200">
          <img src="/logo.png" alt="Smart Library" className="h-9 w-9 rounded-xl object-cover cursor-pointer hover:opacity-80 transition" onClick={() => window.location.reload()} />
          <span className="font-bold tracking-tight text-slate-900 text-base">
            Smart Library
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1 p-4">
          <button onClick={() => navigate('/admin')} className={getLinkClass('/admin')}>
            <Library className="size-4.5" /> Overview
          </button>
          
          <button onClick={() => navigate('/inventory')} className={getLinkClass('/inventory')}>
            <BookOpen className="size-4.5" /> Catalogue Inventory
          </button>
          
          <button onClick={() => navigate('/lending')} className={getLinkClass('/lending')}>
            <ClipboardList className="size-4.5" /> Borrow Requests
            {pendingBorrowCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingBorrowCount}
              </span>
            )}
          </button>
          
          <button onClick={() => navigate('/returns')} className={getLinkClass('/returns')}>
            <Users className="size-4.5" /> Return Station
          </button>
          
          <button onClick={() => navigate('/admin/lost-books')} className={getLinkClass('/admin/lost-books')}>
            <ShieldAlert className="size-4.5" /> Lost Books
          </button>
          
          <button onClick={() => navigate('/admin/gate-logs')} className={getLinkClass('/admin/gate-logs')}>
            <Clock className="size-4.5" /> Gate Logs
          </button>
          
          <button onClick={() => navigate('/admin/reservations')} className={getLinkClass('/admin/reservations')}>
            <BookMarked className="size-4.5" /> Book Reservations
            {pendingReservationCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingReservationCount}
              </span>
            )}
          </button>
          
          <button onClick={() => navigate('/admin/replacements')} className={getLinkClass('/admin/replacements')}>
            <History className="size-4.5" /> Replacement History
          </button>
          
          <button onClick={() => navigate('/admin/fines')} className={getLinkClass('/admin/fines')}>
            <Banknote className="size-4.5" /> Fine Management
            {pendingFineCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingFineCount}
              </span>
            )}
          </button>
          
          <button onClick={() => navigate('/admin/staff')} className={getLinkClass('/admin/staff')}>
            <UserCheck className="size-4.5" /> Staff Management
            {pendingStaffCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingStaffCount}
              </span>
            )}
          </button>
          
          <button onClick={() => navigate('/admin/students')} className={getLinkClass('/admin/students')}>
            <UserCheck className="size-4.5" /> Registered Students
          </button>
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between rounded-xl glass-panel p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
