import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Snail, ChevronRight, ChevronsRight, Package, TrendingUp, Zap, Clock, ShoppingCart, Database } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, onSnapshot } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

// ── Demo Products (simulasi produk Shopee/TikTok Shop) ──────────────────────
const DEMO_PRODUCTS = [
  { name: 'Kaos Oversize Premium Cotton', sku: 'KOS-001', category: 'Fashion', price: 89000, quantity: 50, discount: 10 },
  { name: 'Totebag Canvas Custom Print', sku: 'TOT-002', category: 'Fashion', price: 65000, quantity: 40, discount: 0 },
  { name: 'Tumbler Stainless 500ml', sku: 'TUM-003', category: 'Lifestyle', price: 75000, quantity: 60, discount: 15 },
  { name: 'Hoodie Zipper Fleece', sku: 'HOD-004', category: 'Fashion', price: 185000, quantity: 25, discount: 5 },
  { name: 'Sticker Pack Aesthetic 50pcs', sku: 'STK-005', category: 'Stationery', price: 25000, quantity: 100, discount: 0 },
  { name: 'Phone Case Custom Design', sku: 'PHC-006', category: 'Aksesoris', price: 55000, quantity: 45, discount: 20 },
  { name: 'Topi Baseball Cap Embroidery', sku: 'TOP-007', category: 'Fashion', price: 79000, quantity: 35, discount: 0 },
  { name: 'Sling Bag Waterproof', sku: 'SLB-008', category: 'Fashion', price: 120000, quantity: 30, discount: 10 },
  { name: 'Mug Keramik 350ml Custom', sku: 'MUG-009', category: 'Lifestyle', price: 45000, quantity: 55, discount: 0 },
  { name: 'Jaket Windbreaker Light', sku: 'JKT-010', category: 'Fashion', price: 225000, quantity: 20, discount: 5 },
];

interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  discount?: number;
}

interface SimulatedOrder {
  id: string;
  platform: string;
  buyer: string;
  city: string;
  product: string;
  qty: number;
  price: number;
  time: string;
}

