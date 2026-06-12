/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, Bot, Network, ChevronRight, Cpu,
  GitMerge, CalendarDays, RefreshCw, Sparkles, ArrowRight,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

type AutonomyLevel = '50' | '100';
type BillingCycle = 'monthly' | 'yearly';

const TIERS = [
  {
    id: 'starter',
    agents: 1,
    name: { id: 'Starter Agent', en: 'Starter Agent' },
    tagline: { id: '1 Agen AI Pilihan Anda', en: '1 AI Agent of Your Choice' },
    desc: {
      id: 'Manager, Admin, Marketing, atau Finance — satu agen yang bekerja 24/7 untuk Anda.',
      en: 'Manager, Admin, Marketing, or Finance — one agent working 24/7 for you.',
    },
    setup: 4900000,
    monthly: 1800000,
    icon: Bot,
    gradient: 'from-purple-400 to-teal-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    pill: 'bg-purple-100 text-purple-700',
    glow: 'shadow-purple-100',
    ring: 'ring-purple-400/40',
    badge: null,
    features: {
      id: ['1 Agen AI Aktif 24/7', 'Laporan Mingguan Otomatis', 'Dasbor Standar', 'Otonom 24/7', 'Support via WhatsApp'],
      en: ['1 AI Agent Active 24/7', 'Automated Weekly Reports', 'Standard Dashboard', '24/7 Autonomous', 'WhatsApp Support'],
    },
  },
  {
    id: 'dual',
    agents: 2,
    name: { id: 'Dual Synergy', en: 'Dual Synergy' },
    tagline: { id: '2 Agen AI Tersinkronisasi', en: '2 Synchronized AI Agents' },
    desc: {
      id: '2 agen AI yang bekerja bersama untuk akselerasi operasional medium bisnis Anda.',
      en: '2 AI agents working together for medium-scale operational acceleration.',
    },
    setup: 8900000,
    monthly: 3000000,
    icon: GitMerge,
    gradient: 'from-indigo-400 to-violet-500',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    pill: 'bg-indigo-100 text-indigo-700',
    glow: 'shadow-indigo-100',
    ring: 'ring-indigo-400/40',
    badge: { id: 'Paling Populer', en: 'Most Popular' },
    features: {
      id: ['2 Agen AI Tersinkronisasi', 'Sinergi Data Real-time', 'Laporan Analitik Mingguan', 'Dasbor Advanced', 'Priority Support 24/7'],
      en: ['2 Synchronized AI Agents', 'Real-time Data Synergy', 'Weekly Analytics Report', 'Advanced Dashboard', 'Priority Support 24/7'],
    },
  },
  {
    id: 'full',
    agents: 4,
    name: { id: 'Full One Man Company', en: 'Full One Man Company' },
    tagline: { id: '4 Agen AI — Ekosistem Penuh', en: '4 AI Agents — Full Ecosystem' },
    desc: {
      id: 'Arsitektur otonom penuh. 4 Agen bekerja, Anda cukup menjadi Sutradara.',
      en: 'Full autonomous architecture. 4 Agents work, you just direct.',
    },
    setup: 14900000,
    monthly: 4800000,
    icon: Network,
    gradient: 'from-purple-400 to-pink-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    pill: 'bg-purple-100 text-purple-700',
    glow: 'shadow-purple-100',
    ring: 'ring-purple-400/40',
    badge: null,
    features: {
      id: ['4 Agen AI Sinergi Total', 'Auto-Decision System', 'Prediksi ROI Prediktif', 'Owner Dashboard Eksklusif', 'Akses Simulator Prioritas', 'Dedicated Architect Support'],
      en: ['4 Full AI Agents Synergy', 'Auto-Decision System', 'Predictive ROI Forecast', 'Exclusive Owner Dashboard', 'Priority Simulator Access', 'Dedicated Architect Support'],
    },
  },
];

