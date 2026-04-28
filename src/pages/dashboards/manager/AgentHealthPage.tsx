import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, onSnapshot as fsOnSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Brain, Zap, CheckCircle2, Clock, AlertTriangle, FileText, Palette, DollarSign, RefreshCw, Activity } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

interface AgentHealth {
  agentId: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  logCount: number;
  lastSeen: string;
  status: 'Online' | 'Idle' | 'Offline';
  promptVersion: string;
}

const AGENT_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Admin: { label: 'Admin Agent', color: 'text-blue-600 bg-blue-50', icon: <FileText size={20} /> },
  Marketing: { label: 'Marketing Agent', color: 'text-purple-600 bg-purple-50', icon: <Palette size={20} /> },
  Finance: { label: 'Finance Agent', color: 'text-emerald-600 bg-emerald-50', icon: <DollarSign size={20} /> },
  Manager: { label: 'Manager AI', color: 'text-teal-600 bg-teal-50', icon: <Brain size={20} /> },
};

function getLastSeenLabel(timestamp: any): { label: string; minutesAgo: number } {
  if (!timestamp?.toDate) return { label: 'Tidak diketahui', minutesAgo: 999 };
  const now = new Date();
  const then = timestamp.toDate();
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return { label: 'Baru saja', minutesAgo: 0 };
  if (diffMin < 60) return { label: `${diffMin} menit lalu`, minutesAgo: diffMin };
  return { label: `${Math.floor(diffMin / 60)} jam lalu`, minutesAgo: diffMin };
}

function getStatus(minutesAgo: number): 'Online' | 'Idle' | 'Offline' {
  if (minutesAgo <= 5) return 'Online';
  if (minutesAgo <= 30) return 'Idle';
  return 'Offline';
}

