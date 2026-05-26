import { Sparkles, CalendarDays, Image, TrendingUp } from 'lucide-react';

export default function MarketingGuide() {
  return (
    <div className="space-y-6 text-slate-300">
      <div className="bg-purple-900/30 rounded-2xl p-5 border border-purple-700/50">
        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-2">Creative Forge</h3>
        <p className="text-sm leading-relaxed">
          Sinyal Kreatif terdeteksi. Saya pandu Anda menggunakan AI untuk riset pasar, membuat aset visual, hingga copywriting persuasif.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">① Campaign Forge & Generative UI</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Studio kreasi! Minta AI menyusun copywriting (Instagram/TikTok). Fitur Generative UI memungkinkan AI merender komponen visual HTML secara live di layar Anda.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">② Content Launchpad</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Draf kalender tayang. Seluruh kampanye yang di-generate AI akan disimpan di sini. Anda bisa mengatur jadwal tayang sebelum dilempar ke media sosial riil (opsional).</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Image size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">③ Image Studio</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Integrasi pembuatan gambar (opsional via model Flux). AI dapat merekomendasikan referensi prompt gambar berdasarkan tren produk di inventory.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">④ Performance Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Melacak seberapa bagus efek kampanye AI terhadap peningkatan penjualan di Simulator. (Sistem akan mengukur CTR dan konversi pesanan).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
