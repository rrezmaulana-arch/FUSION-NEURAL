import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TrendingUp, TrendingDown, BarChart3, Brain, ArrowUpRight, ShoppingBag, Zap } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface PlatformSummary {
  id: string;
  platform: string;
  total_orders: number;
  total_revenue: number;
  last_order: string;
  last_buyer: string;
}

interface FinanceData {
  revenue?: number;
  cost?: number;
  net_profit?: number;
  roi_percentage?: number;
}

const PLATFORM_DOTS: Record<string, string> = {
  TikTok_Shop: 'bg-pink-400',
  Tokopedia: 'bg-green-400',
  Shopee: 'bg-orange-400',
};

export default function ROIIntelligencePage() {
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Baca simulator_summary — data real dari MarketplaceSimulator
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'simulator_summary'), (snap) => {
      setPlatforms(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformSummary));
    });
    return () => unsub();
  }, []);

  // Baca financial_reports/latest — dari TaxCalculator & ExecutiveSummary
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) setFinanceData(snap.data() as FinanceData);
    });
    return () => unsub();
  }, []);

  const totalSpend = platforms.reduce((a, p) => a + (p.total_revenue * 0.18), 0); // est 18% COGS
  const totalRevenue = platforms.reduce((a, p) => a + p.total_revenue, 0);
  const avgROI = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
  const topPlatform = [...platforms].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  const maxRevenue = Math.max(...platforms.map(p => p.total_revenue), 1);

  const handleSpendingStrategy = async () => {
    setIsAnalyzing(true);
    setSuggestion('');
    try {
      const summary = platforms.length > 0
        ? platforms.map(p =>
            `${p.platform.replace('_', ' ')}: ${p.total_orders} pesanan, Revenue Rp ${p.total_revenue.toLocaleString('id-ID')}, Est. Spend Rp ${Math.round(p.total_revenue * 0.18).toLocaleString('id-ID')}`
          ).join('\n')
        : 'Belum ada data simulasi marketplace.';

      const financeCtx = financeData
        ? `\nData Finance: Net Profit Rp ${(financeData.net_profit || 0).toLocaleString('id-ID')}, ROI ${financeData.roi_percentage || 0}%`
        : '';

      const result = await NeuralCore.generateMarketingCampaign(
        summary + financeCtx,
        'Sebagai AI Finance, analisis efisiensi per platform dan rekomendasikan alokasi anggaran optimal. Mana yang perlu di-scale up dan mana yang harus dipangkas? Singkat dan actionable.'
      );
      setSuggestion(result.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'));

      // Simpan analysis ke financial_reports untuk dibaca Manager
      await setDoc(doc(db, 'financial_reports', 'latest'), {
        roi_analysis: result,
        roi_percentage: avgROI,
        total_marketplace_revenue: totalRevenue,
        analyzed_at: new Date().toISOString(),
      }, { merge: true });

      await FirebaseLogger.logAgentAction('Finance', 'ROI_ANALYSIS', `Platform terbaik: ${topPlatform?.platform || '–'}, Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
      setSavedMsg('Analisis ROI disimpan ke financial_reports — Manager dapat melihatnya di Executive Summary.');
      setTimeout(() => setSavedMsg(''), 5000);
    } catch (e) {
      setSuggestion('Gagal menghubungi AI Finance. Periksa koneksi API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ROI Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Menilai imbal hasil per platform — data real dari Marketplace Simulator</p>
        </div>
        <button onClick={handleSpendingStrategy} disabled={isAnalyzing}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Brain size={15} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Menganalisis...' : 'Spending Strategy'}
        </button>
      </div>

      {/* Koneksi Badge */}
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
        <Zap size={13} className="text-emerald-500 shrink-0" />
        <span>Membaca dari <code className="font-mono">simulator_summary</code> (Admin) &amp; <code className="font-mono">financial_reports</code> (Finance) · Output analisis dikirim ke Manager</span>
      </div>

      {/* Saved Message */}
      <AnimatePresence>
        {savedMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-emerald-700">{savedMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `Rp ${(totalRevenue / 1e6).toFixed(2)}M`, trend: 'up', icon: <TrendingUp size={16} />, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Est. Total COGS', value: `Rp ${(totalSpend / 1e3).toFixed(0)}K`, trend: 'neutral', icon: <BarChart3 size={16} />, color: 'bg-slate-50 border-slate-200' },
          { label: 'Avg ROI (Simulator)', value: `${avgROI}%`, trend: avgROI >= 0 ? 'up' : 'down', icon: <ArrowUpRight size={16} />, color: 'bg-purple-50 border-purple-200' },
          { label: 'Top Platform', value: topPlatform?.platform?.replace('_', ' ') || '–', trend: 'up', icon: <ShoppingBag size={16} />, color: 'bg-amber-50 border-amber-200' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-5 border shadow-sm ${kpi.color}`}>
            <div className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1">{kpi.icon}{kpi.label}</div>
            <div className="text-xl font-black text-slate-800 truncate">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Platform Performance */}
      {platforms.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 border border-dashed border-slate-200 text-center">
          <ShoppingBag size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-slate-400 text-sm font-bold">Belum ada data simulasi marketplace.</p>
          <p className="text-slate-400 text-xs mt-1">Jalankan Marketplace Simulator di Admin untuk mengisi data ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart3 size={16} /> Platform Efficiency</h3>
          <div className="space-y-5">
            {[...platforms].sort((a, b) => b.total_revenue - a.total_revenue).map((p, i) => {
              const estSpend = p.total_revenue * 0.18;
              const roi = estSpend > 0 ? Math.round(((p.total_revenue - estSpend) / estSpend) * 100) : 0;
              const pct = (p.total_revenue / maxRevenue) * 100;
              const colorKey = p.platform.replace(' ', '_');
              const dot = PLATFORM_DOTS[colorKey] || 'bg-slate-400';
              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <span className="text-xs font-bold text-slate-700">{p.platform.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">{p.total_orders} orders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">Est. COGS: Rp {(estSpend / 1e3).toFixed(0)}K</span>
                      <span className={`text-xs font-black flex items-center gap-0.5 ${roi >= 300 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {roi >= 300 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {roi}% ROI
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.1, delay: i * 0.07 }}
                      className={`h-2 rounded-full ${dot.replace('bg-', 'bg-').replace('-400', '-500')}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Revenue: Rp {(p.total_revenue / 1e3).toFixed(0)}K</span>
                    <span>Produk terakhir: {p.last_order}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finance Context dari financial_reports */}
      {financeData && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-500" /> Konteks Keuangan Real (dari AI Finance)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Net Profit', value: financeData.net_profit ? `Rp ${(financeData.net_profit / 1e6).toFixed(2)}M` : '–' },
              { label: 'ROI (Finance)', value: financeData.roi_percentage != null ? `${financeData.roi_percentage}%` : '–' },
              { label: 'Revenue', value: financeData.revenue ? `Rp ${(financeData.revenue / 1e6).toFixed(2)}M` : '–' },
              { label: 'Biaya Ops', value: financeData.cost ? `Rp ${(financeData.cost / 1e3).toFixed(0)}K` : '–' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{item.label}</p>
                <p className="text-sm font-black text-slate-800 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Spending Strategy */}
      {suggestion && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Spending Strategy — AI Finance</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{suggestion}</p>
        </motion.div>
      )}
    </div>
  );
}
