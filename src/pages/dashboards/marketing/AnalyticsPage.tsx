import { motion } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { Target, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { campaignActive, budgetUsed } = useSystemEngine();

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Campaign Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep dive into marketing performance and ROI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Traffic Source</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-purple-500" /> Organic</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-fuchsia-400" /> Paid</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-slate-100 relative">
            {/* Y-Axis lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full border-b border-slate-50 flex items-end h-full pb-1">
                  <span className="text-[10px] text-slate-300 font-bold">{100 - i*25}%</span>
                </div>
              ))}
            </div>

            {/* Bars */}
            {[40, 65, 45, 80, 55, 90, 75].map((val, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2 w-full h-full justify-end group">
                <div className="w-4 md:w-8 bg-slate-100 rounded-t-lg h-full relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} 
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`absolute bottom-0 left-0 right-0 ${i % 2 === 0 ? 'bg-purple-500' : 'bg-fuchsia-400'} rounded-t-lg`} 
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-800">D{i+1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Side Stats */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 text-white rounded-[32px] p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-300">ROI Tracker</h3>
              <Target size={18} className="text-emerald-400" />
            </div>
            <h2 className="text-4xl font-bold text-emerald-400">+342%</h2>
            <p className="text-sm text-slate-400 mt-2">Return on ad spend (ROAS) is highly positive.</p>
            
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400">Budget Consumed</span>
                <span className="font-bold">${budgetUsed.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div className="bg-fuchsia-500 h-1.5 rounded-full" style={{ width: `${(budgetUsed/5000)*100}%` }} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${campaignActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Engine Status</p>
              <p className={`text-xs font-bold ${campaignActive ? 'text-emerald-500' : 'text-slate-500'}`}>{campaignActive ? 'Optimizing Live' : 'Paused'}</p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
