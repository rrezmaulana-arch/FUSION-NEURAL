import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MULTI_SECTOR_STEPS } from '../data/content';
import { Database, BrainCircuit, Zap, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const stepIcons = [
  <Database size={32} />,
  <BrainCircuit size={32} />,
  <Zap size={32} />,
  <CheckCircle size={32} />,
];

export default function CrossIndustrySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { isEnglish } = useLang();

  return (
    <section
      id="cross-industry"
      className="relative py-20 overflow-hidden select-none bg-white"
      ref={ref}
    >

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-4 px-4 py-1.5 rounded-full glass-emerald"
          >
            {isEnglish ? 'Universal Adaptation · Any Sector' : 'Adaptasi Universal · Semua Sektor'}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy"
          >
            {isEnglish ? 'Adaptable Intelligence.' : 'Kecerdasan yang Adaptif.'}
            <br />
            <span className="gradient-text-emerald">{isEnglish ? 'Infinite Applications.' : 'Aplikasi Tanpa Batas.'}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-fn-navy/55 font-inter text-lg max-w-2xl mx-auto"
          >
            {isEnglish
              ? "Whether you're in e-commerce, agriculture, logistics, or services, FUSION NEURAL's autonomous workflow adapts to your industry — eliminating inefficiencies and unlocking scalable growth."
              : 'Apakah bisnis Kak bergerak di e-commerce, pertanian, logistik, atau jasa — alur kerja otonom FusionNeural beradaptasi dengan industri Kak dan membuka pertumbuhan yang tak terbatas.'}
          </motion.p>
        </div>

        {/* PETUNJUK SWIPE KHUSUS MOBILE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="md:hidden flex items-center justify-center gap-2 mb-4 text-xs font-inter text-fn-navy/40 uppercase tracking-widest"
        >
          <span>Geser untuk melihat</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.div>

        {/* Workflow Steps - Horizontal Scroll di Mobile, Grid di Desktop */}
        <div className="relative">
          {/* Connecting line (Hanya muncul di md/desktop ke atas) */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 mx-16 z-0"
            style={{ background: 'linear-gradient(to right, #F59E0B, #3B82F6, #EC4899, #10B981)' }} />

          {/* Container Scroll */}
          <div className="flex md:grid overflow-x-auto md:overflow-visible md:grid-cols-4 gap-6 relative z-10 pb-8 pt-4 -my-4 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {MULTI_SECTOR_STEPS.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
                className="flex flex-col items-center text-center w-[75vw] md:w-auto flex-shrink-0 snap-center"
              >
                {/* Lucide icon */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md mb-6 relative z-10 bg-white"
                  style={{
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl" style={{ background: `${step.color}10` }} />
                  <span
                    className="relative z-10"
                    style={{ color: step.color }}
                  >
                    {stepIcons[i] || <BrainCircuit size={32} />}
                  </span>
                </div>

                <h3 className="font-space font-bold text-fn-navy text-lg mb-2 px-2">{step.title}</h3>
                <p className="text-sm text-fn-navy/60 font-inter leading-relaxed px-4 md:px-0">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Result card — stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-8 md:mt-16 relative rounded-3xl p-8 md:p-10 overflow-hidden bg-slate-50"
          style={{
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="grid grid-cols-2 md:flex md:flex-row flex-wrap justify-center items-center gap-8 md:gap-12 relative z-10">
            {(isEnglish ? [
              { val: 'Any', label: 'Industry Application', color: '#10B981' },
              { val: '100%', label: 'System Integration', color: '#3B82F6' },
              { val: '24/7', label: 'Continuous Optimization', color: '#F59E0B' },
              { val: 'Zero', label: 'Human Intervention', color: '#EC4899' },
            ] : [
              { val: 'Semua', label: 'Jenis Industri', color: '#10B981' },
              { val: '100%', label: 'Integrasi Sistem', color: '#3B82F6' },
              { val: '24/7', label: 'Optimasi Berkelanjutan', color: '#F59E0B' },
              { val: 'Nol', label: 'Intervensi Manual', color: '#EC4899' },
            ]).map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <p className="font-space font-bold text-3xl md:text-4xl" style={{ color: stat.color }}>{stat.val}</p>
                <p className="text-xs text-fn-navy/50 font-inter max-w-[120px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}