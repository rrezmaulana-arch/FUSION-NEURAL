import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';

export default function CTASection() {
  const ref = useRef(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, {
      scale: 1.3,
      opacity: 0.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  return (
    <section id="cta" className="relative py-24 overflow-hidden bg-white" ref={ref}>
      {/* Central glow */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Tag */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-8 px-4 py-1.5 rounded-full glass-emerald"
        >
          The Autonomous Revolution
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-space font-bold text-5xl md:text-7xl text-fn-navy leading-none mb-6"
        >
          Join the
          <br />
          <span className="gradient-text">Autonomous</span>
          <br />
          Revolution
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-fn-navy/55 font-inter text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          FUSION NEURAL is not just a tool — it's a paradigm shift. Stop managing operations. Start directing outcomes. The future of business is autonomous, and it starts now.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap gap-5 justify-center"
        >
          <button
            data-cursor
            className="group relative px-10 py-4 rounded-full font-space font-semibold text-white text-base overflow-hidden shadow-2xl btn-shimmer"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <span className="relative z-10">Begin Your Evolution</span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </button>

          <button
            data-cursor
            className="px-10 py-4 rounded-full font-space font-semibold text-fn-navy text-base glass border border-fn-navy/15 hover:border-fn-emerald/40 hover:text-fn-emerald transition-all"
          >
            View Full Documentation
          </button>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 text-xs text-fn-navy/30 font-inter"
        >
          FUSION NEURAL is a conceptual project demonstration. All workflows shown are for educational purposes.
        </motion.p>
      </div>
    </section>
  );
}
