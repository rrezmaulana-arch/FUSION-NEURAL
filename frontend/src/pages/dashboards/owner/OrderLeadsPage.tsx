/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import {
  Search, Filter, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
  Bot, GitMerge, Network, Zap, DollarSign, Key, Trash2, X, Loader2,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  created_at?: Timestamp | Date | number;
  createdAt?: Timestamp | Date | number; // legacy
  statusUpdatedAt?: Timestamp | Date | number;
}

type StatusValue = OrderLead['status'];

const ALL_STATUSES: StatusValue[] = [
  'Menunggu Konfirmasi',
  'Lunas - Persiapan Setup',
  'Diproses',
  'Selesai',
];

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const TIER_ICON: Record<string, React.ReactNode> = {
  tier1: <Bot size={12} />,
  tier2: <GitMerge size={12} />,
  tier3: <Network size={12} />,
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  'Menunggu Konfirmasi': { color: 'bg-slate-50 border-slate-200 text-slate-600', icon: <Clock size={12} /> },
  'Menunggu': { color: 'bg-slate-50 border-slate-200 text-slate-600', icon: <Clock size={12} /> },
  'Lunas - Persiapan Setup': { color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: <CheckCircle2 size={12} /> },
  'Diproses': { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: <AlertCircle size={12} /> },
  'Selesai': { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle2 size={12} /> },
};

