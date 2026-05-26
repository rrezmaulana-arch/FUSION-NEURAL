/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, AlertTriangle, ChevronRight, Brain, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer?: string;
  platform?: string;
  items?: { name: string; qty: number }[];
  total?: number;
  status?: OrderStatus;
  tracking?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: ReactElement }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-700', icon: <Brain size={11} /> },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-700', icon: <Truck size={11} /> },
  delivered: { label: 'Terima', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} /> },
  cancelled: { label: 'Batal', color: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={11} /> },
};

const PIPELINE: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderStreamPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [validating, setValidating] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
    });
    return () => unsub();
  }, []);

  const handleAdvance = async (order: Order) => {
    const idx = PIPELINE.indexOf(order.status as OrderStatus);
    if (idx < 0 || idx >= PIPELINE.length - 1) return;
    const nextStatus = PIPELINE[idx + 1];
    await updateDoc(doc(db, 'orders', order.id), { status: nextStatus });
    await FirebaseLogger.logAgentAction('Admin', 'ORDER_ADVANCED', `Order #${order.id.slice(0, 8)} → ${nextStatus}`);
  };

  const handleAutoValidate = async (order: Order) => {
    setValidating(order.id);
    try {
      await NeuralCore.processAdminOrder(
        { id: order.id, items: order.items || [], total: order.total || 0 },
        []
      );
      await updateDoc(doc(db, 'orders', order.id), { status: 'processing', validated: true });
      await FirebaseLogger.logAgentAction('Admin', 'ORDER_VALIDATED', `Order ${order.id.slice(0, 8)} divalidasi`);
    } catch (e) { console.error(e); }
    finally { setValidating(null); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const stats = PIPELINE.map(s => ({ status: s, count: orders.filter(o => o.status === s).length }));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Order Stream & Analytics"
        subtitle="Siklus hidup pesanan dan performa barang berdasarkan platform"
        accent="slate"
      />

      {/* AI Sales Analytics Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-indigo-500" />
          AI Analytics: Volume Penjualan per Platform
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.values(
                orders.reduce((acc: any, order) => {
                  const plat = order.platform || 'Direct';
                  if (!acc[plat]) acc[plat] = { name: plat, orders: 0, revenue: 0 };
                  acc[plat].orders += 1;
                  acc[plat].revenue += order.total || 0;
                  return acc;
                }, {})
              )}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Pesanan" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue (Rp)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div id="order-pipeline" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status];
          return (
            <motion.button key={s.status} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setFilter(filter === s.status ? 'all' : s.status)}
              className={`rounded-2xl p-4 border text-left transition-all ${filter === s.status ? 'border-slate-400 shadow-md' : 'border-slate-100 bg-white shadow-sm'}`}
            >
              <div className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full mb-2 ${cfg.color}`}>
                {cfg.icon}{cfg.label}
              </div>
              <div className="text-2xl font-black text-slate-800">{s.count}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {filter === 'all' ? `Semua (${orders.length})` : `${STATUS_CONFIG[filter as OrderStatus]?.label} (${filtered.length})`}
        </h2>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-50 rounded-2xl p-10 border border-dashed border-slate-200 text-center"
            >
              <ShoppingCart size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400 text-sm">Belum ada pesanan di kategori ini.</p>
            </motion.div>
          ) : filtered.map((order, i) => {
            const status = (order.status as OrderStatus) || 'pending';
            const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-700', icon: <Package size={11} /> };
            const pipelineIdx = PIPELINE.indexOf(status);
            const canAdvance = pipelineIdx >= 0 && pipelineIdx < PIPELINE.length - 1;
            return (
              <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Package size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-slate-800 font-mono">#{order.id.slice(0, 10)}</p>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{order.customer || 'Pelanggan tidak diketahui'}</p>
                    {order.tracking && <p className="text-[10px] text-purple-600 font-bold mt-0.5">Resi: {order.tracking}</p>}
                    {pipelineIdx >= 0 && (
                      <div className="flex gap-1 mt-2">
                        {PIPELINE.map((s, idx) => (
                          <div key={s} className={`h-1 flex-1 rounded-full ${idx <= pipelineIdx ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {order.total !== undefined && <span className="text-sm font-black text-slate-800">Rp {(order.total || 0).toLocaleString('id-ID')}</span>}
                    {status === 'pending' && (
                      <button onClick={() => handleAutoValidate(order)} disabled={validating === order.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-xl disabled:opacity-50"
                      >
                        <Brain size={11} className={validating === order.id ? 'animate-spin' : ''} />
                        {validating === order.id ? 'Validasi...' : 'AI Validate'}
                      </button>
                    )}
                    {canAdvance && status !== 'pending' && (
                      <button onClick={() => handleAdvance(order)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl"
                      >
                        <ChevronRight size={11} /> Advance
                      </button>
                    )}
                    {status !== 'pending' && status !== 'cancelled' && (
                      <button onClick={() => alert(`Sedang mengenerate PDF Resi Ekspedisi untuk Order #${order.id}\n(Fitur Dummy Beta)`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-black rounded-xl transition-colors mt-1"
                      >
                        <Printer size={11} /> Cetak Resi
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
