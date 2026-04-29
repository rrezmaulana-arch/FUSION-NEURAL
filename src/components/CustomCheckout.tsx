import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Copy, CheckCircle2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

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

type PaymentMethod = 'va_bca' | 'va_mandiri' | 'va_bni' | 'qris' | null;

export const CustomCheckout: React.FC<CustomCheckoutProps> = ({ orderData, onSuccess, onCancel }) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  const handleProcessPayment = async () => {
    if (!method) return;
    setIsCharging(true);

    const isQris = method === 'qris';
    const paymentType = isQris ? 'qris' : 'bank_transfer';
    const bank = isQris ? null : method.replace('va_', '');

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
      } else {
        console.error('Charge error:', data);
        alert('Gagal memproses pembayaran. Silakan coba lagi.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsCharging(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePaymentCompletion = () => {
    setSimulatedSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Premium Glassmorphism Background */}
      <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fn-emerald/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-[#0d1323]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-fn-emerald" size={20} />
              Secure Checkout
            </h2>
            <p className="text-slate-400 text-sm mt-1">{orderData.tier} Package</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Pembayaran</p>
            <p className="text-lg font-black text-fn-emerald">Rp {orderData.amount.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!paymentResult && !isCharging && (
              <motion.div
                key="select-method"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Pilih Metode Pembayaran</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <MethodCard id="va_bca" title="BCA Virtual Account" icon={<CreditCard size={18} />} selected={method} onSelect={setMethod} />
                  <MethodCard id="va_mandiri" title="Mandiri Virtual Account" icon={<CreditCard size={18} />} selected={method} onSelect={setMethod} />
                  <MethodCard id="va_bni" title="BNI Virtual Account" icon={<CreditCard size={18} />} selected={method} onSelect={setMethod} />
                  <MethodCard id="qris" title="QRIS (GoPay, OVO, Dana)" icon={<QrCode size={18} />} selected={method} onSelect={setMethod} />
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={!method}
                    className="flex-1 py-3.5 rounded-xl bg-fn-emerald text-white font-bold hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:hover:bg-fn-emerald shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2"
                  >
                    Lanjutkan <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {isCharging && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-700 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-fn-emerald rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                </div>
                <h3 className="text-lg font-bold text-white mt-6 tracking-wide">Menghasilkan Kredensial...</h3>
                <p className="text-slate-400 text-sm mt-2 text-center">Menghubungkan ke secure gateway Midtrans</p>
              </motion.div>
            )}

            {paymentResult && !simulatedSuccess && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                {paymentResult.payment_type === 'bank_transfer' ? (
                  <div className="w-full">
                    <p className="text-slate-400 text-sm text-center mb-2">Virtual Account {paymentResult.bank.toUpperCase()}</p>
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-6 relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <h1 className="text-3xl font-black text-white text-center tracking-widest font-mono">
                        {paymentResult.va_number}
                      </h1>
                      <button
                        onClick={() => handleCopy(paymentResult.va_number)}
                        className="mt-4 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-fn-emerald font-semibold flex items-center justify-center gap-2 border border-white/5 transition-all"
                      >
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {copied ? 'Berhasil Disalin!' : 'Salin Nomor VA'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <p className="text-slate-400 text-sm text-center mb-4">Scan QRIS menggunakan M-Banking / E-Wallet</p>
                    {/* Tech Interface Decorator Frame */}
                    <div className="relative p-2 bg-gradient-to-br from-fn-emerald/40 to-blue-500/40 rounded-3xl mb-6 shadow-[0_0_40px_rgba(20,184,166,0.2)]">
                      <div className="absolute -inset-1 border border-fn-emerald/30 rounded-[28px] animate-pulse"></div>
                      <div className="bg-white p-4 rounded-2xl relative z-10">
                        <img src={paymentResult.qr_url} alt="QRIS Code" className="w-48 h-48 object-contain" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-sm text-center w-full mb-6">
                  Setelah melakukan pembayaran, sistem akan otomatis melakukan verifikasi.
                </div>

                <button
                  onClick={handleSimulatePaymentCompletion}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Simulasikan Pembayaran Sukses (Dev)
                </button>
              </motion.div>
            )}

            {simulatedSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 bg-fn-emerald rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(20,184,166,0.5)]"
                >
                  <CheckCircle2 size={48} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Pembayaran Berhasil!</h2>
                <p className="text-slate-400 text-center">Mengarahkan ke AI Setup Architect...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MethodCard = ({ id, title, icon, selected, onSelect }: { id: PaymentMethod, title: string, icon: React.ReactNode, selected: PaymentMethod, onSelect: (v: PaymentMethod) => void }) => {
  const isSelected = selected === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
        isSelected 
          ? 'bg-fn-emerald/10 border-fn-emerald shadow-[0_0_20px_rgba(20,184,166,0.15)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-fn-emerald text-white' : 'bg-white/10 text-slate-300'}`}>
        {icon}
      </div>
      <span className={`font-semibold text-left ${isSelected ? 'text-white' : 'text-slate-300'}`}>
        {title}
      </span>
      {isSelected && (
        <motion.div layoutId="check" className="ml-auto text-fn-emerald">
          <CheckCircle2 size={20} />
        </motion.div>
      )}
    </button>
  );
};
