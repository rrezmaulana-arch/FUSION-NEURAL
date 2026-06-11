/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, Briefcase, Shield, Megaphone, Calculator, MessageSquare, Activity, ArrowLeft, Cpu, Terminal, Zap, ChevronRight, Clock, CheckCircle2, Layers, Volume2, VolumeX, Bot, X, ClipboardList, Wallet, CalendarDays, Plus, Trash2, Wifi, WifiOff, Settings, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import InfrastructureView from './views/InfrastructureView';
import RoomHubModal from './views/RoomHubModal';
import { ROOMS, STYLE, timeAgo, isRecent } from './orchestratorConfig';
import type { Log } from './orchestratorConfig';
import WalkingCanvas from '../../../components/pixel-office/components/PixelOfficeCanvas';
import { useAgentAudio } from '../../../hooks/useAgentAudio';
import { useAgentSignals } from '../../../hooks/useAgentSignals';

/* ── Agent Workstation (RPG Gamified Worker) ── */
function AgentWorkstation({ agent, accent, active, taskActive, level, onOpenHub }: { agent: typeof ROOMS[0]['agents'][0], accent: string, active: boolean, taskActive: boolean, level: number, onOpenHub: () => void }) {
  const [stamina, setStamina] = useState(100);
  const [isPoked, setIsPoked] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [godMode, setGodMode] = useState(false);
  const [exp, setExp] = useState(Math.floor(Math.random() * 80) + 10);
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useAgentAudio();
  
  // Combined active: from logs OR from task assignment
  const isWorking = active || taskActive;

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
  }, [isWorking]);

  // Stamina & Auto-Recharge Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setStamina(prev => {
        if (isWorking) return Math.max(0, prev - 1.5);
        return Math.min(100, prev + 2.5);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorking]);

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
    if (stamina < 20 && isWorking && !speech) {
      setSpeech("So... tired...");
      setTimeout(() => setSpeech(null), 3000);
    }
  }, [stamina, isWorking]);

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
        background: isWorking 
          ? `radial-gradient(circle at top, ${accent}30 0%, rgba(15,23,42,0.95) 100%)` 
          : `linear-gradient(180deg, ${accent}08 0%, rgba(15,23,42,0.95) 100%)`,
        border: `2px solid ${isWorking ? (isExhausted ? '#ef4444' : accent) : accent+'20'}`,
        boxShadow: isWorking 
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
          ) : taskActive ? (
            <motion.div key="task" initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }} style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', letterSpacing: '1px', display:'flex', alignItems:'center', gap:4 }}>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} style={{ width:5, height:5, borderRadius:'50%', background:'#f59e0b' }} /> ON TASK
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

            <button 
              onClick={(e) => { e.stopPropagation(); onOpenHub(); }}
              style={{ padding: '8px 16px', background: accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: 800, marginTop: 10, cursor: 'pointer', boxShadow: `0 0 10px ${accent}80`, letterSpacing: '1px' }}
            >
              OPEN AGENT HUB
            </button>

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
function RoomView({ room, logs, activeTasks, onBack, onOpenHub }: { room: typeof ROOMS[0], logs: Log[], activeTasks: string[], onBack:()=>void, onOpenHub:(room: typeof ROOMS[0])=>void }) {
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
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:20, background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`, fontSize:12, fontWeight:700, color: active ? '#10b981' : '#475569' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: active ? '#10b981' : '#475569', animation: active ? 'blink 1.5s infinite' : 'none' }} />
            {active ? 'PROCESSING' : 'STANDBY'}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onOpenHub(room)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:20, background: `linear-gradient(135deg, ${room.accent}, ${room.accent}cc)`, border:'none', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${room.accent}40`, letterSpacing:'0.5px' }}
          >
            <Bot size={14} /> Open Hub
          </motion.button>
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
              // taskActive: any task assigned to this room's role is In Progress
              const agentLogs = logs.filter(l => l.agent.toLowerCase().includes(a.name.toLowerCase()));
              const agentLevel = Math.floor(agentLogs.length / 3);
              const taskActive = activeTasks.includes(room.id);
              return <AgentWorkstation key={a.id} agent={a} accent={room.accent} active={active} taskActive={taskActive} level={agentLevel} onOpenHub={() => onOpenHub(room)} />;
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:50, height:50, borderRadius:14, background:`linear-gradient(135deg, ${room.accent}20, ${room.accent}05)`, border:`1px solid ${room.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: `0 0 15px ${room.accent}15` }}>
              <room.icon size={24} color={room.accent} />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#f8fafc', letterSpacing:'-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{room.label}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4, fontWeight:500 }}>{room.sublabel}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:24, background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, boxShadow: active ? '0 0 10px rgba(16,185,129,0.2)' : 'none' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: active ? '#10b981' : '#334155', animation: active ? 'blink 1.5s infinite' : 'none', boxShadow: active ? '0 0 8px #10b981' : 'none' }} />
            <span style={{ fontSize:11, fontWeight:800, color: active ? '#10b981' : '#475569', letterSpacing:'0.5px' }}>{active ? 'LIVE' : 'IDLE'}</span>
          </div>
        </div>

        {/* Agent count */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {room.agents.map(a => (
            <div key={a.id} className="ao-mono" style={{ fontSize:11, fontWeight:700, color: room.accent, background:`linear-gradient(to right, ${room.accent}15, ${room.accent}05)`, border:`1px solid ${room.accent}30`, padding:'4px 10px', borderRadius:8 }}>
              {a.name}
            </div>
          ))}
        </div>

        {/* Last task */}
        <div className="ao-glass-panel" style={{ padding:'14px 16px', borderRadius:12, marginBottom:20, minHeight:52 }}>
          <p className="ao-mono" style={{ margin:0, fontSize:12, color: lastLog ? '#cbd5e1' : '#475569', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {lastLog ? lastLog.details : 'Awaiting task stream…'}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="ao-mono" style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={12} /> {lastLog ? timeAgo(lastLog.timestamp) : '—'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:800, color: room.accent, transition: 'all 0.2s', textShadow: `0 0 10px ${room.accent}40` }}>
            Enter Room <ChevronRight size={16} />
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
      <div id="ao-stats" style={{ display:'flex', gap:20, marginBottom:32 }}>
        {[
          { icon: Network, label:'Total Zones', val: ROOMS.length, accent:'#6366f1' },
          { icon: Zap, label:'Active Now', val: totalActive, accent:'#10b981' },
          { icon: Activity, label:'Events Logged', val: logs.length, accent:'#f59e0b' },
          { icon: Cpu, label:'AI Models', val: ROOMS.reduce((s,r)=>s+r.agents.length,0), accent:'#3b82f6' },
        ].map(({ icon: Icon, label, val, accent }) => (
          <div key={label} className="ao-card" style={{ flex:1, borderRadius:20, padding:'20px 24px', display:'flex', alignItems:'center', gap:18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: accent, filter: 'blur(40px)', opacity: 0.15 }} />
            <div style={{ width:44, height:44, borderRadius:12, background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: `0 0 20px ${accent}20` }}>
              <Icon size={20} color={accent} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize:28, fontWeight:800, color:'#f8fafc', lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:4, fontWeight:500, letterSpacing: '0.5px' }}>{label}</div>
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
      <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Terminal size={18} color='#94a3b8' />
          <span style={{ fontSize:15, fontWeight:800, color:'#f8fafc', letterSpacing: '0.5px' }}>Global Network Activity</span>
        </div>
        <div className="ao-mono" style={{ fontSize:11, color:'#94a3b8', background:'rgba(255,255,255,0.05)', padding:'6px 12px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)' }}>
          {logs.length} EVENTS
        </div>
      </div>
      <div className="ao-scroll" style={{ overflowX:'auto', maxHeight:320 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.02)' }}>
              {['Time', 'Agent', 'Zone', 'Status', 'Output'].map(h => (
                <th key={h} style={{ padding:'14px 24px', fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'1px', whiteSpace:'nowrap', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="ao-mono" style={{ fontSize:13 }}>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:48, color:'#334155' }}>Waiting for neural activity…</td></tr>
            ) : logs.map(log => {
              const zone = ROOMS.find(r => r.id === log.agent.toLowerCase()) || ROOMS.find(r => r.id === 'core')!;
              return (
                <tr key={log.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'14px 24px', color:'#94a3b8', whiteSpace:'nowrap' }}>{timeAgo(log.timestamp)}</td>
                  <td style={{ padding:'14px 24px', color:'#f8fafc', fontWeight:700, textTransform:'capitalize' }}>{log.agent}</td>
                  <td style={{ padding:'14px 24px' }}>
                    <span style={{ color: zone.accent, background:`linear-gradient(to right, ${zone.accent}20, ${zone.accent}05)`, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:800, border:`1px solid ${zone.accent}30` }}>{zone.label}</span>
                  </td>
                  <td style={{ padding:'14px 24px' }}>
                    <span style={{ color:'#10b981', display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700 }}><div style={{width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981'}}></div>SUCCESS</span>
                  </td>
                  <td style={{ padding:'14px 24px', color:'#cbd5e1', maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.details}</td>
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
  const [activeTasks, setActiveTasks] = useState<string[]>([]);  // room IDs with active tasks
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [viewLayer, setViewLayer] = useState<'Operations' | 'Infrastructure'>('Operations');
  const [showWalkingCanvas, setShowWalkingCanvas] = useState(true);
  const [selectedHub, setSelectedHub] = useState<typeof ROOMS[0] | null>(null);
  const [hubTab, setHubTab] = useState<'board' | 'inspector' | 'gov' | 'sched'>('board');
  const { play, toggleMute } = useAgentAudio();
  const [audioMuted, setAudioMuted] = useState(false);

  // ── WebSocket Real-Time Signals (Solusi #4) ───────────────────────────────
  const { agentStatuses, isConnected: wsConnected } = useAgentSignals({
    enabled: true,
    onSignal: (signal) => {
      // Ketika ada sinyal WORKING dari WebSocket, mainkan audio notifikasi
      if (signal.status === 'WORKING' && signal.agent) {
        play('expGain');
      }
    }
  });

  // Merge: agen aktif dari Firestore logs ATAU dari WebSocket WORKING status
  const wsActiveIds = Object.entries(agentStatuses)
    .filter(([, status]) => status === 'WORKING')
    .map(([id]) => id.toLowerCase());
  const activeAgentIds = [...new Set([
    ...logs.filter(l => isRecent(l.timestamp)).map(l => l.agent.toLowerCase()),
    ...wsActiveIds,
    'manager_1' // Permanent worker!
  ])];

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setAudioMuted(nowMuted);
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

    // Live neural_tasks — detect which rooms have In Progress tasks
    const taskQ = query(collection(db, 'neural_tasks'), where('status', '==', 'In Progress'));
    const unsubTasks = onSnapshot(taskQ, (snapshot) => {
      const rooms: string[] = [];
      snapshot.docs.forEach(d => {
        const data = d.data();
        const agent = (data.agent || '').toLowerCase();
        // Map agent name string to room ID
        if (agent.includes('admin'))  rooms.push('admin');
        if (agent.includes('finance')) rooms.push('finance');
        if (agent.includes('marketing')) rooms.push('marketing');
        if (agent.includes('manager')) rooms.push('manager');
        if (agent.includes('frontliner') || agent.includes('groq') || agent.includes('cerebras')) rooms.push('frontliner');
      });
      setActiveTasks([...new Set(rooms)]);
    });
      
    return () => { unsubscribe(); unsubTasks(); };
  }, []);

  const activeRoom = ROOMS.find(r => r.id === activeRoomId);

  return (
    <div className="ao-wrap ao-bg">
      <style>{STYLE}</style>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 32px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border:'1px solid rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
            <Network size={26} color='#818cf8' />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#f8fafc', letterSpacing:'-0.03em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Neural AI Simulation</h1>
            <p className="ao-mono" style={{ margin:0, fontSize:12, color:'#94a3b8', marginTop:4, letterSpacing: '1px' }}>AI ORCHESTRATOR COMMAND DASHBOARD</p>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
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

            {/* WebSocket Signal Indicator */}
            <div title={wsConnected ? 'Neural Signal Stream aktif' : 'Mencoba terhubung...'} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: wsConnected ? '#10b981' : '#475569', background: wsConnected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${wsConnected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: '5px 10px', borderRadius: 8 }}>
              {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {wsConnected ? 'LIVE' : 'SYNC'}
            </div>

            {/* Live Task Indicator */}
            <div className="ao-mono ao-card" style={{ fontSize: 12, fontWeight: 700, color: activeTasks.length > 0 ? '#fcd34d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12 }}>
              {activeTasks.length > 0 && (
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
              )}
              {activeTasks.length > 0 ? `${activeTasks.length} AGENT(S) ON TASK` : 'ALL AGENTS IDLE'}
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewLayer === 'Infrastructure' ? (
            <InfrastructureView key="infra" />
          ) : activeRoom ? (
            <RoomView key="room" room={activeRoom} logs={logs} activeTasks={activeTasks} onBack={() => setActiveRoomId(null)} onOpenHub={(room) => { setSelectedHub(room); setHubTab('board'); }} />
          ) : (
            <motion.div key="main" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {/* Walking Canvas — Operations Floor */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                      <span className="ao-mono" style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2 }}>NEURAL OFFICE — LIVE FLOOR VIEW</span>
                    </div>
                    <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>44×26 GRID</span>
                  </div>
                  <button onClick={() => setShowWalkingCanvas(v => !v)} style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'monospace' }}>
                    {showWalkingCanvas ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <AnimatePresence>
                  {showWalkingCanvas && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      {/* Premium Canvas Frame */}
                      <div style={{
                        position: 'relative',
                        borderRadius: 16,
                        padding: 3,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.8) 0%, rgba(10,15,30,0.4) 30%, rgba(10,15,30,0.4) 70%, rgba(99,102,241,0.6) 100%)',
                        boxShadow: '0 0 60px rgba(99,102,241,0.12), inset 0 0 20px rgba(99,102,241,0.2)',
                      }}>
                        
                        {/* Scrollable Container */}
                        <div className="ao-scroll" style={{ borderRadius: 13, overflowX: 'auto', overflowY: 'hidden', background: '#050a14' }}>
                          <div style={{ width: '100%', minWidth: '800px', maxWidth: '930px', margin: '0 auto', position: 'relative', aspectRatio: '44/26' }}>
                            <WalkingCanvas key="layout-v3-refresh" activeAgents={activeAgentIds} />
                            
                            {/* Room Labels (Gamified Sci-Fi HUD Pointers) - Sticks to Map */}
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ position: 'absolute', top: '25%', left: '26%', transform: 'translate(-50%, -50%)', background: 'rgba(245, 158, 11, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(245, 158, 11, 0.8)', borderLeft: '4px solid #f59e0b', borderRadius: '4px 12px 12px 4px', padding: '6px 14px', color: '#fff', textShadow: '0 0 10px #f59e0b', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 8px #f59e0b' }} /> MANAGER CMD
                            </motion.div>
                            
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }} style={{ position: 'absolute', top: '75%', left: '26%', transform: 'translate(-50%, -50%)', background: 'rgba(59, 130, 246, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(59, 130, 246, 0.8)', borderLeft: '4px solid #3b82f6', borderRadius: '4px 12px 12px 4px', padding: '6px 14px', color: '#fff', textShadow: '0 0 10px #3b82f6', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 8px #3b82f6' }} /> STRATEGIC AUDIT
                            </motion.div>
                            
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1 }} style={{ position: 'absolute', top: '23%', left: '74%', transform: 'translate(-50%, -50%)', background: 'rgba(168, 85, 247, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(168, 85, 247, 0.8)', borderRight: '4px solid #a855f7', borderRadius: '12px 4px 4px 12px', padding: '6px 14px', color: '#fff', textShadow: '0 0 10px #a855f7', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                              <div style={{ width: 6, height: 6, background: '#a855f7', borderRadius: '50%', boxShadow: '0 0 8px #a855f7' }} /> AI ADMIN
                            </motion.div>
                            
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1.5 }} style={{ position: 'absolute', top: '53%', left: '74%', transform: 'translate(-50%, -50%)', background: 'rgba(236, 72, 153, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(236, 72, 153, 0.8)', borderRight: '4px solid #ec4899', borderRadius: '12px 4px 4px 12px', padding: '6px 14px', color: '#fff', textShadow: '0 0 10px #ec4899', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                              <div style={{ width: 6, height: 6, background: '#ec4899', borderRadius: '50%', boxShadow: '0 0 8px #ec4899' }} /> AI MARKETING
                            </motion.div>
                            
                            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 2 }} style={{ position: 'absolute', top: '83%', left: '74%', transform: 'translate(-50%, -50%)', background: 'rgba(16, 185, 129, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(16, 185, 129, 0.8)', borderRight: '4px solid #10b981', borderRadius: '12px 4px 4px 12px', padding: '6px 14px', color: '#fff', textShadow: '0 0 10px #10b981', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                              <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }} /> AI FINANCE
                            </motion.div>
                          </div>
                        </div>

                        {/* Fixed Overlays (Scanline & Corners) */}
                        <div style={{ position: 'absolute', inset: 3, pointerEvents: 'none', borderRadius: 13, overflow: 'hidden' }}>
                          <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
                          }} />
                          <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 12, borderTop: '2px solid rgba(99,102,241,0.7)', borderLeft: '2px solid rgba(99,102,241,0.7)', borderRadius: '3px 0 0 0' }} />
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderTop: '2px solid rgba(99,102,241,0.7)', borderRight: '2px solid rgba(99,102,241,0.7)', borderRadius: '0 3px 0 0' }} />
                          <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 12, borderBottom: '2px solid rgba(99,102,241,0.7)', borderLeft: '2px solid rgba(99,102,241,0.7)', borderRadius: '0 0 0 3px' }} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 12, borderBottom: '2px solid rgba(99,102,241,0.7)', borderRight: '2px solid rgba(99,102,241,0.7)', borderRadius: '0 0 3px 0' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── AUTOMATION DASHBOARD ── */}
              <div className="ao-card" style={{ borderRadius: 18, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: '#6366f1', filter: 'blur(50px)', opacity: 0.12, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Zap size={18} color='#fbbf24' />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>Automation Status</span>
                  <div className="ao-mono" style={{ marginLeft: 'auto', fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    ACTIVE
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {ROOMS.filter(r => r.id !== 'core').map(room => {
                    const roomLogs = logs.filter(l => l.agent.toLowerCase() === room.id);
                    const isActive = roomLogs.length > 0 && isRecent(roomLogs[0].timestamp);
                    const todayLogs = roomLogs.filter(l => {
                      if (!l.timestamp) return false;
                      const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
                      const today = new Date();
                      return d.toDateString() === today.toDateString();
                    });
                    return (
                      <div key={room.id} style={{ background: isActive ? `${room.accent}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? room.accent + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${room.accent}15`, border: `1px solid ${room.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <room.icon size={16} color={room.accent} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{room.label}</div>
                          <div className="ao-mono" style={{ fontSize: 10, color: isActive ? '#10b981' : '#475569' }}>
                            {isActive ? `● ACTIVE — ${todayLogs.length} events today` : `○ IDLE — ${todayLogs.length} events today`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Today's Summary */}
                {(() => {
                  const todayLogs = logs.filter(l => {
                    if (!l.timestamp) return false;
                    const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
                    const today = new Date();
                    return d.toDateString() === today.toDateString();
                  });
                  if (todayLogs.length === 0) return null;
                  return (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', marginBottom: 10 }}>HARI INI AI SUDAH:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {todayLogs.slice(0, 6).map((log, i) => (
                          <div key={i} className="ao-mono" style={{ fontSize: 10, color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ✅ {log.details}
                          </div>
                        ))}
                        {todayLogs.length > 6 && (
                          <div style={{ fontSize: 10, color: '#6366f1', padding: '6px 10px' }}>+{todayLogs.length - 6} lagi</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <MainView logs={logs} onSelectRoom={setActiveRoomId} />
              <GlobalLogs logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROOM HUB MODAL (Manager Only, Room-Context-Aware) ── */}
        <AnimatePresence>
          {selectedHub && (
            <RoomHubModal
              room={selectedHub}
              hubTab={hubTab}
              setHubTab={setHubTab}
              onClose={() => setSelectedHub(null)}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
