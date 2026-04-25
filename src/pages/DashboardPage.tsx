import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, LayoutDashboard, Menu as MenuIcon, X,
  Users, DollarSign, PieChart, Target, FileText, ChevronLeft, ChevronRight, Bell, Cloud, Server
} from 'lucide-react';
import MicrochipCursor from '../components/cursor/MicrochipCursor';

import FinanceDashboard from './dashboards/finance/FinanceDashboard';
import MarketingDashboard from './dashboards/marketing/MarketingDashboard';
import ManagerDashboard from './dashboards/manager/ManagerDashboard';
import AdminDashboard from './dashboards/admin/AdminDashboard';

import PayrollPage from './dashboards/finance/PayrollPage';
import TaxPage from './dashboards/finance/TaxPage';
import LeadsPage from './dashboards/marketing/LeadsPage';
import AnalyticsPage from './dashboards/marketing/AnalyticsPage';
import NodesPage from './dashboards/admin/NodesPage';
import LogsPage from './dashboards/admin/LogsPage';
import TeamPage from './dashboards/manager/TeamPage';
import ReportsPage from './dashboards/manager/ReportsPage';

// --- TYPESCRIPT INTERFACES ---
interface ThemeConfig {
  gradient: string;
  text: string;
  glow: string;
}

interface MenuConfig {
  path: string;
  icon: React.ElementType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
}

interface RoleConfigType {
  theme: ThemeConfig;
  title: string;
  menus: MenuConfig[];
}

// --- KONFIGURASI DINAMIS UNTUK SETIAP ROLE ---
const ROLE_CONFIG: Record<string, RoleConfigType> = {
  admin: {
    title: 'Command Center',
    theme: { gradient: 'from-[#1E293B] to-[#0F172A]', text: 'text-slate-800', glow: 'bg-slate-500/20' },
    menus: [
      { path: '/dashboard', label: 'Network Status', icon: LayoutDashboard },
      { path: '/dashboard/nodes', label: 'Server Nodes', icon: Server },
      { path: '/dashboard/logs', label: 'Traffic Logs', icon: FileText },
    ]
  },
  finance: {
    title: 'Treasury Dept',
    theme: { gradient: 'from-[#059669] to-[#047857]', text: 'text-emerald-600', glow: 'bg-emerald-500/20' },
    menus: [
      { path: '/dashboard', label: 'Cashflow', icon: DollarSign },
      { path: '/dashboard/payroll', label: 'Payroll', icon: Users },
      { path: '/dashboard/tax', label: 'Tax & Invoices', icon: FileText },
    ]
  },
  marketing: {
    title: 'Growth Engine',
    theme: { gradient: 'from-[#A21CAF] to-[#86198F]', text: 'text-purple-600', glow: 'bg-purple-500/20' },
    menus: [
      { path: '/dashboard', label: 'Campaigns', icon: Target },
      { path: '/dashboard/leads', label: 'Leads & Conversions', icon: Users },
      { path: '/dashboard/analytics', label: 'Analytics', icon: PieChart },
    ]
  },
  manager: {
    title: 'Management Suite',
    theme: { gradient: 'from-[#0F766E] to-[#0D9488]', text: 'text-teal-600', glow: 'bg-teal-500/20' },
    menus: [
      { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { path: '/dashboard/team', label: 'Team Performance', icon: Users },
      { path: '/dashboard/reports', label: 'System Reports', icon: PieChart },
    ]
  },
  default: {
    theme: { gradient: 'from-slate-400 to-slate-600', text: 'text-slate-600', glow: 'bg-slate-200/40' },
    title: 'System',
    menus: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
    ]
  }
};

