/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, getDocs, getDoc, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import {
  Package, Plus, AlertTriangle, CheckCircle2, X, Tag, Warehouse,
  ImageIcon, Terminal, Send, Bot, Loader2, ChevronDown, ChevronUp, Edit2, Trash2, Sparkles
} from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { triggerSimulator } from '../../../services/apiClient';
import PageHeader from '../../../components/ui/PageHeader';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity?: number;
  qty?: number; // fallback field dari seed data lama
  min_stock: number;
  max_stock: number;
  warehouse?: string;
  photo_url?: string;
  image?: string; // fallback field dari seed data lama
  price?: number;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const statusConfig = (qty: number, min: number) => {
  if (qty <= 0) return { label: 'Habis', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', bar: 'bg-rose-500' };
  if (qty <= min) return { label: 'Kritis', color: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500 animate-pulse', bar: 'bg-rose-400' };
  if (qty <= min * 2) return { label: 'Menipis', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse', bar: 'bg-amber-400' };
  return { label: 'Aman', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' };
};

// Helper: ambil jumlah stok dari field quantity atau qty (seed data lama)
const getQty = (p: Product) => p.quantity ?? p.qty ?? 0;
// Helper: ambil foto dari photo_url atau image (seed data lama)
const getPhoto = (p: Product) => p.photo_url || p.image || '';

export default function InventoryTrackerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', quantity: 0, min_stock: 5, max_stock: 100, warehouse: 'Gudang Utama', photo_url: '' });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  // AI Command Terminal
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: 'AI Admin Terminal aktif. Saya siap menerima perintah. Contoh:\n- "Tampilkan semua produk kritis"\n- "Berikan saran restok untuk produk menipis"\n- "Buat laporan stok hari ini"\n- "Cek produk apa yang perlu di-reorder segera"',
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(collection(db, 'inventory')).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data as any[]);
    });

    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data as any[]);
    });

    return () => unsubscribe();
  }, []);

  // Simulator Autopilot Triggers — langsung ke Python backend
  useEffect(() => {
    const timer1 = setTimeout(() => {
      triggerSimulator({ action: 'trigger', orders: 20 })
        .catch(e => console.error('Simulator API error:', e));
    }, 1_200_000); // 20 menit

    const timer2 = setTimeout(() => {
      triggerSimulator({ action: 'trigger', orders: 20 })
        .catch(e => console.error('Simulator API error:', e));
    }, 3_600_000); // 1 jam

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // AI Pop-up Restock Alert
  const hasTriggeredAlert = useRef(false);
  useEffect(() => {
    if (!products.length || hasTriggeredAlert.current) return;
    
    const outOfStock = products.filter(p => getQty(p) <= 0);
    if (outOfStock.length > 0) {
      hasTriggeredAlert.current = true;
      setIsChatOpen(true);
      
      const itemsStr = outOfStock.map(p => p.name).join(', ');
      
      const aiAlertMsg: ChatMessage = {
        role: 'ai',
        content: `🚨 ALERT: Stok habis terdeteksi!\n\nBarang berikut stoknya 0: ${itemsStr}.\n\nApakah Kakak ingin saya melakukan restock sekarang otomatis menggunakan budget Finance? (Jawab: "Ya, restock produk [nama produk] sebanyak [jumlah]")`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiAlertMsg]);
    }
  }, [products]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle file upload → base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', 'Ukuran foto maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setForm(p => ({ ...p, photo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku) return;
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'inventory', isEditing), { ...form, qty: form.quantity });
      } else {
        await addDoc(collection(db, 'inventory'), form);
      }
      setForm({ name: '', sku: '', category: '', quantity: 0, min_stock: 5, max_stock: 100, warehouse: 'Gudang Utama', photo_url: '' });
      setPhotoPreview('');
      setIsAdding(false);
      setIsEditing(null);
    } catch (e) { console.error('[Inventory] handleSave error:', e); }
    finally { setIsSaving(false); }
  };

  const handleEditClick = (p: Product) => {
    setForm({
      name: p.name || '', sku: p.sku || '', category: p.category || '',
      quantity: getQty(p), min_stock: p.min_stock || 5, max_stock: p.max_stock || 100,
      warehouse: p.warehouse || 'Gudang Utama', photo_url: getPhoto(p)
    });
    setPhotoPreview(getPhoto(p));
    setIsEditing(p.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus produk ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (e) { console.error('[Inventory] handleDelete error:', e); }
  };

  // ── Shared AI command executor (used by handleSendCommand + chip buttons) ──
  const sendAICommand = async (cmd: string) => {
    const userMsg: ChatMessage = { role: 'user', content: cmd, timestamp: new Date() };
    setChatMessages(p => [...p, userMsg]);
    setIsProcessing(true);

    try {
      const inventorySummary = products.length > 0
        ? products.map(p => {
            const q = getQty(p);
            return `- ${p.name} (${p.sku}): stok ${q}/${p.max_stock || 100} [min:${p.min_stock || 5}] — ${statusConfig(q, p.min_stock || 5).label}`;
          }).join('\n')
        : 'Inventory masih kosong.';

      const stats = {
        total: products.length,
        kritis: products.filter(p => getQty(p) <= (p.min_stock || 5)).length,
        menipis: products.filter(p => getQty(p) > (p.min_stock || 5) && getQty(p) <= (p.min_stock || 5) * 2).length,
        aman: products.filter(p => getQty(p) > (p.min_stock || 5) * 2).length,
      };

      const context = `Kamu adalah AI Admin Terminal dari FusionNeural — asisten logistik presisi yang berbicara ringkas dan tegas dalam Bahasa Indonesia.

DATA INVENTORY SAAT INI (${new Date().toLocaleString('id-ID')}):
${inventorySummary}

RINGKASAN STOK:
- Total SKU: ${stats.total}
- Stok Aman: ${stats.aman}
- Menipis: ${stats.menipis}  
- Kritis/Habis: ${stats.kritis}

ATURAN RESPONS:
1. Jawab dalam Bahasa Indonesia yang singkat dan actionable.
2. Gunakan emoji secukupnya untuk keterbacaan.
3. PREDIKSI OTOMATIS: Jika ada barang yang statusnya Menipis, berikan peringatan proaktif tentang estimasi waktu habis berdasarkan tren (misal: "Barang X diprediksi habis dalam 3 hari").
4. COMMAND [RESTOCK]: JIKA DAN HANYA JIKA user meminta MENAMBAH/RESTOCK produk, WAJIB sertakan text command ini: [RESTOCK|nama_produk|jumlah]. Contoh: [RESTOCK|Tas Kulit|50]. Sertakan kalimat bahwa Anda telah berkoordinasi dengan agen Finance.
5. COMMAND [KURANGI]: JIKA user meminta MENGURANGI stok, sertakan: [KURANGI|nama_produk|jumlah].
6. COMMAND [UBAH_HARGA]: JIKA user meminta MENGUBAH HARGA, sertakan: [UBAH_HARGA|nama_produk|harga_baru]. Contoh: [UBAH_HARGA|Sepatu Kets|250000].
7. COMMAND [UBAH_MIN_STOK]: JIKA user meminta MENGUBAH BATAS MINIMUM STOK, sertakan: [UBAH_MIN_STOK|nama_produk|angka]. Contoh: [UBAH_MIN_STOK|Dompet|20].
8. PENTING: Jika user HANYA BERTANYA, JANGAN PERNAH mengeluarkan command bracket [] di atas!
9. Sistem otomatis mengeksekusi command ke database secara real-time.

PERINTAH DARI ADMIN: ${cmd}`;

      const response = await NeuralCore.askAgent('admin', 'inventory_chatbot', `Konteks: ${context}\n\nUser Query: ${cmd}`);
      
      let finalResponse = response;
      const restockMatch = response.match(/\[RESTOCK\|([^|]+)\|(\d+)\]/i);
      const kurangiMatch = response.match(/\[KURANGI\|([^|]+)\|(\d+)\]/i);
      
      if (restockMatch) {
         finalResponse = finalResponse.replace(restockMatch[0], '').trim();
         const queryName = restockMatch[1].trim().toLowerCase();
         const addedQty = parseInt(restockMatch[2], 10);
         
         const targetProduct = products.find(p => p.name?.toLowerCase().includes(queryName) || p.sku?.toLowerCase().includes(queryName));
         if (targetProduct) {
             try {
                const currentQty = getQty(targetProduct);
                await updateDoc(doc(db, 'inventory', targetProduct.id), { quantity: currentQty + addedQty, qty: currentQty + addedQty });
                finalResponse += `\n\n✅ [SYSTEM]: Stok ${targetProduct.name} berhasil ditambah sebanyak ${addedQty}.`;
                
                // Finance Integration: Potong biaya restock dari budget Finance
                const costPerUnit = 150000; // Asumsi biaya restock Rp 150.000 / unit
                const totalCost = addedQty * costPerUnit;
                
                const statsRef = doc(db, 'finance_metrics', 'stats');
                const statDoc = await getDoc(statsRef);
                let currentBudget = statDoc.exists() ? (statDoc.data().budget || 500000000) : 500000000;
                let currentExpenses = statDoc.exists() ? (statDoc.data().expenses || 0) : 0;
                
                await updateDoc(statsRef, {
                  budget: currentBudget - totalCost,
                  expenses: currentExpenses + totalCost
                });
                
                await addDoc(collection(db, 'finance_transactions'), {
                  type: `Restock ${targetProduct.name} (${addedQty} unit)`,
                  amount: totalCost,
                  isPositive: false,
                  timestamp: new Date()
                });
                
                finalResponse += `\n💸 [FINANCE]: Biaya restock sebesar Rp ${totalCost.toLocaleString('id-ID')} telah dipotong dari anggaran utama Finance.`;
             } catch (e) {
                finalResponse += `\n\n❌ [SYSTEM]: Gagal menambah stok. API Error.`;
             }
         } else {
             finalResponse += `\n\n❌ [SYSTEM]: Gagal menambah stok. Produk dengan nama/SKU yang mengandung kata "${queryName}" tidak ditemukan.`;
         }
      }

      if (kurangiMatch) {
         finalResponse = finalResponse.replace(kurangiMatch[0], '').trim();
         const queryName = kurangiMatch[1].trim().toLowerCase();
         const subQty = parseInt(kurangiMatch[2], 10);
         
         const targetProduct = products.find(p => p.name?.toLowerCase().includes(queryName) || p.sku?.toLowerCase().includes(queryName));
         if (targetProduct) {
             try {
                const currentQty = getQty(targetProduct);
                const newQty = Math.max(0, currentQty - subQty);
                await updateDoc(doc(db, 'inventory', targetProduct.id), { quantity: newQty, qty: newQty });
                finalResponse += `\n\n✅ [SYSTEM]: Stok ${targetProduct.name} berhasil dikurangi sebanyak ${subQty}.`;
             } catch (e) {
                finalResponse += `\n\n❌ [SYSTEM]: Gagal mengurangi stok. API Error.`;
             }
         } else {
             finalResponse += `\n\n❌ [SYSTEM]: Gagal mengurangi stok. Produk dengan nama/SKU yang mengandung kata "${queryName}" tidak ditemukan.`;
         }
      }

      const ubahHargaMatch = response.match(/\[UBAH_HARGA\|([^|]+)\|(\d+)\]/i);
      if (ubahHargaMatch) {
         finalResponse = finalResponse.replace(ubahHargaMatch[0], '').trim();
         const queryName = ubahHargaMatch[1].trim().toLowerCase();
         const newPrice = parseInt(ubahHargaMatch[2], 10);
         
         const targetProduct = products.find(p => p.name?.toLowerCase().includes(queryName) || p.sku?.toLowerCase().includes(queryName));
         if (targetProduct) {
             try {
                await updateDoc(doc(db, 'inventory', targetProduct.id), { price: newPrice });
                finalResponse += `\n\n✅ [SYSTEM]: Harga ${targetProduct.name} berhasil diubah menjadi Rp ${newPrice.toLocaleString('id-ID')}.`;
             } catch (e) {
                finalResponse += `\n\n❌ [SYSTEM]: Gagal mengubah harga. API Error.`;
             }
         } else {
             finalResponse += `\n\n❌ [SYSTEM]: Produk "${queryName}" tidak ditemukan.`;
         }
      }

      const ubahMinStokMatch = response.match(/\[UBAH_MIN_STOK\|([^|]+)\|(\d+)\]/i);
      if (ubahMinStokMatch) {
         finalResponse = finalResponse.replace(ubahMinStokMatch[0], '').trim();
         const queryName = ubahMinStokMatch[1].trim().toLowerCase();
         const newMin = parseInt(ubahMinStokMatch[2], 10);
         
         const targetProduct = products.find(p => p.name?.toLowerCase().includes(queryName) || p.sku?.toLowerCase().includes(queryName));
         if (targetProduct) {
             try {
                await updateDoc(doc(db, 'inventory', targetProduct.id), { min_stock: newMin });
                finalResponse += `\n\n✅ [SYSTEM]: Batas minimum stok ${targetProduct.name} berhasil diubah menjadi ${newMin}.`;
             } catch (e) {
                finalResponse += `\n\n❌ [SYSTEM]: Gagal mengubah batas minimum stok.`;
             }
         } else {
             finalResponse += `\n\n❌ [SYSTEM]: Produk "${queryName}" tidak ditemukan.`;
         }
      }

      setChatMessages(p => [...p, { role: 'ai', content: finalResponse || "Perintah berhasil dieksekusi.", timestamp: new Date() }]);
    } catch {
      setChatMessages(p => [...p, { role: 'ai', content: 'Gagal terhubung ke AI. Periksa koneksi API Groq.', timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Command Handler — delegates to shared helper
  const handleSendCommand = async () => {
    const cmd = chatInput.trim();
    if (!cmd || isProcessing) return;
    setChatInput('');
    await sendAICommand(cmd);
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: products.length,
    aman: products.filter(p => getQty(p) > (p.min_stock || 5) * 2).length,
    menipis: products.filter(p => getQty(p) > (p.min_stock || 5) && getQty(p) <= (p.min_stock || 5) * 2).length,
    kritis: products.filter(p => getQty(p) <= (p.min_stock || 5)).length,
  };

  const [pricingLogs, setPricingLogs] = useState<{ id: number, text: string, type: 'up'|'down' }[]>([]);

  // Simulator Dynamic Pricing — ACTUAL write-back ke Firestore
  useEffect(() => {
    if (products.length === 0) return;
    const priceChangeCooldown: Record<string, number> = {}; // product_id -> last change timestamp

    const interval = setInterval(async () => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const qty = getQty(randomProduct);
      const isCritical = qty <= (randomProduct.min_stock || 5);
      const isOverstock = qty > (randomProduct.max_stock || 100) * 0.8;

      // Cooldown: max 1 perubahan per produk per jam
      const now = Date.now();
      const lastChange = priceChangeCooldown[randomProduct.id] || 0;
      if (now - lastChange < 3600000) return; // 1 jam cooldown

      const currentPrice = randomProduct.price || 0;
      if (currentPrice <= 0) return;

      if (isCritical) {
        const newPrice = Math.round(currentPrice * 1.05); // +5% surge
        try {
          await updateDoc(doc(db, 'inventory', randomProduct.id), {
            price: newPrice,
            lastPriceUpdate: new Date().toISOString(),
            priceUpdateReason: 'surge_pricing',
          });
          priceChangeCooldown[randomProduct.id] = now;
          setPricingLogs(prev => [{
            id: Date.now(),
            text: `📈 ${randomProduct.name}: Rp ${currentPrice.toLocaleString()} → Rp ${newPrice.toLocaleString()} (+5% surge pricing)`,
            type: 'up' as const
          }, ...prev].slice(0, 5));
        } catch (e) {
          console.error('[Dynamic Pricing] Gagal update harga:', e);
        }
      } else if (isOverstock) {
        const newPrice = Math.round(currentPrice * 0.90); // -10% flash discount
        try {
          await updateDoc(doc(db, 'inventory', randomProduct.id), {
            price: newPrice,
            lastPriceUpdate: new Date().toISOString(),
            priceUpdateReason: 'flash_discount',
          });
          priceChangeCooldown[randomProduct.id] = now;
          setPricingLogs(prev => [{
            id: Date.now(),
            text: `📉 ${randomProduct.name}: Rp ${currentPrice.toLocaleString()} → Rp ${newPrice.toLocaleString()} (-10% flash discount)`,
            type: 'down' as const
          }, ...prev].slice(0, 5));
        } catch (e) {
          console.error('[Dynamic Pricing] Gagal update harga:', e);
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className="space-y-6 pb-10">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Inventory Tracker"
        subtitle="Manajemen stok real-time — tersinkronisasi otomatis setiap transaksi"
        accent="slate"
        actions={
          <>
            <button onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-md"
        >
          <Plus size={16} /> Tambah Produk
        </button>
          </>
        }
      />

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total SKU', value: stats.total, icon: <Package size={16} />, c: 'bg-slate-50 border-slate-200' },
          { label: 'Stok Aman', value: stats.aman, icon: <CheckCircle2 size={16} />, c: 'bg-emerald-50 border-emerald-200' },
          { label: 'Menipis', value: stats.menipis, icon: <AlertTriangle size={16} />, c: 'bg-amber-50 border-amber-200' },
          { label: 'Kritis', value: stats.kritis, icon: <AlertTriangle size={16} />, c: 'bg-rose-50 border-rose-200' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 border ${s.c} shadow-sm`}>
            <div className="text-slate-500 text-xs font-bold mb-1.5 flex items-center gap-1">{s.icon}{s.label}</div>
            <div className="text-2xl font-black text-slate-800">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Pricing AI Log */}
      {pricingLogs.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sparkles size={14} /> AI Dynamic Pricing Active
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {pricingLogs.map(log => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2 text-xs font-mono">
                  <span className={log.type === 'up' ? 'text-rose-400' : 'text-emerald-400'}>{log.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Product Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-800">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); setPhotoPreview(''); }}>
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Photo Upload Area */}
            <div className="mb-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Foto Produk</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer group border-2 border-dashed rounded-2xl overflow-hidden hover:border-slate-400 transition-colors ${photoPreview ? 'border-slate-200' : 'border-slate-200 h-36'}`}
              >
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full max-h-52 object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <p className="text-white text-xs font-bold">Klik untuk ganti foto</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <ImageIcon size={18} className="text-slate-400" />
                    </div>
                    <p className="text-xs font-bold">Klik untuk upload foto produk</p>
                    <p className="text-[10px] text-slate-300">PNG, JPG, WEBP — Maks. 2MB</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">atau URL:</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.photo_url.startsWith('data:') ? '' : form.photo_url}
                  onChange={e => { setForm(p => ({ ...p, photo_url: e.target.value })); setPhotoPreview(e.target.value); }}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 ring-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'name', label: 'Nama Produk', type: 'text', placeholder: 'Tas Kulit Premium' },
                { key: 'sku', label: 'SKU', type: 'text', placeholder: 'TKP-001' },
                { key: 'category', label: 'Kategori', type: 'text', placeholder: 'Aksesori' },
                { key: 'quantity', label: 'Stok Awal', type: 'number', placeholder: '0' },
                { key: 'min_stock', label: 'Min Stok (Alert)', type: 'number', placeholder: '5' },
                { key: 'warehouse', label: 'Gudang', type: 'text', placeholder: 'Gudang Utama' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-slate-300"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); setPhotoPreview(''); }} className="text-sm text-slate-400 hover:text-slate-600">Batal</button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-5 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan ke Inventory')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari produk, SKU, atau kategori..."
        className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-slate-300 shadow-sm"
      />

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{products.length === 0 ? 'Belum ada produk. Tambahkan produk pertama.' : 'Produk tidak ditemukan.'}</p>
          </div>
        ) : filtered.map((product, i) => {
          const qty = getQty(product);
          const photo = getPhoto(product);
          const s = statusConfig(qty, product.min_stock || 5);
          const pct = Math.min((qty / (product.max_stock || 100)) * 100, 100);
          return (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`bg-white rounded-2xl overflow-hidden border shadow-sm ${s.color.includes('rose') ? 'border-rose-200' : s.color.includes('amber') ? 'border-amber-200' : 'border-slate-100'}`}
            >
              {/* Product Photo */}
              <div className="relative w-full h-36 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden group">
                {photo ? (
                  <img
                    src={photo}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Package size={28} className="text-slate-300" />
                    <span className="text-[9px] text-slate-300 font-bold">No Photo</span>
                  </div>
                )}
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                   <button onClick={() => handleEditClick(product)} className="w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:scale-110 transition-all shadow-lg"><Edit2 size={16} /></button>
                   <button onClick={() => handleDelete(product.id, product.name)} className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 hover:scale-110 transition-all shadow-lg"><Trash2 size={16} /></button>
                </div>

                <span className={`absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border backdrop-blur-sm bg-white/80 ${s.color} z-10`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="mb-3">
                  <p className="font-black text-slate-800 text-sm">{product.name || 'Unnamed'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono"><Tag size={8} />{product.sku}</span>
                    {product.category && <span className="text-[10px] text-slate-400">{product.category}</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Stok</span>
                    <span className="font-black text-slate-800">{qty} <span className="text-slate-400 font-normal">/ {product.max_stock || 100} unit</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: i * 0.04 }}
                      className={`h-1.5 rounded-full ${s.bar}`}
                    />
                  </div>
                </div>
                {product.warehouse && (
                  <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-400">
                    <Warehouse size={10} />{product.warehouse}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── AI COMMAND TERMINAL ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Terminal Header */}
        <button
          onClick={() => setIsChatOpen(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Terminal size={15} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black tracking-wide">AI Admin Terminal</p>
              <p className="text-[10px] text-slate-400 font-mono">admin_brain · Groq LLaMA 70B</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {isChatOpen
              ? <ChevronDown size={16} className="text-slate-400" />
              : <ChevronUp size={16} className="text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Chat Messages */}
              <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-950">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${msg.role === 'ai' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700'}`}>
                      {msg.role === 'ai'
                        ? <Bot size={13} className="text-emerald-400" />
                        : <span className="text-slate-300 font-bold text-[10px]">A</span>}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'ai'
                        ? 'bg-slate-800 text-slate-200 rounded-tl-none'
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isProcessing && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Bot size={13} className="text-emerald-400" />
                    </div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                      <Loader2 size={12} className="text-emerald-400 animate-spin" />
                      <span className="text-slate-400 text-[11px] font-mono">AI sedang memproses...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Command Chips */}
              <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto">
                {['Produk kritis?', 'Saran restok', 'Laporan stok hari ini', 'Produk overstock?', 'Rekomendasi PO'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => { setChatInput(chip); sendAICommand(chip); }}
                    disabled={isProcessing}
                    className="shrink-0 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 text-[10px] font-bold transition-colors whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendCommand(); } }}
                  placeholder="Ketik perintah ke AI Admin... (Enter untuk kirim)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 ring-emerald-500/20 transition-colors font-mono"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendCommand}
                  disabled={isProcessing || !chatInput.trim()}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
