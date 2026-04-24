import { BrainCircuit, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Director Overview</h2>
        <p className="text-sm text-slate-500">Apex decision-making data across all AI agents and business ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Team Members</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">48</div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Active Directives</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><BrainCircuit className="w-5 h-5 text-purple-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">14</div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Ecosystem Health</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><Activity className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">98%</div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
      >
        <h3 className="font-bold text-slate-800 mb-4">Strategic Alerts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="font-medium text-slate-700">Performance Review Needed</div>
                  <div className="text-xs text-slate-400">Marketing Agent ROI Threshold</div>
                </div>
              </div>
              <button className="text-sm font-medium text-orange-600 hover:text-orange-700">Review</button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
