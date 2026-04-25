import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Wifi, MoreHorizontal, Database, ArrowRightLeft } from 'lucide-react';
import { useSystemEngine } from '../../../context/SystemEngineContext';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [sliderVal, setSliderVal] = useState(25);
  const { payloads, activeNodes: nodes, adminLogs: logs, adminChartData: chartData } = useSystemEngine();

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      
      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">IoT Infrastructure</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time monitoring for node synchronizations.</p>
      </div>

      {/* TOP ROW - STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dark Primary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111C2D] rounded-[24px] p-6 text-white shadow-lg flex flex-col justify-between h-36 relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Total Payloads Sent</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Database size={14} className="text-slate-300" />
            </div>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <motion.h2 key={payloads} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="text-3xl font-bold">{payloads.toLocaleString()}</motion.h2>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
            </div>
          </div>
        </motion.div>

        {/* Light Card 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Active ESP32 Nodes</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Wifi size={14} className="text-slate-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <motion.h2 key={nodes} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-3xl font-bold text-slate-800">{nodes.toLocaleString()}</motion.h2>
            <span className="text-xs text-emerald-500 font-bold">+12.5%</span>
          </div>
        </motion.div>

        {/* Light Card 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-36 relative overflow-hidden"
        >
          <motion.div 
            animate={{ x: ['-100%', '200%'] }} 
            transition={{ duration: 3, ease: 'linear', repeat: Infinity, repeatDelay: 5 }}
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-emerald-100/30 to-transparent -skew-x-12"
          />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm text-slate-500 font-medium">System Uptime</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Server size={14} className="text-slate-400" />
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <h2 className="text-3xl font-bold text-slate-800">99.9%</h2>
            <span className="text-xs text-emerald-500 font-bold">Stable</span>
          </div>
        </motion.div>

      </div>

      {/* MIDDLE ROW - CHART & MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Traffic Statistic */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="font-bold text-lg text-slate-800">Traffic Statistic</h3>
            <div className="flex bg-slate-50 p-1 rounded-lg w-max relative">
              {['Day', 'Week', 'Month'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTab(t as 'Day' | 'Week' | 'Month')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all relative z-10 ${tab === t ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t}
                  {tab === t && (
                    <motion.div layoutId="adminTab" className="absolute inset-0 bg-slate-900 rounded-md -z-10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-48 flex items-end justify-between px-2 sm:px-6">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full border-b border-slate-100 flex items-end justify-start h-full pb-1">
                  <span className="text-[10px] text-slate-300 font-medium">{`0${3-i}.00 PM`}</span>
                </div>
              ))}
            </div>

            {chartData.slice(0, tab === 'Day' ? 4 : tab === 'Month' ? 12 : 7).map((d, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-4 w-full h-full justify-end group">
                <div className="flex gap-1.5 items-end h-full w-full justify-center relative">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${d.h1}%` }} className="w-2 sm:w-3 bg-slate-900 rounded-full transition-all group-hover:bg-blue-600" />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${d.h2}%` }} className="w-2 sm:w-3 bg-slate-200 rounded-full transition-all group-hover:bg-blue-200" />
                </div>
                <span className="text-xs text-slate-400 font-medium">#{i+1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Node Locations / Hardware Placements */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Server Nodes</h3>
            <button className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden group">
            {/* Fake Dotted Map */}
            <div className="w-full h-full opacity-20 absolute inset-0 transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: 'radial-gradient(#64748B 2px, transparent 2px)', backgroundSize: '10px 10px' }} />
            
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="bg-slate-900 text-white rounded-xl p-3 shadow-xl flex flex-col items-center whitespace-nowrap z-10 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <span className="text-xs font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Main Server</span>
              <span className="text-[10px] text-slate-300 mt-0.5">Capacity: {sliderVal}%</span>
            </motion.div>
          </div>

          {/* Interactive Scale slider */}
          <div className="mt-8 px-2 relative">
            <input 
              type="range" 
              min="0" max="100" 
              value={sliderVal} 
              onChange={(e) => setSliderVal(parseInt(e.target.value))}
              className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
            />
            <div className="h-1.5 bg-slate-100 rounded-full relative pointer-events-none">
              <div className="absolute left-0 top-0 h-full bg-slate-900 rounded-full transition-all" style={{ width: `${sliderVal}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-slate-900 rounded-full shadow-sm transition-all" style={{ left: `calc(${sliderVal}% - 8px)` }} />
            </div>
            <div className="flex justify-between mt-3 text-[9px] text-slate-400 font-bold px-1">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Latest Logs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Latest Sync Logs</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-bold">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4">Node ID</th>
                  <th className="pb-4">Time</th>
                  <th className="pb-4">Latency</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <AnimatePresence initial={false}>
                  {logs.map((row) => (
                    <motion.tr 
                      key={row.id + row.time} // Unique enough for simulation
                      initial={{ opacity: 0, backgroundColor: '#f0f9ff' }}
                      animate={{ opacity: 1, backgroundColor: 'transparent' }}
                      className="border-b border-slate-50/50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 font-bold text-slate-700">{row.id}</td>
                      <td className="py-4 text-slate-500 text-xs font-medium">{row.time}</td>
                      <td className="py-4 font-bold text-slate-700 flex items-center gap-2">
                        <ArrowRightLeft size={12} className="text-slate-300" /> {row.lat}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${row.style}`}>
                          {row.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Engineering Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">System Core Logs</h3>
            <button className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><MoreHorizontal size={16} /></button>
          </div>

          <div className="space-y-5">
            {[
              { name: 'Node Reconnected', action: 'Auto-recovery', time: 'Just now', icon: Wifi, bg: 'bg-emerald-100', text: 'text-emerald-600' },
              { name: 'Database Backup', action: 'Snapshot created', time: '10 Mins Ago', icon: Database, bg: 'bg-blue-100', text: 'text-blue-600' },
              { name: 'High CPU Load', action: 'Server Alpha', time: '1 Hour Ago', icon: Server, bg: 'bg-rose-100', text: 'text-rose-600' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.bg} ${log.text}`}>
                    <log.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">{log.name}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{log.action}</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}