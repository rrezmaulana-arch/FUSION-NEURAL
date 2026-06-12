/**
 * Project: FUSION NEURAL
 * Pricing config — sesuai Business Plan
 * Source of truth untuk semua harga di landing page dan order page.
 */

export interface TierPricing {
  name: string;
  setup: number;      // One-time setup fee
  monthly: number;    // Monthly subscription
  agents: number;     // Number of AI agents
  description: string;
}

export const PRICING: Record<string, TierPricing> = {
  starter: {
    name: 'Starter Agent',
    setup: 4900000,
    monthly: 1800000,
    agents: 1,
    description: 'Satu agen AI sesuai pilihan (Admin/Finance/Marketing)',
  },
  dual: {
    name: 'Dual Synergy',
    setup: 8900000,
    monthly: 3000000,
    agents: 2,
    description: 'Dua agen AI tersinkronisasi untuk sinergi operasional lebih tinggi',
  },
  full: {
    name: 'Full One Man Company',
    setup: 14900000,
    monthly: 4800000,
    agents: 4,
    description: 'Ekosistem penuh: Admin + Finance + Marketing + Manager',
  },
};

export function getTierName(tierKey: string): string {
  return PRICING[tierKey]?.name || 'Unknown Tier';
}
