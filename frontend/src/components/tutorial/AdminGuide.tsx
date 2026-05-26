import { Package, ShoppingCart, ClipboardList, AlertTriangle } from 'lucide-react';

export default function AdminGuide() {
  return (
    <div className="space-y-6 text-slate-300">
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Operational Protocol</h3>
        <p className="text-sm leading-relaxed">
          Sistem Admin siap. Mari saya pandu mengelola infrastruktur logistik — dari inventory real-time hingga supplier cerdas.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Package size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">① Inventory Tracker</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Gudang digital Anda. Memantau stok produk secara real-time. Jika stok menipis, AI Admin secara otomatis membuat log dan mengirimkan notifikasi restock.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <ShoppingCart size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">② Order Stream & Pipeline</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Siklus hidup pesanan dari Pending hingga Delivered. AI memvalidasi pesanan secara otomatis (mencegah double order) sebelum dikirim.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <ClipboardList size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">③ Supply Signals</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Radar stok otomatis. Mendeteksi tren (barang laku keras vs dead stock). AI menyarankan Anda kapan waktu yang tepat untuk melakukan Purchase Order (PO).</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">④ E-Commerce Simulator</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Mesin simulasi penjualan (TikTok, Shopee). Menggenerasi ribuan pesanan secara langsung yang men-trigger seluruh departemen (mengurangi stok, menambah uang di finance).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
