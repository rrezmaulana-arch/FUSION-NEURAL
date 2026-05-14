/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { AGENTS, AGENTS_EN } from '../data/content';
import { BrainCircuit, Box, Sparkles, TrendingUp } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const agentIcons: Record<string, React.ReactNode> = {
  manager: <BrainCircuit size={24} />,
  admin: <Box size={24} />,
  marketing: <Sparkles size={24} />,
  finance: <TrendingUp size={24} />,
};

interface AgentCardProps {
  agent: typeof AGENTS[0];
  index: number;
  inView: boolean;
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
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function AgentCard({ agent, index, inView, onClick }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      data-cursor
      className="group relative rounded-3xl p-7 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-white w-full flex flex-col"
      style={{
        border: `1px solid ${agent.color}30`,
        boxShadow: `0 4px 32px ${agent.glowColor}10`,
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
    </motion.div>
  );
}

export default function AgentsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const { isEnglish } = useLang();
  const agents = isEnglish ? AGENTS_EN : AGENTS;

  return (
    <section id="agents" className="relative py-20 overflow-hidden bg-white" ref={ref}>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald px-4 py-1.5 rounded-full glass-emerald"
            >
              {isEnglish ? 'The Neural Council' : 'Dewan Neural'}
            </motion.span>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-space font-bold text-4xl md:text-6xl text-fn-navy"
          >
            {isEnglish ? '4 AI Agents.' : '4 Agen AI.'}{' '}
            <span className="gradient-text">{isEnglish ? 'One Ecosystem.' : 'Satu Ekosistem.'}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-fn-navy/55 font-inter text-lg max-w-xl mx-auto"
          >
            {isEnglish
              ? 'Each agent is a specialized intelligence layer — collectively forming a self-managing company.'
              : 'Setiap agen adalah lapisan kecerdasan khusus — bersama membentuk perusahaan yang mengelola dirinya sendiri.'}
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible sm:grid-cols-2 xl:grid-cols-4 gap-5 pb-8 pt-4 -my-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">
          {agents.map((agent, i) => (
            <div 
              key={agent.id} 
              className="w-[85vw] sm:w-auto flex-shrink-0 snap-center flex"
            >
              <AgentCard
                agent={agent}
                index={i}
                inView={inView}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              />
            </div>
          ))}
        </div>

        {/* Ecosystem flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 bg-white border border-slate-200 rounded-3xl p-8 flex flex-wrap justify-center items-center gap-4 shadow-sm"
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
                  className="text-fn-emerald text-sm"
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
        </motion.div>
      </div>
    </section>
  );
}