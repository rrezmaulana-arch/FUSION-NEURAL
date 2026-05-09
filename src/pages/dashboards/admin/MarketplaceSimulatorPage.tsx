import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ShoppingBag, Play, Square, Zap, TrendingUp, Package, Clock, RefreshCw, Snail, ChevronRight, ChevronsRight } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';

interface SimOrder {
  id: string;
  platform: 'TikTok Shop' | 'Tokopedia' | 'Shopee';
  buyer: string;
  product: string;
  qty: number;
  price: number;
  time: string;
  city: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity?: number;
  qty?: number;
  price?: number;
}

const PLATFORMS = [
  {
    name: 'TikTok Shop' as const,
    color: 'bg-slate-900 text-white border-slate-700',
    badge: 'bg-slate-800 text-white',
    dot: 'bg-pink-500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z" />
      </svg>
    ),
    buyers: ['@fitria_shop', '@nanda.outfit', '@kece_abis', '@belanja_yuk', '@si_hemat', '@fashionista99'],
  },
  {
    name: 'Tokopedia' as const,
    color: 'bg-green-50 text-green-800 border-green-200',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    icon: <ShoppingBag size={14} />,
    buyers: ['Rizky A.', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi R.', 'Agus M.', 'Rina Wati'],
  },
  {
    name: 'Shopee' as const,
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
    icon: <ShoppingBag size={14} />,
    buyers: ['buyer_7821', 'shopper_xyz', 'cinta_belanja', 'hemat_selalu', 'promo_hunter', 'tokobagus22'],
  },
];

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Bali', 'Yogyakarta', 'Makassar', 'Palembang', 'Depok'];

