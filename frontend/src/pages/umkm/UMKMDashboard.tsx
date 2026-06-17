/**
 * pages/umkm/UMKMDashboard.tsx — Beranda UMKM
 * 4 kartu statistik + ringkasan AI + chat terakhir + stok alert
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Package, Wallet, TrendingUp, Bot, AlertTriangle, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/umkm/StatCard';
import BottomNav from '../../components/umkm/BottomNav';

// Demo data — nanti diganti dengan Firestore real
const DEMO_DATA = {
  ordersToday: 12,
  revenueToday: 2340000,
  chatTotal: 47,
  chatAI: 43,
  chatManual: 4,
  stockAlerts: [
    { name: 'Kaos Oversize Hitam', qty: 3, min: 5 },
  ],
  recentChats: [
    { phone: '+62812xxxx', msg: 'Ready kaos hitam?', reply: 'Siap kak, ada hitam dan putih.', status: 'ai' as const },
    { phone: '+62856xxxx', msg: 'Kapan dikirim?', reply: 'Besok pagi kak.', status: 'ai' as const },
    { phone: '+62878xxxx', msg: 'Barang saya rusak!', reply: '', status: 'manual' as const },
  ],
  scheduledPosts: [
    { time: '12:00', platform: 'IG', content: 'Caption promo Juni', status: 'ready' },
    { time: '18:00', platform: 'TikTok', content: 'Skrip unboxing', status: 'draft' },
  ],
  aiSummary: 'Stok kaos oversize hitam tinggal 3 unit, sebaiknya restock minggu ini. Revenue hari ini naik 15% dari kemarin. Ada 4 chat yang perlu dibalas manual karena komplain pelanggan.',
};

export default function UMKMDashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat pagi');
    else if (hour < 17) setGreeting('Selamat siang');
    else setGreeting('Selamat malam');
  }, []);

  const name = userProfile?.displayName || 'Owner';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm text-slate-500 font-medium">{greeting},</p>
              <h1 className="text-2xl font-black text-slate-800">{name} 👋</h1>
            </div>
            <button
              onClick={() => navigate('/umkm/settings')}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* 4 Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard
            icon={TrendingUp}
            label="Order Hari Ini"
            value={DEMO_DATA.ordersToday}
            color="green"
            onClick={() => navigate('/umkm/stok')}
          />
          <StatCard
            icon={Wallet}
            label="Revenue"
            value={`Rp ${(DEMO_DATA.revenueToday / 1000000).toFixed(1)}jt`}
            color="purple"
            onClick={() => navigate('/umkm/keuangan')}
          />
          <StatCard
            icon={MessageCircle}
            label="Chat Masuk"
            value={`${DEMO_DATA.chatAI}/${DEMO_DATA.chatTotal}`}
            sub="AI handle otomatis"
            color="blue"
            onClick={() => navigate('/umkm/chat')}
          />
          <StatCard
            icon={Package}
            label="Stok Alert"
            value={DEMO_DATA.stockAlerts.length > 0 ? `${DEMO_DATA.stockAlerts.length} produk` : 'Aman'}
            color={DEMO_DATA.stockAlerts.length > 0 ? 'red' : 'green'}
            alert={DEMO_DATA.stockAlerts.length > 0}
            onClick={() => navigate('/umkm/stok')}
          />
        </motion.div>

        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Ringkasan AI</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{DEMO_DATA.aiSummary}</p>
        </motion.div>

        {/* Chat Terakhir */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-slate-700">💬 Chat Terakhir</h3>
            <button
              onClick={() => navigate('/umkm/chat')}
              className="text-xs font-semibold text-purple-600 flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {DEMO_DATA.recentChats.map((chat, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{chat.phone}</p>
                  <p className="text-sm text-slate-800 truncate">{chat.msg}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${
                  chat.status === 'ai'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {chat.status === 'ai' ? '✅ AI' : '⚠️ Kamu'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stok Alert */}
        {DEMO_DATA.stockAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">Stok Kritis</span>
            </div>
            {DEMO_DATA.stockAlerts.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-red-800">{item.name}: <strong>{item.qty} unit</strong></span>
                <button className="text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                  Restock
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Jadwal Post */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-700">Jadwal Post Hari Ini</span>
          </div>
          {DEMO_DATA.scheduledPosts.map((post, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="text-xs font-mono text-slate-500 w-12">{post.time}</span>
              <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{post.platform}</span>
              <span className="text-sm text-slate-700 flex-1">{post.content}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                post.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {post.status === 'ready' ? '✅ Siap' : '✎ Draft'}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
