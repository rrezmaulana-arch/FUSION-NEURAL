/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const { currentUser } = useAuth();
  const { isEnglish } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Breathing glow
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.4,
          opacity: 0.6,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // Staggered reveal for all CTA content
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        }
      });

      tl.fromTo('[data-cta="tag"]',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }
      )
      .fromTo('[data-cta="title"]',
        { opacity: 0, y: 50, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' },
        '-=0.2'
      )
      .fromTo('[data-cta="desc"]',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.5'
      )
      .fromTo('[data-cta="btns"]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.5'
      )
      .fromTo('[data-cta="note"]',
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.3'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="cta" className="relative py-24 overflow-hidden bg-white" ref={sectionRef}>
      {/* Central breathing glow */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Tag */}
        <span
          data-cta="tag"
          className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-8 px-4 py-1.5 rounded-full glass-emerald"
          style={{ opacity: 0 }}
        >
          {isEnglish ? 'The Autonomous Revolution' : 'Revolusi Bisnis Otonom'}
        </span>

        <h2
          data-cta="title"
          className="font-space font-bold text-5xl md:text-7xl text-fn-navy leading-none mb-6"
          style={{ opacity: 0 }}
        >
          {isEnglish ? 'Join the' : 'Mulai'}
          <br />
          <span className="gradient-text">{isEnglish ? 'Autonomous' : 'Perjalanan'}</span>
          <br />
          {isEnglish ? 'Revolution' : 'Otonomi Bisnis'}
        </h2>

        <p
          data-cta="desc"
          className="text-fn-navy/55 font-inter text-xl max-w-2xl mx-auto leading-relaxed mb-12"
          style={{ opacity: 0 }}
        >
          {isEnglish
            ? "FUSION NEURAL is not just a tool — it's a paradigm shift. Stop managing operations. Start directing outcomes. 4 AI Agents running 24/7 in compliance with Indonesian law."
            : 'FUSION NEURAL bukan sekadar alat — ini adalah paradigma baru berbisnis. Hentikan peran sebagai Operator. Jadilah Sutradara yang mengarahkan hasil. 4 Agen AI aktif 24/7 sesuai hukum Indonesia.'}
        </p>

        {/* CTA Buttons */}
        <div
          data-cta="btns"
          className="flex flex-wrap gap-5 justify-center"
          style={{ opacity: 0 }}
        >
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            data-cursor
            className="group relative px-10 py-4 rounded-full font-space font-semibold text-white text-base overflow-hidden shadow-2xl btn-shimmer inline-block"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <span className="relative z-10">
              {currentUser
                ? (isEnglish ? 'Enter Neural Dashboard' : 'Masuk ke Dashboard')
                : (isEnglish ? 'Begin Your Evolution' : 'Mulai Evolusi Bisnis Kak')}
            </span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </Link>

          <button
            data-cursor
            className="px-10 py-4 rounded-full font-space font-semibold text-fn-navy text-base glass border border-fn-navy/15 hover:border-fn-emerald/40 hover:text-fn-emerald transition-all"
          >
            {isEnglish ? 'View Full Documentation' : 'Lihat Dokumentasi Lengkap'}
          </button>
        </div>

        {/* Disclaimer */}
        <p
          data-cta="note"
          className="mt-10 text-xs text-fn-navy/30 font-inter"
          style={{ opacity: 0 }}
        >
          {isEnglish
            ? 'FUSION NEURAL is a conceptual AI business ecosystem project. All workflows shown use real-time Firestore data.'
            : 'FUSION NEURAL adalah proyek demonstrasi ekosistem AI bisnis berbasis hukum Indonesia. Seluruh alur kerja menggunakan data real-time dari Firestore.'}
        </p>
      </div>
    </section>
  );
}
