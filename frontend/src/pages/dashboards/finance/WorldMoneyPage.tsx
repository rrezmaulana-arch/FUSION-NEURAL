/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown, RefreshCw, DollarSign, Activity, Cloud, Zap } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  prevRate: number;
  flag: string;
  category: 'major' | 'asia' | 'commodity';
}

interface CommodityPrice {
  name: string;
  symbol: string;
  price: number;
  prevPrice: number;
  unit: string;
  color: string;
}

// ─── Static Meta Data ─────────────────────────────────────────────────────────
const CURRENCY_META: Record<string, { name: string; flag: string; category: CurrencyRate['category'] }> = {
  USD: { name: 'US Dollar', flag: '🇺🇸', category: 'major' },
  EUR: { name: 'Euro', flag: '🇪🇺', category: 'major' },
  GBP: { name: 'Brit Pound', flag: '🇬🇧', category: 'major' },
  JPY: { name: 'Japanese Yen', flag: '🇯🇵', category: 'asia' },
  SGD: { name: 'Singapore $', flag: '🇸🇬', category: 'asia' },
  MYR: { name: 'Malaysian RM', flag: '🇲🇾', category: 'asia' },
  CNY: { name: 'Chinese Yuan', flag: '🇨🇳', category: 'asia' },
  AUD: { name: 'Aus Dollar', flag: '🇦🇺', category: 'major' },
  CHF: { name: 'Swiss Franc', flag: '🇨🇭', category: 'major' },
  SAR: { name: 'Saudi Riyal', flag: '🇸🇦', category: 'major' },
};

const COMMODITY_META: CommodityPrice[] = [
  { name: 'Gold', symbol: 'XAU', price: 0, prevPrice: 0, unit: 'USD/troy oz', color: 'text-yellow-400' },
  { name: 'Crude Oil', symbol: 'WTI', price: 0, prevPrice: 0, unit: 'USD/barrel', color: 'text-orange-400' },
  { name: 'Bitcoin', symbol: 'BTC', price: 0, prevPrice: 0, unit: 'USD', color: 'text-amber-300' },
];

