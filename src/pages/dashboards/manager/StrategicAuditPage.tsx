import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Brain, AlertTriangle, CheckCircle2, RefreshCw, Zap, Terminal, Shield } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

interface EvalResult {
  target_agent: string;
  new_prompt: string;
}

export default function StrategicAuditPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Live activity logs
  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityLog[]);
    });
    return () => unsub();
  }, []);

  const resultRef = useRef<HTMLDivElement>(null);

  // The Big Button — Evaluate & Re-Align
  const handleAudit = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    setSuccessMsg('');
    setCustomPrompt('');
    try {
      const recentLogs = logs.slice(0, 50).map(l => `[${l.agent}] ${l.action}: ${l.details}`);
      const rawResult = await NeuralCore.evaluateAndRealignAgents(recentLogs);

      // Normalize result regardless of format AI returns
      let normalized: EvalResult;
      if (rawResult && typeof rawResult === 'object' && rawResult.target_agent) {
        normalized = rawResult as EvalResult;
      } else if (typeof rawResult === 'string') {
        normalized = { target_agent: 'unknown', new_prompt: rawResult };
      } else {
        normalized = { target_agent: 'none', new_prompt: 'Audit complete. All agents operating normally.' };
      }

      setEvalResult(normalized);
      await FirebaseLogger.logAgentAction('Manager', 'STRATEGIC_AUDIT', `Audit selesai. Target: ${normalized.target_agent}`);
      // Scroll result into view
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setEvalResult({ target_agent: 'error', new_prompt: 'Gagal menghubungi Manager AI. Periksa koneksi Groq API.' });
    } finally {
      setIsEvaluating(false);
    }
  };


  // Override Command — inject new prompt
  const handleInjectPrompt = async () => {
    if (!evalResult || evalResult.target_agent === 'none' || evalResult.target_agent === 'error') return;
    setIsInjecting(true);
    try {
      const promptToInject = customPrompt.trim() || evalResult.new_prompt;
      await setDoc(doc(db, 'neural_configs', evalResult.target_agent), { prompt: promptToInject });
      await FirebaseLogger.logAgentAction('Manager', 'INJECT_PROMPT', `${evalResult.target_agent} berhasil di-override dengan instruksi baru.`);
      setSuccessMsg(`Prompt baru berhasil disuntikkan ke "${evalResult.target_agent}"`);
      setEvalResult(null);
      setCustomPrompt('');
    } catch (e) { console.error(e); }
    finally { setIsInjecting(false); }
  };

  const agentColor = (agent: string) => {
    if (agent === 'Admin') return 'bg-blue-500/20 text-blue-400';
    if (agent === 'Marketing') return 'bg-purple-500/20 text-purple-400';
    if (agent === 'Finance') return 'bg-emerald-500/20 text-emerald-400';
    if (agent === 'Manager') return 'bg-teal-500/20 text-teal-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Strategic Audit Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Evaluasi otonom & re-alignment otak agen secara real-time</p>
      </div>

      {/* THE BIG BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#0D9488 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-teal-400" />
              <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Autonomous Intelligence</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
              Evaluate & Re-Align Agents
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              AI Manager akan menganalisis 50 log aktivitas terbaru, mendeteksi anomali, dan merekomendasikan instruksi sistem baru jika ada agen yang bekerja tidak efisien.
            </p>
            <div className="flex flex-wrap gap-3 mt-5 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Zap size={11} className="text-teal-400" /> 50 log terakhir</span>
              <span className="flex items-center gap-1"><Brain size={11} className="text-teal-400" /> Groq Llama-3.3-70b</span>
              <span className="flex items-center gap-1"><Terminal size={11} className="text-teal-400" /> JSON structured output</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAudit}
            disabled={isEvaluating}
            className="shrink-0 flex items-center gap-3 px-8 py-5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-600 text-white font-black text-base rounded-2xl shadow-2xl shadow-teal-500/30 transition-all"
          >
            <Brain size={22} className={isEvaluating ? 'animate-spin' : ''} />
            {isEvaluating ? 'Menganalisis...' : 'Jalankan Audit AI'}
          </motion.button>
        </div>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isEvaluating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
              <Brain size={24} className="text-teal-600 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Manager AI sedang menganalisis log...</p>
              <p className="text-sm text-slate-500 mt-0.5">Mengirim {logs.slice(0, 50).length} log ke Groq API</p>
            </div>
            <div className="flex gap-1 ml-auto">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  className="w-2 h-2 rounded-full bg-teal-400" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
          >
            <CheckCircle2 size={18} className="text-emerald-500" />
            <p className="font-bold text-emerald-700 text-sm">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-Alignment Output */}
      {!isEvaluating && evalResult && (
        <motion.div
          ref={resultRef}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
            <div className={`p-5 border-b border-slate-100 flex items-center gap-3 ${
              evalResult.target_agent === 'none' ? 'bg-emerald-50' :
              evalResult.target_agent === 'error' ? 'bg-rose-50' : 'bg-amber-50'
            }`}>
              {evalResult.target_agent === 'none' ? (
                <><CheckCircle2 size={18} className="text-emerald-600" />
                <div><p className="font-bold text-emerald-800">Semua Agen Bekerja Normal</p>
                <p className="text-xs text-emerald-600 mt-0.5">Tidak ada re-alignment yang diperlukan.</p></div></>
              ) : evalResult.target_agent === 'error' ? (
                <><AlertTriangle size={18} className="text-rose-500" />
                <div><p className="font-bold text-rose-700">Audit Gagal</p>
                <p className="text-xs text-rose-500 mt-0.5">{evalResult.new_prompt}</p></div></>
              ) : (
                <><AlertTriangle size={18} className="text-amber-600" />
                <div><p className="font-bold text-amber-800">Perlu Re-Alignment: <code className="font-mono bg-amber-100 px-1 rounded">{evalResult.target_agent}</code></p>
                <p className="text-xs text-amber-600 mt-0.5">AI merekomendasikan instruksi sistem baru untuk agen ini.</p></div></>
              )}
            </div>

            {evalResult.target_agent !== 'none' && evalResult.target_agent !== 'error' && (
              <div className="p-6 space-y-5">
                {/* AI Recommendation */}
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Re-Alignment Output (AI Recommendation)</p>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {evalResult.new_prompt.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                  </div>
                </div>

                {/* Override Command */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Terminal size={11} /> Override Command (Opsional — biarkan kosong untuk pakai rekomendasi AI)
                  </p>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder={`Ketik instruksi kustom Kak untuk ${evalResult.target_agent}...`}
                    rows={4}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-teal-300 resize-none"
                  />
                </div>

                {/* Inject Button */}
                <button
                  onClick={handleInjectPrompt}
                  disabled={isInjecting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-lg shadow-teal-500/20"
                >
                  {isInjecting
                    ? <><RefreshCw size={16} className="animate-spin" /> Menyuntikkan prompt...</>
                    : <><Zap size={16} /> Inject Prompt ke Firestore ({evalResult.target_agent})</>
                  }
                </button>
              </div>
            )}
          </motion.div>
      )}

      {/* Live Activity Log */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Activity Log ({logs.length} entries)</h2>
        <div className="bg-[#0F172A] rounded-2xl p-4 h-[280px] overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              Belum ada log. Jalankan beberapa aksi di Admin/Marketing terlebih dahulu.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${agentColor(log.agent)}`}>
                  {log.agent}
                </span>
                <div className="min-w-0">
                  <p className="text-slate-300 text-xs font-medium truncate">{log.action}</p>
                  <p className="text-slate-600 text-[10px] truncate">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
