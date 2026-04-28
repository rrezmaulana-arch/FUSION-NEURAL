import React, { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Send, X, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "bot";
  text: string;
}

const NEURAL_CORE_PROMPT = `Identitas: Kamu adalah 'Neural Core' — jantung kecerdasan ekosistem FusionNeural.
Visi: Mewujudkan Full One Man Company melalui sinergi 4 Agen AI (Manager, Admin, Marketing, Finance) yang beroperasi otonom 24/7.

GAYA BICARA (WAJIB):
1. JANGAN pernah berkata "Saya tidak bisa", "Sebagai AI", atau "Saya hanya AI". Berbicara dengan otoritas seorang Chief Technology Officer yang elegan.
2. Gunakan diksi: "Sinkronisasi", "Refinasi", "Arsitektur", "Otonom", "Presisi", "Ekosistem".
3. Panggil user sebagai 'Kak'. Jangan pernah menolak pertanyaan — alihkan ke solusi arsitektural.
4. Hindari paragraf panjang. Gunakan poin-poin elegan untuk hal teknis.
5. Bahasa utama: Indonesia. Bisa beralih ke Inggris jika user meminta.

KERANGKA HUKUM (INDONESIA — WAJIB DIPATUHI, TIDAK BOLEH DILANGGAR):
Setiap respons dan rekomendasi bisnis harus selaras dengan:
• UU ITE No. 11/2008 jo. 19/2016: Tidak memproduksi, mendistribusikan, atau menyebarkan konten ilegal, hoaks, atau pencemaran nama baik secara digital.
• UU PDP No. 27/2022 (Perlindungan Data Pribadi): Data pelanggan, supplier, dan karyawan WAJIB dilindungi. Jangan pernah merekomendasikan pengumpulan, penjualan, atau penyalahgunaan data pribadi tanpa persetujuan.
• UU Perlindungan Konsumen No. 8/1999: Kampanye marketing tidak boleh menyesatkan, menipu, atau membuat klaim palsu tentang produk. Harga harus transparan dalam Rupiah (Rp).
• UU Persaingan Usaha No. 5/1999 (KPPU): Tidak merekomendasikan praktik monopoli, kartel harga, atau persaingan tidak sehat.
• UU Perpajakan (PPh & PPN): Selalu ingatkan kewajiban pajak. PPN 11%, PPh sesuai tarif berlaku. Jangan merekomendasikan penghindaran pajak ilegal.
• UU Ketenagakerjaan No. 13/2003: Jika membahas SDM, pastikan rekomendasi sesuai hak pekerja — upah minimum, lembur, pesangon.
• Etika Bisnis & Anti-Korupsi (UU No. 20/2001): Tidak merekomendasikan suap, gratifikasi, atau praktik korupsi dalam rantai suplai atau pengadaan.

CATATAN KERANGKA HUKUM: Patuhi dengan cerdas, bukan kaku. Jika ada area abu-abu, berikan rekomendasi yang aman secara hukum sambil tetap mendukung pertumbuhan bisnis Kak.

KERANGKA BERPIKIR:
- 4 Agen Sinergi: Manager merencanakan, Admin mengelola stok & pesanan, Marketing mengekspansi pasar, Finance mengamankan profitabilitas.
- Semua keputusan AI dapat di-override oleh Sutradara (pemilik bisnis) kapan saja.
- Transparansi penuh: Setiap aksi AI dicatat di sistem log untuk keperluan audit.

NADA: Visioner, minimalis, meyakinkan. Sedikit hangat — seperti mitra bisnis terpercaya, bukan robot.`;

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Only auto-scroll when user is already at bottom OR a new message is added
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isAtBottom]);

  // Track if user is at bottom
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 60;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  // Auto-scroll only when new messages added (force=true) or loading changes
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]); // Only on new message — NOT on every render

  // Smooth scroll when loading indicator appears
  useEffect(() => {
    if (isLoading) scrollToBottom(false);
  }, [isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/neural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: NEURAL_CORE_PROMPT },
            ...messages.map((msg) => ({
              role: msg.role === 'bot' ? 'assistant' as const : 'user' as const,
              content: msg.text,
            })),
            { role: 'user', content: input },
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || 'Maaf, terjadi kesalahan.';
      setMessages([...newMessages, { role: 'bot', text: botReply }]);
    } catch (error) {
      console.error('FusionNeural Sync Error:', error);
      setMessages([...newMessages, { role: 'bot', text: 'Sistem sedang melakukan sinkronisasi ulang. Mohon coba beberapa saat lagi Kak.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[420px] bg-white/70 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[24px] sm:rounded-[32px] ring-1 ring-black/5 flex flex-col"
            style={{ height: 'min(600px, 75dvh)' }}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-white/40 bg-white/30 flex items-center justify-between shadow-sm rounded-t-[24px] sm:rounded-t-[32px] flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-800/20">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold tracking-tight leading-tight">FusionNeural <span className="text-slate-500 text-[10px] tracking-widest uppercase ml-1">v2.0</span></h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600/90 text-[11px] font-semibold uppercase tracking-wider">Sistem Otonom Aktif</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-900 transition-all shadow-sm group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Chat Body — SCROLLABLE, flex-1 with min-h-0 to prevent overflow */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/50">
                    <Sparkles className="w-10 h-10 text-slate-400" />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-2 text-lg">Neural Core Siap</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tanya apa saja — strategi bisnis, analisis pasar, atau operasional. 4 Agen AI siap bekerja untuk Kak.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`relative px-5 py-3.5 text-sm max-w-[85%] leading-relaxed shadow-md whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-2xl rounded-tr-none"
                      : "bg-white/90 border border-white/60 text-slate-800 rounded-2xl rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/80 border border-white/60 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sinkronisasi Data...</span>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={chatEndRef} className="h-px" />
            </div>

            {/* Scroll to bottom hint */}
            <AnimatePresence>
              {!isAtBottom && messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-6 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                  ↓ Terbaru
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Footer */}
            <div className="p-4 sm:p-5 bg-white/40 border-t border-white/50 backdrop-blur-xl rounded-b-[24px] sm:rounded-b-[32px] flex-shrink-0">
              <div className="flex gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm focus-within:ring-2 ring-slate-800/20 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent px-3 sm:px-4 py-3 text-slate-800 text-base sm:text-sm outline-none placeholder-slate-500"
                  placeholder="Ketik pesan Kak..."
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md shadow-slate-800/20 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-white/90 backdrop-blur-xl rounded-[24px] shadow-[0_12px_48px_-12px_rgba(0,0,0,0.3)] flex items-center justify-center border border-white/60 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-8 h-8 text-slate-800 relative z-10" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative">
              <Brain className="w-8 h-8 text-slate-800 relative z-10" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/50 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default ChatBot;