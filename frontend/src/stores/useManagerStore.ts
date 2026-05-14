// src/stores/useManagerStore.ts
// Zustand store — Manager Agent State (Synced with Firestore)
import { create } from 'zustand';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
export type AgentStatus = 'Online' | 'Offline' | 'Busy';
export type AgentLevel = 'Trainee' | 'Junior' | 'Senior' | 'Veteran' | 'Godlike';

export interface AgentPosition {
  x: number;
  y: number;
}

export interface RPGStats {
  exp: number;
  level: AgentLevel;
  int: number;
  agi: number;
}

export interface Performer {
  id: string;
  name: string;
  role: string;
  score: number;
  status: AgentStatus;
  initial: string;
  color: string;
  stamina: number;
  position: AgentPosition;
  stats: RPGStats;
  thoughtStream: string;
}

interface ManagerState {
  systemRequests: number;
  performers: Performer[];

  // Infrastructure Deck (dari Firestore system_config)
  companyBudget: number;
  globalBattery: number;
  apiQuotas: {
    groq: number;
    gemini: number;
    huggingface: number;
  };

  // Actions
  pingPerformer: (id: string) => void;
  updatePerformerPosition: (id: string, x: number, y: number) => void;
  updateThought: (id: string, thought: string) => void;
  drainBattery: (amount: number) => void;
  initializeListeners: () => void;
}

// Default posisi agen (layout visual — tidak berubah)
const DEFAULT_POSITIONS: Record<string, { x: number; y: number; initial: string; color: string }> = {
  manager:   { x: 50, y: 50, initial: 'MGR', color: 'bg-indigo-100 text-indigo-600' },
  admin:     { x: 20, y: 30, initial: 'ADM', color: 'bg-emerald-100 text-emerald-600' },
  marketing: { x: 80, y: 30, initial: 'MKT', color: 'bg-amber-100 text-amber-600' },
  finance:   { x: 50, y: 80, initial: 'FIN', color: 'bg-rose-100 text-rose-600' },
};

// ─── Store ────────────────────────────────────────────────────────────────────
let listenersInitialized = false;

export const useManagerStore = create<ManagerState>((set) => ({
  systemRequests: 0,
  companyBudget: 100_000_000, // Rp 100.000.000 — diisi dari Firestore
  globalBattery: 100,
  apiQuotas: { groq: 0, gemini: 0, huggingface: 0 },
  performers: [], // Diisi dari Firestore agent_health

  pingPerformer: (id) =>
    set((state) => ({
      performers: state.performers.map((p) => {
        if (p.id !== id) return p;
        const nextStatus: AgentStatus =
          p.status === 'Online' ? 'Busy' : p.status === 'Busy' ? 'Offline' : 'Online';
        return { ...p, status: nextStatus };
      }),
    })),

  updatePerformerPosition: (id, x, y) =>
    set((state) => ({
      performers: state.performers.map((p) =>
        p.id === id
          ? { ...p, position: { x, y }, stamina: Math.max(0, p.stamina - 0.5) }
          : p
      ),
    })),

  updateThought: (id, thought) =>
    set((state) => ({
      performers: state.performers.map((p) =>
        p.id === id ? { ...p, thoughtStream: thought } : p
      ),
    })),

  drainBattery: (amount) =>
    set((state) => ({
      globalBattery: Math.max(0, state.globalBattery - amount),
    })),

  initializeListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Listen to System Config (budget, battery, api_quotas)
    const configRef = doc(db, 'system_config', 'main');
    onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          companyBudget: data.company_budget ?? 100_000_000,
          globalBattery: data.global_battery ?? 100,
          apiQuotas: {
            groq:        data.api_quotas?.groq        ?? 0,
            gemini:      data.api_quotas?.gemini      ?? 0,
            huggingface: data.api_quotas?.huggingface ?? 0,
          },
          systemRequests: data.total_requests ?? 0,
        });
      }
    });

    // Listen to Agent Health (performers) dari Firestore
    const healthRef = collection(db, 'agent_health');
    onSnapshot(healthRef, (snapshot) => {
      if (snapshot.empty) return;

      const performers = snapshot.docs.map((docSnap, idx) => {
        const data = docSnap.data();
        const agentId = docSnap.id;
        const defaults = DEFAULT_POSITIONS[agentId] ?? {
          x: (idx + 1) * 20,
          y: 50,
          initial: agentId.slice(0, 3).toUpperCase(),
          color: 'bg-slate-100 text-slate-600',
        };

        return {
          id: agentId,
          name: data.name || `AI ${agentId.charAt(0).toUpperCase() + agentId.slice(1)}`,
          role: data.role || agentId,
          score: data.score ?? 0,
          status: (data.status as AgentStatus) ?? 'Online',
          initial: defaults.initial,
          color: defaults.color,
          stamina: data.stamina ?? 100,
          position: data.position ?? { x: defaults.x, y: defaults.y },
          stats: {
            exp:   data.exp   ?? 0,
            level: (data.level as AgentLevel) ?? 'Trainee',
            int:   data.int   ?? 50,
            agi:   data.agi   ?? 50,
          },
          thoughtStream: data.thought_stream || 'Standby...',
        } as Performer;
      });

      set({ performers });
    });
  },
}));

// Auto-initialize when file is imported
useManagerStore.getState().initializeListeners();
