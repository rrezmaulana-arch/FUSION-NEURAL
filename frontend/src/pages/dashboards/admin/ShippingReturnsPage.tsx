import { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, Search, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

const STATUS_TIMELINE = [
  { key: 'pending', label: 'Menunggu Bayar', icon: Clock },
  { key: 'PAID', label: 'Dibayar', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Disiapkan', icon: Package },
  { key: 'needs_approval', label: 'Perlu Approval', icon: AlertTriangle },
  { key: 'shipped', label: 'Dikirim', icon: Truck },
  { key: 'delivered', label: 'Selesai', icon: CheckCircle2 },
];

export default function ShippingReturnsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    // Listen for orders that are PAID (need shipping) or RETURN_REQUESTED
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['PAID', 'RETURN_REQUESTED'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for shipped/delivered orders for tracking display
    const q2 = query(
      collection(db, 'orders'),
      where('status', 'in', ['shipped', 'delivered', 'PREPARING', 'needs_approval']),
      limit(20)
    );
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      setShippedOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribe(); unsubscribe2(); };
  }, []);

  const handleInputResi = async (orderId: string) => {
    const resi = trackingInput[orderId];
    if (!resi) return showFeedback('error', 'Nomor resi kosong!');

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'shipped',
        tracking: resi,
        shippedAt: new Date().toISOString()
      });
      showFeedback('success', `Order ${orderId.slice(0, 8)} berhasil diupdate dengan resi ${resi}`);
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Gagal update resi');
    }
  };

  const handleProcessReturn = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'RETURN_PROCESSED',
        returnProcessedAt: new Date().toISOString()
      });
      showFeedback('success', `Return untuk order ${orderId.slice(0, 8)} berhasil diproses.`);
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Gagal proses return');
    }
  };

  // Track order by ID or tracking number
  const handleTrackOrder = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);

    try {
      const q = query(collection(db, 'orders'), limit(100));
      const snap = await getDocs(q);
      const found = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find((o: any) =>
          o.id === searchQuery.trim() ||
          o.tracking === searchQuery.trim() ||
          o.id.includes(searchQuery.trim())
        );

      if (found) {
        setSearchResult(found);
      } else {
        showFeedback('error', 'Pesanan tidak ditemukan');
      }
    } catch (e) {
      showFeedback('error', 'Gagal mencari pesanan');
    } finally {
      setIsSearching(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = STATUS_TIMELINE.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const pendingShipping = orders.filter(o => o.status === 'PAID');
  const returnRequests = orders.filter(o => o.status === 'RETURN_REQUESTED');

  return (
    <div className="space-y-6 pb-10">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      <PageHeader
        title="Pesanan & Pengiriman"
        subtitle="Track pesanan, input resi, dan proses retur pelanggan."
        accent="slate"
      />

      {/* ═══ TRACK ORDER ═══ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-blue-500" /> Lacak Pesanan
        </h2>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrackOrder()}
            placeholder="Masukkan Order ID atau Nomor Resi..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
          />
          <button onClick={handleTrackOrder} disabled={isSearching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors">
            <Search size={16} />
          </button>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-black text-slate-800">#{searchResult.id.slice(0, 10)}</p>
                <p className="text-xs text-slate-400">{searchResult.customer} • {searchResult.platform}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                searchResult.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                searchResult.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                searchResult.status === 'PAID' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {searchResult.status}
              </span>
            </div>

            {/* Tracking Info */}
            {searchResult.tracking && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">No. Resi</p>
                <p className="text-sm font-black text-slate-800 font-mono">{searchResult.tracking}</p>
                {searchResult.courier && <p className="text-xs text-slate-500 mt-1">{searchResult.courier}</p>}
              </div>
            )}

            {/* Status Timeline */}
            <div className="flex items-center gap-1 mt-3">
              {STATUS_TIMELINE.map((step, i) => {
                const currentIdx = getStepIndex(searchResult.status);
                const isComplete = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCurrent ? 'bg-blue-600 text-white' :
                        isComplete ? 'bg-purple-500 text-white' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        <step.icon size={12} />
                      </div>
                      <span className={`text-[8px] mt-1 text-center ${isCurrent ? 'text-blue-600 font-bold' : isComplete ? 'text-purple-600' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_TIMELINE.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 rounded ${i < currentIdx ? 'bg-purple-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order Details */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-400">Produk:</span> <span className="font-bold text-slate-700">{searchResult.items?.map((i: any) => i.name).join(', ') || '-'}</span></div>
              <div><span className="text-slate-400">Total:</span> <span className="font-bold text-slate-700">Rp {(searchResult.total || 0).toLocaleString('id-ID')}</span></div>
              <div><span className="text-slate-400">Prioritas:</span> <span className="font-bold text-slate-700">{searchResult.priority || 'standard'}</span></div>
              <div><span className="text-slate-400">Kota:</span> <span className="font-bold text-slate-700">{searchResult.city || '-'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SHIPPING & RETURNS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Shipping */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" /> Menunggu Kirim ({pendingShipping.length})
          </h2>
          <div className="space-y-3">
            {pendingShipping.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Tidak ada pesanan menunggu.</p>}
            {pendingShipping.map(order => (
              <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-xs text-slate-800">#{order.id.slice(-6).toUpperCase()}</p>
                  <span className="text-[10px] text-slate-400">{order.customer}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="No. Resi"
                    value={trackingInput[order.id] || ''}
                    onChange={(e) => setTrackingInput({ ...trackingInput, [order.id]: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                  <button
                    onClick={() => handleInputResi(order.id)}
                    className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-slate-700"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" /> Dalam Pengiriman ({shippedOrders.filter(o => o.status === 'shipped').length})
          </h2>
          <div className="space-y-3">
            {shippedOrders.filter(o => o.status === 'shipped').length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada pesanan dalam pengiriman.</p>
            )}
            {shippedOrders.filter(o => o.status === 'shipped').map(order => (
              <div key={order.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-slate-800">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-500">{order.customer} • {order.city || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-blue-600 font-bold">{order.tracking || '-'}</p>
                    <p className="text-[10px] text-slate-400">{order.courier || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Requests */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Return Requests ({returnRequests.length})
          </h2>
          <div className="space-y-3">
            {returnRequests.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Tidak ada permintaan retur.</p>}
            {returnRequests.map(order => (
              <div key={order.id} className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-slate-800">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-rose-600">{order.returnReason || 'Barang rusak / tidak sesuai'}</p>
                  </div>
                  <button
                    onClick={() => handleProcessReturn(order.id)}
                    className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-50"
                  >
                    Proses
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

