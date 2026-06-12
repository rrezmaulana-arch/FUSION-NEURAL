/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AGENTS, AGENTS_EN } from '../data/content';
import { BrainCircuit, Box, Sparkles, TrendingUp } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const agentIcons: Record<string, React.ReactNode> = {
  manager: <BrainCircuit size={24} />,
  admin: <Box size={24} />,
  marketing: <Sparkles size={24} />,
  finance: <TrendingUp size={24} />,
};

interface AgentCardProps {
  agent: typeof AGENTS[0];
  index: number;
  onClick: () => void;
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-inter text-fn-navy/50 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-fn-navy/8 overflow-hidden">
        <div
          data-agents="stat-fill"
          data-value={value}
          className="h-full rounded-full"
          style={{ background: color, width: 0 }}
        />
      </div>
    </div>
  );
}

function AgentCard({ agent, index, onClick }: AgentCardProps) {
  return (
    <div
      onClick={onClick}
      data-cursor
      data-agents="card"
      className="group relative rounded-3xl p-7 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-white w-full flex flex-col"
      style={{
        border: `1px solid ${agent.color}30`,
        boxShadow: `0 4px 32px ${agent.glowColor}10`,
        opacity: 0
      }}
    >
      {/* Glow bg on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${agent.glowColor}, transparent 60%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          {/* Lucide Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: `${agent.color}15`, color: agent.color }}
          >
            {agentIcons[agent.id] || <BrainCircuit size={24} />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-inter"
              style={{ color: agent.color }}>{agent.level}</p>
            <h3 className="font-space font-bold text-fn-navy text-lg leading-tight">{agent.title}</h3>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-inter font-medium shrink-0 ml-2"
          style={{ background: `${agent.color}10`, color: agent.color }}
        >
          {agent.role}
        </div>
      </div>

      {/* Description - Hapus truncate & line-clamp agar tampil utuh */}
      <p className="text-sm text-fn-navy/60 font-inter leading-relaxed mb-6 relative z-10">
        {agent.description}
      </p>

      {/* Capabilities - Tampil utuh walau panjang */}
      <div className="flex flex-col gap-2 mb-6 relative z-10 flex-1">
        {agent.capabilities.map((cap, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: agent.color }} />
            <span className="text-xs text-fn-navy/70 font-inter leading-relaxed">{cap}</span>
          </div>
        ))}
      </div>

      {/* Stat bars */}
      <div className="flex flex-col gap-2.5 relative z-10 mt-auto">
        <StatBar label="Autonomy" value={agent.stats.autonomy} color={agent.color} />
        <StatBar label="Coverage" value={agent.stats.coverage} color={agent.color} />
        <StatBar label="Efficiency" value={agent.stats.efficiency} color={agent.color} />
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(to right, ${agent.color}, transparent)` }} />
    </div>
  );
}

export default function AgentsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const { isEnglish } = useLang();
  const agents = isEnglish ? AGENTS_EN : AGENTS;

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Header Animation
      const tlHeader = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-agents="header"]',
          start: 'top 85%',
          once: true,
        }
      });
      tlHeader.fromTo('[data-agents="tag"]',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5 }
      )
      .fromTo('[data-agents="title"]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.2'
      )
      .fromTo('[data-agents="desc"]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.4'
      );

      // Cards Animation
      const tlCards = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-agents="cards"]',
          start: 'top 80%',
          once: true,
        }
      });
      tlCards.fromTo('[data-agents="card"]',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15 }
      );
      
      // Animate stat bars inside the cards
      tlCards.to('[data-agents="stat-fill"]', {
        width: (i, el) => `${el.getAttribute('data-value')}%`,
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.05
      }, '-=0.2');

      // Diagram Animation
      gsap.fromTo('[data-agents="diagram"]',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: {
            trigger: '[data-agents="diagram"]',
            start: 'top 90%',
            once: true,
          }
        }
      );

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="agents" className="relative py-20 overflow-hidden bg-white" ref={sectionRef}>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div data-agents="header" className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              data-agents="tag"
              className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-purple px-4 py-1.5 rounded-full glass-purple"
              style={{ opacity: 0 }}
            >
              {isEnglish ? 'The Neural Council' : 'Dewan Neural'}
            </span>
          </div>
          <h2
            data-agents="title"
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy"
            style={{ opacity: 0 }}
          >
            {isEnglish ? '4 AI Agents.' : '4 Agen AI.'}{' '}
            <span className="gradient-text">{isEnglish ? 'One Ecosystem.' : 'Satu Ekosistem.'}</span>
          </h2>
          <p
            data-agents="desc"
            className="mt-4 text-fn-navy/55 font-inter text-lg max-w-xl mx-auto"
            style={{ opacity: 0 }}
          >
            {isEnglish
              ? 'Each agent is a specialized intelligence layer — collectively forming a self-managing company.'
              : 'Setiap agen adalah lapisan kecerdasan khusus — bersama membentuk perusahaan yang mengelola dirinya sendiri.'}
          </p>
        </div>

        {/* Cards Grid */}
        <div data-agents="cards" className="flex sm:grid overflow-x-auto sm:overflow-visible sm:grid-cols-2 xl:grid-cols-4 gap-5 pb-8 pt-4 -my-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">
          {agents.map((agent, i) => (
            <div 
              key={agent.id} 
              className="w-[85vw] sm:w-auto flex-shrink-0 snap-center flex"
            >
              <AgentCard
                agent={agent}
                index={i}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              />
            </div>
          ))}
        </div>

        {/* Ecosystem flow diagram */}
        <div
          data-agents="diagram"
          className="mt-12 bg-white border border-slate-200 rounded-3xl p-8 flex flex-wrap justify-center items-center gap-4 shadow-sm"
          style={{ opacity: 0 }}
        >
          {agents.map((agent, i) => (
            <div key={agent.id} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: `${agent.color}15`, color: agent.color }}
                >
                  {agentIcons[agent.id] || <BrainCircuit size={20} />}
                </div>
                <span className="text-xs font-inter text-fn-navy/60">{agent.title}</span>
              </div>
              {i < AGENTS.length - 1 && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                  className="text-fn-purple text-sm"
                >
                  ⟶
                </motion.div>
              )}
            </div>
          ))}
          <div className="w-full text-center mt-2">
              <span className="text-xs font-inter text-fn-navy/40 tracking-widest uppercase">
                {isEnglish ? 'Orchestrated by AI Core Engine' : 'Diorkestrasikan oleh Neural Core Engine'}
              </span>
          </div>
        </div>
      </div>
    </section>
  );
}
