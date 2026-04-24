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
        className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto w-full px-6 pt-28 pb-0 flex flex-col lg:flex-row items-center gap-8 flex-1">
        {/* ── Left Text ─────────────────────────────────── */}
        <div className="flex-1 z-10 lg:pr-8">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-fn-emerald/25 mb-8"
            style={{ opacity: 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-fn-emerald animate-pulse" />
            <span className="text-xs font-inter font-medium text-fn-emerald tracking-widest uppercase">
              NexusFlow AI · Industry 5.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-space font-bold leading-none mb-2 select-none">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`block text-6xl md:text-8xl tracking-tight ${
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
            className="mt-6 text-lg md:text-xl text-fn-navy/60 font-inter font-light max-w-lg leading-relaxed"
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
            className="flex flex-wrap gap-4 mt-10"
          >
            <a
              href="#vision"
              data-cursor
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-fn-navy text-white font-space font-semibold text-sm hover:bg-fn-navy-light transition-all shadow-xl btn-shimmer"
            >
              Explore Ecosystem
              <ArrowDown size={15} className="group-hover:translate-y-1 transition-transform" />
            </a>
            <a
              href="#agents"
              data-cursor
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-full glass border border-fn-emerald/30 text-fn-navy font-space font-semibold text-sm hover:border-fn-emerald/60 hover:bg-fn-emerald/5 transition-all"
            >
              <span className="text-fn-emerald">⚡</span>
              Meet the Agents
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="flex flex-wrap gap-8 mt-12"
          >
            {[
              { val: '4', label: 'AI Agents' },
              { val: '24/7', label: 'Autonomous Ops' },
              { val: '0%', label: 'Human Error' },
              { val: '∞', label: 'Scalability' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-space font-bold text-2xl text-fn-navy">{stat.val}</p>
                <p className="text-xs text-fn-navy/50 font-inter mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D Canvas ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0 opacity-30 lg:opacity-100 lg:relative lg:inset-auto lg:flex-1 w-full pointer-events-none lg:pointer-events-auto h-full lg:h-[600px]"
        >
          <HeroScene />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="flex flex-col items-center pb-10 gap-2 mt-4"
      >
        <span className="text-xs text-fn-navy/40 font-inter tracking-widest uppercase">Scroll to explore</span>
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
