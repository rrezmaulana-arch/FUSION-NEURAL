
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { BrainCircuit, Activity, ChevronRight, Play, Star, MapPin, CalendarDays, DollarSign, Brain, AlertTriangle, CheckCircle2, RefreshCw, BarChart3, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';



export default function ManagerDashboard() {
  const { performers, pingPerformer, financeChartData: chartDataRaw } = useSystemEngine();
  const chartData = Array.isArray(chartDataRaw) && chartDataRaw.length >= 6 ? chartDataRaw : [40, 55, 60, 75, 65, 80];
  
  const [realOrderCount, setRealOrderCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      setRealOrderCount(snap.docs.length);
    });
    return () => unsub();
  }, []);
  
  // ─── AI Evaluation Drawer ───────────────────────────────────────────────
  const [logs, setLogs] = useState<any[]>([]);
  const [evalOpen, setEvalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(30));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    setEvalOpen(true);
    try {
      const recentLogs = logs.slice(0, 20).map((l: any) => `[${l.agent}] ${l.action}: ${l.details}`);
      const result = await NeuralCore.evaluateAndRealignAgents(recentLogs);
      setEvalResult(result);
      await FirebaseLogger.logAgentAction('Manager', 'EVALUATE_AGENTS', `Evaluasi selesai. Target: ${result?.target_agent || 'none'}`);
    } catch (e) {
      setEvalResult({ target_agent: 'error', new_prompt: 'Gagal menghubungi AI Manager.' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApply = async () => {
    if (!evalResult || evalResult.target_agent === 'none' || evalResult.target_agent === 'error') return;
    setIsApplying(true);
    try {
      const prompt = customInstruction || evalResult.new_prompt;
      await setDoc(doc(db, 'neural_configs', evalResult.target_agent), { prompt });
      await FirebaseLogger.logAgentAction('Manager', 'APPLY_REALIGN', `${evalResult.target_agent} berhasil diperbarui.`);
      setEvalOpen(false);
      setEvalResult(null);
      setCustomInstruction('');
    } catch (e) { console.error(e); } finally { setIsApplying(false); }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      
      {/* ─── Floating Evaluasi AI Button ─── */}
      <div className="fixed bottom-28 right-6 z-40">
        <button
          onClick={handleEvaluate}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white text-sm font-bold rounded-2xl shadow-2xl hover:bg-teal-700 transition-all"
        >
          <Brain size={16} className={isEvaluating ? 'animate-pulse' : ''} />
          Evaluasi AI
        </button>
      </div>

      {/* ─── AI Evaluation Drawer ─── */}
      <AnimatePresence>
        {evalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => !isEvaluating && setEvalOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <Brain size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Manager AI Evaluation</h3>
                    <p className="text-xs text-slate-500">Analisis & re-alignment agen</p>
                  </div>
                </div>
                <button onClick={() => setEvalOpen(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X size={16} className="text-slate-600" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-6">
                {isEvaluating && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Brain size={28} className="text-slate-600 animate-pulse" />
                    </div>
                    <p className="text-slate-600 font-medium text-sm">Manager AI sedang menganalisis log...</p>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                          className="w-2 h-2 rounded-full bg-slate-400" />
                      ))}
                    </div>
                  </div>
                )}

                {!isEvaluating && evalResult && (
                  <div className="space-y-5">
                    <div className={`rounded-2xl p-4 border ${
                      evalResult.target_agent === 'none' || evalResult.target_agent === 'error'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {evalResult.target_agent === 'none' ? (
                          <><CheckCircle2 size={16} className="text-emerald-600" /><span className="font-bold text-emerald-700 text-sm">Semua Agen Normal</span></>
                        ) : evalResult.target_agent === 'error' ? (
                          <><AlertTriangle size={16} className="text-rose-600" /><span className="font-bold text-rose-700 text-sm">Evaluasi Gagal</span></>
                        ) : (
                          <><AlertTriangle size={16} className="text-amber-600" /><span className="font-bold text-amber-700 text-sm">Perlu Re-Alignment</span></>
                        )}
                      </div>
                      {evalResult.target_agent !== 'none' && evalResult.target_agent !== 'error' && (
                        <p className="text-xs text-amber-700">Target: <strong className="font-mono">{evalResult.target_agent}</strong></p>
                      )}
                    </div>

                    {evalResult.target_agent !== 'none' && evalResult.target_agent !== 'error' && (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rekomendasi AI</p>
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono">
                            {evalResult.new_prompt}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <BarChart3 size={11} /> Modifikasi Kustom (Opsional)
                          </p>
                          <textarea
                            value={customInstruction}
                            onChange={e => setCustomInstruction(e.target.value)}
                            placeholder="Biarkan kosong untuk pakai rekomendasi AI, atau ketik instruksi Kak..."
                            rows={4}
                            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 ring-indigo-200 resize-none"
                          />
                        </div>
                        <button
                          onClick={handleApply}
                          disabled={isApplying}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm"
                        >
                          {isApplying ? <><RefreshCw size={14} className="animate-spin" /> Applying...</> : <><ChevronRight size={14} /> Terapkan ke Firestore</>}
                        </button>
                      </>
                    )}

                    <button onClick={handleEvaluate}
                      className="w-full py-2.5 border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={13} /> Evaluasi Ulang
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Workspace Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Real-time team orchestration & performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          {performers.filter(p => p.status === 'Online').map((p, i) => (
            <motion.div 
              key={p.id} 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${p.color} -ml-3 first:ml-0 shadow-sm`}
              style={{ zIndex: 10 - i }}
            >
              {p.initial}
            </motion.div>
          ))}
          <span className="text-xs text-slate-500 font-medium ml-2">
            <span className="w-1.5 h-1.5 inline-block bg-emerald-500 rounded-full animate-pulse mr-1" /> 
            {performers.filter(p => p.status === 'Online').length} active nodes
          </span>
        </div>
      </div>

      {/* TOP ROW - Hero & Rate */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Hero Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 rounded-[32px] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[320px] shadow-lg"
          style={{ background: 'linear-gradient(120deg, #2A5C6A 0%, #76A2A6 50%, #EAD4C7 100%)' }}
        >
          {/* Animated Background Orbs */}
          <motion.div 
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" 
          />

          <div className="relative z-10 text-white">
            <p className="text-white/80 font-medium mb-1">System processed orders today</p>
            <motion.h2 key={realOrderCount} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
              {realOrderCount.toLocaleString()}
            </motion.h2>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/20 w-max hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Star size={20} className="text-white fill-white" /></div>
                <div>
                  <p className="text-xs text-white/70">Efficiency</p>
                  <p className="text-xl font-bold">93%</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/20 w-max hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Activity size={20} className="text-white" /></div>
                <div>
                  <p className="text-xs text-white/70">General rate</p>
                  <p className="text-xl font-bold">4.7</p>
                </div>
              </div>
            </div>
          </div>

          <button className="absolute bottom-0 right-0 bg-[#214D59] hover:bg-[#1A3D47] transition-colors text-white text-sm font-semibold px-6 py-4 rounded-tl-[32px] flex items-center gap-2 group">
            VIEW FULL STATISTIC <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Rate Card (Kanan - Peach) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-[32px] p-8 relative flex flex-col justify-between min-h-[320px] shadow-sm border border-white/40"
          style={{ backgroundColor: '#FADBCD' }}
        >
          <div>
            <h3 className="text-slate-800 font-semibold mb-2">Performance rate</h3>
            <div className="flex items-start justify-between relative">
              <div className="flex items-start">
                <span className="text-6xl font-bold text-slate-800">87</span>
                <span className="text-sm font-bold text-[#E58C6A] mt-2 ml-1">+2</span>
              </div>
              
              {/* Fake Gauge SVG */}
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E58C6A" strokeWidth="4" strokeDasharray="80, 100" className="opacity-30" />
                  <motion.path 
                    initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: "65, 100" }} transition={{ duration: 1.5, ease: "easeOut" }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E58C6A" strokeWidth="4" 
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-700/70 mt-6 leading-relaxed">
              Your ecosystem rate has increased because of recent node activity. <b>Keep moving</b> forward and get more insights!
            </p>
          </div>

          <button className="w-full bg-white/60 hover:bg-white transition-colors cursor-pointer rounded-2xl p-3 flex items-center justify-between mt-6 shadow-[0_4px_20px_rgba(229,140,106,0.15)] border border-white group">
            <div className="flex items-center gap-3 pl-2">
              <BrainCircuit className="text-[#E58C6A]" size={18} />
              <span className="text-xs font-semibold text-slate-700">Learn AI management insights</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#E58C6A] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={14} className="fill-white ml-0.5" />
            </div>
          </button>
        </motion.div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operation Performance (Kiri) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6">Operation Performance</h3>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A5C6A] text-white flex items-center justify-center"><DollarSign size={20} /></div>
              <div>
                <p className="text-xl font-bold text-slate-800">{realOrderCount.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total processed</p>
              </div>
            </div>
            <div className="p-2 border border-slate-100 rounded-lg text-slate-400 cursor-pointer hover:bg-slate-50"><CalendarDays size={18} /></div>
          </div>
          
          {/* Animated Bar Chart */}
          <div className="flex items-end justify-between flex-1 gap-2 pt-4">
            {['DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY'].map((m, i) => (
              <div key={m} className="flex flex-col items-center gap-3 w-full group cursor-pointer">
                <div className="w-full bg-slate-100 rounded-full h-24 relative overflow-hidden">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${chartData[i]}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-[#2A5C6A] rounded-full transition-colors duration-300 group-hover:bg-[#E58C6A]" 
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{m}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Performers (Tengah) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Top Performers</h3>
            <span className="text-xs text-slate-400">Click to ping</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {performers.map((p) => (
                <motion.div 
                  layout
                  key={p.id} 
                  onClick={() => pingPerformer(p.id)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all group-hover:scale-105 ${p.color}`}>
                      {p.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Online' ? 'bg-emerald-500' : p.status === 'Busy' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-400">{p.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#E58C6A] bg-[#FADBCD]/30 px-3 py-1 rounded-full group-hover:bg-[#E58C6A] group-hover:text-white transition-colors">
                    {p.score}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Region (Kanan) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Targeting by region</h3>
          <div className="relative w-full h-[180px] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center group cursor-crosshair">
            {/* Fake Map Dots (Dotted grid pattern) */}
            <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'radial-gradient(#94A3B8 2px, transparent 2px)', backgroundSize: '12px 12px' }} />
            
            {/* Location Pin */}
            <motion.div 
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative z-10 bg-white shadow-lg p-2.5 rounded-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 relative">
                <div className="absolute inset-0 bg-blue-400 rounded-lg animate-ping opacity-20" />
                <MapPin size={16} className="relative z-10" />
              </div>
              <div className="pr-2">
                <p className="text-xs font-bold text-slate-800">Data Center Alpha</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-0.5">99.9% Uptime</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}