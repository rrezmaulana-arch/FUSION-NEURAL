import { motion, AnimatePresence } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { ArrowRightLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LogsPage() {
  const { adminLogs } = useSystemEngine();

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Traffic Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time connection and payload synchronization history.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800">System Logs</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200">Export CSV</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-4 pl-4">Event ID</th>
                <th className="pb-4">Timestamp</th>
                <th className="pb-4">Latency</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <AnimatePresence initial={false}>
                {adminLogs.map((row) => (
                  <motion.tr 
                    key={row.id + row.time + Math.random()} 
                    initial={{ opacity: 0, backgroundColor: '#f0f9ff' }}
                    animate={{ opacity: 1, backgroundColor: 'transparent' }}
                    className="border-b border-slate-50/50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 pl-4 font-bold text-slate-700 flex items-center gap-3">
                      {row.status === 'Offline' ? <AlertCircle size={16} className="text-rose-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                      {row.id}
                    </td>
                    <td className="py-4 text-slate-500 text-xs font-medium">{row.time}</td>
                    <td className="py-4 font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft size={12} className="text-slate-300" /> {row.lat}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${row.style}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button className="text-blue-600 font-bold text-xs hover:underline">Details</button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {adminLogs.length === 0 && (
             <div className="py-10 text-center text-slate-500 text-sm">No recent logs generated. Wait for traffic to simulate.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
