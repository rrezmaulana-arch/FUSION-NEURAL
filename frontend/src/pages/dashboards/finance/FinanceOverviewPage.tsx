/**
 * FUSION NEURAL — Finance: Keuangan
 * Wrapper page combining Profit Ledger + Bank Recon + Burn Rate into tabbed view
 */
import { useState } from 'react';
import { BookOpen, Activity, Flame } from 'lucide-react';
import ProfitLedgerPage from './ProfitLedgerPage';
import BankReconPage from './BankReconPage';
import OperationalBurnPage from './OperationalBurnPage';

const TABS = [
  { id: 'profit' as const, label: 'Laba Rugi', icon: BookOpen },
  { id: 'cashflow' as const, label: 'Arus Kas', icon: Activity },
  { id: 'burn' as const, label: 'Burn Rate', icon: Flame },
];

export default function FinanceOverviewPage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'cashflow' | 'burn'>('profit');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 w-max shadow-sm mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profit' && <ProfitLedgerPage />}
      {activeTab === 'cashflow' && <BankReconPage />}
      {activeTab === 'burn' && <OperationalBurnPage />}
    </div>
  );
}

