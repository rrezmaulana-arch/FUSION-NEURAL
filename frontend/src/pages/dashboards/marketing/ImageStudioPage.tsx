/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Image, Download, Loader2, Sparkles, X, RefreshCw, Send } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { uploadBase64Image } from '../../../services/MediaUploader';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const QUICK_PROMPTS = [
  'produk kemasan premium minimalis dengan background putih bersih',
  'foto produk skincare aesthetic dengan bunga dan marble',
  'banner promosi toko online modern dark theme',
  'packaging makanan artisan dengan warna earth tone',
  'lifestyle product shot kopi specialty di kafe modern',
  'konten media sosial bisnis fashion lokal Indonesia',
];

export default function ImageStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleGenerate = async (overridePrompt?: string) => {
    const p = (overridePrompt || prompt).trim();
    if (!p) return;

    setIsGenerating(true);
    setError('');
    setImageBase64('');
    setLastPrompt(p);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const res = await fetch(`${apiUrl}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Gagal generate gambar.');
        return;
      }

      setImageBase64(data.base64);
      setImageMime(data.mimeType || 'image/jpeg');

      // Log ke Firestore audit_logs
      await FirebaseLogger.logAgentAction('Marketing', 'IMAGE_GENERATED', `FLUX.1 generate: "${p.slice(0, 100)}"`);
    } catch (e: any) {
      setError('Gagal menghubungi server. Periksa koneksi Anda.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = `data:${imageMime};base64,${imageBase64}`;
    a.download = `fusionneural_${Date.now()}.jpg`;
    a.click();
  };

  const handleSendToQueue = async () => {
    if (!imageBase64) return;
    setIsSending(true);
    setSendSuccess(false);
    try {
      // Upload base64 ke Firebase Storage → dapat public URL
      const result = await uploadBase64Image(imageBase64, imageMime, 'ai_generated');

      // Buat entry di marketing_posts
      const postId = `img_${Date.now()}`;
      await addDoc(collection(db, 'marketing_posts'), {
        id: postId,
        content: lastPrompt,
        platform: 'Instagram',
        status: 'pending',
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 jam dari sekarang
        mediaUrl: result.url,
        mediaType: 'image',
        createdAt: new Date().toISOString(),
        source: 'image_studio',
      });

      await FirebaseLogger.logAgentAction('Marketing', 'IMAGE_TO_QUEUE', `Gambar AI dikirim ke Content Queue: "${lastPrompt.slice(0, 50)}"`);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (e) {
      console.error('Send to queue error:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title="Image Studio"
        subtitle={<>Generate visual marketing dengan AI · Model: <code className="font-mono text-xs bg-white/20 px-1.5 py-0.5 rounded">FLUX.1-schnell</code> via HuggingFace</>}
        accent="purple"
      />

      {/* Input Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">
          Deskripsikan Gambar yang Ingin Dibuat
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Contoh: produk skincare premium dengan background marble putih, pencahayaan studio profesional, gaya minimalis..."
          rows={3}
          className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-rose-300 resize-none"
        />

        {/* Quick Prompts */}
        <div className="mt-3 mb-4">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-1">
            <Sparkles size={10} /> Contoh Prompt Cepat
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp}
                onClick={() => { setPrompt(qp); handleGenerate(qp); }}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 text-slate-600 transition-all disabled:opacity-50"
              >
                {qp.length > 40 ? qp.slice(0, 40) + '…' : qp}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 disabled:opacity-50 text-sm"
        >
          {isGenerating
            ? <><Loader2 size={18} className="animate-spin" /> FLUX sedang menggambar...</>
            : <><Wand2 size={18} /> Generate Gambar AI</>
          }
        </motion.button>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          ⏱ Proses ~5–15 detik · Gambar 1024×768px · Gratis via HuggingFace
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <X size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
              {error.includes('cold start') && (
                <p className="text-xs text-red-500 mt-1">Model HuggingFace sedang loading. Tunggu 30 detik lalu coba lagi.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeleton */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col items-center justify-center gap-4">
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    className="w-3 h-3 rounded-full bg-rose-400"
                  />
                ))}
              </div>
              <p className="text-rose-500 text-sm font-semibold">FLUX.1-schnell sedang menggambar...</p>
              <p className="text-slate-400 text-xs">"{lastPrompt.slice(0, 60)}{lastPrompt.length > 60 ? '…' : ''}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {imageBase64 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden"
          >
            <img
              src={`data:${imageMime};base64,${imageBase64}`}
              alt={lastPrompt}
              className="w-full object-contain max-h-[600px]"
            />
            <div className="p-5 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-4 italic">"{lastPrompt}"</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <Download size={14} /> Unduh Gambar
                </button>
                <button
                  onClick={() => handleGenerate()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <RefreshCw size={14} /> Generate Ulang
                </button>
                <button
                  onClick={handleSendToQueue}
                  disabled={isSending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSending ? <><Loader2 size={14} className="animate-spin" /> Mengupload...</> : sendSuccess ? <><Sparkles size={14} /> Tersimpan!</> : <><Send size={14} /> Kirim ke Content Queue</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isGenerating && !imageBase64 && !error && (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Image size={40} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold text-sm">Belum ada gambar</p>
          <p className="text-slate-400 text-xs mt-1">Deskripsikan gambar yang ingin dibuat, lalu klik Generate</p>
        </div>
      )}
    </div>
  );
}
