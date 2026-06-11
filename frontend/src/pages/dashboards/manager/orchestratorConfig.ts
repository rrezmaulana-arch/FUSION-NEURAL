/**
 * FUSION NEURAL — Agent Orchestrator Config
 * Shared constants, types, and styles for the orchestrator views.
 */
import { Briefcase, Shield, Megaphone, Calculator, MessageSquare, Database } from 'lucide-react';

export const ROOMS = [
  { id: 'admin', label: 'OPS Admin', sublabel: 'Operations Command', icon: Briefcase, accent: '#8b5cf6', agents: [
    { id: 'admin_1', name: 'Cohere', model: 'command-r-plus', role: 'Admin JSON (Primary)' },
    { id: 'admin_2', name: 'OpenRouter', model: 'gpt-4o-mini-free', role: 'Universal Fallback' },
  ]},
  { id: 'manager', label: 'Manager CMD', sublabel: 'Command & Control', icon: Shield, accent: '#3b82f6', agents: [
    { id: 'manager_1', name: 'Gemini', model: '2.5-flash-preview', role: 'Manager (Primary)' },
    { id: 'manager_2', name: 'Mistral', model: 'large-latest', role: 'Manager (Backup)' },
  ]},
  { id: 'marketing', label: 'Creative MKT', sublabel: 'Marketing & Creative', icon: Megaphone, accent: '#ec4899', agents: [
    { id: 'mkt_1', name: 'HuggingFace', model: 'Mistral-7B', role: 'Text Generation' },
    { id: 'mkt_2', name: 'Gemini Imagen', model: '2.0-flash-image', role: 'Image (Premium)' },
    { id: 'mkt_3', name: 'FLUX.1-schnell', model: 'schnell', role: 'Image (Fast)' },
  ]},
  { id: 'finance', label: 'Finance Vault', sublabel: 'Financial Intelligence', icon: Calculator, accent: '#10b981', agents: [
    { id: 'fin_1', name: 'DeepSeek', model: 'deepseek-reasoner', role: 'Finance (Primary)' },
  ]},
  { id: 'frontliner', label: 'Comms & Sales', sublabel: 'Customer Communications', icon: MessageSquare, accent: '#f59e0b', agents: [
    { id: 'fl_1', name: 'Groq', model: 'llama-3.3-70b', role: 'Frontliner (Primary)' },
    { id: 'fl_2', name: 'Cerebras', model: 'llama-3.3-70b', role: 'Frontliner (Backup)' },
  ]},
  { id: 'core', label: 'Data Core', sublabel: 'Real-time Search Layer', icon: Database, accent: '#6366f1', agents: [
    { id: 'core_1', name: 'Serper.dev', model: 'Google Search', role: 'Search Tool (Live)' },
  ]},
];

export interface Log { id: string; agent: string; details: string; timestamp: any; }

export const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
.ao-wrap { font-family: 'Outfit', sans-serif; background: transparent; min-height: 100vh; color: #e2e8f0; margin: -24px; padding: 0; user-select: none; cursor: default; }
.ao-bg { background: radial-gradient(circle at top right, rgba(99,102,241,0.05), transparent 60%), radial-gradient(circle at bottom left, rgba(16,185,129,0.05), transparent 60%); }
.ao-scroll::-webkit-scrollbar { width: 5px; } .ao-scroll::-webkit-scrollbar-track { background: transparent; } .ao-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 10px; }
.ao-card { background: rgba(10, 15, 30, 0.65); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.2); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.ao-card:hover { background: rgba(15, 20, 35, 0.75); border-color: rgba(255,255,255,0.18); transform: translateY(-3px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 12px 32px rgba(0,0,0,0.4); }
.ao-glass-panel { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(16px); }
.ao-mono { font-family: 'JetBrains Mono', monospace; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes pulse-glow { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
@media (max-width: 768px) {
  .ao-room-grid { grid-template-columns: 1fr 1fr !important; }
  .ao-hub-tabs { overflow-x: auto; flex-wrap: nowrap !important; }
  .ao-hub-content-grid { grid-template-columns: 1fr !important; }
  .ao-walking-canvas { display: none !important; }
}
`;

export function timeAgo(ts: any) {
  if (!ts) return '—';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch { return '—'; }
}

export function isRecent(ts: any) {
  if (!ts) return false;
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return Date.now() - date.getTime() < 300000; // 5 min
  } catch { return false; }
}
