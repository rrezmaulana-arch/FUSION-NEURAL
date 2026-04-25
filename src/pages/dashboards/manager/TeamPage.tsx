import { motion, AnimatePresence } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';

export default function TeamPage() {
  const { performers, pingPerformer } = useSystemEngine();

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Team Performance</h1>
        <p className="text-sm text-slate-500 mt-1">Manage team members, status, and coordinate tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {performers.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${p.color}`}>
                  {p.initial}
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${p.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : p.status === 'Busy' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Online' ? 'bg-emerald-500 animate-pulse' : p.status === 'Busy' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    {p.status}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">{p.role}</p>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><CheckCircle2 size={14} /> Task Completion</span>
                    <span className="font-bold text-slate-700">{p.score * 20}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${p.score * 20}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => pingPerformer(p.id)}
                  className="flex-1 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-sm py-3 rounded-xl transition-colors"
                >
                  Ping User
                </button>
                <button className="w-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors">
                  <Clock size={16} />
                </button>
                <button className="w-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors">
                  <MapPin size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
