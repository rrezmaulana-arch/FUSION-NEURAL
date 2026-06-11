/**
 * FUSION NEURAL — Page Title Hook
 * Sets document title based on current page.
 */
import { useEffect } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Pesanan & Pengiriman',
  '/dashboard/simulator': 'Simulator',
  '/dashboard/pricing': 'Pricing & Pajak',
  '/dashboard/ap-ar': 'Tagihan (AP/AR)',
  '/dashboard/image-studio': 'Media Studio',
  '/dashboard/analytics': 'Analytics & CRM',
  '/dashboard/orchestrator': 'Automation Center',
  '/dashboard/executive': 'Daily Briefing',
  '/dashboard/war-room': 'War Room',
  '/dashboard/strategic-audit': 'Approval Queue',
  '/dashboard/neural-tasks': 'Task Board',
};

export function usePageTitle(pathname: string) {
  useEffect(() => {
    const title = PAGE_TITLES[pathname] || 'Dashboard';
    document.title = `${title} — Fusion Neural`;
  }, [pathname]);
}
