import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Filter, TrendingUp, Zap } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-black text-slate-800">{p.value?.toLocaleString('id-ID')}</span>
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
    { label: 'ROAS', value: ((funnel.purchases * 125000) / Math.max(funnel.clicks * 1500, 1)).toFixed(1) + 'x', sub: 'Return on Ad Spend', icon: Target },
    { label: 'CAC', value: `Rp ${Math.floor((funnel.clicks * 1500) / Math.max(funnel.purchases, 1)).toLocaleString('id-ID')}`, sub: 'Customer Acquisition Cost', icon: TrendingUp },
    { label: 'CTR', value: ((funnel.clicks / Math.max(funnel.impressions, 1)) * 100).toFixed(1) + '%', sub: 'Click-Through Rate', icon: Zap },
    { label: 'CVR', value: ((funnel.purchases / Math.max(funnel.clicks, 1)) * 100).toFixed(1) + '%', sub: 'Conversion Rate', icon: Filter },
  ];

  const funnelSteps = [
    { step: 'Impressions', count: funnel.impressions },
    { step: 'Clicks (Traffic)', count: funnel.clicks },
    { step: 'Add to Cart', count: funnel.add_to_cart },
    { step: 'Purchases', count: funnel.purchases },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Performance Analytics"
        subtitle="Pantau efektivitas kampanye, ROAS, dan metrik konversi secara real-time."
        accent="purple"
        actions={
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['24h', '7d', '30d'].map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      {/* Metric Cards — Clean White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
              <m.icon size={15} className="text-purple-500" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.sub}</p>
            <h3 className="text-2xl font-black text-slate-800">{m.value}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Chart — Clean White */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-slate-800 font-black flex items-center gap-2">
              <Target size={16} className="text-purple-500" /> Campaign Performance Trend
            </h3>
            <p className="text-slate-400 text-xs mt-1">Daily Clicks vs Purchases vs Ad Spend</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Zap size={12} className="text-purple-500 animate-pulse" /> Live data
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8', paddingTop: '12px' }} />
              <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#clicksGrad)" name="Clicks" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="purchases" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3, fill: '#ec4899' }} activeDot={{ r: 5 }} name="Purchases" />
              <Bar yAxisId="left" dataKey="spend" fill="rgba(168,85,247,0.1)" radius={[4, 4, 0, 0]} name="Ad Spend (est.)" maxBarSize={20} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Funnel + Campaigns — Clean White */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <Filter size={16} className="text-purple-500" />
            <h3 className="font-black text-slate-800">Sales Funnel</h3>
          </div>
          <div className="space-y-3">
            {funnelSteps.map((f, i) => {
              const pct = Math.max(Math.round((f.count / Math.max(funnel.impressions, 1)) * 100), 2);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
                    <span>{f.step}</span>
                    <span className="text-slate-600">{f.count.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-7 rounded-lg overflow-hidden bg-slate-50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full flex items-center justify-end pr-3 rounded-lg text-[10px] font-black text-purple-700 bg-purple-100"
                      style={{ minWidth: '36px' }}
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
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-purple-500" />
            <h3 className="font-black text-slate-800">Top Performing Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Spend</th>
                  <th className="pb-3">Revenue</th>
                  <th className="pb-3">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Belum ada data campaign. Jalankan simulasi marketplace.</td></tr>
                ) : campaigns.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-700 text-sm">{c.name}</td>
                    <td className="py-3 text-slate-400 text-xs">{c.plat}</td>
                    <td className="py-3 text-rose-500 font-mono font-bold text-xs">{c.spend}</td>
                    <td className="py-3 text-emerald-600 font-mono font-bold text-xs">{c.rev}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">
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
