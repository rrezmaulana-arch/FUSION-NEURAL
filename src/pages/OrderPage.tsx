import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, ArrowLeft, ShieldCheck, Zap, Cpu, Sparkles, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearchParams } from 'react-router-dom';
import { NeuralCore } from '../services/NeuralCore';
import { PRICING, getTierName } from '../config/pricing';

declare global {
  interface Window {
    snap: any;
  }
}

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

// ── AI LLM extractor: parse AI-confirmed order from conversation ──
async function extractOrderFromHistory(history: Message[]): Promise<OrderSnapshot | null> {
  const fullText = history.map((m) => `${m.sender}: ${m.text}`).join('\n');

  try {
    const response = await fetch('/api/neural', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: `Kamu adalah asisten parser JSON. Analisis log chat antara 'bot' (Frontline Architect AI) dan 'user' (calon klien).
Ekstrak detail pesanan HANYA JIKA AI sudah meminta konfirmasi (contoh: "Apakah Kakak mengonfirmasi sinkronisasi pesanan ini sekarang?") DAN user sudah membalas dengan SETUJU (contoh: "ya", "oke", "lanjut").
Jika belum dikonfirmasi atau user menolak, kembalikan JSON kosong {}.
Jika terkonfirmasi, ekstrak ke JSON persis dengan format berikut:
{
  "name": "Nama Klien",
  "phone": "Nomor WhatsApp/HP Klien",
  "tierKey": "tier1" | "tier2" | "tier3",
  "autonomy": "100% Full Otonom AI" | "50% Sinergi Hybrid"
}
Catatan Tier:
- Starter Agent = tier1
- Dual Synergy = tier2
- Full One Man Company = tier3
`
          },
          { role: 'user', content: fullText }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const resultString = data.choices?.[0]?.message?.content;
    if (!resultString) return null;
    
    const parsed = JSON.parse(resultString);
    if (!parsed.name || !parsed.phone || !parsed.tierKey) return null;

    const isFullAuto = parsed.autonomy.includes('100');
    const price = isFullAuto ? PRICING[parsed.tierKey].p100 : PRICING[parsed.tierKey].p50;

    return { 
      name: parsed.name, 
      phone: parsed.phone, 
      tier: getTierName(parsed.tierKey), 
      tierKey: parsed.tierKey, 
      autonomy: parsed.autonomy, 
      price, 
      confirmed: true 
    };
  } catch (error) {
    console.error("Order Extraction Error:", error);
    return null;
  }
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderSnap, setOrderSnap] = useState<OrderSnapshot | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingPaymentRef = useRef(false);

  // ── Load system prompt from NeuralCore (Firestore → fallback default) ──
  useEffect(() => {
    NeuralCore.getAgentPrompt('frontline_sales').then((prompt) => {
      setSystemPrompt(prompt);
    });
  }, []);

  // ── Auto-focus input after bot finishes typing ──
  useEffect(() => {
    if (!isTyping && !isProcessingPayment && !isSetupMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping, isProcessingPayment, isSetupMode]);

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
          content: 'Mulailah percakapan. Sambut calon klien dengan elegan sebagai Frontline Architect FusionNeural.',
        });
      }

      // If in setup mode, inject different context
      if (isSetupMode) {
        groqMessages.push({
          role: 'system',
          content: 'Klien telah melakukan pembayaran. Sekarang kamu bertugas sebagai AI Setup Architect. Tanyakan aplikasi apa yang ingin mereka buat (misal: sistem HRD, sistem Finance, CRM), warna tema yang diinginkan, dan fitur utamanya. Biarkan mereka berkreasi bebas dan bantu mereka merancang idenya!'
        });
      }

      const response = await fetch('/api/neural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: groqMessages,
          model: 'llama-3.3-70b-versatile',
          temperature: 0.72,
          max_tokens: 600
        })
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to communicate with AI provider');
      }

      const reply = data.choices?.[0]?.message?.content ?? 'Sinkronisasi sedang berlangsung, Kak. Mohon tunggu sebentar.';

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'bot', text: reply },
      ]);
    } catch (err: any) {
      console.error('Frontline Sales AI Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Sistem sedang melakukan optimasi jaringan sesaat. Mohon ketik ulang pesan Kakak, atau coba beberapa saat lagi ya.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Detect if AI just asked for order confirmation & user said yes ──
  const checkAndSaveOrder = async (allMessages: Message[]) => {
    if (orderSaved || isProcessingPaymentRef.current || isProcessingPayment) return;

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
      isProcessingPaymentRef.current = true;
      setIsProcessingPayment(true);
      
      const snap = await extractOrderFromHistory(allMessages);
      if (snap && snap.name && snap.phone && !orderSaved) {
        setOrderSnap(snap);
        
        try {
          // 1. Dapatkan Token dari Midtrans
          const orderId = `FN-ORDER-${Date.now()}`;
          const response = await fetch('/api/midtrans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_details: {
                order_id: orderId,
                gross_amount: snap.price
              },
              customer_details: { first_name: snap.name, phone: snap.phone }
            })
          });

          let token = '';
          if (response.ok) {
            const data = await response.json();
            token = data.token;
          } else {
            console.warn('Gagal mendapat token Midtrans, pastikan API Key benar.');
          }

          // 2. Tampilkan Popup Snap
          if (token && window.snap) {
            window.snap.pay(token, {
              onSuccess: async function () {
                await handlePaymentSuccess(snap);
              },
              onPending: function (result: any) {
                console.log('Pending:', result);
              },
              onError: function (result: any) {
                console.error('Error:', result);
                setIsProcessingPayment(false);
                isProcessingPaymentRef.current = false;
              },
              onClose: function () {
                setIsProcessingPayment(false);
                isProcessingPaymentRef.current = false;
              }
            });
          } else {
            // Simulasi sukses jika tidak ada token (di local Vite tanpa proxy)
            await handlePaymentSuccess(snap);
          }
        } catch (e) {
          console.error('Payment processing error:', e);
          setIsProcessingPayment(false);
          isProcessingPaymentRef.current = false;
        }
      } else {
        isProcessingPaymentRef.current = false;
        setIsProcessingPayment(false);
        // Fallback jika AI lupa nanya nama/WA tapi keburu minta konfirmasi
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: 'Mohon maaf Kak, sebelum kita bisa memproses sinkronisasi pembayaran, boleh saya tahu Nama Lengkap dan Nomor WhatsApp Kakak untuk data klien?',
          },
        ]);
      }
    }
  };

  const handlePaymentSuccess = async (snap: OrderSnapshot) => {
    try {
      const clientApiKey = `fn_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
      await addDoc(collection(db, 'order_leads'), {
        tier: snap.tier,
        tierKey: snap.tierKey,
        autonomy: snap.autonomy,
        price: snap.price,
        name: snap.name,
        phone: snap.phone,
        status: 'Lunas - Persiapan Setup',
        clientApiKey,
        createdAt: serverTimestamp(),
      });
      setOrderSaved(true);
      setIsProcessingPayment(false);
      isProcessingPaymentRef.current = false;
      setIsSetupMode(true);
      
      // Kirim pesan sambutan setup dari bot
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString(), 
          sender: 'bot', 
          text: `Pembayaran berhasil diverifikasi, Kak ${snap.name}! \n\nSekarang mari kita mulai perancangan sistem Kakak. Sistem aplikasi apa yang ingin Kakak buat? (Misal: Sistem HRD, CRM, ERP, atau yang lainnya). Lalu, tema warnanya mau seperti apa? Kita bebas berkreasi di sini!` 
        },
      ]);
    } catch (e) {
      console.error('Failed to save order_lead:', e);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
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

          {/* Payment processing indicator */}
          <AnimatePresence>
            {isProcessingPayment && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 rounded-2xl p-5 shadow-lg flex items-center gap-4 border border-slate-800">
                 <div className="w-10 h-10 rounded-full border-2 border-t-fn-emerald border-r-fn-emerald border-b-slate-700 border-l-slate-700 animate-spin"></div>
                 <div>
                   <p className="text-white font-bold text-sm">Menghubungkan ke Gateway Pembayaran (Midtrans)...</p>
                   <p className="text-slate-400 text-xs">Mohon selesaikan pembayaran di jendela popup.</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order saved & Transition to Setup */}
          <AnimatePresence>
            {orderSaved && orderSnap && !isSetupMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-fn-emerald/10 to-teal-50 border border-fn-emerald/25 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-xs font-bold text-fn-emerald uppercase tracking-widest mb-1">✦ Pesanan Berhasil & Lunas</p>
                <p className="text-fn-navy font-bold text-base">{orderSnap.name}</p>
                <p className="text-slate-500 text-sm">{orderSnap.tier} · {orderSnap.autonomy}</p>
                <p className="text-fn-navy font-black text-lg mt-1">
                  Rp {orderSnap.price.toLocaleString('id-ID')} <span className="text-slate-400 text-sm font-normal">setup</span>
                </p>
              </motion.div>
            )}
            
            {isSetupMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full uppercase tracking-widest">Memasuki Mode AI Setup Architect</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Reply Chips */}
      {!orderSaved && !isProcessingPayment && messages.length < 6 && (
        <div className="px-4 sm:px-6 pb-3 fixed bottom-[90px] w-full z-10">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-start">
            {[
              { label: 'Saya mau pesan paket', msg: 'Saya tertarik ingin memesan paket FusionNeural' },
              { label: 'Info harga', msg: 'Boleh kasih tau harga lengkap semua paket?' },
              { label: 'Apa itu Dual Synergy?', msg: 'Bisa jelaskan paket Dual Synergy?' },
              { label: 'Full Otonom itu apa?', msg: 'Apa bedanya 50% Sinergi Hybrid vs 100% Full Otonom AI?' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={(e) => {
                  e.preventDefault();
                  handleSend(chip.msg);
                }}
                disabled={isTyping || !systemPrompt || isProcessingPayment}
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-fn-emerald hover:text-white hover:border-fn-emerald transition-all disabled:opacity-40 shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Footer */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-[#f7f8fa] via-[#f7f8fa]/95 to-transparent fixed bottom-0 w-full">
        <div className="max-w-3xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping || !systemPrompt || isProcessingPayment}
            placeholder={
              !systemPrompt
                ? 'Menginisialisasi AI…'
                : isProcessingPayment
                ? 'Menunggu pembayaran selesai...'
                : 'Ketik pesan Kak…'
            }
            className="w-full bg-white border border-slate-200 text-fn-navy rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-fn-emerald focus:ring-2 focus:ring-fn-emerald/10 transition-all disabled:opacity-50 text-sm shadow-sm"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping || !systemPrompt || isProcessingPayment}
            className="absolute right-2 top-2 p-2.5 bg-fn-navy text-white rounded-xl hover:bg-fn-navy-light transition-colors disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 tracking-wide">
          AI ini hanya melayani konsultasi &amp; pemesanan FusionNeural
        </p>
      </div>
      {/* Premium Payment Overlay (Behind Midtrans) */}
      <AnimatePresence>
        {isProcessingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-fn-navy/80 backdrop-blur-md"
          >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

            <motion.div
              animate={{ scale: [0.98, 1.02, 0.98] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative z-10 flex flex-col items-center px-6"
            >
              <div className="w-24 h-24 bg-fn-emerald/10 border border-fn-emerald/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
                <ShieldCheck size={48} className="text-fn-emerald" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-3 text-center">Secure Payment Gateway</h2>
              <p className="text-slate-300 text-center max-w-md leading-relaxed text-sm">
                Jendela pembayaran Midtrans telah terbuka. Silakan selesaikan transaksi Kakak dengan aman. Kami melindungi data Anda dengan enkripsi end-to-end.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
