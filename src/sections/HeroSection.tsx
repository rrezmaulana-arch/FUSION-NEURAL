import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import HeroScene from '../components/three/HeroScene';
import gsap from 'gsap';

const HEADLINE_WORDS = ['FUSION', 'NEURAL'];

export default function HeroSection() {
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );
    }
  }, []);

  return (
    <section
      id="home"
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
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-fn-emerald/25 mb-6 md:mb-8"
            style={{ opacity: 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-fn-emerald animate-pulse" />
            <span className="text-[10px] md:text-xs font-inter font-medium text-fn-emerald tracking-widest uppercase">
              FusionNeural AI · Industry 5.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-space font-bold leading-[1.1] md:leading-none mb-4 select-none">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`block text-[3.5rem] leading-none sm:text-7xl md:text-8xl lg:text-[7rem] tracking-tight ${
                  i === 0 ? 'text-fn-navy' : 'gradient-text'
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-fn-navy/60 font-inter font-light max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Evolution from{' '}
            <span className="text-fn-navy font-semibold">Operator</span> to{' '}
            <span className="gradient-text-emerald font-semibold">Director</span>.{' '}
            An Autonomous Business Ecosystem powered by 4 AI Agents, all orchestrated through a single Neural Engine.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 mt-8 md:mt-10 w-full sm:w-auto"
          >
            <a
              href="#vision"
              data-cursor
              className="group flex items-center justify-center gap-2.5 px-7 py-4 md:py-3.5 rounded-full bg-fn-navy text-white font-space font-semibold text-sm hover:bg-fn-navy-light transition-all shadow-xl btn-shimmer w-full sm:w-auto"
            >
              Explore Ecosystem
              <ArrowDown size={15} className="group-hover:translate-y-1 transition-transform" />
            </a>
            <a
              href="#agents"
              data-cursor
              className="flex items-center justify-center gap-2.5 px-7 py-4 md:py-3.5 rounded-full glass border border-fn-emerald/30 text-fn-navy font-space font-semibold text-sm hover:border-fn-emerald/60 hover:bg-fn-emerald/5 transition-all w-full sm:w-auto"
            >
              <span className="text-fn-emerald">⚡</span>
              Meet the Agents
            </a>
          </motion.div>

          {/* Stats row - Grid untuk Mobile, Flex untuk Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="grid grid-cols-2 gap-y-6 sm:flex sm:flex-wrap justify-center lg:justify-start sm:gap-8 mt-12 md:mt-16 w-full"
          >
            {[
              { val: '4', label: 'AI Agents' },
              { val: '24/7', label: 'Autonomous Ops' },
              { val: '0%', label: 'Human Error' },
              { val: '∞', label: 'Scalability' },
            ].map(stat => (
              <div key={stat.label} className="text-center lg:text-left">
                <p className="font-space font-bold text-3xl md:text-2xl text-fn-navy">{stat.val}</p>
                <p className="text-xs text-fn-navy/50 font-inter mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D Canvas ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative lg:flex-1 w-full h-[300px] sm:h-[400px] lg:h-[600px] mt-8 lg:mt-0 pointer-events-auto"
        >
          <HeroScene />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="flex flex-col items-center pb-8 lg:pb-10 gap-2 mt-auto relative z-20"
      >
        <span className="text-[10px] md:text-xs text-fn-navy/40 font-inter tracking-widest uppercase">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ArrowDown size={16} className="text-fn-emerald" />
        </motion.div>
      </motion.div>
    </section>
  );
}