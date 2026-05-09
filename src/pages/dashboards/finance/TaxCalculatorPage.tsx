import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calculator, Percent, CheckCircle2, AlertTriangle, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

interface TaxResult {
  gross_revenue: number;
  ppn_rate: number;
  ppn_amount: number;
  pph_rate: number;
  pph_amount: number;
  net_after_tax: number;
  calculated_at: string;
  analysis_text?: string;
}

interface TaxLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

const PPN_RATE = 0.12;     // PPN 12% UU HPP 2025
const PPH_UMKM_RATE = 0.005; // PPh Final UMKM 0.5% dari omzet

export default function TaxCalculatorPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [taxLogs, setTaxLogs] = useState<TaxLog[]>([]);

  // Listen ke financial_reports/latest untuk data revenue terkini
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) setFinanceData(snap.data());
    });
    return () => unsub();
  }, []);

  // Finance Autopilot Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/simulator', { method: 'POST', body: JSON.stringify({ action: 'finance' }) })
        .catch(e => console.error("Finance simulator error:", e));
    }, 10000); // 10 detik setelah masuk halaman Finance, potong biaya operasional harian
    return () => clearTimeout(timer);
  }, []);

  // Listen ke activity_logs — tampilkan log Finance agen
  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setTaxLogs(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }) as TaxLog)
          .filter(l => l.agent === 'Finance' || l.agent === 'Admin')
      );
    });
    return () => unsub();
  }, []);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setSavedMsg('');
    try {
      const gross = financeData?.revenue ?? 15000000;
      const cost = financeData?.cost ?? 4500000;
      const apiCost = financeData?.api_cost ?? 350000;

      // Kalkulasi lokal
      const ppnAmount = gross * PPN_RATE;
      const pphAmount = gross * PPH_UMKM_RATE;
      const netAfterTax = gross - ppnAmount - pphAmount - cost - apiCost;

      // Minta AI Finance untuk analisis
      const context = `Kamu adalah AI Finance dari FusionNeural.
Data saat ini:
- Gross Revenue: Rp ${gross.toLocaleString('id-ID')}
- PPN 12%: Rp ${ppnAmount.toLocaleString('id-ID')}
- PPh Final UMKM 0.5%: Rp ${pphAmount.toLocaleString('id-ID')}
- Biaya Operasional: Rp ${cost.toLocaleString('id-ID')}
- Biaya API: Rp ${apiCost.toLocaleString('id-ID')}
- Net Setelah Pajak: Rp ${netAfterTax.toLocaleString('id-ID')}

Berikan ringkasan analisis pajak singkat (2-3 kalimat) dalam Bahasa Indonesia. Tanpa markdown bold.`;

      const aiText = await NeuralCore.askAgent('finance', 'master_calculator', context);

      // Hitung net_profit & ROI untuk ditulis ke financial_reports
      const netProfit = netAfterTax;
      const roi = cost > 0 ? Math.round(((gross - cost - apiCost) / (cost + apiCost)) * 100) : 0;

      const result: TaxResult = {
        gross_revenue: gross,
        ppn_rate: PPN_RATE * 100,
        ppn_amount: ppnAmount,
        pph_rate: PPH_UMKM_RATE * 100,
        pph_amount: pphAmount,
        net_after_tax: netAfterTax,
        calculated_at: new Date().toLocaleString('id-ID'),
        analysis_text: aiText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'),
      };
      setTaxResult(result);

      // ✅ Tulis ke Firestore → dibaca ExecutiveSummary (Manager) & MarketSignals (Marketing)
      await setDoc(doc(db, 'financial_reports', 'latest'), {
        revenue: gross,
        cost: cost,
        api_cost: apiCost,
        net_profit: netProfit,
        roi_percentage: roi,
        ppn_amount: ppnAmount,
        pph_amount: pphAmount,
        analysis_text: result.analysis_text,
        last_calculated: new Date().toISOString(),
      }, { merge: true });

      await FirebaseLogger.logAgentAction(
        'Finance',
        'TAX_CALCULATED',
        `PPN: Rp ${ppnAmount.toLocaleString('id-ID')} | PPh: Rp ${pphAmount.toLocaleString('id-ID')} | Net: Rp ${netAfterTax.toLocaleString('id-ID')}`
      );

      setSavedMsg('Laporan pajak tersimpan ke financial_reports — Manager & Marketing telah diberitahu.');
      setTimeout(() => setSavedMsg(''), 5000);
    } catch (e) {
      console.error(e);
      setSavedMsg('Gagal kalkulasi. Periksa koneksi API.');
    } finally {
      setIsCalculating(false);
    }
  };

  const grossRevenue = financeData?.revenue ?? 0;
  const estPPN = grossRevenue * PPN_RATE;
  const estPPh = grossRevenue * PPH_UMKM_RATE;
  const estNet = grossRevenue - estPPN - estPPh;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title="Tax Calculator"
        subtitle="
            Kalkulasi PPN 12% & PPh otomatis — hasil dikirim ke Manager & Marketing secara real-time
          "
        accent="emerald"
        actions={
          <>
            <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Calculator size={15} className={isCalculating ? 'animate-spin' : ''} />
          {isCalculating ? 'Menghitung...' : 'Hitung & Kirim ke Manager'}
        </button>
          </>
        }
      />

      {/* Koneksi Banner */}
      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
        <Zap size={13} className="text-blue-500 shrink-0" />
        <span>Output kalkulasi ini ditulis ke <code className="font-mono">financial_reports/latest</code> — otomatis dibaca oleh <strong>Executive Summary (Manager)</strong> dan <strong>Market Signals (Marketing)</strong></span>
      </div>

      {/* Estimasi Live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue', value: `Rp ${(grossRevenue / 1e6).toFixed(2)}M`, color: 'bg-slate-50 border-slate-200', icon: <TrendingUp size={15} className="text-slate-500" /> },
          { label: 'Est. PPN 12%', value: `Rp ${(estPPN / 1e3).toFixed(0)}K`, color: 'bg-amber-50 border-amber-200', icon: <Percent size={15} className="text-amber-500" /> },
          { label: 'Est. PPh 0.5%', value: `Rp ${(estPPh / 1e3).toFixed(0)}K`, color: 'bg-orange-50 border-orange-200', icon: <Percent size={15} className="text-orange-500" /> },
          { label: 'Est. Net Revenue', value: `Rp ${(estNet / 1e6).toFixed(2)}M`, color: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={15} className="text-emerald-500" /> },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 border shadow-sm ${item.color}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">{item.icon}{item.label}</div>
            <div className="text-xl font-black text-slate-800">{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Saved Success Message */}
      <AnimatePresence>
        {savedMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
          >
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-sm font-bold text-emerald-700">{savedMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hasil Kalkulasi */}
      <AnimatePresence>
        {taxResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest">
                Laporan Pajak — AI Finance · {taxResult.calculated_at}
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Breakdown Table */}
              <div className="space-y-3">
                {[
                  { label: 'Gross Revenue', value: `Rp ${taxResult.gross_revenue.toLocaleString('id-ID')}`, color: 'text-white' },
                  { label: `PPN (${taxResult.ppn_rate}%)`, value: `- Rp ${taxResult.ppn_amount.toLocaleString('id-ID')}`, color: 'text-amber-400' },
                  { label: `PPh UMKM (${taxResult.pph_rate}%)`, value: `- Rp ${taxResult.pph_amount.toLocaleString('id-ID')}`, color: 'text-orange-400' },
                  { label: 'Net Setelah Pajak', value: `Rp ${taxResult.net_after_tax.toLocaleString('id-ID')}`, color: 'text-emerald-400' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{row.label}</span>
                    <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* AI Analysis */}
              {taxResult.analysis_text && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator size={13} className="text-teal-400" />
                    <span className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">Analisis AI Finance</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{taxResult.analysis_text}</p>
                </div>
              )}
            </div>

            {/* Regulasi Tag */}
            <div className="px-6 pb-5 flex flex-wrap gap-2">
              {['UU HPP No.7/2021', 'PPN 12% (2025)', 'PPh Final UMKM 0.5%', 'SAK ETAP'].map(tag => (
                <span key={tag} className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/10 text-slate-400">{tag}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Histori Log Finance & Admin */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BookOpen size={12} /> Histori Aktivitas Finance & Admin ({taxLogs.length} entri)
        </h2>
        <div className="bg-[#0F172A] rounded-2xl p-4 h-64 overflow-y-auto space-y-2">
          {taxLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              Belum ada aktivitas. Jalankan kalkulasi pertama.
            </div>
          ) : taxLogs.map((log) => {
            const agentColor: Record<string, string> = {
              Finance: 'bg-emerald-500/20 text-emerald-400',
              Admin: 'bg-blue-500/20 text-blue-400',
            };
            return (
              <div key={log.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${agentColor[log.agent] || 'bg-slate-500/20 text-slate-400'}`}>
                  {log.agent}
                </span>
                <div className="min-w-0">
                  <p className="text-slate-300 text-xs font-medium truncate">{log.action}</p>
                  <p className="text-slate-600 text-[10px] truncate">{log.details}</p>
                </div>
                <span className="text-slate-600 text-[10px] ml-auto shrink-0">
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kewajiban Pajak Reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
      >
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Reminder Kewajiban Pajak</p>
          <p className="text-xs text-amber-700 mt-0.5">
            PPN dibayarkan paling lambat tanggal <strong>15 bulan berikutnya</strong>. PPh UMKM paling lambat tanggal <strong>15 bulan berikutnya</strong> setelah masa pajak berakhir. Dana cadangan pajak wajib disisihkan dari setiap transaksi.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
