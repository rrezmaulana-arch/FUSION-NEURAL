/**
 * pages/umkm/UMKMSettingsPage.tsx — WA Setup, AI Config, Billing, Tim
 * Role label: Manager
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Smartphone, Camera, Bot, CreditCard, Users, ChevronRight, Wifi, WifiOff, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/umkm/BottomNav';

export default function UMKMSettingsPage() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-black text-slate-800">Pengaturan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {/* WhatsApp */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">WhatsApp</p>
              <p className="text-[11px] text-slate-500">Auto-reply pelanggan via WA</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Wifi className="w-3 h-3" /> Terhubung
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700 font-mono">+62 812-xxxx-xxxx</span>
            <button className="text-xs font-bold text-purple-600">Ubah</button>
          </div>
          <button className="w-full mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
            Test Kirim Pesan
          </button>
        </motion.div>

        {/* Instagram */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">Instagram</p>
              <p className="text-[11px] text-slate-500">Auto-reply DM & komentar</p>
            </div>
            <button className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
              Hubungkan
            </button>
          </div>
        </motion.div>

        {/* AI Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">AI Settings</p>
              <p className="text-[11px] text-slate-500">Konfigurasi CS AI Anda</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <span className="text-xs text-slate-500">Nama CS AI</span>
              <span className="text-sm font-bold text-slate-800">Naya</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <span className="text-xs text-slate-500">Bahasa</span>
              <span className="text-sm font-bold text-slate-800">Indonesia</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <span className="text-xs text-slate-500">Auto-Reply</span>
              <button className="w-10 h-6 rounded-full bg-emerald-500 relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Billing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Billing</p>
              <p className="text-[11px] text-slate-500">Paket & pembayaran</p>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-purple-600 font-semibold">Paket Aktif</p>
              <p className="text-sm font-black text-purple-800">Starter — Rp 199rb/bulan</p>
            </div>
            <button className="text-xs font-bold text-white bg-purple-600 px-3 py-1.5 rounded-lg">
              Upgrade
            </button>
          </div>
          <button className="text-xs font-bold text-slate-500 flex items-center gap-1">
            Lihat Invoice <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>

        {/* Tim */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Tim</p>
              <p className="text-[11px] text-slate-500">Kelola akses tim</p>
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{userProfile?.displayName || 'Owner'}</p>
                <p className="text-[10px] text-slate-500">{userProfile?.email}</p>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Owner</span>
            </div>
          </div>
          <button className="w-full text-xs font-bold text-purple-600 bg-purple-50 py-2.5 rounded-xl hover:bg-purple-100 transition-colors">
            + Undang Staff
          </button>
        </motion.div>

        {/* Advanced Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-100 border border-slate-200 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Mode Advanced</p>
                <p className="text-[10px] text-slate-500">Tampilkan dashboard AI Agent terpisah</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAdvancedMode(!advancedMode);
                if (!advancedMode) {
                  navigate('/dashboard');
                }
              }}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                advancedMode ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${
                advancedMode ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
          {advancedMode && (
            <p className="text-[10px] text-slate-500 mt-2">
              Anda akan diarahkan ke dashboard Admin/Finance/Marketing/Manager.
            </p>
          )}
        </motion.div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full text-sm font-bold text-red-600 bg-red-50 py-3 rounded-2xl hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
