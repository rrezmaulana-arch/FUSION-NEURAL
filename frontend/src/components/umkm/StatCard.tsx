/**
 * components/umkm/StatCard.tsx — Reusable stat card for UMKM dashboard
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  alert?: boolean;
  onClick?: () => void;
}

const COLOR_MAP = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
};

export default function StatCard({ icon: Icon, label, value, sub, color = 'purple', alert, onClick }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <button
      onClick={onClick}
      className={`${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'} border rounded-2xl p-4 flex flex-col gap-2 text-left hover:shadow-md transition-all active:scale-[0.98] w-full`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${alert ? 'bg-red-100' : c.icon} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${alert ? 'text-red-600' : c.text}`} />
        </div>
        {alert && (
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            ALERT
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-black ${alert ? 'text-red-700' : 'text-slate-800'} mt-0.5`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}
