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
import { TRADITIONAL_VS_OPC } from '../data/content';
import { Check, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export default function VisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { isEnglish } = useLang();

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Header Animation
      const tlHeader = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-vision="header"]',
          start: 'top 85%',
          once: true,
        }
      });
      tlHeader.fromTo('[data-vision="tag"]', 
        { opacity: 0, scale: 0.8 }, 
        { opacity: 1, scale: 1, duration: 0.5 }
      )
      .fromTo('[data-vision="title"]', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 
        '-=0.2'
      )
      .fromTo('[data-vision="desc"]', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.7 }, 
        '-=0.4'
      )
      .fromTo('[data-vision="swipe"]',
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.3'
      );

      // Cards Animation
      const tlCards = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-vision="cards"]',
          start: 'top 80%',
          once: true,
        }
      });
      tlCards.fromTo('[data-vision="card-old"]',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('[data-vision="card-old"] .old-item',
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
        '-=0.4'
      )
      .fromTo('[data-vision="card-new"]',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '<0.2'
      )
      .fromTo('[data-vision="card-new"] .new-item',
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
        '-=0.4'
      );

      // Summary Bar Animation
      gsap.fromTo('[data-vision="summary"]',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.7,
          scrollTrigger: {
            trigger: '[data-vision="summary"]',
            start: 'top 90%',
            once: true,
          }
        }
      );

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="vision" className="relative py-20 bg-white overflow-hidden select-none">

      {/* BG blob */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(ellipse at center, rgba(147,51,234,0.10) 0%, transparent 70%)' }}
      />

      <div ref={sectionRef} className="relative max-w-6xl mx-auto px-6">

        {/* Section Header */}
        <div data-vision="header" className="text-center mb-8 md:mb-16">
          <span
            data-vision="tag"
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-purple mb-4 px-4 py-1.5 rounded-full glass-purple"
            style={{ opacity: 0 }}
          >
            {isEnglish ? 'The Vision' : 'Visi Kami'}
          </span>

          <h2
            data-vision="title"
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy mt-4 leading-tight"
            style={{ opacity: 0 }}
          >
            {isEnglish ? 'From' : 'Dari'} <span className="gradient-text">{isEnglish ? 'Operator' : 'Operator'}</span>
            <br />
            {isEnglish ? 'to' : 'menjadi'} <span className="gradient-text-purple">{isEnglish ? 'Director' : 'Sutradara'}</span>
          </h2>

          <p
            data-vision="desc"
            className="mt-6 text-fn-navy/60 font-inter text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ opacity: 0 }}
          >
            {isEnglish
              ? 'FusionNeural replaces the traditional one-person business hustle with a fully autonomous AI ecosystem — where you set strategy, and your agents execute everything else.'
              : 'FusionNeural menggantikan model bisnis konvensional dengan ekosistem AI otonom penuh — Anda yang menentukan strategi, agen AI yang mengeksekusi semuanya.'}
          </p>
        </div>

        {/* PETUNJUK SWIPE KHUSUS MOBILE */}
        <div
          data-vision="swipe"
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

        {/* Comparison Grid - Horizontal Scroll di HP, Grid berdampingan di Desktop */}
        <div data-vision="cards" className="flex md:grid overflow-x-auto md:overflow-visible md:grid-cols-2 gap-6 pb-8 pt-4 -my-4 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">

          {/* Traditional Model Card */}
          <div
            data-vision="card-old"
            className="w-[85vw] md:w-auto flex-shrink-0 snap-center relative rounded-3xl p-8 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(254,242,242,0.8)',
              border: '1px solid rgba(252,165,165,0.4)',
              opacity: 0
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-100/60 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <div className="w-4 h-4 rounded-full bg-red-400" />
              </div>
              <div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-inter font-medium">{isEnglish ? 'Old Paradigm' : 'Model Lama'}</p>
                <h3 className="font-space font-semibold text-fn-navy text-lg">
                  {TRADITIONAL_VS_OPC.traditional.label}
                </h3>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3 relative z-10 flex-1">
              {TRADITIONAL_VS_OPC.traditional.items.map((item, i) => (
                <div
                  key={i}
                  className="old-item flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70"
                  style={{ border: '1px solid rgba(252,165,165,0.3)', opacity: 0 }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
                  <span className="text-sm text-fn-navy/70 font-inter">{item.text}</span>
                  <span className="ml-auto text-red-400 font-bold"><X size={18} /></span>
                </div>
              ))}
            </div>
          </div>

          {/* OPC FusionNeural Card */}
          <div
            data-vision="card-new"
            className="w-[85vw] md:w-auto flex-shrink-0 snap-center relative rounded-3xl p-8 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(245,240,255,0.9)',
              border: '1px solid rgba(147,51,234,0.25)',
              opacity: 0
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
                style={{ background: 'rgba(147,51,234,0.15)' }}
              >
                <div className="w-4 h-4 rounded-full bg-fn-purple" />
              </div>
              <div>
                <p className="text-xs text-fn-purple uppercase tracking-widest font-inter font-medium">{isEnglish ? 'New Paradigm' : 'Paradigma Baru'}</p>
                <h3 className="font-space font-semibold text-fn-navy text-lg">
                  {TRADITIONAL_VS_OPC.opc.label}
                </h3>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3 relative z-10 flex-1">
              {TRADITIONAL_VS_OPC.opc.items.map((item, i) => (
                <div
                  key={i}
                  className="new-item flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70"
                  style={{ border: '1px solid rgba(147,51,234,0.18)', opacity: 0 }}
                >
                  <div className="w-2 h-2 rounded-full bg-fn-purple flex-shrink-0" />
                  <span className="text-sm text-fn-navy font-inter font-medium">{item.text}</span>
                  <span className="ml-auto text-fn-purple font-bold"><Check size={18} /></span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Summary Bar */}
        <div
          data-vision="summary"
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6 px-6 md:px-8 py-5 rounded-2xl glass"
          style={{ opacity: 0 }}
        >
          <span className="text-sm font-inter text-fn-navy/50 w-full md:w-auto text-center md:text-left">{isEnglish ? 'The shift is simple:' : 'Pergeserannya sederhana:'}</span>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-inter font-medium text-red-500 bg-red-50 border border-red-100">
              {isEnglish ? 'Manual Operations' : 'Operasional Manual'}
            </span>
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-fn-purple font-bold text-lg"
            >
              →
            </motion.span>
            <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-inter font-medium text-fn-purple bg-fn-purple/10 border border-fn-purple/20">
              {isEnglish ? 'Autonomous AI' : 'AI Otonom'}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
