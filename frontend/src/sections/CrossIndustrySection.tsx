/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MULTI_SECTOR_STEPS } from '../data/content';
import { Database, BrainCircuit, Zap, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const stepIcons = [
  <Database size={32} />,
  <BrainCircuit size={32} />,
  <Zap size={32} />,
  <CheckCircle size={32} />,
];

export default function CrossIndustrySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isEnglish } = useLang();

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-cross="header"]', start: 'top 85%', once: true }
      });
      tl.fromTo('[data-cross="tag"]', { opacity: 0 }, { opacity: 1, duration: 0.5 })
        .fromTo('[data-cross="title"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.2')
        .fromTo('[data-cross="desc"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-cross="swipe"]', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3');

      gsap.fromTo('[data-cross="step"]', 
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.15,
          scrollTrigger: { trigger: '[data-cross="steps"]', start: 'top 85%', once: true }
        }
      );

      gsap.fromTo('[data-cross="result"]',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: { trigger: '[data-cross="result"]', start: 'top 90%', once: true }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="cross-industry"
      className="relative py-20 overflow-hidden select-none bg-white"
      ref={sectionRef}
    >

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div data-cross="header" className="text-center mb-12 md:mb-16">
          <span
            data-cross="tag"
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-purple mb-4 px-4 py-1.5 rounded-full glass-purple"
            style={{ opacity: 0 }}
          >
            {isEnglish ? 'Universal Adaptation · Any Sector' : 'Adaptasi Universal · Semua Sektor'}
          </span>
          <h2
            data-cross="title"
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy"
            style={{ opacity: 0 }}
          >
            {isEnglish ? 'Adaptable Intelligence.' : 'Kecerdasan yang Adaptif.'}
            <br />
            <span className="gradient-text-purple">{isEnglish ? 'Infinite Applications.' : 'Aplikasi Tanpa Batas.'}</span>
          </h2>
          <p
            data-cross="desc"
            className="mt-4 text-fn-navy/55 font-inter text-lg max-w-2xl mx-auto"
            style={{ opacity: 0 }}
          >
            {isEnglish
              ? "Whether you're in e-commerce, agriculture, logistics, or services, FUSION NEURAL's autonomous workflow adapts to your industry — eliminating inefficiencies and unlocking scalable growth."
              : 'Apakah bisnis Anda bergerak di e-commerce, pertanian, logistik, atau jasa — alur kerja otonom FusionNeural beradaptasi dengan industri Anda dan membuka pertumbuhan yang tak terbatas.'}
          </p>
        </div>

        {/* PETUNJUK SWIPE KHUSUS MOBILE */}
        <div
          data-cross="swipe"
          className="md:hidden flex items-center justify-center gap-2 mb-4 text-xs font-inter text-fn-navy/40 uppercase tracking-widest"
          style={{ opacity: 0 }}
        >
          <span>Geser untuk melihat</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </div>

        {/* Workflow Steps - Horizontal Scroll di Mobile, Grid di Desktop */}
        <div className="relative">
          {/* Connecting line (Hanya muncul di md/desktop ke atas) */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 mx-16 z-0"
            style={{ background: 'linear-gradient(to right, #F59E0B, #3B82F6, #EC4899, #760EFF)' }} />

          {/* Container Scroll */}
          <div data-cross="steps" className="flex md:grid overflow-x-auto md:overflow-visible md:grid-cols-4 gap-6 relative z-10 pb-8 pt-4 -my-4 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {MULTI_SECTOR_STEPS.map((step, i) => (
              <div
                key={step.id}
                data-cross="step"
                style={{ opacity: 0 }}
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
              </div>
            ))}
          </div>
        </div>

        {/* Result card — stats */}
        <div
          data-cross="result"
          className="mt-8 md:mt-16 relative rounded-3xl p-8 md:p-10 overflow-hidden bg-slate-50"
          style={{
            border: '1px solid rgba(16,185,129,0.15)',
            opacity: 0
          }}
        >
          <div className="grid grid-cols-2 md:flex md:flex-row flex-wrap justify-center items-center gap-8 md:gap-12 relative z-10">
            {(isEnglish ? [
              { val: 'Any', label: 'Industry Application', color: '#760EFF' },
              { val: '100%', label: 'System Integration', color: '#3B82F6' },
              { val: '24/7', label: 'Continuous Optimization', color: '#F59E0B' },
              { val: 'Zero', label: 'Human Intervention', color: '#EC4899' },
            ] : [
              { val: 'Semua', label: 'Jenis Industri', color: '#760EFF' },
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
        </div>
      </div>
    </section>
  );
}
