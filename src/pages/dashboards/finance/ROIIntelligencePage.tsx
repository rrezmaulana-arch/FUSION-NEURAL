import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Brain, ArrowUpRight } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  spend: number;
  revenue: number;
  roi: number;
  color: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Campaign Forge — Instagram', platform: 'Instagram', spend: 450000, revenue: 3400000, roi: 656, color: 'bg-pink-500' },
  { id: '2', name: 'Overstock Promo — TikTok', platform: 'TikTok', spend: 200000, revenue: 1780000, roi: 790, color: 'bg-slate-800' },
  { id: '3', name: 'SEO Content — Web', platform: 'Web', spend: 120000, revenue: 525000, roi: 337, color: 'bg-blue-500' },
  { id: '4', name: 'Email Blast — Premium', platform: 'Email', spend: 80000, revenue: 640000, roi: 700, color: 'bg-amber-500' },
];

export default function ROIIntelligencePage() {
  const [suggestion, setSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalSpend = CAMPAIGNS.reduce((a, c) => a + c.spend, 0);
  const totalRevenue = CAMPAIGNS.reduce((a, c) => a + c.revenue, 0);
  const avgROI = Math.round(CAMPAIGNS.reduce((a, c) => a + c.roi, 0) / CAMPAIGNS.length);
  const topCampaign = [...CAMPAIGNS].sort((a, b) => b.roi - a.roi)[0];
  const maxRev = Math.max(...CAMPAIGNS.map(c => c.revenue));

  const handleSpendingStrategy = async () => {
    setIsAnalyzing(true);
    setSuggestion('');
    try {
      const summary = CAMPAIGNS.map(c =>
        `${c.name}: Spend Rp ${c.spend.toLocaleString('id-ID')}, Revenue Rp ${c.revenue.toLocaleString('id-ID')}, ROI ${c.roi}%`
      ).join('\n');
      const result = await NeuralCore.generateMarketingCampaign(
        summary,
        'Sebagai AI Finance, analisis efisiensi kampanye dan rekomendasikan alokasi anggaran optimal. Mana yang perlu di-scale up dan mana yang harus dipangkas?'
      );
      setSuggestion(result);
    } catch (e) {
      setSuggestion('Gagal menghubungi AI. Periksa koneksi API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ROI Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Menilai imbal hasil dari setiap kampanye secara finansial</p>
        </div>
        <button onClick={handleSpendingStrategy} disabled={isAnalyzing}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Brain size={15} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Menganalisis...' : 'Spending Strategy'}
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `Rp ${(totalSpend/1e6).toFixed(2)}M`, trend: 'neutral', icon: <BarChart3 size={16} />, color: 'bg-slate-50' },
          { label: 'Total Revenue', value: `Rp ${(totalRevenue/1e6).toFixed(1)}M`, trend: 'up', icon: <TrendingUp size={16} />, color: 'bg-emerald-50' },
          { label: 'Avg ROI', value: `${avgROI}%`, trend: 'up', icon: <ArrowUpRight size={16} />, color: 'bg-purple-50' },
          { label: 'Top Campaign', value: topCampaign.platform, trend: 'up', icon: <TrendingUp size={16} />, color: 'bg-amber-50' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-5 border border-slate-100 shadow-sm ${kpi.color}`}
          >
            <div className="text-slate-500 text-xs font-bold mb-2 flex items-center gap-1">
              {kpi.icon}{kpi.label}
            </div>
            <div className="text-xl font-black text-slate-800 truncate">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Campaign Efficiency */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart3 size={16} /> Campaign Efficiency</h3>
        <div className="space-y-5">
          {[...CAMPAIGNS].sort((a, b) => b.roi - a.roi).map((camp, i) => (
            <motion.div key={camp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${camp.color}`} />
                  <span className="text-xs font-bold text-slate-700">{camp.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">Spend: Rp {camp.spend.toLocaleString('id-ID')}</span>
                  <span className={`text-xs font-black ${camp.roi >= 500 ? 'text-emerald-600' : 'text-amber-600'} flex items-center gap-0.5`}>
                    {camp.roi >= 500 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {camp.roi}% ROI
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((camp.revenue / maxRev) * 100, 100)}%` }}
                  transition={{ duration: 1.1, delay: i * 0.07 }}
                  className={`h-2 rounded-full ${camp.color}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Revenue: Rp {camp.revenue.toLocaleString('id-ID')}</span>
                <span>Platform: {camp.platform}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Marketing vs Profit Correlation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5">Marketing vs. Profit Correlation</h3>
        <div className="flex items-end gap-4 h-32">
          {CAMPAIGNS.map((c, i) => {
            const revPct = (c.revenue / maxRev) * 100;
            const spendPct = (c.spend / totalSpend) * 100;
            return (
              <div key={i} className="flex-1 flex gap-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${revPct}%` }}
                  transition={{ duration: 1.0, delay: i * 0.08 }}
                  className={`flex-1 rounded-t-lg ${c.color} opacity-90`}
                  style={{ minHeight: 4 }}
                  title={`Revenue: Rp ${c.revenue.toLocaleString('id-ID')}`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${spendPct}%` }}
                  transition={{ duration: 1.0, delay: i * 0.08 + 0.1 }}
                  className={`flex-1 rounded-t-lg ${c.color} opacity-30`}
                  style={{ minHeight: 4 }}
                  title={`Spend: Rp ${c.spend.toLocaleString('id-ID')}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block opacity-90" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block opacity-30" /> Spend</span>
        </div>
      </div>

      {/* AI Spending Strategy */}
      {suggestion && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Spending Strategy — AI Finance</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {suggestion.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
