/**
 * Project: FUSION NEURAL
 * Pricing config — UMKM-friendly pricing
 * Source of truth untuk semua harga di landing page dan order page.
 */

export interface TierPricing {
  name: string;
  setup: number;
  monthly: number;
  agents: number;
  description: string;
  features: string[];
}

export const PRICING: Record<string, TierPricing> = {
  gratis: {
    name: 'Gratis',
    setup: 0,
    monthly: 0,
    agents: 0,
    description: 'Coba fitur dasar tanpa biaya',
    features: [
      'AI copywriting 5x/hari',
      'Tax calculator',
      'Inventory dasar (10 produk)',
      'Dashboard ringkasan',
    ],
  },
  starter: {
    name: 'Starter',
    setup: 0,
    monthly: 199000,
    agents: 1,
    description: 'AI CS WhatsApp yang jawab pelanggan otomatis',
    features: [
      'WhatsApp auto-reply 24/7',
      'Auto-reply rules unlimited',
      'Chat monitor',
      'Invoice & faktur',
      'Hutang piutang',
      'Inventory unlimited',
      'Laporan keuangan',
    ],
  },
  pro: {
    name: 'Pro',
    setup: 0,
    monthly: 499000,
    agents: 2,
    description: 'Full automation: WA + Instagram + Laporan Bank',
    features: [
      'Semua fitur Starter',
      'Instagram DM auto-reply',
      'Instagram komentar auto-reply',
      'Laporan KUR untuk bank',
      'Jadwal post otomatis',
      'Priority support',
      'Unlimited AI copywriting',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    setup: 0,
    monthly: -1,
    agents: 4,
    description: 'Kustom untuk kebutuhan bisnis Anda',
    features: [
      'Semua fitur Pro',
      'Multi-user (staff)',
      'API access',
      'Custom integration',
      'Dedicated support',
      'Shopee/Tokopedia sync',
    ],
  },
};

export function getTierName(tierKey: string): string {
  return PRICING[tierKey]?.name || 'Unknown Tier';
}