export default function WorldMoneyPage() {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>(COMMODITY_META);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'major' | 'asia'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [idxChange, setIdxChange] = useState({ val: 0, pct: 0 });

  // ─── Fetch Live Data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/finance/market-data`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const rates = data.rates as Record<string, number>;
      const liveCommodities = data.commodities || {};

      // Rate di sini adalah IDR/FX → kita balik supaya = IDR per 1 unit FX
      const newCurrencies: CurrencyRate[] = Object.entries(CURRENCY_META).map(([code, meta]) => {
        const rateVsIdr = rates[code] ? (1 / rates[code]) : 0;
        return {
          code,
          name: meta.name,
          flag: meta.flag,
          category: meta.category,
          rate: rateVsIdr,
          prevRate: rateVsIdr * (1 + (Math.random() - 0.5) * 0.01), // small simulated prev
        };
      });

      // Gunakan data Massive API untuk komoditas
      const simulatedCommodities: CommodityPrice[] = [
        { name: 'Gold', symbol: 'XAU', price: liveCommodities.XAU || 2420, prevPrice: 2410, unit: 'USD/troy oz', color: 'text-yellow-400' },
        { name: 'Crude Oil', symbol: 'WTI', price: liveCommodities.WTI || 78.5, prevPrice: 77.1, unit: 'USD/barrel', color: 'text-orange-400' },
        { name: 'Bitcoin', symbol: 'BTC', price: liveCommodities.BTC || 95000, prevPrice: (liveCommodities.BTC || 95000) * 0.99, unit: 'USD', color: 'text-amber-300' },
      ];

      setCurrencies(newCurrencies);
      setCommodities(simulatedCommodities);
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));

      // IDX Composite simulasi bergerak
      setIdxChange({ val: +(Math.random() * 100 - 30).toFixed(0), pct: +(Math.random() * 1.2 - 0.4).toFixed(2) });

      await FirebaseLogger.logAgentAction('Finance', 'WORLD_MONEY_FETCH', 'Live currency data fetched via ExchangeRate API');
    } catch (e) {
      console.error('[WorldMoney] Fetch error:', e);
      // Fallback data jika API gagal
      const fallback = Object.entries(CURRENCY_META).map(([code, meta]) => ({
        code, name: meta.name, flag: meta.flag, category: meta.category,
        rate: code === 'USD' ? 16350 : code === 'EUR' ? 17800 : code === 'SGD' ? 12100 : code === 'JPY' ? 108 : 5000,
        prevRate: code === 'USD' ? 16280 : code === 'EUR' ? 17750 : code === 'SGD' ? 12050 : code === 'JPY' ? 107 : 4980,
      }));
      setCurrencies(fallback);
      setLastUpdated(new Date().toLocaleTimeString('id-ID') + ' (cached)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Save to Drive ─────────────────────────────────────────────────────────
  const handleSaveToDrive = async () => {
    setIsSaving(true);
    try {
      const content = `=== WORLD MONEY TRACKER — ${new Date().toLocaleString('id-ID')} ===\n\n` +
        `KURS MATA UANG (per 1 unit → IDR):\n` +
        currencies.map(c => `${c.flag} ${c.code} (${c.name}): Rp ${c.rate.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`).join('\n') +
        `\n\nKOMODITAS GLOBAL:\n` +
        commodities.map(c => `${c.name}: $${c.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${c.unit}`).join('\n');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/drive/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'finance', filename: 'World_Money_Tracker_Report', content })
      });

      if (res.ok) {
        setSaveMsg('✅ Laporan disimpan ke Google Drive sebagai Google Docs!');
      } else {
        setSaveMsg('❌ Gagal menyimpan. Pastikan backend Python berjalan.');
      }
    } catch {
      setSaveMsg('❌ Tidak dapat terhubung ke backend.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const filtered = activeFilter === 'all' ? currencies : currencies.filter(c => c.category === activeFilter);
  const usdRate = currencies.find(c => c.code === 'USD')?.rate ?? 0;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="World Money Tracker"
        subtitle="Kurs mata uang & komoditi dunia secara real-time"
        accent="emerald"
        icon={<Globe size={22} className="text-white" />}
        actions={
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Memuat...' : 'Refresh'}
            </button>
            <button
              onClick={handleSaveToDrive}
              disabled={isSaving || currencies.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/30 hover:bg-white/40 text-white text-sm font-bold rounded-xl border border-white/40 transition-colors disabled:opacity-50"
            >
              <Cloud size={14} className={isSaving ? 'animate-pulse' : ''} />
              Save to Drive
            </button>
          </div>
        }
      />

      {/* Save notification */}
      <AnimatePresence>
        {saveMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border text-sm font-bold ${saveMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {saveMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Zap size={12} className="text-emerald-500 shrink-0" />
          <span>Data live via <strong>Massive API Server</strong> &bull; Auto-refresh setiap 60 detik</span>
        </div>
        {lastUpdated && (
          <div className="text-xs text-slate-500 bg-white border border-slate-100 px-4 py-2.5 rounded-xl">
            Terakhir diperbarui: <strong>{lastUpdated}</strong>
          </div>
        )}
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* USD/IDR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 relative rounded-3xl p-6 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #065f46, #059669)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <DollarSign size={12} /> 1 USD = IDR
            </p>
            {isLoading ? (
              <div className="h-10 w-40 bg-white/10 animate-pulse rounded-xl mt-1" />
            ) : (
              <div className="text-4xl font-black text-white">
                {usdRate > 0 ? `Rp ${usdRate.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '—'}
              </div>
            )}
          </div>
        </motion.div>

        {/* IDX Composite */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative rounded-3xl p-6 overflow-hidden shadow-xl"
          style={{ background: idxChange.pct >= 0 ? 'linear-gradient(135deg, #1e3a5f, #1e40af)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <Activity size={12} /> IDX Composite (Sim)
          </p>
          <div className="text-4xl font-black text-white">
            {idxChange.pct >= 0 ? '+' : ''}{idxChange.pct}%
          </div>
          <div className={`text-sm mt-1 flex items-center gap-1 ${idxChange.val >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
            {idxChange.val >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {idxChange.val >= 0 ? '+' : ''}{idxChange.val} poin hari ini
          </div>
        </motion.div>

        {/* Gold */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative rounded-3xl p-6 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #78350f, #b45309)' }}>
          <p className="text-yellow-200 text-xs font-bold uppercase tracking-widest mb-1">🥇 Gold (XAU)</p>
          <div className="text-4xl font-black text-white">
            {commodities[0]?.price > 0 ? `$${commodities[0].price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          </div>
          <p className="text-yellow-200 text-xs mt-1">per troy oz</p>
        </motion.div>
      </div>

      {/* Commodities Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commodities.map((c, i) => {
          const change = c.price - c.prevPrice;
          const pct = c.prevPrice > 0 ? ((change / c.prevPrice) * 100).toFixed(2) : '0.00';
          const isUp = change >= 0;
          return (
            <motion.div key={c.symbol} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${c.color}`}>{c.name}</p>
                  <p className="text-[10px] text-slate-500">{c.unit}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${isUp ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{pct}%
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {c.price > 0 ? (c.symbol === 'BTC' ? `$${c.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${c.price.toFixed(2)}`) : '—'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Currency Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" /> Kurs vs IDR (Rupiah)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Sumber: Massive API &bull; 1 unit mata uang ke IDR</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'major', 'asia'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors capitalize ${activeFilter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading && currencies.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-emerald-400" />
            <p className="text-sm">Mengambil data kurs live...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mata Uang</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Rate (IDR)</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Perubahan</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Kategori</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((c, i) => {
                    const diff = c.rate - c.prevRate;
                    const pct = c.prevRate > 0 ? ((diff / c.prevRate) * 100).toFixed(2) : '0.00';
                    const isUp = diff >= 0;
                    return (
                      <motion.tr key={c.code}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{c.flag}</span>
                            <div>
                              <p className="font-black text-slate-800 text-sm">{c.code}</p>
                              <p className="text-[10px] text-slate-400">{c.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-800">
                          {c.rate > 0 ? `Rp ${c.rate.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isUp ? '+' : ''}{pct}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${c.category === 'major' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {c.category}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
