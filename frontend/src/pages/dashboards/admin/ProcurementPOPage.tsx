import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, FileText, CheckCircle2, Clock, AlertTriangle, Truck, X } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, where, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function ProcurementPOPage() {
  const [activeTab, setActiveTab] = useState<'po'|'qc'>('po');
  const [pos, setPos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [poForm, setPoForm] = useState({ supplier: '', items: '', total: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [qcItems, setQcItems] = useState<any[]>([]);
  const [receivingHistory, setReceivingHistory] = useState<any[]>([]);
  const [processingQc, setProcessingQc] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'procurement'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPos(data);
      // QC items: APPROVED POs waiting for inspection
      setQcItems(data.filter((d: any) => d.status === 'APPROVED' || d.status === 'PENDING_QC'));
      // History: received or rejected
      setReceivingHistory(data.filter((d: any) => d.status === 'RECEIVED' || d.status === 'REJECTED'));
    });
    return () => unsub();
  }, []);

  const handleReceive = async (po: any) => {
    if (!po.id) return;
    setProcessingQc(po.id);
    try {
      // Update PO status
      await updateDoc(doc(db, 'procurement', po.id), {
        status: 'RECEIVED',
        receivedAt: serverTimestamp(),
      });
      // Add stock to inventory — search by product name
      if (po.items) {
        const itemName = po.items.split(',')[0].trim();
        const invQ = query(collection(db, 'inventory'), where('name', '==', itemName));
        const invSnap = await getDocs(invQ);
        if (!invSnap.empty) {
          const invDoc = invSnap.docs[0];
          await updateDoc(doc(db, 'inventory', invDoc.id), {
            quantity: increment(Number(po.qty || po.total / 10000) || 10),
          });
        }
      }
    } catch (e) {
      console.error('Gagal menerima PO:', e);
    } finally {
      setProcessingQc(null);
    }
  };

  const handleReject = async (po: any) => {
    if (!po.id) return;
    setProcessingQc(po.id);
    try {
      await updateDoc(doc(db, 'procurement', po.id), {
        status: 'REJECTED',
        rejectedAt: serverTimestamp(),
        rejectReason: 'Cacat / tidak sesuai standar QC',
      });
    } catch (e) {
      console.error('Gagal menolak PO:', e);
    } finally {
      setProcessingQc(null);
    }
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier || !poForm.items || !poForm.total) return;
    setIsSaving(true);
    try {
      const poId = `PO-${new Date().getFullYear()}-${String(pos.length + 1).padStart(3, '0')}`;
      const totalAmount = Number(poForm.total);

      // 1. Create PO in procurement collection
      await addDoc(collection(db, 'procurement'), {
        po_id: poId,
        supplier: poForm.supplier,
        items: poForm.items,
        total: totalAmount,
        notes: poForm.notes,
        status: 'PENDING_FINANCE_APPROVAL',
        timestamp: serverTimestamp(),
      });

      // 2. Create approval request for Finance
      await addDoc(collection(db, 'pending_approvals'), {
        actionType: 'Approve Purchase Order',
        description: `PO ${poId}: ${poForm.items} dari ${poForm.supplier} — Rp ${totalAmount.toLocaleString('id-ID')}`,
        role: 'finance',
        status: 'Pending',
        poId,
        estimatedCost: totalAmount,
        timestamp: new Date().toISOString()
      });

      setPoForm({ supplier: '', items: '', total: '', notes: '' });
      setShowForm(false);
    } catch (e) {
      console.error('Gagal membuat PO:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Procurement & QC"
        subtitle="Manajemen Purchase Order (PO) ke supplier dan Quality Control penerimaan barang."
        accent="slate"
        actions={
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
            <Plus size={14} /> Buat PO Baru
          </button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm">Buat Purchase Order Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Supplier</label>
                  <input value={poForm.supplier} onChange={e => setPoForm(f => ({ ...f, supplier: e.target.value }))}
                    placeholder="Nama supplier..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Total Nilai (Rp)</label>
                  <input type="number" value={poForm.total} onChange={e => setPoForm(f => ({ ...f, total: e.target.value }))}
                    placeholder="0" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Item / Deskripsi</label>
                <input value={poForm.items} onChange={e => setPoForm(f => ({ ...f, items: e.target.value }))}
                  placeholder="Contoh: 200 unit kaos polos, 100 unit totebag..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Catatan (Opsional)</label>
                <input value={poForm.notes} onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Catatan tambahan..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button onClick={handleCreatePO} disabled={isSaving || !poForm.supplier || !poForm.items || !poForm.total}
                  className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {isSaving ? 'Menyimpan...' : 'Simpan PO'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab('po')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'po' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Purchase Orders</button>
        <button onClick={() => setActiveTab('qc')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'qc' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Quality Control (Receiving)</button>
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  po.status === 'APPROVED' ? 'bg-purple-50 text-purple-600' :
                  po.status === 'RECEIVED' ? 'bg-blue-50 text-blue-600' :
                  po.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                  po.status === 'PENDING_FINANCE_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-50 text-slate-600'
                }`}>
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
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                    po.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' :
                    po.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' :
                    po.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                    po.status === 'PENDING_FINANCE_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{po.status === 'PENDING_FINANCE_APPROVAL' ? 'Menunggu Finance' : po.status}</span>
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
              {qcItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Tidak ada PO menunggu QC.</div>
              ) : qcItems.map((po, i) => (
                <div key={po.id || i} className="p-4 border border-slate-100 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{po.po_id || po.id} — {po.supplier}</h4>
                      <p className="text-xs text-slate-500">{po.items}</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">{po.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReceive(po)} disabled={processingQc === po.id}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                      {processingQc === po.id ? 'Memproses...' : 'Terima & Masuk Inventory'}
                    </button>
                    <button onClick={() => handleReject(po)} disabled={processingQc === po.id}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors border border-rose-200 disabled:opacity-50">
                      Tolak (Cacat)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-purple-500"/> Riwayat Receiving</h3>
            <div className="space-y-3">
              {receivingHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Belum ada riwayat receiving.</div>
              ) : receivingHistory.map((po, i) => (
                <div key={po.id || i} className="flex gap-3 items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="mt-0.5">
                    {po.status === 'RECEIVED' ? <CheckCircle2 size={14} className="text-purple-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{po.po_id || po.id} <span className="font-normal text-slate-400">({po.supplier})</span></p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{po.items} — {po.status === 'RECEIVED' ? 'Diterima' : 'Ditolak: ' + (po.rejectReason || 'Cacat')}</p>
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

