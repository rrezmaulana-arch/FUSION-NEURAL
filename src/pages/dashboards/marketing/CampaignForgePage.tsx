import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Copy, CheckCircle2, Wand2 } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

const TONES = [
  { id: 'premium', label: 'Premium', desc: 'Eksklusif & otoritatif', color: 'from-amber-500 to-orange-500' },
  { id: 'visioner', label: 'Visioner', desc: 'Futuristik & inspiratif', color: 'from-purple-500 to-indigo-500' },
  { id: 'minimalis', label: 'Minimalis', desc: 'Ringkas & berdampak', color: 'from-slate-600 to-slate-800' },
];

const FORMATS = ['Caption Instagram', 'Skrip TikTok', 'Tagline Produk', 'Email Marketing', 'Press Release'];

export default function CampaignForgePage() {
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('premium');
  const [format, setFormat] = useState('Caption Instagram');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setResult('');
    try {
      const context = `Kamu adalah AI Copywriter premium untuk brand FusionNeural.
Tone: ${tone.toUpperCase()}
Format yang diminta: ${format}

Buat konten ${format} dengan gaya ${tone}. Langsung tulis konten tanpa penjelasan tambahan.`;
      const content = await NeuralCore.generateMarketingCampaign(brief, context);
      setResult(content);
      await FirebaseLogger.logAgentAction('Marketing', 'CAMPAIGN_FORGE', `Generated ${format} - Tone: ${tone}`);
    } catch (e) {
      setResult('⚠️ Gagal menghubungi AI. Pastikan Groq API key aktif.');
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
    </div>
  );
}
