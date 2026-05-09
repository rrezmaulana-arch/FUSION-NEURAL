// src/stores/useFinanceStore.ts
// Zustand store — Finance Agent State (Synced with Firestore)
import { create } from 'zustand';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Transaction {
  id: string; // Changed from number to string for Firestore ID
  type: string;
  amount: number;
  time: string;
  isPositive: boolean;
}

interface FinanceState {
  revenue: number;
  expenses: number;
  budget: number;
  transactions: Transaction[];
  chartData: number[];

  // Actions
  initializeListeners: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
let listenersInitialized = false;

export const useFinanceStore = create<FinanceState>((set) => ({
  revenue: 2_450_000,
  expenses: 840_000,
  budget: 1_610_000,
  transactions: [],
  chartData: [40, 60, 45, 80, 50, 95], // Can be updated to real historical data later if needed

  initializeListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Listen to Finance Stats (Revenue, Expenses, Budget)
    const statsRef = doc(db, 'finance_metrics', 'stats');
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set((state) => ({
          revenue: data.revenue || state.revenue,
          expenses: data.expenses || state.expenses,
          budget: data.budget || state.budget,
        }));
      }
    });

    // Listen to Finance Transactions
    const txQuery = query(
      collection(db, 'finance_transactions'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Convert timestamp to time ago logic if needed, using simple string for now
        let timeStr = 'Just now';
        if (data.time) {
          const date = new Date(data.time);
          const diffMin = Math.floor((new Date().getTime() - date.getTime()) / 60000);
          timeStr = diffMin < 1 ? 'Just now' : `${diffMin} mins ago`;
        }

        return {
          id: docSnap.id,
          type: data.type || 'Unknown',
          amount: data.amount || 0,
          isPositive: data.isPositive ?? true,
          time: timeStr
        };
      }) as Transaction[];
      set({ transactions: txs });
    });
  },
}));

// Auto-initialize when file is imported
useFinanceStore.getState().initializeListeners();
