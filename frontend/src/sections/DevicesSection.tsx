/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import deviceImg from '../assets/device.png';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export default function DevicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isEnglish } = useLang();

  // Parallax 3D effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -50]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-device="left"]', start: 'top 80%', once: true }
      });
      tl.fromTo('[data-device="tag"]', { opacity: 0 }, { opacity: 1, duration: 0.5 })
        .fromTo('[data-device="title"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.2')
        .fromTo('[data-device="desc"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-device="icons"]', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3');

      gsap.fromTo('[data-device="img"]', 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: '[data-device="right"]', start: 'top 80%', once: true }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="devices" className="relative py-20 overflow-hidden select-none" style={{ background: '#0a1628' }}>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          
          {/* Left Text */}
          <div data-device="left" className="flex-1 text-center lg:text-left">
            <span
              data-device="tag"
              className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-4 px-4 py-1.5 rounded-full bg-fn-emerald/10 border border-fn-emerald/20"
              style={{ opacity: 0 }}
            >
              {isEnglish ? 'Omnichannel Access' : 'Akses Omnisaluran'}
            </span>
            
            <h2
              data-device="title"
              className="font-space font-bold text-4xl md:text-5xl text-white mb-6"
              style={{ opacity: 0 }}
            >
              {isEnglish ? 'Full Control.' : 'Kendali Penuh.'}<br />
              <span className="text-white/40">{isEnglish ? 'Anywhere. Any Device.' : 'Di Mana Saja. Perangkat Apa Saja.'}</span>
            </h2>

            <p
              data-device="desc"
              className="text-white/60 font-inter text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8"
              style={{ opacity: 0 }}
            >
              {isEnglish
                ? 'Monitor your AI agents, review cash flow, and execute executive commands seamlessly from your MacBook, iPad, or iPhone. The entire ecosystem syncs in real-time.'
                : 'Monitor agen AI Kak, tinjau arus kas, dan jalankan perintah eksekutif dengan mulus dari MacBook, iPad, atau iPhone. Seluruh ekosistem tersinkronisasi secara real-time.'}
            </p>

            <div
              data-device="icons"
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
              style={{ opacity: 0 }}
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
            </div>
          </div>

          {/* Right — 3D Image Parallax Composition */}
          <div
            data-device="right"
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
                data-device="img"
                src={deviceImg} 
                alt="Omnichannel Devices"
                className="w-full h-auto object-contain drop-shadow-2xl max-w-[120%] lg:max-w-[130%]"
                style={{ opacity: 0 }}
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