export default function DashboardPage() {

  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Ambil Data Profil User
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();
  
  const safeRole = userRole && ROLE_CONFIG[userRole] ? userRole : 'manager';
  const config = ROLE_CONFIG[safeRole];

  const [activePath, setActivePath] = useState<string>(config.menus[0]?.path || '/dashboard');

  const handleNav = (path: string) => {
    setActivePath(path);
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); 
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const renderDashboardContent = () => {
    switch (activePath) {
      // Marketing
      case '/dashboard/leads': return <LeadsPage />;
      case '/dashboard/analytics': return <AnalyticsPage />;
      // Finance
      case '/dashboard/payroll': return <PayrollPage />;
      case '/dashboard/tax': return <TaxPage />;
      // Admin
      case '/dashboard/nodes': return <NodesPage />;
      case '/dashboard/logs': return <LogsPage />;
      // Manager
      case '/dashboard/team': return <TeamPage />;
      case '/dashboard/reports': return <ReportsPage />;
      // Defaults
      case '/dashboard':
        switch (safeRole) {
          case 'admin': return <AdminDashboard />;
          case 'finance': return <FinanceDashboard />;
          case 'marketing': return <MarketingDashboard />;
          case 'manager':
          default: return <ManagerDashboard />;
        }
      default:
        return null;
    }
  };

  // Dummy unread notifications
  const unreadCount = 2;

  const sidebarWidth = isCollapsed ? 'w-[90px]' : 'w-[280px]';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans flex flex-col md:flex-row overflow-hidden relative">
      <MicrochipCursor />
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR (Authentic Glass Design) */}
      <aside className={`
        fixed inset-y-0 left-0 md:relative z-50
        ${sidebarWidth} shrink-0 flex flex-col h-full
        transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
        bg-white/95 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl
      `}>
        
        {/* Top: Logo + Controls */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center border-b border-black/5' : 'justify-between'} px-5 py-6 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.theme.gradient} flex items-center justify-center shadow-lg shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
              <Cloud size={20} className="text-white" />
            </div>

            {!isCollapsed && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-sm font-black uppercase tracking-tight leading-none text-slate-900">
                  FUSION<span className={config.theme.text}>NEURAL</span>
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-[0.2em] ${config.theme.text} opacity-80 mt-0.5`}>
                  {config.title}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {/* Lonceng Notifikasi */}
              <button
                onClick={() => handleNav('/notifications')}
                className={`relative p-2 rounded-xl transition-colors hover:bg-slate-100 ${config.theme.text} hover:opacity-80`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.theme.text} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 bg-red-500`}></span>
                  </span>
                )}
              </button>

              {/* Tombol Minimize */}
              <button
                onClick={() => setIsCollapsed(true)}
                className={`hidden md:flex relative p-2 rounded-xl transition-colors hover:bg-slate-100 ${config.theme.text}`}
              >
                <ChevronLeft size={18} />
              </button>
              
              {/* Tombol Close Mobile */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`md:hidden p-1.5 rounded-xl transition-colors hover:bg-slate-100 ${config.theme.text}`}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed Menu Buttons */}
        {isCollapsed && (
          <div className="w-full flex flex-col items-center gap-3 mt-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className={`hidden md:flex relative p-2 rounded-xl transition-colors hover:bg-slate-100 ${config.theme.text}`}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handleNav('/notifications')}
              className={`relative p-3 rounded-2xl transition-colors hover:bg-slate-100 ${config.theme.text}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.theme.text} opacity-75`}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} space-y-2 overflow-y-auto mt-4 transition-all duration-300 no-scrollbar`}>
          {config.menus.map(({ path, label, icon: Icon }) => {
            const active = activePath === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                title={isCollapsed ? label : undefined}
                className={`relative w-full flex items-center ${isCollapsed ? 'justify-center p-3.5 rounded-2xl aspect-square' : 'gap-4 px-5 py-3.5 rounded-full'} font-bold transition-all duration-[400ms] outline-none overflow-hidden
                  ${active
                  ? `bg-gradient-to-r ${config.theme.gradient} text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]`
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`shrink-0 ${active ? '' : 'opacity-80'}`} />
                {!isCollapsed && <span className="tracking-wide text-[14px] whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: User info (Neumorphic Style) */}
        <div className={`px-4 pb-5 pt-4 border-t border-black/5 space-y-4`}>
          {!isCollapsed ? (
            <div className={`flex items-center gap-3 p-2.5 rounded-full transition-all bg-slate-100 border border-black/8 shadow-[0_2px_12px_rgba(0,0,0,0.06)]`}>
              
              {/* Avatar Crater */}
              <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shrink-0 bg-slate-200/50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.5)]`}>
                 <span className="font-bold text-[15px] text-slate-600">{initials[0]}</span>
              </div>
              
              <div className="flex-1 min-w-0 text-left pl-1">
                <div className="text-[13px] font-semibold tracking-wide truncate text-slate-800 capitalize">{displayName}</div>
                <div className="text-[10px] font-medium tracking-wide mt-0.5 text-slate-500 capitalize">{userRole}</div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all mr-1 text-slate-500 hover:text-red-500 hover:bg-slate-200"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center w-full mt-2">
              <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 bg-slate-200/50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.5)]">
                 <span className="font-bold text-[16px] text-slate-600">{initials[0]}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-slate-100 text-slate-600 hover:text-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/10 hover:bg-slate-200"
              >
                <LogOut size={18} strokeWidth={2}/>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#5C717A]/5 relative">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 sticky top-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.theme.gradient} flex items-center justify-center shadow-sm`}>
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-800 font-black tracking-widest text-xs">
              FUSION<span className={config.theme.text}>NEURAL</span>
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl">
            <MenuIcon className="w-5 h-5" />
          </button>
        </header>

        {/* EFEK GLOW BACKGROUND KONTEN */}
        <div className={`absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full blur-[100px] md:blur-[120px] pointer-events-none opacity-60 ${config.theme.glow}`} />
        <div className={`absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[100px] md:blur-[120px] pointer-events-none opacity-40 ${config.theme.glow}`} />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto relative">
            <motion.div key={activePath} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* Show dashboard based on activePath, otherwise show coming soon placeholder */}
              {renderDashboardContent() ? renderDashboardContent() : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                    <Cloud className="w-10 h-10 text-slate-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Module Under Construction</h2>
                  <p className="text-slate-500 max-w-sm">The {config.menus.find(m => m.path === activePath)?.label} module is currently being connected to the neural engine. Please check back later.</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>

      </div>
    </div>
  );
}