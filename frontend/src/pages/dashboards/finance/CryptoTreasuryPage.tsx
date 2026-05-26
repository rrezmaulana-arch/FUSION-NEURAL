import { Wallet, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

export default function CryptoTreasuryPage() {
  return (
    <div className="space-y-6 pb-10 font-['Outfit']">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
            <Wallet size={28} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide">Web3 Treasury</h1>
            <p className="text-indigo-200/60 text-sm tracking-widest uppercase mt-1">Autonomous Asset Management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck size={14} /> Smart Contract Vault
            </h3>
            <div className="text-3xl font-black text-white">0.00 USDC</div>
            <p className="text-xs text-slate-400 mt-2">Menunggu Finance AI melakukan auto-deposit dari laba bersih.</p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingUp size={14} /> Yield Farming (APY)
            </h3>
            <div className="text-3xl font-black text-white">4.2%</div>
            <p className="text-xs text-slate-400 mt-2">Dikelola secara otonom oleh Algoritma Defi.</p>
          </div>
        </div>

        <div className="mt-8 bg-black/40 rounded-xl p-5 border border-red-500/20 flex items-start gap-4">
          <AlertCircle className="text-red-400 shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1">FRAMEWORK MODE</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ini adalah kerangka dasar (Framework) untuk Otonomi Keuangan Eksternal. 
              Di versi berikutnya, sistem akan terhubung langsung ke Blockchain (Solana/Ethereum) menggunakan Web3.js, 
              memungkinkan Finance AI untuk benar-benar menabung secara otonom di luar jangkauan bank tradisional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
