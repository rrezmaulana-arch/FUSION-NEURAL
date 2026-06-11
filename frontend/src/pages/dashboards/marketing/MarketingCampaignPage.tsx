/**
 * FUSION NEURAL — Marketing: Kampanye
 * Wrapper page combining Campaign Forge + Email Campaigns + Content Launchpad into tabbed view
 */
import { useState } from 'react';
import { Sparkles, Mail, CalendarDays } from 'lucide-react';
import CampaignForgePage from './CampaignForgePage';
import EmailCampaignPage from './EmailCampaignPage';
import ContentLaunchpadPage from './ContentLaunchpadPage';

const TABS = [
  { id: 'generator' as const, label: 'Generator', icon: Sparkles },
  { id: 'email' as const, label: 'Email', icon: Mail },
  { id: 'schedule' as const, label: 'Jadwal Konten', icon: CalendarDays },
];

export default function MarketingCampaignPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'email' | 'schedule'>('generator');

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
      {activeTab === 'generator' && <CampaignForgePage />}
      {activeTab === 'email' && <EmailCampaignPage />}
      {activeTab === 'schedule' && <ContentLaunchpadPage />}
    </div>
  );
}
