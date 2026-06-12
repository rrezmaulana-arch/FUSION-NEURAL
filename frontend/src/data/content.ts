/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
// Static content data — Bahasa Indonesia (default) | English (translate)

export const AGENTS = [
  {
    id: 'manager',
    title: 'AI Manager',
    role: 'Evaluator & Strategi',
    level: 'Director Level',
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.4)',
    initial: 'M',
    description:
      'Pengambil keputusan tertinggi ekosistem. Memantau performa seluruh agen, menyusun strategi kuartalan, dan menghasilkan Executive Summary secara otomatis. Termasuk Agent Orchestrator, Neural Status Panel, dan Strategic Audit Hub.',
    capabilities: [
      'Agent Orchestrator — koordinasi semua agen AI',
      'Executive Summary & Strategic Audit otomatis',
      'Neural Status Panel — monitor token & performa',
      'Human Override — kontrol penuh ada di tangan Kak',
    ],
    stats: { autonomy: 95, coverage: 100, efficiency: 98 },
  },
  {
    id: 'admin',
    title: 'AI Admin',
    role: 'Pengendali Logistik',
    level: 'Operations Level',
    color: '#3B82F6',
    glowColor: 'rgba(59,130,246,0.4)',
    initial: 'A',
    description:
      'Tulang punggung operasional bisnis. Mengelola inventaris gudang secara real-time, memvalidasi pesanan secara otomatis, mengirim sinyal ke Marketing saat stok menumpuk, dan mengelola data supplier lengkap dengan auto-PO.',
    capabilities: [
      'Inventory Tracker — status stok real-time dengan warna',
      'Order Stream — pipeline pesanan Pending→Delivered',
      'Supply Signals — trigger otomatis ke AI Marketing',
      'Supplier Hub — manajemen vendor + PO generator AI',
    ],
    stats: { autonomy: 88, coverage: 92, efficiency: 96 },
  },
  {
    id: 'marketing',
    title: 'AI Marketing',
    role: 'Agen Kreatif Otonom',
    level: 'Growth Level',
    color: '#EC4899',
    glowColor: 'rgba(236,72,153,0.4)',
    initial: 'Mk',
    description:
      'Agensi kreatif otonom dalam satu agen. Menghasilkan copywriting premium, membaca sinyal pasar dari Admin & Finance, menjadwalkan konten omnichannel, dan menganalisis ROI kampanye — semua sesuai etika periklanan Indonesia.',
    capabilities: [
      'Campaign Forge — copywriting AI dengan tone selector',
      'Market Signals — radar stok & profit real-time',
      'Content Launchpad — kalender jadwal konten multi-platform',
      'Conversion Feedback — ROI per kampanye + rekomendasi AI',
    ],
    stats: { autonomy: 90, coverage: 85, efficiency: 93 },
  },
  {
    id: 'finance',
    title: 'AI Finance',
    role: 'CFO Virtual',
    level: 'Intelligence Level',
    color: '#760EFF',
    glowColor: 'rgba(118,14,255,0.4)',
    initial: 'F',
    description:
      'CFO virtual yang selalu aktif 24/7. Menghitung laba bersih legal setelah dipotong PPN 12% & PPh, memantau biaya infrastruktur per rupiah, menganalisis ROI kampanye, dan mengunci kebijakan margin minimum untuk agen AI.',
    capabilities: [
      'Profit Ledger — gross revenue real-time dari transaksi',
      'Operational Burn — monitor biaya API & infrastruktur',
      'ROI Intelligence — efisiensi kampanye + saran alokasi',
      'Financial Policy — margin target, budget cap & pajak',
    ],
    stats: { autonomy: 92, coverage: 88, efficiency: 99 },
  },
];

export const MULTI_SECTOR_STEPS = [
  {
    id: 1,
    label: '01',
    title: 'Sinkronisasi Data',
    desc: 'AI Admin secara otomatis mengumpulkan data real-time dari inventaris, pesanan masuk, dan laporan keuangan.',
    color: '#F59E0B',
  },
  {
    id: 2,
    label: '02',
    title: 'Analisis Pola',
    desc: 'Neural Engine memproses data untuk mendeteksi tren, anomali stok, atau pemicu aksi promosi dalam hitungan detik.',
    color: '#3B82F6',
  },
  {
    id: 3,
    label: '03',
    title: 'Eksekusi Otonom',
    desc: 'Agen yang relevan (Marketing, Admin, atau Finance) mengeksekusi strategi optimal secara otomatis — tanpa intervensi manual.',
    color: '#EC4899',
  },
  {
    id: 4,
    label: '04',
    title: 'Hasil Teroptimasi',
    desc: 'Efisiensi dan pendapatan termaksimalkan. AI Finance mencatat hasil & Laba Bersih Legal untuk laporan Sutradara.',
    color: '#760EFF',
  },
];

