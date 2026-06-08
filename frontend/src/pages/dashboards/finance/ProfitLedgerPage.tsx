/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, BookOpen, Download, Brain, ShieldAlert, RefreshCw, Activity, Wallet } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { NeuralCore } from '../../../services/NeuralCore';
import { jsPDF } from 'jspdf';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, ReferenceLine, Legend
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  transaction_type?: string;
  isPositive?: boolean;
  type?: string;
  description?: string;
  category?: string;
  created_at?: string;
  timestamp?: any;
}

interface ChartPoint {
  label: string;
  income: number;
  expense: number;
  profit: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-black text-white">Rp {(p.value || 0).toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProfitLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [prediction, setPrediction] = useState<{tax: number, advice: string} | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [activeChart, setActiveChart] = useState<'cashflow' | 'bar'>('cashflow');
  const [lastAutoPredictCount, setLastAutoPredictCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'finance_transactions'), orderBy('created_at', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(data);

      const byPeriod: Record<string, { income: number; expense: number }> = {};
      data.forEach((t) => {
        const dateStr = t.created_at ? t.created_at.substring(0, 10) : 'Today';
        const date = new Date(dateStr);
        const label = `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
        if (!byPeriod[label]) byPeriod[label] = { income: 0, expense: 0 };
        const isIncome = t.transaction_type === 'INCOME' || t.isPositive === true;
        if (isIncome) byPeriod[label].income += t.amount || 0;
        else byPeriod[label].expense += t.amount || 0;
      });

      const points = Object.entries(byPeriod)
        .slice(0, 7).reverse()
        .map(([label, v]) => ({ label, income: v.income, expense: v.expense, profit: v.income - v.expense }));
      setChartData(points.length > 0 ? points : [{ label: 'Hari ini', income: 0, expense: 0, profit: 0 }]);
    });
    return () => unsub();
  }, []);

  // ── Auto-trigger prediksi saat data transaksi berubah signifikan ────────
  useEffect(() => {
    if (transactions.length === 0 || isPredicting) return;
    // Trigger prediksi otomatis jika ada 5+ transaksi baru sejak terakhir prediksi
    if (transactions.length >= lastAutoPredictCount + 5 || (transactions.length > 0 && lastAutoPredictCount === 0)) {
      setLastAutoPredictCount(transactions.length);
      // Jalankan prediksi secara diam-diam (tanpa loading indicator penuh)
      const autoPredict = async () => {
        try {
          const incomeTotal = transactions.filter(t => t.transaction_type === 'INCOME' || t.isPositive === true).reduce((s, t) => s + (t.amount || 0), 0);
          const expenseTotal = transactions.filter(t => t.transaction_type === 'EXPENSE' || t.isPositive === false).reduce((s, t) => s + (t.amount || 0), 0);
          const net = incomeTotal - expenseTotal;
          const prompt = `Analisis finansial: Gross Revenue Rp ${incomeTotal}, Net Profit Rp ${net}. Hitung estimasi pajak penghasilan UMKM (0.5%) dan berikan saran manajemen kas ringkas untuk 1 bulan ke depan. Kembalikan HANYA format JSON tanpa backticks: {"tax": angka_pajak, "advice": "Saran finansial..."}`;
          const res = await NeuralCore.askAgent('finance', 'tax_predictor', prompt);
          const start = res.indexOf('{'); const end = res.lastIndexOf('}');
          if (start !== -1 && end !== -1) setPrediction(JSON.parse(res.substring(start, end + 1)));
        } catch (e) { console.warn('[Auto-Predict] Gagal:', e); }
      };
      autoPredict();
    }
  }, [transactions.length]);

  const income = transactions.filter(t => t.transaction_type === 'INCOME' || t.isPositive === true).reduce((s, t) => s + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.transaction_type === 'EXPENSE' || t.isPositive === false).reduce((s, t) => s + (t.amount || 0), 0);
  const netProfit = income - expense;
  const roi = expense > 0 ? ((netProfit / expense) * 100).toFixed(1) : '100';
  const margin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : '0';

  const generatePDF = (id: string, amount: number, status: string) => {
    const d = new jsPDF();
    d.setFontSize(22); d.setTextColor(4, 120, 87); d.text('FUSION NEURAL', 20, 20);
    d.setFontSize(10); d.setTextColor(100, 100, 100); d.text('Digital Intelligence System', 20, 26);
    d.setFontSize(16); d.setTextColor(0, 0, 0); d.text('INVOICE', 160, 20);
    d.setFontSize(12);
    d.text(`Transaction ID: #${id.toUpperCase().slice(0,12)}`, 20, 40);
    d.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 20, 48);
    d.text(`Type: ${status.toUpperCase()}`, 20, 56);
    d.setFillColor(240, 253, 244); d.rect(20, 70, 170, 30, 'F');
    d.setFontSize(14); d.setTextColor(4, 120, 87);
    d.text('TOTAL AMOUNT:', 30, 88);
    d.setFontSize(16); d.text(`Rp ${amount.toLocaleString('id-ID')}`, 130, 88);
    d.setFontSize(10); d.setTextColor(150, 150, 150);
    d.text('This is an automatically generated electronic invoice.', 20, 130);
    d.text('Fusion Neural Beta V3.0', 20, 138);
    d.save(`Invoice_FusionNeural_${id.slice(0, 8)}.pdf`);
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const prompt = `Analisis finansial: Gross Revenue Rp ${income}, Net Profit Rp ${netProfit}. Hitung estimasi pajak penghasilan UMKM (0.5%) dan berikan saran manajemen kas ringkas untuk 1 bulan ke depan. Kembalikan HANYA format JSON tanpa backticks: {"tax": angka_pajak, "advice": "Saran finansial..."}`;
      const res = await NeuralCore.askAgent('finance', 'tax_predictor', prompt);
      const start = res.indexOf('{'); const end = res.lastIndexOf('}');
      if (start !== -1 && end !== -1) setPrediction(JSON.parse(res.substring(start, end + 1)));
    } catch (e) { console.error('AI Predictor failed:', e); }
    finally { setIsPredicting(false); }
  };

