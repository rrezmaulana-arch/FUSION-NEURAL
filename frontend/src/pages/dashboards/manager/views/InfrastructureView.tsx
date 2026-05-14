/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, HardDrive, Cpu, Server, Trophy, TrendingUp, Activity, Crosshair, Bot } from 'lucide-react';
import { useManagerStore } from '../../../../stores/useManagerStore';
import { db } from '../../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const SERVERS = [
  { name: 'Groq (Brain)', icon: Cpu, color: '#0ea5e9', quota: '500K tokens/day' },
  { name: 'Gemini (Vision)', icon: Crosshair, color: '#10b981', quota: '1M tokens/day' },
  { name: 'HuggingFace (Image)', icon: HardDrive, color: '#f43f5e', quota: '1K credits/day' },
  { name: 'Firebase (Core)', icon: Database, color: '#f59e0b', quota: 'Unlimited' },
];

const RANK_COLOR: Record<string, string> = {
  Trainee: '#94a3b8', Junior: '#10b981', Senior: '#3b82f6',
  Veteran: '#8b5cf6', Grandmaster: '#f59e0b', Overlord: '#ef4444',
};

interface AgentHealth {
  agent_id: string;
  status: string;
  total_tasks_completed: number;
  average_latency_ms: number;
  rank: string;
  exp_percent: number;
}

