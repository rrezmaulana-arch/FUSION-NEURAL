import { motion } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { Download, Printer, PieChart, Activity } from 'lucide-react';

export default function ReportsPage() {
  const { systemRequests, budgetUsed, revenue, expenses, activeNodes } = useSystemEngine();

  const metrics = [
    { label: 'System API Requests', value: systemRequests.toLocaleString(), icon: Activity, color: 'text-blue-500' },
    { label: 'Marketing Ad Spend', value: `$${budgetUsed.toLocaleString()}`, icon: PieChart, color: 'text-purple-500' },
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: Activity, color: 'text-emerald-500' },
    { label: 'Operating Expenses', value: `$${expenses.toLocaleString()}`, icon: PieChart, color: 'text-rose-500' },
    { label: 'Infrastructure Nodes', value: activeNodes.toLocaleString(), icon: Activity, color: 'text-slate-700' },
  ];

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Exportable global metrics aggregated from all divisions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <Printer size={16} /> Print
          </button>
          <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Executive Summary</h2>
            <p className="text-sm text-slate-500 mt-1">Generated dynamically from live FUSION Neural Engine</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400">Date Generated</p>
            <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 bg-white rounded-lg shadow-sm ${m.color}`}>
                  <m.icon size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</h4>
              </div>
              <p className="text-3xl font-bold text-slate-800">{m.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-teal-50 rounded-2xl p-6 border border-teal-100">
          <h4 className="font-bold text-teal-800 mb-2">Automated AI Insight</h4>
          <p className="text-sm text-teal-700 leading-relaxed">
            Based on current live data, the marketing ad spend is converting effectively, but driving server loads near peak capacity. 
            Consider increasing the operating budget for server scaling or reducing campaign aggression to maintain 99.9% uptime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
