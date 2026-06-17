/**
 * pages/umkm/UMKMOnboarding.tsx — Wizard 5 langkah setup awal
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Smartphone, Package, Bot, Sparkles } from 'lucide-react';

const STEPS = [
  { title: 'Nama Usaha', subtitle: 'Siapa nama usaha Anda?' },
  { title: 'Jenis Usaha', subtitle: 'Apa yang Anda jual?' },
  { title: 'WhatsApp', subtitle: 'Hubungkan nomor WhatsApp' },
  { title: 'Produk Pertama', subtitle: 'Tambahkan minimal 1 produk' },
  { title: 'Selesai!', subtitle: 'AI sudah siap bekerja' },
];

const CATEGORIES = ['Fashion', 'F&B', 'Jasa', 'Kecantikan', 'Elektronik', 'Lainnya'];

export default function UMKMOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '',
    category: '',
    whatsapp: '',
    productName: '',
    productPrice: '',
    productStock: '',
  });

  const canNext = () => {
    switch (step) {
      case 0: return form.businessName.trim().length > 0;
      case 1: return form.category.length > 0;
      case 2: return form.whatsapp.trim().length > 8;
      case 3: return form.productName.trim().length > 0 && form.productPrice.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else navigate('/umkm');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-8">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
              i <= step ? 'bg-purple-500' : 'bg-slate-700'
            }`} />
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-mono">Step {step + 1} / {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black mb-1">{STEPS[step].title}</h2>
              <p className="text-sm text-slate-400">{STEPS[step].subtitle}</p>
            </div>

            {/* Step 0: Nama Usaha */}
            {step === 0 && (
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Contoh: Sari Fashion"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 text-lg font-medium"
                autoFocus
              />
            )}

            {/* Step 1: Jenis Usaha */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`py-4 rounded-2xl text-sm font-bold transition-all ${
                      form.category === cat
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: WhatsApp */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-400 text-lg">+62</span>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                    placeholder="8123456789"
                    className="flex-1 bg-transparent py-4 text-white placeholder:text-slate-600 focus:outline-none text-lg font-medium"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500">Nomor ini akan menerima pesan pelanggan dan dijawab otomatis oleh AI.</p>
              </div>
            )}

            {/* Step 3: Produk */}
            {step === 3 && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="Nama produk (contoh: Kaos Oversize Hitam)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 text-base"
                  autoFocus
                />
                <input
                  type="number"
                  value={form.productPrice}
                  onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                  placeholder="Harga (contoh: 89000)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 text-base"
                />
                <input
                  type="number"
                  value={form.productStock}
                  onChange={(e) => setForm({ ...form, productStock: e.target.value })}
                  placeholder="Stok (contoh: 20)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 text-base"
                />
              </div>
            )}

            {/* Step 4: Selesai */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-bold">Usaha: {form.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-bold">WhatsApp: +62 {form.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-bold">Produk: {form.productName}</span>
                  </div>
                </div>

                <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold text-purple-300">AI Demo</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-400">Pelanggan: "Ready {form.productName.toLowerCase()}?"</p>
                    <p className="text-purple-300 bg-purple-900/50 rounded-xl p-3">
                      AI: "Siap kak! {form.productName} ready stock. Mau warna apa?"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 bg-slate-800 text-slate-300 font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canNext()}
          className="flex-1 bg-purple-600 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step === 4 ? (
            <>
              <Sparkles className="w-4 h-4" /> Mulai Pakai
            </>
          ) : (
            <>
              Lanjut <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
