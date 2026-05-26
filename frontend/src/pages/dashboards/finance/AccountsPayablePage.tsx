import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Clock, AlertCircle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function AccountsPayablePage() {
  const [activeTab, setActiveTab] = useState<'ap' | 'ar'>('ap');
  const [apList, setApList] = useState<any[]>([]);
  const [arList, setArList] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'accounts_payable'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setApList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qAR = query(collection(db, 'accounts_receivable'), orderBy('timestamp', 'desc'), limit(50));
    const unsubAR = onSnapshot(qAR, (snap) => {
      setArList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub();
      unsubAR();
    };
  }, []);

  const markPaid = async (id: string, isAR = false) => {
    try {
      if (isAR) {
        await updateDoc(doc(db, 'accounts_receivable', id), { status: 'SETTLED' });
      } else {
        await updateDoc(doc(db, 'accounts_payable', id), { status: 'PAID' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Invoicing & AP/AR"
        subtitle="Kelola tagihan supplier (Hutang/AP) dan pencairan dana marketplace (Piutang/AR)."
        accent="emerald"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
            <Receipt size={14} /> Buat Invoice Baru
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts Payable', val: `Rp ${(apList.filter(a => a.status === 'UNPAID').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: ArrowUpRight, color: 'rose' },
          { label: 'Total Accounts Receivable', val: `Rp ${(arList.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: ArrowDownRight, color: 'emerald' },
          { label: 'AP Jatuh Tempo (<7 Hari)', val: `Rp ${(apList.filter(a => a.status === 'UNPAID').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: AlertCircle, color: 'amber' },
          { label: 'AR Menunggu Cair', val: `Rp ${(arList.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: Clock, color: 'blue' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg bg-${s.color}-50 flex items-center justify-center mb-3`}>
              <s.icon size={16} className={`text-${s.color}-500`} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-black text-slate-800">{s.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex items-center gap-2">
          <button onClick={() => setActiveTab('ap')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'ap' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Accounts Payable (Hutang Supplier)</button>
          <button onClick={() => setActiveTab('ar')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'ar' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Accounts Receivable (Piutang Marketplace)</button>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">{activeTab === 'ap' ? 'Supplier / Vendor' : 'Sumber (Marketplace/B2B)'}</th>
                <th className="p-4 font-medium">Jatuh Tempo</th>
                <th className="p-4 font-medium">Jumlah (Rp)</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activeTab === 'ap' ? (
                apList.length > 0 ? apList.map((inv, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><FileSpreadsheet size={14} className="text-slate-400" /> {inv.invoice_id || inv.id}</td>
                    <td className="p-4 text-slate-600">{inv.entity}</td>
                    <td className="p-4 text-slate-500 text-xs">{inv.due || inv.dueDate}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">Rp {(inv.amount || 0).toLocaleString('id-ID')}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-[10px] font-bold rounded ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span></td>
                    <td className="p-4">
                      {inv.status === 'UNPAID' && <button onClick={() => markPaid(inv.id)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline">Tandai Dibayar</button>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada AP (Hutang).</td></tr>
                )
              ) : (
                arList.length > 0 ? arList.map((inv, i) => {
                  const color = inv.status === 'SETTLED' ? 'emerald' : 'blue';
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><FileSpreadsheet size={14} className="text-slate-400" /> {inv.id}</td>
                      <td className="p-4 text-slate-600">{inv.entity}</td>
                      <td className="p-4 text-slate-500 text-xs">{inv.due || inv.dueDate}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">Rp {(inv.amount || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4"><span className={`px-2 py-1 bg-${color}-100 text-${color}-700 text-[10px] font-bold rounded`}>{inv.status}</span></td>
                      <td className="p-4">
                        {inv.status === 'PENDING' && <button onClick={() => markPaid(inv.id, true)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline">Konfirmasi Masuk Bank</button>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada AR (Piutang).</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
