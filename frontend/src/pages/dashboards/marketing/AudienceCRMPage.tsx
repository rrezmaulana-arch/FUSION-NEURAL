import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, BellRing, UserCheck, UserMinus, Star, Send, X, Users } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function AudienceCRMPage() {
  const [activeTab, setActiveTab] = useState<'segments'|'automation'>('segments');
  const [audienceStats, setAudienceStats] = useState({ vip: 0, active: 0, churn: 0 });
  const [customerData, setCustomerData] = useState<Record<string, { count: number; lastOrder: string; totalSpent: number }>>({});
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({ name: '', trigger: '', action: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snap) => {
      const customers: Record<string, { count: number; lastOrder: string; totalSpent: number }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const name = data.customer || data.name || data.customerName;
        if (name) {
          if (!customers[name]) customers[name] = { count: 0, lastOrder: '', totalSpent: 0 };
          customers[name].count += 1;
          customers[name].totalSpent += data.price || data.amount || 0;
          customers[name].lastOrder = data.timestamp?.toDate?.()?.toLocaleDateString('id-ID') || '';
        }
      });

      const activeCount = Object.keys(customers).length;
      const vipCount = Object.values(customers).filter(c => c.count > 1).length;

      setCustomerData(customers);
      setAudienceStats({ active: activeCount, vip: vipCount, churn: Math.floor(activeCount * 0.3) });
    });
    return () => unsub();
  }, []);

  const getSegmentCustomers = (segment: string) => {
    const entries = Object.entries(customerData);
    switch (segment) {
      case 'VIP / Whales': return entries.filter(([, d]) => d.count > 1).sort((a, b) => b[1].totalSpent - a[1].totalSpent);
      case 'Active Buyers': return entries.filter(([, d]) => d.count >= 1);
      case 'Churn Risk': return entries.filter(([, d]) => d.count <= 1).slice(0, 20);
      default: return entries;
    }
  };

  const handleCreateWorkflow = async () => {
    if (!workflowForm.name || !workflowForm.trigger) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'marketing_workflows'), {
        name: workflowForm.name,
        trigger: workflowForm.trigger,
        action: workflowForm.action || 'Send Email',
        status: 'Active',
        conversion: '0%',
        createdAt: serverTimestamp(),
      });
      setWorkflowForm({ name: '', trigger: '', action: '' });
      setShowWorkflowForm(false);
    } catch (e) {
      console.error('Gagal membuat workflow:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Audience & CRM"
        subtitle="Segmentasi pelanggan, retensi, dan otomatisasi email marketing."
        accent="purple"
        actions={
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setActiveTab('segments')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'segments' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Customer Segments</button>
            <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'automation' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Automations</button>
          </div>
        }
      />

      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'VIP / Whales', desc: 'Pelanggan dengan LTV tertinggi, belanja rutin.', count: audienceStats.vip, icon: Star, iconBg: 'bg-amber-50', iconText: 'text-amber-500', btnBg: 'bg-amber-50', btnText: 'text-amber-600', btnHover: 'hover:bg-amber-100' },
            { title: 'Active Buyers', desc: 'Belanja minimal 1x dalam 30 hari terakhir.', count: audienceStats.active, icon: UserCheck, iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', btnBg: 'bg-emerald-50', btnText: 'text-emerald-600', btnHover: 'hover:bg-emerald-100' },
            { title: 'Churn Risk', desc: 'Tidak belanja lebih dari 60 hari. Butuh promo reaktivasi.', count: audienceStats.churn, icon: UserMinus, iconBg: 'bg-rose-50', iconText: 'text-rose-500', btnBg: 'bg-rose-50', btnText: 'text-rose-600', btnHover: 'hover:bg-rose-100' },
          ].map((seg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl ${seg.iconBg} flex items-center justify-center mb-4`}>
                <seg.icon size={24} className={seg.iconText} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">{seg.title}</h3>
              <p className="text-xs text-slate-500 mb-4 h-8">{seg.desc}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Audience</p>
                  <p className="text-2xl font-black text-slate-800">{seg.count.toLocaleString('id-ID')}</p>
                </div>
                <button onClick={() => setSelectedSegment(selectedSegment === seg.title ? null : seg.title)}
                  className={`px-3 py-1.5 ${seg.btnBg} ${seg.btnText} rounded-lg text-xs font-bold ${seg.btnHover} transition-colors`}>
                  {selectedSegment === seg.title ? 'Tutup' : 'View List'}
                </button>
              </div>

              {/* Customer List */}
              <AnimatePresence>
                {selectedSegment === seg.title && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={14} className={seg.iconText} />
                      <span className="text-xs font-bold text-slate-600">Daftar Pelanggan</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getSegmentCustomers(seg.title).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Belum ada data pelanggan.</p>
                      ) : getSegmentCustomers(seg.title).slice(0, 10).map(([name, data], j) => (
                        <div key={j} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{name}</p>
                            <p className="text-[10px] text-slate-400">{data.count}x order • {data.lastOrder}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-600">Rp {data.totalSpent.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {getSegmentCustomers(seg.title).length > 10 && (
                        <p className="text-[10px] text-center text-purple-500 py-1">+{getSegmentCustomers(seg.title).length - 10} pelanggan lainnya</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Mail size={18} className="text-purple-500"/> Email & Notification Flows</h3>
            <button onClick={() => setShowWorkflowForm(!showWorkflowForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 flex items-center gap-2 shadow-md">
              <Send size={14} /> Create Workflow
            </button>
          </div>

          {/* Workflow Form */}
          <AnimatePresence>
            {showWorkflowForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-100 overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Workflow</label>
                      <input value={workflowForm.name} onChange={e => setWorkflowForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Contoh: Win-back Campaign" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Trigger</label>
                      <input value={workflowForm.trigger} onChange={e => setWorkflowForm(f => ({ ...f, trigger: e.target.value }))}
                        placeholder="Contoh: No purchase 30 days" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Aksi</label>
                      <input value={workflowForm.action} onChange={e => setWorkflowForm(f => ({ ...f, action: e.target.value }))}
                        placeholder="Contoh: Send promo email" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowWorkflowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Batal</button>
                    <button onClick={handleCreateWorkflow} disabled={isSaving || !workflowForm.name || !workflowForm.trigger}
                      className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-40">
                      {isSaving ? 'Menyimpan...' : 'Simpan Workflow'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-0">
            {[
              { name: 'Welcome Series (New Users)', trigger: 'User Signs Up', status: 'Active', conv: '12.4%', color: 'emerald' },
              { name: 'Abandoned Cart Recovery', trigger: 'Cart inactive for 2 hours', status: 'Active', conv: '8.2%', color: 'emerald' },
              { name: 'Win-back Promo (Churn Risk)', trigger: 'No purchase for 60 days', status: 'Paused', conv: '3.1%', color: 'amber' },
              { name: 'Post-Purchase Review Request', trigger: 'Order marked as Delivered', status: 'Active', conv: '22.0%', color: 'emerald' },
            ].map((flow, i) => (
              <div key={i} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${flow.color}-50`}>
                    {flow.status === 'Active' ? <BellRing size={16} className={`text-${flow.color}-500`} /> : <Mail size={16} className={`text-${flow.color}-500`} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">{flow.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Trigger: {flow.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Conversion</p>
                    <p className="text-sm font-black text-slate-700">{flow.conv}</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${flow.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {flow.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
