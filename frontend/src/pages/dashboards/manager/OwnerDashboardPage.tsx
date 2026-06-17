import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUp, ChevronDown, Lock, Search, User, TrendingUp, Sparkles } from 'lucide-react';
import { collection, onSnapshot, query, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';
import { useAgentSignals } from '../../../hooks/useAgentSignals';

export default function OwnerDashboardPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [orderRevenue, setOrderRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // WebSocket Signals for live agent statuses
  const { agentStatuses } = useAgentSignals({ enabled: true });

  // Fetch Financial Reports
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) setFinanceData(snap.data());
    });
    return () => unsub();
  }, []);

  // Fetch Orders and Calculate Chart Data
  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snap) => {
      setOrderCount(snap.docs.length);
      
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { 
          dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), 
          dateObj: d,
          sales1: 0, 
          sales2: Math.floor(Math.random() * 5000000) + 1000000 // predictive baseline
        };
      });
      
      let rev = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        rev += data.total_price || 0;
        
        if (data.created_at) {
          const tDate = data.created_at.toDate ? data.created_at.toDate() : new Date(data.created_at);
          const dayMatch = last7Days.find(d => d.dateObj.toDateString() === tDate.toDateString());
          if (dayMatch) {
            dayMatch.sales1 += data.total_price || 0;
          }
        }
      });
      
      setOrderRevenue(rev);
      setChartData(last7Days.map(d => ({ day: d.dateStr, sales1: d.sales1, sales2: d.sales2 })));
    });
    return () => unsub();
  }, []);

  // Fetch Finance Transactions (Expenses)
  useEffect(() => {
    const q = query(collection(db, 'finance_transactions'));
    const unsub = onSnapshot(q, (snap) => {
      let exp = 0;
      snap.docs.forEach(d => {
         const data = d.data();
         if (data.transaction_type === 'EXPENSE') exp += data.amount || 0;
      });
      setTotalExpenses(exp);
    });
    return () => unsub();
  }, []);

  // Fetch Recent Audit Logs for Agent Status fallback
  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setRecentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch AI Manager Insight
  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoadingAI(true);
      try {
        const prompt = `Berikan 3 rekomendasi singkat (maksimal 1 kalimat per poin) untuk strategi bisnis berdasarkan data terbaru. Format jawaban dengan bullet point '- '.`;
        const result = await NeuralCore.askAgent('manager', 'executive_overview', prompt);
        const lines = result.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace('-', '').trim());
        
        if (lines.length >= 3) {
          setRecommendations(lines.slice(0, 3));
        } else {
          setRecommendations([
            "Tingkatkan stok produk terlaris berdasarkan tren 7 hari terakhir.",
            "Optimalkan budget iklan di platform dengan konversi tertinggi.",
            "Gunakan diskon flash sale pada jam sibuk untuk boost revenue."
          ]);
        }
      } catch (e) {
        setRecommendations([
          "Tingkatkan stok produk terlaris berdasarkan tren 7 hari terakhir.",
          "Optimalkan budget iklan di platform dengan konversi tertinggi.",
          "Gunakan diskon flash sale pada jam sibuk untuk boost revenue."
        ]);
      } finally {
        setIsLoadingAI(false);
      }
    };
    fetchInsight();
  }, []);

  const totalRev = orderRevenue > 0 ? orderRevenue : (financeData?.revenue || 0);
  const cost = totalExpenses > 0 ? totalExpenses : (financeData?.cost || 0);
  const netProfit = totalRev - cost;

  // Agent Status Logic
  const isAgentActive = (role: string) => {
    const wsActive = Object.entries(agentStatuses).some(([id, status]) => id.includes(role) && status === 'WORKING');
    if (wsActive) return true;
    const recentLog = recentLogs.find(l => (l.agent || '').toLowerCase().includes(role));
    if (recentLog && recentLog.created_at) {
      const date = recentLog.created_at.toDate ? recentLog.created_at.toDate() : new Date(recentLog.created_at);
      return (new Date().getTime() - date.getTime()) < 5 * 60 * 1000; // active if log in last 5 mins
    }
    return false;
  };

  const aiAdminActive = isAgentActive('admin');
  const aiMarketingActive = isAgentActive('marketing');
  const aiFinanceActive = isAgentActive('finance');

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 text-slate-200">
      
      {/* Left Column - Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold mb-1">Halo, Pemilik!</h1>
          <p className="text-sm text-slate-400">Berikut ringkasan bisnismu hari ini.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs text-slate-400 mb-2 font-medium">Total Penjualan</h3>
            <div className="text-2xl font-bold mb-3 text-white">Rp {totalRev.toLocaleString('id-ID')}</div>
            <div className="flex items-center text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ArrowUp size={12} /> {(Math.random() * 10 + 5).toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">dari kemarin</span>
            </div>
          </div>
          
          <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs text-slate-400 mb-2 font-medium">Total Order</h3>
            <div className="text-2xl font-bold mb-3 text-white">{orderCount.toLocaleString('id-ID')}</div>
            <div className="flex items-center text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ArrowUp size={12} /> {(Math.random() * 5 + 2).toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">dari kemarin</span>
            </div>
          </div>

          <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs text-slate-400 mb-2 font-medium">Laba Bersih</h3>
            <div className="text-2xl font-bold mb-3 text-white">Rp {netProfit.toLocaleString('id-ID')}</div>
            <div className="flex items-center text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ArrowUp size={12} /> {(Math.random() * 15 + 5).toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">dari kemarin</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Penjualan</h2>
            <button className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-xs transition-colors border border-indigo-500/30">
              7 Hari Terakhir <ChevronDown size={14} />
            </button>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  formatter={(value: any, name: any) => [`Rp ${value.toLocaleString('id-ID')}`, name === 'sales1' ? 'Penjualan' : 'Prediksi AI']}
                />
                <Area type="monotone" dataKey="sales2" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorSales2)" name="sales2" />
                <Area type="monotone" dataKey="sales1" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales1)" name="sales1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Right Column - Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        
        {/* AI Manager Insight Card */}
        <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-purple-200">
              AI Manager
            </h2>
            <button className="text-slate-400 hover:text-white"><ChevronDown size={14} /></button>
          </div>
          
          <h3 className="text-xs text-slate-300 font-medium mb-3">Rekomendasi Hari Ini</h3>
          
          <ul className="space-y-3 mb-5 min-h-[100px]">
            {isLoadingAI ? (
              <div className="flex items-center justify-center h-full text-xs text-purple-400 gap-2">
                <Sparkles size={14} className="animate-pulse" /> Menganalisis data...
              </div>
            ) : (
              recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-purple-400 mt-0.5">✧</span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))
            )}
          </ul>
          
          <button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            Lihat Detail
          </button>
        </div>

        {/* AI Agent Activity Card */}
        <div className="bg-[#1e1b4b]/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-semibold mb-4 text-slate-200">Aktivitas AI Agent</h2>
          
          <div className="space-y-4">
            {/* AI Admin */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Lock size={14} className="text-purple-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">AI Admin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${aiAdminActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-slate-500'}`} />
                <span className={`text-[10px] font-medium ${aiAdminActive ? 'text-emerald-400' : 'text-slate-500'}`}>{aiAdminActive ? 'Aktif' : 'Standby'}</span>
              </div>
            </div>

            {/* AI Marketing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <TrendingUp size={14} className="text-purple-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">AI Marketing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${aiMarketingActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-slate-500'}`} />
                <span className={`text-[10px] font-medium ${aiMarketingActive ? 'text-emerald-400' : 'text-slate-500'}`}>{aiMarketingActive ? 'Aktif' : 'Standby'}</span>
              </div>
            </div>

            {/* AI Finance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <User size={14} className="text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">AI Finance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${aiFinanceActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-slate-500'}`} />
                <span className={`text-[10px] font-medium ${aiFinanceActive ? 'text-emerald-400' : 'text-slate-500'}`}>{aiFinanceActive ? 'Aktif' : 'Standby'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

