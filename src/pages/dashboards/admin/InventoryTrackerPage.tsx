import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Package, Plus, AlertTriangle, CheckCircle2, X, Tag, Warehouse,
  ImageIcon, Terminal, Send, Bot, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { NeuralCore } from '../../../services/NeuralCore';

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
  const [form, setForm] = useState({ name: '', sku: '', category: '', quantity: 0, min_stock: 5, max_stock: 100, warehouse: 'Gudang Utama', photo_url: '' });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  // AI Command Terminal
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: '🤖 AI Admin Terminal aktif. Saya siap menerima perintah. Contoh:\n- "Tampilkan semua produk kritis"\n- "Berikan saran restok untuk produk menipis"\n- "Buat laporan stok hari ini"\n- "Cek produk apa yang perlu di-reorder segera"',
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle file upload → base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
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

  const handleAdd = async () => {
    if (!form.name || !form.sku) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'inventory'), { ...form, createdAt: serverTimestamp() });
      await FirebaseLogger.logAgentAction('Admin', 'PRODUCT_ADDED', `Produk "${form.name}" (${form.sku}) ditambahkan ke inventory`);
      setForm({ name: '', sku: '', category: '', quantity: 0, min_stock: 5, max_stock: 100, warehouse: 'Gudang Utama', photo_url: '' });
      setPhotoPreview('');
      setIsAdding(false);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  // AI Command Handler
  const handleSendCommand = async () => {
    const cmd = chatInput.trim();
    if (!cmd || isProcessing) return;

    const userMsg: ChatMessage = { role: 'user', content: cmd, timestamp: new Date() };
    setChatMessages(p => [...p, userMsg]);
    setChatInput('');
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
1. Jawab dalam Bahasa Indonesia yang singkat dan actionable
2. Gunakan emoji secukupnya untuk keterbacaan
3. Jika ada produk kritis, selalu sebutkan nama produknya
4. Berikan rekomendasi konkret, bukan teori
5. Format dengan bullet points jika ada list

PERINTAH DARI ADMIN: ${cmd}`;

      const response = await NeuralCore.generateMarketingCampaign(cmd, context);
      await FirebaseLogger.logAgentAction('Admin', 'AI_COMMAND', `Command: "${cmd.slice(0, 50)}"`);

      setChatMessages(p => [...p, { role: 'ai', content: response, timestamp: new Date() }]);
    } catch {
      setChatMessages(p => [...p, { role: 'ai', content: 'Gagal terhubung ke AI. Periksa koneksi API Groq.', timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen stok real-time — tersinkronisasi otomatis setiap transaksi</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-md"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

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

      {/* Add Product Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-800">Tambah Produk Baru</h3>
              <button onClick={() => { setIsAdding(false); setPhotoPreview(''); }}>
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
              <button onClick={() => { setIsAdding(false); setPhotoPreview(''); }} className="text-sm text-slate-400 hover:text-slate-600">Batal</button>
              <button onClick={handleAdd} disabled={isSaving}
                className="px-5 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan ke Inventory'}
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
            <p className="text-sm">{products.length === 0 ? 'Belum ada produk. Tambahkan produk pertama Kak.' : 'Produk tidak ditemukan.'}</p>
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
              <div className="relative w-full h-36 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {photo ? (
                  <img
                    src={photo}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Package size={28} className="text-slate-300" />
                    <span className="text-[9px] text-slate-300 font-bold">No Photo</span>
                  </div>
                )}
                <span className={`absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border backdrop-blur-sm bg-white/80 ${s.color}`}>
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
                {['Produk kritis?', 'Saran restok', 'Laporan stok hari ini', 'Produk overstock?', 'Rekomendasi PO'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => setChatInput(cmd)}
                    className="shrink-0 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold transition-colors whitespace-nowrap"
                  >
                    {cmd}
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
