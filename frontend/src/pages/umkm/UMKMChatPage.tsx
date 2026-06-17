/**
 * pages/umkm/UMKMChatPage.tsx — Chat Pelanggan + Auto-Reply
 * Role label: Admin
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Bot, User, Plus, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import BottomNav from '../../components/umkm/BottomNav';

type ChatStatus = 'ai' | 'manual';

interface ChatItem {
  id: string;
  phone: string;
  name: string;
  lastMsg: string;
  reply: string;
  status: ChatStatus;
  time: string;
  platform: 'wa' | 'ig';
}

interface AutoReplyRule {
  id: string;
  trigger: string;
  response: string;
  active: boolean;
}

const DEMO_CHATS: ChatItem[] = [
  { id: '1', phone: '+62812xxxx', name: 'Rina', lastMsg: 'Ready kaos hitam?', reply: 'Siap kak, warna hitam ada. Mau ukuran apa?', status: 'ai', time: '2 menit lalu', platform: 'wa' },
  { id: '2', phone: '+62856xxxx', name: 'Budi', lastMsg: 'Kapan dikirim?', reply: 'Besok pagi kak, resi dikirim via WA ya.', status: 'ai', time: '5 menit lalu', platform: 'wa' },
  { id: '3', phone: '+62878xxxx', name: 'Sari', lastMsg: 'Barang saya rusak!', reply: '', status: 'manual', time: '10 menit lalu', platform: 'wa' },
  { id: '4', phone: '@dian_shop', name: 'Dian', lastMsg: 'Bisa kurang?', reply: 'Maaf kak, harga sudah nett. Tapi kalau beli 3 dapat diskon 10%.', status: 'ai', time: '15 menit lalu', platform: 'ig' },
  { id: '5', phone: '+62899xxxx', name: 'Andi', lastMsg: 'Ongkir ke Surabaya?', reply: 'Estimasi Rp 15.000 kak, via JNE.', status: 'ai', time: '20 menit lalu', platform: 'wa' },
];

const DEMO_RULES: AutoReplyRule[] = [
  { id: '1', trigger: 'ready', response: 'Cek stok, jawab tersedia + warna/ukuran', active: true },
  { id: '2', trigger: 'ongkir', response: 'Kirim estimasi ongkir berdasarkan kota', active: true },
  { id: '3', trigger: 'kapan kirim', response: 'Besok pagi kak, resi dikirim via WA', active: true },
  { id: '4', trigger: 'bisa kurang', response: 'Harga sudah nett, tawarkan diskon bundle', active: true },
];

export default function UMKMChatPage() {
  const [filter, setFilter] = useState<'all' | 'ai' | 'manual'>('all');
  const [showRules, setShowRules] = useState(false);

  const filtered = filter === 'all'
    ? DEMO_CHATS
    : DEMO_CHATS.filter(c => c.status === filter);

  const aiCount = DEMO_CHATS.filter(c => c.status === 'ai').length;
  const manualCount = DEMO_CHATS.filter(c => c.status === 'manual').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-black text-slate-800">Chat Pelanggan</h1>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">AI AKTIF</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all' as const, label: 'Semua', count: DEMO_CHATS.length },
              { key: 'ai' as const, label: 'AI Handle', count: aiCount },
              { key: 'manual' as const, label: 'Perlu Kamu', count: manualCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {/* Chat List */}
        {filtered.map((chat, i) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white border rounded-2xl p-4 ${
              chat.status === 'manual' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">
                  {chat.platform === 'wa' ? '📱' : '📸'}
                </span>
                <span className="text-sm font-bold text-slate-700">{chat.name}</span>
                <span className="text-[10px] text-slate-400">{chat.phone}</span>
              </div>
              <span className="text-[10px] text-slate-400">{chat.time}</span>
            </div>

            <p className="text-sm text-slate-800 mb-1">"{chat.lastMsg}"</p>

            {chat.status === 'ai' ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700">AI JAWAB</span>
                </div>
                <p className="text-sm text-emerald-800">{chat.reply}</p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-orange-600" />
                  <span className="text-[10px] font-bold text-orange-700">PERLU KAMU</span>
                </div>
                <p className="text-sm text-orange-800 mb-2">Komplain — perlu penanganan manual</p>
                <button className="text-xs font-bold text-white bg-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1">
                  <Send className="w-3 h-3" /> Balas Manual
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {/* Auto-Reply Rules */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <span className="text-sm font-bold text-slate-700">⚙️ Auto-Reply Rules</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRules ? 'rotate-180' : ''}`} />
          </button>

          {showRules && (
            <div className="px-4 pb-4 space-y-2">
              {DEMO_RULES.map(rule => (
                <div key={rule.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">"{rule.trigger}"</p>
                    <p className="text-[11px] text-slate-500">→ {rule.response}</p>
                  </div>
                  <button className="text-[10px] font-bold text-purple-600">Edit</button>
                </div>
              ))}
              <button className="w-full text-xs font-bold text-purple-600 bg-purple-50 py-2.5 rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Tambah Rule
              </button>
            </div>
          )}
        </motion.div>

        {/* Connection Status */}
        <div className="flex gap-2">
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">📱</span>
            <span className="text-xs font-bold text-emerald-700">WhatsApp: Terhubung</span>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">📸</span>
            <span className="text-xs font-bold text-emerald-700">Instagram: Terhubung</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
