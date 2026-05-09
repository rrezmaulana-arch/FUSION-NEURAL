// src/stores/useAdminStore.ts
// Zustand store — Admin Agent State
import { create } from 'zustand';

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
  tickSystem: () => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'time'>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAdminStore = create<AdminState>((set) => ({
  payloads: 11_354,
  activeNodes: 45_439,
  adminLogs: [
    { id: '#HG-101', time: 'Just now', lat: '12ms', status: 'Synced', style: 'bg-emerald-50 text-emerald-600' },
  ],
  adminChartData: Array.from({ length: 7 }, () => ({
    h1: Math.floor(Math.random() * 60) + 20,
    h2: Math.floor(Math.random() * 50) + 20,
  })),

  tickSystem: () =>
    set((state) => ({
      payloads: state.payloads + Math.floor(Math.random() * 15) + 5,
      activeNodes:
        Math.random() > 0.8
          ? state.activeNodes + (Math.random() > 0.5 ? 2 : -2)
          : state.activeNodes,
    })),

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
}));
