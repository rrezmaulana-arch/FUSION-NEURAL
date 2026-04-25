import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TRADITIONAL_VS_OPC } from '../data/content';
import { Check, X } from 'lucide-react';

export default function VisionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="vision" className="relative py-20 bg-white overflow-hidden select-none">

      {/* BG blob */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.10) 0%, transparent 70%)' }}
      />

      <div ref={ref} className="relative max-w-6xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-4 px-4 py-1.5 rounded-full glass-emerald"
          >
            The Vision
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy mt-4 leading-tight"
          >
            From <span className="gradient-text">Operator</span>
            <br />
            to <span className="gradient-text-emerald">Director</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 text-fn-navy/60 font-inter text-lg max-w-2xl mx-auto leading-relaxed"
          >
            FusionNeural replaces the traditional one-person business hustle with a
            fully autonomous AI ecosystem — where you set strategy, and your agents
            execute everything else.
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

        {/* Comparison Grid - Horizontal Scroll di HP, Grid berdampingan di Desktop */}
        <div className="flex md:grid overflow-x-auto md:overflow-visible md:grid-cols-2 gap-6 pb-8 pt-4 -my-4 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">

          {/* Traditional Model Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[85vw] md:w-auto flex-shrink-0 snap-center relative rounded-3xl p-8 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(254,242,242,0.8)',
              border: '1px solid rgba(252,165,165,0.4)',
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-100/60 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <div className="w-4 h-4 rounded-full bg-red-400" />
              </div>
              <div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-inter font-medium">Old Paradigm</p>
                <h3 className="font-space font-semibold text-fn-navy text-lg">
                  {TRADITIONAL_VS_OPC.traditional.label}
                </h3>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3 relative z-10 flex-1">
              {TRADITIONAL_VS_OPC.traditional.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                  transition={{ duration: 0.45, delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70"
                  style={{ border: '1px solid rgba(252,165,165,0.3)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
                  <span className="text-sm text-fn-navy/70 font-inter">{item.text}</span>
                  <span className="ml-auto text-red-400 font-bold"><X size={18} /></span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* OPC FusionNeural Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-[85vw] md:w-auto flex-shrink-0 snap-center relative rounded-3xl p-8 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(240,253,248,0.9)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25), transparent)' }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <div className="w-4 h-4 rounded-full bg-fn-emerald" />
              </div>
              <div>
                <p className="text-xs text-fn-emerald uppercase tracking-widest font-inter font-medium">New Paradigm</p>
                <h3 className="font-space font-semibold text-fn-navy text-lg">
                  {TRADITIONAL_VS_OPC.opc.label}
                </h3>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3 relative z-10 flex-1">
              {TRADITIONAL_VS_OPC.opc.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                  transition={{ duration: 0.45, delay: 0.45 + i * 0.08 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70"
                  style={{ border: '1px solid rgba(16,185,129,0.18)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-fn-emerald flex-shrink-0" />
                  <span className="text-sm text-fn-navy font-inter font-medium">{item.text}</span>
                  <span className="ml-auto text-fn-emerald font-bold"><Check size={18} /></span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Bottom Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6 px-6 md:px-8 py-5 rounded-2xl glass"
        >
          <span className="text-sm font-inter text-fn-navy/50 w-full md:w-auto text-center md:text-left">The shift is simple:</span>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-inter font-medium text-red-500 bg-red-50 border border-red-100">
              Manual Operations
            </span>
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-fn-emerald font-bold text-lg"
            >
              →
            </motion.span>
            <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-inter font-medium text-fn-emerald bg-fn-emerald/10 border border-fn-emerald/20">
              Autonomous AI
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}