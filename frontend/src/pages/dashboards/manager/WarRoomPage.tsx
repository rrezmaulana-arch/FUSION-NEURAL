/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Crosshair, Activity, AlertTriangle, Shield, CheckCircle2, Zap } from 'lucide-react';

import { triggerAgent } from '../../../services/apiClient';

const CRISIS_SCENARIOS = [
  { id: 'supplier_hike', label: 'Harga Bahan Baku Naik 25%', desc: 'Supplier mendadak menaikkan harga. Margin menipis.' },
  { id: 'traffic_drop', label: 'Trafik Web Turun 50%', desc: 'Algoritma platform berubah, kunjungan toko anjlok.' },
  { id: 'competitor_surge', label: 'Kompetitor Bakar Uang', desc: 'Pesaing utama melakukan diskon 70% besar-besaran.' }
];

export default function WarRoomPage() {
  const [activeCrisis, setActiveCrisis] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: number, sender: string, message: string }[]>([]);
  const [metrics, setMetrics] = useState({ revenue: 250000000, margin: 35, burnRate: 45 });

  const triggerCrisis = async (scenarioId: string) => {
    setActiveCrisis(scenarioId);
    setLogs([]);
    
    // Simulate initial shock
    if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 15, burnRate: 65 });
    if (scenarioId === 'traffic_drop') setMetrics({ revenue: 120000000, margin: 35, burnRate: 80 });
    if (scenarioId === 'competitor_surge') setMetrics({ revenue: 150000000, margin: 20, burnRate: 70 });

    const scenarioData = CRISIS_SCENARIOS.find(s => s.id === scenarioId);
    
    setLogs([{ id: Date.now(), sender: 'SYSTEM', message: `⚠️ ALERT: ${scenarioData?.label}. Memulai protokol mitigasi AI nyata.` }]);

    try {
      // Step 1: Manager AI Analysis
      setLogs(prev => [...prev, { id: Date.now() + 1, sender: 'Manager AI', message: 'Menganalisis dampak krisis via FUSION NEURAL Backend...' }]);
      const mgrRes = await triggerAgent({ agent: 'Manager', message: `Krisis terjadi: ${scenarioData?.label} - ${scenarioData?.desc}. Berikan 1 kalimat instruksi singkat untuk mitigasi ke Finance dan Marketing.` });
      setLogs(prev => [...prev, { id: Date.now() + 2, sender: 'Manager AI', message: mgrRes.result }]);

      // Step 2: Finance AI response
      setLogs(prev => [...prev, { id: Date.now() + 3, sender: 'Finance AI', message: 'Mengkalkulasi ulang margin dan burn rate...' }]);
      const finRes = await triggerAgent({ agent: 'Finance', message: `Manajer berkata: ${mgrRes.result}. Bagaimana penyesuaian budget kita? Jawab dalam 1 kalimat singkat.` });
      setLogs(prev => [...prev, { id: Date.now() + 4, sender: 'Finance AI', message: finRes.result }]);

      // Step 3: Marketing AI response
      setLogs(prev => [...prev, { id: Date.now() + 5, sender: 'Marketing AI', message: 'Menyesuaikan kampanye berdasarkan budget baru...' }]);
      const mktRes = await triggerAgent({ agent: 'Marketing', message: `Instruksi manajer: ${mgrRes.result}. Finance berkata: ${finRes.result}. Apa aksi marketingmu? Jawab 1 kalimat.` });
      setLogs(prev => [...prev, { id: Date.now() + 6, sender: 'Marketing AI', message: mktRes.result }]);

      setLogs(prev => [...prev, { id: Date.now() + 7, sender: 'SYSTEM', message: '✅ Mitigasi aktif. Proyeksi stabil dalam 7 hari.' }]);

      // Recovery simulation
      if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 28, burnRate: 50 });
      if (scenarioId === 'traffic_drop') setMetrics({ revenue: 200000000, margin: 35, burnRate: 55 });
      if (scenarioId === 'competitor_surge') setMetrics({ revenue: 220000000, margin: 30, burnRate: 50 });

    } catch (error: any) {
      setLogs(prev => [...prev, { id: Date.now() + 8, sender: 'SYSTEM', message: `Koneksi Backend Gagal: ${error.message}. Menggunakan Fallback Protokol.` }]);
      
      // Fallback
      setTimeout(() => setLogs(prev => [...prev, { id: Date.now() + 9, sender: 'Finance AI', message: 'Mitigasi fallback diaktifkan. Margin aman.' }]), 2000);
      if (scenarioId === 'supplier_hike') setMetrics({ revenue: 250000000, margin: 28, burnRate: 50 });
      if (scenarioId === 'traffic_drop') setMetrics({ revenue: 200000000, margin: 35, burnRate: 55 });
      if (scenarioId === 'competitor_surge') setMetrics({ revenue: 220000000, margin: 30, burnRate: 50 });
    }
  };

  return (
    <div className="space-y-6 pb-10" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Game Style Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(15,23,42,0.8) 100%)',
        borderRadius: 24, padding: '32px 40px', position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(225,29,72,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: '#e11d48', filter: 'blur(80px)', opacity: 0.2 }} />
        
        <div className="flex items-center gap-6 relative z-10">
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(225,29,72,0.2)', border: '2px solid rgba(225,29,72,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(225,29,72,0.3)' }}>
            <ShieldAlert size={32} color="#fb7185" />
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 0 15px rgba(225,29,72,0.5)', letterSpacing: 1 }}>CRISIS SIMULATOR</h1>
            <p style={{ fontSize: 13, color: '#fca5a5', fontFamily: 'monospace', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>
              Autonomous Mitigation Protocol Active
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#fb7185', letterSpacing: 2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <Crosshair size={16} /> Mission Select
            </h3>
            <div className="space-y-3">
              {CRISIS_SCENARIOS.map(s => (
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  key={s.id}
                  onClick={() => triggerCrisis(s.id)}
                  disabled={activeCrisis !== null && logs.length < 6}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: 16,
                    background: activeCrisis === s.id ? 'linear-gradient(90deg, rgba(225,29,72,0.2) 0%, rgba(225,29,72,0.05) 100%)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${activeCrisis === s.id ? 'rgba(225,29,72,0.5)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: activeCrisis === s.id ? '0 0 20px rgba(225,29,72,0.2)' : 'none',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {activeCrisis === s.id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#fb7185', boxShadow: '0 0 10px #fb7185' }} />}
                  <p style={{ fontSize: 14, fontWeight: 800, color: activeCrisis === s.id ? '#fff' : '#cbd5e1' }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{s.desc}</p>
                </motion.button>
              ))}
            </div>
            
            {activeCrisis && logs.length === 6 && (
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveCrisis(null); setLogs([]); setMetrics({ revenue: 250000000, margin: 35, burnRate: 45 }); }}
                style={{
                  width: '100%', marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8', fontSize: 12, fontWeight: 800, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                  letterSpacing: 1, textTransform: 'uppercase'
                }}
              >
                Reset Simulation
              </motion.button>
            )}
          </div>

          {/* Live Metrics (HP Bars) */}
          <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#34d399', letterSpacing: 2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <Activity size={16} /> Base Status
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Revenue HP', val: `Rp ${(metrics.revenue/1000000).toFixed(0)}M`, perc: (metrics.revenue / 300000000) * 100, color: '#34d399' },
                { label: 'Margin Shield', val: `${metrics.margin}%`, perc: metrics.margin, color: metrics.margin < 25 ? '#fb7185' : '#3b82f6' },
                { label: 'Burn Rate Heat', val: `${metrics.burnRate}%`, perc: metrics.burnRate, color: metrics.burnRate > 60 ? '#fb7185' : '#fbbf24' }
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 8, fontFamily: 'monospace' }}>
                    <span>{m.label}</span>
                    <span style={{ color: m.color, textShadow: `0 0 10px ${m.color}80` }}>{m.val}</span>
                  </div>
                  {/* Fragmented HP Bar */}
                  <div style={{ display: 'flex', gap: 3, height: 14, background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[...Array(15)].map((_, i) => {
                      const threshold = (i / 15) * 100;
                      const isActive = m.perc > threshold;
                      return (
                        <motion.div 
                          key={i}
                          animate={{ opacity: isActive ? 1 : 0.2 }}
                          style={{ 
                            flex: 1, background: isActive ? m.color : 'transparent', 
                            borderRadius: 2, boxShadow: isActive ? `0 0 8px ${m.color}60` : 'none',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)'
                          }} 
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Action Log */}
        <div className="lg:col-span-2">
          <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.05)', minHeight: 500, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#818cf8', letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <Shield size={16} /> Tactical Comms Log
            </h3>
            
            <div className="flex-1 space-y-6 relative z-10" style={{ overflowY: 'auto', paddingRight: 10 }}>
              {!activeCrisis ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                  <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>SELECT MISSION TO COMMENCE SIMULATION</p>
                </div>
              ) : (
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: 16 }}>
                      {/* Avatar */}
                      <div style={{ 
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: log.sender === 'SYSTEM' ? '#e11d48' : '#4f46e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900, color: '#fff', boxShadow: `0 8px 16px ${log.sender === 'SYSTEM' ? 'rgba(225,29,72,0.4)' : 'rgba(79,70,229,0.4)'}`,
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}>
                        {log.sender.substring(0, 3)}
                      </div>
                      
                      {/* Message Bubble */}
                      <div style={{ 
                        flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '0 20px 20px 20px', 
                        padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)' 
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: log.sender === 'SYSTEM' ? '#fb7185' : '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                          {log.sender}
                        </div>
                        <p style={{ 
                          fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                          color: log.message.includes('ALERT') ? '#fb7185' : log.message.includes('stabil') || log.message.includes('✅') ? '#34d399' : '#e2e8f0' 
                        }}>
                          {log.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {logs.length > 5 && logs.some(l => l.message.includes('stabil')) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 32, background: 'linear-gradient(90deg, rgba(16,185,129,0.15) 0%, transparent 100%)', padding: 24, borderRadius: 20, borderLeft: '4px solid #10b981', display: 'flex', gap: 16 }}>
                      <CheckCircle2 size={32} color="#34d399" />
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: '#34d399', margin: 0, textShadow: '0 0 10px rgba(52,211,153,0.5)' }}>MISSION ACCOMPLISHED</h4>
                        <p style={{ fontSize: 12, color: '#a7f3d0', marginTop: 4, fontWeight: 600 }}>Autonomous agents successfully mitigated the crisis using live LLM reasoning.</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {logs.length > 0 && logs.length <= 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: 'rgba(79,70,229,0.1)', borderRadius: 100, border: '1px solid rgba(79,70,229,0.2)', width: 'fit-content' }}>
                      <Zap size={16} color="#818cf8" style={{ animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', letterSpacing: 1 }}>AWAITING AI RESPONSE...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
