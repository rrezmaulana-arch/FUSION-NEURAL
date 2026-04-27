import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, ArrowLeft, ShieldCheck, Zap, Cpu, Sparkles, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearchParams } from 'react-router-dom';
import Groq from 'groq-sdk';
import { NeuralCore } from '../services/NeuralCore';

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

// Extracted order data from the conversation
interface OrderSnapshot {
  name: string;
  phone: string;
  tier: string;
  tierKey: string;
  autonomy: string;
  price: number;
  confirmed: boolean;
}

// ── Heuristic extractor: parse AI-confirmed order from conversation ──
function extractOrderFromHistory(history: Message[]): OrderSnapshot | null {
  const fullText = history.map((m) => m.text).join('\n').toLowerCase();

  // Detect confirmation keyword
  const confirmed =
    fullText.includes('sinkronisasi pesanan') ||
    fullText.includes('pesanan telah tersimpan') ||
    fullText.includes('mengonfirmasi sinkronisasi');

  if (!confirmed) return null;

  // Tier detection
  let tierKey = 'tier2';
  let tier = 'Dual Synergy (2 Agen AI)';
  if (fullText.includes('full one man company') || fullText.includes('tier3')) {
    tierKey = 'tier3';
    tier = 'Full One Man Company (4 Agen AI)';
  } else if (fullText.includes('starter agent') || fullText.includes('tier1')) {
    tierKey = 'tier1';
    tier = 'Starter Agent (1 Agen AI)';
  }

  // Autonomy & price
  const isFullAuto = fullText.includes('100%') || fullText.includes('full otonom');
  const autonomy = isFullAuto ? '100% Full Otonom AI' : '50% Sinergi Hybrid';

  const PRICES: Record<string, { p50: number; p100: number }> = {
    tier1: { p50: 2900000, p100: 4900000 },
    tier2: { p50: 5400000, p100: 8900000 },
    tier3: { p50: 8400000, p100: 14900000 },
  };
  const price = isFullAuto ? PRICES[tierKey].p100 : PRICES[tierKey].p50;

  // Phone detection from user messages
  const userMessages = history.filter((m) => m.sender === 'user').map((m) => m.text);
  const phoneMsg = userMessages.find((t) => /^(\+62|08)[0-9]{7,13}$/.test(t.trim()));
  const phone = phoneMsg?.trim() ?? '';

  // Name: first user message that is a short, non-phone, non-keyword string
  const nameMsg = userMessages.find(
    (t) =>
      t.length >= 2 &&
      t.length <= 60 &&
      !/^(\+62|08)[0-9]/.test(t) &&
      !/(tier|agen|hybrid|otonom|ya|tidak|iya|confirm)/i.test(t),
  );
  const name = nameMsg?.trim() ?? '';

  return { name, phone, tier, tierKey, autonomy, price, confirmed };
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderSnap, setOrderSnap] = useState<OrderSnapshot | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load system prompt from NeuralCore (Firestore → fallback default) ──
  useEffect(() => {
    NeuralCore.getAgentPrompt('frontline_sales').then((prompt) => {
      setSystemPrompt(prompt);
    });
  }, []);

  // ── Send opening greeting once prompt is ready ──
  useEffect(() => {
    if (!systemPrompt) return;

    const tierParam = searchParams.get('tier');
    const autonomyParam = searchParams.get('autonomy');

    let openingContext = '';
    if (tierParam) {
      const TIER_NAMES: Record<string, string> = {
        tier1: 'Starter Agent (1 Agen AI)',
        tier2: 'Dual Synergy (2 Agen AI)',
        tier3: 'Full One Man Company (4 Agen AI)',
      };
      openingContext = `Calon klien datang dari halaman pricing dan tertarik dengan paket ${TIER_NAMES[tierParam] ?? tierParam}${autonomyParam ? ` dengan otonomi ${autonomyParam}%` : ''}. Mulailah percakapan dengan menyambut mereka dan konfirmasi minat mereka terhadap paket tersebut.`;
    }

    sendBotMessage(openingContext || undefined);
  }, [systemPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Core: send message to Groq and get AI reply ──
  const sendBotMessage = async (userContent?: string) => {
    if (!systemPrompt) return;
    setIsTyping(true);

    try {
      const chatHistory = messages
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      const groqMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        ...(userContent ? [{ role: 'user' as const, content: userContent }] : []),
      ];

      // If no prior messages, ask AI to open the conversation
      if (messages.length === 0 && !userContent) {
        groqMessages.push({
          role: 'user',
          content:
            'Mulailah percakapan. Sambut calon klien dengan elegan sebagai Frontline Architect FusionNeural.',
        });
      }

      const completion = await groq.chat.completions.create({
        messages: groqMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.72,
        max_tokens: 600,
      });

      const reply = completion.choices[0]?.message?.content ?? 'Sinkronisasi sedang berlangsung, Kak. Mohon tunggu sebentar.';

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'bot', text: reply },
      ]);
    } catch (err) {
      console.error('Frontline Sales AI Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Sistem Neural sedang melakukan refinasi ulang. Mohon coba kembali sebentar lagi, Kak.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Detect if AI just asked for order confirmation & user said yes ──
  const checkAndSaveOrder = async (allMessages: Message[]) => {
    if (orderSaved) return;

    const lastBot = [...allMessages].reverse().find((m) => m.sender === 'bot');
    const lastUser = [...allMessages].reverse().find((m) => m.sender === 'user');

    if (!lastBot || !lastUser) return;

    const botText = lastBot.text.toLowerCase();
    const userText = lastUser.text.toLowerCase();

    const botAskedConfirm =
      botText.includes('konfirmasi') ||
      botText.includes('sinkronisasi pesanan') ||
      botText.includes('mengonfirmasi');

    const userConfirmed =
      userText.includes('ya') ||
      userText.includes('iya') ||
      userText.includes('konfirmasi') ||
      userText.includes('setuju') ||
      userText.includes('ok') ||
      userText.includes('lanjut');

    if (botAskedConfirm && userConfirmed) {
      const snap = extractOrderFromHistory(allMessages);
      if (snap && snap.name && snap.phone && !orderSaved) {
        setOrderSaved(true);
        setOrderSnap(snap);
        try {
          await addDoc(collection(db, 'order_leads'), {
            tier: snap.tier,
            tierKey: snap.tierKey,
            autonomy: snap.autonomy,
            price: snap.price,
            name: snap.name,
            phone: snap.phone,
            status: 'Menunggu Konfirmasi',
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error('Failed to save order_lead:', e);
        }
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping || !systemPrompt) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Check order save in background
    setTimeout(() => checkAndSaveOrder(updatedMessages), 300);

    await sendBotMessage(text);

    // Re-check after bot replied
    setMessages((prev) => {
      setTimeout(() => checkAndSaveOrder(prev), 200);
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col font-inter">
      {/* Navbar */}
      <header className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-fn-navy transition-colors">
          <ArrowLeft size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-fn-emerald/10 flex items-center justify-center border border-fn-emerald/20">
            <ShieldCheck size={12} className="text-fn-emerald" />
          </div>
          <span className="text-[10px] font-bold text-fn-emerald tracking-widest uppercase">Secure Channel</span>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-6 pb-40">

          {/* Page Header */}
          <div className="text-center mb-10 pt-4">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 bg-fn-navy rounded-2xl flex items-center justify-center shadow-lg shadow-fn-navy/20">
                <Cpu size={28} className="text-fn-emerald" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-fn-emerald border-4 border-white rounded-full"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-space font-bold text-fn-navy">System Deployment</h1>
            <p className="text-sm text-slate-500 mt-2">FusionNeural — Frontline Architect AI</p>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Lock size={11} className="text-fn-emerald" />
              <span className="text-[10px] text-fn-emerald font-bold uppercase tracking-widest">Restricted: Order Consultation Only</span>
            </div>
          </div>

          {/* Loading prompt */}
          {!systemPrompt && (
            <div className="flex justify-center py-10">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                  <Sparkles size={18} className="text-fn-emerald" />
                </motion.div>
                Menginisialisasi Frontline Architect…
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-1 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-fn-navy'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User size={15} className="text-white" />
                  ) : (
                    <Zap size={15} className="text-fn-emerald" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-fn-navy text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <Zap size={15} className="text-fn-emerald" />
                </div>
                <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 bg-fn-emerald/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Sinkronisasi…</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order saved confirmation banner */}
          <AnimatePresence>
            {orderSaved && orderSnap && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-fn-emerald/10 to-teal-50 border border-fn-emerald/25 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-xs font-bold text-fn-emerald uppercase tracking-widest mb-1">✦ Pesanan Tersinkronisasi</p>
                <p className="text-fn-navy font-bold text-base">{orderSnap.name}</p>
                <p className="text-slate-500 text-sm">{orderSnap.tier} · {orderSnap.autonomy}</p>
                <p className="text-fn-navy font-black text-lg mt-1">
                  Rp {orderSnap.price.toLocaleString('id-ID')} <span className="text-slate-400 text-sm font-normal">setup</span>
                </p>
                <p className="text-slate-500 text-xs mt-2">Tim arsitek FusionNeural akan menghubungi Kakak via WhatsApp dalam 1×24 jam.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Footer */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-[#f7f8fa] via-[#f7f8fa]/95 to-transparent fixed bottom-0 w-full">
        <div className="max-w-3xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping || !systemPrompt || orderSaved}
            placeholder={
              !systemPrompt
                ? 'Menginisialisasi AI…'
                : orderSaved
                ? 'Pesanan telah tersinkronisasi.'
                : 'Ketik pesan Kak…'
            }
            className="w-full bg-white border border-slate-200 text-fn-navy rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-fn-emerald focus:ring-2 focus:ring-fn-emerald/10 transition-all disabled:opacity-50 text-sm shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || !systemPrompt || orderSaved}
            className="absolute right-2 top-2 p-2.5 bg-fn-navy text-white rounded-xl hover:bg-fn-navy-light transition-colors disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 tracking-wide">
          AI ini hanya melayani konsultasi &amp; pemesanan FusionNeural
        </p>
      </div>
    </div>
  );
}