  const kpis = [
    { label: 'Gross Revenue', value: `Rp ${income.toLocaleString('id-ID')}`, icon: ArrowUpRight, color: 'emerald', sub: 'Total Masuk' },
    { label: 'Total Expenses', value: `Rp ${expense.toLocaleString('id-ID')}`, icon: ArrowDownRight, color: 'rose', sub: 'Total Keluar' },
    { label: 'Net Profit', value: `Rp ${netProfit.toLocaleString('id-ID')}`, icon: Wallet, color: netProfit >= 0 ? 'teal' : 'rose', sub: 'Laba Bersih' },
    { label: 'Profit Margin', value: `${margin}%`, icon: Activity, color: parseFloat(margin) > 20 ? 'emerald' : 'amber', sub: 'Margin Bersih' },
  ];

  const colorMap: Record<string, string> = {
    emerald: '#10b981', teal: '#14b8a6', rose: '#f43f5e', amber: '#f59e0b'
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Profit Ledger"
        subtitle="Buku besar real-time — arus kas tersinkronisasi langsung dari setiap transaksi"
        accent="emerald"
        icon={<BookOpen size={22} className="text-white" />}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl p-5 overflow-hidden border border-white/5"
            style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)' }}
          >
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at top right, ${colorMap[kpi.color]}, transparent 70%)` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${colorMap[kpi.color]}20`, border: `1px solid ${colorMap[kpi.color]}40` }}>
                  <kpi.icon size={15} style={{ color: colorMap[kpi.color] }} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.sub}</span>
              </div>
              <p className="text-xl font-black text-white leading-tight truncate">{kpi.value}</p>
              <p className="text-[10px] text-slate-500 mt-1">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Chart Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative rounded-3xl p-6 border border-white/5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #0f172a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />

        <div className="relative z-10 flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="text-white font-black text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" /> Cash Flow Analysis
            </h3>
            <p className="text-slate-400 text-xs mt-1">Live data dari koleksi finance_transactions Firestore</p>
          </div>
          <div className="flex bg-white/5 rounded-xl p-1 gap-1 border border-white/10">
            {(['cashflow', 'bar'] as const).map(t => (
              <button key={t} onClick={() => setActiveChart(t)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeChart === t ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                {t === 'cashflow' ? 'Trend Area' : 'Bar Breakdown'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full relative z-10">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              <Activity size={24} className="mr-2 animate-pulse" /> Menunggu data transaksi...
            </div>
          ) : activeChart === 'cashflow' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#64748b', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" name="Pemasukan" dot={false} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" name="Pengeluaran" dot={false} />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" fillOpacity={1} fill="url(#profitGrad)" name="Laba Bersih" dot={false} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#64748b', paddingTop: '12px' }} />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Pemasukan" maxBarSize={40} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Pengeluaran" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ROI + AI Predictor Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ROI Gauge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center"
        >
          <div className="relative w-36 h-36 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1e293b" strokeWidth="3" />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${Math.min(parseFloat(roi), 100)}, 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-200">{roi}%</span>
              <span className="text-[10px] text-slate-400 font-bold">ROI</span>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-300">Return on Investment</p>
          <div className={`flex items-center gap-1 mt-1.5 ${parseFloat(roi) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {parseFloat(roi) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span className="text-xs font-bold">{parseFloat(roi) >= 20 ? 'Sangat Sehat' : parseFloat(roi) >= 0 ? 'Perlu Perhatian' : 'Merugi'}</span>
          </div>
        </motion.div>

        {/* AI Tax Predictor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-2 relative bg-[#0f172a] rounded-3xl p-6 border border-white/5 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
          <div className="relative z-10">
            <h3 className="text-emerald-400 font-black flex items-center gap-2 mb-1">
              <Brain size={18} /> AI Tax & Runway Predictor
            </h3>
            <p className="text-slate-400 text-xs mb-4">Prediksi kewajiban pajak UMKM (PP23/2018) & rekomendasi pencadangan kas strategis.</p>
            <button onClick={handlePredict} disabled={isPredicting}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isPredicting ? <><RefreshCw size={15} className="animate-spin" /> Menganalisis...</> : <><Brain size={15} /> Jalankan Prediksi AI</>}
            </button>

            <AnimatePresence>
              {prediction && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                      <ShieldAlert size={12} /> Estimasi Cadangan Pajak
                    </div>
                    <p className="text-2xl font-black text-white">Rp {prediction.tax.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-500 mt-1">0.5% dari Gross Revenue (PP23/2018)</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                      <Brain size={12} /> AI Strategic Advice
                    </div>
                    <p className="text-xs text-emerald-100 leading-relaxed">"{prediction.advice}"</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Transaction Flow */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
          <Activity size={12} /> Transaction Flow — {transactions.length} transaksi terbaru
        </h2>
        <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-xs">
              <BookOpen size={18} className="mr-2 opacity-40" /> Menunggu data dari Firestore...
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {transactions.slice(0, 20).map((t) => {
                const isIncome = t.transaction_type === 'INCOME' || t.isPositive === true;
                const label = t.description || t.type || (isIncome ? 'Order Revenue' : 'Expense');
                const cat = t.category || (isIncome ? 'Sales' : 'Cost');
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                      <DollarSign size={13} className={isIncome ? 'text-emerald-400' : 'text-rose-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">{label}</p>
                      <p className="text-slate-500 text-[10px]">{cat}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}Rp {(t.amount || 0).toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => generatePDF(t.id, t.amount || 0, isIncome ? 'INCOME' : 'EXPENSE')}
                        className={`opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 ${isIncome ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'} text-[10px] font-bold rounded-lg transition-all`}
                      >
                        <Download size={11} /> PDF
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
