import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Server, Globe, Database, Sparkles } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';


interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

export default function AgentOrchestratorPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);


  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      setLogs(fetchedLogs);
    });

    return () => unsub();
  }, []);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const recentLogs = logs.slice(0, 20).map(l => `[${l.agent}] ${l.action}: ${l.details}`);
      const result = await NeuralCore.evaluateAndRealignAgents(recentLogs);
      const summary = result.target_agent !== 'none'
        ? `Re-alignment needed: ${result.target_agent}`
        : 'All agents operating normally';
      await FirebaseLogger.logAgentAction('Manager', 'EVALUATE_AGENT', summary);
    } catch (error) {
      console.error('Failed to evaluate agents:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const agents = [
    { id: 'AG-01', role: 'CTO (Dev)', status: 'Online', load: 32, latency: '12ms', icon: Network },
    { id: 'AG-02', role: 'CMO (Marketing)', status: 'Online', load: 84, latency: '45ms', icon: Globe },
    { id: 'AG-03', role: 'CFO (Finance)', status: 'Online', load: 12, latency: '110ms', icon: Database },
    { id: 'AG-04', role: 'COO (Ops)', status: 'Online', load: 45, latency: '22ms', icon: Server },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
            <Network className="text-teal-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Command Center</h1>
            <p className="text-slate-500 text-sm">Global overview and Neural Log Table</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 transition-colors text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50"
          >
            {isEvaluating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {isEvaluating ? 'Evaluating...' : 'Evaluate Agents'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          return (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Icon size={20} className="text-slate-500" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{agent.status}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800">{agent.role}</h3>
              <p className="text-xs font-medium text-slate-500 mb-4">{agent.id}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-500 uppercase">Load</span>
                    <span className="font-bold text-slate-800">{agent.load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${agent.load}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col">
        <h3 className="font-bold text-lg text-slate-800 mb-6">Neural Log Table</h3>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Time</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 rounded-tr-2xl">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">Listening to neural network activity...</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {log.agent}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
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
