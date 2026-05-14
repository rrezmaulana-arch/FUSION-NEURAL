import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Activity, AlertTriangle, RefreshCw,
  CheckCircle2, Clock, XCircle,
  FileText, DollarSign, Palette, Search, Image, Bot,
} from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import PageHeader from '../../../components/ui/PageHeader';

// ── Agent & AI Provider Definitions ────────────────────────────────────────
interface ProviderMeta {
  key:   string;
  label: string;
  model: string;
  role:  string;
  icon:  React.ReactNode;
  color: string;
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
  { key: 'gemini_image',label: 'Gemini Imagen', model: '2.0-flash-image',      role: 'Marketing Image (Premium)',    icon: <Image size={16} />,     color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { key: 'hf_image',    label: 'FLUX.1-schnell',model: 'schnell',              role: 'Marketing Image (Fast Backup)',icon: <Image size={16} />,    color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { key: 'serper',      label: 'Serper.dev',    model: 'Google Search',        role: 'Search Tool (Real-time)',      icon: <Search size={16} />,    color: 'bg-slate-50 text-slate-600 border-slate-200' },
];

interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

// Derive agent call counts from activity_logs
function buildCallCounts(logs: ActivityLog[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const log of logs) {
    const agent = (log.agent || '').toLowerCase();
    if (agent === 'admin') map['groq'] = (map['groq'] || 0) + 1;
    else if (agent === 'finance') map['deepseek'] = (map['deepseek'] || 0) + 1;
    else if (agent === 'marketing') map['hf_text'] = (map['hf_text'] || 0) + 1;
    else if (agent === 'manager') map['gemini'] = (map['gemini'] || 0) + 1;
  }
  return map;
}

const THRESHOLD = 50;

// ── Main Component ─────────────────────────────────────────────────────────
export default function AgentHealthPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('—');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Listen to activity_logs from Firestore (replaces dead /api/memory endpoint)
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityLog[];
      setLogs(data);
      setLastSync(new Date().toLocaleTimeString('id-ID'));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const callCounts = buildCallCounts(logs);

  const warnings = PROVIDERS.filter(p => (callCounts[p.key] || 0) >= THRESHOLD).map(p => p.key);
  const activeWarnings = warnings.length;

  const handleForceSync = useCallback(async () => {
    setSyncing(true); setSyncMsg('');
    try {
      await NeuralCore.initCorePrompts();
      await FirebaseLogger.logAgentAction('Manager', 'FORCE_SYNC', 'Semua prompt agen disinkronisasi ke Firestore');
      setSyncMsg('✅ Semua SOP agen berhasil disinkronisasi ke Firestore.');
    } catch { setSyncMsg('❌ Gagal sync. Periksa koneksi Firestore.'); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 5000); }
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Agent Health Monitor"
        subtitle="Telemetri real-time dari Firestore activity_logs · SOP dari Firestore"
        accent="teal"
        icon={<Activity size={22} className="text-white" />}
        actions={
          <button onClick={handleForceSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Menyinkronkan...' : 'Force Sync SOP'}
          </button>
        }
      />

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
        {/* Firestore Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] rounded-2xl p-5 border border-emerald-500/30 shadow-sm flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Firestore Status
          </div>
          <div className="text-lg font-black text-emerald-400">Connected</div>
          <div className="text-[10px] text-slate-500">Sync: {lastSync}</div>
        </motion.div>

        {/* Total Calls */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-[#0f172a] rounded-2xl p-5 border border-white/10 shadow-sm"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><Activity size={12} />Total Aktivitas</div>
          <div className="text-3xl font-black text-slate-200">{loading ? '...' : logs.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">log tersimpan</div>
        </motion.div>

        {/* Active Warnings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 border shadow-sm ${activeWarnings > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0f172a] border-white/10'}`}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} />Threshold Warnings</div>
          <div className={`text-3xl font-black ${activeWarnings > 0 ? 'text-amber-400' : 'text-slate-200'}`}>{activeWarnings}</div>
          <div className="text-[10px] text-slate-500 mt-1">≥ {THRESHOLD} panggilan</div>
        </motion.div>

        {/* Unique Agents */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-[#0f172a] rounded-2xl p-5 border border-white/10 shadow-sm"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><Brain size={12} />Agen Aktif</div>
          <div className="text-3xl font-black text-slate-200">{Object.keys(callCounts).length}</div>
          <div className="text-[10px] text-slate-500 mt-1">dari {PROVIDERS.length} provider</div>
        </motion.div>
      </div>

      {/* Provider Cards Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          AI Provider Usage — {loading ? 'Memuat...' : `Update: ${lastSync} · Dihitung dari ${logs.length} log`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROVIDERS.map((p, i) => {
            const count   = callCounts[p.key] ?? 0;
            const pct     = Math.min((count / THRESHOLD) * 100, 100);
            const warned  = warnings.includes(p.key);
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-[#0f172a] rounded-2xl p-5 border shadow-sm ${warned ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${p.color.replace('bg-', 'bg-opacity-10 bg-').replace('border-', 'border-opacity-30 border-')} bg-opacity-10`}>
                      {p.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{p.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.model}</p>
                    </div>
                  </div>
                  {warned
                    ? <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"><AlertTriangle size={10} />HIGH</span>
                    : count > 0
                      ? <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle2 size={10} />OK</span>
                      : <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-[#1e293b] text-slate-400 border border-white/10"><Clock size={10} />IDLE</span>
                  }
                </div>

                <p className="text-[10px] text-slate-500 mb-2">{p.role}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Aktivitas Terdeteksi</span>
                    <span className={`font-bold ${warned ? 'text-amber-400' : 'text-slate-300'}`}>{count} / {THRESHOLD}</span>
                  </div>
                  <div className="w-full bg-[#1e293b] rounded-full h-2 overflow-hidden">
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

      {/* Recent Activity Log */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <XCircle size={12} className="text-rose-400" /> Live Activity Log ({logs.length} entries)
        </h2>
        <div className="bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-700">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-slate-400 text-xs font-mono">firestore/activity_logs</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-xs py-8 text-center">Belum ada log aktivitas agen.</div>
            ) : logs.slice(0, 30).map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 text-xs font-mono"
              >
                <span className="text-slate-500 shrink-0">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('id-ID') : '—'}</span>
                <span className="text-teal-400 shrink-0">[{log.agent}]</span>
                <span className="text-amber-400 shrink-0">{log.action}:</span>
                <span className="text-slate-300 break-all">{log.details?.slice(0, 120)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
