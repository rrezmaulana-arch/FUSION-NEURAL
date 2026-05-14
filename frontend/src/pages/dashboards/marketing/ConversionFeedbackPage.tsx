/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Zap, Brain, ShoppingBag, Send } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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

const TOKEN_COST_PER_ACTION = 15; // estimasi Rp 15 per token action

export default function ConversionFeedbackPage() {
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingToFinance, setIsSendingToFinance] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  // Baca simulator_summary — data real dari MarketplaceSimulator (Admin)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'simulator_summary'), (snap) => {
      setPlatforms(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformSummary));
    });
    return () => unsub();
  }, []);

  const totalRevenue = platforms.reduce((a, p) => a + p.total_revenue, 0);
  const totalOrders = platforms.reduce((a, p) => a + p.total_orders, 0);
  const estimatedTokenCost = totalOrders * TOKEN_COST_PER_ACTION;
  const topPlatform = [...platforms].sort((a, b) => b.total_revenue - a.total_revenue)[0];

  const handleStrategySuggestion = async () => {
    setIsAnalyzing(true);
    setSuggestion('');
    try {
      const statsText = platforms.length > 0
        ? platforms.map(p =>
            `${p.platform.replace('_', ' ')}: ${p.total_orders} konversi, Revenue Rp ${p.total_revenue.toLocaleString('id-ID')}, produk terakhir: ${p.last_order}`
          ).join('\n')
        : 'Belum ada data simulator.';

      const result = await NeuralCore.askAgent(
        'manager',
        'executive_overview',
        `Data Konversi: ${statsText}\n\nInstruksi: Analisis performa konversi per platform berikut. Rekomendasikan: apakah kampanye harus dilanjutkan, dioptimasi, atau dihentikan? Berikan insight actionable dalam Bahasa Indonesia.`
      );
      setSuggestion(result?.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1') || 'Tidak ada rekomendasi dari AI.');
      await FirebaseLogger.logAgentAction('Marketing', 'CONVERSION_ANALYSIS', `${platforms.length} platform dianalisis, revenue Rp ${totalRevenue.toLocaleString('id-ID')}`);
    } catch (error) {
      console.error(error);
      setSuggestion('Gagal menghubungi AI Manager. Periksa koneksi API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ "Lapor ke Finance" — kirim api_cost nyata ke financial_reports
  const handleSendToFinance = async () => {
    setIsSendingToFinance(true);
    setSentMsg('');
    try {
      await setDoc(doc(db, 'financial_reports', 'latest'), {
        api_cost: estimatedTokenCost,
        total_campaign_revenue: totalRevenue,
        total_orders_reported: totalOrders,
        reported_by: 'Marketing',
        reported_at: new Date().toISOString(),
      }, { merge: true });

      await FirebaseLogger.logAgentAction(
        'Marketing',
        'COST_REPORTED',
        `Biaya token kampanye Rp ${estimatedTokenCost.toLocaleString('id-ID')} dilaporkan ke Finance (financial_reports/latest)`
      );
      setSentMsg(`✅ Biaya token Rp ${estimatedTokenCost.toLocaleString('id-ID')} berhasil dilaporkan ke Finance. OperationalBurn & ExecutiveSummary telah diperbarui.`);
      setTimeout(() => setSentMsg(''), 6000);
    } catch (error) {
      console.error(error);
      setSentMsg('❌ Gagal mengirim ke Finance. Periksa koneksi Firestore.');
    } finally {
      setIsSendingToFinance(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Conversion Feedback"
        subtitle="Data konversi real dari Marketplace Simulator — analisis & laporan ke Finance"
        accent="purple"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tombol Lapor ke Finance */}
            <button
              onClick={handleSendToFinance}
              disabled={isSendingToFinance || platforms.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-md"
            >
              <Send size={14} className={isSendingToFinance ? 'animate-spin' : ''} />
              {isSendingToFinance ? 'Mengirim...' : 'Lapor ke Finance'}
            </button>
            <button onClick={handleStrategySuggestion} disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
            >
              <Brain size={14} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Menganalisis...' : 'Analisis AI'}
            </button>
          </div>
        }
      />

      {/* Koneksi Badge */}
      <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5">
        <Zap size={13} className="text-purple-500 shrink-0" />
        <span>Membaca <code className="font-mono">simulator_summary</code> dari Admin · "Lapor ke Finance" menulis ke <code className="font-mono">financial_reports/latest.api_cost</code></span>
      </div>

      {/* Sent Message */}
      <AnimatePresence>
        {sentMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 rounded-2xl p-4 border ${sentMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
          >
            <p className={`text-sm font-bold ${sentMsg.startsWith('✅') ? 'text-emerald-700' : 'text-rose-700'}`}>{sentMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `Rp ${(totalRevenue / 1e6).toFixed(2)}M`, icon: <TrendingUp size={16} />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Est. Token Cost', value: `Rp ${estimatedTokenCost.toLocaleString('id-ID')}`, icon: <Zap size={16} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Konversi', value: totalOrders, icon: <BarChart3 size={16} />, color: 'bg-purple-50 text-purple-600' },
          { label: 'Top Platform', value: topPlatform?.platform?.replace('_', ' ') || '–', icon: <ShoppingBag size={16} />, color: 'bg-amber-50 text-amber-600' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>{kpi.icon}</div>
            <div className="text-2xl font-black text-slate-800">{kpi.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Platform Breakdown */}
      {platforms.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 border border-dashed border-slate-200 text-center">
          <ShoppingBag size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-slate-400 text-sm font-bold">Belum ada data simulasi.</p>
          <p className="text-slate-400 text-xs mt-1">Jalankan Marketplace Simulator di Admin terlebih dahulu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2"><BarChart3 size={16} /> ROI Tracker — Per Platform (Real Data)</h3>
          <div className="space-y-4">
            {[...platforms].sort((a, b) => b.total_revenue - a.total_revenue).map((p, i) => {
              const estSpend = p.total_revenue * 0.18;
              const roi = estSpend > 0 ? Math.round(((p.total_revenue - estSpend) / estSpend) * 100) : 0;
              const isGood = roi >= 200;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{p.platform.replace('_', ' ')}</p>
                      <div className={`flex items-center gap-1 text-xs font-black ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {roi}%
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(roi / 5, 100)}%` }}
                        transition={{ duration: 1.2, delay: i * 0.08 }}
                        className={`h-2 rounded-full ${isGood ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{p.total_orders} konversi · Revenue Rp {(p.total_revenue / 1e3).toFixed(0)}K</span>
                      <span>Est. Token: Rp {(p.total_orders * TOKEN_COST_PER_ACTION).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engagement Pulse (generatif) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2"><Zap size={16} /> Engagement Pulse — Distribusi Revenue Per Platform</h3>
        <div className="flex items-end gap-3 h-24">
          {platforms.length === 0
            ? [40, 65, 45, 80, 70, 95, 60].map((v, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${v}%` }}
                  transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                  className="flex-1 rounded-t-lg bg-slate-200"
                />
              ))
            : platforms.map((p, i) => {
                const pct = maxPct(p.total_revenue, platforms);
                const colorArr = ['bg-pink-400', 'bg-green-500', 'bg-orange-500'];
                return (
                  <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 1.0, delay: i * 0.07 }}
                      className={`w-full rounded-t-lg ${colorArr[i % 3]}`}
                      style={{ minHeight: 4 }}
                      title={p.platform}
                    />
                    <span className="text-[9px] text-slate-400 truncate">{p.platform.replace('_', ' ')}</span>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* AI Strategy Suggestion */}
      {suggestion && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-teal-400" />
            <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Strategy Suggestion — AI Manager</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{suggestion}</p>
        </motion.div>
      )}
    </div>
  );
}

function maxPct(value: number, platforms: PlatformSummary[]): number {
  const max = Math.max(...platforms.map(p => p.total_revenue), 1);
  return Math.round((value / max) * 100);
}
