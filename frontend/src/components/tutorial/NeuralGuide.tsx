/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, X, Brain, ChevronLeft, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TutorialStep {
  targetId?: string;
  title: string;
  text: string;
  isIntro?: boolean;
  isAction?: boolean;
}

// ── TUTORIAL DATA: All 28 pages, deep-dive per container ──
const TUTORIAL_DATA: Record<string, TutorialStep[]> = {
  manager: [
    { title: 'Neural Commander', text: 'Selamat datang, Sutradara. Saya adalah pemandu Sistem Saraf Pusat perusahaan Anda. Mari saya tunjukkan setiap modul dan fungsi utamanya.', isIntro: true },
    // ─ Workspace Dashboard ─
    { targetId: 'nav-home', title: '① Workspace Dashboard', text: 'Halaman utama Anda. Klik untuk melihat ringkasan operasional real-time.', isAction: true },
    { targetId: 'mgr-hero', title: 'Hero Metrics', text: 'Kartu utama menampilkan jumlah order yang diproses hari ini, Total Revenue, dan Company Budget — diperbarui real-time dari Firestore.' },
    { targetId: 'mgr-expenses', title: 'Total Expenses', text: 'Melacak seluruh biaya operasional yang dicatat oleh AI Finance. Termasuk biaya API, infrastruktur, dan restock otomatis.' },
    { targetId: 'mgr-performance', title: 'Operation Performance', text: 'Grafik bar bulanan menunjukkan tren volume pemrosesan. Data diambil dari collection orders di Firestore.' },
    { targetId: 'mgr-performers', title: 'Top Performers', text: 'Daftar tim dengan skor tertinggi. Klik untuk "ping" — mengirim notifikasi ke anggota tim tersebut.' },
    // ─ Agent Orchestrator ─
    { targetId: 'nav-orchestrator', title: '② Agent Orchestrator', text: 'Pusat komando AI. Klik untuk memantau semua agen yang bekerja secara simultan.', isAction: true },
    { targetId: 'ao-stats', title: 'Neural Metrics Bar', text: '"Active Now" menunjukkan berapa agen yang sedang memproses tugas. "AI Models" menghitung total model terdaftar di semua departemen.' },
    { targetId: 'ao-grid', title: 'Workstation Rooms', text: 'Setiap kartu mewakili departemen AI (Admin, Finance, Marketing, Core). Status LIVE/IDLE ditentukan oleh aktivitas 5 menit terakhir.' },
    { targetId: 'ao-logs', title: 'Global Event Stream', text: 'Terminal real-time yang mencatat setiap aksi agen — dari restock otomatis hingga generasi konten marketing.' },
    // ─ Executive Summary ─
    { targetId: 'nav-executive', title: '③ Executive Summary', text: 'Laporan eksekutif cerdas. Klik untuk melihat ringkasan finansial.', isAction: true },
    { targetId: 'summary-kpis', title: 'Financial KPIs', text: 'Net Profit dihitung otomatis: Revenue (termasuk order klien) dikurangi biaya operasional dan API cost. ROI gauge menunjukkan persentase imbal hasil.' },
    { targetId: 'summary-chart', title: 'Predictive Growth', text: 'AI memproyeksikan revenue 30 hari ke depan berdasarkan velocity stok dan konversi pesanan saat ini.' },
    // ─ Agent Health ─
    { targetId: 'nav-agent-health', title: '④ Agent Health Monitor', text: 'Pantau detak jantung setiap agen AI — uptime, token usage, dan response time.', isAction: true },
    // ─ Strategic Audit ─
    { targetId: 'nav-strategic-audit', title: '⑤ Strategic Audit Hub', text: 'Alat audit mendalam. AI memeriksa log aktivitas dan menyarankan perbaikan strategi atau prompt injection.', isAction: true },
    // ─ War Room ─
    { targetId: 'nav-war-room', title: '⑥ War Room Simulator', text: 'Simulasi krisis bisnis. Pilih skenario (stok habis, kompetitor agresif) dan lihat bagaimana AI merespons.', isAction: true },
    // ─ Neural Settings ─
    { targetId: 'nav-neural-settings', title: '⑦ Neural Settings', text: 'Konfigurasi otak bisnis. Atur margin target, budget cap, dan parameter yang mengontrol perilaku seluruh agen AI.', isAction: true },
    // ─ Neural Status ─
    { targetId: 'nav-status', title: '⑧ Neural Status', text: 'Monitor heartbeat sistem. Menampilkan status koneksi ke Groq API, Firestore, dan backend Python.', isAction: true },
  ],
  admin: [
    { title: 'Operational Protocol', text: 'Sistem Admin siap. Mari saya pandu mengelola infrastruktur logistik — dari inventory real-time hingga supplier cerdas.', isIntro: true },
    // ─ Inventory Tracker ─
    { targetId: 'nav-home', title: '① Inventory Tracker', text: 'Gudang digital Anda. Klik untuk memantau stok produk secara real-time.', isAction: true },
    // ─ Order Stream ─
    { targetId: 'nav-orders', title: '② Order Stream', text: 'Siklus hidup pesanan dari Pending hingga Delivered. Klik untuk melihat pipeline.', isAction: true },
    { targetId: 'order-pipeline', title: 'Pipeline Status', text: 'Empat tahap: Pending → Processing → Shipped → Delivered. Klik filter untuk menyaring. Tombol "AI Validate" memverifikasi pesanan secara otomatis.' },
    // ─ Supply Signals ─
    { targetId: 'nav-supply-signals', title: '③ Supply Signals', text: 'Radar stok otomatis. AI mendeteksi overstock dan restock alert.', isAction: true },
    { targetId: 'signal-feed', title: 'Signal Feed', text: 'Sinyal URGENT muncul saat stok melebihi 80% kapasitas (overstock) atau di bawah minimum. Tombol "Kirim Sinyal" mengirim instruksi ke Marketing Agent.' },
    { targetId: 'signal-trends', title: 'Trend Correlation', text: 'Menampilkan produk terlaris berdasarkan velocity penjualan. Marketing disarankan fokus pada produk dengan bar tertinggi.' },
    { targetId: 'signal-health', title: 'Inventory Health', text: 'Gauge melingkar menunjukkan kesehatan stok keseluruhan. Di bawah 50% berarti banyak produk kritis.' },
    // ─ Supplier Hub ─
    { targetId: 'nav-suppliers', title: '④ Supplier Hub', text: 'Kelola rantai pasok. AI Scout mencari supplier baru dengan harga terbaik menggunakan database eksternal.', isAction: true },
    // ─ Marketplace Simulator ─
    { targetId: 'nav-marketplace-sim', title: '⑤ Marketplace Simulator', text: 'Simulasi penjualan multi-platform (TikTok Shop, Tokopedia, Shopee). AI menggenerasi pesanan fiktif untuk stress-test.', isAction: true },
    // ─ System Logs ─
    { targetId: 'nav-logs', title: '⑥ System Logs', text: 'Riwayat traffic dan event log sistem. Bisa diekspor ke Google Drive sebagai dokumen.', isAction: true },
  ],
  finance: [
    { title: 'Financial Vault', text: 'Otoritas Keuangan dikonfirmasi. Mari tinjau bagaimana AI mengelola pajak, ROI, dan transparansi anggaran.', isIntro: true },
    // ─ Profit Ledger ─
    { targetId: 'nav-home', title: '① Profit Ledger', text: 'Buku kas digital. Mencatat setiap rupiah masuk dan keluar.', isAction: true },
    { targetId: 'ledger-kpis', title: 'KPI Keuangan', text: 'Net Profit (hero card) dihitung dari Gross Revenue dikurangi COGS. ROI gauge dan grafik arus kas membantu melihat tren harian.' },
    // ─ Operational Burn ─
    { targetId: 'nav-burn', title: '② Operational Burn', text: 'Pemantau biaya infrastruktur. Melacak setiap tetes pengeluaran sistem.', isAction: true },
    { targetId: 'burn-gauge', title: 'Burn Monitor', text: 'Gauge menampilkan total biaya vs budget cap. Merah = over budget. Breakdown menunjukkan biaya per layanan (Groq API, Firebase, Vercel).' },
    // ─ ROI Intelligence ─
    { targetId: 'nav-roi-intel', title: '③ ROI Intelligence', text: 'Menilai imbal hasil per platform marketplace. Data real dari Marketplace Simulator.', isAction: true },
    // ─ Financial Policy ─
    { targetId: 'nav-policy', title: '④ Financial Policy', text: 'Blueprint kebijakan finansial. Atur margin target, budget cap, PPN, dan dana darurat yang diterapkan ke semua agen.', isAction: true },
    // ─ Tax Calculator ─
    { targetId: 'nav-tax-calc', title: '⑤ Tax Calculator', text: 'Kalkulator pajak otomatis (PPN 12% UU HPP, PPh UMKM 0.5%). AI memisahkan kewajiban pajak secara akurat.', isAction: true },
    // ─ World Money Tracker ─
    { targetId: 'nav-world-money', title: '⑥ World Money Tracker', text: 'Kurs mata uang & komoditi dunia (Gold, Oil, Bitcoin) secara real-time via Massive API. Auto-refresh setiap 60 detik.', isAction: true },
  ],
  marketing: [
    { title: 'Creative Forge', text: 'Sinyal Kreatif terdeteksi. Saya pandu Anda menggunakan AI untuk riset pasar, aset visual, hingga copywriting viral.', isIntro: true },
    // ─ Campaign Forge ─
    { targetId: 'nav-home', title: '① Campaign Forge', text: 'Asisten copywriter AI. Pilih tone (Premium/Visioner/Minimalis) dan format, lalu AI menyusun konten.', isAction: true },
    // ─ Market Signals ─
    { targetId: 'nav-signals', title: '② Market Signals', text: 'Radar tren. AI mendeteksi overstock & low stock dari inventory, lalu menyarankan aksi marketing otomatis.', isAction: true },
    // ─ Image Studio ─
    { targetId: 'nav-image-studio', title: '③ Image Studio', text: 'Studio foto AI. Ketik prompt dan model FLUX.1 menggenerasi aset visual produk dalam hitungan detik.', isAction: true },
    // ─ Content Launchpad ─
    { targetId: 'nav-launchpad', title: '④ Content Launchpad', text: 'Jadwalkan posting ke Instagram, TikTok, Web. Upload media, atur slot waktu, dan kelola approval.', isAction: true },
    // ─ Conversion Feedback ─
    { targetId: 'nav-conversion', title: '⑤ Conversion Feedback', text: 'Analisis konversi per platform marketplace. AI memberikan rekomendasi: lanjutkan, optimasi, atau hentikan kampanye.', isAction: true },
    // ─ Brand DNA ─
    { targetId: 'nav-brand-dna', title: '⑥ Brand DNA', text: 'Konfigurasi identitas brand. Persona, visi, dan estetika visual yang menjadi "otak" AI Marketing.', isAction: true },
    // ─ Launch Simulator ─
    { targetId: 'nav-launch-sim', title: '⑦ Launch Simulator', text: 'Simulasi peluncuran kampanye multi-platform. Lihat views, likes, shares bertambah real-time.', isAction: true },
  ],
  owner: [
    { title: 'Owner Command', text: 'Selamat datang, Owner. Dashboard Anda fokus pada monitoring prospek klien dan revenue pipeline.', isIntro: true },
    { targetId: 'nav-home', title: '① Pemesanan Masuk', text: 'Pusat monitoring prospek klien FusionNeural. Lihat status (Menunggu → Diproses → Selesai), tier konfigurasi, dan revenue terkunci.', isAction: true },
  ],
};