export const TECH_STACK = [
  { id: 'groq', label: 'Groq AI (LLaMA-3)', short: 'AI', color: '#9333EA', desc: 'Sumber perintah ke semua agen AI' },
  { id: 'neural', label: 'Neural Core Engine', short: 'NC', color: '#A855F7', desc: 'Orkestrator pusat seluruh ekosistem' },
  { id: 'firebase', label: 'Firebase Firestore', short: 'FB', color: '#F59E0B', desc: 'Database real-time terpusat' },
  { id: 'react', label: 'React + Vite', short: 'RV', color: '#3B82F6', desc: 'Dashboard premium responsif' },
  { id: 'server', label: 'VPS Server', short: 'VS', color: '#EC4899', desc: 'Deploy di server sendiri (self-hosted)' },
];

export const TRADITIONAL_VS_OPC = {
  traditional: {
    label: 'Model Konvensional',
    items: [
      { text: 'Overhead biaya SDM tinggi' },
      { text: 'Analisis manual (berjam-jam)' },
      { text: 'Human error & stok tidak sinkron' },
      { text: 'Operasional 8 jam/hari' },
      { text: 'Pemilik sebagai Operator' },
    ],
  },
  opc: {
    label: 'FusionNeural OPC',
    items: [
      { text: 'Efisiensi kapital maksimal' },
      { text: 'Analisis AI real-time (detik)' },
      { text: 'Zero human error — stok selalu akurat' },
      { text: '24/7 eksekusi otonom' },
      { text: 'Pemilik sebagai Sutradara' },
    ],
  },
};

// English translations for language toggle
export const AGENTS_EN = [
  {
    id: 'manager',
    title: 'AI Manager',
    role: 'Evaluator & Strategist',
    level: 'Director Level',
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.4)',
    initial: 'M',
    description:
      'The apex decision-maker of the entire ecosystem. Monitors all agent performance, generates quarterly strategy, and produces Executive Summaries automatically — including Agent Orchestrator, Neural Status Panel, and Strategic Audit Hub.',
    capabilities: [
      'Agent Orchestrator — coordinate all AI agents',
      'Executive Summary & Strategic Audit automated',
      'Neural Status Panel — token & performance monitor',
      'Human Override — full control remains with you',
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
      'The operational backbone of the business. Manages warehouse inventory in real-time, auto-validates orders, sends signals to Marketing when stock overflows, and manages supplier data with auto-generated Purchase Orders.',
    capabilities: [
      'Inventory Tracker — color-coded real-time stock status',
      'Order Stream — order pipeline Pending→Delivered',
      'Supply Signals — auto-trigger to AI Marketing',
      'Supplier Hub — vendor management + AI PO generator',
    ],
    stats: { autonomy: 88, coverage: 92, efficiency: 96 },
  },
  {
    id: 'marketing',
    title: 'AI Marketing',
    role: 'Autonomous Creative Agency',
    level: 'Growth Level',
    color: '#EC4899',
    glowColor: 'rgba(236,72,153,0.4)',
    initial: 'Mk',
    description:
      'A fully autonomous creative agency in one agent. Generates premium copywriting, reads market signals from Admin & Finance, schedules omnichannel content, and analyzes campaign ROI — all compliant with Indonesian advertising ethics.',
    capabilities: [
      'Campaign Forge — AI copywriting with tone selector',
      'Market Signals — real-time stock & profit radar',
      'Content Launchpad — multi-platform content calendar',
      'Conversion Feedback — campaign ROI + AI recommendations',
    ],
    stats: { autonomy: 90, coverage: 85, efficiency: 93 },
  },
  {
    id: 'finance',
    title: 'AI Finance',
    role: 'Virtual CFO',
    level: 'Intelligence Level',
    color: '#760EFF',
    glowColor: 'rgba(118,14,255,0.4)',
    initial: 'F',
    description:
      'Your always-on CFO. Calculates legal net profit after VAT 12% & income tax, monitors infrastructure costs per rupiah, analyzes campaign ROI, and locks minimum margin policies for all AI agents.',
    capabilities: [
      'Profit Ledger — real-time gross revenue from transactions',
      'Operational Burn — API & infrastructure cost monitor',
      'ROI Intelligence — campaign efficiency + allocation advice',
      'Financial Policy — margin target, budget cap & tax settings',
    ],
    stats: { autonomy: 92, coverage: 88, efficiency: 99 },
  },
];
