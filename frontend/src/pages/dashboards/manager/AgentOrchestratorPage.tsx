/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, Briefcase, Shield, Megaphone, Calculator, MessageSquare, Activity, ArrowLeft, Cpu, Terminal, Zap, ChevronRight, Clock, CheckCircle2, Layers, Volume2, VolumeX } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import InfrastructureView from './views/InfrastructureView';
import WalkingCanvas from './views/WalkingCanvas';
import { useAgentAudio } from '../../../hooks/useAgentAudio';

const ROOMS = [
  { id: 'admin', label: 'OPS Admin', sublabel: 'Operations Command', icon: Briefcase, accent: '#8b5cf6', agents: [
    { id: 'admin_1', name: 'Cohere', model: 'command-r-plus', role: 'Admin JSON (Primary)' },
    { id: 'admin_2', name: 'OpenRouter', model: 'gpt-4o-mini-free', role: 'Universal Fallback' },
  ]},
  { id: 'manager', label: 'Manager CMD', sublabel: 'Command & Control', icon: Shield, accent: '#3b82f6', agents: [
    { id: 'manager_1', name: 'Gemini', model: '2.5-flash-preview', role: 'Manager (Primary)' },
    { id: 'manager_2', name: 'Mistral', model: 'large-latest', role: 'Manager (Backup)' },
  ]},
  { id: 'marketing', label: 'Creative MKT', sublabel: 'Marketing & Creative', icon: Megaphone, accent: '#ec4899', agents: [
    { id: 'mkt_1', name: 'HuggingFace', model: 'Mistral-7B', role: 'Text Generation' },
    { id: 'mkt_2', name: 'Gemini Imagen', model: '2.0-flash-image', role: 'Image (Premium)' },
    { id: 'mkt_3', name: 'FLUX.1-schnell', model: 'schnell', role: 'Image (Fast)' },
  ]},
  { id: 'finance', label: 'Finance Vault', sublabel: 'Financial Intelligence', icon: Calculator, accent: '#10b981', agents: [
    { id: 'fin_1', name: 'DeepSeek', model: 'deepseek-reasoner', role: 'Finance (Primary)' },
  ]},
  { id: 'frontliner', label: 'Comms & Sales', sublabel: 'Customer Communications', icon: MessageSquare, accent: '#f59e0b', agents: [
    { id: 'fl_1', name: 'Groq', model: 'llama-3.3-70b', role: 'Frontliner (Primary)' },
    { id: 'fl_2', name: 'Cerebras', model: 'llama-3.3-70b', role: 'Frontliner (Backup)' },
  ]},
  { id: 'core', label: 'Data Core', sublabel: 'Real-time Search Layer', icon: Database, accent: '#6366f1', agents: [
    { id: 'core_1', name: 'Serper.dev', model: 'Google Search', role: 'Search Tool (Live)' },
  ]},
];

