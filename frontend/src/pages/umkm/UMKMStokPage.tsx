/**
 * pages/umkm/UMKMStokPage.tsx — Inventory Simpel + Stok Alert
 * Role label: Admin
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, AlertTriangle, Download, Upload, Edit2, Trash2 } from 'lucide-react';
import BottomNav from '../../components/umkm/BottomNav';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
}

const DEMO_PRODUCTS: Product[] = [
  { id: '1', name: 'Kaos Oversize Hitam', price: 89000, stock: 3, minStock: 5, category: 'Fashion' },
  { id: '2', name: 'Kaos Oversize Putih', price: 89000, stock: 12, minStock: 5, category: 'Fashion' },
  { id: '3', name: 'Totebag Canvas', price: 65000, stock: 15, minStock: 5, category: 'Fashion' },
  { id: '4', name: 'Tumbler Stainless 500ml', price: 75000, stock: 8, minStock: 3, category: 'Aksesoris' },
];

export default function UMKMStokPage() {
  const [showAdd, setShowAdd] = useState(false);
  const alerts = DEMO_PRODUCTS.filter(p => p.stock <= p.minStock);
  const safe = DEMO_PRODUCTS.filter(p => p.stock > p.minStock);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-black text-slate-800">Stok Produk</h1>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-xs font-bold text-white bg-purple-600 px-3 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">Stok Kritis ({alerts.length})</span>
            </div>
            {alerts.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-red-800">{p.name}</p>
                  <p className="text-[11px] text-red-600">Stok: {p.stock} unit (min: {p.minStock})</p>
                </div>
                <button className="text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                  Restock
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* All Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
        >
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Semua Produk ({DEMO_PRODUCTS.length})</span>
            <div className="flex gap-2">
              <button className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                <Download className="w-3 h-3" /> Export
              </button>
              <button className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                <Upload className="w-3 h-3" /> Import
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {DEMO_PRODUCTS.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-[11px] text-slate-500">Rp {p.price.toLocaleString()} • {p.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-lg font-black ${p.stock <= p.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.stock}
                    </p>
                    <p className="text-[10px] text-slate-400">unit</p>
                  </div>
                  {p.stock <= p.minStock && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      ⚠️
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Produk</span>
          <span className="text-sm font-black text-slate-800">{DEMO_PRODUCTS.length} item • {DEMO_PRODUCTS.reduce((a, p) => a + p.stock, 0)} unit</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
