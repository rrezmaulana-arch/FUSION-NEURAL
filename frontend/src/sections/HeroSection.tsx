/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useEffect } from 'react';
import { ArrowDown, Zap, ShieldCheck } from 'lucide-react';
import HeroScene from '../components/three/HeroScene';
import gsap from 'gsap';
import { useLang } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const HEADLINE_WORDS = ['FUSION', 'NEURAL'];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isEnglish } = useLang();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('[data-hero="badge"]',
        { y: -24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.2 }
      )
      .fromTo('[data-hero="word"]',
        { y: 70, opacity: 0, filter: 'blur(14px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, stagger: 0.14 },
        '-=0.3'
      )
      .fromTo('[data-hero="sub"]',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.5'
      )
      .fromTo('[data-hero="cta"]',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.5'
      )
      .fromTo('[data-hero="stat"]',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        '-=0.3'
      )
      .fromTo('[data-hero="scene"]',
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
        0.3
      )
      if (scrollRef.current) {
        tl.fromTo(scrollRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          '-=0.3'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen bg-white flex flex-col overflow-hidden"
    >
      {/* Background dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Soft radial blobs */}
      <div
        className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      {/* Kontainer Utama */}
      <div className="relative max-w-6xl mx-auto w-full px-6 pt-24 md:pt-32 pb-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 flex-1 justify-center">

        {/* ── Left Text ─────────────────────────────────── */}
        <div className="w-full lg:flex-1 z-10 flex flex-col items-center lg:items-start text-center lg:text-left mt-10 lg:mt-0">

          {/* Badge */}
          <div
            data-hero="badge"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-fn-emerald/25 mb-6 md:mb-8"
            style={{ opacity: 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-fn-emerald animate-pulse" />
            <span className="text-[10px] md:text-xs font-inter font-medium text-fn-emerald tracking-widest uppercase">
              {isEnglish ? 'FusionNeural AI · Industry 5.0' : 'FusionNeural AI · Industri 5.0'}
            </span>
          </div>

          {/* Headline — each word animated via GSAP stagger */}
          <h1 className="font-space font-bold leading-[1.1] md:leading-none mb-4 select-none">
            {HEADLINE_WORDS.map((word, i) => (
              <span
                key={word}
                data-hero="word"
                className={`block text-[3.5rem] leading-none sm:text-7xl md:text-8xl lg:text-[7rem] tracking-tight ${
                  i === 0 ? 'text-fn-navy' : 'gradient-text'
                }`}
                style={{ opacity: 0 }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Sub-headline */}
          <p
            data-hero="sub"
            className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-fn-navy/60 font-inter font-light max-w-xl mx-auto lg:mx-0 leading-relaxed"
            style={{ opacity: 0 }}
          >
            {isEnglish ? (
              <>From <span className="text-fn-navy font-semibold">Operator</span> to{' '}
              <span className="gradient-text-emerald font-semibold">Director</span>. An autonomous business ecosystem powered by 4 AI Agents — active 24/7 without manual intervention.</>
            ) : (
              <>Dari <span className="text-fn-navy font-semibold">Operator</span> menjadi{' '}
              <span className="gradient-text-emerald font-semibold">Sutradara</span>. Ekosistem bisnis otonom bertenaga 4 Agen AI — Manager, Admin, Marketing &amp; Finance — aktif 24/7.</>
            )}
          </p>

          {/* CTAs */}
          <div
            data-hero="cta"
            className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 mt-8 md:mt-10 w-full sm:w-auto"
            style={{ opacity: 0 }}
          >
            <Link
              to="/pemesanan"
              data-cursor
              className="group flex items-center justify-center gap-2.5 px-7 py-4 md:py-3.5 rounded-full bg-fn-navy text-white font-space font-semibold text-sm hover:bg-fn-navy-light transition-all shadow-xl btn-shimmer w-full sm:w-auto"
            >
              {isEnglish ? 'Order Now' : 'Pesan Sekarang'}
              <Zap size={15} className="text-fn-emerald group-hover:scale-110 transition-transform" />
            </Link>
            <Link
              to="/login"
              data-cursor
              className="flex items-center justify-center gap-2.5 px-7 py-4 md:py-3.5 rounded-full glass border border-fn-emerald/30 text-fn-navy font-space font-semibold text-sm hover:border-fn-emerald/60 hover:bg-fn-emerald/5 transition-all w-full sm:w-auto"
            >
              <ShieldCheck size={16} className="text-fn-emerald" />
              {isEnglish ? 'Dashboard Access' : 'Masuk Dashboard'}
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-y-6 sm:flex sm:flex-wrap justify-center lg:justify-start sm:gap-8 mt-12 md:mt-16 w-full">
            {(isEnglish ? [
              { val: '4', label: 'Active AI Agents' },
              { val: '24/7', label: 'Autonomous Ops' },
              { val: 'Rp 0', label: 'Extra HR Cost' },
              { val: '∞', label: 'Scalability' },
            ] : [
              { val: '4', label: 'Agen AI Aktif' },
              { val: '24/7', label: 'Operasi Otonom' },
              { val: 'Rp 0', label: 'Biaya SDM Tambahan' },
              { val: '∞', label: 'Kapasitas Skalabilitas' },
            ]).map(stat => (
              <div key={stat.label} data-hero="stat" className="text-center lg:text-left" style={{ opacity: 0 }}>
                <p className="font-space font-bold text-3xl md:text-2xl text-fn-navy">{stat.val}</p>
                <p className="text-xs text-fn-navy/50 font-inter mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: 3D Canvas ───────────────────────────── */}
        <div
          data-hero="scene"
          className="relative lg:flex-1 w-full h-[300px] sm:h-[400px] lg:h-[600px] mt-8 lg:mt-0 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <HeroScene />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollRef}
        data-hero="scroll"
        className="flex flex-col items-center pb-8 lg:pb-10 gap-2 mt-auto relative z-20"
        style={{ opacity: 0 }}
      >
        <span className="text-[10px] md:text-xs text-fn-navy/40 font-inter tracking-widest uppercase">
          {isEnglish ? 'Scroll to explore' : 'Scroll untuk menjelajahi'}
        </span>
        <div style={{ animation: 'bounceY 1.5s ease-in-out infinite' }}>
          <ArrowDown size={16} className="text-fn-emerald" />
        </div>
        <style>{`@keyframes bounceY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }`}</style>
      </div>
    </section>
  );
}