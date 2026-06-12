/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
// src/stores/useAdminStore.ts
// Zustand store — Admin Agent State (synced with Firestore)
import { create } from 'zustand';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  time: string;
  lat: string;
  status: string;
  style: string;
}

interface AdminState {
  payloads: number;
  activeNodes: number;
  adminLogs: LogEntry[];
  adminChartData: { h1: number; h2: number }[];

  // Actions
  addLog: (entry: Omit<LogEntry, 'id' | 'time'>) => void;
  initializeListeners: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
let listenersInitialized = false;

export const useAdminStore = create<AdminState>((set) => ({
  // Semua nilai awal 0 — akan diisi dari Firestore
  payloads: 0,
  activeNodes: 0,
  adminLogs: [],
  adminChartData: Array.from({ length: 7 }, () => ({ h1: 0, h2: 0 })),

  addLog: (entry) =>
    set((state) => ({
      adminLogs: [
        {
          id: `#ND-${Math.floor(Math.random() * 900) + 100}`,
          time: 'Just now',
          ...entry,
        },
        ...state.adminLogs,
      ].slice(0, 6),
    })),

  initializeListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Listen to Admin Metrics (payloads, activeNodes)
    const statsRef = doc(db, 'admin_metrics', 'stats');
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          payloads: data.payloads ?? 0,
          activeNodes: data.active_nodes ?? 0,
        });
      }
    });

    // Listen to System Logs (terbaru)
    const logsQuery = query(
      collection(db, 'system_logs'),
      orderBy('created_at', 'desc'),
      limit(6)
    );
    onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          time: data.created_at?.toDate
            ? data.created_at.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          lat: data.latency_ms ? `${data.latency_ms}ms` : '-',
          status: data.status || 'OK',
          style: data.status === 'Error'
            ? 'bg-rose-50 text-rose-600'
            : 'bg-purple-50 text-purple-600',
        } as LogEntry;
      });
      set({ adminLogs: logs });
    });
  },
}));

// Auto-initialize when file is imported
useAdminStore.getState().initializeListeners();

