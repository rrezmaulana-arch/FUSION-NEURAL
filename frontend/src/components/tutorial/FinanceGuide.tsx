import { BookOpen, Tags, Flame, Calculator } from 'lucide-react';

export default function FinanceGuide() {
  return (
    <div className="space-y-6 text-slate-300">
      <div className="bg-emerald-900/30 rounded-2xl p-5 border border-emerald-700/50">
        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2">Financial Vault</h3>
        <p className="text-sm leading-relaxed">
          Otoritas Keuangan dikonfirmasi. AI Finance bertugas menjaga profitabilitas secara ketat, menghitung pajak, dan memastikan arus kas tetap positif.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">① Profit Ledger</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Buku kas digital pusat. Mencatat setiap pemasukan riil dari simulator dan memotong seluruh pengeluaran operasional (seperti biaya API atau restock).</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Tags size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">② Pricing Strategy</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Tempat Anda mengatur harga jual dan diskon untuk setiap barang. Harga yang Anda setel di sini akan langsung digunakan oleh Simulator saat mencatat Revenue.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">③ Operational Burn</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Melacak "Burn Rate" perusahaan. Berapa biaya token AI yang dihabiskan Groq, biaya server Vercel, dll. Memastikan Anda tidak overbudget.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Calculator size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">④ Tax Calculator & Web3 Treasury</h4>
            <p className="text-xs text-slate-400 leading-relaxed">AI menghitung PPN 12% dan PPh. Selain itu, fitur eksperimental Web3 Treasury siap menyimpan aset tabungan perusahaan dalam USDC (Smart Contract).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
