import { motion } from 'framer-motion';
import { Server, Zap, Cpu, MemoryStick } from 'lucide-react';
import { useSystemEngine } from '../../../context/SystemEngineContext';

export default function NodesPage() {
  const { activeNodes } = useSystemEngine();

  const nodesList = Array.from({ length: 6 }).map((_, i) => ({
    id: `NODE-X${i + 1}`,
    status: i === 2 ? 'Offline' : 'Online',
    cpu: Math.floor(Math.random() * 40) + 20,
    mem: Math.floor(Math.random() * 50) + 30,
    uptime: `${Math.floor(Math.random() * 100) + 20} hrs`,
  }));

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Server Nodes</h1>
        <p className="text-sm text-slate-500 mt-1">Manage infrastructure nodes and hardware capacity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-sm font-medium">Total Active Nodes</span>
            <Server size={18} className="text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold">{activeNodes.toLocaleString()}</h2>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-50 text-emerald-900 rounded-3xl p-6 flex flex-col justify-between h-36 border border-emerald-100">
          <div className="flex justify-between items-start">
            <span className="text-emerald-700 text-sm font-medium">System Health</span>
            <Zap size={18} className="text-emerald-500" />
          </div>
          <h2 className="text-4xl font-bold">98.5%</h2>
        </motion.div>
      </div>

      <h3 className="font-bold text-lg text-slate-800 mt-8 mb-4">Node Clusters</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {nodesList.map((node, i) => (
          <motion.div 
            key={node.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className={`bg-white rounded-3xl p-6 border ${node.status === 'Offline' ? 'border-rose-200 shadow-sm' : 'border-slate-100 shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${node.status === 'Offline' ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-700'}`}>
                  <Server size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{node.id}</h4>
                  <p className={`text-xs font-bold ${node.status === 'Offline' ? 'text-rose-500' : 'text-emerald-500'}`}>{node.status}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Cpu size={14} /> CPU Load</span>
                <span className="font-bold text-slate-700">{node.cpu}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${node.cpu > 50 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${node.cpu}%` }} />
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-slate-500 flex items-center gap-2"><MemoryStick size={14} /> Memory</span>
                <span className="font-bold text-slate-700">{node.mem}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${node.mem > 50 ? 'bg-amber-500' : 'bg-purple-500'}`} style={{ width: `${node.mem}%` }} />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-400">
              <span>Uptime: {node.uptime}</span>
              <button className="text-blue-600 hover:text-blue-700">Reboot</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
