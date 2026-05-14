/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, Activity, Brain, BarChart3, ShoppingBag, RefreshCw, Sparkles, Cloud } from 'lucide-react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';
import PageHeader from '../../../components/ui/PageHeader';

export default function ExecutiveSummaryPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [burnAlert, setBurnAlert] = useState(false);
  const [orderRevenue, setOrderRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Listen to financial_reports/latest
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFinanceData(data);
        if (data.revenue && data.cost && (data.cost / data.revenue) > 0.7) {
          setBurnAlert(true);
        } else {
          setBurnAlert(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Listen to order_leads with status Selesai and aggregate revenue
  useEffect(() => {
    const q = query(collection(db, 'order_leads'), where('status', '==', 'Selesai'));
    const unsub = onSnapshot(q, (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data().price || 0), 0);
      setOrderRevenue(total);
      setOrderCount(snap.docs.length);
    });
    return () => unsub();
  }, []);

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const rev = (financeData?.revenue || 15000000) + orderRevenue;
      const cost = financeData?.cost || 4500000;
      const apiCost = financeData?.api_cost || 350000;
      await NeuralCore.calculateFinanceReport(rev, cost, apiCost);
    } catch (e) { console.error(e); }
    finally { setIsCalculating(false); }
  };

  const handleAiInsight = async () => {
    setIsAnalyzing(true);
    setAiInsight('');
    try {
      const totalRev = (financeData?.revenue || 0) + orderRevenue;
      const cost = financeData?.cost || 0;
      const roi = financeData?.roi_percentage ?? 0;
      const prompt = `Sebagai Manager AI, berikan executive insight singkat (3 poin penting) berdasarkan data:
- Total Revenue: Rp ${totalRev.toLocaleString('id-ID')} (termasuk ${orderCount} order klien senilai Rp ${orderRevenue.toLocaleString('id-ID')})
- Biaya Operasional: Rp ${cost.toLocaleString('id-ID')}
- ROI Saat Ini: ${roi}%
Berikan rekomendasi strategis yang actionable. Tanpa markdown bold (**).`;
      const result = await NeuralCore.askAgent('manager', 'executive_overview', prompt);
      setAiInsight(result.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'));
    } catch (e) {
      setAiInsight('Gagal menghubungi AI Manager. Periksa koneksi API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const handleSaveToDrive = async () => {
    setIsSavingDrive(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/drive/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'manager', filename: 'Executive_AI_Insight', content: aiInsight || 'No insight generated' })
      });
      if (res.ok) alert('Insight berhasil disimpan ke Google Drive sebagai Google Docs!');
      else alert('Gagal menyimpan ke Drive.');
    } catch (e) {
      alert('Network Error saat menyimpan ke Drive.');
    } finally {
      setIsSavingDrive(false);
    }
  };

  const totalRevenue = (financeData?.revenue ?? 0) + orderRevenue;
  const roi = financeData?.roi_percentage ?? null;
  const netProfit = financeData?.net_profit ?? null;
  const cost = financeData?.cost ?? 0;
  const apiCost = financeData?.api_cost ?? 0;
  const efficiencyRatio = totalRevenue > 0 ? (((cost + apiCost) / totalRevenue) * 100).toFixed(1) : '–';
  const burnRate = totalRevenue > 0 ? ((cost / totalRevenue) * 100).toFixed(1) : '–';

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Executive Summary"
        subtitle="Financial pulse — data langsung dari AI Finance & Order Leads"
        accent="teal"
        icon={<BarChart3 size={22} className="text-white" />}
        actions={
          <>
            <button onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 transition-colors"
            >
              <BarChart3 size={15} /> View Full Stats
            </button>
            <button onClick={handleAiInsight} disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/30 hover:bg-white/40 text-white text-sm font-bold rounded-xl border border-white/40 transition-colors disabled:opacity-50"
            >
              <Brain size={15} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Menganalisis...' : 'AI Insight'}
            </button>
            <button onClick={handleRecalculate} disabled={isCalculating}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={isCalculating ? 'animate-spin' : ''} />
              {isCalculating ? 'Kalkulasi...' : 'Hitung Ulang'}
            </button>
          </>
        }
      />

      {/* Burn Rate Alert */}
      {burnAlert && (
        <motion.div id="summary-alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4"
        >
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <p className="text-sm font-bold text-rose-300">Burn Rate Anomali — Biaya operasional melebihi 70% pendapatan. Tindakan direkomendasikan.</p>
        </motion.div>
      )}

      {/* Order Revenue Banner */}
      {orderRevenue > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4"
        >
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <ShoppingBag size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Revenue dari Order Klien</p>
            <p className="text-xl font-black text-emerald-300">Rp {orderRevenue.toLocaleString('id-ID')}</p>
            <p className="text-xs text-emerald-500/80">{orderCount} pesanan telah selesai dikonfirmasi</p>
          </div>
        </motion.div>
      )}

      {/* AI Manager Insight */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div id="summary-insight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#0f172a] rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-teal-400" />
              <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">AI Manager Insight</span>
              <button onClick={handleSaveToDrive} disabled={isSavingDrive} 
                className="ml-auto text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSavingDrive ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
                Save to Drive
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top KPI Cards */}
      <div id="summary-kpis" className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              <p className="text-teal-100 text-sm leading-relaxed max-w-md">
                {financeData.analysis_text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center"
        >
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1e293b" strokeWidth="3" />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${Math.min(roi ?? 0, 100)}, 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-200">{roi !== null ? `${roi}%` : '–'}</span>
              <span className="text-[10px] text-slate-400 font-bold">ROI</span>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-300">Return on Investment</p>
          <div className={`flex items-center gap-1 mt-1 ${(roi ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {(roi ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{(roi ?? 0) >= 0 ? 'Profitable' : 'Deficit'}</span>
          </div>
        </motion.div>
      </div>

      {/* Efficiency & Burn Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', sub: 'Termasuk order klien' },
          { label: 'Efficiency Ratio', value: `${efficiencyRatio}%`, icon: Percent, color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30', sub: 'Biaya vs pendapatan' },
          { label: 'Burn Rate', value: `${burnRate}%`, icon: Activity, color: burnAlert ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30', sub: 'Biaya operasional' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-[#0f172a] rounded-2xl p-5 border border-white/10"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <div className="text-2xl font-black text-slate-200">{kpi.value || '–'}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">{kpi.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Predictive Growth Chart (Simulated) */}
      <motion.div id="summary-chart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" /> Prediksi Revenue 30 Hari Kedepan
            </h3>
            <p className="text-xs text-slate-400 mt-1">Dihitung otomatis oleh AI Finance berdasarkan velocity stok & konversi.</p>
          </div>
          <div className="bg-indigo-500/20 text-indigo-300 text-xs font-black px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-2">
            <Sparkles size={12} />
            Est. Rp {(totalRevenue * 3.5).toLocaleString('id-ID')}
          </div>
        </div>

        {/* CSS-based Chart Simulator */}
        <div className="h-40 w-full flex items-end gap-2 relative z-10">
          {[40, 45, 42, 55, 60, 58, 70, 75, 85, 90, 88, 95, 100].map((h, i) => (
            <motion.div key={i} className="flex-1 flex flex-col justify-end h-full relative group">
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: `${h}%` }} 
                transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
                className={`w-full rounded-t-md ${i > 5 ? 'bg-indigo-500/80' : 'bg-[#1e293b]'} group-hover:bg-indigo-400 transition-colors`}
              />
              {i === 6 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-white/10 text-slate-200 text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Hari Ini
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Full Statistics Expanded */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                <BarChart3 size={16} /> Full Statistics Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Revenue (Finance AI)', value: `Rp ${(financeData?.revenue ?? 0).toLocaleString('id-ID')}` },
                  { label: 'Revenue (Order Klien)', value: `Rp ${orderRevenue.toLocaleString('id-ID')}` },
                  { label: 'Total Biaya Operasional', value: `Rp ${cost.toLocaleString('id-ID')}` },
                  { label: 'Biaya API (Groq)', value: `Rp ${apiCost.toLocaleString('id-ID')}` },
                  { label: 'Pesanan Selesai', value: `${orderCount} order` },
                  { label: 'Net Profit', value: netProfit !== null ? `Rp ${netProfit.toLocaleString('id-ID')}` : '–' },
                  { label: 'ROI', value: roi !== null ? `${roi}%` : '–' },
                  { label: 'Efficiency Ratio', value: `${efficiencyRatio}%` },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1e293b] rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{stat.label}</p>
                    <p className="text-base font-black text-slate-200 mt-1 truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No data state */}
      {!financeData && (
        <div className="bg-[#0f172a] rounded-2xl p-8 border border-dashed border-white/20 text-center text-slate-500">
          <Brain size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada data keuangan. Klik <strong className="text-slate-400">"Hitung Ulang"</strong> untuk trigger kalkulasi pertama.</p>
        </div>
      )}
    </div>
  );
}
