/**
 * Project: FUSION NEURAL
 * Email Campaign Studio — AI-Powered Email Marketing Dashboard
 * Domain: Neural Marketing (Pink/Purple Theme)
 * Human-in-the-Loop: All campaigns require Manager APPROVE before sending.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Users, Send, Plus, Eye,
  CheckCircle, Clock, Loader, Sparkles, AlertTriangle,
  TrendingUp, MousePointer, X
} from 'lucide-react';

// Use relative path → works via Vite proxy (local) and Vercel rewrite (prod)
const API_BASE = '';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  campaignName: string;
  subject: string;
  status: 'Draft' | 'Sending' | 'Sent' | 'Failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  opens: number;
  clicks: number;
  sendProgress: number;
  createdAt: string;
  sentAt?: string;
  agentId: string;
  htmlBody?: string;
  notes?: string;
}

interface Lead {
  id: string;
  email: string;
  name: string;
  segment: string;
  status: string;
  addedAt: string;
}

// ── Status Badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    Draft:   { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock size={11}/>, label: 'Draft' },
    Sending: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',   icon: <Loader size={11} className="animate-spin"/>, label: 'Sending...' },
    Sent:    { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle size={11}/>, label: 'Sent' },
    Failed:  { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <AlertTriangle size={11}/>, label: 'Failed' },
    Pending: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: <Clock size={11}/>, label: 'Pending Approval' },
  };
  const c = config[status] || config.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.color}`}>
      {c.icon}{c.label}
    </span>
  );
};

// ── HTML Preview Modal ─────────────────────────────────────────────────────────
const HtmlPreviewModal = ({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-purple-500/20 bg-[#0d0617]"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <h3 className="text-white font-bold text-sm">{campaign.campaignName}</h3>
          <p className="text-purple-300/60 text-xs mt-0.5">Subject: {campaign.subject}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <X size={16}/>
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <iframe
          srcDoc={campaign.htmlBody || '<p style="color:white;padding:20px">No preview available</p>'}
          title="Email Preview"
          className="w-full h-[500px] border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </motion.div>
  </motion.div>
);

// ── AI Draft Modal ─────────────────────────────────────────────────────────────
const AIDraftModal = ({ leads, onClose, onSuccess }: { leads: Lead[]; onClose: () => void; onSuccess: () => void }) => {
  const [brief, setBrief] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; recipientCount?: number } | null>(null);
  const [error, setError] = useState('');

  const segments = ['All', ...Array.from(new Set(leads.map(l => l.segment)))];
  const filteredLeads = segmentFilter === 'All' ? leads : leads.filter(l => l.segment === segmentFilter);

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };
  const selectAll = () => setSelectedEmails(filteredLeads.map(l => l.email));
  const clearAll = () => setSelectedEmails([]);

  const handleGenerate = async () => {
    if (!brief.trim() || selectedEmails.length === 0 || !campaignName.trim()) {
      setError('Isi nama kampanye, brief, dan pilih minimal 1 penerima.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/campaign/ai-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, campaignName, recipients: selectedEmails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Gagal membuat draft');
      setResult(data);
      setTimeout(() => { onSuccess(); onClose(); }, 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/20 bg-[#0d0617]"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
              <Sparkles size={16} className="text-purple-300"/>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AI Campaign Studio</h3>
              <p className="text-purple-300/60 text-xs">Neural Marketing akan menulis & menyiapkan email</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider mb-2 block">Nama Kampanye</label>
            <input
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="Misal: Promo Lebaran 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Brief */}
          <div>
            <label className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider mb-2 block">Brief Kampanye</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Deskripsikan kampanye emailnya secara detail... Misal: 'Buat email promo diskon 50% untuk produk fashion premium. Target: member VIP yang sudah belanja > 3 kali. Nada: eksklusif, personal, urgent.'"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            />
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">Pilih Penerima ({selectedEmails.length} dipilih)</label>
              <div className="flex items-center gap-2">
                <select
                  value={segmentFilter}
                  onChange={e => setSegmentFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={selectAll} className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold">All</button>
                <button onClick={clearAll} className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold">Clear</button>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
              {filteredLeads.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">Belum ada leads. Tambahkan kontak terlebih dahulu.</p>
              ) : filteredLeads.map(lead => (
                <label key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(lead.email)}
                    onChange={() => toggleEmail(lead.email)}
                    className="w-3.5 h-3.5 accent-purple-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-200 font-medium block truncate">{lead.name || lead.email}</span>
                    <span className="text-[10px] text-slate-500 truncate">{lead.email}</span>
                  </div>
                  <span className="text-[9px] text-purple-400/70 bg-purple-500/10 px-1.5 py-0.5 rounded-full shrink-0">{lead.segment}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {result && (
            <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-3 flex items-start gap-2">
              <CheckCircle size={14} className="shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold">Draft berhasil dibuat!</p>
                <p className="text-emerald-300/70 mt-0.5">{result.message}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !!result}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader size={16} className="animate-spin"/>AI sedang menyiapkan email...</> : <><Sparkles size={16}/>Generate & Simpan sebagai Draft</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Add Lead Modal ─────────────────────────────────────────────────────────────
const AddLeadModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [form, setForm] = useState({ email: '', name: '', segment: 'General' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.email || !form.email.includes('@')) { setError('Email tidak valid'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/leads/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Gagal menambah lead');
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl border border-purple-500/20 bg-[#0d0617]">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-white font-bold text-sm">Tambah Kontak Baru</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-3">
          {[['email','Email *','text'],['name','Nama','text'],['segment','Segment','text']].map(([key, label, type]) => (
            <div key={key}>
              <label className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider mb-1.5 block">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                placeholder={key === 'segment' ? 'General, VIP, Cold...' : ''}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"/>
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader size={14} className="animate-spin"/> : <Plus size={14}/>}
            {loading ? 'Menyimpan...' : 'Simpan Kontak'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EmailCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads'>('campaigns');
  const [previewCamp, setPreviewCamp] = useState<Campaign | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (e) {
      console.error('[EmailCampaign] fetch campaigns error:', e);
    } finally { setLoadingCamp(false); }
  };

  // Fetch leads
  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      console.error('[EmailCampaign] fetch leads error:', e);
    } finally { setLoadingLeads(false); }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchLeads();
    // Poll every 5 seconds for campaigns that are actively sending
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  // Summary stats
  const totalSent  = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalOpens = campaigns.reduce((s, c) => s + (c.opens || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0';
  const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: 'Total Penerima', value: leads.length.toLocaleString(), icon: <Users size={18}/> },
    { label: 'Total Terkirim', value: totalSent.toLocaleString(), icon: <Send size={18}/> },
    { label: 'Open Rate', value: `${openRate}%`, icon: <TrendingUp size={18}/> },
    { label: 'Click Rate', value: `${clickRate}%`, icon: <MousePointer size={18}/> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Mail size={20} className="text-purple-500"/>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Email Campaign Studio</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Neural Marketing · Human-in-the-Loop Dispatch</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowDraftModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-sm hover:bg-purple-700 transition-colors shrink-0"
        >
          <Sparkles size={15}/> AI Draft Campaign
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-purple-500 mb-2 opacity-80">{s.icon}</div>
            <div className="text-2xl font-black text-slate-800">{s.value}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['campaigns', 'leads'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'campaigns' ? `Campaigns (${campaigns.length})` : `Leads (${leads.length})`}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'campaigns' && (
          <motion.div key="camps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {loadingCamp ? (
              <div className="flex items-center justify-center py-20"><Loader size={24} className="animate-spin text-purple-400"/></div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Mail size={28} className="text-purple-300"/>
                </div>
                <p className="text-slate-500 font-semibold">Belum ada kampanye</p>
                <p className="text-slate-400 text-sm mt-1">Klik "AI Draft Campaign" untuk membuat yang pertama</p>
              </div>
            ) : campaigns.map((camp, i) => (
              <motion.div key={camp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{camp.campaignName}</h3>
                      <StatusBadge status={camp.status}/>
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-2">Subject: {camp.subject}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Users size={10}/>{camp.totalRecipients} penerima</span>
                      <span className="flex items-center gap-1"><Send size={10}/>{camp.sentCount || 0} terkirim</span>
                      <span className="flex items-center gap-1"><TrendingUp size={10}/>{camp.opens || 0} opens</span>
                      <span className="flex items-center gap-1"><MousePointer size={10}/>{camp.clicks || 0} clicks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {camp.htmlBody && (
                      <button onClick={() => setPreviewCamp(camp)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 transition-colors border border-transparent hover:border-purple-500/20">
                        <Eye size={14}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for Sending */}
                {camp.status === 'Sending' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Mengirim...</span><span>{camp.sendProgress || 0}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${camp.sendProgress || 0}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Date */}
                <p className="text-[10px] text-slate-600 mt-2">
                  Dibuat {new Date(camp.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <motion.div key="leads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{leads.length} kontak tersimpan</p>
              <button onClick={() => setShowAddLead(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                <Plus size={13}/> Tambah Kontak
              </button>
            </div>
            {loadingLeads ? (
              <div className="flex items-center justify-center py-20"><Loader size={24} className="animate-spin text-purple-400"/></div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Users size={28} className="text-purple-300"/>
                </div>
                <p className="text-slate-500 font-semibold">Belum ada kontak</p>
                <p className="text-slate-400 text-sm mt-1">Tambahkan leads untuk mulai membuat kampanye</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Nama','Email','Segment','Status','Ditambahkan'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={lead.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-3 font-semibold text-slate-200">{lead.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{lead.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">{lead.segment}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold ${lead.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`}>{lead.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(lead.addedAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {previewCamp && <HtmlPreviewModal campaign={previewCamp} onClose={() => setPreviewCamp(null)}/>}
        {showDraftModal && <AIDraftModal leads={leads} onClose={() => setShowDraftModal(false)} onSuccess={fetchCampaigns}/>}
        {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onSuccess={fetchLeads}/>}
      </AnimatePresence>
    </div>
  );
}
