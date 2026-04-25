import { motion } from 'framer-motion';
import { Download, TrendingUp } from 'lucide-react';
import { useSystemEngine } from '../../../context/SystemEngineContext';

export default function TaxPage() {
  const { expenses } = useSystemEngine();

  // Dummy tax calculation based on dynamic expenses
  const estimatedTax = expenses * 0.15; // 15% flat tax estimation for demo

  const invoices = [
    { id: 'INV-2024-001', client: 'AlphaCorp', amount: 12500, status: 'Paid', date: 'Oct 12, 2024' },
    { id: 'INV-2024-002', client: 'Omega Solutions', amount: 8400, status: 'Pending', date: 'Oct 15, 2024' },
    { id: 'INV-2024-003', client: 'Zeta Labs', amount: 3200, status: 'Overdue', date: 'Sep 28, 2024' },
  ];

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tax & Invoices</h1>
        <p className="text-sm text-slate-500 mt-1">Manage corporate tax obligations and client billing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-sm">Estimated Q4 Tax Liability</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-rose-500" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <p className="text-xs text-slate-400 mt-1">Based on current tracked expenses (15% rate)</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800">Recent Invoices</h3>
          <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors">Create New</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-4 pl-2">Invoice ID</th>
                <th className="pb-4">Client</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {invoices.map((inv) => (
                <motion.tr 
                  key={inv.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 pl-2 font-bold text-slate-700">{inv.id}</td>
                  <td className="py-4 text-slate-600 font-medium">{inv.client}</td>
                  <td className="py-4 text-slate-500">{inv.date}</td>
                  <td className="py-4 font-bold text-slate-700">${inv.amount.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                      inv.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50">
                      <Download size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
