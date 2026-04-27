import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Zap, Brain } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';

interface CampaignStat {
  id: string;
  name: string;
  platform: string;
  clicks: number;
  conversions: number;
  tokenCost: number;
  revenue: number;
  roi: number;
}

const MOCK_CAMPAIGNS: CampaignStat[] = [
  { id: '1', name: 'Premium Launch — Instagram', platform: 'Instagram', clicks: 4820, conversions: 134, tokenCost: 15000, revenue: 3400000, roi: 226 },
  { id: '2', name: 'Overstock Promo — TikTok', platform: 'TikTok', clicks: 12400, conversions: 89, tokenCost: 8000, revenue: 1780000, roi: 222 },
  { id: '3', name: 'SEO Content — Web', platform: 'Web', clicks: 2100, conversions: 21, tokenCost: 5000, revenue: 525000, roi: 105 },
];

export default function ConversionFeedbackPage() {
  const [suggestion, setSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), () => {
      // Finance data loaded — future use
    });
    return () => unsub();
  }, []);

  const handleStrategySuggestion = async () => {
    setIsAnalyzing(true);
    setSuggestion('');
    try {
      const statsText = MOCK_CAMPAIGNS.map(c =>
        `${c.name}: ${c.clicks} klik, ${c.conversions} konversi, ROI ${c.roi}%`
      ).join('\n');
      const result = await NeuralCore.generateMarketingCampaign(
        statsText,
        'Analisis performa kampanye berikut dan berikan rekomendasi: apakah harus dilanjutkan, dioptimasi, atau dihentikan?'
      );
      setSuggestion(result || 'Tidak ada rekomendasi dari AI.');
    } catch (e) {
      setSuggestion('Gagal menghubungi AI Manager. Periksa koneksi API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalRevenue = MOCK_CAMPAIGNS.reduce((a, c) => a + c.revenue, 0);
  const totalTokenCost = MOCK_CAMPAIGNS.reduce((a, c) => a + c.tokenCost, 0);
  const totalConversions = MOCK_CAMPAIGNS.reduce((a, c) => a + c.conversions, 0);
  const avgROI = Math.round(MOCK_CAMPAIGNS.reduce((a, c) => a + c.roi, 0) / MOCK_CAMPAIGNS.length);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Conversion Feedback</h1>
          <p className="text-slate-500 text-sm mt-1">Di mana kreativitas bertemu data — analisis efisiensi kampanye</p>
        </div>
        <button onClick={handleStrategySuggestion} disabled={isAnalyzing}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Brain size={15} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Menganalisis...' : 'Analisis AI'}
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `Rp ${(totalRevenue/1e6).toFixed(1)}M`, icon: <TrendingUp size={16} />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Token Cost', value: `Rp ${totalTokenCost.toLocaleString('id-ID')}`, icon: <Zap size={16} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Konversi', value: totalConversions, icon: <BarChart3 size={16} />, color: 'bg-purple-50 text-purple-600' },
          { label: 'Avg ROI', value: `${avgROI}%`, icon: <TrendingUp size={16} />, color: 'bg-amber-50 text-amber-600' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>{kpi.icon}</div>
            <div className="text-2xl font-black text-slate-800">{kpi.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Campaign Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2"><BarChart3 size={16} /> ROI Tracker — Per Kampanye</h3>
        <div className="space-y-4">
          {MOCK_CAMPAIGNS.map((camp, i) => {
            const isGood = camp.roi >= 150;
            return (
              <motion.div key={camp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{camp.name}</p>
                    <div className={`flex items-center gap-1 text-xs font-black ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {camp.roi}%
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(camp.roi / 3, 100)}%` }}
                      transition={{ duration: 1.2, delay: i * 0.08 }}
                      className={`h-2 rounded-full ${isGood ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{camp.clicks.toLocaleString()} klik · {camp.conversions} konversi</span>
                    <span>Token: Rp {camp.tokenCost.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Engagement Pulse */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2"><Zap size={16} /> Engagement Pulse</h3>
        <div className="flex items-end gap-1.5 h-24">
          {[40, 65, 45, 80, 70, 95, 60, 75, 85, 55, 90, 72, 88, 65].map((v, i) => (
            <motion.div key={i}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
              className={`flex-1 rounded-t-lg ${i === 5 || i === 10 ? 'bg-purple-500' : 'bg-slate-200'}`}
              title={`${v}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-2">
          <span>14 hari terakhir</span>
          <span className="text-purple-600 font-bold">Peak: +95%</span>
        </div>
      </div>

      {/* AI Strategy Suggestion */}
      {suggestion && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-teal-400" />
            <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Strategy Suggestion — AI Manager</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
        </motion.div>
      )}
    </div>
  );
}
