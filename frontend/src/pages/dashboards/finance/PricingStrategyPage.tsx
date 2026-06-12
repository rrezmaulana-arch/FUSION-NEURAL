/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Tags, Percent, Save, DollarSign } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';

export default function PricingStrategyPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, discount: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      price: product.price || 150000,
      discount: product.discount || 0
    });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'inventory', id), {
        price: editForm.price,
        discount: editForm.discount
      });
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Pricing & Discount Strategy"
        subtitle="Atur harga jual, harga modal, dan diskon promosi (Terhubung dengan Simulator)"
        accent="purple"
        icon={<Tags size={22} className="text-white" />}
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <DollarSign size={16} className="text-purple-500" /> Katalog Harga
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Produk / SKU</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Harga Jual (Rp)</th>
                <th className="p-4">Diskon (%)</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isEditing = editingId === p.id;
                const price = p.price || 150000;
                const discount = p.discount || 0;
                
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-slate-800">{p.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku || p.id.slice(0,6)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-mono font-bold ${p.quantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'}`}>
                        {p.quantity ?? p.qty ?? 0}
                      </span>
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.price}
                          onChange={e => setEditForm({...editForm, price: parseInt(e.target.value) || 0})}
                          className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 ring-purple-400 outline-none"
                        />
                      ) : (
                        <span className="text-sm font-black text-slate-700">Rp {price.toLocaleString('id-ID')}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.discount}
                          onChange={e => setEditForm({...editForm, discount: parseInt(e.target.value) || 0})}
                          className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 ring-purple-400 outline-none"
                        />
                      ) : (
                        <span className="text-sm font-bold text-rose-500 flex items-center gap-1">
                          <Percent size={12} /> {discount}%
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 bg-slate-100 rounded-lg">Batal</button>
                          <button disabled={saving} onClick={() => handleSave(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-500 hover:bg-purple-600 rounded-lg shadow-md shadow-purple-500/20">
                            {saving ? 'Loading...' : <><Save size={12}/> Simpan</>}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(p)} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                          Ubah Harga
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm">Belum ada produk di database.</div>
          )}
        </div>
      </div>
    </div>
  );
}