const STATUS_COLORS: Record<string, string> = {
  'Selesai': 'text-emerald-600',
  'Diproses': 'text-amber-600',
  'Lunas - Persiapan Setup': 'text-indigo-600',
  'Menunggu Konfirmasi': 'text-slate-600',
  'Menunggu': 'text-slate-600',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convert Firestore Timestamp / Date / number → JS Date */
function toDate(raw: Timestamp | Date | number | undefined): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'number') return new Date(raw);
  // Firestore Timestamp
  if (typeof (raw as Timestamp).toDate === 'function') return (raw as Timestamp).toDate();
  return null;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Identitas Klien', 'Konfigurasi Sistem', 'Investasi', 'Timestamp', 'Status Sinkronisasi', 'Aksi'].map((h) => (
                <th key={h} className="px-6 py-4">
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-6 w-28 bg-slate-100 rounded-lg" /></td>
                <td className="px-6 py-4"><div className="h-6 w-6 bg-slate-100 rounded ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Toast notification */
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border ${
        type === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}
    >
      {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Status dropdown — click-based (mobile-friendly) */
function StatusDropdown({ leadId, currentStatus, onStatusChange }: {
  leadId: string;
  currentStatus: StatusValue;
  onStatusChange: (id: string, status: StatusValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['Menunggu'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${statusCfg.color}`}
      >
        {statusCfg.icon}
        {currentStatus}
        {open ? <ChevronUp size={12} className="opacity-50" /> : <ChevronDown size={12} className="opacity-50" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop untuk close saat klik di luar */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1"
            >
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(leadId, s); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-medium transition-colors ${
                    STATUS_COLORS[s] || 'text-slate-600'
                  } ${s === currentStatus ? 'bg-slate-50 font-bold' : ''}`}
                >
                  {s === currentStatus && '✓ '}{s}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function OrderLeadsPage() {
  const [leads, setLeads] = useState<OrderLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue | 'Semua'>('Semua');
  const [filterOpen, setFilterOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  /* ---- Auto-dismiss toast ---- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Real-time listener (single subscription) ---- */
  useEffect(() => {
    const q = query(collection(db, 'order_leads'), orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as OrderLead[];
        setLeads(data);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setToast({ message: 'Gagal memuat data dari server.', type: 'error' });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  /* ---- Update status + auto-timestamp ---- */
  const updateStatus = useCallback(async (id: string, status: StatusValue) => {
    try {
      await updateDoc(doc(db, 'order_leads', id), {
        status,
        statusUpdatedAt: Timestamp.now(),
      });
      setToast({ message: `Status diubah ke "${status}"`, type: 'success' });
    } catch (e) {
      console.error('Update status error:', e);
      setToast({ message: 'Gagal mengubah status. Coba lagi.', type: 'error' });
    }
  }, []);

  /* ---- Delete lead ---- */
  const deleteLead = useCallback(async (id: string, name: string) => {
    if (!confirm(`Hapus data klien "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteDoc(doc(db, 'order_leads', id));
      setToast({ message: `Data "${name}" berhasil dihapus.`, type: 'success' });
    } catch (e) {
      console.error('Delete error:', e);
      setToast({ message: 'Gagal menghapus data. Coba lagi.', type: 'error' });
    }
  }, []);

  /* ---- Derived data ---- */
  const filtered = leads.filter((l) => {
    // Text search
    const matchesSearch =
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm);
    // Status filter
    const matchesStatus = statusFilter === 'Semua' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    waiting: leads.filter((l) => l.status === 'Menunggu Konfirmasi' || l.status === 'Menunggu').length,
    processing: leads.filter((l) => l.status === 'Diproses').length,
    done: leads.filter((l) => l.status === 'Selesai').length,
  };

  // Revenue tercapai = sudah Selesai
  const revenueAchieved = leads
    .filter((l) => l.status === 'Selesai')
    .reduce((sum, l) => sum + (l.price || 0), 0);

  // Revenue pending = belum Selesai (Menunggu / Lunas / Diproses)
  const revenuePending = leads
    .filter((l) => l.status !== 'Selesai')
    .reduce((sum, l) => sum + (l.price || 0), 0);

  const activeFilterCount = statusFilter !== 'Semua' ? 1 : 0;

  /* ---- Render ---- */
  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <PageHeader
        title="Pemesanan Masuk"
        subtitle="Pusat monitoring prospek klien FusionNeural"
        accent="red"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
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

            {/* Filter by status */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`p-2.5 bg-white border rounded-xl text-slate-600 hover:bg-slate-50 transition-colors relative ${
                  activeFilterCount > 0 ? 'border-indigo-300 text-indigo-600' : 'border-slate-200'
                }`}
              >
                <Filter size={16} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-2"
                    >
                      <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter Status</p>
                      {(['Semua', ...ALL_STATUSES] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                            s === statusFilter ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'
                          }`}
                        >
                          {s === statusFilter && '✓ '}{s}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Prospek', value: stats.total, icon: Network, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Menunggu', value: stats.waiting, icon: Clock, color: 'bg-slate-50 text-slate-600' },
          { label: 'Diproses', value: stats.processing, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Selesai', value: stats.done, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
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

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {revenueAchieved > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gradient-to-r from-fn-emerald/10 to-teal-50 border border-fn-emerald/20 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-fn-emerald/15 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-fn-emerald" />
            </div>
            <div>
              <p className="text-xs text-fn-emerald font-bold uppercase tracking-widest">Revenue Tercapai</p>
              <p className="text-2xl font-black text-fn-navy">{fmt(revenueAchieved)}</p>
            </div>
          </motion.div>
        )}
        {revenuePending > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Revenue Pending</p>
              <p className="text-2xl font-black text-slate-800">{fmt(revenuePending)}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Active filter badge */}
      {statusFilter !== 'Semua' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-slate-500">Filter aktif:</span>
          <button
            onClick={() => setStatusFilter('Semua')}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full hover:bg-indigo-100 transition-colors"
          >
            {statusFilter}
            <X size={12} />
          </button>
        </motion.div>
      )}

      {/* Table / Loading / Empty */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
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
                  const tierLabel = lead.tier || lead.package || '—';
                  const autonomyLabel = lead.autonomy || '—';
                  const tierKey = lead.tierKey || '';
                  const createdDate = toDate(lead.created_at || lead.createdAt);

                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Identitas */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{lead.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{lead.phone}</p>
                      </td>

                      {/* Konfigurasi */}
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

                      {/* Investasi */}
                      <td className="px-6 py-4">
                        {lead.price
                          ? <span className="font-bold text-slate-800">{fmt(lead.price)}</span>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {createdDate ? createdDate.toLocaleString('id-ID') : 'Baru saja'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusDropdown
                          leadId={lead.id}
                          currentStatus={lead.status}
                          onStatusChange={updateStatus}
                        />
                        {lead.clientApiKey && (
                          <div className="mt-2 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-500 font-mono w-max border border-slate-200">
                            <Key size={10} className="text-slate-400" />
                            <span>{lead.clientApiKey}</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteLead(lead.id, lead.name)}
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
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      {searchTerm || statusFilter !== 'Semua'
                        ? 'Tidak ada data yang cocok dengan filter.'
                        : 'Belum ada pesanan masuk.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
