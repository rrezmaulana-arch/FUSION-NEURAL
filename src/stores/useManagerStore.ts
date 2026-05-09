// src/stores/useManagerStore.ts
// Zustand store — Manager Agent State
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────
export type AgentStatus = 'Online' | 'Offline' | 'Busy';

export interface Performer {
  id: string;
  name: string;
  role: string;
  score: number;
  status: AgentStatus;
  initial: string;
  color: string;
}

interface ManagerState {
  systemRequests: number;
  performers: Performer[];

  // Actions
  tickRequests: () => void;
  pingPerformer: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useManagerStore = create<ManagerState>((set) => ({
  systemRequests: 824,
  performers: [
    { id: '1', name: 'AI Manager',   role: 'Cortex',    score: 99.8, status: 'Online', initial: 'MGR', color: 'bg-indigo-100 text-indigo-600' },
    { id: '2', name: 'AI Admin',     role: 'Logistics', score: 98.5, status: 'Online', initial: 'ADM', color: 'bg-emerald-100 text-emerald-600' },
    { id: '3', name: 'AI Marketing', role: 'Expansion', score: 96.2, status: 'Online', initial: 'MKT', color: 'bg-amber-100 text-amber-600' },
    { id: '4', name: 'AI Finance',   role: 'Guardian',  score: 99.9, status: 'Online', initial: 'FIN', color: 'bg-rose-100 text-rose-600' },
  ],

  tickRequests: () =>
    set((state) => ({
      systemRequests: state.systemRequests + Math.floor(Math.random() * 5),
    })),

  pingPerformer: (id) =>
    set((state) => ({
      performers: state.performers.map((p) => {
        if (p.id !== id) return p;
        const nextStatus: AgentStatus =
          p.status === 'Online' ? 'Busy' : p.status === 'Busy' ? 'Offline' : 'Online';
        return { ...p, status: nextStatus };
      }),
    })),
}));
