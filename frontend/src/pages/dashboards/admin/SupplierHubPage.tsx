/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Building2, Plus, Star, Truck, FileText, X, Search, Sparkles, TrendingUp, Factory, Brain } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  product_category?: string;
  last_price?: number;
  lead_time_days?: number;
  performance_score?: number;
  address?: string;
  track_record?: string;
  scoutedByAI?: boolean;
}

export default function SupplierHubPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', product_category: '', last_price: 0, lead_time_days: 3, performance_score: 5, address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [generatingPO, setGeneratingPO] = useState<string | null>(null);
  const [poResult, setPoResult] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };
  const isScoutedByAIRef = useRef(false);

  // AI Scout States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [analyzingSupplier, setAnalyzingSupplier] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, string>>({});

  // Theme Effects
  const [placeholderText, setPlaceholderText] = useState('');
  const [coords, setCoords] = useState('[LAT 04.912 | LON 101.423]');

  useEffect(() => {
    const fullText = "Contoh: Pabrik kain katun murah di Bandung...";
    let i = 0;
    const interval = setInterval(() => {
      setPlaceholderText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) i = 0;
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCoords(`[LAT 04.${Math.floor(Math.random() * 999).toString().padStart(3, '0')} | LON 101.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}]`);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'suppliers'), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[]);
    });
    return () => unsub();
  }, []);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAiRecommendations([]);
    try {
      const context = `Kamu adalah AI Supplier Scout di Indonesia. User mencari rekomendasi pabrik/supplier untuk: "${searchQuery}".
Tolong berikan 3 rekomendasi supplier/vendor ASLI dan NYATA (real companies/factories) yang ada di dunia nyata yang relevan. Jangan buat nama fiktif. Gunakan data riil perusahaan yang beroperasi di industri tersebut.
WAJIB KEMBALIKAN DALAM FORMAT ARRAY JSON SAJA tanpa markdown, tanpa penjelasan apapun. Pastikan JSON Valid (gunakan koma antar object). Format JSON yang wajib:
[
  { "name": "PT Contoh Maju", "contact": "08123456789", "product_category": "Kategori relevan", "last_price": 50000, "lead_time_days": 3, "performance_score": 9, "address": "Kota, Provinsi", "track_record": "Konsisten, barang berkualitas" },
  { "name": "PT Vendor Dua", "contact": "08123456780", "product_category": "Kategori relevan", "last_price": 45000, "lead_time_days": 4, "performance_score": 8, "address": "Kota, Provinsi", "track_record": "Bagus" }
]`;
      const response = await NeuralCore.askAgent('admin', 'supplier_research', `Konteks: ${context}\n\nUser Query: ${searchQuery}`);
      
      let cleanJson = response;
      const startIdx = response.indexOf('[');
      const endIdx = response.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = response.substring(startIdx, endIdx + 1);
      } else {
        cleanJson = response.replace(/```json/gi, '').replace(/```/g, '').trim();
      }
      const data = JSON.parse(cleanJson);
      setAiRecommendations(Array.isArray(data) ? data : []);
      await FirebaseLogger.logAgentAction('Admin', 'AI_SUPPLIER_SCOUT', `Mencari rekomendasi untuk: ${searchQuery}`);
    } catch (e) {
      console.error('Error parsing AI response', e);
      showFeedback('error', 'Gagal mengambil data rekomendasi dari AI.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeepAnalyze = async (rec: any) => {
    setAnalyzingSupplier(rec.name);
    try {
      const prompt = `Lakukan analisis risiko vendor (Deep Analyze) untuk supplier bernama "${rec.name}" di industri "${rec.product_category}".
Berikan analisis singkat maksimum 3 kalimat yang berisi pro & kontra, serta risiko potensial bekerja sama dengan perusahaan ini.`;
      const response = await NeuralCore.askAgent('admin', 'supplier_risk_analysis', prompt);
      setAnalysisResult(prev => ({ ...prev, [rec.name]: response }));
      await FirebaseLogger.logAgentAction('Admin', 'SUPPLIER_DEEP_ANALYZE', `Menganalisis profil risiko vendor ${rec.name}`);
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Gagal menganalisis supplier.');
    } finally {
      setAnalyzingSupplier(null);
    }
  };

  const handleAddFromAI = (rec: any) => {
    isScoutedByAIRef.current = true;
    setForm({
      name: rec.name || '',
      contact: rec.contact || '',
      product_category: rec.product_category || '',
      last_price: Number(rec.last_price) || 0,
      lead_time_days: Number(rec.lead_time_days) || 3,
      performance_score: Number(rec.performance_score) || 8,
      address: rec.address || '',
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = async () => {
    if (!form.name) return;
    setIsSaving(true);
    try {
      const isScouted = isScoutedByAIRef.current;
      isScoutedByAIRef.current = false; // reset after use

      await addDoc(collection(db, 'suppliers'), { 
        ...form, 
        scoutedByAI: isScouted,
        createdAt: serverTimestamp() 
      });
      await FirebaseLogger.logAgentAction('Admin', 'SUPPLIER_ADDED', `Supplier "${form.name}" ditambahkan${isScouted ? ' via AI Scout' : ''}`);
      setForm({ name: '', contact: '', product_category: '', last_price: 0, lead_time_days: 3, performance_score: 5, address: '' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleGeneratePO = async (supplier: Supplier) => {
    setGeneratingPO(supplier.id);
    try {
      const po = await NeuralCore.askAgent(
        'admin',
        'supplier_research',
        `Konteks: Kamu adalah AI Admin yang membuat surat Purchase Order profesional. Buat draft PO untuk supplier "${supplier.name}" kategori "${supplier.product_category || 'umum'}", harga beli terakhir Rp ${(supplier.last_price || 0).toLocaleString('id-ID')}, lead time ${supplier.lead_time_days || 3} hari. Format sebagai dokumen formal singkat.\n\nTugas: Draft Purchase Order untuk supplier ${supplier.name}`
      );
      setPoResult(p => ({ ...p, [supplier.id]: po }));
      await FirebaseLogger.logAgentAction('Admin', 'PO_GENERATED', `PO draft dibuat untuk supplier ${supplier.name}`);
    } catch (e) { console.error(e); }
    finally { setGeneratingPO(null); }
  };

  const performanceColor = (score: number) => {
    if (score >= 8) return 'text-purple-600 bg-purple-50';
    if (score >= 5) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  // Backend Data Sync for Insights Sidebar
  const recentScouts = suppliers.filter(s => s.scoutedByAI).slice(-3).reverse();
  const rawPrices = suppliers.filter(s => s.last_price && s.last_price > 0).map(s => s.last_price || 0).slice(-10);
  const maxPrice = Math.max(...(rawPrices.length ? rawPrices : [100]));
  const priceTrends = rawPrices.map(p => (p / maxPrice) * 100);

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Terminal Theme Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="fixed bottom-4 right-4 text-[10px] font-mono text-slate-400 pointer-events-none opacity-60 z-50">
        SYS.COORD {coords}
      </div>
      <PageHeader
        title="Supplier Hub"
        subtitle="Manajemen vendor — informasi kontak, harga beli, dan performa pengiriman"
        accent="slate"
        actions={
          <>
            <button onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 shadow-[0_0_15px_rgba(30,41,59,0.3)] transition-all"
        >
          <Plus size={16} className="animate-pulse text-purple-400" /> Tambah Supplier
        </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* AI Scout Section */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
          <Search size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-blue-600" />
            <h3 className="text-base font-black text-slate-800">AI Supplier Scout</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4 max-w-2xl">
            Kesulitan mencari vendor? Ketik apa yang Anda butuhkan, dan AI kami akan mencari referensi vendor asli dan terpercaya beserta track record performanya untuk Anda tambahkan ke hub.
          </p>
          
            <div className="flex gap-3 max-w-2xl relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 text-sm bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-purple-400 shadow-inner"
                onKeyDown={e => e.key === 'Enter' && handleAISearch()}
              />
              <button 
                onClick={handleAISearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="shrink-0 flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)] disabled:opacity-50"
              >
                <Search size={16} />
                {isSearching ? 'Mencari...' : 'Cari via AI'}
              </button>
            </div>

            {/* AI Suggestion Chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Garment & Kain', 'Elektronik & PCB', 'Plastik & Packaging', 'Logistik Ekspedisi'].map(chip => (
                <button 
                  key={chip} 
                  onClick={() => setSearchQuery(chip)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-purple-100 rounded-full text-[10px] font-bold text-purple-700 hover:bg-purple-100 hover:shadow-sm transition-all"
                >
                  <Sparkles size={10} className="text-purple-400" /> {chip}
                </button>
              ))}
            </div>

          {/* AI Recommendations Results */}
          <AnimatePresence>
            {aiRecommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rekomendasi Ditemukan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiRecommendations.map((rec, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col h-full"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h5 className="font-black text-slate-800 text-sm">{rec.name}</h5>
                        <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          <Star size={10} /> {rec.performance_score}/10
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3">{rec.address} · {rec.contact}</p>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Produk</span>
                          <span className="font-bold text-slate-700 text-right">{rec.product_category}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Harga (Est)</span>
                          <span className="font-bold text-slate-700">Rp {Number(rec.last_price).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Lead Time</span>
                          <span className="font-bold text-slate-700">{rec.lead_time_days} Hari</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg mt-2">
                          <span className="text-[9px] font-bold text-slate-400 block mb-0.5">TRACK RECORD</span>
                          <span className="text-xs text-slate-600 italic">{rec.track_record}</span>
                        </div>
                      </div>

                      {analysisResult[rec.name] && (
                        <div className="bg-purple-50 text-purple-700 p-2 rounded-lg text-[10px] mb-3 border border-purple-100">
                          <div className="font-bold flex items-center gap-1 mb-1"><Brain size={10} /> Deep Analysis Result</div>
                          <p>{analysisResult[rec.name]}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => handleDeepAnalyze(rec)}
                          disabled={analyzingSupplier === rec.name}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Brain size={12} /> {analyzingSupplier === rec.name ? 'Analyzing...' : 'Deep Analyze'}
                        </button>
                        <button 
                          onClick={() => handleAddFromAI(rec)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          <Plus size={12} /> Add to Hub
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

          {/* Add Form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 shadow-sm"
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
                        className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-purple-300"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Skor Performa (1-10)</label>
                  <input type="range" min={1} max={10} value={form.performance_score}
                    onChange={e => setForm(p => ({ ...p, performance_score: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <span className="text-xs text-slate-600 font-bold">{form.performance_score}/10</span>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setIsAdding(false)} className="text-sm text-slate-400 hover:text-slate-600">Batal</button>
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
              <p className="text-slate-400 text-sm">Belum ada supplier. Tambahkan vendor pertama.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((sup, i) => (
                <motion.div key={sup.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden"
                >
                  {sup.scoutedByAI && (
                    <div className="absolute top-0 right-0 bg-purple-100 text-purple-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                      <Sparkles size={8} /> Scouted by AI
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Building2 size={20} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{sup.name}</p>
                        {sup.contact && <p className="text-xs text-slate-400">{sup.contact}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${performanceColor(sup.performance_score || 5)}`}>
                      <Star size={10} /> Rating {sup.performance_score || '–'}/10
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">
                      <TrendingUp size={10} /> {(sup.performance_score || 5) * 10}% On-time
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50/80 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Kategori</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5 truncate">{sup.product_category || '–'}</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Harga Beli</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">Rp {(sup.last_price || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2 text-center">
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

        {/* Insights Sidebar (Floating Widgets) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Market Trends Widget */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-purple-500" /> Market Trends
            </h3>
            <p className="text-xs text-slate-400 mb-2">Estimasi fluktuasi harga bahan baku (berdasarkan database vendor):</p>
            
            {/* Sparkline visualization */}
            {priceTrends.length > 0 ? (
              <div className="flex items-end h-16 gap-1 w-full mt-4">
                {priceTrends.map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="bg-purple-400 rounded-t-sm flex-1 opacity-75 hover:opacity-100 transition-opacity"
                  />
                ))}
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Sinkronisasi data belum cukup...
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>Bulan lalu</span>
              <span>Sekarang</span>
            </div>
          </div>

          {/* Recent Scouts Widget */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-500" /> Recent AI Scouts
            </h3>
            <div className="space-y-3">
              {recentScouts.length > 0 ? recentScouts.map(sup => (
                <div key={sup.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Factory size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 line-clamp-1">{sup.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{sup.product_category}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400">Belum ada vendor yang dipandu oleh AI.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