// ── Formatters ──
const fmtRp = (n: number) =>
  n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace('.', ',')}M`
    : `Rp ${(n / 1_000).toFixed(0)}rb`;

export default function PricingSection() {
  const { isEnglish } = useLang();
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('100');
  const [billing,  setBilling]  = useState<BillingCycle>('monthly');
  const [selected, setSelected] = useState<string>('tier2');

  return (
    <section id="pricing" className="py-28 bg-[#f8f9fc] relative overflow-hidden">

      {/* ── BG decor ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.07) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[260px] bg-gradient-to-b from-indigo-300/10 to-transparent blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* ══ HEADER ══ */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fn-purple/10 border border-fn-purple/20 mb-5"
          >
            <Cpu size={12} className="text-fn-purple" />
            <span className="text-xs font-bold text-fn-purple uppercase tracking-widest">
              {isEnglish ? 'Pricing Architecture' : 'Arsitektur Harga'}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="text-4xl md:text-5xl font-space font-bold text-fn-navy mb-4 leading-tight"
          >
            {isEnglish ? 'Autonomous System Investment' : 'Investasi Sistem Otonom'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}
            className="text-fn-navy/55 max-w-xl mx-auto text-base"
          >
            {isEnglish
              ? 'One-time setup. Recurring subscription. Full AI — no HR overhead.'
              : 'Biaya setup sekali. Subscription berjalan. AI penuh — tanpa beban SDM.'}
          </motion.p>
        </div>

        {/* ══ CONTROLS ══ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-5 mb-6"
        >
          {/* ─ Row: both toggles side-by-side with clear labels ─ */}
          <div className="flex flex-col sm:flex-row items-center gap-4">

            {/* OTONOMI */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {isEnglish ? 'Autonomy Level' : 'Tingkat Otonomi'}
              </span>
              <div className="flex bg-slate-200/60 rounded-[14px] p-1 gap-1 border border-slate-200/50">
                {(['50', '100'] as AutonomyLevel[]).map((lvl) => {
                  const on = autonomy === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setAutonomy(lvl)}
                      className={`relative flex items-center justify-center min-w-[150px] gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold transition-all duration-300 ${
                        on ? 'bg-white text-fn-navy shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {lvl === '50' ? <GitMerge size={14} className={on ? 'text-fn-purple' : ''} /> : <Zap size={14} className={on ? 'text-fn-purple' : ''} />}
                      {lvl === '50'
                        ? (isEnglish ? '50% Hybrid' : '50% Hybrid')
                        : (isEnglish ? '100% Autopilot' : '100% Full Otonom')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-12 bg-slate-200" />

            {/* BILLING CYCLE */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {isEnglish ? 'Billing Cycle' : 'Siklus Tagihan'}
                </span>
                {billing === 'yearly' && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[9px] font-black bg-fn-purple text-white px-2 py-0.5 rounded-full"
                  >
                    HEMAT ~20%
                  </motion.span>
                )}
              </div>
              <div className="flex bg-slate-200/60 rounded-[14px] p-1 gap-1 border border-slate-200/50">
                {(['monthly', 'yearly'] as BillingCycle[]).map((cyc) => {
                  const on = billing === cyc;
                  return (
                    <button
                      key={cyc}
                      onClick={() => setBilling(cyc)}
                      className={`relative flex items-center justify-center min-w-[120px] gap-2 px-5 py-2.5 rounded-[10px] text-sm font-bold transition-all duration-300 ${
                        on ? 'bg-white text-fn-navy shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cyc === 'monthly' ? <RefreshCw size={14} className={on ? 'text-fn-purple' : ''} /> : <CalendarDays size={14} className={on ? 'text-fn-purple' : ''} />}
                      {cyc === 'monthly'
                        ? (isEnglish ? 'Monthly' : 'Bulanan')
                        : (isEnglish ? 'Yearly' : 'Tahunan')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hint text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`${autonomy}-${billing}`}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-slate-400 text-center"
            >
              {autonomy === '50'
                ? (isEnglish ? '50% Hybrid — AI runs with your approval at key decisions.' : '50% Hybrid — AI berjalan dengan persetujuan Anda di titik keputusan kunci.')
                : (isEnglish ? '100% Autopilot — full autonomous execution, zero manual intervention.' : '100% Full Otonom — eksekusi autopilot penuh, tanpa intervensi manual.')}
              {billing === 'yearly' && (
                <span className="text-fn-purple font-semibold ml-1">
                  {isEnglish ? ' · Annual plan saves ~20%.' : ' · Tagihan tahunan hemat ~20%.'}
                </span>
              )}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Autonomy hint */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`hint-${autonomy}`}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center text-xs text-slate-400 mb-10"
          >
            {autonomy === '50'
              ? (isEnglish ? 'AI runs with your manual approval at key decision points — more control, lower cost.' : 'AI berjalan dengan persetujuan manual Anda di titik kunci — kontrol lebih besar, biaya lebih efisien.')
              : (isEnglish ? 'Fully autonomous AI — 100% autopilot execution, zero manual intervention.' : 'AI sepenuhnya otonom — eksekusi 100% autopilot, tanpa intervensi manual.')}
          </motion.p>
        </AnimatePresence>

        {/* ══ CARDS ══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier, i) => {
            const isSelected = selected === tier.id;
            const Icon       = tier.icon;
            const setupPrice = tier.setup;
            const subMonthly = tier.monthly;
            const subYearly  = tier.monthly * 10; // 2 bulan gratis
            const subPrice   = billing === 'monthly' ? subMonthly : subYearly;
            const savedAmt   = subMonthly * 12 - subYearly;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.07 * i }}
                onClick={() => setSelected(tier.id)}
                className={`relative flex flex-col rounded-[28px] cursor-pointer overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? `bg-white ring-2 ${tier.ring} shadow-2xl ${tier.glow}`
                    : 'bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200'
                }`}
              >
                {/* ── Popular badge ── */}
                {tier.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-fn-navy text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {isEnglish ? tier.badge.en : tier.badge.id}
                    </span>
                  </div>
                )}

                {/* ── Gradient header band ── */}
                <div className={`bg-gradient-to-br ${tier.gradient} p-6 pb-7`}>
                  <div className="flex items-start justify-between">
                    {/* Icon */}
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    {/* Agent count */}
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                        {isEnglish ? 'AI Agents' : 'Agen AI'}
                      </p>
                      <p className="text-white text-3xl font-black leading-none">{tier.agents}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-white font-bold text-lg leading-tight">
                      {isEnglish ? tier.name.en : tier.name.id}
                    </h3>
                    <p className="text-white/70 text-xs mt-0.5 font-medium">
                      {isEnglish ? tier.tagline.en : tier.tagline.id}
                    </p>
                  </div>
                </div>

                {/* ── Price block ── */}
                <div className="px-6 -mt-3 relative z-10">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4">

                    {/* Row 1: Setup fee */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {isEnglish ? 'Setup Fee' : 'Biaya Setup'}
                        </p>
                        <p className="text-[10px] text-slate-400/70">{isEnglish ? 'one-time payment' : 'sekali bayar'}</p>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`setup-${tier.id}-${autonomy}`}
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="text-2xl font-black text-fn-navy tabular-nums"
                        >
                          {fmtRp(setupPrice)}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Divider with "+" */}
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 border-t border-dashed border-slate-200" />
                      <span className="text-slate-300 text-sm font-bold">+</span>
                      <div className="flex-1 border-t border-dashed border-slate-200" />
                    </div>

                    {/* Row 2: Subscription */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {billing === 'monthly'
                            ? <RefreshCw size={11} className="text-fn-purple" />
                            : <CalendarDays size={11} className="text-fn-purple" />}
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {billing === 'monthly'
                              ? (isEnglish ? 'Monthly Sub' : 'Langganan Bulanan')
                              : (isEnglish ? 'Yearly Sub' : 'Langganan Tahunan')}
                          </p>
                        </div>
                        {billing === 'yearly' && (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`save-${tier.id}-${autonomy}`}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="flex items-center gap-1"
                            >
                              <Sparkles size={9} className="text-fn-purple" />
                              <span className="text-[10px] text-fn-purple font-bold">
                                {isEnglish ? `Save ${fmtRp(savedAmt)}/yr` : `Hemat ${fmtRp(savedAmt)}/thn`}
                              </span>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`sub-${tier.id}-${autonomy}-${billing}`}
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="text-right"
                        >
                          <span className="text-2xl font-black text-fn-purple tabular-nums">
                            {fmtRp(subPrice)}
                          </span>
                          <span className="text-slate-400 text-xs ml-1">
                            /{billing === 'monthly' ? (isEnglish ? 'mo' : 'bln') : (isEnglish ? 'yr' : 'thn')}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Mode tag */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${tier.pill}`}>
                        {autonomy === '100' ? <Zap size={9} /> : <GitMerge size={9} />}
                        {autonomy === '50'
                          ? (isEnglish ? '50% Hybrid Mode' : 'Mode 50% Hybrid')
                          : (isEnglish ? '100% Autonomous' : 'Mode 100% Otonom')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Features ── */}
                <div className="px-6 pt-5 pb-2 flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                    {isEnglish ? 'Includes' : 'Sudah Termasuk'}
                  </p>
                  <div className="space-y-2.5">
                    {(isEnglish ? tier.features.en : tier.features.id).map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-fn-purple/12 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={9} className="text-fn-purple" />
                        </div>
                        <span className="text-sm text-slate-600 leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── CTA ── */}
                <div className="p-6 pt-5">
                  <Link
                    to={`/pemesanan?tier=${tier.id}&autonomy=${autonomy}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${tier.gradient} text-white shadow-lg hover:opacity-90`
                        : 'bg-slate-50 text-fn-navy border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isEnglish ? 'Order This Architecture' : 'Pesan Arsitektur Ini'}
                    {isSelected ? <ArrowRight size={15} /> : <ChevronRight size={15} />}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ══ SUBSCRIPTION INFO BANNER ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white border border-slate-100 rounded-2xl px-6 py-5 shadow-sm"
        >
          <div className="w-10 h-10 bg-fn-purple/10 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw size={18} className="text-fn-purple" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-fn-navy mb-0.5">
              {isEnglish ? 'How Billing Works' : 'Cara Kerja Pembayaran'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isEnglish
                ? 'Setup fee is paid once for deployment & configuration. The subscription (monthly or yearly) covers AI agent operations, model API costs, system updates, and ongoing technical support.'
                : 'Biaya setup dibayar sekali untuk deployment & konfigurasi. Subscription (bulanan atau tahunan) mencakup operasional agen AI, biaya API model, pembaruan sistem, dan dukungan teknis berkelanjutan.'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-fn-purple bg-fn-purple/8 px-4 py-2 rounded-xl shrink-0">
            <Sparkles size={13} />
            <span className="text-xs font-bold">
              {isEnglish ? 'Cancel anytime' : 'Batalkan kapan saja'}
            </span>
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.55 }}
          className="text-center text-xs text-slate-400 mt-5"
        >
          {isEnglish
            ? 'All packages include initial consultation, system configuration, and 30-day post-deployment support.'
            : 'Semua paket sudah termasuk konsultasi awal, konfigurasi sistem, dan dukungan 30 hari pasca-deployment.'}
        </motion.p>

      </div>
    </section>
  );
}

