import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Copy, CheckCircle2, Wand2, Image, Download, Film } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const TONES = [
  { id: 'premium', label: 'Premium', desc: 'Eksklusif & otoritatif', color: 'from-amber-500 to-orange-500' },
  { id: 'visioner', label: 'Visioner', desc: 'Futuristik & inspiratif', color: 'from-purple-500 to-indigo-500' },
  { id: 'minimalis', label: 'Minimalis', desc: 'Ringkas & berdampak', color: 'from-slate-600 to-slate-800' },
];

const FORMATS = ['Caption Instagram', 'Skrip TikTok', 'Tagline Produk', 'Email Marketing', 'Press Release'];

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
}

export default function CampaignForgePage() {
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('premium');
  const [format, setFormat] = useState('Caption Instagram');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);

  useEffect(() => {
    const unsubMedia = onSnapshot(collection(db, 'marketing_assets'), (snap) => {
      const data: MediaItem[] = [];
      snap.forEach(d => data.push(d.data() as MediaItem));
      setMediaLibrary(data);
    });
    return () => unsubMedia();
  }, []);

  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Yakin ingin menghapus aset ini secara permanen?')) {
      await deleteDoc(doc(db, 'marketing_assets', id));
      await FirebaseLogger.logAgentAction('Marketing', 'ASSET_DELETED', `Aset ID ${id} dihapus dari library`);
    }
  };

  const handleEditMedia = async (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Ubah nama aset:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      await updateDoc(doc(db, 'marketing_assets', id), { name: newName });
      await FirebaseLogger.logAgentAction('Marketing', 'ASSET_RENAMED', `Aset diubah namanya menjadi "${newName}"`);
    }
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setResult('');
    try {
      const context = `Kamu adalah AI Copywriter premium untuk brand FusionNeural.
Tone: ${tone.toUpperCase()}
Format yang diminta: ${format}

Buat konten ${format} dengan gaya ${tone}. Langsung tulis konten tanpa penjelasan tambahan. Jangan gunakan markdown bold (**).`;
      const content = await NeuralCore.generateMarketingCampaign(brief, context);
      setResult(content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'));
      await FirebaseLogger.logAgentAction('Marketing', 'CAMPAIGN_FORGE', `Generated ${format} - Tone: ${tone}`);
    } catch (error) {
      console.error(error);
      setResult('Gagal menghubungi AI. Pastikan Groq API key aktif.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Campaign Forge</h1>
        <p className="text-slate-500 text-sm mt-1">Dapur kreatif — AI merancang narasi premium untuk brand Kak</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-5">
          {/* Brief Input */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Campaign Brief</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Contoh: Produk baru tas kulit premium edisi limited, target eksekutif 30-45 tahun, harga Rp 2.5 juta..."
              rows={5}
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-purple-300 resize-none"
            />
          </div>

          {/* Tone Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Tone Selector</label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    tone === t.id ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-1.5 rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                  <p className="text-xs font-black text-slate-800">{t.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{t.desc}</p>
                  {tone === t.id && <CheckCircle2 size={12} className="absolute top-2 right-2 text-purple-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Format Konten</label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    format === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating || !brief.trim()}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 disabled:opacity-50 text-sm"
          >
            {isGenerating
              ? <><RefreshCw size={18} className="animate-spin" /> AI Sedang Menulis...</>
              : <><Wand2 size={18} /> Generate Campaign</>
            }
          </motion.button>
        </div>

        {/* Creative Preview */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Creative Preview</label>
          <div
            className="flex-1 min-h-[400px] relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)' }}
          >
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#A78BFA 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />

            <div className="relative z-10 p-8 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={14} className="text-purple-300" />
                <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">FusionNeural AI · {format}</span>
              </div>

              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="flex gap-2">
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          className="w-3 h-3 rounded-full bg-purple-400" />
                      ))}
                    </div>
                    <p className="text-purple-300 text-sm">AI sedang meracik narasi...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <p className="text-white leading-relaxed text-sm whitespace-pre-wrap">{result}</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied ? 'Tersalin!' : 'Copy'}
                      </button>
                      <button onClick={handleGenerate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/50 hover:bg-purple-500/70 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <RefreshCw size={13} /> Refinasi
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="flex-1 flex flex-col items-center justify-center text-center">
                    <Sparkles size={40} className="text-purple-400/50 mb-4" />
                    <p className="text-purple-300/60 text-sm">Isi brief & pilih tone,<br />lalu klik Generate Campaign</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Launchpad — Stock Media Library ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Film size={18} className="text-purple-500" />
              Content Launchpad — Asset Library
            </h2>
            <span className="text-xs text-slate-400">{mediaLibrary.length} aset tersedia</span>
          </div>
          <p className="text-xs text-slate-500">Kelola dan gunakan visual pendukung kampanye Anda langsung dari library ini</p>
        </div>

        {/* Media Grid */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {mediaLibrary.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMedia(selectedMedia === item.id ? null : item.id)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedMedia === item.id
                      ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full relative">
                        <video src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Film className="text-white drop-shadow-md" size={24} />
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons (Edit / Delete) */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleEditMedia(item.id, item.name, e)}
                        className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"
                        title="Edit Nama"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteMedia(item.id, e)}
                        className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-sm"
                        title="Hapus"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <p className="text-white text-[10px] font-bold line-clamp-1">{item.name}</p>
                      <p className="text-white/70 text-[8px] uppercase tracking-wider">{item.type}</p>
                    </div>

                    {selectedMedia === item.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {mediaLibrary.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Image size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Belum ada aset</p>
                  <p className="text-xs text-slate-400 mt-1">Upload aset melalui halaman Content Launchpad</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action bar when media selected */}
          <AnimatePresence>
            {selectedMedia !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="mt-5 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-purple-500" />
                  <p className="text-sm font-bold text-purple-800">
                    Aset "{mediaLibrary.find(m => m.id === selectedMedia)?.name}" dipilih
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-white transition-all"
                  >
                    Batal
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-4 py-1.5 rounded-xl transition-all">
                    <Download size={12} /> Gunakan Aset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
