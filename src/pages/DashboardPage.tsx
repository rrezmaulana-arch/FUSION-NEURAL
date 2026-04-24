import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Activity, LayoutDashboard, Menu, X } from 'lucide-react';
import MicrochipCursor from '../components/cursor/MicrochipCursor';

import FinanceDashboard from './dashboards/FinanceDashboard';
import MarketingDashboard from './dashboards/MarketingDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function DashboardPage() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      
      // Mengarahkan ke Landing Page
      // CATATAN: Jika rute landing page Anda bukan '/', silakan ganti di bawah ini.
      // Contoh: navigate('/home') atau navigate('/landing')
      navigate('/'); 
      
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const renderDashboardContent = () => {
    switch (userRole) {
      case 'finance':
        return <FinanceDashboard />;
      case 'marketing':
        return <MarketingDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="p-8 border border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Specific Role Data</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Your account ({currentUser?.email}) does not have a recognized role for a specific dashboard view.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 font-sans flex flex-col md:flex-row overflow-hidden relative">
      <MicrochipCursor />
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR - Light Theme */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col p-6 shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800 font-black tracking-widest text-sm">FUSION<span className="text-emerald-500">NEURAL</span></span>
          </div>
          
          {/* Tombol Close khusus HP */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1">
          <div className="mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overview</div>
          <div className="space-y-2">
            <div className="w-full text-left px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-emerald-600 font-semibold flex items-center gap-3 shadow-sm cursor-pointer">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </div>
            {/* Add more sidebar items based on role if needed */}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-sm font-bold text-slate-800 truncate capitalize">{userRole || 'User'} Role</div>
              <div className="text-xs text-slate-500 truncate font-medium">{currentUser?.email}</div>
            </div>
            {/* Tombol Logout */}
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors border border-slate-100 hover:border-red-100 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-800 font-black tracking-widest text-xs">FUSION<span className="text-emerald-500">NEURAL</span></span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-6 md:p-10">
          {/* Efek Glow Background */}
          <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-100/30 rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative">
            <header className="mb-8 md:mb-10">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2"
              >
                Welcome back, <span className="capitalize text-emerald-500">{userRole}</span>
              </motion.h1>
              <p className="text-sm md:text-base text-slate-500 font-medium">Here's your operations overview for today.</p>
            </header>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {renderDashboardContent()}
            </motion.div>
          </div>
        </main>

      </div>
    </div>
  );
}