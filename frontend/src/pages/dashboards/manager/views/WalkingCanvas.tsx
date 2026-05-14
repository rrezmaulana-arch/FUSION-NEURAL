import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentAudio } from '../../../../hooks/useAgentAudio';

interface WalkingAgent {
  id: string;
  name: string;
  accent: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  trail: { x: number; y: number }[];
  isWorking: boolean;
  pauseUntil?: number;
  thought?: string;
}

const NODE_RATIOS = [
  { id: 'ops',  label: 'OPS',  rx: 0.15, ry: 0.35, type: 'ops' },
  { id: 'com',  label: 'COM',  rx: 0.15, ry: 0.65, type: 'com' },
  { id: 'cmd',  label: 'CMD',  rx: 0.50, ry: 0.20, type: 'cmd' },
  { id: 'core', label: 'CORE', rx: 0.50, ry: 0.50, type: 'core' },
  { id: 'hub',  label: 'HUB',  rx: 0.50, ry: 0.80, type: 'hub' },
  { id: 'mkt',  label: 'MKT',  rx: 0.85, ry: 0.35, type: 'mkt' },
  { id: 'fin',  label: 'FIN',  rx: 0.85, ry: 0.65, type: 'fin' },
];

const EDGES = [
  ['ops', 'cmd'], ['ops', 'core'], ['ops', 'com'],
  ['com', 'core'], ['com', 'hub'],
  ['cmd', 'mkt'], ['cmd', 'core'],
  ['core', 'mkt'], ['core', 'fin'], ['core', 'hub'],
  ['hub', 'fin'], ['mkt', 'fin']
];

const AGENT_DEFS = [
  { id: 'manager',    name: 'M', accent: '#3b82f6' },
  { id: 'admin',      name: 'A', accent: '#a855f7' },
  { id: 'finance',    name: 'F', accent: '#22c55e' },
  { id: 'marketing',  name: 'M', accent: '#ef4444' },
  { id: 'frontliner', name: 'F', accent: '#eab308' },
];

const CANVAS_H = 320;

function toPixel(ratio: number, dim: number) { return ratio * dim; }

interface Props { activeAgents?: string[] }

