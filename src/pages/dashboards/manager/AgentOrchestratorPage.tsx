import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Briefcase, MessagesSquare, Calculator, Search, Megaphone, Coffee, Activity, Database, User } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

const AGENT_META = {
  manager: { label: 'Manager AI', desc: 'Orchestrator', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', shadow: 'shadow-indigo-500/20' },
  frontliner: { label: 'Frontliner AI', desc: 'Customer UX', icon: MessagesSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', shadow: 'shadow-emerald-500/20' },
  admin: { label: 'Admin AI', desc: 'Data & Supply', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', shadow: 'shadow-blue-500/20' },
  finance: { label: 'Finance AI', desc: 'Audit & Budget', icon: Calculator, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', shadow: 'shadow-amber-500/20' },
  marketing: { label: 'Marketing AI', desc: 'Creative Asset', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', shadow: 'shadow-rose-500/20' },
};

type AgentId = keyof typeof AGENT_META;

const LLM_WORKERS = [
  { id: 'groq', name: 'Groq', role: 'Fast Inference' },
  { id: 'gemini', name: 'Gemini', role: 'Orchestrator Core' },
  { id: 'mistral', name: 'Mistral', role: 'Backup Core' },
  { id: 'openrouter', name: 'OpenRouter', role: 'Fallback API' },
  { id: 'cerebras', name: 'Cerebras', role: 'Backup Fast' },
  { id: 'cohere', name: 'Cohere', role: 'JSON Formatter' },
  { id: 'deepseek', name: 'DeepSeek', role: 'Reasoner' },
];

export default function AgentOrchestratorPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({
    manager: 'IDLE',
    frontliner: 'IDLE',
    admin: 'IDLE',
    finance: 'IDLE',
    marketing: 'IDLE',
  });

  // Polling Redis agent statuses
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_all_agent_status' }),
        });
        const data = await res.json();
        if (data.statuses) {
          setStatuses(prev => ({ ...prev, ...data.statuses }));
        }
      } catch (e) {
        // ignore errors
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Firestore activity logs
  useEffect(() => {
    const q = query(collection(db, 'task_results'), orderBy('completedAt', 'desc'), limit(15));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        agent: doc.data().agent,
        action: 'TASK_COMPLETED',
        details: doc.data().task,
        timestamp: doc.data().completedAt,
      })) as ActivityLog[];
      setLogs(fetchedLogs);
    });
    return () => unsub();
  }, []);

  // Render Agent Avatar Card
  const renderAgent = (id: AgentId) => {
    const meta = AGENT_META[id];
    const Icon = meta.icon;
    const isWorking = statuses[id] === 'WORKING';
    
    return (
      <motion.div
        layoutId={`agent-avatar-${id}`}
        initial={false}
        animate={{ scale: isWorking ? 1.05 : 1, y: isWorking ? -5 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative z-20 flex flex-col items-center justify-center p-4 rounded-3xl bg-white shadow-lg border transition-all ${isWorking ? `${meta.border} ${meta.shadow}` : 'border-slate-100 shadow-slate-200/50 hover:shadow-slate-300/50'}`}
        style={{ width: '130px' }}
      >
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner transition-colors ${isWorking ? meta.bg : 'bg-slate-50'}`}>
          <Icon className={`w-6 h-6 transition-colors ${isWorking ? meta.color : 'text-slate-400'}`} />
          {isWorking && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className={`absolute -inset-1.5 rounded-2xl border-2 border-dashed ${meta.border}`}
            />
          )}
        </div>
        <span className="text-sm font-black text-slate-800 tracking-tight">{meta.label}</span>
        <span className="text-[10px] font-medium text-slate-500 mt-0.5">{meta.desc}</span>
        
        <div className={`mt-3 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 ${isWorking ? `${meta.bg} ${meta.color}` : 'bg-slate-100 text-slate-400'}`}>
          {isWorking && <span className={`w-1.5 h-1.5 rounded-full ${meta.color.replace('text-', 'bg-')} animate-pulse`} />}
          {statuses[id]}
        </div>
      </motion.div>
    );
  };

  const idleAgents = (Object.keys(AGENT_META) as AgentId[]).filter(id => statuses[id] === 'IDLE');

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agent Headquarters</h1>
          <p className="text-slate-500 text-sm mt-1.5">Pemetaan visual otonom AI tersinkronisasi Redis & Firebase</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-bold shadow-sm">
          <Activity size={16} className="text-emerald-500" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </div>
        </div>
      </div>

      {/* Blueprint / Office Map */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        {/* Modern Dot Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col gap-8">
          
          {/* Top Floor: Manager & Frontdesk */}
          <div className="grid grid-cols-2 gap-8">
            <div className="relative bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <MessagesSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-tight">Frontdesk Room</h3>
              </div>
              {statuses.frontliner === 'WORKING' && renderAgent('frontliner')}
            </div>
            
            <div className="relative bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-tight">Manager Office</h3>
              </div>
              {statuses.manager === 'WORKING' && renderAgent('manager')}
            </div>
          </div>

          {/* Central Lounge (Idle Room) */}
          <div className="relative bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-300/30 p-10 flex flex-col items-center justify-center min-h-[280px] w-full">
            <div className="absolute top-6 left-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Ruang Kumpul AI (Worker Pool)</h3>
                <p className="text-xs font-medium text-slate-500">Kumpulan model bahasa (LLM) & Agen Internal (IDLE)</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-12 w-full max-w-4xl">
               {LLM_WORKERS.map(worker => (
                  <div key={worker.id} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-100 w-28 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 text-slate-500">
                       <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 tracking-tight">{worker.name}</span>
                    <span className="text-[9px] font-medium text-slate-500 text-center leading-tight mt-0.5">{worker.role}</span>
                  </div>
               ))}
            </div>
            
            {idleAgents.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agen Internal Idle</p>
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {idleAgents.map(id => (
                    <div key={id} className="relative transform scale-90 origin-top">
                      {renderAgent(id)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floor: Worker Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Search className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-tight">Admin Desk</h3>
              </div>
              {statuses.admin === 'WORKING' && renderAgent('admin')}
            </div>
            
            <div className="relative bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-tight">Finance Room</h3>
              </div>
              {statuses.finance === 'WORKING' && renderAgent('finance')}
            </div>
            
            <div className="relative bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-tight">Marketing Studio</h3>
              </div>
              {statuses.marketing === 'WORKING' && renderAgent('marketing')}
            </div>
          </div>

        </div>
      </div>

      {/* Task Log Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-xl text-slate-800 tracking-tight">Log Hasil Kerja Agen</h3>
            <p className="text-sm text-slate-500 mt-1">Data tersimpan permanen di Firebase Firestore</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
            <Database size={14} className="text-slate-400" />
            Permanent Storage
          </span>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Waktu Selesai</th>
                <th className="px-6 py-4 font-bold">Agen Eksekutor</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Detail Tugas Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">Belum ada tugas otonom yang diselesaikan.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('id-ID') : 'Baru saja'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 capitalize">
                      {log.agent}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-fit">
                        <Sparkles size={10} />
                        COMPLETED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xl truncate font-medium" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

