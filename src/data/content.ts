// Static content data — no database
export const AGENTS = [
  {
    id: 'manager',
    title: 'AI Manager',
    role: 'Evaluator & Strategist',
    level: 'Director Level',
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.4)',
    initial: 'M',
    description:
      'The apex decision-maker of the entire ecosystem. Evaluates performance data across all agents, sets quarterly strategy, and dispatches high-level directives. Final executive decisions are delivered directly to the owner via WhatsApp — making you a Director, not an Operator.',
    capabilities: [
      'Performance evaluation across all agents',
      'Strategic direction & goal-setting',
      'Executive report via WhatsApp',
      'Crisis override & manual mode',
    ],
    stats: { autonomy: 95, coverage: 100, efficiency: 98 },
  },
  {
    id: 'admin',
    title: 'AI Admin',
    role: 'Logistics Controller',
    level: 'Operations Level',
    color: '#3B82F6',
    glowColor: 'rgba(59,130,246,0.4)',
    initial: 'A',
    description:
      'The operational backbone of the business. Manages warehouse inventory in real-time, syncs stock levels across Telegram, TikTok Shop, and Shopee simultaneously — eliminating overselling and manual data entry forever.',
    capabilities: [
      'Real-time multi-platform stock sync',
      'Telegram operations dashboard',
      'TikTok Shop & Shopee integration',
      'Automated purchase order generation',
    ],
    stats: { autonomy: 88, coverage: 92, efficiency: 96 },
  },
  {
    id: 'marketing',
    title: 'AI Marketing',
    role: 'Creative Agency',
    level: 'Growth Level',
    color: '#EC4899',
    glowColor: 'rgba(236,72,153,0.4)',
    initial: 'Mk',
    description:
      'A fully autonomous creative agency in a single agent. Monitors trending content, auto-generates product visuals, writes captions, schedules posts, and executes flash discount campaigns — all without human input.',
    capabilities: [
      'Trend monitoring & market research',
      'AI-generated product visuals & captions',
      'Automated social media scheduling',
      'Flash discount campaign triggers',
    ],
    stats: { autonomy: 90, coverage: 85, efficiency: 93 },
  },
  {
    id: 'finance',
    title: 'AI Finance',
    role: 'Virtual CFO',
    level: 'Intelligence Level',
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.4)',
    initial: 'F',
    description:
      'Your always-on Chief Financial Officer. Calculates real-time Net Profit per SKU, tracks ROI across marketing channels, models cash flow, and alerts on anomalies — giving you full financial clarity at any moment.',
    capabilities: [
      'Real-time Net Profit & ROI per SKU',
      'Cash flow modeling & projection',
      'Anomaly detection & alerts',
      'Automated financial reporting',
    ],
    stats: { autonomy: 92, coverage: 88, efficiency: 99 },
  },
];

export const MULTI_SECTOR_STEPS = [
  {
    id: 1,
    label: '01',
    title: 'Data Ingestion',
    desc: 'AI Admin automatically gathers real-time data from inventory, sales, or operations across your entire business.',
    color: '#F59E0B',
  },
  {
    id: 2,
    label: '02',
    title: 'Pattern Analysis',
    desc: 'n8n Centralized Engine processes the data to detect trends, anomalies, or actionable triggers in milliseconds.',
    color: '#3B82F6',
  },
  {
    id: 3,
    label: '03',
    title: 'Autonomous Action',
    desc: 'The relevant AI Agent (Marketing, Admin, or Finance) executes the optimized strategy across all platforms.',
    color: '#EC4899',
  },
  {
    id: 4,
    label: '04',
    title: 'Optimized Result',
    desc: 'Maximized efficiency and revenue. The AI Finance agent logs the result, continuously improving the system.',
    color: '#10B981',
  },
];

export const TECH_STACK = [
  { id: 'telegram', label: 'Telegram API', short: 'TG', color: '#3B82F6', desc: 'Operations command center' },
  { id: 'n8n', label: 'n8n Engine', short: 'N8', color: '#10B981', desc: 'Centralized AI orchestrator' },
  { id: 'tiktok', label: 'TikTok Shop', short: 'TT', color: '#EC4899', desc: 'Marketplace automation' },
  { id: 'shopee', label: 'Shopee', short: 'SP', color: '#F59E0B', desc: 'E-commerce webhook sync' },
  { id: 'whatsapp', label: 'WhatsApp', short: 'WA', color: '#10B981', desc: 'Executive decision delivery' },
];

export const TRADITIONAL_VS_OPC = {
  traditional: {
    label: 'Traditional Model',
    items: [
      { text: 'High Capital Overhead' },
      { text: 'Manual Analysis (Hours)' },
      { text: 'Human Error & Overselling' },
      { text: '8-Hour Operation Window' },
      { text: 'Owner as Operator' },
    ],
  },
  opc: {
    label: 'OPC FusionNeural',
    items: [
      { text: 'Precision Capital Efficiency' },
      { text: 'Real-Time AI Analysis' },
      { text: 'Zero Human Error' },
      { text: '24/7 Autonomous Execution' },
      { text: 'Owner as Director' },
    ],
  },
};