export default function InfrastructureView() {
  const { companyBudget, globalBattery, drainBattery } = useManagerStore();
  const [agentHealth, setAgentHealth] = useState<AgentHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const getBatteryColor = () => globalBattery < 20 ? '#ef4444' : '#0ea5e9';

  // ── Fetch RPG progress dari backend ──────────────────────────────────────────
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
    fetch(`${backendUrl}/api/agent/progress`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
      .then(r => r.json())
      .then(data => setAgentHealth(data.agents || []))
      .catch(() => { }) // silent fail — fallback ke data kosong
      .finally(() => setLoading(false));
  }, []);

  // ── Firebase realtime: update status agen saat ada perubahan ──────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'agent_health'), () => {
      const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      fetch(`${backendUrl}/api/agent/progress`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(r => r.json()).then(d => setAgentHealth(d.agents || [])).catch(() => { });
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div
      key="infra"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="ao-card"
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: 32,
        overflow: 'hidden',
      }}
    >
      {/* ── Cyber Grid Background ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* ── Scanline Effect ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 4px, 3px 100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.5
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header HUD ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, borderBottom: '1px solid rgba(14, 165, 233, 0.3)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ color: '#0ea5e9', filter: 'drop-shadow(0 0 8px #0ea5e9)' }}
            >
              <Server size={32} />
            </motion.div>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#e0f2fe', margin: 0, letterSpacing: 2, textShadow: '0 0 10px rgba(14, 165, 233, 0.5)' }}>
                INFRASTRUCTURE DECK
              </h2>
              <span style={{ fontSize: 12, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: 3 }}>
                SYSTEM CONTROL & TELEMETRY
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '4px 20px 4px 20px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Activity size={16} color="#10b981" />
            </motion.div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: 1, fontFamily: 'monospace' }}>SYSTEM NOMINAL</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* ── Server Room (Hardware Nodes) ── */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.6)', padding: 24,
            borderRadius: 20,
            border: '1px solid rgba(14, 165, 233, 0.2)', backdropFilter: 'blur(10px)',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#7dd3fc', marginBottom: 20, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <HardDrive size={16} /> Hardware Nodes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SERVERS.map((s, i) => (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={s.name}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.4) 100%)',
                    padding: '14px 20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 8, background: `${s.color}20`, borderRadius: 8, boxShadow: `0 0 10px ${s.color}40` }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', letterSpacing: 1 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{s.quota}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: 1 }}>ONLINE</span>
                    <motion.div
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: Math.random() * 1 + 1 }}
                      style={{ width: 6, height: 6, background: '#10b981', boxShadow: '0 0 8px #10b981', transform: 'rotate(45deg)' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Energy Core (Battery Room) ── */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.6)', padding: 24,
            borderRadius: 20,
            border: '1px solid rgba(245, 158, 11, 0.2)', backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fcd34d', marginBottom: 24, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <Zap size={16} /> Reactor Core
            </h3>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <div style={{
                background: 'rgba(0,0,0,0.5)', padding: '20px 40px', borderRadius: 12,
                border: '1px solid rgba(16,185,129,0.3)', boxShadow: 'inset 0 0 20px rgba(16,185,129,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 8 }}>CAPITAL RESERVES</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.6)', fontFamily: 'monospace' }}>
                  Rp {companyBudget.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 10 }}>
                <span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>NEURAL ENERGY SHIELD</span>
                <span style={{ color: getBatteryColor(), textShadow: `0 0 10px ${getBatteryColor()}80` }}>{globalBattery.toFixed(1)}%</span>
              </div>

              {/* Segmented Energy Bar */}
              <div style={{ display: 'flex', gap: 4, height: 24, background: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
                {[...Array(20)].map((_, i) => {
                  const threshold = i * 5;
                  const isActive = globalBattery > threshold;
                  const color = isActive ? getBatteryColor() : 'transparent';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{
                        flex: 1,
                        background: color,
                        boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                        border: isActive ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        transform: 'skewX(-15deg)'
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => drainBattery(10)}
              style={{
                width: '100%', padding: '14px', background: 'rgba(239,68,68,0.1)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.4)', fontFamily: 'monospace', fontSize: 13,
                fontWeight: 800, letterSpacing: 2, cursor: 'pointer',
                borderRadius: 12
              }}
            >
              [ INITIATE DRAIN TEST ]
            </motion.button>
          </div>
        </div>

        {/* ── RPG Agent Progress (Units Status) ── */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={18} color="#f59e0b" /> NEURAL UNITS DATASTREAM
            </h3>
            {loading && (
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity }} style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: 2 }}>
                [ SYNCING... ]
              </motion.div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            <AnimatePresence>
              {(agentHealth.length > 0 ? agentHealth : [
                { agent_id: 'manager', rank: 'Veteran', total_tasks_completed: 0, exp_percent: 0, average_latency_ms: 0, status: 'IDLE' },
              ]).map((a, i) => {
                const rankColor = RANK_COLOR[a.rank] || '#94a3b8';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={a.agent_id}
                    style={{
                      background: `linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.9) 100%)`,
                      padding: 20,
                      borderRadius: 20,
                      border: `1px solid ${rankColor}40`,
                      boxShadow: `inset 0 0 20px ${rankColor}10, 0 5px 15px rgba(0,0,0,0.5)`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 10, background: `${rankColor}20`, borderRadius: '50%', border: `1px solid ${rankColor}40`, boxShadow: `0 0 10px ${rankColor}40` }}>
                          <Bot size={24} color={rankColor} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: rankColor, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>UNIT_ID</div>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: 1, textShadow: `0 0 10px ${rankColor}60` }}>
                            {a.agent_id}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>CLASS</div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#020617', background: rankColor, padding: '4px 10px', borderRadius: 8 }}>
                          {a.rank}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 }}>TASKS</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#e0f2fe' }}>{a.total_tasks_completed}</div>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 }}>LATENCY</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#e0f2fe' }}>{a.average_latency_ms}<span style={{ fontSize: 10, color: '#64748b' }}>ms</span></div>
                      </div>
                    </div>

                    {/* Cyber EXP bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8, fontFamily: 'monospace' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: rankColor }}>
                          <TrendingUp size={12} /> NEXT LEVEL
                        </span>
                        <span style={{ color: '#f8fafc' }}>{a.exp_percent}%</span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: '#020617', border: `1px solid ${rankColor}30`, position: 'relative' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${a.exp_percent}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${rankColor})`,
                            boxShadow: `0 0 15px ${rankColor}80`
                          }}
                        />
                        {/* Glow tip */}
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          style={{
                            position: 'absolute', top: 0, bottom: 0, left: `calc(${a.exp_percent}% - 2px)`,
                            width: 4, background: '#fff', boxShadow: `0 0 10px #fff`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

