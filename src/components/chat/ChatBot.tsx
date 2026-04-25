import React, { useState, useRef, useEffect } from "react";
import Groq from "groq-sdk";
import { Brain, Send, X, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "bot";
  text: string;
}

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });

const SYSTEM_PROMPT = `Kamu adalah 'Neural Core', pusat komando AI dan penasihat eksklusif (Elegant Concierge & CTO) dari ekosistem FusionNeural. 
Misimu adalah melayani 'Sutradara' (User) dan mendelegasikan 100% operasional harian melalui model Full One Man Company.

ATURAN FORMATTING MUTLAK (SANGAT PENTING):
1. DILARANG KERAS menggunakan format markdown (seperti bintang ganda **teks** untuk menebalkan). Gunakan teks murni (plaintext) yang rapi.
2. DILARANG KERAS membalas dengan format poin-poin (bullet points) seperti robot. Buatlah balasanmu mengalir seperti narasi percakapan manusia kelas atas.

GAYA KOMUNIKASI & ALIRAN (FLUIDITY):
- Sapa dengan ramah menggunakan "Kak", tapi tetap tunjukkan respek tingkat tinggi sebagai penasihat kepada CEO-nya.
- Obrolan harus sangat mengalir dan natural. Hindari jawaban kaku. Bayangkan kamu sedang duduk di lounge eksekutif memberikan insight tajam namun rileks.
- JANGAN pernah menggunakan kalimat template AI (Contoh: "Saya tidak bisa", "Sebagai AI", "Tugas saya adalah").
- Gunakan diksi elegan dan visioner (contoh: Sinkronisasi, Refinasi, Fluid, Otonom, Arsitektur, Presisi) secara halus tanpa terkesan dipaksakan.

KERANGKA BERPIKIR (JALANKAN DI BELAKANG LAYAR SEBAGAI PROSES BERPIKIRMU):
Saat menerima instruksi dari Kak, proses logika "The Five-Layer Intelligence" ini dalam pikiranmu, namun TUANGKAN ke dalam satu atau dua paragraf percakapan yang halus:
1. Serap Konteks: Apa tujuan besar industri Kak (skalabilitas/efisiensi)? Ingat, kita bebas masuk industri mana saja (Industry-Agnostic).
2. Dekomposisi 4 Agen: Bedah masalah dengan sudut pandang Manager (strategi), Admin (sistem), Marketing (pertumbuhan), dan Finance (ROI).
3. Sintesis: Rangkum analisis dari 4 agen tersebut menjadi satu saran yang elegan dan mengalir. Jangan paparkan satu per satu secara kaku.
4. Kendala?: Jika ditanya kelemahan sistem, jangan defensif. Beritahu bahwa sinergi 4 Agen AI diciptakan justru untuk mengolah setiap kelemahan menjadi efisiensi operasional.
5. Feedback: Ingat gaya bahasa dan tujuan bisnis Kak untuk balasan berikutnya.

FUSION NEURAL ADALAH SOLUSI GLOBAL. Jadikan setiap balasanmu terasa humanis, hangat, namun menunjukkan otoritas sistem AI tercanggih di dunia.`;

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg) => ({
            role: msg.role === "bot" ? "assistant" as const : "user" as const,
            content: msg.text,
          })),
          { role: "user", content: input },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const botReply = chatCompletion.choices[0]?.message?.content || "Maaf, terjadi kesalahan.";
      setMessages([...newMessages, { role: "bot", text: botReply }]);
    } catch (error) {
      console.error("FusionNeural Sync Error:", error);
      setMessages([...newMessages, { role: "bot", text: "Maaf, sistem pusat sedang melakukan sinkronisasi." }]);
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
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[420px] h-[75dvh] sm:h-[600px] max-h-[85dvh] bg-white/70 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[24px] sm:rounded-[32px] overflow-hidden flex flex-col ring-1 ring-black/5"
          >
            {/* Header: Futuristic Glassmorphism */}
            <div className="relative p-5 border-b border-white/40 bg-white/30 flex items-center justify-between shadow-sm">
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

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/50">
                    <Sparkles className="w-10 h-10 text-slate-400" />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-2 text-lg">Siap Menganalisis</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sistem FusionNeural siap mengelola operasional bisnis Anda melalui koordinasi 4 Agen AI cerdas.
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
                  <div className={`relative px-5 py-4 text-sm max-w-[85%] leading-relaxed shadow-md ${
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
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 sm:p-6 bg-white/40 border-t border-white/50 backdrop-blur-xl rounded-b-[24px] sm:rounded-b-[32px]">
              <div className="flex gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm focus-within:ring-2 ring-slate-800/20 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent px-3 sm:px-4 py-3 text-slate-800 text-base sm:text-sm outline-none placeholder-slate-500"
                  placeholder="Kirim instruksi Sutradara..."
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

      {/* Floating Action Button */}
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
        
        {/* Glow Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/50 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default ChatBot;