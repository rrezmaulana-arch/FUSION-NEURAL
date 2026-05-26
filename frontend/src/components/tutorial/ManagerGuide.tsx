import { Network, TrendingUp, Shield, Activity } from 'lucide-react';

export default function ManagerGuide() {
  return (
    <div className="space-y-6 text-slate-300">
      <div className="bg-indigo-900/30 rounded-2xl p-5 border border-indigo-700/50">
        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Neural Commander</h3>
        <p className="text-sm leading-relaxed">
          Selamat datang, Sutradara. Anda memegang kendali tertinggi. Pusat ini memungkinkan Anda melihat seluruh orkestrasi agen AI, menyeting arah bisnis, dan mengaudit setiap gerak-gerik perusahaan.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Network size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">① Agent Orchestrator</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Pusat komando utama! Terdapat status live semua agen (Admin, Finance, Marketing). Anda juga dapat melihat Global Logs (Sistem Syaraf) yang terus mengalir dari Firebase saat agen beraksi.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">② Executive Summary</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Laporan finansial dan operasional tingkat C-Level. Dibuat langsung oleh Manager AI berdasarkan insight dari agen Finance dan Admin.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">③ Strategic Audit Hub & Voice Override</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Halaman kunci! Tempat Anda bisa menegur Manager AI. Terdapat fitur <strong>Biometric Voice Override</strong>, gunakan suara Anda (Chrome) untuk mengirim perintah darurat ke otak AI.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">④ Neural Settings</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Aktifkan <strong>Autonomous Mode</strong> di sini. Jika aktif, "Detak Jantung" (Python Backend) akan terus melakukan audit finansial otomatis meskipun tidak ada klik dari Anda (Cyber-Defense).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
