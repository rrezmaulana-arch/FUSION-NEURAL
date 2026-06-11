/**
 * FUSION NEURAL — Global Search
 * Search across orders, inventory, transactions, and tasks from one place.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, ShoppingCart, DollarSign, ClipboardList, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'transaction' | 'task';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
}

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query_text, setQueryText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query_text.length < 2) { setResults([]); return; }

    const searchAll = async () => {
      setIsSearching(true);
      const q = query_text.toLowerCase();
      const found: SearchResult[] = [];

      try {
        // Search inventory
        const invSnap = await getDocs(query(collection(db, 'inventory'), limit(50)));
        invSnap.forEach(doc => {
          const d = doc.data();
          const name = (d.name || '').toLowerCase();
          const sku = (d.sku || '').toLowerCase();
          if (name.includes(q) || sku.includes(q)) {
            found.push({
              id: doc.id, type: 'product',
              title: d.name || '-',
              subtitle: `SKU: ${d.sku || '-'} • Stok: ${d.quantity || 0}`,
              icon: <Package size={14} className="text-amber-500" />,
              route: '/dashboard'
            });
          }
        });

        // Search orders
        const orderSnap = await getDocs(query(collection(db, 'orders'), limit(50)));
        orderSnap.forEach(doc => {
          const d = doc.data();
          const customer = (d.customer || '').toLowerCase();
          const id = doc.id.toLowerCase();
          if (customer.includes(q) || id.includes(q)) {
            found.push({
              id: doc.id, type: 'order',
              title: `#${doc.id.slice(0, 10)}`,
              subtitle: `${d.customer || '-'} • ${d.status || '-'} • Rp ${(d.total || 0).toLocaleString('id-ID')}`,
              icon: <ShoppingCart size={14} className="text-blue-500" />,
              route: '/dashboard/orders'
            });
          }
        });

        // Search transactions
        const txSnap = await getDocs(query(collection(db, 'finance_transactions'), limit(50)));
        txSnap.forEach(doc => {
          const d = doc.data();
          const desc = (d.description || '').toLowerCase();
          if (desc.includes(q)) {
            found.push({
              id: doc.id, type: 'transaction',
              title: d.description || '-',
              subtitle: `${d.transaction_type || '-'} • Rp ${(d.amount || 0).toLocaleString('id-ID')}`,
              icon: <DollarSign size={14} className="text-emerald-500" />,
              route: '/dashboard'
            });
          }
        });

        // Search tasks
        const taskSnap = await getDocs(query(collection(db, 'neural_tasks'), limit(50)));
        taskSnap.forEach(doc => {
          const d = doc.data();
          const title = (d.title || '').toLowerCase();
          if (title.includes(q)) {
            found.push({
              id: doc.id, type: 'task',
              title: d.title || '-',
              subtitle: `${d.agent || '-'} • ${d.status || '-'}`,
              icon: <ClipboardList size={14} className="text-purple-500" />,
              route: '/dashboard/neural-tasks'
            });
          }
        });

        setResults(found.slice(0, 10));
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [query_text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query_text}
            onChange={e => setQueryText(e.target.value)}
            placeholder="Cari produk, order, transaksi, atau task..."
            className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-6 text-center text-slate-400 text-sm">Mencari...</div>
          ) : query_text.length < 2 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Ketik minimal 2 karakter untuk mencari</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Tidak ditemukan hasil untuk "{query_text}"</div>
          ) : (
            results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { navigate(r.route); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{r.subtitle}</p>
                </div>
                <span className="text-[9px] font-bold text-slate-300 uppercase">{r.type}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span>⌘K untuk buka</span>
          <span>ESC untuk tutup</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
