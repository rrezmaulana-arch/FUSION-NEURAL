import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, FileText, CheckCircle2, Clock, AlertTriangle, Truck } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function ProcurementPOPage() {
  const [activeTab, setActiveTab] = useState<'po'|'qc'>('po');
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'procurement'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPos(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Procurement & QC" 
        subtitle="Manajemen Purchase Order (PO) ke supplier dan Quality Control penerimaan barang."
        accent="slate"
        actions={
          <button onClick={() => alert('Fitur Buat PO Baru akan segera tersedia. Saat ini PO dibuat otomatis oleh Neural Admin melalui task restock.')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
            <Plus size={14} /> Buat PO Baru
          </button>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab('po')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'po' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Purchase Orders</button>
        <button onClick={() => setActiveTab('qc')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'qc' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Quality Control (Receiving)</button>
      </div>

      {activeTab === 'po' && (
        <div className="space-y-4">
          {pos.length === 0 ? (
            <div className="p-10 text-center text-slate-400">Belum ada Purchase Order (Mulai simulator untuk auto-generate).</div>
          ) : pos.map((po, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${po.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{po.po_id}</h3>
                  <p className="text-xs text-slate-500">{po.supplier} • {po.items}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Nilai</p>
                  <p className="text-sm font-black text-slate-700">Rp {po.total.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-md ${po.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{po.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'qc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Truck size={18} className="text-amber-500"/> Menunggu Inspeksi QC</h3>
            <div className="space-y-4">
              <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">PO-2026-081 (PT Tiga Sekawan)</h4>
                    <p className="text-xs text-slate-500">Tiba: Hari ini, 08:30 WIB</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">INCOMING</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => alert('Barang diterima dan masuk ke Inventory. Stok otomatis bertambah.')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">Terima & Masuk Inventory</button>
                  <button onClick={() => alert('PO ditolak karena cacat. Supplier akan dinotifikasi untuk retur.')}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors border border-rose-200">Tolak (Cacat)</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Riwayat Receiving</h3>
            <div className="space-y-3">
              {[
                { id: 'PO-2026-079', note: '200 unit diterima lengkap, 0 cacat.', date: 'Kemarin' },
                { id: 'PO-2026-075', note: '150 unit diterima, 5 unit diretur karena robek.', date: '14 Mei 2026' }
              ].map((h, i) => (
                <div key={i} className="flex gap-3 items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="mt-0.5"><CheckCircle2 size={14} className="text-emerald-500" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{h.id} <span className="font-normal text-slate-400">({h.date})</span></p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{h.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
