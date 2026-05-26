/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, LayoutDashboard, Menu as MenuIcon, X,
  ChevronLeft, ChevronRight, Bell, Cloud,
  TrendingUp, Flame, Package, Network, BookOpen,
  Activity, Shield, Sparkles, CalendarDays, Wallet,
  ShoppingCart, Building2, Users, Calculator, Image, AlertTriangle, ClipboardList, Receipt, Tags
} from 'lucide-react';

import MicrochipCursor from '../components/cursor/MicrochipCursor';
import NeuralGuide from '../components/tutorial/NeuralGuide';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';

import ProfitLedgerPage from './dashboards/finance/ProfitLedgerPage';
import OperationalBurnPage from './dashboards/finance/OperationalBurnPage';
import CampaignForgePage from './dashboards/marketing/CampaignForgePage';
import ContentLaunchpadPage from './dashboards/marketing/ContentLaunchpadPage';
import GenerativeUIPage from './dashboards/marketing/GenerativeUIPage';
import TaxCalculatorPage from './dashboards/finance/TaxCalculatorPage';
import PricingStrategyPage from './dashboards/finance/PricingStrategyPage';
import CryptoTreasuryPage from './dashboards/finance/CryptoTreasuryPage';
import InventoryTrackerPage from './dashboards/admin/InventoryTrackerPage';
import OrderStreamPage from './dashboards/admin/OrderStreamPage';
import SupplierHubPage from './dashboards/admin/SupplierHubPage';
import ProcurementPOPage from './dashboards/admin/ProcurementPOPage';
import AgentOrchestratorPage from './dashboards/manager/AgentOrchestratorPage';
import ExecutiveSummaryPage from './dashboards/manager/ExecutiveSummaryPage';
import WarRoomPage from './dashboards/manager/WarRoomPage';
import StrategicAuditPage from './dashboards/manager/StrategicAuditPage';
import NeuralTasksPage from './dashboards/manager/NeuralTasksPage';
import ImageStudioPage from './dashboards/marketing/ImageStudioPage';
import MarketingAnalyticsPage from './dashboards/marketing/MarketingAnalyticsPage';
import AudienceCRMPage from './dashboards/marketing/AudienceCRMPage';
import ShippingReturnsPage from './dashboards/admin/ShippingReturnsPage';
import MarketplaceSimulatorPage from './dashboards/admin/MarketplaceSimulatorPage';
import BankReconPage from './dashboards/finance/BankReconPage';
import AccountsPayablePage from './dashboards/finance/AccountsPayablePage';


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
      { path: '/dashboard', label: 'Inventory Tracker', icon: Package },
      { path: '/dashboard/orders', label: 'Order Stream', icon: ShoppingCart },
      { path: '/dashboard/shipping', label: 'Shipping & Returns', icon: Package },
      { path: '/dashboard/suppliers', label: 'Supplier Hub', icon: Building2 },
      { path: '/dashboard/procurement', label: 'Procurement & QC', icon: ClipboardList },
      { path: '/dashboard/simulator', label: 'E-commerce Simulator', icon: AlertTriangle },
    ]
  },
  finance: {
    title: 'Treasury Dept',
    theme: { gradient: 'from-[#059669] to-[#047857]', text: 'text-emerald-600', glow: 'bg-emerald-500/20' },
    menus: [
      { path: '/dashboard', label: 'Profit Ledger', icon: BookOpen },
      { path: '/dashboard/pricing', label: 'Pricing Strategy', icon: Tags },
      { path: '/dashboard/treasury', label: 'Web3 Treasury', icon: Wallet },
      { path: '/dashboard/ap-ar', label: 'Invoicing & AP/AR', icon: Receipt },
      { path: '/dashboard/bank-recon', label: 'Bank Recon & Petty Cash', icon: Activity },
      { path: '/dashboard/burn', label: 'Operational Burn', icon: Flame },
      { path: '/dashboard/tax-calc', label: 'Tax Calculator', icon: Calculator },
    ]
  },
  marketing: {
    title: 'Growth Engine',
    theme: { gradient: 'from-[#A21CAF] to-[#86198F]', text: 'text-purple-600', glow: 'bg-purple-500/20' },
    menus: [
      { path: '/dashboard', label: 'Campaign Forge', icon: Sparkles },
      { path: '/dashboard/generative-ui', label: 'Generative UI', icon: Sparkles },
      { path: '/dashboard/launchpad', label: 'Content Launchpad (Drafts)', icon: CalendarDays },
      { path: '/dashboard/image-studio', label: 'Image Studio', icon: Image },
      { path: '/dashboard/marketing-analytics', label: 'Performance Analytics', icon: TrendingUp },
      { path: '/dashboard/crm', label: 'Audience & CRM', icon: Users },
    ]
  },
  manager: {
    title: 'Management Suite',
    theme: { gradient: 'from-[#4f46e5] to-[#6366f1]', text: 'text-indigo-400', glow: 'bg-indigo-500/10' },
    menus: [
      { path: '/dashboard', label: 'Agent Orchestrator', icon: Network },
      { path: '/dashboard/neural-tasks', label: 'Neural Tasks (Kanban)', icon: ClipboardList },
      { path: '/dashboard/strategic-audit', label: 'Strategic Audit Hub', icon: Shield },
      { path: '/dashboard/executive', label: 'Executive Summary', icon: TrendingUp },
      { path: '/dashboard/war-room', label: 'Multi-Agent War Room', icon: Users },
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

  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
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

  const getDefaultComponent = () => {
    switch (safeRole) {
      case 'admin': return <InventoryTrackerPage />;
      case 'finance': return <ProfitLedgerPage />;
      case 'marketing': return <CampaignForgePage />;
      case 'manager':
      default: return <AgentOrchestratorPage />;
    }
  };

  // Real notification count from Firestore signals
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestSignal, setLatestSignal] = useState<{agent: string, message: string} | null>(null);

  useEffect(() => {
    // Initial fetch
    const q = query(collection(db, 'realtime_signals'), orderBy('created_at', 'desc'), limit(50));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data) {
        const unread = data.filter((d: any) => d.status !== 'read').length;
        setUnreadCount(unread);
      }
    });

    // Realtime subscription
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const unread = data.filter((d: any) => d.status !== 'read').length;
      
      // If unread count increased, show the newest message
      if (unread > 0 && data.length > 0) {
        const newest = data[0] as any;
        setLatestSignal({
          agent: newest.agent,
          message: newest.message
        });
        setTimeout(() => setLatestSignal(null), 5000);
      }
      setUnreadCount(unread);
    });
      
    return () => unsubscribe();
  }, []);

  const effectiveIsCollapsed = isCollapsed;
  const sidebarWidth = effectiveIsCollapsed ? 'w-[90px]' : 'w-[280px]';

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row overflow-hidden relative ${safeRole === 'manager' ? 'bg-[#060b18] text-slate-200' : 'bg-[#F8F9FA] text-slate-800'}`}>
      {safeRole === 'manager' && <MicrochipCursor />}
      
      {/* Interactive Game Guide */}
      <NeuralGuide />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {latestSignal && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[100] min-w-[300px] max-w-md bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 shadow-[0_10px_40px_rgba(79,70,229,0.2)] rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Activity size={16} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
                {latestSignal.agent} Neural Node
              </div>
              <div className="text-sm text-slate-200 leading-snug">
                {latestSignal.message}
              </div>
            </div>
          </motion.div>
        )}
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

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 md:relative z-50
        ${sidebarWidth} shrink-0 flex flex-col h-full
        transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
        ${safeRole === 'manager'
          ? 'bg-[#060b18] shadow-none border-none'
          : 'bg-white/95 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl'
        }
      `}>
        
        <div className={`flex items-center ${effectiveIsCollapsed ? 'justify-center' : 'justify-between'} px-5 py-6 transition-all duration-500 ${safeRole === 'manager' ? 'border-none' : 'border-b border-black/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.theme.gradient} flex items-center justify-center shadow-lg shrink-0 ${effectiveIsCollapsed ? 'mx-auto' : ''}`}>
              <Cloud size={20} className="text-white" />
            </div>

            {!effectiveIsCollapsed && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className={`text-sm font-black uppercase tracking-tight leading-none ${safeRole === 'manager' ? 'text-slate-100' : 'text-slate-900'}`}>
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
              <button
                onClick={() => handleNav('/notifications')}
                className={`relative p-2 rounded-xl transition-colors ${safeRole === 'manager' ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 ' + config.theme.text}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
              {/* Tombol Minimize */}
              <button
                onClick={() => setIsCollapsed(true)}
                className={`hidden md:flex relative p-2 rounded-xl transition-colors ${
                  safeRole === 'manager' ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`md:hidden p-1.5 rounded-xl transition-colors ${safeRole === 'manager' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 ' + config.theme.text}`}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed Menu Buttons */}
        {effectiveIsCollapsed && (
          <div className="w-full flex flex-col items-center gap-3 mt-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className={`hidden md:flex relative p-2 rounded-xl transition-colors ${
                safeRole === 'manager' ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handleNav('/notifications')}
              className={`relative p-3 rounded-2xl transition-colors ${safeRole === 'manager' ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 ' + config.theme.text}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        <nav className={`flex-1 ${effectiveIsCollapsed ? 'px-3' : 'px-4'} space-y-1.5 overflow-y-auto mt-4 transition-all duration-300 no-scrollbar`}>
          {config.menus.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path === '/dashboard' && location.pathname === '/dashboard');
            const pathPart = path.replace('/dashboard', '').replace('/', '');
            const targetId = `nav-${pathPart || 'home'}`;
            if (safeRole === 'manager') {
              return (
                <button
                  key={path}
                  id={targetId}
                  onClick={() => handleNav(path)}
                  title={effectiveIsCollapsed ? label : undefined}
                  className={`relative w-full flex items-center ${
                    effectiveIsCollapsed ? 'justify-center p-3.5 rounded-2xl aspect-square' : 'gap-3 px-4 py-3 rounded-xl'
                  } font-semibold transition-all duration-300 outline-none overflow-hidden ${
                    active
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />}
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                  {!effectiveIsCollapsed && <span className="text-[13px] whitespace-nowrap font-semibold">{label}</span>}
                </button>
              );
            }
            return (
              <button
                key={path}
                id={targetId}
                onClick={() => handleNav(path)}
                title={effectiveIsCollapsed ? label : undefined}
                className={`relative w-full flex items-center ${effectiveIsCollapsed ? 'justify-center p-3.5 rounded-2xl aspect-square' : 'gap-4 px-5 py-3.5 rounded-full'} font-bold transition-all duration-[400ms] outline-none overflow-hidden
                  ${active
                  ? `bg-gradient-to-r ${config.theme.gradient} text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]`
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`shrink-0 ${active ? '' : 'opacity-80'}`} />
                {!effectiveIsCollapsed && <span className="tracking-wide text-[14px] whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`px-4 pb-5 pt-4 space-y-4 ${safeRole === 'manager' ? 'border-none' : 'border-t border-black/5'}`}>
          {!effectiveIsCollapsed ? (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              safeRole === 'manager'
                ? 'bg-white/[0.05] border border-white/[0.07]'
                : 'bg-slate-100 border border-black/8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-full'
            }`}>
              <div className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] ${
                safeRole === 'manager'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-200/50 text-slate-600 rounded-full shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.5)]'
              }`}>
                {initials[0]}
              </div>
              <div className="flex-1 min-w-0 text-left pl-1">
                <div className={`text-[13px] font-semibold tracking-wide truncate capitalize ${
                  safeRole === 'manager' ? 'text-slate-200' : 'text-slate-800'
                }`}>{displayName}</div>
                <div className={`text-[10px] font-medium tracking-wide mt-0.5 capitalize ${
                  safeRole === 'manager' ? 'text-slate-500' : 'text-slate-500'
                }`}>{userRole}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  safeRole === 'manager'
                    ? 'text-slate-500 hover:text-red-400 hover:bg-white/10'
                    : 'text-slate-500 hover:text-red-500 hover:bg-slate-200 mr-1'
                }`}
              >
                <LogOut size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center w-full mt-2">
              <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 font-bold text-[15px] ${
                safeRole === 'manager'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-200/50 text-slate-600 rounded-full shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]'
              }`}>
                {initials[0]}
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all ${
                  safeRole === 'manager'
                    ? 'text-slate-500 hover:text-red-400 hover:bg-white/10 border border-white/[0.07]'
                    : 'bg-slate-100 text-slate-600 hover:text-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/10 hover:bg-slate-200 rounded-full'
                }`}
              >
                <LogOut size={16} strokeWidth={2}/>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative ${safeRole === 'manager' ? 'bg-[#060b18]' : 'bg-[#5C717A]/5'}`}>
        
        {/* MOBILE HEADER */}
        <header className={`md:hidden flex items-center justify-between p-4 backdrop-blur-md border-b z-30 sticky top-0 ${
          safeRole === 'manager' ? 'bg-[#080e1f]/95 border-white/[0.07]' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.theme.gradient} flex items-center justify-center shadow-sm`}>
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className={`font-black tracking-widest text-xs ${safeRole === 'manager' ? 'text-slate-200' : 'text-slate-800'}`}>
              FUSION<span className={config.theme.text}>NEURAL</span>
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-xl ${safeRole === 'manager' ? 'text-slate-400 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-50'}`}>
            <MenuIcon className="w-5 h-5" />
          </button>
        </header>

        {/* EFEK GLOW BACKGROUND KONTEN */}
        {safeRole === 'manager' && (
          <>
            <div className={`absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full blur-[100px] md:blur-[120px] pointer-events-none opacity-60 ${config.theme.glow}`} />
            <div className={`absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[100px] md:blur-[120px] pointer-events-none opacity-40 ${config.theme.glow}`} />
          </>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto relative">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Routes>
                {/* Default Route */}
                <Route index element={getDefaultComponent()} />
                
                {/* Finance Routes */}
                <Route path="pricing" element={<PricingStrategyPage />} />
                <Route path="treasury" element={<CryptoTreasuryPage />} />
                <Route path="bank-recon" element={<BankReconPage />} />
                <Route path="burn" element={<OperationalBurnPage />} />
                <Route path="tax-calc" element={<TaxCalculatorPage />} />
                <Route path="ap-ar" element={<AccountsPayablePage />} />

                {/* Marketing Routes */}
                <Route path="image-studio" element={<ImageStudioPage />} />
                <Route path="launchpad" element={<ContentLaunchpadPage />} />
                <Route path="generative-ui" element={<GenerativeUIPage />} />
                <Route path="marketing-analytics" element={<MarketingAnalyticsPage />} />
                <Route path="crm" element={<AudienceCRMPage />} />

                {/* Admin Routes */}
                <Route path="orders" element={<OrderStreamPage />} />
                <Route path="shipping" element={<ShippingReturnsPage />} />
                <Route path="suppliers" element={<SupplierHubPage />} />
                <Route path="procurement" element={<ProcurementPOPage />} />
                <Route path="simulator" element={<MarketplaceSimulatorPage />} />

                {/* AI Core Operations are now inside Agent Orchestrator Hub (Manager only) */}

                {/* Manager Routes */}
                <Route path="orchestrator" element={<AgentOrchestratorPage />} />
                <Route path="executive" element={<ExecutiveSummaryPage />} />
                <Route path="war-room" element={<WarRoomPage />} />
                <Route path="strategic-audit" element={<StrategicAuditPage />} />
                <Route path="neural-tasks" element={<NeuralTasksPage />} />

                {/* Fallback 404/Coming Soon */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                      <Cloud className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Module Under Construction</h2>
                    <p className="text-slate-500 max-w-sm">The selected module is currently being connected to the neural engine. Please check back later.</p>
                  </div>
                } />
              </Routes>
            </motion.div>
          </div>
        </main>

      </div>


    </div>
  );
}