export default function AgentHealthPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [promptVersions, setPromptVersions] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [agents, setAgents] = useState<AgentHealth[]>([]);

  // Baca activity_logs real-time dari Firestore
  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ActivityLog);
      setLogs(fetchedLogs);

      // Hitung stats per agen dari log nyata
      const agentNames = ['Admin', 'Marketing', 'Finance', 'Manager'];
      const agentData: AgentHealth[] = agentNames.map(name => {
        const agentLogs = fetchedLogs.filter(l => l.agent === name);
        const logCount = agentLogs.length;
        const latestLog = agentLogs[0];
        const { label: lastSeen, minutesAgo } = getLastSeenLabel(latestLog?.timestamp);
        const status = logCount === 0 ? 'Offline' : getStatus(minutesAgo);
        const meta = AGENT_META[name];
        return {
          agentId: name.toLowerCase() + '_brain',
          label: meta.label,
          color: meta.color,
          icon: meta.icon,
          logCount,
          lastSeen,
          status,
          promptVersion: promptVersions[name.toLowerCase() + '_brain'] || '–',
        };
      });
      setAgents(agentData);
    });
    return () => unsub();
  }, [promptVersions]);

  // Baca neural_configs untuk prompt versions live
  useEffect(() => {
    const unsub = fsOnSnapshot(collection(db, 'neural_configs'), (snap) => {
      const versions: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.updated_at) {
          versions[d.id] = `v${new Date(data.updated_at).getDate()}.${d.id.length}`;
        } else {
          versions[d.id] = data.prompt ? `v${(data.prompt.length % 9) + 1}.${d.id.length}` : 'v1.0';
        }
      });
      setPromptVersions(versions);
    });
    return () => unsub();
  }, []);

  // Total token estimate dari log count
  const totalTokenEstimate = logs.length * 280; // rata-rata ~280 token per aksi AI
  const tokenLimit = 80000;

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncMsg('');
    try {
      await NeuralCore.initCorePrompts();
      await FirebaseLogger.logAgentAction('Manager', 'FORCE_SYNC', 'Semua prompt agen telah disinkronisasi ulang ke Firestore');
      setSyncMsg('✅ Semua prompt agen berhasil disinkronisasi ulang ke Firestore.');
      setTimeout(() => setSyncMsg(''), 5000);
    } catch (e) {
      setSyncMsg('❌ Gagal sync. Periksa koneksi Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Online') return 'text-emerald-600 bg-emerald-100';
    if (status === 'Idle') return 'text-amber-600 bg-amber-100';
    return 'text-slate-500 bg-slate-100';
  };

  const statusIcon = (status: string) => {
    if (status === 'Online') return <CheckCircle2 size={12} />;
    if (status === 'Idle') return <Clock size={12} />;
    return <AlertTriangle size={12} />;
  };

  const onlineCount = agents.filter(a => a.status === 'Online').length;
  const totalActions = logs.length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agent Health Monitor</h1>
          <p className="text-slate-500 text-sm mt-1">Status real berdasarkan aktivitas log Firestore — bukan data statis</p>
        </div>
        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 shadow-md"
        >
          <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Menyinkronkan...' : 'Force Sync All Prompts'}
        </button>
      </div>

      {/* Sync Message */}
      <AnimatePresence>
        {syncMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 rounded-2xl p-4 border ${syncMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
          >
            <p className={`text-sm font-bold ${syncMsg.startsWith('✅') ? 'text-emerald-700' : 'text-rose-700'}`}>{syncMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-teal-400" />
            <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Estimasi Token Terpakai (Session)</span>
          </div>
          <div className="text-4xl font-black mb-2">{totalTokenEstimate.toLocaleString()}</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalTokenEstimate / tokenLimit) * 100, 100)}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-2 rounded-full ${totalTokenEstimate > tokenLimit * 0.8 ? 'bg-rose-400' : 'bg-gradient-to-r from-teal-400 to-emerald-400'}`}
            />
          </div>
          <p className="text-white/40 text-xs mt-1">~{totalActions} aksi log · {totalTokenEstimate.toLocaleString()} / {tokenLimit.toLocaleString()} est. token</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><Activity size={12} />Active Agents</div>
          <div className="text-3xl font-black text-slate-800">{onlineCount}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">dari {agents.length} agen</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><Brain size={12} />Total Actions</div>
          <div className="text-3xl font-black text-slate-800">{totalActions}</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">di activity_logs</div>
        </motion.div>
      </div>

      {/* Agent Heartbeat Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Heartbeat Monitor — Data Real Firestore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent, i) => {
            const tokenPct = Math.min((agent.logCount / 30) * 100, 100);
            const liveVersion = agent.promptVersion;
            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${agent.color}`}>
                      {agent.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{agent.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{agent.agentId}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${statusColor(agent.status)}`}>
                    {statusIcon(agent.status)} {agent.status}
                  </span>
                </div>

                {/* Activity Bar (berdasarkan log count nyata) */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Activity (log terakhir)</span>
                    <span>{agent.logCount} aksi tercatat</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tokenPct}%` }}
                      transition={{ duration: 1.2, delay: i * 0.07 }}
                      className={`h-1.5 rounded-full ${tokenPct > 80 ? 'bg-rose-400' : tokenPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    />
                  </div>
                </div>

                {/* Last Seen + Prompt Version */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Last Seen</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{agent.lastSeen}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Logic Version</p>
                    <p className={`text-xs font-mono font-bold mt-0.5 ${liveVersion !== '–' ? 'text-teal-700' : 'text-slate-400'}`}>
                      {liveVersion}
                      {liveVersion !== '–' && <span className="ml-1 text-[8px] text-teal-500">● LIVE</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Token Warning */}
      {totalTokenEstimate > tokenLimit * 0.75 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Estimasi token mendekati batas sesi. Pertimbangkan untuk mengurangi frekuensi panggilan AI Marketing atau menjalankan <strong>Force Sync</strong> untuk mereset konteks.
          </p>
        </motion.div>
      )}
    </div>
  );
}
