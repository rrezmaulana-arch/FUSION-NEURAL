import { motion } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { Banknote } from 'lucide-react';

export default function PayrollPage() {
  const { performers } = useSystemEngine();

  // Dummy salary base mapping
  const getSalary = (role: string) => {
    switch (role) {
      case 'Leader': return 8500;
      case 'Engineer': return 6200;
      case 'Financial': return 5800;
      default: return 4000;
    }
  };

  const calculateBonus = (score: number) => {
    return Math.floor((score / 5) * 1500);
  };

  return (
    <div className="space-y-6 pb-10 font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payroll Processing</h1>
        <p className="text-sm text-slate-500 mt-1">Automated salary distribution and performance bonuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-600 text-white rounded-[24px] p-6 shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-emerald-100 font-medium text-sm">Next Payout</span>
            <Banknote size={18} />
          </div>
          <h2 className="text-3xl font-bold mt-4 relative z-10">$24,500</h2>
          <p className="text-xs text-emerald-200 mt-2 relative z-10">In 3 days</p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg text-slate-800 mb-6">Employee Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-4 pl-2">Employee</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Base Salary</th>
                <th className="pb-4">Performance Bonus</th>
                <th className="pb-4 text-right pr-2">Total Net</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {performers.map((p) => {
                const base = getSalary(p.role);
                const bonus = calculateBonus(p.score);
                const total = base + bonus;
                
                return (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.color}`}>
                          {p.initial}
                        </div>
                        <span className="font-bold text-slate-700">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-500 font-medium">{p.role}</td>
                    <td className="py-4 font-bold text-slate-700">${base.toLocaleString()}</td>
                    <td className="py-4 font-bold text-emerald-500">+${bonus.toLocaleString()}</td>
                    <td className="py-4 text-right pr-2 font-bold text-slate-900">${total.toLocaleString()}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
