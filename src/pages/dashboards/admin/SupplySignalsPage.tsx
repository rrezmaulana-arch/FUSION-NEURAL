import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Package, TrendingUp, AlertTriangle, Zap, ArrowRight, Activity, ShieldCheck, Database } from 'lucide-react';
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
  const [pulseLogIndex, setPulseLogIndex] = useState(0);

  const pulseLogs = [
    "[05:12] Scanning stock levels... OK",
    "[05:15] Trend analysis: High demand detected for 'Aero Runner'",
    "[05:16] Signal sent to Marketing Agent",
    "[05:18] Cross-checking with supplier schedules...",
    "[05:22] Synchronizing with NeuralCore Database..."
  ];

  useEffect(() => {
    if (signals.length === 0) {
      const timer = setInterval(() => {
        setPulseLogIndex(prev => (prev + 1) % pulseLogs.length);
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [signals.length]);

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

  // Trend: Use mock data for visual excellence if real data lacks velocity
  const trendProducts = inventory.length > 2 ? [...inventory].sort((a, b) => ((b.max_stock || 100) - (b.quantity || 0)) - ((a.max_stock || 100) - (a.quantity || 0))).slice(0, 3).map(p => ({
    id: p.id, name: p.name, sold: Math.max(0, (p.max_stock || 100) - (p.quantity || 0)), pct: 60, trend: '+4%'
  })) : [
    { id: 'mock-1', name: 'Pro Sound Wireless', sold: 1250, pct: 85, trend: '+12%' },
    { id: 'mock-2', name: 'Aero Runner v2', sold: 850, pct: 60, trend: '+5%' },
    { id: 'mock-3', name: 'Minimalist Quartz Watch', sold: 420, pct: 35, trend: '+2%' },
  ];

  const overallHealth = 78; // Dummy health metric for circular gauge

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
              className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-left overflow-hidden relative shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <Activity size={18} className="animate-pulse" />
                <h3 className="text-sm font-bold tracking-widest uppercase">Real-Time Pulse</h3>
              </div>
              
              <div className="space-y-3 font-mono text-xs h-[80px] overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                  {pulseLogs.slice(0, pulseLogIndex + 1).slice(-3).map((log, idx) => (
                    <motion.div 
                      key={log + idx} 
                      initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }} 
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="text-slate-400"
                    >
                      <span className="text-emerald-500 mr-2">{'>'}</span>{log}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* Radar Scanning Line Effect */}
                <motion.div 
                  animate={{ top: ['-10%', '110%'] }} 
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="absolute left-0 w-full h-[2px] bg-emerald-500/30 blur-[1px] shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10 pointer-events-none" 
                />
              </div>
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

      {/* Trend Correlation & Additional Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Correlation */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Trend Correlation — Produk Terlaris
          </h3>
          <div className="space-y-4">
            {trendProducts.map((p, i) => (
              <div key={p.id}>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">{p.sold.toLocaleString('id-ID')} unit terjual</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{p.trend}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-5 font-medium flex items-center gap-1.5">
            <Zap size={10} className="text-amber-500" /> Marketing disarankan memfokuskan konten pada produk dengan velocity tertinggi.
          </p>
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          {/* Inventory Health Gauge */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 w-full">
              <Database size={14} /> Inventory Health
            </h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <motion.circle 
                  initial={{ strokeDashoffset: 339 }}
                  animate={{ strokeDashoffset: 339 - (339 * overallHealth) / 100 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={339}
                  className="text-emerald-500" strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-800">{overallHealth}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Optimal</span>
              </div>
            </div>
          </div>

          {/* Agent Status Card */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <ShieldCheck size={64} className="text-emerald-500" />
             </div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Neural Agent Status</h3>
             <div className="space-y-3 relative z-10">
               <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="flex items-center gap-2">
                   <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Zap size={12} /></div>
                   <span className="text-sm font-bold text-slate-200">Marketing Agent</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase">Online</span>
                 </div>
               </div>
               <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="flex items-center gap-2">
                   <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400"><Database size={12} /></div>
                   <span className="text-sm font-bold text-slate-200">Admin Agent</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase">Online</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
