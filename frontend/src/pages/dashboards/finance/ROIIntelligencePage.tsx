/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TrendingUp, TrendingDown, BarChart3, Brain, ArrowUpRight, ShoppingBag, Zap, ShieldAlert, ScanSearch, Globe } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

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

  // Audit Simulator States
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [anomaly, setAnomaly] = useState<{ detected: boolean, message: string } | null>(null);

  const [globalMarket, setGlobalMarket] = useState('');
  const [isFetchingMarket, setIsFetchingMarket] = useState(false);

  const fetchGlobalMarket = async () => {
    setIsFetchingMarket(true);
    setGlobalMarket('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/finance/market-data`);
      const data = await res.json();

      // Format rates object into readable text
      let formatted = `📊 LIVE CURRENCY DATA (Base: ${data.base || 'IDR'})\n`;
      formatted += `🕐 Updated: ${data.updated || new Date().toLocaleDateString()}\n`;
      formatted += `📡 Source: ${data.source || 'API'}\n\n`;
      if (data.rates) {
        const rateMap: Record<string, string> = {
          USD: '🇺🇸 USD', EUR: '🇪🇺 EUR', GBP: '🇬🇧 GBP', JPY: '🇯🇵 JPY',
          SGD: '🇸🇬 SGD', MYR: '🇲🇾 MYR', CNY: '🇨🇳 CNY', AUD: '🇦🇺 AUD',
          CHF: '🇨🇭 CHF', SAR: '🇸🇦 SAR',
        };
        Object.entries(data.rates).forEach(([code, rate]) => {
          const idrRate = data.base === 'IDR' ? (1 / Number(rate)).toFixed(0) : rate;
          const label = rateMap[code] || code;
          formatted += `${label}: Rp ${Number(idrRate).toLocaleString('id-ID')}\n`;
        });
      }
      setGlobalMarket(formatted);

      // Auto-save to Drive
      await fetch(`${apiUrl}/api/drive/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'finance', filename: 'Global_Market_Report', content: formatted })
      });

      setSavedMsg('✅ Data kurs live berhasil diambil & disimpan ke Google Drive!');
      setTimeout(() => setSavedMsg(''), 5000);
    } catch (e) {
      setGlobalMarket('❌ Gagal mengambil data kurs. Pastikan backend Python berjalan.');
    } finally {
      setIsFetchingMarket(false);
    }
  };


  const runDeepAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setAnomaly(null);

    const interval = setInterval(() => {
      setAuditProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsAuditing(false);
          setAnomaly({
            detected: true,
            message: "⚠️ ANOMALI TERDETEKSI: Ditemukan pembayaran ganda ke 'Supplier Packaging B' sebesar Rp 15.000.000 pada tgl 4 Mei. Tindakan Otonom: Mengunci dana, membekukan transfer API, dan mengirimkan email Reversal (penarikan kembali)."
          });
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

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

      const result = await NeuralCore.askAgent(
        'finance',
        'allocation_strategy',
        `Konteks: ${summary + financeCtx}\n\nInstruksi: Sebagai AI Finance, analisis efisiensi per platform dan rekomendasikan alokasi anggaran optimal. Mana yang perlu di-scale up dan mana yang harus dipangkas? Singkat dan actionable.`
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
      <PageHeader
        title="ROI Intelligence"
        subtitle="Menilai imbal hasil per platform — data real dari Marketplace Simulator"
        accent="emerald"
        icon={<TrendingUp size={22} className="text-white" />}
        actions={
          <div className="flex gap-2">
            <button onClick={runDeepAudit} disabled={isAuditing}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 text-sm font-bold rounded-xl border border-rose-500/30 transition-colors disabled:opacity-50"
            >
              <ScanSearch size={15} className={isAuditing ? 'animate-pulse' : ''} />
              {isAuditing ? 'Scanning 10,000+ TX...' : 'Run Deep Audit'}
            </button>
            <button onClick={handleSpendingStrategy} disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 transition-colors disabled:opacity-50"
            >
              <Brain size={15} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Menganalisis...' : 'Spending Strategy'}
            </button>
            <button onClick={fetchGlobalMarket} disabled={isFetchingMarket}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-100 text-sm font-bold rounded-xl border border-blue-500/30 transition-colors disabled:opacity-50"
            >
              <Globe size={15} className={isFetchingMarket ? 'animate-spin' : ''} />
              {isFetchingMarket ? 'Syncing...' : 'Global Market'}
            </button>
          </div>
        }
      />

      {/* Audit Simulation UI */}
      <AnimatePresence>
        {isAuditing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
              <ScanSearch size={16} className="animate-spin-slow" /> Finance AI: Deep Audit Running
            </h3>
            <div className="relative z-10 space-y-2">
              <div className="flex justify-between text-xs font-mono text-emerald-500/70">
                <span>Scanning Ledger DB...</span>
                <span>{auditProgress}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500" style={{ width: `${auditProgress}%` }} />
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-2">Checking anomalies, double spending, and tax compliance across 14,023 records...</p>
            </div>
          </motion.div>
        )}

        {anomaly && anomaly.detected && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-950/50 rounded-3xl p-6 border border-rose-900 shadow-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10">
              <ShieldAlert size={80} className="text-rose-500" />
            </div>
            <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
              <ShieldAlert size={16} /> Critical Anomaly Detected
            </h3>
            <p className="text-sm font-medium text-rose-200 relative z-10 leading-relaxed">
              {anomaly.message}
            </p>
            <div className="mt-4 flex gap-3 relative z-10">
              <span className="px-3 py-1 bg-rose-900/50 text-rose-300 text-xs font-bold rounded-lg border border-rose-800">Status: FUND LOCKED</span>
              <span className="px-3 py-1 bg-emerald-900/50 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800">Status: REVERSAL SENT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Global Market Data */}
      {globalMarket && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-blue-950/50 rounded-2xl p-6 border border-blue-900 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Global Market Movement (Massive API)</span>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">{globalMarket}</p>
        </motion.div>
      )}
    </div>
  );
}
