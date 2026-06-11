import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Filter, TrendingUp, Zap } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-2xl">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-black text-white">{p.value?.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  );
};

export default function MarketingAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7d');
  const [funnel, setFunnel] = useState({ impressions: 0, clicks: 0, add_to_cart: 0, purchases: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'marketing_stats'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      let imp = 0, clk = 0, atc = 0, pur = 0;
      const camps: Record<string, any> = {};
      const byDay: Record<string, { clicks: number; purchases: number; spend: number }> = {};

      snap.docs.forEach(d => {
        const data = d.data();
        imp += data.impressions || 0;
        clk += data.clicks || 0;
        atc += data.add_to_cart || 0;
        pur += data.purchases || 0;

        const cName = data.campaign || 'Unknown Campaign';
        if (!camps[cName]) camps[cName] = { name: cName, plat: cName.split(' ')[2] || 'Meta Ads', spend: 0, rev: 0 };
        camps[cName].spend += (data.clicks || 0) * 1500;
        camps[cName].rev += (data.purchases || 0) * 125000;

        // Build trend from timestamps
        if (data.timestamp) {
          const date = data.timestamp.substring ? data.timestamp.substring(0, 10) : new Date(data.timestamp?.seconds * 1000).toISOString().substring(0, 10);
          const label = `${new Date(date).getDate()} ${new Date(date).toLocaleString('id-ID', { month: 'short' })}`;
          if (!byDay[label]) byDay[label] = { clicks: 0, purchases: 0, spend: 0 };
          byDay[label].clicks += data.clicks || 0;
          byDay[label].purchases += data.purchases || 0;
          byDay[label].spend += (data.clicks || 0) * 1500;
        }
      });

      setFunnel({ impressions: imp, clicks: clk, add_to_cart: atc, purchases: pur });

      const campArray = Object.values(camps).map(c => {
        const roas = c.spend > 0 ? (c.rev / c.spend).toFixed(1) : '0.0';
        return { name: c.name, plat: c.plat, spend: `Rp ${(c.spend/1000000).toFixed(1)}M`, rev: `Rp ${(c.rev/1000000).toFixed(1)}M`, roas: `${roas}x` };
      }).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 5);
      if (campArray.length > 0) setCampaigns(campArray);

      const points = Object.entries(byDay).slice(0, 7).reverse().map(([date, v]) => ({ date, ...v }));
      if (points.length > 0) setTrendData(points);
    });
    return () => unsub();
  }, []);

  const metrics = [
    { label: 'ROAS', value: ((funnel.purchases * 125000) / Math.max(funnel.clicks * 1500, 1)).toFixed(1) + 'x', sub: 'Return on Ad Spend', color: '#a855f7' },
    { label: 'CAC', value: `Rp ${Math.floor((funnel.clicks * 1500) / Math.max(funnel.purchases, 1)).toLocaleString('id-ID')}`, sub: 'Customer Acquisition Cost', color: '#3b82f6' },
    { label: 'CTR', value: ((funnel.clicks / Math.max(funnel.impressions, 1)) * 100).toFixed(1) + '%', sub: 'Avg. Click-Through Rate', color: '#ec4899' },
    { label: 'CVR', value: ((funnel.purchases / Math.max(funnel.clicks, 1)) * 100).toFixed(1) + '%', sub: 'Conversion Rate', color: '#10b981' },
  ];

  const funnelSteps = [
    { step: 'Impressions', count: funnel.impressions, color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
    { step: 'Clicks (Traffic)', count: funnel.clicks, color: 'rgba(168,85,247,0.25)', border: 'rgba(168,85,247,0.4)', text: '#c084fc' },
    { step: 'Add to Cart', count: funnel.add_to_cart, color: 'rgba(168,85,247,0.4)', border: 'rgba(168,85,247,0.5)', text: '#d8b4fe' },
    { step: 'Purchases', count: funnel.purchases, color: 'rgba(168,85,247,0.6)', border: 'rgba(168,85,247,0.7)', text: '#f3e8ff' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Performance Analytics"
        subtitle="Pantau efektivitas kampanye, ROAS, dan metrik konversi secara real-time."
        accent="purple"
        actions={
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            {['24h', '7d', '30d'].map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === t ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="relative rounded-2xl p-5 overflow-hidden border border-white/5"
            style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))' }}
          >
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at top right, ${m.color}, transparent 70%)` }} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 mb-1">{m.sub}</p>
              <h3 className="text-2xl font-black" style={{ color: m.color }}>{m.value}</h3>
              <p className="text-[10px] text-slate-500 mt-1">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative rounded-3xl p-6 border border-white/5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1122 0%, #0f172a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-black flex items-center gap-2">
              <Target size={16} className="text-purple-400" /> Campaign Performance Trend
            </h3>
            <p className="text-slate-400 text-xs mt-1">Daily Clicks vs Purchases vs Ad Spend</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Zap size={12} className="text-purple-400 animate-pulse" /> Live data
          </div>
        </div>
        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#64748b', paddingTop: '12px' }} />
              <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#clicksGrad)" name="Clicks" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="purchases" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3, fill: '#ec4899' }} activeDot={{ r: 5 }} name="Purchases" />
              <Bar yAxisId="left" dataKey="spend" fill="rgba(59,130,246,0.3)" radius={[4, 4, 0, 0]} name="Ad Spend (est.)" maxBarSize={20} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Funnel + Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#0f172a] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center gap-2 mb-6">
            <Filter size={16} className="text-purple-400" />
            <h3 className="font-black text-slate-200">Sales Funnel</h3>
          </div>
          <div className="space-y-3">
            {funnelSteps.map((f, i) => {
              const pct = Math.max(Math.round((f.count / funnel.impressions) * 100), 2);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
                    <span>{f.step}</span>
                    <span style={{ color: f.text }}>{f.count.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-8 rounded-xl overflow-hidden bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full flex items-center justify-end pr-3 rounded-xl text-[10px] font-black"
                      style={{ background: f.color, border: `1px solid ${f.border}`, color: f.text, minWidth: '36px' }}
                    >
                      {pct}%
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Campaigns */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-[#0f172a] rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-purple-400" />
            <h3 className="font-black text-slate-200">Top Performing Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Spend</th>
                  <th className="pb-3">Revenue</th>
                  <th className="pb-3">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-600 text-sm">Belum ada data campaign. Jalankan simulasi marketplace untuk menghasilkan data.</td></tr>
                ) : campaigns.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="py-3 font-bold text-slate-200 text-sm">{c.name}</td>
                    <td className="py-3 text-slate-500 text-xs">{c.plat}</td>
                    <td className="py-3 text-rose-400 font-mono font-bold text-xs">{c.spend}</td>
                    <td className="py-3 text-emerald-400 font-mono font-bold text-xs">{c.rev}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-[10px] font-black border border-purple-500/20">
                        {c.roas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
