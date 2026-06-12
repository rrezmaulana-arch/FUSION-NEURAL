/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, ShieldCheck, Wallet, Building2, Clock } from 'lucide-react';

interface CustomCheckoutProps {
  orderData: {
    orderId: string;
    amount: number;
    name: string;
    phone: string;
    tier: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = 'bca' | 'mandiri' | 'bni' | 'bri' | 'gopay' | 'qris' | null;

export const CustomCheckout: React.FC<CustomCheckoutProps> = ({ orderData, onSuccess, onCancel }) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [step, setStep] = useState<'select' | 'process' | 'result'>('select');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return { h: h.toString().padStart(2, '0'), m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') };
  };

  const time = formatTime(timeLeft);
  const isDangerTime = timeLeft < 300; // Less than 5 mins

  const handleProcessPayment = async () => {
    if (!method) return;
    setStep('process');

    const isEwallet = method === 'gopay' || method === 'qris';
    const paymentType = method === 'qris' ? 'qris' : method === 'gopay' ? 'gopay' : method === 'mandiri' ? 'echannel' : 'bank_transfer';
    const bank = isEwallet ? null : method;

    try {
      const response = await fetch('/api/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_type: paymentType,
          bank: bank,
          order_id: orderData.orderId,
          gross_amount: orderData.amount,
          first_name: orderData.name,
          phone: orderData.phone,
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentResult(data);
        setStep('result');
      } else {
        console.error('Charge error:', data);
        showFeedback('error', 'Gagal memproses pembayaran. Cek akun Sandbox.');
        setStep('select');
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Terjadi kesalahan jaringan.');
      setStep('select');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex overflow-y-auto bg-slate-50 font-inter text-slate-800"
    >
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-screen">

        {/* Left Column: Payment Methods / Result */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {step === 'select' ? 'Select Payment Method' : 'Detail Pembayaran'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {step === 'select' ? 'Pilih opsi pembayaran yang paling nyaman untuk Anda.' : 'Selesaikan pembayaran sebelum batas waktu berakhir.'}
              </p>
            </div>
            {step === 'select' && (
              <div className="bg-slate-200/50 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                Order ID: #{orderData.orderId.split('-').pop()}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Virtual Account Section */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                    <Building2 size={16} /> Bank Transfer (Virtual Account)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MethodCard id="bca" title="BCA Virtual Account" label="BCA" selected={method} onSelect={setMethod} />
                    <MethodCard id="mandiri" title="Mandiri Virtual Account" label="MDR" selected={method} onSelect={setMethod} />
                    <MethodCard id="bni" title="BNI Virtual Account" label="BNI" selected={method} onSelect={setMethod} />
                    <MethodCard id="bri" title="BRI Virtual Account" label="BRI" selected={method} onSelect={setMethod} />
                  </div>
                </div>

                {/* E-Wallet Section */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                    <Wallet size={16} /> E-Wallet & QRIS
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <MethodSquare id="gopay" title="GoPay" icon="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" selected={method} onSelect={setMethod} />
                    <MethodSquare id="qris" title="QRIS" icon="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" selected={method} onSelect={setMethod} />
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={onCancel}
                    className="mr-4 px-6 py-3 rounded-xl text-slate-500 font-semibold hover:bg-slate-200/50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={!method}
                    className="px-8 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all disabled:opacity-30 shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                  >
                    Lanjutkan Pembayaran
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'process' && (
              <motion.div
                key="process"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(100,150,200,0.05)]"
              >
                <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-800">Memproses Kredensial...</h3>
                <p className="text-slate-500 mt-2">Menyiapkan jalur pembayaran aman untuk Anda.</p>
              </motion.div>
            )}

            {step === 'result' && paymentResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(100,150,200,0.05)] overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 font-bold border border-sky-100">
                      {paymentResult.bank ? paymentResult.bank.toUpperCase() : 'QR'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {paymentResult.bank ? `${paymentResult.bank.toUpperCase()} Virtual Account` : 'QRIS / E-Wallet'}
                      </h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <ShieldCheck size={12} className="text-purple-500" /> Automatic Verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50/50">
                  {paymentResult.va_number || paymentResult.biller_code ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor Virtual Account</p>
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <span className="text-3xl font-mono text-slate-800 tracking-[0.2em] font-semibold">
                          {paymentResult.va_number || `${paymentResult.biller_code}${paymentResult.bill_key}`}
                        </span>
                        <button
                          onClick={() => handleCopy(paymentResult.va_number || `${paymentResult.biller_code}${paymentResult.bill_key}`)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          {copied ? <CheckCircle2 size={16} className="text-purple-500" /> : <Copy size={16} />}
                          {copied ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>
                  ) : paymentResult.qr_url ? (
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Scan QR Code</p>
                      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-[0_0_40px_rgba(56,189,248,0.15)] relative">
                        <div className="absolute -inset-2 border border-sky-200/50 rounded-[32px] animate-pulse pointer-events-none"></div>
                        <img src={paymentResult.qr_url} alt="QR Code" className="w-56 h-56 object-contain relative z-10" />
                      </div>
                    </div>
                  ) : paymentResult.actions ? (
                    <div className="flex flex-col items-center">
                       <a href={paymentResult.actions[1]?.url || paymentResult.actions[0]?.url} target="_blank" rel="noreferrer" className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition-colors">
                         Buka Aplikasi Pembayaran
                       </a>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500">Kredensial tidak ditemukan. Harap hubungi support.</p>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-200/60">
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Pembayaran</p>
                     <p className="text-3xl font-bold text-slate-800">Rp {parseInt(paymentResult.gross_amount).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="p-8 bg-white border-t border-slate-100">
                  <button
                    onClick={onSuccess}
                    className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                  >
                    Simulasikan Sukses (Dev)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Summary & Countdown */}
        <div className="w-full lg:w-[380px] shrink-0 space-y-6">
          {/* Countdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_20px_50px_rgba(100,150,200,0.05)]">
            <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-4">
              <Clock size={16} /> Complete payment in
            </h3>
            <div className="flex items-center justify-center gap-2">
              <TimeUnit value={time.h} label="HOURS" isDanger={isDangerTime} />
              <span className="text-xl font-bold text-slate-300 pb-5">:</span>
              <TimeUnit value={time.m} label="MINS" isDanger={isDangerTime} />
              <span className="text-xl font-bold text-slate-300 pb-5">:</span>
              <TimeUnit value={time.s} label="SECS" isDanger={isDangerTime} />
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_20px_50px_rgba(100,150,200,0.05)]">
            <h3 className="text-base font-bold text-slate-800 mb-6">Order Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Package Tier</span>
                <span className="text-slate-800 font-semibold">{orderData.tier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800 font-semibold">Rp {orderData.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service Fee</span>
                <span className="text-purple-500 font-semibold">Free</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Amount</span>
              <span className="text-xl font-bold text-slate-800">Rp {orderData.amount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex gap-3 text-xs text-slate-400 items-start p-2">
            <ShieldCheck size={16} className="shrink-0 text-purple-500 mt-0.5" />
            <p>PCI DSS Compliant. Your transaction is encrypted and secure via Midtrans Gateway.</p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const MethodCard = ({ id, title, label, selected, onSelect }: { id: PaymentMethod, title: string, label: string, selected: PaymentMethod, onSelect: (v: PaymentMethod) => void }) => {
  const isSelected = selected === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[0.98] ${
        isSelected 
          ? 'bg-sky-50/50 border-sky-400 shadow-[0_10px_20px_rgba(56,189,248,0.1)]' 
          : 'bg-white border-slate-100 hover:shadow-[0_10px_20px_rgba(100,150,200,0.05)]'
      }`}
    >
      <div className={`w-12 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
        {label}
      </div>
      <span className={`font-semibold text-sm text-left ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
        {title}
      </span>
    </button>
  );
};

const MethodSquare = ({ id, title, icon, selected, onSelect }: { id: PaymentMethod, title: string, icon: string, selected: PaymentMethod, onSelect: (v: PaymentMethod) => void }) => {
  const isSelected = selected === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:scale-[0.98] ${
        isSelected 
          ? 'bg-sky-50/50 border-sky-400 shadow-[0_10px_20px_rgba(56,189,248,0.1)]' 
          : 'bg-white border-slate-100 hover:shadow-[0_10px_20px_rgba(100,150,200,0.05)]'
      }`}
    >
      <img src={icon} alt={title} className="h-8 object-contain" />
      <span className={`font-semibold text-xs ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
        {title}
      </span>
    </button>
  );
};

const TimeUnit = ({ value, label, isDanger }: { value: string, label: string, isDanger: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-mono font-light shadow-sm ${isDanger ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-800 text-white'}`}>
      {value}
    </div>
    <span className="text-[10px] font-bold text-slate-400 mt-2">{label}</span>
  </div>
);

