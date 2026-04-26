import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Building2, Plus, Star, Truck, FileText, X } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  product_category?: string;
  last_price?: number;
  lead_time_days?: number;
  performance_score?: number;
  address?: string;
}

export default function SupplierHubPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', product_category: '', last_price: 0, lead_time_days: 3, performance_score: 5, address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [generatingPO, setGeneratingPO] = useState<string | null>(null);
  const [poResult, setPoResult] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'suppliers'), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[]);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!form.name) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'suppliers'), { ...form, createdAt: serverTimestamp() });
      await FirebaseLogger.logAgentAction('Admin', 'SUPPLIER_ADDED', `Supplier "${form.name}" ditambahkan`);
      setForm({ name: '', contact: '', product_category: '', last_price: 0, lead_time_days: 3, performance_score: 5, address: '' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleGeneratePO = async (supplier: Supplier) => {
    setGeneratingPO(supplier.id);
    try {
      const po = await NeuralCore.generateMarketingCampaign(
        `Draft Purchase Order untuk supplier ${supplier.name}`,
        `Kamu adalah AI Admin yang membuat surat Purchase Order profesional. Buat draft PO untuk supplier "${supplier.name}" kategori "${supplier.product_category || 'umum'}", harga beli terakhir Rp ${(supplier.last_price || 0).toLocaleString('id-ID')}, lead time ${supplier.lead_time_days || 3} hari. Format sebagai dokumen formal singkat.`
      );
      setPoResult(p => ({ ...p, [supplier.id]: po }));
      await FirebaseLogger.logAgentAction('Admin', 'PO_GENERATED', `PO draft dibuat untuk supplier ${supplier.name}`);
    } catch (e) { console.error(e); }
    finally { setGeneratingPO(null); }
  };

  const performanceColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-50';
    if (score >= 5) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supplier Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen vendor — informasi kontak, harga beli, dan performa pengiriman</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 shadow-md"
        >
          <Plus size={16} /> Tambah Supplier
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800">Supplier Baru</h3>
              <button onClick={() => setIsAdding(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'name', label: 'Nama Supplier', type: 'text', placeholder: 'PT Sumber Makmur' },
                { key: 'contact', label: 'Kontak (WA/Email)', type: 'text', placeholder: '0812xxxxxxxx' },
                { key: 'product_category', label: 'Kategori Produk', type: 'text', placeholder: 'Kulit & Aksesori' },
                { key: 'last_price', label: 'Harga Beli Terakhir (Rp)', type: 'number', placeholder: '0' },
                { key: 'lead_time_days', label: 'Lead Time (hari)', type: 'number', placeholder: '3' },
                { key: 'address', label: 'Alamat / Kota', type: 'text', placeholder: 'Bandung, Jawa Barat' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-slate-300"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Skor Performa (1-10)</label>
              <input type="range" min={1} max={10} value={form.performance_score}
                onChange={e => setForm(p => ({ ...p, performance_score: parseInt(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <span className="text-xs text-slate-600 font-bold">{form.performance_score}/10</span>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsAdding(false)} className="text-sm text-slate-400">Batal</button>
              <button onClick={handleAdd} disabled={isSaving}
                className="px-5 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Supplier'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplier Cards */}
      {suppliers.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-slate-400 text-sm">Belum ada supplier. Tambahkan vendor pertama Kak.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup, i) => (
            <motion.div key={sup.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Building2 size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{sup.name}</p>
                    {sup.contact && <p className="text-xs text-slate-400">{sup.contact}</p>}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black ${performanceColor(sup.performance_score || 5)}`}>
                  <Star size={10} /> {sup.performance_score || '–'}/10
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Kategori</p>
                  <p className="text-xs font-black text-slate-700 mt-0.5 truncate">{sup.product_category || '–'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Harga Beli</p>
                  <p className="text-xs font-black text-slate-700 mt-0.5">Rp {(sup.last_price || 0).toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-center gap-0.5"><Truck size={8} />Lead Time</p>
                  <p className="text-xs font-black text-slate-700 mt-0.5">{sup.lead_time_days || '–'} hari</p>
                </div>
              </div>

              {poResult[sup.id] ? (
                <div className="bg-slate-900 rounded-xl p-3 mb-3">
                  <p className="text-teal-400 text-[9px] font-bold uppercase mb-1">PO Draft — AI Generated</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-4">{poResult[sup.id]}</p>
                </div>
              ) : null}

              <button onClick={() => handleGeneratePO(sup)} disabled={generatingPO === sup.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
              >
                <FileText size={13} className={generatingPO === sup.id ? 'animate-spin' : ''} />
                {generatingPO === sup.id ? 'Membuat PO...' : poResult[sup.id] ? 'Generate Ulang PO' : 'Generate Purchase Order'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
