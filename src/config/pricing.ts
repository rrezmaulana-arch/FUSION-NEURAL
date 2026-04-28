// src/config/pricing.ts
// Single Source of Truth for FusionNeural Pricing

export interface TierPricing {
  name: string;
  p50: number; // 50% Sinergi Hybrid (Setup)
  p50Monthly: number; // 50% Sinergi Hybrid (Monthly)
  p100: number; // 100% Full Otonom AI (Setup)
  p100Monthly: number; // 100% Full Otonom AI (Monthly)
}

export const PRICING: Record<string, TierPricing> = {
  tier1: {
    name: 'Starter Agent (1 Agen AI)',
    p50: 2900000,
    p50Monthly: 990000,
    p100: 4900000,
    p100Monthly: 1790000,
  },
  tier2: {
    name: 'Dual Synergy (2 Agen AI)',
    p50: 5400000,
    p50Monthly: 1750000,
    p100: 8900000,
    p100Monthly: 2950000,
  },
  tier3: {
    name: 'Full One Man Company (4 Agen AI)',
    p50: 8400000,
    p50Monthly: 2690000,
    p100: 14900000,
    p100Monthly: 4750000,
  },
};

export function getTierName(tierKey: string): string {
  return PRICING[tierKey]?.name || 'Unknown Tier';
}
