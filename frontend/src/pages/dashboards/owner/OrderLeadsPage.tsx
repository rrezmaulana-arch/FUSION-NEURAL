import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Search, Filter, CheckCircle2, Clock, AlertCircle, ChevronDown, Bot, GitMerge, Network, Zap, DollarSign, Key, Trash2 } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';

interface OrderLead {
  id: string;
  name: string;
  phone: string;
  tier?: string;
  tierKey?: string;
  autonomy?: string;
  price?: number;
  // Legacy field
  package?: string;
  status: 'Menunggu Konfirmasi' | 'Diproses' | 'Selesai' | 'Menunggu' | 'Lunas - Persiapan Setup';
  clientApiKey?: string;
  createdAt: any;
}

const TIER_ICON: Record<string, React.ReactNode> = {
  tier1: <Bot size={12} />,
  tier2: <GitMerge size={12} />,
  tier3: <Network size={12} />,
};

const STATUS_CONFIG = {
  'Menunggu Konfirmasi': { color: 'bg-slate-50 border-slate-200 text-slate-600', icon: <Clock size={12} /> },
  'Menunggu': { color: 'bg-slate-50 border-slate-200 text-slate-600', icon: <Clock size={12} /> },
  'Lunas - Persiapan Setup': { color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: <CheckCircle2 size={12} /> },
  'Diproses': { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: <AlertCircle size={12} /> },
  'Selesai': { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle2 size={12} /> },
};

export default function OrderLeadsPage() {
  const [leads, setLeads] = useState<OrderLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'order_leads'), orderBy('created_at', 'desc'));
    
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data as unknown as OrderLead[]);
    });
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data as unknown as OrderLead[]);
    });
      
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: OrderLead['status']) => {
    try {
      await updateDoc(doc(db, 'order_leads', id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLead = async (id: string) => {
    if (confirm('Apakah kamu yakin ingin menghapus data klien ini? Data tidak bisa dikembalikan.')) {
      try {
        await deleteDoc(doc(db, 'order_leads', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filtered = leads.filter(
    (l) =>
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm),
  );

  const totalRevenuePending = leads
    .filter((l) => l.status === 'Selesai')
    .reduce((sum, l) => sum + (l.price || 0), 0);

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title="Pemesanan Masuk"
        subtitle="Pusat monitoring prospek klien FusionNeural"
        accent="red"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau no. WA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-emerald-500/20 text-slate-800"
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Prospek', value: leads.length, icon: Network, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Menunggu', value: leads.filter((l) => l.status === 'Menunggu Konfirmasi' || l.status === 'Menunggu').length, icon: Clock, color: 'bg-slate-50 text-slate-600' },
          { label: 'Diproses', value: leads.filter((l) => l.status === 'Diproses').length, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Selesai', value: leads.filter((l) => l.status === 'Selesai').length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue closed */}
      {totalRevenuePending > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-fn-emerald/10 to-teal-50 border border-fn-emerald/20 rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-fn-emerald/15 rounded-xl flex items-center justify-center">
            <DollarSign size={20} className="text-fn-emerald" />
          </div>
          <div>
            <p className="text-xs text-fn-emerald font-bold uppercase tracking-widest">Revenue Terkunci (Selesai)</p>
            <p className="text-2xl font-black text-fn-navy">{fmt(totalRevenuePending)}</p>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Identitas Klien</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Konfigurasi Sistem</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Investasi</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status Sinkronisasi</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lead, i) => {
                const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG['Menunggu'];
                const tierLabel = lead.tier || lead.package || '—';
                const autonomyLabel = lead.autonomy || '—';
                const tierKey = lead.tierKey || '';
                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{lead.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{lead.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600">{TIER_ICON[tierKey] || <Bot size={12} className="text-indigo-400" />}</span>
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{tierLabel}</span>
                        </div>
                        {autonomyLabel !== '—' && (
                          <div className="flex items-center gap-1.5">
                            <Zap size={11} className="text-fn-emerald shrink-0" />
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              autonomyLabel.includes('100%')
                                ? 'bg-fn-navy/10 text-fn-navy'
                                : 'bg-fn-emerald/10 text-fn-emerald'
                            }`}>
                              {autonomyLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.price
                        ? <span className="font-bold text-slate-800">{fmt(lead.price)}</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleString('id-ID') : 'Baru saja'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group inline-block">
                        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {lead.status}
                          <ChevronDown size={12} className="opacity-50" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                          {(['Menunggu Konfirmasi', 'Lunas - Persiapan Setup', 'Diproses', 'Selesai'] as OrderLead['status'][]).map((s) => (
                            <button key={s} onClick={() => updateStatus(lead.id, s)}
                              className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-medium ${
                                s === 'Selesai' ? 'text-emerald-600' : s === 'Diproses' ? 'text-amber-600' : 'text-slate-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {lead.clientApiKey && (
                        <div className="mt-2 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-500 font-mono w-max border border-slate-200">
                          <Key size={10} className="text-slate-400" />
                          <span>{lead.clientApiKey}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Klien"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
