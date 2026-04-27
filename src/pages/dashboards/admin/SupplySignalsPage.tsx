import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Radio, Package, TrendingUp, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_stock?: number;
  max_stock?: number;
  category?: string;
}

interface Signal {
  id: string;
  type: 'overstock' | 'restock' | 'trend';
  title: string;
  desc: string;
  product: string;
  action: string;
  severity: 'high' | 'medium';
}

export default function SupplySignalsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as InventoryItem[];
      setInventory(items);

      const newSignals: Signal[] = [];
      items.forEach(item => {
        const minStock = item.min_stock || 5;
        const maxStock = item.max_stock || 100;
        if (item.quantity >= maxStock * 0.8) {
          newSignals.push({
            id: `ov-${item.id}`, type: 'overstock',
            title: 'OVERSTOCK Terdeteksi',
            desc: `${item.name} — stok ${item.quantity} unit (>80% kapasitas)`,
            product: item.name,
            action: 'Kirim sinyal ke Marketing → Buat kampanye cuci gudang',
            severity: 'high',
          });
        } else if (item.quantity <= minStock) {
          newSignals.push({
            id: `rs-${item.id}`, type: 'restock',
            title: 'Restock Alert',
            desc: `${item.name} — sisa ${item.quantity} unit (≤ min stok)`,
            product: item.name,
            action: 'Notifikasi Sutradara — segera pesan ulang ke supplier',
            severity: 'high',
          });
        }
      });
      setSignals(newSignals);
    });
    return () => unsub();
  }, []);

  // Trend: top products by velocity (mock for now based on ordering frequency)
  const topProducts = [...inventory]
    .sort((a, b) => ((b.max_stock || 100) - b.quantity) - ((a.max_stock || 100) - a.quantity))
    .slice(0, 3);

  const handleRespond = async (signal: Signal) => {
    setResponding(signal.id);
    try {
      if (signal.type === 'overstock') {
        await NeuralCore.generateMarketingCampaign(
          signal.product,
          'Buat kampanye cuci gudang menarik untuk produk overstock — diskon kilat atau bundle offer'
        );
        await FirebaseLogger.logAgentAction('Admin', 'OVERSTOCK_SIGNAL_SENT', `Sinyal cuci gudang dikirim ke Marketing untuk ${signal.product}`);
        setSuccessMap(p => ({ ...p, [signal.id]: 'Sinyal terkirim ke Marketing Agent!' }));
      } else {
        await FirebaseLogger.logAgentAction('Admin', 'RESTOCK_ALERT', `Restock alert: ${signal.product} perlu dipesan ulang`);
        setSuccessMap(p => ({ ...p, [signal.id]: 'Alert dikirim ke Sutradara!' }));
      }
    } catch (e) { console.error(e); }
    finally { setResponding(null); }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supply Signals</h1>
          <p className="text-slate-500 text-sm mt-1">Pusat pemicu agen — menghubungkan Admin dengan Marketing secara otonom</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Radar Aktif · {signals.length} sinyal</span>
        </div>
      </div>

      {/* Active Signals */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signal Feed</h2>
        <AnimatePresence>
          {signals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-50 rounded-2xl p-10 border border-dashed border-slate-200 text-center"
            >
              <Radio size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400 text-sm">Semua level stok normal — tidak ada anomali.</p>
            </motion.div>
          ) : signals.map((signal, i) => (
            <motion.div key={signal.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-5 border flex items-center gap-5 ${signal.type === 'overstock' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${signal.type === 'overstock' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                {signal.type === 'overstock' ? <Package size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-slate-800 text-sm">{signal.title}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">URGENT</span>
                </div>
                <p className="text-slate-600 text-xs">{signal.desc}</p>
                {successMap[signal.id]
                  ? <p className="text-emerald-600 text-xs font-bold mt-1">{successMap[signal.id]}</p>
                  : <p className="text-slate-400 text-[10px] mt-1 flex items-center gap-1"><ArrowRight size={9} />{signal.action}</p>
                }
              </div>
              {!successMap[signal.id] && (
                <button onClick={() => handleRespond(signal)} disabled={responding === signal.id}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-700 disabled:opacity-50"
                >
                  <Zap size={12} /> {responding === signal.id ? 'Kirim...' : 'Kirim Sinyal'}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Trend Correlation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-500" /> Trend Correlation — Produk Terlaris
        </h3>
        {topProducts.length === 0 ? (
          <p className="text-xs text-slate-400">Data inventory belum tersedia.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const sold = (p.max_stock || 100) - p.quantity;
              const pct = Math.max(0, Math.min((sold / (p.max_stock || 100)) * 100, 100));
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">{p.name}</span>
                    <span className="text-slate-400">{sold} unit terjual</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1 }}
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-4">Marketing disarankan memfokuskan konten pada produk dengan velocity tertinggi.</p>
      </div>
    </div>
  );
}