interface Log { id: string; agent: string; details: string; timestamp: any; }

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
.ao-wrap { font-family: 'Outfit', sans-serif; background: transparent; min-height: 100vh; color: #e2e8f0; margin: -24px; padding: 0; user-select: none; cursor: default; }
.ao-bg { background: transparent; }
.ao-scroll::-webkit-scrollbar { width: 5px; } .ao-scroll::-webkit-scrollbar-track { background: transparent; } .ao-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 4px; }
.ao-card { background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); transition: all 0.25s cubic-bezier(.4,0,.2,1); }
.ao-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-2px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.ao-mono { font-family: 'JetBrains Mono', monospace; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes pulse-glow { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
`;

function timeAgo(ts: any) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date());
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}
function isRecent(ts: any) {
  if (!ts) return false;
  const date = typeof ts === 'string' ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date());
  return (Date.now() - date.getTime()) / 1000 < 30;
}

/* ── Agent Workstation (RPG Gamified Worker) ── */
function AgentWorkstation({ agent, accent, active, level }: { agent: typeof ROOMS[0]['agents'][0], accent: string, active: boolean, level: number }) {
  const [stamina, setStamina] = useState(100);
  const [isPoked, setIsPoked] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [godMode, setGodMode] = useState(false);
  const [exp, setExp] = useState(Math.floor(Math.random() * 80) + 10);
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useAgentAudio();

  const THOUGHT_STREAMS = [
    'Analyzing market signals...',
    'Optimizing response vectors...',
    'Cross-referencing neural patterns...',
    'Querying knowledge base...',
    'Synthesizing action plan...',
    'Calculating optimal output...',
    'Awaiting next directive...',
  ];
  const [thought, setThought] = useState(THOUGHT_STREAMS[0]);

  // Rotate thought stream + EXP gain sound
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setThought(THOUGHT_STREAMS[Math.floor(Math.random() * THOUGHT_STREAMS.length)]);
      setExp(prev => {
        const newExp = Math.min(100, prev + Math.floor(Math.random() * 3));
        if (newExp > prev) play('expGain');
        return newExp;
      });
    }, 2800);
    return () => clearInterval(t);
  }, [active]);

  // Stamina & Auto-Recharge Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setStamina(prev => {
        if (active) return Math.max(0, prev - 1.5);
        return Math.min(100, prev + 2.5);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  // Handle Click → God Mode on 3 rapid clicks
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
      const messages = active
        ? ["Don't touch!", "I'm busy!", "Ouch!", "Concentrating...", "Wait!"]
        : ["Zzz... huh?!", "I'm awake!", "Boss?", "Need something?", "System check!"];
      setSpeech(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setSpeech(null), 2000);
    }, 600);
  };

  // Auto-complain when tired
  useEffect(() => {
    if (stamina < 20 && active && !speech) {
      setSpeech("So... tired...");
      setTimeout(() => setSpeech(null), 3000);
    }
  }, [stamina, active]);

  const getRank = (lvl: number) => {
    if (lvl >= 100) return 'OVERLORD';
    if (lvl >= 50) return 'GRANDMASTER';
    if (lvl >= 25) return 'SENIOR';
    if (lvl >= 10) return 'JUNIOR';
    return 'TRAINEE';
  };

  const isExhausted = stamina === 0;

  return (
    <motion.div 
      onClick={handlePoke}
      whileHover={{ scale: 1.05, y: -5 }}
      animate={isPoked ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        padding: '36px 20px 24px', borderRadius: 24, cursor: 'pointer',
        background: active 
          ? `radial-gradient(circle at top, ${accent}30 0%, rgba(15,23,42,0.95) 100%)` 
          : `linear-gradient(180deg, ${accent}08 0%, rgba(15,23,42,0.95) 100%)`,
        border: `2px solid ${active ? (isExhausted ? '#ef4444' : accent) : accent+'20'}`,
        boxShadow: active 
          ? `0 20px 60px ${isExhausted ? '#ef444440' : accent+'25'}, inset 0 0 30px ${accent}15` 
          : `0 10px 40px rgba(0,0,0,0.5)`,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative', minWidth: 180,
        overflow: 'hidden'
      }}
    >
      {/* Background Subtle Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(${accent} 1px, transparent 1px)`, backgroundSize: '12px 12px', pointerEvents: 'none' }} />

      {/* Speech Bubble */}
      <AnimatePresence>
        {speech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'absolute', top: 60, zIndex: 100, background: '#fff', color: '#0f172a',
              padding: '6px 12px', borderRadius: '12px 12px 12px 0', fontSize: 11, fontWeight: 800,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'
            }}
          >
            {speech}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Labels */}
      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        {/* Status Text */}
        <AnimatePresence mode="wait">
          {isExhausted ? (
             <motion.div key="exh" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: '1px' }}>
              CRITICAL_FATIGUE
            </motion.div>
          ) : active ? (
            <motion.div key="act" initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }} style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '1px', display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', animation:'blink 1s infinite' }} /> ACTIVE
            </motion.div>
          ) : (
            <motion.div key="id" initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }} style={{ fontSize: 9, fontWeight: 900, color: accent, opacity: 0.6, letterSpacing: '1px' }}>
              RECHARGING
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Badge */}
        <div style={{
          background: active ? accent : accent+'30', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'transparent'}`
        }}>
          LV {level}
        </div>
      </div>

      {/* Workstation Visual */}
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', justifyContent: 'center', marginTop: 15 }}>
        
        {/* Fluid Zzz Animation (Only if Idle & Not Poked) */}
        {!active && !speech && (
          <div style={{ position:'absolute', top: 35, right: 10, zIndex: 20 }}>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ 
                  opacity: [0, 0.7, 0], 
                  scale: [0.6, 1, 1.2], 
                  y: [-5, -45], 
                  x: [0, 15, 0],
                  rotate: [-10, 10, -10]
                }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 1, ease: "easeInOut" }}
                style={{ position:'absolute', fontSize: 12, fontWeight: 800, color: accent, textShadow:`0 0 8px ${accent}`, opacity: 0.4 }}
              >
                z
              </motion.div>
            ))}
          </div>
        )}

        {/* Monitor */}
        <div style={{ 
          width: 56, height: 40, background: '#020617', border: `3px solid ${active ? (stamina < 20 ? '#ef4444' : accent) : accent+'40'}`, 
          borderRadius: 12, position: 'absolute', top: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 4, padding: 8, overflow: 'hidden',
          boxShadow: active ? `0 0 30px ${stamina < 20 ? '#ef4444' : accent}40` : 'none',
          opacity: active ? 1 : 0.4
        }}>
          {active ? (
            <>
              <motion.div animate={{ width: ['20%', '95%', '30%'] }} transition={{ repeat: Infinity, duration: isExhausted ? 2 : 0.3 }} style={{ height: 4, background: isExhausted ? '#ef4444' : accent, borderRadius: 2 }} />
              <motion.div animate={{ width: ['70%', '40%', '85%'] }} transition={{ repeat: Infinity, duration: isExhausted ? 3 : 0.4 }} style={{ height: 4, background: isExhausted ? '#ef4444' : accent, borderRadius: 2, opacity: 0.7 }} />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
              <Cpu size={20} color={accent} />
            </div>
          )}
        </div>
        {/* Stand & Desk */}
        <div style={{ width: 18, height: 10, background: accent, opacity: active ? 0.3 : 0.1, position: 'absolute', top: 40, borderRadius: '0 0 8px 8px' }} />
        <div style={{ width: 72, height: 6, background: '#0f172a', borderTop: `2px solid ${accent}40`, position: 'absolute', top: 48, borderRadius: 4 }} />
        
        {/* The Worker Character */}
        <motion.div 
          animate={active ? { 
            y: [0, -6, 0],
            rotate: isExhausted ? [0, -2, 2, 0] : [0, -3, 3, 0]
          } : {
            y: [0, 3, 0]
          }}
          transition={{ repeat: Infinity, duration: active ? (isExhausted ? 1 : 0.2) : 4 }}
          style={{ position: 'absolute', bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Head */}
          <motion.div 
            animate={!active ? { rotate: [0, 8, 0], y: [0, 1, 0] } : (isExhausted ? { rotate: [0, 20, 0] } : {})}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ width: 22, height: 22, background: '#f8fafc', borderRadius: '50%', marginBottom: -2, border: `2px solid ${accent}40`, position:'relative', boxShadow: '0 6px 12px rgba(0,0,0,0.4)', zIndex: 5 }}
          >
            {/* Visor / Eyes */}
            <motion.div 
              animate={active ? { opacity: 1, background: stamina < 20 ? '#ef4444' : accent } : { opacity: [0.1, 0.15, 0.1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              style={{ 
                position:'absolute', top:6, left:2, width:18, height:6, 
                background: active ? accent : '#020617', 
                borderRadius:4, 
                boxShadow: active ? `0 0 15px ${stamina < 20 ? '#ef4444' : accent}` : 'none',
                border: active ? 'none' : `1px solid ${accent}40`
              }} 
            />
          </motion.div>
          {/* Body */}
          <motion.div 
            animate={!active ? { scaleY: [1, 1.05, 1], opacity: 0.7 } : {}}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ width: 34, height: 24, background: active ? (isExhausted ? '#ef4444' : accent) : accent+'40', borderRadius: '12px 12px 0 0', border: '2px solid #0f172a' }} 
          />
        </motion.div>
      </div>

      {/* Info labels */}
      <div style={{ textAlign: 'center', width: '100%', zIndex: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.5px' }}>{agent.name}</div>
          <div style={{ fontSize: 8, fontWeight: 900, color: accent, background: `${accent}15`, padding: '2px 6px', borderRadius: 4, letterSpacing: '1px', border: `1px solid ${accent}30` }}>{getRank(level)}</div>
        </div>

        {/* Thought Stream (always visible when active) */}
        {active && (
          <motion.div
            key={thought}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 8, color: '#64748b', marginTop: 6, fontFamily: 'monospace', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, letterSpacing: '0.3px' }}
          >
            ▶ {thought}
          </motion.div>
        )}
        
        {/* XP & Stamina Bars */}
        <div style={{ marginTop: 10, display:'flex', flexDirection:'column', gap:6 }}>
          {/* XP Bar */}
          <div style={{ width: '100%', height: 6, background: '#020617', borderRadius: 4, overflow: 'hidden', border: `1px solid ${accent}20` }}>
            <motion.div animate={{ width: `${exp}%` }} transition={{ duration: 1.2 }} style={{ height: '100%', background: accent }} />
          </div>
          {/* Stamina Bar */}
          <div style={{ width: '100%', height: 6, background: '#020617', borderRadius: 4, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.05)`, position:'relative' }}>
            <motion.div animate={{ width: `${stamina}%` }} transition={{ duration: 0.3 }} style={{ height: '100%', background: stamina < 20 ? '#ef4444' : '#fbbf24', boxShadow: stamina < 20 ? '0 0 10px #ef4444' : 'none' }} />
            <div style={{ position:'absolute', top:0, left:0, right:0, textAlign:'center', fontSize:5, fontWeight:900, color:'#fff', lineHeight:'6px' }}>ENERGY</div>
          </div>
        </div>

        <div style={{ fontSize: 7, fontWeight: 900, color: stamina < 20 ? '#ef4444' : active ? accent : '#475569', marginTop: 8, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {isExhausted ? 'SYSTEM OVERHEAT' : active ? 'NEURAL LOAD ACTIVE' : 'STAMINA REGEN'}
        </div>

        {/* Click hint */}
        {clickCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 8, color: '#f59e0b', marginTop: 4, fontFamily: 'monospace' }}
          >
            {'⚡'.repeat(clickCount)} {3 - clickCount} more...
          </motion.div>
        )}
      </div>

      {/* ── GOD MODE HOLOGRAPHIC OVERLAY ── */}
      <AnimatePresence>
        {godMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 24, zIndex: 50,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.96) 100%)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${accent}80`,
              boxShadow: `0 0 40px ${accent}40, inset 0 0 40px ${accent}10`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16
            }}
          >
            {/* Header */}
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 9, fontWeight: 900, color: accent, letterSpacing: '3px', fontFamily: 'monospace' }}
            >
              ⚡ GOD MODE — NEURAL SCAN ⚡
            </motion.div>

            {/* Agent ID */}
            <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: accent, fontFamily: 'monospace', letterSpacing: '1px' }}>
              {agent.model.toUpperCase()} · {getRank(level)}
            </div>

            {/* RPG Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%', marginTop: 4 }}>
              {[
                { label: 'LVL', val: level || 1, color: accent },
                { label: 'EXP', val: `${exp}%`, color: '#f59e0b' },
                { label: 'INT', val: Math.floor(60 + level * 2), color: '#3b82f6' },
                { label: 'AGI', val: Math.floor(40 + level * 1.5), color: '#10b981' },
                { label: 'STM', val: `${stamina.toFixed(0)}%`, color: stamina < 20 ? '#ef4444' : '#fbbf24' },
                { label: 'RNK', val: getRank(level).slice(0, 3), color: '#8b5cf6' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '5px 8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: `1px solid ${stat.color}20`
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{stat.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: stat.color, fontFamily: 'monospace' }}>{stat.val}</span>
                </div>
              ))}
            </div>

            {/* Thought stream in God Mode */}
            <motion.div
              key={thought}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace', textAlign: 'center', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, width: '100%' }}
            >
              ▶ {active ? thought : 'STANDBY — NO ACTIVE TASK'}
            </motion.div>

            <div style={{ fontSize: 7, color: '#334155', fontFamily: 'monospace', marginTop: 2 }}>
              click 3× again to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Room Detail ── */
function RoomView({ room, logs, onBack }: { room: typeof ROOMS[0], logs: Log[], onBack:()=>void }) {
  const roomLogs = logs.filter(l => l.agent.toLowerCase() === room.id || (room.id==='core' && !ROOMS.find(r=>r.id===l.agent.toLowerCase())));
  const active = roomLogs.length > 0 && isRecent(roomLogs[0].timestamp);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Back header */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={onBack} style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${room.accent}18`, border:`1px solid ${room.accent}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <room.icon size={20} color={room.accent} />
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'#f8fafc', letterSpacing:'-0.01em' }}>{room.label}</h2>
            <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{room.sublabel}</p>
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:20, background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`, fontSize:12, fontWeight:700, color: active ? '#10b981' : '#475569' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: active ? '#10b981' : '#475569', animation: active ? 'blink 1.5s infinite' : 'none' }} />
          {active ? 'PROCESSING' : 'STANDBY'}
        </div>
      </div>

      {/* Grid: agents + logs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start' }}>
        {/* Agents Grid */}
        <div className="ao-card" style={{ borderRadius:16, padding:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'1.5px', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Cpu size={14} /> ACTIVE AI WORKSTATIONS — {room.agents.length}
          </div>
          <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap:20 }}>
            {room.agents.map(a => {
              // Calculate dynamic level based on agent's logs
              const agentLogs = logs.filter(l => l.agent.toLowerCase().includes(a.name.toLowerCase()));
              const agentLevel = Math.floor(agentLogs.length / 3); // Level up every 3 tasks
              return <AgentWorkstation key={a.id} agent={a} accent={room.accent} active={active} level={agentLevel} />;
            })}
          </div>
          
          {/* Stats row */}
          <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:24 }}>
            {[
              { icon: Activity, label:'Sector Events', val: roomLogs.length },
              { icon: Clock, label:'Last Sync', val: roomLogs[0] ? timeAgo(roomLogs[0].timestamp) : '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label}>
                <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:'1px', display:'flex', alignItems:'center', gap:5, marginBottom:6 }}><Icon size={12} color='#475569'/>{label}</div>
                <div className="ao-mono" style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="ao-card" style={{ borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
            <Terminal size={15} color={room.accent} />
            <span style={{ fontSize:13, fontWeight:700, color:'#f8fafc' }}>Activity Log</span>
          </div>
          <div className="ao-scroll" style={{ maxHeight:400, overflowY:'auto' }}>
            {roomLogs.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#334155', fontSize:13 }}>No recent activity in this sector.</div>
            ) : roomLogs.slice(0,20).map((log, i) => (
              <div key={log.id} style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', gap:14, alignItems:'flex-start', animation:'slide-in 0.3s ease', animationDelay:`${i*0.04}s`, animationFillMode:'both' }}>
                <CheckCircle2 size={14} color={room.accent} style={{ marginTop:2, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p className="ao-mono" style={{ margin:0, fontSize:12, color:'#cbd5e1', lineHeight:1.6, wordBreak:'break-word' }}>{log.details}</p>
                  <span className="ao-mono" style={{ fontSize:10, color:'#475569', marginTop:4, display:'block' }}>{timeAgo(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Room Card ── */
function RoomCard({ room, logs, onClick, index }: { room: typeof ROOMS[0], logs: Log[], onClick:()=>void, index:number }) {
  const roomLogs = logs.filter(l => l.agent.toLowerCase() === room.id || (room.id==='core' && !ROOMS.find(r=>r.id===l.agent.toLowerCase())));
  const active = roomLogs.length > 0 && isRecent(roomLogs[0].timestamp);
  const lastLog = roomLogs[0];

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: index * 0.07 }}
      whileHover={{ y:-4, scale:1.015 }} onClick={onClick}
      className="ao-card"
      style={{ borderRadius:18, padding:24, cursor:'pointer', position:'relative', overflow:'hidden', border:`1px solid ${active ? room.accent+'50' : 'rgba(255,255,255,0.07)'}`, boxShadow: active ? `0 8px 30px ${room.accent}20` : 'none' }}
    >
      {/* glow */}
      <div style={{ position:'absolute', top:-60, right:-60, width:140, height:140, background:room.accent, filter:'blur(60px)', opacity: active ? 0.25 : 0.07, pointerEvents:'none', transition:'opacity 0.4s' }} />
      {active && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${room.accent}, transparent)` }} />}

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${room.accent}18`, border:`1px solid ${room.accent}35`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <room.icon size={22} color={room.accent} />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#f8fafc', letterSpacing:'-0.01em' }}>{room.label}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{room.sublabel}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: active ? '#10b981' : '#334155', animation: active ? 'blink 1.5s infinite' : 'none' }} />
            <span style={{ fontSize:10, fontWeight:700, color: active ? '#10b981' : '#475569', letterSpacing:'0.5px' }}>{active ? 'LIVE' : 'IDLE'}</span>
          </div>
        </div>

        {/* Agent count */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {room.agents.map(a => (
            <div key={a.id} className="ao-mono" style={{ fontSize:10, fontWeight:700, color: room.accent, background:`${room.accent}12`, border:`1px solid ${room.accent}25`, padding:'3px 9px', borderRadius:6 }}>
              {a.name}
            </div>
          ))}
        </div>

        {/* Last task */}
        <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.05)', marginBottom:16, minHeight:44 }}>
          <p className="ao-mono" style={{ margin:0, fontSize:11, color: lastLog ? '#94a3b8' : '#334155', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {lastLog ? lastLog.details : 'Awaiting task stream…'}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="ao-mono" style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:5 }}>
            <Clock size={11} /> {lastLog ? timeAgo(lastLog.timestamp) : '—'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color: room.accent }}>
            Enter Room <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main View ── */
function MainView({ logs, onSelectRoom }: { logs: Log[], onSelectRoom:(id:string)=>void }) {
  const totalActive = ROOMS.filter(r => {
    const rl = logs.filter(l => l.agent.toLowerCase() === r.id);
    return rl.length > 0 && isRecent(rl[0].timestamp);
  }).length;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      {/* Stats bar */}
      <div id="ao-stats" style={{ display:'flex', gap:16, marginBottom:28 }}>
        {[
          { icon: Network, label:'Total Zones', val: ROOMS.length, accent:'#6366f1' },
          { icon: Zap, label:'Active Now', val: totalActive, accent:'#10b981' },
          { icon: Activity, label:'Events Logged', val: logs.length, accent:'#f59e0b' },
          { icon: Cpu, label:'AI Models', val: ROOMS.reduce((s,r)=>s+r.agents.length,0), accent:'#3b82f6' },
        ].map(({ icon: Icon, label, val, accent }) => (
          <div key={label} className="ao-card" style={{ flex:1, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={18} color={accent} />
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:'#f8fafc', lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Room grid */}
      <div id="ao-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
        {ROOMS.map((room, i) => (
          <RoomCard key={room.id} room={room} logs={logs} onClick={() => onSelectRoom(room.id)} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Global Log Table ── */
function GlobalLogs({ logs }: { logs: Log[] }) {
  return (
    <motion.div id="ao-logs" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="ao-card" style={{ borderRadius:16, overflow:'hidden', marginTop:24 }}>
      <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Terminal size={16} color='#94a3b8' />
          <span style={{ fontSize:14, fontWeight:700, color:'#f8fafc' }}>Global Network Activity</span>
        </div>
        <div className="ao-mono" style={{ fontSize:11, color:'#64748b', background:'rgba(255,255,255,0.04)', padding:'4px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
          {logs.length} EVENTS
        </div>
      </div>
      <div className="ao-scroll" style={{ overflowX:'auto', maxHeight:280 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead>
            <tr style={{ background:'rgba(0,0,0,0.25)' }}>
              {['Time', 'Agent', 'Zone', 'Status', 'Output'].map(h => (
                <th key={h} style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'1px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="ao-mono" style={{ fontSize:12 }}>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:48, color:'#334155' }}>Waiting for neural activity…</td></tr>
            ) : logs.map(log => {
              const zone = ROOMS.find(r => r.id === log.agent.toLowerCase()) || ROOMS.find(r => r.id === 'core')!;
              return (
                <tr key={log.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding:'12px 20px', color:'#64748b', whiteSpace:'nowrap' }}>{timeAgo(log.timestamp)}</td>
                  <td style={{ padding:'12px 20px', color:'#f8fafc', fontWeight:700, textTransform:'capitalize' }}>{log.agent}</td>
                  <td style={{ padding:'12px 20px' }}>
                    <span style={{ color: zone.accent, background:`${zone.accent}15`, padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700, border:`1px solid ${zone.accent}25` }}>{zone.label}</span>
                  </td>
                  <td style={{ padding:'12px 20px' }}>
                    <span style={{ color:'#10b981', background:'rgba(16,185,129,0.1)', padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700, border:'1px solid rgba(16,185,129,0.25)' }}>SUCCESS</span>
                  </td>
                  <td style={{ padding:'12px 20px', color:'#94a3b8', maxWidth:360, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function AgentOrchestratorPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [viewLayer, setViewLayer] = useState<'Operations' | 'Infrastructure'>('Operations');
  const [showWalkingCanvas, setShowWalkingCanvas] = useState(true);
  const { play, toggleMute } = useAgentAudio();
  const [audioMuted, setAudioMuted] = useState(false);
  // Active agents dari audit_logs terbaru (working jika log < 30s)
  const activeAgentIds = logs
    .filter(l => isRecent(l.timestamp))
    .map(l => l.agent.toLowerCase());

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setAudioMuted(nowMuted);
  };

  const toggleAutonomous = async () => {
    const newState = !isAutonomous;
    setIsAutonomous(newState);
    play('agentActivate');
    try {
      // Endpoint is accessible via the Vite proxy or directly if mapped
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || '';
      await fetch(`${baseUrl}/api/autonomous/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({ status: newState ? "ON" : "OFF" })
      });
    } catch (e) {
      console.error("Failed to toggle autonomous mode", e);
      setIsAutonomous(!newState);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(50));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setLogs(data.map((d: any) => ({ id: d.id, agent: d.agent, details: d.details || d.action_type, timestamp: d.created_at })));
    });
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setLogs(data.map((d: any) => ({ id: d.id, agent: d.agent, details: d.details || d.action_type, timestamp: d.created_at })));
    });
      
    return () => unsubscribe();
  }, []);

  const activeRoom = ROOMS.find(r => r.id === activeRoomId);

  return (
    <div className="ao-wrap ao-bg">
      <style>{STYLE}</style>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 32px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Network size={22} color='#6366f1' />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#f8fafc', letterSpacing:'-0.02em' }}>Neural AI Simulation</h1>
            <p className="ao-mono" style={{ margin:0, fontSize:11, color:'#475569', marginTop:2 }}>AI ORCHESTRATOR COMMAND DASHBOARD</p>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Layer Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => { setViewLayer('Operations'); play('layerSwitch'); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewLayer === 'Operations' ? '#6366f1' : 'transparent', color: viewLayer === 'Operations' ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              >
                <Layers size={14} /> OPS FLOOR
              </button>
              <button 
                onClick={() => { setViewLayer('Infrastructure'); play('layerSwitch'); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewLayer === 'Infrastructure' ? '#10b981' : 'transparent', color: viewLayer === 'Infrastructure' ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              >
                <Database size={14} /> INFRA DECK
              </button>
            </div>

            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
              style={{ width: 34, height: 34, borderRadius: 8, background: audioMuted ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', border: `1px solid ${audioMuted ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              {audioMuted ? <VolumeX size={14} color='#475569' /> : <Volume2 size={14} color='#6366f1' />}
            </button>

            <div className="ao-mono" style={{ fontSize: 11, fontWeight: 700, color: isAutonomous ? '#10b981' : '#64748b' }}>
              {isAutonomous ? 'AUTO-LOOP: ACTIVE' : 'AUTO-LOOP: INACTIVE'}
            </div>
            <button 
              onClick={toggleAutonomous}
              style={{
                width: 48, height: 24, borderRadius: 12, position: 'relative',
                background: isAutonomous ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isAutonomous ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.3s', padding: 0
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: isAutonomous ? 26 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: isAutonomous ? '#10b981' : '#64748b',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isAutonomous ? '0 0 10px rgba(16,185,129,0.6)' : 'none'
              }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewLayer === 'Infrastructure' ? (
            <InfrastructureView key="infra" />
          ) : activeRoom ? (
            <RoomView key="room" room={activeRoom} logs={logs} onBack={() => setActiveRoomId(null)} />
          ) : (
            <motion.div key="main" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {/* Walking Canvas — Operations Floor */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="ao-mono" style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: 2 }}>WALKING PATHS — LIVE CANVAS</span>
                  <button onClick={() => setShowWalkingCanvas(v => !v)} style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'monospace' }}>
                    {showWalkingCanvas ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <AnimatePresence>
                  {showWalkingCanvas && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <WalkingCanvas activeAgents={activeAgentIds} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <MainView logs={logs} onSelectRoom={setActiveRoomId} />
              <GlobalLogs logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
