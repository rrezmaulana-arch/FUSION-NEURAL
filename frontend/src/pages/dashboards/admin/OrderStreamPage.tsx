/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, AlertTriangle, ChevronRight, Brain, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-black text-white">{p.name === 'Revenue (Rp)' ? `Rp ${(p.value || 0).toLocaleString('id-ID')}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

type OrderStatus = 'pending' | 'PAID' | 'PREPARING' | 'needs_approval' | 'shipped' | 'delivered' | 'cancelled' | 'RETURN_REQUESTED';

interface Order {
  id: string;
  customer?: string;
  platform?: string;
  items?: { name: string; qty: number }[];
  total?: number;
  status?: OrderStatus;
  tracking?: string;
  riskScore?: number;
  aiNotes?: string;
  priority?: string;
  courier?: string;
  city?: string;
  note?: string;
  returnReason?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ReactElement }> = {
  pending: { label: 'Menunggu Bayar', color: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
  PAID: { label: 'Dibayar', color: 'bg-blue-100 text-blue-700', icon: <Package size={11} /> },
  PREPARING: { label: 'Disiapkan', color: 'bg-indigo-100 text-indigo-700', icon: <Package size={11} /> },
  needs_approval: { label: 'Perlu Approval', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={11} /> },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-700', icon: <Truck size={11} /> },
  delivered: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} /> },
  cancelled: { label: 'Batal', color: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={11} /> },
  RETURN_REQUESTED: { label: 'Return', color: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={11} /> },
};

const PIPELINE: string[] = ['pending', 'PAID', 'PREPARING', 'needs_approval', 'shipped', 'delivered'];

