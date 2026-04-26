import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, Activity, Brain } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';

export default function ExecutiveSummaryPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [burnAlert, setBurnAlert] = useState(false);

  // Listen to finance_reports/latest from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFinanceData(data);
        // Burn Rate alert: if cost > 70% of revenue
        if (data.revenue && data.cost && (data.cost / data.revenue) > 0.7) {
          setBurnAlert(true);
        } else {
          setBurnAlert(false);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const revenue = financeData?.revenue || 15000000;
      const cost = financeData?.cost || 4500000;
      const apiCost = financeData?.api_cost || 350000;
      await NeuralCore.calculateFinanceReport(revenue, cost, apiCost);
    } catch (e) { console.error(e); }
    finally { setIsCalculating(false); }
  };

  const roi = financeData?.roi_percentage ?? null;
  const netProfit = financeData?.net_profit ?? null;
  const revenue = financeData?.revenue ?? 0;
  const cost = financeData?.cost ?? 0;
  const apiCost = financeData?.api_cost ?? 0;
  const efficiencyRatio = revenue > 0 ? (((cost + apiCost) / revenue) * 100).toFixed(1) : '–';
  const burnRate = revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : '–';

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Executive Summary</h1>
          <p className="text-slate-500 text-sm mt-1">Financial pulse — data langsung dari AI Finance</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isCalculating}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Brain size={15} className={isCalculating ? 'animate-spin' : ''} />
          {isCalculating ? 'Kalkulasi...' : 'Hitung Ulang AI'}
        </button>
      </div>

      {/* Burn Rate Alert */}
      {burnAlert && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4"
        >
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <p className="text-sm font-bold text-rose-700">⚠️ Burn Rate Anomali — Biaya operasional melebihi 70% pendapatan. Tindakan direkomendasikan.</p>
        </motion.div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Profit Glassmorphism Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 relative rounded-3xl p-8 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-teal-200 text-sm font-semibold mb-2">Net Profit (AI Calculated)</p>
            <div className="text-5xl font-black text-white mb-4">
              {netProfit !== null
                ? `Rp ${netProfit.toLocaleString('id-ID')}`
                : <span className="text-3xl text-white/60">Belum dikalkulasi</span>
              }
            </div>
            {financeData?.analysis_text && (
              <p className="text-teal-100 text-sm leading-relaxed max-w-md">{financeData.analysis_text}</p>
            )}
          </div>
        </motion.div>

        {/* ROI Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center"
        >
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${Math.min(roi ?? 0, 100)}, 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{roi !== null ? `${roi}%` : '–'}</span>
              <span className="text-[10px] text-slate-400 font-bold">ROI</span>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700">Return on Investment</p>
          <div className={`flex items-center gap-1 mt-1 ${(roi ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {(roi ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{(roi ?? 0) >= 0 ? 'Profitable' : 'Deficit'}</span>
          </div>
        </motion.div>
      </div>

      {/* Efficiency & Burn Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: 'Revenue', value: `Rp ${revenue.toLocaleString('id-ID')}`,
            icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', sub: 'Total pemasukan'
          },
          {
            label: 'Efficiency Ratio', value: `${efficiencyRatio}%`,
            icon: Percent, color: 'bg-blue-50 text-blue-600', sub: 'Biaya vs pendapatan'
          },
          {
            label: 'Burn Rate', value: `${burnRate}%`,
            icon: Activity, color: burnAlert ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600',
            sub: 'Biaya operasional'
          },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <div className="text-2xl font-black text-slate-800">{kpi.value || '–'}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">{kpi.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* No data state */}
      {!financeData && (
        <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center text-slate-400">
          <Brain size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada data keuangan. Klik <strong>"Hitung Ulang AI"</strong> untuk trigger kalkulasi pertama.</p>
        </div>
      )}
    </div>
  );
}
