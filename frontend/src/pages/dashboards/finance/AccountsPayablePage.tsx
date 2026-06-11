import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Clock, AlertCircle, X } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function AccountsPayablePage() {
  const [activeTab, setActiveTab] = useState<'ap' | 'ar'>('ap');
  const [apList, setApList] = useState<any[]>([]);
  const [arList, setArList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [invType, setInvType] = useState<'ap' | 'ar'>('ap');
  const [invForm, setInvForm] = useState({ entity: '', amount: '', dueDate: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreateInvoice = async () => {
    if (!invForm.entity || !invForm.amount || !invForm.dueDate) return;
    setIsSaving(true);
    try {
      const collection_name = invType === 'ap' ? 'accounts_payable' : 'accounts_receivable';
      const prefix = invType === 'ap' ? 'INV-AP' : 'INV-AR';
      const invoiceId = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      await addDoc(collection(db, collection_name), {
        invoice_id: invoiceId,
        entity: invForm.entity,
        amount: Number(invForm.amount),
        due: invForm.dueDate,
        dueDate: invForm.dueDate,
        notes: invForm.notes,
        status: invType === 'ap' ? 'UNPAID' : 'PENDING',
        timestamp: serverTimestamp(),
      });
      setInvForm({ entity: '', amount: '', dueDate: '', notes: '' });
      setShowForm(false);
    } catch (e) {
      console.error('Gagal membuat invoice:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Invoicing & AP/AR"
        subtitle="Kelola tagihan supplier (Hutang/AP) dan pencairan dana marketplace (Piutang/AR)."
        accent="emerald"
        actions={
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
            <Receipt size={14} /> Buat Invoice Baru
          </button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm">Buat Invoice Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 mb-2">
                <button onClick={() => setInvType('ap')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${invType === 'ap' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Hutang (AP)</button>
                <button onClick={() => setInvType('ar')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${invType === 'ar' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Piutang (AR)</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{invType === 'ap' ? 'Supplier / Vendor' : 'Sumber (Marketplace/B2B)'}</label>
                  <input value={invForm.entity} onChange={e => setInvForm(f => ({ ...f, entity: e.target.value }))}
                    placeholder={invType === 'ap' ? 'Nama supplier...' : 'Nama marketplace...'} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Jumlah (Rp)</label>
                  <input type="number" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Jatuh Tempo</label>
                  <input type="date" value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Catatan (Opsional)</label>
                  <input value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Catatan tambahan..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button onClick={handleCreateInvoice} disabled={isSaving || !invForm.entity || !invForm.amount || !invForm.dueDate}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {isSaving ? 'Menyimpan...' : 'Simpan Invoice'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts Payable', val: `Rp ${(apList.filter(a => a.status === 'UNPAID').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: ArrowUpRight, iconBg: 'bg-rose-50', iconText: 'text-rose-500' },
          { label: 'Total Accounts Receivable', val: `Rp ${(arList.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: ArrowDownRight, iconBg: 'bg-emerald-50', iconText: 'text-emerald-500' },
          { label: 'AP Jatuh Tempo (<7 Hari)', val: `Rp ${(apList.filter(a => a.status === 'UNPAID').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: AlertCircle, iconBg: 'bg-amber-50', iconText: 'text-amber-500' },
          { label: 'AR Menunggu Cair', val: `Rp ${(arList.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + (a.amount || 0), 0) / 1000000).toFixed(1)}M`, icon: Clock, iconBg: 'bg-blue-50', iconText: 'text-blue-500' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon size={16} className={s.iconText} />
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
                  const badgeClass = inv.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><FileSpreadsheet size={14} className="text-slate-400" /> {inv.id}</td>
                      <td className="p-4 text-slate-600">{inv.entity}</td>
                      <td className="p-4 text-slate-500 text-xs">{inv.due || inv.dueDate}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">Rp {(inv.amount || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4"><span className={`px-2 py-1 ${badgeClass} text-[10px] font-bold rounded`}>{inv.status}</span></td>
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
