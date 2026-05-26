/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, BookOpen, Download } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Order {
  id: string;
  total?: number;
  amount?: number;
  status?: string;
  createdAt?: any;
  timestamp?: any;
}

interface HistoryPoint {
  label: string;
  value: number;
}

export default function ProfitLedgerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartHistory, setChartHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    // Order by timestamp to capture both old orders and new restock transactions
    const q = query(collection(db, 'finance_transactions'), orderBy('timestamp', 'desc'), limit(20));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > 0) {
        const formatted = data.map((d: any) => ({
          id: d.id,
          ...d,
          timestamp: d.timestamp || d.created_at,
          amount: d.amount || 0,
          isPositive: d.isPositive !== undefined ? d.isPositive : (d.transaction_type === 'INCOME' || true),
          type: d.type || 'Order Revenue'
        }));
        
        setOrders(formatted);
        setRecentOrders(formatted.slice(0, 8));

        // Kalkulasi berdasarkan riwayat transaksi yang valid
        const grossRevenue = formatted.filter((o: any) => o.isPositive).reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
        const cogs = formatted.filter((o: any) => !o.isPositive).reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
        const netProfit = grossRevenue - cogs;
        const roi = cogs > 0 ? ((netProfit / cogs) * 100).toFixed(1) : 100;
        
        setFinance({ net_profit: netProfit, cost: cogs, roi_percentage: roi });

        // Chart History
        const byDay: Record<string, number> = {};
        formatted.forEach((data: any) => {
          if (!data.timestamp) return;
          const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
          const label = `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
          const amount = data.isPositive ? (data.amount || 0) : -(data.amount || 0);
          byDay[label] = (byDay[label] || 0) + amount;
        });
        const points = Object.entries(byDay).slice(0, 6).reverse().map(([label, value]) => ({ label, value: Math.abs(value) }));
        setChartHistory(points.length > 0 ? points : [{ label: 'Hari ini', value: 0 }]);
      }
    }).catch(e => {
       console.error("Profit Ledger query failed, trying fallback...", e);
       // Fallback for missing index or schema mismatch
       const qFallback = query(collection(db, 'finance_transactions'), limit(20));
       getDocs(qFallback).then((snapshot) => {
          // Same mapping logic as above just without ordering to prevent crash
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (data.length > 0) {
             const formatted = data.map((d: any) => ({
                id: d.id,
                ...d,
                timestamp: d.timestamp || d.created_at,
                amount: d.amount || 0,
                isPositive: d.isPositive !== undefined ? d.isPositive : (d.transaction_type === 'INCOME' || true),
                type: d.type || 'Order Revenue'
             })).sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
             setOrders(formatted);
             setRecentOrders(formatted.slice(0, 8));
          }
       });
    });
  }, []);

  const generatePDF = (orderId: string, amount: number, status: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(4, 120, 87); // Emerald 700
    doc.text('FUSION NEURAL', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Digital Intelligence System', 20, 26);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 160, 20);
    
    // Details
    doc.setFontSize(12);
    doc.text(`Order ID: #${orderId.toUpperCase()}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 20, 48);
    doc.text(`Status: ${status.toUpperCase()}`, 20, 56);
    
    // Amount Box
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.rect(20, 70, 170, 30, 'F');
    doc.setFontSize(14);
    doc.setTextColor(4, 120, 87);
    doc.text('TOTAL AMOUNT:', 30, 88);
    doc.setFontSize(16);
    doc.text(`Rp ${amount.toLocaleString('id-ID')}`, 130, 88);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is an automatically generated electronic invoice.', 20, 130);
    doc.text('Fusion Neural Beta V3.0', 20, 138);
    
    doc.save(`Invoice_FusionNeural_${orderId.slice(0,8)}.pdf`);
  };

  const grossRevenue = orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
  const netProfit = finance?.net_profit ?? null;
  const cogs = finance?.cost ?? 0;
  const roi = finance?.roi_percentage ?? null;
  const maxHistory = Math.max(...chartHistory.map(h => h.value), 1);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Profit Ledger"
        subtitle="Buku besar real-time — arus kas tersinkronisasi dari setiap transaksi"
        accent="emerald"
        icon={<BookOpen size={22} className="text-white" />}
      />

      {/* Top KPI */}
      <div id="ledger-kpis" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Profit — Hero Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 relative rounded-3xl p-8 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)' }}
        >
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-emerald-200 text-sm font-semibold mb-2">Net Profit (Laba Bersih)</p>
            <div className="text-4xl md:text-5xl font-black text-white mb-3">
              {netProfit !== null
                ? `Rp ${netProfit.toLocaleString('id-ID')}`
                : <span className="text-3xl text-white/50">Belum dikalkulasi</span>
              }
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-200 text-sm">
                <ArrowUpRight size={14} />
                <span>Gross Revenue: <strong>Rp {grossRevenue.toLocaleString('id-ID')}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300/70 text-sm">
                <ArrowDownRight size={14} />
                <span>COGS: Rp {cogs.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ROI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center"
        >
          <div className="relative w-28 h-28 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${Math.min(roi ?? 0, 100)}, 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{roi !== null ? `${roi}%` : '–'}</span>
              <span className="text-[10px] text-slate-400 font-bold">ROI</span>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700">Return on Investment</p>
          <div className={`flex items-center gap-1 mt-1 ${(roi ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {(roi ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span className="text-xs font-bold">{(roi ?? 0) >= 20 ? 'Sehat' : (roi ?? 0) >= 0 ? 'Perlu Perhatian' : 'Rugi'}</span>
          </div>
        </motion.div>
      </div>

      {/* Historical Growth Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={16} /> Historical Growth</h3>
          <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg font-bold">30 HARI TERAKHIR</span>
        </div>
        <div className="h-48 w-full">
          {chartHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Jalankan Autopilot untuk mengisi data chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Volume']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Transaction Flow */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Flow — {orders.length} orders total</h2>
        <div className="bg-[#0F172A] rounded-2xl p-4 h-64 overflow-y-auto space-y-2">
          {recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              <BookOpen size={18} className="mr-2 opacity-40" /> Menunggu data transaksi dari Firestore...
            </div>
          ) : recentOrders.map((order: any) => {
            const amount = order.total || order.amount || 0;
            return (
              <div key={order.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                <div className={`w-7 h-7 rounded-lg ${order.isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center shrink-0`}>
                  <DollarSign size={12} className={order.isPositive ? 'text-emerald-400' : 'text-rose-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs font-mono truncate">{order.type || `Order #${order.id.slice(0, 8)}`}</p>
                  <p className="text-slate-500 text-[10px]">Status: {order.status || (order.isPositive ? 'processed' : 'deducted')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`${order.isPositive ? 'text-emerald-400' : 'text-rose-400'} text-xs font-black shrink-0`}>
                    {order.isPositive ? '+' : '-'}Rp {amount.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => generatePDF(order.id, amount, order.status || (order.isPositive ? 'processed' : 'deducted'))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 ${order.isPositive ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'} text-[10px] font-bold rounded-lg transition-colors`}
                  >
                    <Download size={12} />
                    Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
