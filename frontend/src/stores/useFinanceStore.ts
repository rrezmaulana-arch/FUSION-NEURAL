/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
// src/stores/useFinanceStore.ts
// Zustand store — Finance Agent State (Synced with Firestore)
// Saldo awal: Rp 100.000.000 (modal awal). Semua data real-time dari Firestore.
import { create } from 'zustand';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  time: string;
  isPositive: boolean;
}

interface FinanceState {
  revenue: number;
  expenses: number;
  budget: number;       // saldo aktif (modal - pengeluaran + pemasukan)
  transactions: Transaction[];
  chartData: number[];

  // Actions
  initializeListeners: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
let listenersInitialized = false;

export const useFinanceStore = create<FinanceState>((set) => ({
  // Modal awal Rp 100.000.000 — akan di-override dari Firestore finance_metrics/stats
  revenue: 0,
  expenses: 0,
  budget: 100_000_000,
  transactions: [],
  chartData: [0, 0, 0, 0, 0, 0], // diisi dari data historis Firestore

  initializeListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Listen to Finance Stats (Revenue, Expenses, Budget)
    const statsRef = doc(db, 'finance_metrics', 'stats');
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          revenue:  data.revenue  ?? 0,
          expenses: data.expenses ?? 0,
          budget:   data.budget   ?? 100_000_000,
          chartData: data.chart_data ?? [0, 0, 0, 0, 0, 0],
        });
      }
    });

    // Listen to Finance Transactions (5 terbaru)
    const txQuery = query(
      collection(db, 'finance_transactions'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let timeStr = 'Just now';
        if (data.timestamp) {
          const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
          const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
          timeStr = diffMin < 1 ? 'Just now' : `${diffMin} menit lalu`;
        }
        return {
          id: docSnap.id,
          type: data.type || 'Transaksi',
          amount: data.amount || 0,
          isPositive: data.isPositive ?? true,
          time: timeStr,
        };
      }) as Transaction[];
      set({ transactions: txs });
    });
  },
}));

// Auto-initialize when file is imported
useFinanceStore.getState().initializeListeners();
