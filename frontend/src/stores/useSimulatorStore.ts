/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
// src/stores/useSimulatorStore.ts
// Zustand store — Market Simulator State
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SimulatorStats {
  revenue?: number;
  cost?: number;
  orders?: number;
  last_event?: string;
  logs?: string[];
  new_orders?: unknown[];
  inventory_items?: unknown[];
  geo_stats?: Record<string, number>;
}

interface SimulatorState {
  isSimulating: boolean;
  simulatorStats: SimulatorStats;

  // Actions
  setSimulating: (value: boolean) => void;
  setSimulatorStats: (stats: SimulatorStats) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useSimulatorStore = create<SimulatorState>((set) => ({
  isSimulating: false,
  simulatorStats: {},

  setSimulating: (value) => set({ isSimulating: value }),
  setSimulatorStats: (stats) => set({ simulatorStats: stats }),
}));