export default function MarketplaceSimulatorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [orders, setOrders] = useState<SimOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  const speedMs = { slow: 3000, normal: 1500, fast: 600 };

  // Sync inventory dari Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), snap => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })) as InventoryItem[]);
    });
    return () => unsub();
  }, []);

  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateOrder = (): SimOrder | null => {
    const platform = getRandomItem(PLATFORMS);
    const buyer = getRandomItem(platform.buyers);
    
    // Filter out products with 0 stock
    const availableProducts = inventory.filter(i => (i.quantity ?? i.qty ?? 0) > 0);
    if (availableProducts.length === 0) return null; // No stock left!

    const productItem = getRandomItem(availableProducts);
    const product = productItem.name || 'Unknown Product';
    const currentQty = productItem.quantity ?? productItem.qty ?? 0;
    
    const qty = Math.min(Math.floor(Math.random() * 3) + 1, currentQty);
    const price = productItem.price ? productItem.price : (Math.floor(Math.random() * 500) + 50) * 1000;
    
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platform: platform.name,
      buyer,
      product,
      qty,
      price,
      time,
      city: getRandomItem(CITIES),
      ...( { _productId: productItem.id } ) // Add hidden product id for tracking
    } as SimOrder;
  };

  // Simpan order ke Firestore
  const saveOrderToFirestore = async (order: SimOrder) => {
    try {
      // 1. Simpan dokumen order individual ke 'orders' (Terbaca oleh Finance)
      await addDoc(collection(db, 'orders'), {
        platform: order.platform,
        buyer: order.buyer,
        product: order.product,
        qty: order.qty,
        price: order.price,
        amount: order.price * order.qty,
        total: order.price * order.qty,
        revenue: order.price * order.qty,
        city: order.city,
        time: order.time,
        status: 'processed',
        session: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });

      // 2. Kurangi stok di inventory riil
      const productId = (order as any)._productId;
      if (productId) {
        const itemRef = doc(db, 'inventory', productId);
        const invItem = inventory.find(i => i.id === productId);
        if (invItem) {
           const updateData: any = {};
           if (invItem.quantity !== undefined) updateData.quantity = increment(-order.qty);
           if (invItem.qty !== undefined) updateData.qty = increment(-order.qty);
           await setDoc(itemRef, updateData, { merge: true });
        }
      }

      // 3. Tambahkan ke global finance
      const financeRef = doc(db, 'financial_reports', 'latest');
      await setDoc(financeRef, {
         revenue: increment(order.price * order.qty),
         net_profit: increment(order.price * order.qty * 0.65), // Estimasi 65% profit margin
      }, { merge: true });

      // 4. Update summary akumulatif per platform
      const summaryRef = doc(db, 'simulator_summary', order.platform.replace(/\s/g, '_'));
      await setDoc(summaryRef, {
        platform: order.platform,
        total_orders: increment(1),
        total_revenue: increment(order.price * order.qty),
        last_order: order.product,
        last_buyer: order.buyer,
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } catch (e) {
      console.warn('[Simulator] Firestore write error:', e);
    }
  };

  // Main simulator loop — restart saat speed/isRunning/inventory berubah
  useEffect(() => {
    if (!isRunning) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      setOrderCount(prevCount => {
        const nextCount = prevCount + 1;
        if (nextCount > 20) {
          stopSimulator();
          return prevCount;
        }
        
        const order = generateOrder();
        if (!order) {
           stopSimulator();
           alert("Simulasi dihentikan otomatis: Semua stok produk telah habis!");
           return prevCount;
        }

        setOrders(prev => [order, ...prev].slice(0, 30));
        setTotalRevenue(prev => prev + order.price * order.qty);
        
        // Save without awaiting to keep interval synchronous-like for state updates
        saveOrderToFirestore(order).catch(console.warn);
        
        return nextCount;
      });
    }, speedMs[speed]);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, isRunning, inventory]);

  const startSimulator = () => setIsRunning(true);

  const stopSimulator = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetSimulator = () => {
    stopSimulator();
    setOrders([]);
    setTotalRevenue(0);
    setOrderCount(0);
  };

  const platformStats = PLATFORMS.map(p => ({
    ...p,
    count: orders.filter(o => o.platform === p.name).length,
    revenue: orders.filter(o => o.platform === p.name).reduce((acc, o) => acc + o.price * o.qty, 0),
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title="Marketplace Simulator"
        subtitle="Simulasi order masuk dari TikTok Shop, Tokopedia & Shopee — tersimpan otomatis ke Firebase"
        accent="slate"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Speed control */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 text-xs font-bold">
              {(['slow', 'normal', 'fast'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-2 transition-colors capitalize ${speed === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {s === 'slow' ? <span className="flex items-center gap-1"><Snail size={14}/> Slow</span> : s === 'normal' ? <span className="flex items-center gap-1"><ChevronRight size={14}/> Normal</span> : <span className="flex items-center gap-1"><ChevronsRight size={14}/> Fast</span>}
                </button>
              ))}
            </div>
            <button onClick={resetSimulator} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <RefreshCw size={15} />
            </button>
            {isRunning ? (
              <button onClick={stopSimulator}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-md"
              >
                <Square size={14} /> Stop
              </button>
            ) : (
              <button onClick={startSimulator}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-md"
              >
                <Play size={14} /> Mulai Simulasi
              </button>
            )}
          </div>
        }
      />

      {/* Firebase badge */}
      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 w-fit">
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="font-bold">Terhubung ke Firebase</span>
        <span className="text-orange-400">— setiap order disimpan ke <code className="font-mono">simulator_orders</code> & <code className="font-mono">simulator_summary</code></span>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" layout>
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-1.5"><Package size={13} /> Total Order</div>
          <div className="text-2xl font-black text-slate-800">{orderCount}</div>
        </motion.div>
        <motion.div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm" layout>
          <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 mb-1.5"><TrendingUp size={13} /> Total Revenue</div>
          <div className="text-xl font-black text-emerald-700">Rp {(totalRevenue / 1e6).toFixed(2)}M</div>
        </motion.div>
        {platformStats.slice(0, 2).map(p => (
          <motion.div key={p.name} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" layout>
            <div className={`text-xs font-bold flex items-center gap-1 mb-1.5 ${p.name === 'TikTok Shop' ? 'text-pink-500' : p.name === 'Tokopedia' ? 'text-green-600' : 'text-orange-500'}`}>
              <span className={`w-2 h-2 rounded-full ${p.dot}`} /> {p.name}
            </div>
            <div className="text-2xl font-black text-slate-800">{p.count} <span className="text-sm font-normal text-slate-400">order</span></div>
          </motion.div>
        ))}
      </div>

      {/* Platform Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {platformStats.map(p => (
          <div key={p.name} className={`rounded-2xl p-4 border ${p.color} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.badge}`}>{p.icon}</div>
              <div>
                <p className="font-black text-sm">{p.name}</p>
                <p className="text-xs opacity-70">Rp {(p.revenue / 1e3).toFixed(0)}K</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">{p.count}</div>
              {isRunning && (
                <div className="flex items-center gap-1 text-[10px] font-bold justify-end">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot} animate-ping`} />
                  LIVE
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Order Feed */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-slate-800">Live Order Feed</h3>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE · Tersimpan ke Firebase
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{orders.length} order masuk</span>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Zap size={32} className="mb-2" />
              <p className="text-sm font-bold">Tekan "Mulai Simulasi" untuk mulai</p>
              <p className="text-xs mt-1">Order dari marketplace akan masuk & tersimpan ke Firebase secara real-time</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {orders.map((order) => {
                const plt = PLATFORMS.find(p => p.name === order.platform)!;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20, backgroundColor: '#f0fdf4' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: '#ffffff' }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs ${plt.badge}`}>
                      {plt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${plt.badge}`}>{order.platform}</span>
                        <span className="text-xs font-bold text-slate-700 truncate">{order.buyer}</span>
                        <span className="text-[10px] text-slate-400">· {order.city}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{order.product} <span className="font-bold text-slate-700">×{order.qty}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-600">Rp {(order.price * order.qty / 1000).toFixed(0)}K</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end"><Clock size={8} />{order.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
