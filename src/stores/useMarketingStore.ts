// src/stores/useMarketingStore.ts
// Zustand store — Marketing Agent State (Synced with Firestore)
import { create } from 'zustand';
import type { ElementType } from 'react';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowRightLeft } from 'lucide-react'; // Default icon for conversions

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Conversion {
  id: string; // Changed from number to string for Firestore ID
  title: string;
  desc: string;
  val: string;
  icon?: ElementType;
}

interface MarketingState {
  campaignActive: boolean;
  budgetUsed: number;
  conversions: Conversion[];
  eqHeights: number[];

  // Actions
  setCampaignActive: (active: boolean) => void;
  tickEqualizer: () => void;
  initializeListeners: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
let listenersInitialized = false;

export const useMarketingStore = create<MarketingState>((set) => ({
  campaignActive: false,
  budgetUsed: 1_200,
  conversions: [],
  eqHeights: [40, 70, 30, 90, 50, 80, 20, 60, 100, 40, 70, 30, 80, 50, 40],

  setCampaignActive: (active) => set({ campaignActive: active }),

  tickEqualizer: () =>
    set({
      eqHeights: Array.from({ length: 15 }, () => Math.floor(Math.random() * 80) + 20),
    }),

  initializeListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Listen to Marketing Stats (Budget Used)
    const statsRef = doc(db, 'marketing_metrics', 'stats');
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set((state) => ({
          budgetUsed: data.budgetUsed || state.budgetUsed,
        }));
      }
    });

    // Listen to Marketing Conversions
    const convQuery = query(
      collection(db, 'marketing_conversions'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    onSnapshot(convQuery, (snapshot) => {
      const convs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'Unknown Conversion',
          desc: data.desc || '',
          val: data.val || '',
          icon: ArrowRightLeft // Using a default icon since Firestore can't store React components
        };
      }) as Conversion[];
      set({ conversions: convs });
    });
  },
}));

// Auto-initialize when file is imported
useMarketingStore.getState().initializeListeners();
