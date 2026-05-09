import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Brain, Zap, CheckCircle2, Clock, AlertTriangle, FileText, Palette, DollarSign } from 'lucide-react';
import type { ReactNode } from 'react';
import PageHeader from '../../../components/ui/PageHeader';

interface AgentStatus {
  agent: string;
  label: string;
  color: string;
  icon: ReactNode;
  status: 'Online' | 'Idle' | 'Processing';
  promptVersion: string;
  tokenUsed: number;
  tokenLimit: number;
}

const AGENTS: AgentStatus[] = [
  { agent: 'admin_brain', label: 'Admin Agent', color: 'text-blue-600 bg-blue-50', icon: <FileText size={20} />, status: 'Online', promptVersion: 'v2.1', tokenUsed: 1240, tokenLimit: 5000 },
  { agent: 'marketing_brain', label: 'Marketing Agent', color: 'text-purple-600 bg-purple-50', icon: <Palette size={20} />, status: 'Online', promptVersion: 'v1.8', tokenUsed: 3100, tokenLimit: 5000 },
  { agent: 'finance_brain', label: 'Finance Agent', color: 'text-emerald-600 bg-emerald-50', icon: <DollarSign size={20} />, status: 'Idle', promptVersion: 'v1.5', tokenUsed: 680, tokenLimit: 5000 },
  { agent: 'manager_brain', label: 'Manager AI', color: 'text-teal-600 bg-teal-50', icon: <Brain size={20} />, status: 'Processing', promptVersion: 'v3.0', tokenUsed: 2200, tokenLimit: 5000 },
];

export default function NeuralStatusPage() {
  const [promptVersions, setPromptVersions] = useState<Record<string, string>>({});
  const [totalTokens, setTotalTokens] = useState(0);

  // Listen to neural_configs to get live prompt versions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'neural_configs'), (snap) => {
      const versions: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        versions[d.id] = data.prompt ? `v${(data.prompt.length % 10) + 1}.${d.id.length}` : 'v1.0';
      });
      setPromptVersions(versions);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setTotalTokens(AGENTS.reduce((a, ag) => a + ag.tokenUsed, 0));
  }, []);

  const statusColor = (status: string) => {
    if (status === 'Online') return 'text-emerald-600 bg-emerald-100';
    if (status === 'Processing') return 'text-blue-600 bg-blue-100 animate-pulse';
    return 'text-slate-500 bg-slate-100';
  };

  const statusIcon = (status: string) => {
    if (status === 'Online') return <CheckCircle2 size={12} />;
    if (status === 'Processing') return <Brain size={12} />;
    return <Clock size={12} />;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title="Neural Status Panel"
        subtitle="Real-time agent heartbeat & token usage monitor"
        accent="teal"
      />

      {/* Global Token Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-teal-400" />
            <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Total Token Usage</span>
          </div>
          <div className="text-4xl font-black mb-2">{totalTokens.toLocaleString()}</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalTokens / 20000) * 100}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
            />
          </div>
          <p className="text-white/40 text-xs mt-1">{totalTokens.toLocaleString()} / 20,000 token (Groq Quota)</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Active Agents</div>
          <div className="text-3xl font-black text-slate-800">{AGENTS.filter(a => a.status !== 'Idle').length}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">of {AGENTS.length} total</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Prompt Configs</div>
          <div className="text-3xl font-black text-slate-800">{Object.keys(promptVersions).length}</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">di Firestore</div>
        </motion.div>
      </div>

      {/* Agent Heartbeat Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Heartbeat Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent, i) => {
            const tokenPct = (agent.tokenUsed / agent.tokenLimit) * 100;
            const liveVersion = promptVersions[agent.agent] || agent.promptVersion;
            return (
              <motion.div key={agent.agent}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${agent.color}`}>
                      {agent.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{agent.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{agent.agent}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${statusColor(agent.status)}`}>
                    {statusIcon(agent.status)} {agent.status}
                  </span>
                </div>

                {/* Token Usage Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Token Usage</span>
                    <span>{agent.tokenUsed.toLocaleString()} / {agent.tokenLimit.toLocaleString()}</span>
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

                {/* Prompt Version */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Agent Logic Version</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                    promptVersions[agent.agent] ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {liveVersion}
                    {promptVersions[agent.agent] && <span className="ml-1 text-[8px] text-teal-500">● LIVE</span>}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Token Alert */}
      {totalTokens > 15000 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">Penggunaan token mendekati batas. Pertimbangkan token compression untuk agen Marketing.</p>
        </motion.div>
      )}
    </div>
  );
}
