import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, BookOpen } from 'lucide-react';

interface Order {
  id: string;
  total?: number;
  amount?: number;
  status?: string;
  createdAt?: any;
  timestamp?: any;
}

const MOCK_HISTORY = [
  { label: '5 Apr', value: 8200000 },
  { label: '10 Apr', value: 11500000 },
  { label: '15 Apr', value: 9800000 },
  { label: '20 Apr', value: 14200000 },
  { label: '25 Apr', value: 12900000 },
  { label: '30 Apr', value: 17500000 },
];

export default function ProfitLedgerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      setOrders(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) setFinance(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(8));
    const unsub = onSnapshot(q, (snap) => {
      setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
    });
    return () => unsub();
  }, []);

  const grossRevenue = orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
  const netProfit = finance?.net_profit ?? null;
  const cogs = finance?.cost ?? 0;
  const roi = finance?.roi_percentage ?? null;
  const maxHistory = Math.max(...MOCK_HISTORY.map(h => h.value));

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profit Ledger</h1>
        <p className="text-slate-500 text-sm mt-1">Buku besar real-time — arus kas tersinkronisasi dari setiap transaksi</p>
      </div>

      {/* Top KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
        <div className="flex items-end gap-3 h-28">
          {MOCK_HISTORY.map((h, i) => {
            const pct = (h.value / maxHistory) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-emerald-300"
                  style={{ minHeight: 4 }}
                />
                <span className="text-[9px] text-slate-400">{h.label}</span>
              </div>
            );
          })}
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
          ) : recentOrders.map((order) => {
            const amount = order.total || order.amount || 0;
            return (
              <div key={order.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <DollarSign size={12} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs font-mono truncate">#{order.id.slice(0, 12)}...</p>
                  <p className="text-slate-500 text-[10px]">Status: {order.status || 'processed'}</p>
                </div>
                <span className="text-emerald-400 text-xs font-black shrink-0">
                  +Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
