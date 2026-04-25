import { motion, AnimatePresence } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { Users, TrendingUp, Sparkles, Mail, Phone, ChevronRight } from 'lucide-react';

export default function LeadsPage() {
  const { conversions } = useSystemEngine();

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Leads & Conversions</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time pipeline monitoring and lead generation from campaigns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white rounded-[24px] p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-purple-200 font-medium text-sm">Total Leads Generated</span>
            <Users size={18} />
          </div>
          <h2 className="text-4xl font-bold mt-4">{conversions.length * 142}</h2>
          <p className="text-xs text-purple-200 mt-2">Across all active campaigns</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-sm">Conversion Rate</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <h2 className="text-4xl font-bold text-slate-800">4.8%</h2>
          <p className="text-xs text-emerald-500 font-bold mt-2">+1.2% from last week</p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800">Recent Conversions</h3>
          <button className="text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-lg transition-colors">Export CSV</button>
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {conversions.map((row, i) => (
              <motion.div 
                key={row.id + i} 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center shadow-sm">
                    {/* Render icon dynamically if passed as string/component, fallback to Sparkles */}
                    {row.icon ? <row.icon size={20} /> : <Sparkles size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{row.title}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{row.desc}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{row.val}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Acquired</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-blue-500 flex items-center justify-center shadow-sm transition-colors"><Mail size={14} /></button>
                    <button className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-emerald-500 flex items-center justify-center shadow-sm transition-colors"><Phone size={14} /></button>
                    <button className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-800 flex items-center justify-center shadow-sm transition-colors"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {conversions.length === 0 && (
             <div className="py-10 text-center text-slate-500 text-sm">No conversions recorded yet. Make sure campaign is active.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
