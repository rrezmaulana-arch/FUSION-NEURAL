/**
 * FUSION NEURAL — Marketing: Analytics & CRM
 * Wrapper page combining Marketing Analytics + Audience CRM into tabbed view
 */
import { useState } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import MarketingAnalyticsPage from './MarketingAnalyticsPage';
import AudienceCRMPage from './AudienceCRMPage';

const TABS = [
  { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
  { id: 'crm' as const, label: 'CRM & Audiens', icon: Users },
];

export default function MarketingAnalyticsCRMPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'crm'>('analytics');

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
      {activeTab === 'analytics' && <MarketingAnalyticsPage />}
      {activeTab === 'crm' && <AudienceCRMPage />}
    </div>
  );
}