export function NeuralGuide() {
  const { currentUser, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const role = userRole || 'manager';
  const steps = TUTORIAL_DATA[role] || TUTORIAL_DATA.manager;
  const step = steps[currentStep];

  const accentColor = role === 'manager' ? '#14b8a6' :
                      role === 'admin' ? '#6366f1' :
                      role === 'finance' ? '#f59e0b' :
                      role === 'marketing' ? '#ec4899' : '#ef4444';

  // ── Typewriter ──
  useEffect(() => {
    if (!isOpen || !step) return;
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(step.text.slice(0, i + 1));
      i++;
      if (i >= step.text.length) { clearInterval(interval); setIsTyping(false); }
    }, 12);
    return () => clearInterval(interval);
  }, [currentStep, isOpen, step]);

  // ── Track Target (Neon Trace — NO dark overlay) ──
  useEffect(() => {
    if (!isOpen || !step || step.isIntro) { setTargetRect(null); return; }
    const updatePosition = () => {
      const el = document.getElementById(step.targetId || '');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
      } else {
        setTargetRect(null);
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); };
  }, [currentStep, isOpen, step]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep(p => p + 1);
    else { setIsOpen(false); setCurrentStep(0); }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(p => p - 1);
  }, [currentStep]);

  if (!currentUser) return null;

  const isTargetAtBottom = targetRect ? targetRect.top > window.innerHeight * 0.5 : false;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* ── FAB Button ── */}
      <motion.button
        onClick={() => { setIsOpen(true); setCurrentStep(0); }}
        whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${accentColor}60` }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[500] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md"
        style={{ background: `linear-gradient(135deg, ${accentColor}, #0f172a)` }}
      >
        <BookOpen size={22} color="#fff" />
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 rounded-full border border-white/20" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden font-sans">

            {/* ── INTRO MODE ── */}
            <AnimatePresence>
              {step.isIntro && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1100] flex items-center justify-center p-6 pointer-events-auto"
                  style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(16px)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: accentColor }} />
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-xl bg-[#0a0f1e]/90 border border-white/10 rounded-[32px] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="flex flex-col items-center text-center relative z-10">
                      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 5 }}
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
                        style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40` }}
                      >
                        <BookOpen size={36} style={{ color: accentColor }} />
                      </motion.div>
                      <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-5 inline-block"
                        style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
                      >Neural Live Manual</div>
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-5 tracking-tight">{step.title}</h2>
                      <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">{displayedText}</p>
                      <button onClick={handleNext}
                        className="group px-10 py-4 rounded-2xl text-white text-sm font-black tracking-[0.2em] flex items-center gap-3 relative overflow-hidden shadow-xl"
                        style={{ background: accentColor }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 uppercase">Mulai Panduan</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── SPOTLIGHT MODE (No overlay — Neon Trace only) ── */}
            {!step.isIntro && (
              <>
                {/* Neon Trace Glow Ring */}
                {targetRect && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-[1100] rounded-2xl pointer-events-none"
                    style={{
                      top: targetRect.top - 8,
                      left: targetRect.left - 8,
                      width: targetRect.width + 16,
                      height: targetRect.height + 16,
                      boxShadow: `0 0 0 3px ${accentColor}, 0 0 30px ${accentColor}35, inset 0 0 20px ${accentColor}10`,
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 border-2 rounded-2xl"
                      style={{ borderColor: accentColor }}
                    />
                    {/* Corner accents */}
                    {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-3 h-3`}>
                        <div className="w-full h-full rounded-sm" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* HUD Dialogue Bar */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: isTargetAtBottom ? -15 : 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-[1200] pointer-events-auto"
                  style={{ top: isTargetAtBottom ? '4%' : 'auto', bottom: isTargetAtBottom ? 'auto' : '4%' }}
                >
                  <div className="bg-[#0c1120]/95 border border-white/10 rounded-[24px] p-5 md:p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full"
                        style={{ background: accentColor }}
                      />
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
                      >
                        {step.isAction ? <Zap size={20} style={{ color: accentColor }} /> : <Brain size={20} style={{ color: accentColor }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accentColor }}>{step.title}</span>
                          <span className="text-[10px] font-bold text-slate-500">{currentStep + 1} / {steps.length}</span>
                        </div>
                        <p className="text-slate-200 text-sm md:text-base font-medium leading-relaxed mb-5">
                          {displayedText}
                          {isTyping && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} className="inline-block w-1.5 h-5 ml-1 align-middle" style={{ background: accentColor }} />}
                        </p>

                        <div className="flex items-center gap-3">
                          {currentStep > 0 && (
                            <button onClick={handlePrev} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-all flex items-center gap-1.5">
                              <ChevronLeft size={14} /> Kembali
                            </button>
                          )}
                          <button onClick={handleNext}
                            className="px-6 py-2.5 rounded-xl text-white text-xs font-black tracking-wider flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-lg"
                            style={{ background: accentColor }}
                          >
                            {currentStep === steps.length - 1 ? 'SELESAI' : 'LANJUT'}
                            <ChevronRight size={14} />
                          </button>
                          <button onClick={() => setIsOpen(false)} className="ml-auto w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NeuralGuide;