export default function OrderStreamPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [validating, setValidating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [autonomousOn, setAutonomousOn] = useState(false);

  // ── Listen to Autonomous Mode ──
  useEffect(() => {
    const q = query(collection(db, 'system_config'));
    return onSnapshot(q, snap => {
      snap.docs.forEach(d => {
        if (d.id === 'autonomous_mode') setAutonomousOn(d.data().value === 'ON');
      });
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
    });
    return () => unsub();
  }, []);

  const handleAdvance = async (order: Order) => {
    const idx = PIPELINE.indexOf(order.status as string);
    if (idx < 0 || idx >= PIPELINE.length - 1) return;
    const nextStatus = PIPELINE[idx + 1];
    await updateDoc(doc(db, 'orders', order.id), { status: nextStatus });
    await FirebaseLogger.logAgentAction('Admin', 'ORDER_ADVANCED', `Order #${order.id.slice(0, 8)} → ${nextStatus}`);
  };

  const [packingId, setPackingId] = useState<string | null>(null);

  const handleConfirmPacking = async (order: Order) => {
    setPackingId(order.id);
    try {
      // 1. Update order status to PREPARING
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'PREPARING',
        preparingAt: new Date().toISOString(),
        preparedBy: 'Admin'
      });

      // 2. Create approval request for manager
      await addDoc(collection(db, 'pending_approvals'), {
        actionType: 'Approve Shipment',
        description: `${(order.priority || 'standard').toUpperCase()} order dari ${order.customer || '-'} (${order.platform || '-'}): ${order.items?.map(i => i.name).join(', ') || '-'} → ${order.city || '-'}`,
        role: 'manager',
        status: 'Pending',
        orderId: order.id,
        priority: order.priority || 'standard',
        estimatedCost: order.total || 0,
        timestamp: new Date().toISOString()
      });

      await FirebaseLogger.logAgentAction('Admin', 'PACKING_CONFIRMED', `Order #${order.id.slice(0, 8)} — barang dikemas, menunggu approval manager`);
    } catch (e) {
      console.error('Gagal konfirmasi packing:', e);
    } finally {
      setPackingId(null);
    }
  };

  const handleAutoValidate = async (order: Order) => {
    setValidating(order.id);
    try {
      await NeuralCore.processAdminOrder(
        { id: order.id, items: order.items || [], total: order.total || 0 },
        []
      );

      // AI Fraud Assessment & Routing
      const prompt = `Lakukan evaluasi risiko untuk pesanan berikut:
ID: ${order.id}
Customer: ${order.customer || 'Unknown'}
Total Belanja: Rp ${order.total || 0}
Item: ${JSON.stringify(order.items || [])}
Platform: ${order.platform || 'Direct'}

PENTING: Output murni JSON saja tanpa markdown. Format:
{ "riskScore": angka 0-100 (makin tinggi makin berisiko fraud/anomali), "notes": "Catatan ringkas 1 kalimat alasan dan rekomendasi kurir" }`;

      const aiResponse = await NeuralCore.askAgent('admin', 'order_fraud_check', prompt);
      
      let riskScore = 10;
      let aiNotes = "Valid. Rekomendasi kurir: Reguler.";
      try {
        const startIdx = aiResponse.indexOf('{');
        const endIdx = aiResponse.lastIndexOf('}');
        if(startIdx !== -1 && endIdx !== -1) {
            const data = JSON.parse(aiResponse.substring(startIdx, endIdx + 1));
            if (data.riskScore !== undefined) riskScore = data.riskScore;
            if (data.notes) aiNotes = data.notes;
        }
      } catch(e) { console.error('Gagal parse AI Fraud JSON:', e); }

      await updateDoc(doc(db, 'orders', order.id), { 
          status: 'processing', 
          validated: true,
          riskScore,
          aiNotes
      });
      await FirebaseLogger.logAgentAction('Admin', 'ORDER_VALIDATED', `AI Risk Score: ${riskScore}/100. Notes: ${aiNotes}`);
    } catch (e) { console.error(e); }
    finally { setValidating(null); }
  };

  // ── Auto-Loop Engine (Self-Driving Validation) ──
  useEffect(() => {
    if (!autonomousOn) return;
    const interval = setInterval(() => {
      // Hanya eksekusi jika tidak sedang memvalidasi
      if (validating) return;

      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length > 0) {
        // Ambil order paling lama yang pending (biasanya di akhir list karena sort desc)
        const oldestPending = pendingOrders[pendingOrders.length - 1];
        handleAutoValidate(oldestPending);
      }
    }, 12000); // Cek tiap 12 detik

    return () => clearInterval(interval);
  }, [autonomousOn, orders, validating]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const stats = PIPELINE.map(s => ({ status: s, count: orders.filter(o => o.status === s).length }));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Order Stream & Analytics"
        subtitle="Siklus hidup pesanan dan performa barang berdasarkan platform"
        accent="slate"
        actions={
          <div className={`px-4 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${autonomousOn ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-500/10' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
             <Brain size={14} className={autonomousOn ? 'animate-pulse' : ''} />
             {autonomousOn ? 'AI Auto-Validate: ON' : 'AI Auto-Validate: OFF'}
          </div>
        }
      />

      {/* AI Sales Analytics Chart — Dark Glassmorphism */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-6 border border-white/5 overflow-hidden mb-6"
        style={{ background: 'linear-gradient(135deg, #0d1122 0%, #0f172a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-black flex items-center gap-2 text-base">
              <Brain size={16} className="text-indigo-400" /> Volume Penjualan per Platform
            </h3>
            <p className="text-slate-400 text-xs mt-1">Real-time dari {orders.length} pesanan tersimpan di database</p>
          </div>
        </div>
        <div className="h-56 w-full relative z-10">
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
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
              barGap={8}
            >
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 8 }} />
              <Bar yAxisId="left" dataKey="orders" fill="url(#ordersGrad)" radius={[12, 12, 4, 4]} name="Total Pesanan" maxBarSize={60} />
              <Bar yAxisId="right" dataKey="revenue" fill="url(#revenueGrad)" radius={[12, 12, 4, 4]} name="Revenue (Rp)" maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

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
                      {order.priority === 'express' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚡ EXPRESS</span>
                      )}
                      {order.priority === 'bulk' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">BULK</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{order.customer || 'Pelanggan tidak diketahui'} {order.city ? `• ${order.city}` : ''} {order.platform ? `• ${order.platform}` : ''}</p>
                    {order.courier && <p className="text-[10px] text-blue-600 font-bold mt-0.5">{order.courier} {order.tracking ? `• ${order.tracking}` : ''}</p>}
                    {order.note && <p className="text-[10px] text-amber-600 font-bold mt-0.5">{order.note}</p>}
                    {order.returnReason && <p className="text-[10px] text-rose-600 font-bold mt-0.5">Alasan return: {order.returnReason}</p>}
                    
                    {order.aiNotes && (
                      <div className={`mt-2 p-2 rounded-lg text-[10px] border ${
                        (order.riskScore || 0) > 70 ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                        (order.riskScore || 0) > 40 ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                        'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        <div className="flex items-center gap-1 font-bold mb-0.5">
                          <Brain size={10} /> 
                          AI Analysis (Risk: {order.riskScore || 0}/100)
                        </div>
                        <p>{order.aiNotes}</p>
                      </div>
                    )}

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
                    {status === 'PAID' && (
                      <button onClick={() => handleConfirmPacking(order)} disabled={packingId === order.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        <Package size={11} className={packingId === order.id ? 'animate-spin' : ''} />
                        {packingId === order.id ? 'Memproses...' : 'Barang Sudah Dikemas'}
                      </button>
                    )}
                    {status === 'PREPARING' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-xl">
                        <Clock size={11} /> Menunggu Approval Manager
                      </span>
                    )}
                    {canAdvance && status !== 'pending' && status !== 'PAID' && status !== 'PREPARING' && (
                      <button onClick={() => handleAdvance(order)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl"
                      >
                        <ChevronRight size={11} /> Advance
                      </button>
                    )}
                    {status !== 'pending' && status !== 'cancelled' && (
                      <button onClick={() => {
                        const w = window.open('', '_blank', 'width=420,height=650');
                        if (w) {
                          const items = order.items?.map(i => `${i.name} x${i.qty}`).join(', ') || '-';
                          const priorityLabel = order.priority === 'express' ? '⚡ EXPRESS' : order.priority === 'bulk' ? 'BULK' : 'STANDARD';
                          w.document.write(`<!DOCTYPE html><html><head><title>Resi ${order.id}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;padding:28px;font-size:13px;color:#1e293b;background:#f8fafc}
.card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:380px;margin:0 auto}
.header{text-align:center;padding-bottom:16px;border-bottom:2px dashed #e2e8f0;margin-bottom:16px}
.header h1{font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
.header p{font-size:11px;color:#64748b;margin-top:4px;letter-spacing:1px;text-transform:uppercase}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}
.row:last-child{border:none}
.label{color:#64748b;font-size:12px}.val{font-weight:700;font-size:13px;color:#0f172a}
.badge{display:inline-block;padding:3px 10px;border-radius:8px;font-size:10px;font-weight:800;letter-spacing:0.5px}
.badge-express{background:#fef2f2;color:#dc2626}.badge-standard{background:#eff6ff;color:#2563eb}.badge-bulk{background:#f5f3ff;color:#7c3aed}
.tracking-box{background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:16px;text-align:center;margin:16px 0}
.tracking-box .no{font-size:20px;font-weight:900;color:#fff;letter-spacing:2px;font-family:monospace}
.tracking-box .courier{font-size:11px;color:#94a3b8;margin-top:4px}
.footer{text-align:center;margin-top:16px;font-size:10px;color:#94a3b8}
</style></head><body>
<div class="card">
<div class="header">
<h1>📦 RESI PENGIRIMAN</h1>
<p>Fusion Neural Logistics</p>
</div>
<div class="row"><span class="label">Order ID</span><span class="val">#${order.id.slice(0,10)}</span></div>
<div class="row"><span class="label">Pelanggan</span><span class="val">${order.customer || '-'}</span></div>
<div class="row"><span class="label">Tujuan</span><span class="val">${order.city || '-'}</span></div>
<div class="row"><span class="label">Produk</span><span class="val">${items}</span></div>
<div class="row"><span class="label">Total</span><span class="val">Rp ${(order.total||0).toLocaleString('id-ID')}</span></div>
<div class="row"><span class="label">Prioritas</span><span class="badge badge-${order.priority||'standard'}">${priorityLabel}</span></div>
<div class="row"><span class="label">Status</span><span class="val">${(order.status||'').toUpperCase()}</span></div>
<div class="tracking-box">
<div class="no">${order.tracking || '—'}</div>
<div class="courier">${order.courier || 'J&T Express'}</div>
</div>
<div class="row"><span class="label">Platform</span><span class="val">${order.platform || '-'}</span></div>
<div class="row"><span class="label">Tanggal Cetak</span><span class="val">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
<div class="footer">Dicetak oleh Fusion Neural AI • ${new Date().toLocaleTimeString('id-ID')}</div>
</div>
<script>window.print()</script></body></html>`);
                        }
                      }}
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
