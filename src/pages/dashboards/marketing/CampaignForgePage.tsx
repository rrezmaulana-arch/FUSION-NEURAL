import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Copy, CheckCircle2, Wand2, Image, Video, Download, ExternalLink, Film, Camera } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

const TONES = [
  { id: 'premium', label: 'Premium', desc: 'Eksklusif & otoritatif', color: 'from-amber-500 to-orange-500' },
  { id: 'visioner', label: 'Visioner', desc: 'Futuristik & inspiratif', color: 'from-purple-500 to-indigo-500' },
  { id: 'minimalis', label: 'Minimalis', desc: 'Ringkas & berdampak', color: 'from-slate-600 to-slate-800' },
];

const FORMATS = ['Caption Instagram', 'Skrip TikTok', 'Tagline Produk', 'Email Marketing', 'Press Release'];

// Stock media content library using Picsum for photos
const STOCK_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/seed/business1/400/300', label: 'Business Meeting', tag: 'Corporate' },
  { id: 2, url: 'https://picsum.photos/seed/tech2/400/300', label: 'Technology', tag: 'Tech' },
  { id: 3, url: 'https://picsum.photos/seed/office3/400/300', label: 'Office Workspace', tag: 'Workspace' },
  { id: 4, url: 'https://picsum.photos/seed/product4/400/300', label: 'Product Showcase', tag: 'Product' },
  { id: 5, url: 'https://picsum.photos/seed/data5/400/300', label: 'Data Analytics', tag: 'Analytics' },
  { id: 6, url: 'https://picsum.photos/seed/abstract6/400/300', label: 'Abstract Visual', tag: 'Creative' },
  { id: 7, url: 'https://picsum.photos/seed/city7/400/300', label: 'Urban Business', tag: 'Location' },
  { id: 8, url: 'https://picsum.photos/seed/team8/400/300', label: 'Team Synergy', tag: 'People' },
  { id: 9, url: 'https://picsum.photos/seed/growth9/400/300', label: 'Growth Chart', tag: 'Finance' },
];

const VIDEO_TEMPLATES = [
  { id: 'v1', thumbnail: 'https://picsum.photos/seed/vid1/400/225', label: 'Product Launch Reel', duration: '15s', platform: 'TikTok/Reels' },
  { id: 'v2', thumbnail: 'https://picsum.photos/seed/vid2/400/225', label: 'Brand Story', duration: '30s', platform: 'Instagram' },
  { id: 'v3', thumbnail: 'https://picsum.photos/seed/vid3/400/225', label: 'Testimonial Template', duration: '60s', platform: 'YouTube' },
  { id: 'v4', thumbnail: 'https://picsum.photos/seed/vid4/400/225', label: 'Promo Countdown', duration: '10s', platform: 'All Platforms' },
];

type MediaTab = 'photos' | 'videos';

export default function CampaignForgePage() {
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('premium');
  const [format, setFormat] = useState('Caption Instagram');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mediaTab, setMediaTab] = useState<MediaTab>('photos');
  const [selectedMedia, setSelectedMedia] = useState<number | string | null>(null);

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
    } catch (e) {
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Film size={18} className="text-purple-500" />
              Content Launchpad — Stock Media Library
            </h2>
            <span className="text-xs text-slate-400">{mediaTab === 'photos' ? STOCK_PHOTOS.length : VIDEO_TEMPLATES.length} aset tersedia</span>
          </div>
          <p className="text-xs text-slate-500">Pilih visual pendukung kampanye Kak langsung dari library ini</p>

          {/* Tab */}
          <div className="flex gap-2 mt-4">
            {([['photos', 'Foto', Camera], ['videos', 'Video Template', Video]] as [MediaTab, string, any][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setMediaTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mediaTab === key
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {mediaTab === 'photos' ? (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4"
              >
                {STOCK_PHOTOS.map((photo, i) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedMedia(selectedMedia === photo.id ? null : photo.id)}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedMedia === photo.id
                        ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-bold">{photo.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">{photo.tag}</span>
                        <ExternalLink size={10} className="text-white/70 ml-auto" />
                      </div>
                    </div>
                    {selectedMedia === photo.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="videos"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {VIDEO_TEMPLATES.map((vid, i) => (
                  <motion.div
                    key={vid.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedMedia(selectedMedia === vid.id ? null : vid.id)}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedMedia === vid.id
                        ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={vid.thumbnail}
                        alt={vid.label}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                          <Video size={20} className="text-white ml-0.5" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        {vid.duration}
                      </span>
                      {selectedMedia === vid.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm font-bold text-slate-800">{vid.label}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">{vid.platform}</span>
                        <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 transition-colors">
                          <Download size={11} /> Template
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action bar when media selected */}
          <AnimatePresence>
            {selectedMedia !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="mt-5 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2">
                  {mediaTab === 'photos' ? <Image size={16} className="text-purple-500" /> : <Video size={16} className="text-purple-500" />}
                  <p className="text-sm font-bold text-purple-800">
                    {mediaTab === 'photos'
                      ? `Foto "${STOCK_PHOTOS.find(p => p.id === selectedMedia)?.label}" dipilih`
                      : `Template "${VIDEO_TEMPLATES.find(v => v.id === selectedMedia)?.label}" dipilih`}
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
