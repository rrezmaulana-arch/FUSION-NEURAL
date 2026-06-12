/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TECH_STACK } from '../data/content';
import { Brain, Network, Database, Code2, Server } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const nodeIcons: Record<string, React.ReactNode> = {
  groq: <Brain size={20} />,
  neural: <Network size={24} />,
  firebase: <Database size={20} />,
  react: <Code2 size={20} />,
  server: <Server size={20} />,
};

function NodeCard({ node, small }: { node: typeof TECH_STACK[0]; small?: boolean }) {
  return (
    <div
      className={`rounded-2xl text-center transition-all hover:scale-[1.02] bg-[#112240] select-none ${small ? 'px-4 py-3 flex items-center gap-3 text-left min-w-[180px] w-full' : 'p-6 min-w-[160px]'}`}
      style={{ border: `1px solid ${node.color}20` }}
    >
      <div
        className={`rounded-xl flex items-center justify-center flex-shrink-0 ${small ? 'w-10 h-10' : 'w-14 h-14 mx-auto mb-4'}`}
        style={{ background: `${node.color}15`, color: node.color }}
      >
        {nodeIcons[node.id] || <Network size={20} />}
      </div>
      <div>
        <h4 className={`font-space font-semibold text-white ${small ? 'text-sm' : 'text-base'}`}>{node.label}</h4>
        <p className="text-white/40 text-xs font-inter mt-0.5">{node.desc}</p>
      </div>
    </div>
  );
}

// Animated pulsing data-flow dots
function FlowDots({ color, delay = 0 }: { color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dots = ref.current.querySelectorAll('.flow-dot');
    if (dots.length > 0) {
      gsap.to(dots, {
        opacity: 1,
        stagger: { each: 0.25, repeat: -1, yoyo: false, from: 'start' },
        duration: 0.3,
        ease: 'power1.in',
        delay,
      });
    }
  }, [delay]);

  return (
    <div ref={ref} className="flex lg:flex-row flex-col items-center gap-1">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flow-dot w-1 lg:w-2 h-2 lg:h-0.5 rounded-full"
          style={{ background: color, opacity: 0.2 }}
        />
      ))}
      <div className="text-sm mt-1 lg:mt-0 lg:ml-1 rotate-90 lg:rotate-0" style={{ color }}>▶</div>
    </div>
  );
}

export default function TechStackSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isEnglish } = useLang();

  const groqNode = TECH_STACK.find(n => n.id === 'groq')!;
  const neuralNode = TECH_STACK.find(n => n.id === 'neural')!;
  const outputs = TECH_STACK.filter(n => n.id !== 'groq' && n.id !== 'neural');

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Header reveal
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true }
      });
      tl.fromTo('[data-tech="header"] > *',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
      )
      .fromTo('[data-tech="left"]',
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.3'
      )
      .fromTo('[data-tech="center"]',
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' },
        '-=0.5'
      )
      .fromTo('[data-tech="right-item"]',
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        '-=0.5'
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="tech-stack" className="relative py-20 overflow-hidden bg-[#0a1628]" ref={sectionRef}>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div data-tech="header" className="text-center mb-16">
          <span className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-purple mb-4 px-4 py-1.5 rounded-full bg-fn-purple/10 border border-fn-purple/20" style={{ opacity: 0 }}>
            {isEnglish ? 'Neural Path · Tech Stack' : 'Jalur Neural · Tumpukan Teknologi'}
          </span>
          <h2 className="font-space font-bold text-4xl md:text-6xl text-white" style={{ opacity: 0 }}>
            {isEnglish ? 'The Nervous System' : 'Sistem Saraf'}
            <br />
            <span className="text-fn-purple-light">{isEnglish ? 'of the Ecosystem' : 'Ekosistem FusionNeural'}</span>
          </h2>
          <p className="mt-4 text-white/50 font-inter text-lg max-w-xl mx-auto" style={{ opacity: 0 }}>
            {isEnglish
              ? 'Every signal flows through Neural Core Engine — connecting AI commands with real-time Firestore data in milliseconds.'
              : 'Setiap sinyal mengalir melalui Neural Core Engine — menghubungkan perintah AI dengan data real-time Firestore dalam hitungan milidetik.'}
          </p>
        </div>

        {/* Responsive Flow Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
          {/* Left */}
          <div data-tech="left" className="flex flex-col items-center select-none" style={{ opacity: 0 }}>
            <NodeCard node={groqNode} />
          </div>

          {/* Connector 1 */}
          <div className="flex lg:flex-row flex-col items-center mx-2 lg:mx-4">
            <FlowDots color="#9333EA" />
          </div>

          {/* Center */}
          <div data-tech="center" className="mx-2 lg:mx-4 select-none" style={{ opacity: 0 }}>
            <div
              className="relative px-8 py-6 rounded-3xl text-center min-w-[200px] bg-[#112240]"
              style={{ border: '1px solid rgba(147,51,234,0.5)' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4"
                style={{ background: 'rgba(147,51,234,0.15)', color: '#9333EA' }}
              >
                {nodeIcons[neuralNode.id] || <Network size={28} />}
              </div>
              <h3 className="font-space font-bold text-white text-xl">{neuralNode.label}</h3>
              <p className="text-fn-purple-light text-xs font-inter mt-1">{neuralNode.desc}</p>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {['Groq API', 'Firestore', 'Auth', 'Real-time'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-inter text-fn-purple-light bg-fn-purple/10 border border-fn-purple/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="flex lg:flex-row flex-col items-center mx-2 lg:mx-4">
            <FlowDots color="#3b82f6" delay={0.3} />
          </div>

          {/* Right outputs */}
          <div className="flex flex-col lg:grid lg:grid-cols-1 grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
            {outputs.map(node => (
              <div key={node.id} data-tech="right-item" className="select-none" style={{ opacity: 0 }}>
                <NodeCard node={node} small />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
