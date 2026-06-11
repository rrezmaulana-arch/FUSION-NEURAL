/**
 * FUSION NEURAL — Notification History Panel
 * Shows all notifications with mark-as-read functionality.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  agent?: string;
  message?: string;
  status?: string;
  created_at?: any;
}

export default function NotificationHistory({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const q = query(collection(db, 'realtime_signals'), orderBy('created_at', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    });
    return () => unsub();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'realtime_signals', id), { status: 'read' });
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => n.status !== 'read');
    for (const n of unread) {
      try { await updateDoc(doc(db, 'realtime_signals', n.id), { status: 'read' }); } catch {}
    }
  };

  const deleteNotification = async (id: string) => {
    try { await deleteDoc(doc(db, 'realtime_signals', id)); } catch {}
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => n.status !== 'read')
    : notifications;

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-full right-0 mt-2 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-slate-600" />
            <h3 className="text-sm font-black text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50">
                Tandai Semua Dibaca
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Semua ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${filter === 'unread' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Belum Dibaca ({unreadCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
          </div>
        ) : (
          filtered.map(n => (
            <div key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${n.status !== 'read' ? 'bg-blue-50/50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">{n.agent || 'System'}</span>
                  <span className="text-[9px] text-slate-400">
                    {n.created_at?.toDate?.()?.toLocaleString('id-ID') || ''}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message || '-'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {n.status !== 'read' && (
                  <button onClick={() => markAsRead(n.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-500" title="Tandai dibaca">
                    <Check size={12} />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-500" title="Hapus">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
