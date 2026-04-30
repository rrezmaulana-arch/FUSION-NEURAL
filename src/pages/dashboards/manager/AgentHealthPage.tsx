import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Activity, AlertTriangle, RefreshCw,
  CheckCircle2, Clock, XCircle, Trash2, Wifi, WifiOff,
  FileText, DollarSign, Palette, Search, Image, Bot,
} from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

// ── Agent & AI Provider Definitions ────────────────────────────────────────
interface ProviderMeta {
  key:   string;          // Redis key suffix, e.g. "groq"
  label: string;          // Display name
  model: string;          // Model shortname
  role:  string;          // Which agent uses this
  icon:  React.ReactNode;
  color: string;          // Tailwind bg+text
}

const PROVIDERS: ProviderMeta[] = [
  { key: 'groq',        label: 'Groq',         model: 'llama-3.3-70b',        role: 'Frontliner (Primary)',         icon: <Zap size={16} />,       color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { key: 'cerebras',    label: 'Cerebras',      model: 'llama-3.3-70b',        role: 'Frontliner (Backup)',          icon: <Bot size={16} />,       color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { key: 'gemini',      label: 'Gemini',        model: '2.5-flash-preview',    role: 'Manager (Primary)',            icon: <Brain size={16} />,     color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'mistral',     label: 'Mistral',       model: 'large-latest',         role: 'Manager (Backup)',             icon: <Bot size={16} />,       color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { key: 'deepseek',    label: 'DeepSeek',      model: 'deepseek-reasoner',    role: 'Finance (Primary)',            icon: <DollarSign size={16} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { key: 'cohere',      label: 'Cohere',        model: 'command-r-plus',       role: 'Admin JSON (Primary)',         icon: <FileText size={16} />,  color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { key: 'openrouter',  label: 'OpenRouter',    model: 'gpt-4o-mini:free',     role: 'Admin + Universal Fallback',  icon: <Activity size={16} />,  color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { key: 'hf_text',     label: 'HuggingFace',   model: 'Mistral-7B-Instruct',  role: 'Marketing Text (Primary)',     icon: <Palette size={16} />,   color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'gemini_image',label: 'Gemini Imagen', model: '2.0-flash-image',      role: 'Marketing Image (Premium)',   icon: <Image size={16} />,     color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { key: 'hf_image',    label: 'FLUX.1-schnell','model': 'schnell',            role: 'Marketing Image (Fast Backup)',icon: <Image size={16} />,    color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { key: 'serper',      label: 'Serper.dev',    model: 'Google Search',        role: 'Search Tool (Real-time)',      icon: <Search size={16} />,    color: 'bg-slate-50 text-slate-600 border-slate-200' },
];

const THRESHOLD = 50;

interface ErrorEntry { apiName: string; errorMsg: string; agentRole: string; ts: string; }
interface TelemetryData {
  counts:    Record<string, number>;
  warnings:  string[];
  threshold: number;
  errors:    ErrorEntry[];
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AgentHealthPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [lastSync,  setLastSync]  = useState<string>('—');
  const [redisOk,   setRedisOk]   = useState<boolean | null>(null);
  const [syncing,   setSyncing]   = useState(false);
  const [syncMsg,   setSyncMsg]   = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_telemetry' }),
      });
      const data = await res.json();
      if (data.ok) {
        setTelemetry(data);
        setRedisOk(true);
        setLastSync(new Date().toLocaleTimeString('id-ID'));
      } else {
        setRedisOk(false);
      }
    } catch {
      setRedisOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 30_000);
    return () => clearInterval(id);
  }, [fetchTelemetry]);

  const handleForceSync = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      await NeuralCore.initCorePrompts();
      await FirebaseLogger.logAgentAction('Manager', 'FORCE_SYNC', 'Semua prompt agen disinkronisasi ke Firestore');
      setSyncMsg('✅ Semua SOP agen berhasil disinkronisasi ke Firestore.');
    } catch { setSyncMsg('❌ Gagal sync. Periksa koneksi Firestore.'); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 5000); }
  };

  const handleResetUsage = async () => {
    setResetting(true);
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_usage' }),
      });
      await fetchTelemetry();
    } finally { setResetting(false); }
  };

  const totalCalls = telemetry ? Object.values(telemetry.counts).reduce((a, b) => a + b, 0) : 0;
  const activeWarnings = telemetry?.warnings.length || 0;

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agent Health Monitor</h1>
          <p className="text-slate-500 text-sm mt-1">Telemetri real-time dari Upstash Redis · SOP dari Firestore</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetUsage} disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 text-sm font-bold rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {resetting ? 'Mereset...' : 'Reset Usage'}
          </button>
          <button
            onClick={handleForceSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Menyinkronkan...' : 'Force Sync SOP'}
          </button>
        </div>
      </div>

      {/* Sync Message */}
      <AnimatePresence>
        {syncMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 rounded-2xl p-4 border ${syncMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
          >
            <p className="text-sm font-bold">{syncMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Redis Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col gap-2 ${redisOk === false ? 'border-rose-200' : 'border-slate-100'}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            {redisOk === null ? <Clock size={12} /> : redisOk ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-rose-500" />}
            Redis Status
          </div>
          <div className={`text-lg font-black ${redisOk === null ? 'text-slate-400' : redisOk ? 'text-emerald-600' : 'text-rose-600'}`}>
            {redisOk === null ? 'Checking...' : redisOk ? 'Connected' : 'Offline'}
          </div>
          <div className="text-[10px] text-slate-400">Sync: {lastSync}</div>
        </motion.div>

        {/* Total Calls */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Activity size={12} />Total Calls</div>
          <div className="text-3xl font-black text-slate-800">{totalCalls.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">sesi ini</div>
        </motion.div>

        {/* Active Warnings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 border shadow-sm ${activeWarnings > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><AlertTriangle size={12} />Threshold Warnings</div>
          <div className={`text-3xl font-black ${activeWarnings > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{activeWarnings}</div>
          <div className="text-[10px] text-slate-400 mt-1">≥ {THRESHOLD} panggilan</div>
        </motion.div>

        {/* Errors Today */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`rounded-2xl p-5 border shadow-sm ${(telemetry?.errors.length || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><XCircle size={12} />Error Log</div>
          <div className={`text-3xl font-black ${(telemetry?.errors.length || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{telemetry?.errors.length || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">entri terbaru</div>
        </motion.div>
      </div>

      {/* Global Usage Warning Banner */}
      <AnimatePresence>
        {activeWarnings > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
          >
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              <strong>Peringatan Penggunaan:</strong>{' '}
              {telemetry!.warnings.map(w => {
                const p = PROVIDERS.find(x => x.key === w);
                return p ? `${p.label} (${p.role})` : w;
              }).join(', ')}{' '}
              sudah mencapai ≥{THRESHOLD} panggilan. Pertimbangkan untuk mereset atau memantau lebih lanjut.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Cards Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          AI Provider Usage — {loading ? 'Memuat...' : `Update: ${lastSync}`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROVIDERS.map((p, i) => {
            const count   = telemetry?.counts[p.key] ?? 0;
            const pct     = Math.min((count / THRESHOLD) * 100, 100);
            const warned  = (telemetry?.warnings || []).includes(p.key);
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl p-5 border shadow-sm ${warned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-100'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${p.color}`}>
                      {p.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.model}</p>
                    </div>
                  </div>
                  {warned
                    ? <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={10} />HIGH</span>
                    : count > 0
                      ? <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} />OK</span>
                      : <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-500"><Clock size={10} />IDLE</span>
                  }
                </div>

                {/* Role badge */}
                <p className="text-[10px] text-slate-400 mb-2">{p.role}</p>

                {/* Usage bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>API Calls</span>
                    <span className={`font-bold ${warned ? 'text-amber-600' : 'text-slate-600'}`}>{count} / {THRESHOLD}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.04 }}
                      className={`h-2 rounded-full ${warned ? 'bg-amber-400' : pct > 60 ? 'bg-orange-400' : 'bg-emerald-400'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Error Log */}
      {(telemetry?.errors.length || 0) > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <XCircle size={12} className="text-rose-400" /> Error Log Terbaru (Redis)
          </h2>
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-slate-400 text-xs font-mono">error_log:system</span>
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              {telemetry!.errors.map((err, i) => {
                const p   = PROVIDERS.find(x => x.key === err.apiName);
                const ts  = err.ts ? new Date(err.ts).toLocaleTimeString('id-ID') : '—';
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 text-xs font-mono"
                  >
                    <span className="text-slate-500 shrink-0">{ts}</span>
                    <span className="text-rose-400 shrink-0">[{err.agentRole || '?'}]</span>
                    <span className="text-amber-400 shrink-0">{p?.label || err.apiName}:</span>
                    <span className="text-slate-300 break-all">{err.errorMsg?.slice(0, 150)}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
