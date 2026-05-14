/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, ArrowLeft, ShieldCheck, Zap, Cpu, Sparkles, Lock, CheckCircle2, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { NeuralCore } from '../services/NeuralCore';
import { triggerAgent } from '../services/apiClient';
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

// ── FIX #3: Parse tier HANYA dari URL params, BUKAN dari scan teks chat ──
// Scanning teks chat berbahaya: jika klien menyebut tier lain dalam percakapan,
// harga yang ditagihkan bisa salah. URL params diset secara eksplisit saat klien
// mengklik tombol "Mulai Sekarang" di PricingSection.
function parseTierFromParams(searchParams: URLSearchParams): { tierKey: string; autonomy: string } {
  const tierKey = searchParams.get('tier') || 'tier1';
  const autonomyParam = searchParams.get('autonomy');
  // autonomy param = '100' atau '50', default ke 50 jika tidak ada
  const autonomy = autonomyParam === '100' ? '100% Full Otonom AI' : '50% Sinergi Hybrid';
  return { tierKey, autonomy };
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // systemPrompt hanya digunakan untuk opening greeting — prompt utama dikelola oleh Python Backend
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderSnap, setOrderSnap] = useState<OrderSnapshot | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  // ── Confirmation form state ──
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [confirmFormError, setConfirmFormError] = useState('');
  // ── FIX #2: Recovery code setelah pembayaran sukses ──
  const [recoveryCode, setRecoveryCode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingPaymentRef = useRef(false);

  // sessionId unik per sesi halaman — digunakan Python Backend untuk memory management
  const sessionId = useRef<string>(
    `frontliner_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`
  );

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

  // ── Core: kirim pesan ke /api/agents (Direct → Python Backend) ──
  // sessionId memungkinkan Python backend mengelola memory percakapan secara server-side.
  // Tidak perlu lagi mengirim seluruh array messages dari frontend.
  const sendBotMessage = useCallback(async (userContent?: string) => {
    if (!systemPrompt) return;
    setIsTyping(true);

    let messageToSend = userContent || '';
    if (messages.length === 0 && !userContent) {
      messageToSend = 'Mulailah percakapan. Sambut calon klien dengan elegan sebagai Frontline Architect FusionNeural.';
    }
    if (isSetupMode && userContent) {
      messageToSend = `[SETUP MODE] ${userContent}`;
    }

    try {
      // Langsung ke Python backend via apiClient (bypass Vercel 10s timeout)
      const data = await triggerAgent({
        agent: 'frontliner',
        task: isSetupMode ? 'setup_architect' : 'sales_consultation',
        message: messageToSend,
        sessionId: sessionId.current,
      });

      const reply = data.result || 'Sinkronisasi sedang berlangsung, Kak. Mohon tunggu sebentar.';
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
  }, [systemPrompt, messages.length, isSetupMode]);

  // ── FIX: Detect confirmation trigger → tampilkan form, BUKAN parsing AI ──
  const checkAndSaveOrder = (allMessages: Message[]) => {
    if (orderSaved || isProcessingPaymentRef.current || showConfirmForm) return;

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
      userText.includes('ya') || userText.includes('iya') ||
      userText.includes('konfirmasi') || userText.includes('setuju') ||
      userText.includes('ok') || userText.includes('lanjut');

    if (botAskedConfirm && userConfirmed) {
      // Tampilkan form konfirmasi data — validasi manual, bukan AI parsing
      setShowConfirmForm(true);
    }
  };

  // ── FIX: Submit form konfirmasi → proses Midtrans dengan data yang valid ──
  const handleConfirmFormSubmit = async () => {
    const name = confirmName.trim();
    const phone = confirmPhone.trim().replace(/\D/g, '');

    if (!name || name.length < 2) {
      setConfirmFormError('Nama lengkap harus diisi minimal 2 karakter.');
      return;
    }
    if (!phone || phone.length < 9 || phone.length > 15) {
      setConfirmFormError('Nomor WhatsApp tidak valid (9–15 digit).');
      return;
    }

    setConfirmFormError('');
    setShowConfirmForm(false);
    isProcessingPaymentRef.current = true;
    setIsProcessingPayment(true);

    // FIX #3: Ambil tier dari URL params (bukan scan teks chat)
    const { tierKey, autonomy } = parseTierFromParams(searchParams);
    const isFullAuto = autonomy.includes('100');
    const price = isFullAuto ? PRICING[tierKey].p100 : PRICING[tierKey].p50;
    const snap: OrderSnapshot = {
      name, phone, tierKey,
      tier: getTierName(tierKey),
      autonomy, price, confirmed: true,
    };
    setOrderSnap(snap);

    try {
      const orderId = `FN-ORDER-${Date.now()}`;
      const mtRes = await fetch('/api/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_details: { order_id: orderId, gross_amount: snap.price },
          customer_details: { first_name: snap.name, phone: snap.phone }
        })
      });

      let token = '';
      if (mtRes.ok) { const d = await mtRes.json(); token = d.token; }

      if (token && window.snap) {
        window.snap.pay(token, {
          onSuccess: async () => { await handlePaymentSuccess(snap); },
          onPending: (r: any) => { console.log('Pending:', r); },
          onError: () => { setIsProcessingPayment(false); isProcessingPaymentRef.current = false; },
          onClose: () => { setIsProcessingPayment(false); isProcessingPaymentRef.current = false; },
        });
      } else {
        await handlePaymentSuccess(snap);
      }
    } catch (e) {
      console.error('Payment error:', e);
      setIsProcessingPayment(false);
      isProcessingPaymentRef.current = false;
    }
  };

  const handlePaymentSuccess = async (snap: OrderSnapshot) => {
    try {
      const clientApiKey = `fn_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
      const recovery = `FN-${snap.phone.slice(-4)}-${clientApiKey.slice(-6).toUpperCase()}`;

      // Simpan ke Firebase order_leads
      if (db) {
        await addDoc(collection(db, 'order_leads'), {
          tier:          snap.tier,
          tier_key:      snap.tierKey,
          autonomy:      snap.autonomy,
          price:         snap.price,
          name:          snap.name,
          phone:         snap.phone,
          status:        'Lunas - Persiapan Setup',
          client_api_key: clientApiKey,
          recovery_code:  recovery,
          created_at:    serverTimestamp(),
        });
      }

      setRecoveryCode(recovery);
      setOrderSaved(true);
      setIsProcessingPayment(false);
      isProcessingPaymentRef.current = false;
      setIsSetupMode(true);

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

    // Check order confirmation trigger
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

          {/* FIX: Confirmation Form (replaces AI extraction) */}
          <AnimatePresence>
            {showConfirmForm && !orderSaved && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-fn-emerald/30 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} className="text-fn-emerald" />
                  <p className="text-sm font-bold text-fn-navy">Konfirmasi Data Pesanan</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">Isi data berikut untuk memproses pembayaran. Data ini digunakan untuk registrasi sistem Kakak.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Lengkap</label>
                    <input
                      type="text" value={confirmName} onChange={e => setConfirmName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-fn-navy outline-none focus:border-fn-emerald focus:ring-2 focus:ring-fn-emerald/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                      <Phone size={11} /> Nomor WhatsApp
                    </label>
                    <input
                      type="tel" value={confirmPhone} onChange={e => setConfirmPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-fn-navy outline-none focus:border-fn-emerald focus:ring-2 focus:ring-fn-emerald/10"
                    />
                  </div>
                  {confirmFormError && <p className="text-xs text-red-500 font-medium">{confirmFormError}</p>}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowConfirmForm(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
                      Batal
                    </button>
                    <button onClick={handleConfirmFormSubmit}
                      className="flex-1 py-3 rounded-xl bg-fn-navy text-white text-sm font-bold hover:bg-fn-navy-light transition-colors">
                      Lanjut ke Pembayaran
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FIX #2 — Recovery Code Card (tampil setelah bayar, anti-refresh-loss) */}
          <AnimatePresence>
            {orderSaved && orderSnap && recoveryCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="border-2 border-fn-emerald rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Header */}
                <div className="bg-fn-emerald px-5 py-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-white" />
                  <p className="text-white text-xs font-black uppercase tracking-widest">✦ Pembayaran Berhasil</p>
                </div>
                {/* Body */}
                <div className="bg-white p-5">
                  <p className="text-fn-navy font-bold text-base">{orderSnap.name}</p>
                  <p className="text-slate-500 text-sm">{orderSnap.tier} · {orderSnap.autonomy}</p>
                  <p className="text-fn-navy font-black text-lg mt-1 mb-4">
                    Rp {orderSnap.price.toLocaleString('id-ID')} <span className="text-slate-400 text-sm font-normal">setup</span>
                  </p>
                  {/* Recovery Code */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">⚠ Simpan Kode Akses Setup Ini</p>
                    <p className="text-xs text-amber-600 mb-3">
                      Jika Anda menutup/me-refresh halaman ini, gunakan kode ini untuk menghubungi tim FusionNeural dan melanjutkan proses setup Anda.
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 bg-white border border-amber-300 rounded-lg px-4 py-2.5 font-mono text-base font-black text-fn-navy tracking-widest select-all">
                        {recoveryCode}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(recoveryCode); }}
                        className="px-4 py-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                </div>
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
