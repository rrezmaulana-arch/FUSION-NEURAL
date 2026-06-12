/**
 * FUSION NEURAL — Marketing: Kampanye
 * Flow: Jadwal Konten → Generate Kampanye → Email Campaign
 * Campaign brief hanya dibutuhkan saat mau upload/posting.
 */
import { useState } from 'react';
import { CalendarDays, Sparkles, Mail } from 'lucide-react';
import CampaignForgePage from './CampaignForgePage';
import EmailCampaignPage from './EmailCampaignPage';
import ContentLaunchpadPage from './ContentLaunchpadPage';

const TABS = [
  { id: 'schedule' as const, label: 'Jadwal Konten', icon: CalendarDays, desc: 'Atur & jadwalkan konten' },
  { id: 'generator' as const, label: 'Generate Kampanye', icon: Sparkles, desc: 'Buat caption & brief' },
  { id: 'email' as const, label: 'Email Campaign', icon: Mail, desc: 'Kirim email marketing' },
];

export default function MarketingCampaignPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'generator' | 'email'>('schedule');

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
            title={tab.desc}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && <ContentLaunchpadPage />}
      {activeTab === 'generator' && <CampaignForgePage />}
      {activeTab === 'email' && <EmailCampaignPage />}
    </div>
  );
}
