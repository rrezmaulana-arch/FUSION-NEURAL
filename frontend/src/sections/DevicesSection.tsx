/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import deviceImg from '../assets/device.png';
import { useLang } from '../context/LanguageContext';

export default function DevicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const containerRef = useRef<HTMLElement>(null);
  const { isEnglish } = useLang();

  // Parallax 3D effect on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -50]);

  return (
    <section ref={containerRef} id="devices" className="relative py-20 overflow-hidden select-none" style={{ background: '#0a1628' }}>
      <div className="max-w-6xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-4 px-4 py-1.5 rounded-full bg-fn-emerald/10 border border-fn-emerald/20"
            >
              {isEnglish ? 'Omnichannel Access' : 'Akses Omnisaluran'}
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-space font-bold text-4xl md:text-5xl text-white mb-6"
            >
              {isEnglish ? 'Full Control.' : 'Kendali Penuh.'}<br />
              <span className="text-white/40">{isEnglish ? 'Anywhere. Any Device.' : 'Di Mana Saja. Perangkat Apa Saja.'}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-white/60 font-inter text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8"
            >
              {isEnglish
                ? 'Monitor your AI agents, review cash flow, and execute executive commands seamlessly from your MacBook, iPad, or iPhone. The entire ecosystem syncs in real-time.'
                : 'Monitor agen AI Kak, tinjau arus kas, dan jalankan perintah eksekutif dengan mulus dari MacBook, iPad, atau iPhone. Seluruh ekosistem tersinkronisasi secara real-time.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              {[
                { label: 'MacBook', icon: 'Laptop' },
                { label: 'iPad', icon: 'Tablet' },
                { label: 'iPhone', icon: 'Smartphone' },
              ].map(device => (
                <div key={device.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 font-inter text-sm">
                  <span className="w-4 h-4 opacity-60">
                    {device.icon === 'Laptop' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 20h20"/></svg>
                    )}
                    {device.icon === 'Tablet' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    )}
                    {device.icon === 'Smartphone' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    )}
                  </span>
                  {device.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D Image Parallax Composition */}
          <div
            className="flex-1 w-full h-[300px] sm:h-[400px] md:h-[500px] relative flex items-center justify-center"
            style={{ perspective: 1200 }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 60%)', filter: 'blur(40px)' }} />
            </div>

            {/* Parallax Image Container */}
            <motion.div
              style={{ rotateX, scale, y, transformStyle: 'preserve-3d' }}
              className="relative w-full h-full flex items-center justify-center pointer-events-none"
            >
              <motion.img 
                src={deviceImg} 
                alt="Omnichannel Devices"
                className="w-full h-auto object-contain drop-shadow-2xl max-w-[120%] lg:max-w-[130%]"
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
