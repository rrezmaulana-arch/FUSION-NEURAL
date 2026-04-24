import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import deviceImg from '../assets/device.png';

export default function DevicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const containerRef = useRef<HTMLElement>(null);

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
              Omnichannel Access
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-space font-bold text-4xl md:text-5xl text-white mb-6"
            >
              Full Control.<br />
              <span className="text-white/40">Anywhere. Any Device.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-white/60 font-inter text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8"
            >
              Monitor your AI agents, review cash flow, and execute executive commands seamlessly from your MacBook, iPad, or iPhone. The entire ecosystem syncs in real-time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              {['💻 MacBook', '📱 iPad', '📲 iPhone'].map(device => (
                <div key={device} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 font-inter text-sm">
                  {device}
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
