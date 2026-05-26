/**
 * Project: FUSION NEURAL
 * components/orchestrator/AgentWorkstation.tsx
 * Dipisah dari AgentOrchestratorPage.tsx (Solusi #3)
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useAgentAudio } from '../../hooks/useAgentAudio';

export interface AgentData {
  id: string;
  name: string;
  model: string;
  role: string;
}

interface Props {
  agent: AgentData;
  accent: string;
  active: boolean;
  taskActive: boolean;
  level: number;
  onOpenHub: () => void;
}

const THOUGHT_STREAMS = [
  'Analyzing market signals...',
  'Optimizing response vectors...',
  'Cross-referencing neural patterns...',
  'Querying knowledge base...',
  'Synthesizing action plan...',
  'Calculating optimal output...',
  'Awaiting next directive...',
];

const getRank = (lvl: number): string => {
  if (lvl >= 100) return 'OVERLORD';
  if (lvl >= 50) return 'GRANDMASTER';
  if (lvl >= 25) return 'SENIOR';
  if (lvl >= 10) return 'JUNIOR';
  return 'TRAINEE';
};

export default function AgentWorkstation({ agent, accent, active, taskActive, level, onOpenHub }: Props) {
  const [stamina, setStamina] = useState(100);
  const [isPoked, setIsPoked] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [godMode, setGodMode] = useState(false);
  const [exp, setExp] = useState(Math.floor(Math.random() * 80) + 10);
  const [thought, setThought] = useState(THOUGHT_STREAMS[0]);
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useAgentAudio();

  const isWorking = active || taskActive;
  const isExhausted = stamina === 0;

  // Rotate thought stream + EXP gain
  useEffect(() => {
    if (!isWorking) return;
    const t = setInterval(() => {
      setThought(THOUGHT_STREAMS[Math.floor(Math.random() * THOUGHT_STREAMS.length)]);
      setExp(prev => {
        const newExp = Math.min(100, prev + Math.floor(Math.random() * 3));
        if (newExp > prev) play('expGain');
        return newExp;
      });
    }, 2800);
    return () => clearInterval(t);
  }, [isWorking, play]);

  // Stamina drain/regen
  useEffect(() => {
    const timer = setInterval(() => {
      setStamina(prev => isWorking ? Math.max(0, prev - 1.5) : Math.min(100, prev + 2.5));
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorking]);

  // Auto-complain when tired
  useEffect(() => {
    if (stamina < 20 && isWorking && !speech) {
      setSpeech('So... tired...');
      setTimeout(() => setSpeech(null), 3000);
    }
  }, [stamina, isWorking, speech]);

  const handlePoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 300);
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (newCount >= 3) {
      const nextGodMode = !godMode;
      setGodMode(nextGodMode);
      setClickCount(0);
      setSpeech(nextGodMode ? '⚡ GOD MODE!' : 'GOD MODE OFF');
      play(nextGodMode ? 'godMode' : 'godModeOff');
      setTimeout(() => setSpeech(null), 2000);
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
      const msgs = active
        ? ["Don't touch!", "I'm busy!", "Ouch!", "Concentrating...", "Wait!"]
        : ["Zzz... huh?!", "I'm awake!", "Boss?", "Need something?", "System check!"];
      setSpeech(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setSpeech(null), 2000);
    }, 600);
  };

  return (
    <motion.div
      onClick={handlePoke}
      whileHover={{ scale: 1.05, y: -5 }}
      animate={isPoked ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        padding: '36px 20px 24px', borderRadius: 24, cursor: 'pointer',
        background: isWorking
          ? `radial-gradient(circle at top, ${accent}30 0%, rgba(15,23,42,0.95) 100%)`
          : `linear-gradient(180deg, ${accent}08 0%, rgba(15,23,42,0.95) 100%)`,
        border: `2px solid ${isWorking ? (isExhausted ? '#ef4444' : accent) : accent + '20'}`,
        boxShadow: isWorking
          ? `0 20px 60px ${isExhausted ? '#ef444440' : accent + '25'}, inset 0 0 30px ${accent}15`
          : '0 10px 40px rgba(0,0,0,0.5)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative', minWidth: 180, overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(${accent} 1px, transparent 1px)`, backgroundSize: '12px 12px', pointerEvents: 'none' }} />

      <AnimatePresence>
        {speech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            style={{ position: 'absolute', top: 60, zIndex: 100, background: '#fff', color: '#0f172a', padding: '6px 12px', borderRadius: '12px 12px 12px 0', fontSize: 11, fontWeight: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}
          >{speech}</motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {isExhausted ? (
            <motion.div key="exh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: '1px' }}>CRITICAL_FATIGUE</motion.div>
          ) : taskActive ? (
            <motion.div key="task" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} /> ON TASK
            </motion.div>
          ) : active ? (
            <motion.div key="act" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'blink 1s infinite' }} /> ACTIVE
            </motion.div>
          ) : (
            <motion.div key="id" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 9, fontWeight: 900, color: accent, opacity: 0.6, letterSpacing: '1px' }}>RECHARGING</motion.div>
          )}
        </AnimatePresence>
        <div style={{ background: active ? accent : accent + '30', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'transparent'}` }}>
          LV {level}
        </div>
      </div>

      {/* Monitor & Character */}
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', justifyContent: 'center', marginTop: 15 }}>
        {!active && !speech && (
          <div style={{ position: 'absolute', top: 35, right: 10, zIndex: 20 }}>
            {[1, 2, 3].map(i => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1, 1.2], y: [-5, -45], x: [0, 15, 0], rotate: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 1, ease: 'easeInOut' }}
                style={{ position: 'absolute', fontSize: 12, fontWeight: 800, color: accent, textShadow: `0 0 8px ${accent}`, opacity: 0.4 }}
              >z</motion.div>
            ))}
          </div>
        )}
        <div style={{ width: 56, height: 40, background: '#020617', border: `3px solid ${active ? (stamina < 20 ? '#ef4444' : accent) : accent + '40'}`, borderRadius: 12, position: 'absolute', top: 0, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4, padding: 8, overflow: 'hidden', boxShadow: active ? `0 0 30px ${stamina < 20 ? '#ef4444' : accent}40` : 'none', opacity: active ? 1 : 0.4 }}>
          {active ? (<>
            <motion.div animate={{ width: ['20%', '95%', '30%'] }} transition={{ repeat: Infinity, duration: isExhausted ? 2 : 0.3 }} style={{ height: 4, background: isExhausted ? '#ef4444' : accent, borderRadius: 2 }} />
            <motion.div animate={{ width: ['70%', '40%', '85%'] }} transition={{ repeat: Infinity, duration: isExhausted ? 3 : 0.4 }} style={{ height: 4, background: isExhausted ? '#ef4444' : accent, borderRadius: 2, opacity: 0.7 }} />
          </>) : (<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}><Cpu size={20} color={accent} /></div>)}
        </div>
        <div style={{ width: 18, height: 10, background: accent, opacity: active ? 0.3 : 0.1, position: 'absolute', top: 40, borderRadius: '0 0 8px 8px' }} />
        <div style={{ width: 72, height: 6, background: '#0f172a', borderTop: `2px solid ${accent}40`, position: 'absolute', top: 48, borderRadius: 4 }} />
        <motion.div animate={active ? { y: [0, -6, 0], rotate: isExhausted ? [0, -2, 2, 0] : [0, -3, 3, 0] } : { y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: active ? (isExhausted ? 1 : 0.2) : 4 }} style={{ position: 'absolute', bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div animate={!active ? { rotate: [0, 8, 0], y: [0, 1, 0] } : (isExhausted ? { rotate: [0, 20, 0] } : {})} transition={{ repeat: Infinity, duration: 4 }} style={{ width: 22, height: 22, background: '#f8fafc', borderRadius: '50%', marginBottom: -2, border: `2px solid ${accent}40`, position: 'relative', boxShadow: '0 6px 12px rgba(0,0,0,0.4)', zIndex: 5 }}>
            <motion.div animate={active ? { opacity: 1, background: stamina < 20 ? '#ef4444' : accent } : { opacity: [0.1, 0.15, 0.1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ position: 'absolute', top: 6, left: 2, width: 18, height: 6, background: active ? accent : '#020617', borderRadius: 4, boxShadow: active ? `0 0 15px ${stamina < 20 ? '#ef4444' : accent}` : 'none', border: active ? 'none' : `1px solid ${accent}40` }} />
          </motion.div>
          <motion.div animate={!active ? { scaleY: [1, 1.05, 1], opacity: 0.7 } : {}} transition={{ repeat: Infinity, duration: 4 }} style={{ width: 34, height: 24, background: active ? (isExhausted ? '#ef4444' : accent) : accent + '40', borderRadius: '12px 12px 0 0', border: '2px solid #0f172a' }} />
        </motion.div>
      </div>

      {/* Info & Stats */}
      <div style={{ textAlign: 'center', width: '100%', zIndex: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.5px' }}>{agent.name}</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: accent, background: `${accent}15`, padding: '2px 6px', borderRadius: 4, letterSpacing: '1px', border: `1px solid ${accent}30` }}>{getRank(level)}</div>
        </div>
        {active && (
          <motion.div key={thought} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ fontSize: 8, color: '#64748b', marginTop: 6, fontFamily: 'monospace', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, letterSpacing: '0.3px' }}>
            ▶ {thought}
          </motion.div>
        )}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ width: '100%', height: 6, background: '#020617', borderRadius: 4, overflow: 'hidden', border: `1px solid ${accent}20` }}>
            <motion.div animate={{ width: `${exp}%` }} transition={{ duration: 1.2 }} style={{ height: '100%', background: accent }} />
          </div>
          <div style={{ width: '100%', height: 6, background: '#020617', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
            <motion.div animate={{ width: `${stamina}%` }} transition={{ duration: 0.3 }} style={{ height: '100%', background: stamina < 20 ? '#ef4444' : '#fbbf24', boxShadow: stamina < 20 ? '0 0 10px #ef4444' : 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: 5, fontWeight: 900, color: '#fff', lineHeight: '6px' }}>ENERGY</div>
          </div>
        </div>
        <div style={{ fontSize: 7, fontWeight: 900, color: stamina < 20 ? '#ef4444' : active ? accent : '#475569', marginTop: 8, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {isExhausted ? 'SYSTEM OVERHEAT' : active ? 'NEURAL LOAD ACTIVE' : 'STAMINA REGEN'}
        </div>
        {clickCount > 0 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 8, color: '#f59e0b', marginTop: 4, fontFamily: 'monospace' }}>
            {'⚡'.repeat(clickCount)} {3 - clickCount} more...
          </motion.div>
        )}
      </div>

      {/* God Mode Overlay */}
      <AnimatePresence>
        {godMode && (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 24, zIndex: 50, background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.96) 100%)', backdropFilter: 'blur(8px)', border: `1px solid ${accent}80`, boxShadow: `0 0 40px ${accent}40, inset 0 0 40px ${accent}10`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
            <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 9, fontWeight: 900, color: accent, letterSpacing: '3px', fontFamily: 'monospace' }}>
              ⚡ GOD MODE — NEURAL SCAN ⚡
            </motion.div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: accent, fontFamily: 'monospace', letterSpacing: '1px' }}>{agent.model.toUpperCase()} · {getRank(level)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%', marginTop: 4 }}>
              {[
                { label: 'LVL', val: level || 1, color: accent },
                { label: 'EXP', val: `${exp}%`, color: '#f59e0b' },
                { label: 'INT', val: Math.floor(60 + level * 2), color: '#3b82f6' },
                { label: 'AGI', val: Math.floor(40 + level * 1.5), color: '#10b981' },
                { label: 'STM', val: `${stamina.toFixed(0)}%`, color: stamina < 20 ? '#ef4444' : '#fbbf24' },
                { label: 'RNK', val: getRank(level).slice(0, 3), color: '#8b5cf6' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${stat.color}20` }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{stat.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: stat.color, fontFamily: 'monospace' }}>{stat.val}</span>
                </div>
              ))}
            </div>
            <motion.div key={thought} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace', textAlign: 'center', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, width: '100%' }}>
              ▶ {active ? thought : 'STANDBY — NO ACTIVE TASK'}
            </motion.div>
            <button onClick={(e) => { e.stopPropagation(); onOpenHub(); }}
              style={{ padding: '8px 16px', background: accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: 800, marginTop: 10, cursor: 'pointer', boxShadow: `0 0 10px ${accent}80`, letterSpacing: '1px' }}>
              OPEN AGENT HUB
            </button>
            <div style={{ fontSize: 7, color: '#334155', fontFamily: 'monospace', marginTop: 2 }}>click 3× again to close</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
