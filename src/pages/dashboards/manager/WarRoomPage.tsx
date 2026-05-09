import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Crosshair, Activity, AlertTriangle, Shield, CheckCircle2, Zap } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { triggerAgent } from '../../../services/apiClient';

const CRISIS_SCENARIOS = [
  { id: 'supplier_hike', label: 'Harga Bahan Baku Naik 25%', desc: 'Supplier mendadak menaikkan harga. Margin menipis.' },
  { id: 'traffic_drop', label: 'Trafik Web Turun 50%', desc: 'Algoritma platform berubah, kunjungan toko anjlok.' },
  { id: 'competitor_surge', label: 'Kompetitor Bakar Uang', desc: 'Pesaing utama melakukan diskon 70% besar-besaran.' }
];

export default function WarRoomPage() {
  const [activeCrisis, setActiveCrisis] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: number, sender: string, message: string }[]>([]);
  const [metrics, setMetrics] = useState({ revenue: 250000000, margin: 35, burnRate: 45 });

  const triggerCrisis = async (scenarioId: string) => {
    setActiveCrisis(scenarioId);
    setLogs([]);
    
    // Simulate initial shock
    if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 15, burnRate: 65 });
    if (scenarioId === 'traffic_drop') setMetrics({ revenue: 120000000, margin: 35, burnRate: 80 });
    if (scenarioId === 'competitor_surge') setMetrics({ revenue: 150000000, margin: 20, burnRate: 70 });

    const scenarioData = CRISIS_SCENARIOS.find(s => s.id === scenarioId);
    
    setLogs([{ id: Date.now(), sender: 'SYSTEM', message: `⚠️ ALERT: ${scenarioData?.label}. Memulai protokol mitigasi AI nyata.` }]);

    try {
      // Step 1: Manager AI Analysis
      setLogs(prev => [...prev, { id: Date.now() + 1, sender: 'Manager AI', message: 'Menganalisis dampak krisis via FUSION NEURAL Backend...' }]);
      const mgrRes = await triggerAgent({ agent: 'Manager', message: `Krisis terjadi: ${scenarioData?.label} - ${scenarioData?.desc}. Berikan 1 kalimat instruksi singkat untuk mitigasi ke Finance dan Marketing.` });
      setLogs(prev => [...prev, { id: Date.now() + 2, sender: 'Manager AI', message: mgrRes.result }]);

      // Step 2: Finance AI response
      setLogs(prev => [...prev, { id: Date.now() + 3, sender: 'Finance AI', message: 'Mengkalkulasi ulang margin dan burn rate...' }]);
      const finRes = await triggerAgent({ agent: 'Finance', message: `Manajer berkata: ${mgrRes.result}. Bagaimana penyesuaian budget kita? Jawab dalam 1 kalimat singkat.` });
      setLogs(prev => [...prev, { id: Date.now() + 4, sender: 'Finance AI', message: finRes.result }]);

      // Step 3: Marketing AI response
      setLogs(prev => [...prev, { id: Date.now() + 5, sender: 'Marketing AI', message: 'Menyesuaikan kampanye berdasarkan budget baru...' }]);
      const mktRes = await triggerAgent({ agent: 'Marketing', message: `Instruksi manajer: ${mgrRes.result}. Finance berkata: ${finRes.result}. Apa aksi marketingmu? Jawab 1 kalimat.` });
      setLogs(prev => [...prev, { id: Date.now() + 6, sender: 'Marketing AI', message: mktRes.result }]);

      setLogs(prev => [...prev, { id: Date.now() + 7, sender: 'SYSTEM', message: '✅ Mitigasi aktif. Proyeksi stabil dalam 7 hari.' }]);

      // Recovery simulation
      if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 28, burnRate: 50 });
      if (scenarioId === 'traffic_drop') setMetrics({ revenue: 200000000, margin: 35, burnRate: 55 });
      if (scenarioId === 'competitor_surge') setMetrics({ revenue: 220000000, margin: 30, burnRate: 50 });

    } catch (error: any) {
      setLogs(prev => [...prev, { id: Date.now() + 8, sender: 'SYSTEM', message: `Koneksi Backend Gagal: ${error.message}. Menggunakan Fallback Protokol.` }]);
      
      // Fallback
      setTimeout(() => setLogs(prev => [...prev, { id: Date.now() + 9, sender: 'Finance AI', message: 'Mitigasi fallback diaktifkan. Margin aman.' }]), 2000);
      if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 28, burnRate: 50 });
      if (scenarioId === 'traffic_drop') setMetrics({ revenue: 200000000, margin: 35, burnRate: 55 });
      if (scenarioId === 'competitor_surge') setMetrics({ revenue: 220000000, margin: 30, burnRate: 50 });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="War Room Simulator"
        subtitle="Sistem Mitigasi Krisis Otonom — AI Merespons Ancaman Bisnis"
        accent="red"
        icon={<ShieldAlert size={22} className="text-white" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 shadow-sm">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Crosshair size={16} className="text-rose-400" /> Pilih Skenario
            </h3>
            <div className="space-y-3">
              {CRISIS_SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => triggerCrisis(s.id)}
                  disabled={activeCrisis !== null && logs.length < 6}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${activeCrisis === s.id ? 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(225,29,72,0.15)]' : 'border-white/10 hover:border-white/20 bg-[#1e293b]'}`}
                >
                  <p className="text-sm font-bold text-slate-200">{s.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
            
            {activeCrisis && logs.length === 6 && (
              <button 
                onClick={() => { setActiveCrisis(null); setLogs([]); setMetrics({ revenue: 250000000, margin: 35, burnRate: 45 }); }}
                className="w-full mt-4 py-3 bg-[#1e293b] hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all border border-white/5"
              >
                Reset Simulator
              </button>
            )}
          </div>

          {/* Live Metrics */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 shadow-xl">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Live Impact Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Proyeksi Revenue</span>
                  <span className="text-slate-100">Rp {metrics.revenue.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${(metrics.revenue / 300000000) * 100}%` }} className="h-full bg-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Net Margin</span>
                  <span className={metrics.margin < 25 ? 'text-rose-400' : 'text-emerald-400'}>{metrics.margin}%</span>
                </div>
                <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${metrics.margin}%`, backgroundColor: metrics.margin < 25 ? '#fb7185' : '#34d399' }} className="h-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Burn Rate (Risiko)</span>
                  <span className={metrics.burnRate > 60 ? 'text-rose-400' : 'text-amber-400'}>{metrics.burnRate}%</span>
                </div>
                <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${metrics.burnRate}%`, backgroundColor: metrics.burnRate > 60 ? '#fb7185' : '#fbbf24' }} className="h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Action Log */}
        <div className="lg:col-span-2">
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 shadow-sm h-full min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <ShieldAlert size={200} className="text-white" />
            </div>
            
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={16} className="text-indigo-400" /> AI Action Log
            </h3>
            
            <div className="flex-1 space-y-4 relative z-10">
              {!activeCrisis ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <AlertTriangle size={40} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">Pilih skenario krisis di panel kiri untuk memulai simulasi.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white bg-indigo-500/20 border border-indigo-500/30 shadow-md">
                        {log.sender.substring(0, 3)}
                      </div>
                      <div className="flex-1 bg-[#1e293b] rounded-2xl rounded-tl-none p-4 border border-white/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">{log.sender}</p>
                        <p className={`text-sm font-medium ${log.message.includes('ALERT') ? 'text-rose-400' : log.message.includes('stabil') || log.message.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {log.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {logs.length > 5 && logs.some(l => l.message.includes('stabil')) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400">
                      <CheckCircle2 size={24} className="shrink-0" />
                      <div>
                        <p className="text-sm font-black">Krisis Berhasil Diatasi via LIVE AI Backend</p>
                        <p className="text-xs font-medium opacity-80">Sistem otonom berhasil melakukan mitigasi menggunakan real LLM calls tanpa intervensi manusia.</p>
                      </div>
                    </motion.div>
                  )}
                  {logs.length > 0 && logs.length <= 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center gap-3 text-indigo-300">
                      <Zap size={24} className="shrink-0 animate-pulse text-indigo-400" />
                      <div>
                        <p className="text-sm font-black">Meminta Instruksi dari AI Backend...</p>
                        <p className="text-xs font-medium opacity-80">Model sedang men-generate solusi mitigasi krisis secara real-time.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
