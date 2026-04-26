import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Radio, AlertTriangle, TrendingDown, TrendingUp, Package, Zap, ArrowRight } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface Signal {
  id: string;
  type: 'overstock' | 'low_stock' | 'profit_gap';
  title: string;
  desc: string;
  product?: string;
  action: string;
  severity: 'high' | 'medium' | 'low';
}

export default function MarketSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [financeData, setFinanceData] = useState<any>(null);
  const [isAutoResponding, setIsAutoResponding] = useState<string | null>(null);
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});

  // Listen to inventory for overstock & low stock
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      const newSignals: Signal[] = [];
      snap.docs.forEach(d => {
        const item = { id: d.id, ...d.data() } as any;
        if (item.stock_status === 'OVERSTOCK' || (item.quantity > 0 && item.quantity >= (item.max_stock || 100))) {
          newSignals.push({
            id: `ov-${d.id}`,
            type: 'overstock',
            title: 'Stok Menumpuk',
            desc: `${item.name || d.id} kelebihan stok`,
            product: item.name || d.id,
            action: 'Buat kampanye diskon/bundle otomatis',
            severity: 'high',
          });
        } else if (item.quantity !== undefined && item.quantity <= (item.min_stock || 5)) {
          newSignals.push({
            id: `ls-${d.id}`,
            type: 'low_stock',
            title: 'Stok Hampir Habis',
            desc: `${item.name || d.id} — sisa ${item.quantity} unit`,
            product: item.name || d.id,
            action: 'Hentikan iklan untuk produk ini',
            severity: 'medium',
          });
        }
      });
      setSignals(prev => {
        const financeSignals = prev.filter(s => s.type === 'profit_gap');
        return [...newSignals, ...financeSignals];
      });
    });
    return () => unsub();
  }, []);

  // Listen to financial_reports for profit gap
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFinanceData(data);
        if (data.roi_percentage !== undefined && data.roi_percentage < 20) {
          setSignals(prev => {
            const others = prev.filter(s => s.type !== 'profit_gap');
            return [...others, {
              id: 'profit-gap',
              type: 'profit_gap',
              title: 'Profit Gap Terdeteksi',
              desc: `ROI turun ke ${data.roi_percentage}% — di bawah threshold`,
              action: 'Buat konten untuk produk margin tertinggi',
              severity: 'high',
            }];
          });
        } else {
          setSignals(prev => prev.filter(s => s.type !== 'profit_gap'));
        }
      }
    });
    return () => unsub();
  }, []);

  const handleAutoRespond = async (signal: Signal) => {
    setIsAutoResponding(signal.id);
    try {
      if (signal.type === 'overstock' && signal.product) {
        await NeuralCore.generateMarketingCampaign(
          signal.product,
          'Buat kampanye diskon menarik untuk produk yang kelebihan stok'
        );
        await FirebaseLogger.logAgentAction('Marketing', 'AUTO_CAMPAIGN', `Overstock campaign triggered for ${signal.product}`);
        setSuccessMap(p => ({ ...p, [signal.id]: 'Kampanye berhasil disiapkan!' }));
      } else if (signal.type === 'low_stock') {
        await FirebaseLogger.logAgentAction('Marketing', 'AD_SUPPRESSED', `Iklan dihentikan untuk ${signal.product}`);
        setSuccessMap(p => ({ ...p, [signal.id]: 'Iklan berhasil dihentikan.' }));
      } else {
        await FirebaseLogger.logAgentAction('Marketing', 'PROFIT_GAP_ALERT', 'Strategi produk margin tinggi diaktifkan');
        setSuccessMap(p => ({ ...p, [signal.id]: 'Alert terkirim ke Campaign Forge.' }));
      }
    } catch (e) { console.error(e); }
    finally { setIsAutoResponding(null); }
  };

  const signalStyle = (type: string) => {
    if (type === 'overstock') return { bg: 'bg-amber-50 border-amber-200', icon: <Package size={18} className="text-amber-600" />, badge: 'bg-amber-100 text-amber-700' };
    if (type === 'low_stock') return { bg: 'bg-blue-50 border-blue-200', icon: <TrendingDown size={18} className="text-blue-600" />, badge: 'bg-blue-100 text-blue-700' };
    return { bg: 'bg-rose-50 border-rose-200', icon: <AlertTriangle size={18} className="text-rose-600" />, badge: 'bg-rose-100 text-rose-700' };
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Market Signals</h1>
          <p className="text-slate-500 text-sm mt-1">Radar otonom — membaca sinyal dari Admin & Finance secara real-time</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Radar Aktif</span>
        </div>
      </div>

      {/* Finance Overview */}
      {financeData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'ROI', value: `${financeData.roi_percentage ?? '–'}%`, icon: <TrendingUp size={16} />, ok: (financeData.roi_percentage ?? 0) >= 20 },
            { label: 'Net Profit', value: financeData.net_profit ? `Rp ${(financeData.net_profit/1e6).toFixed(1)}M` : '–', icon: <Zap size={16} />, ok: true },
            { label: 'Burn Rate', value: financeData.revenue ? `${((financeData.cost/financeData.revenue)*100).toFixed(0)}%` : '–', icon: <Radio size={16} />, ok: financeData.cost < financeData.revenue * 0.7 },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-4 border shadow-sm ${m.ok ? 'border-slate-100' : 'border-rose-200 bg-rose-50'}`}>
              <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${m.ok ? 'text-slate-500' : 'text-rose-500'}`}>{m.icon}{m.label}</div>
              <div className={`text-2xl font-black ${m.ok ? 'text-slate-800' : 'text-rose-700'}`}>{m.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Signals List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signal Feed ({signals.length} aktif)</h2>
        <AnimatePresence>
          {signals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-50 rounded-2xl p-10 border border-dashed border-slate-200 text-center"
            >
              <Radio size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400 text-sm">Semua sinyal hijau — tidak ada anomali terdeteksi.</p>
              <p className="text-slate-400 text-xs mt-1">Radar memantau inventory & laporan keuangan secara otomatis.</p>
            </motion.div>
          ) : signals.map((signal) => {
            const style = signalStyle(signal.type);
            return (
              <motion.div key={signal.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className={`rounded-2xl p-5 border ${style.bg} flex items-center gap-5`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-slate-800 text-sm">{signal.title}</p>
                    {signal.severity === 'high' && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${style.badge}`}>URGENT</span>}
                  </div>
                  <p className="text-slate-600 text-xs">{signal.desc}</p>
                  {successMap[signal.id] ? (
                    <p className="text-emerald-600 text-xs font-bold mt-1">✅ {successMap[signal.id]}</p>
                  ) : (
                    <p className="text-slate-400 text-[10px] mt-1 flex items-center gap-1"><ArrowRight size={9} />{signal.action}</p>
                  )}
                </div>
                {!successMap[signal.id] && (
                  <button
                    onClick={() => handleAutoRespond(signal)}
                    disabled={isAutoResponding === signal.id}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isAutoResponding === signal.id ? <><Radio size={12} className="animate-spin" /> Proses...</> : <><Zap size={12} /> Auto-Respond</>}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
