/**
 * FUSION NEURAL — Finance: Pricing & Pajak
 * Wrapper page combining Pricing Strategy + Tax Calculator into tabbed view
 */
import { useState } from 'react';
import { Tags, Calculator } from 'lucide-react';
import PricingStrategyPage from './PricingStrategyPage';
import TaxCalculatorPage from './TaxCalculatorPage';

const TABS = [
  { id: 'pricing' as const, label: 'Pricing', icon: Tags },
  { id: 'tax' as const, label: 'Pajak', icon: Calculator },
];

export default function FinancePricingTaxPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'tax'>('pricing');

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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'pricing' && <PricingStrategyPage />}
      {activeTab === 'tax' && <TaxCalculatorPage />}
    </div>
  );
}