export default function WalkingCanvas({ activeAgents = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(800);
  const agentsRef = useRef<WalkingAgent[]>([]);
  const frameRef = useRef<number>(0);
  const { play } = useAgentAudio();
  const lastFootstepRef = useRef(0);
  const [, forceRender] = React.useReducer(x => x + 1, 0);

  const getNodes = useCallback(() =>
    NODE_RATIOS.map(n => ({ ...n, x: toPixel(n.rx, cw), y: toPixel(n.ry, CANVAS_H) })),
    [cw]
  );

  useEffect(() => {
    const nodes = getNodes();
    agentsRef.current = AGENT_DEFS.map((def, i) => {
      const node = nodes[i % nodes.length];
      const tgt  = nodes[(i + 2) % nodes.length];
      return {
        ...def, 
        x: node.x, y: node.y,
        targetX: tgt.x, targetY: tgt.y,
        speed: 0.6 + Math.random() * 0.4,
        trail: [],
        isWorking: false,
        pauseUntil: 0,
        thought: '',
      };
    });
  }, [getNodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setCw(entries[0].contentRect.width || 800);
    });
    obs.observe(el);
    setCw(el.getBoundingClientRect().width || 800);
    return () => obs.disconnect();
  }, []);

  const tick = useCallback(() => {
    const nodes = getNodes();
    const now = Date.now();

    agentsRef.current = agentsRef.current.map(agent => {
      const isAgentActive = activeAgents.includes(agent.id);
      
      if (now < (agent.pauseUntil || 0)) {
        return { ...agent, isWorking: isAgentActive };
      }

      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        const currentNode = nodes.find(n => n.x === agent.targetX && n.y === agent.targetY) || nodes[0];
        const connectedIds = EDGES.filter(e => e.includes(currentNode.id)).map(e => e[0] === currentNode.id ? e[1] : e[0]);
        const nextNodeId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
        const next = nodes.find(n => n.id === nextNodeId) || nodes[0];

        return {
          ...agent,
          x: agent.targetX, y: agent.targetY,
          targetX: next.x, targetY: next.y,
          trail: [],
          isWorking: isAgentActive,
          pauseUntil: now + 2000 + Math.random() * 3000,
          thought: ['Processing...', 'Analyzing...', 'Syncing...', 'Optimizing...'][Math.floor(Math.random() * 4)],
        };
      }

      if (isAgentActive && now - lastFootstepRef.current > 800) {
        lastFootstepRef.current = now;
      }

      const currentSpeed = agent.speed * (isAgentActive ? 1.5 : 0.8);

      return {
        ...agent,
        x: agent.x + (dx / dist) * currentSpeed,
        y: agent.y + (dy / dist) * currentSpeed,
        trail: [...agent.trail, { x: agent.x, y: agent.y }].slice(-15),
        isWorking: isAgentActive,
      };
    });

    forceRender();
    frameRef.current = requestAnimationFrame(tick);
  }, [getNodes, activeAgents, play]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [tick]);

  const nodes = getNodes();
  const agents = agentsRef.current;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: CANVAS_H,
        borderRadius: 24, border: '1px solid rgba(99,102,241,0.15)',
        background: 'linear-gradient(135deg, #0B101E 0%, #111827 100%)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* ── Background Grid ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <style>
        {`
          @keyframes dash-flow {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
        `}
      </style>

      {/* ── SVG Layer ── */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Network Paths */}
        {EDGES.map((edge, i) => {
          const a = nodes.find(n => n.id === edge[0]);
          const b = nodes.find(n => n.id === edge[1]);
          if (!a || !b) return null;
          
          return (
            <g key={`edge-${i}`}>
              {/* Subtle Wide Track */}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.02)" strokeWidth={3} strokeLinecap="round" />
              {/* Core Thin Line */}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(129,140,248,0.15)" strokeWidth={1} />
              {/* Flowing Energy Pulses */}
              <line 
                x1={a.x} y1={a.y} x2={b.x} y2={b.y} 
                stroke="rgba(165,180,252,0.4)" 
                strokeWidth={1} 
                strokeDasharray="4 30" 
                style={{ animation: 'dash-flow 10s linear infinite' }} 
              />
            </g>
          );
        })}

        {/* Agent Trails */}
        {agents.map(agent => (
          <g key={`trail-${agent.id}`}>
            {agent.trail.length > 2 && (
              <polyline
                points={agent.trail.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={agent.accent}
                strokeWidth={agent.isWorking ? "3" : "2"}
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}
          </g>
        ))}
      </svg>

      {/* ── Nodes ── */}
      {nodes.map(node => {
        const isCore = node.id === 'core';
        const workingAgents = agents.filter(a => Date.now() < (a.pauseUntil || 0) && Math.abs(a.x - node.x) < 5 && Math.abs(a.y - node.y) < 5);
        const isBusy = workingAgents.length > 0;
        
        return (
          <div
            key={node.id}
            style={{
              position: 'absolute', left: node.x, top: node.y,
              transform: 'translate(-50%, -50%)',
              width: isCore ? 44 : 36, height: isCore ? 44 : 36,
              borderRadius: '50%',
              background: isCore ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(49,46,129,0.5))' : 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,1))',
              border: `1px solid ${isCore ? 'rgba(129,140,248,0.5)' : (isBusy ? workingAgents[0].accent : 'rgba(255,255,255,0.15)')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isBusy ? `0 0 15px ${workingAgents[0].accent}` : (isCore ? '0 0 20px rgba(99,102,241,0.3)' : '0 4px 10px rgba(0,0,0,0.5)'),
              zIndex: 5,
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
          >
            {/* Tech Floor Grid Overlay */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '4px 4px', pointerEvents: 'none' }} />
            {isBusy && (
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: `1px dashed ${workingAgents[0].accent}`, opacity: 0.8
                }}
              />
            )}
            {isCore && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                style={{
                  position: 'absolute', width: 60, height: 60, borderRadius: '50%',
                  border: '1px dashed rgba(129,140,248,0.3)'
                }}
              />
            )}
            <span style={{ 
              fontSize: 9, fontWeight: 700, 
              color: isCore ? '#c7d2fe' : 'rgba(255,255,255,0.6)',
              letterSpacing: 1, zIndex: 2, marginTop: -6
            }}>
              {node.label}
            </span>

            {/* Tiny Desk Area inside the room */}
            <div style={{ position: 'absolute', bottom: isCore ? 6 : 3, display: 'flex', alignItems: 'flex-end', gap: 2, zIndex: 1, opacity: isBusy ? 1 : 0.4 }}>
              {/* Plant (only on core) */}
              {isCore && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 4, height: 4, background: '#10b981', borderRadius: '50%', marginBottom: -1 }} />
                  <div style={{ width: 4, height: 3, background: '#78350f', borderRadius: 1 }} />
                </div>
              )}
              {/* Laptop */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 8, height: 5, background: isBusy ? '#38bdf8' : 'rgba(255,255,255,0.2)', borderRadius: '1px 1px 0 0', boxShadow: isBusy ? '0 0 6px #38bdf8' : 'none' }} />
                <div style={{ width: 12, height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              </div>
              {/* Coffee Mug */}
              <div style={{ width: 3, height: 4, background: '#ef4444', borderRadius: 1, borderTop: '1px solid rgba(255,255,255,0.4)' }} />
            </div>
          </div>
        );
      })}

      {/* ── Agents ── */}
      {agents.map(agent => {
        const isFlipped = agent.targetX < agent.x;
        const isWalking = Date.now() >= (agent.pauseUntil || 0);
        
        return (
          <div
            key={agent.id}
            onClick={() => {
              const agentToUpdate = agentsRef.current.find(a => a.id === agent.id);
              if (agentToUpdate) {
                agentToUpdate.pauseUntil = Date.now() + 6000;
                const sassyLines = ["Apa liat-liat?", "Kerja woy, jangan di-klik!", "Lagi sibuk nih bos!", "Halo bos besar!", "Gaji naik kapan nih?", "Hadeh, di-klik lagi..."];
                agentToUpdate.thought = sassyLines[Math.floor(Math.random() * sassyLines.length)];
                play('agentActivate');
              }
            }}
            style={{
              position: 'absolute', left: 0, top: 0,
              transform: `translate3d(${agent.x}px, ${agent.y}px, 0) translate(-50%, -50%)`,
              zIndex: 10, pointerEvents: 'auto', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              willChange: 'transform'
            }}
          >
            {/* Working Aura */}
            {agent.isWorking && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute', width: 40, height: 40, borderRadius: '50%',
                  background: `radial-gradient(circle, ${agent.accent} 0%, transparent 70%)`,
                  zIndex: 0
                }}
              />
            )}

            {/* Walking Person (Meeple) */}
            <motion.div
              animate={{ y: isWalking ? [0, -3, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
                filter: `drop-shadow(0 0 10px ${agent.accent})`,
                zIndex: 1
              }}
            >
              {/* Head with Initial */}
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: agent.accent, marginBottom: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 'bold', zIndex: 3 }}>
                {agent.name}
              </div>
              
              {/* Body (Uniform) and Arms */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
                {/* Back Arm (Swings opposite) */}
                <motion.div animate={{ rotate: isWalking ? [20, -20, 20] : 0, transformOrigin: 'top center' }} transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }} style={{ position: 'absolute', top: 2, left: -3, width: 4, height: 9, background: agent.accent, borderRadius: 2, filter: 'brightness(0.7)', zIndex: -1 }} />

                {/* Uniform Body */}
                <div style={{ width: 14, height: 12, borderRadius: '5px 5px 3px 3px', background: '#1e293b', border: `1px solid ${agent.accent}`, position: 'relative', overflow: 'hidden' }}>
                  {/* Tie / ID Badge */}
                  <div style={{ position: 'absolute', top: 0, left: 6, width: 2, height: 5, background: agent.accent }} />
                </div>

                {/* Front Arm (Swings forward) */}
                <motion.div animate={{ rotate: isWalking ? [-20, 20, -20] : 0, transformOrigin: 'top center' }} transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }} style={{ position: 'absolute', top: 2, right: -3, width: 4, height: 9, background: agent.accent, borderRadius: 2, zIndex: 2 }} />
              </div>
              
              {/* Animated Legs (Pants) */}
              <div style={{ display: 'flex', gap: 2, marginTop: -1, zIndex: 1 }}>
                <motion.div animate={{ y: isWalking ? [0, -4, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.3 }} style={{ width: 5, height: 7, background: '#0f172a', border: `1px solid ${agent.accent}`, borderRadius: 2 }} />
                <motion.div animate={{ y: isWalking ? [-4, 0, -4] : 0 }} transition={{ repeat: Infinity, duration: 0.3 }} style={{ width: 5, height: 7, background: '#0f172a', border: `1px solid ${agent.accent}`, borderRadius: 2 }} />
              </div>
              
              {/* Thought Bubble */}
              {!isWalking && agent.thought && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', top: -30,
                    background: 'rgba(255,255,255,0.95)',
                    padding: '3px 6px', borderRadius: 10,
                    fontSize: 8, fontWeight: 800, color: '#1e293b',
                    whiteSpace: 'nowrap', zIndex: 20,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {agent.thought}
                  {/* Bubble Tail */}
                  <div style={{
                    position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent',
                    borderTop: '3px solid rgba(255,255,255,0.95)'
                  }} />
                </motion.div>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