const PLATFORMS = [
  { name: 'Shopee', color: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600' },
  { name: 'Tokopedia', color: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { name: 'TikTok Shop', color: 'border-slate-800', bg: 'bg-slate-100', text: 'text-slate-800' }
];

const INDO_NAMES = ['Budi S.', 'Siti A.', 'Andi W.', 'Dewi K.', 'Rina P.', 'Hadi M.', 'Eko P.', 'Putri N.', 'Reza A.', 'Ayu L.'];
const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Denpasar', 'Malang', 'Yogyakarta'];

export default function MarketplaceSimulatorPage() {
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isRunning, setIsRunning] = useState(false);
  const [orders, setOrders] = useState<SimulatedOrder[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [autonomousOn, setAutonomousOn] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Listen to Autonomous Mode
  useEffect(() => {
    const q = query(collection(db, 'system_config'));
    return onSnapshot(q, snap => {
      snap.docs.forEach(d => {
        if (d.id === 'autonomous_mode') {
           const isOn = d.data().value === 'ON';
           setAutonomousOn(isOn);
           // Auto-Start or Stop Simulator based on Autonomous Mode
           setIsRunning(isOn);
        }
      });
    });
  }, []);
  
  // Stats
  const [platformStats, setPlatformStats] = useState(PLATFORMS.map(p => ({ ...p, count: 0, revenue: 0 })));

  useEffect(() => {
    // Fetch real products from DB once on load
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'inventory'));
      const prods: InventoryProduct[] = [];
      snap.forEach(d => {
        const data = d.data();
        prods.push({ 
          id: d.id, 
          name: data.name || 'Unknown', 
          quantity: data.quantity ?? data.qty ?? 0,
          price: data.price,
          discount: data.discount
        });
      });
      setProducts(prods);
    };
    fetchProducts();
  }, []);

  // Seed demo products ke Firestore
  const handleSeedProducts = async () => {
    setIsSeeding(true);
    try {
      for (const p of DEMO_PRODUCTS) {
        await addDoc(collection(db, 'inventory'), {
          ...p,
          createdAt: new Date().toISOString(),
          source: 'simulator_seed',
        });
      }
      // Refresh product list
      const snap = await getDocs(collection(db, 'inventory'));
      const prods: InventoryProduct[] = [];
      snap.forEach(d => {
        const data = d.data();
        prods.push({
          id: d.id,
          name: data.name || 'Unknown',
          quantity: data.quantity ?? data.qty ?? 0,
          price: data.price,
          discount: data.discount,
        });
      });
      setProducts(prods);
    } catch (e) {
      console.error('Seed error:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (!isRunning || products.length === 0) return;

    const intervalMs = speed === 'slow' ? 4000 : speed === 'normal' ? 2000 : 800;
    
    const tick = setInterval(async () => {
      // 1. Pick a random product that still has stock
      const availableProducts = products.filter(p => p.quantity > 0);
      if (availableProducts.length === 0) {
        setIsRunning(false); // Stop if everything is sold out
        return;
      }
      
      const pIdx = Math.floor(Math.random() * availableProducts.length);
      const product = availableProducts[pIdx];
      
      // 2. Generate random order data
      const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
      const buyer = INDO_NAMES[Math.floor(Math.random() * INDO_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const qty = Math.random() > 0.8 ? 2 : 1; // 20% chance to buy 2 items
      const actualQty = Math.min(qty, product.quantity); // Don't oversell
      
      const basePrice = product.price || 150000;
      const discount = product.discount || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const totalAmount = finalPrice * actualQty;

      const orderData: SimulatedOrder = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        platform: platform.name,
        buyer, city,
        product: product.name,
        qty: actualQty,
        price: finalPrice,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      // 3. Update local state
      setOrders(prev => [orderData, ...prev].slice(0, 50));
      setTotalRevenue(prev => prev + totalAmount);
      setPlatformStats(prev => prev.map(ps => 
        ps.name === platform.name ? { ...ps, count: ps.count + 1, revenue: ps.revenue + totalAmount } : ps
      ));
      
      // Update local product stock
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity - actualQty } : p
      ));

      // 4. Update Firestore to stress-test real database
      try {
        // A. Decrease stock
        await updateDoc(doc(db, 'inventory', product.id), { quantity: product.quantity - actualQty });
        
        // B. Determine priority (Express 15%, Standard 65%, Bulk 20%)
        const priorityRoll = Math.random();
        const priority = priorityRoll < 0.15 ? 'express' : priorityRoll < 0.80 ? 'standard' : 'bulk';
        const courier = ['J&T Express', 'SiCepat', 'AnterAja', 'JNE'][Math.floor(Math.random() * 4)];
        const trackingNo = `JT${Math.floor(Math.random() * 9000000000) + 1000000000}`;

        // B1. Insert into orders — status: pending (waiting payment)
        const orderRef = await addDoc(collection(db, 'orders'), {
          customer: buyer,
          items: [{ name: product.name, qty: actualQty }],
          total: totalAmount,
          status: 'pending',
          platform: platform.name,
          priority,
          courier,
          city,
          timestamp: new Date().getTime()
        });
        const orderId = orderRef.id;

        // B2. Auto-payment only (simulating payment gateway callback)
        // Everything after PAID requires manual admin/manager action
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'orders', orderId), {
              status: 'PAID',
              paidAt: new Date().toISOString(),
              tracking: trackingNo,
              courier,
              note: priority === 'express' ? '⚡ EXPRESS — Prioritas tinggi!' : priority === 'bulk' ? 'BULK — Bisa ditunda' : 'Standard'
            });
          } catch {}
        }, 2000 + Math.random() * 3000);

        // C. Insert into finance (Simulated income)
        await addDoc(collection(db, 'finance_transactions'), {
          amount: totalAmount,
          transaction_type: 'INCOME', // fixed naming to match Profit Ledger
          category: 'Sales',
          description: `Pesanan ${platform.name} dari ${buyer}`,
          created_at: new Date().toISOString()
        });

        // D. Marketing stats & Ad Spend (Simulate traffic)
        if (Math.random() > 0.5) { // 50% chance to simulate ad spend & funnel
          await addDoc(collection(db, 'finance_transactions'), {
            amount: Math.floor(Math.random() * 15000) + 5000,
            transaction_type: 'EXPENSE',
            category: 'Marketing',
            description: `Meta/TikTok Ads Spend (${platform.name})`,
            created_at: new Date().toISOString()
          });
          
          await addDoc(collection(db, 'marketing_stats'), {
            impressions: Math.floor(Math.random() * 1000) + 500,
            clicks: Math.floor(Math.random() * 50) + 10,
            add_to_cart: Math.floor(Math.random() * 10) + 2,
            purchases: 1,
            campaign: `Auto Campaign ${platform.name}`,
            timestamp: new Date().toISOString()
          });

          // Trigger Neural Marketing to optimize ads if we just spent money
          if (Math.random() > 0.7) {
            await addDoc(collection(db, 'neural_tasks'), {
              title: `OPTIMIZE ADS: Traffic masuk dari ${platform.name}. Buat copy A/B Testing baru.`,
              agent: 'Neural Marketing',
              client: 'E-commerce Simulator',
              status: 'To Do',
              progress: 0,
              dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              priority: 'normal',
              labels: ['Ads', 'Optimization']
            });
          }
        }

        // E. Auto-Procurement -> Send Task to Neural Admin instead of hardcoding
        const newStock = product.quantity - actualQty;
        if (newStock <= 5) {
          await addDoc(collection(db, 'neural_tasks'), {
            title: `RESTOCK URGENT: ${product.name} (Sisa ${newStock} unit). Segera hubungi supplier dan buat PO.`,
            agent: 'Neural Admin',
            client: 'E-commerce Simulator',
            status: 'To Do',
            progress: 0,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            priority: 'high',
            labels: ['Procurement', 'Restock']
          });
        }

      } catch (e) {
        console.error("Simulation DB error:", e);
      }

    }, intervalMs);

    return () => clearInterval(tick);
  }, [isRunning, speed, products]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Live Traffic Simulator" 
        subtitle="Suntikkan pesanan nyata secara real-time ke database. Mengurangi stok Inventory dan menambah Revenue secara nyata."
        accent="slate"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-slate-200 text-xs font-bold">
              {(['slow', 'normal', 'fast'] as const).map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-3 py-2 transition-colors capitalize ${speed === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {s === 'slow' ? <span className="flex items-center gap-1"><Snail size={14}/> Lambat</span> : s === 'normal' ? <span className="flex items-center gap-1"><ChevronRight size={14}/> Normal</span> : <span className="flex items-center gap-1"><ChevronsRight size={14}/> Cepat</span>}
                </button>
              ))}
            </div>
            {isRunning ? (
              <button onClick={() => setIsRunning(false)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm">
                <Square size={14} /> Stop
              </button>
            ) : (
              <button onClick={() => setIsRunning(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-sm">
                <Play size={14} /> Mulai Simulasi
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><ShoppingCart size={14}/> Total Transaksi</div>
          <div className="text-3xl font-black text-slate-800">{orders.length}</div>
        </motion.div>
        <motion.div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp size={14}/> Gross Revenue</div>
          <div className="text-xl font-black text-emerald-800">Rp {(totalRevenue / 1000000).toFixed(2)}M</div>
        </motion.div>
        <div className="col-span-2 grid grid-cols-3 gap-2">
          {platformStats.map(p => (
            <div key={p.name} className={`rounded-xl p-3 border ${p.color} ${p.bg}`}>
              <div className={`text-[10px] font-black uppercase mb-1 ${p.text}`}>{p.name}</div>
              <div className={`text-lg font-black ${p.text}`}>{p.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seed Demo Products */}
      {products.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
              <Database size={16} /> Inventory Kosong
            </h3>
            <p className="text-xs text-amber-600 mt-1">
              Simulator butuh produk di inventory untuk jalan. Klik tombol untuk menambah 10 produk demo (simulasi produk Shopee/TikTok Shop).
            </p>
          </div>
          <button onClick={handleSeedProducts} disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Database size={14} />
            {isSeeding ? 'Menambahkan...' : 'Seed 10 Produk Demo'}
          </button>
        </motion.div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${autonomousOn ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap size={16} className={isRunning ? "text-amber-500 animate-pulse" : "text-slate-400"} />
              {autonomousOn ? 'Autonomous Traffic Engine' : 'Traffic Engine'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {autonomousOn ? 'Digerakkan otomatis oleh Autonomous Mode' : 'Inject pesanan fiktif secara live ke database'}
            </p>
          </div>
          <button 
            onClick={() => !autonomousOn && setIsRunning(!isRunning)}
            disabled={autonomousOn}
            className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
              isRunning 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20'
            } ${autonomousOn ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? <><Square size={16} /> Stop</> : <><Play size={16} fill="currentColor" /> Start</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className={isRunning ? "text-amber-500 animate-pulse" : "text-slate-400"} /> Live Order Stream</h3>
            {isRunning && <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full animate-pulse">Menulis ke Database...</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Play size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">Tekan Mulai untuk menyuntikkan pesanan.</p>
              </div>
            ) : (
              <AnimatePresence>
                {orders.map(o => {
                  const plt = PLATFORMS.find(p => p.name === o.platform)!;
                  return (
                    <motion.div key={o.id} initial={{ opacity: 0, x: -20, backgroundColor: '#f8fafc' }} animate={{ opacity: 1, x: 0, backgroundColor: '#ffffff' }} className={`p-4 rounded-xl border ${plt.color} flex justify-between items-center shadow-sm`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${plt.bg} ${plt.text}`}>{o.platform}</span>
                          <span className="text-xs font-bold text-slate-800">{o.buyer} ({o.city})</span>
                        </div>
                        <p className="text-sm text-slate-600">{o.product} <span className="font-bold text-slate-800">x{o.qty}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">Rp {(o.price * o.qty).toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-1"><Clock size={10}/> {o.time}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm text-white">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Package size={16} className="text-slate-400" /> Real-time Stock Pool</h3>
          <p className="text-xs text-slate-400 mb-4">Stok ini ditarik langsung dari database asli. Simulator akan otomatis berhenti jika semua stok produk habis (0).</p>
          <div className="space-y-3 h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => (
              <div key={p.id} className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-medium text-slate-300 truncate pr-4">{p.name}</span>
                <span className={`text-xs font-mono font-bold ${p.quantity === 0 ? 'text-rose-500' : p.quantity < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {p.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
