import { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function ShippingReturnsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Listen for orders that are PAID (need shipping) or RETURN_REQUESTED
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['PAID', 'RETURN_REQUESTED'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  const handleInputResi = async (orderId: string) => {
    const resi = trackingInput[orderId];
    if (!resi) return alert("Nomor resi kosong!");
    
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'SHIPPED',
        tracking_number: resi
      });
      alert(`Order ${orderId} berhasil diupdate dengan resi ${resi}`);
    } catch (e) {
      console.error(e);
      alert("Gagal update resi");
    }
  };

  const handleProcessReturn = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'RETURN_PROCESSED'
      });
      // Optionally trigger backend to restock inventory here
      alert(`Return untuk order ${orderId} berhasil diproses.`);
    } catch (e) {
      console.error(e);
      alert("Gagal proses return");
    }
  };

  const pendingShipping = orders.filter(o => o.status === 'PAID');
  const returnRequests = orders.filter(o => o.status === 'RETURN_REQUESTED');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg">
          <Truck className="w-6 h-6 text-slate-200" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipping & Returns</h1>
          <p className="text-slate-500 text-sm">Manage tracking numbers and process customer returns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-500" /> Print Labels & Tracking
          </h2>
          <div className="space-y-4">
            {pendingShipping.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Tidak ada pesanan menunggu pengiriman.</p>}
            {pendingShipping.map(order => (
              <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">Awaiting tracking number</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Input Resi (e.g. JNE123...)"
                    value={trackingInput[order.id] || ''}
                    onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <button 
                    onClick={() => handleInputResi(order.id)}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Return Requests (RMA)
          </h2>
          <div className="space-y-4">
            {returnRequests.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Tidak ada permintaan retur.</p>}
            {returnRequests.map(order => (
              <div key={order.id} className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm text-slate-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-red-600">Broken item reported / RMA</p>
                </div>
                <button 
                  onClick={() => handleProcessReturn(order.id)}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50"
                >
                  Process Return
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
