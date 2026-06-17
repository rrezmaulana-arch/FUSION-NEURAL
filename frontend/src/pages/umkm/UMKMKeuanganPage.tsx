/**
 * pages/umkm/UMKMKeuanganPage.tsx — Revenue, Profit, Pajak, Invoice
 * Role label: Finance
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Receipt, FileText, Send, Download, ChevronDown, Calculator } from 'lucide-react';
import BottomNav from '../../components/umkm/BottomNav';

const DEMO_FINANCE = {
  revenue: 45000000,
  hpp: 28000000,
  profit: 17000000,
  ppn: 5400000,
  pph: 225000,
  totalPajak: 5625000,
};

const DEMO_RECEIVABLES = [
  { id: '1', name: 'Budi (Warung Jaya)', amount: 2000000, dueDate: '25 Jun 2026', phone: '+62812xxxx' },
  { id: '2', name: 'Sari (Toko Cantik)', amount: 750000, dueDate: '30 Jun 2026', phone: '+62856xxxx' },
];

export default function UMKMKeuanganPage() {
  const [showPajak, setShowPajak] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-black text-slate-800">Keuangan</h1>
            </div>
            <select className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border-0">
              <option>Juni 2026</option>
              <option>Mei 2026</option>
              <option>April 2026</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* 3 Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
            <p className="text-lg font-black text-slate-800 mt-1">Rp {(DEMO_FINANCE.revenue / 1000000).toFixed(0)}jt</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">HPP</p>
            <p className="text-lg font-black text-orange-600 mt-1">Rp {(DEMO_FINANCE.hpp / 1000000).toFixed(0)}jt</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Profit</p>
            <p className="text-lg font-black text-emerald-700 mt-1">Rp {(DEMO_FINANCE.profit / 1000000).toFixed(0)}jt</p>
          </div>
        </motion.div>

        {/* Pajak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setShowPajak(!showPajak)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Pajak Bulan Ini</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800">Rp {DEMO_FINANCE.totalPajak.toLocaleString()}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showPajak ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showPajak && (
            <div className="px-4 pb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">PPN 12% (UU HPP 2025)</span>
                <span className="font-bold text-slate-800">Rp {DEMO_FINANCE.ppn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">PPh Final UMKM 0.5%</span>
                <span className="font-bold text-slate-800">Rp {DEMO_FINANCE.pph.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-slate-700">Total</span>
                <span className="font-black text-blue-700">Rp {DEMO_FINANCE.totalPajak.toLocaleString()}</span>
              </div>
              <button className="w-full text-xs font-bold text-white bg-blue-600 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                Bayar Sekarang
              </button>
            </div>
          )}
        </motion.div>

        {/* Hutang Piutang */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-slate-700">Hutang Piutang</span>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
              {DEMO_RECEIVABLES.length} belum bayar
            </span>
          </div>

          {DEMO_RECEIVABLES.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-bold text-slate-800">{r.name}</p>
                <p className="text-[11px] text-slate-500">Jatuh tempo: {r.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-orange-700">Rp {r.amount.toLocaleString()}</p>
                <button className="text-[10px] font-bold text-purple-600 mt-0.5 flex items-center gap-0.5 ml-auto">
                  <Send className="w-2.5 h-2.5" /> Reminder WA
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-slate-700">Buat Invoice</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all">
            <Download className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Laporan KUR PDF</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
