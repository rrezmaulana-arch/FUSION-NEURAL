import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, Briefcase, Shield, Megaphone, Calculator, MessageSquare, Activity, ArrowLeft, Cpu, Terminal, Zap, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

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
.ao-wrap { font-family: 'Outfit', sans-serif; background: transparent; min-height: 100vh; color: #e2e8f0; margin: -24px; padding: 0; }
.ao-bg { background: transparent; }
.ao-scroll::-webkit-scrollbar { width: 5px; } .ao-scroll::-webkit-scrollbar-track { background: transparent; } .ao-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 4px; }
.ao-card { background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); transition: all 0.25s cubic-bezier(.4,0,.2,1); }
.ao-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-2px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.ao-mono { font-family: 'JetBrains Mono', monospace; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`;

function timeAgo(ts: any) {
  if (!ts?.toDate) return '—';
  const s = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}
function isRecent(ts: any) {
  if (!ts?.toDate) return false;
  return (Date.now() - ts.toDate().getTime()) / 1000 < 30;
}

/* ── Agent Pill ── */
function AgentPill({ agent, accent, active }: { agent: typeof ROOMS[0]['agents'][0], accent: string, active: boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background: active ? `${accent}12` : 'rgba(0,0,0,0.3)', border:`1px solid ${active ? accent+'40' : 'rgba(255,255,255,0.06)'}`, transition:'all 0.2s' }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background: active ? accent : '#334155', boxShadow: active ? `0 0 8px ${accent}` : 'none', flexShrink:0, animation: active ? 'blink 1.5s infinite' : 'none' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{agent.name}</div>
        <div className="ao-mono" style={{ fontSize:10, color:'#64748b', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{agent.model}</div>
      </div>
      <div style={{ fontSize:9, fontWeight:700, color: active ? accent : '#475569', letterSpacing:'0.5px', flexShrink:0, background: active ? `${accent}20` : 'rgba(255,255,255,0.04)', padding:'3px 7px', borderRadius:5 }}>
        {active ? 'ON' : 'IDLE'}
      </div>
    </div>
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
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, alignItems:'start' }}>
        {/* Agents */}
        <div className="ao-card" style={{ borderRadius:16, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'1.5px', marginBottom:14 }}>AI NODES — {room.agents.length}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {room.agents.map(a => <AgentPill key={a.id} agent={a} accent={room.accent} active={active} />)}
          </div>
          {/* Stats row */}
          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:16 }}>
            {[
              { icon: Activity, label:'Events', val: roomLogs.length },
              { icon: Clock, label:'Last Active', val: roomLogs[0] ? timeAgo(roomLogs[0].timestamp) : '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:'1px', display:'flex', alignItems:'center', gap:5, marginBottom:4 }}><Icon size={10} color='#475569'/>{label}</div>
                <div className="ao-mono" style={{ fontSize:14, fontWeight:700, color:'#f1f5f9' }}>{val}</div>
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
      <div style={{ display:'flex', gap:16, marginBottom:28 }}>
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
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
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="ao-card" style={{ borderRadius:16, overflow:'hidden', marginTop:24 }}>
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

  const toggleAutonomous = async () => {
    const newState = !isAutonomous;
    setIsAutonomous(newState);
    try {
      // Endpoint is accessible via the Vite proxy or directly if mapped
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || 'fusion-neural-secret-key-2026';
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
    const q = query(collection(db, 'task_results'), orderBy('completedAt', 'desc'), limit(50));
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, agent: d.data().agent, details: d.data().task, timestamp: d.data().completedAt })));
    });
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
          {activeRoom ? (
            <RoomView key="room" room={activeRoom} logs={logs} onBack={() => setActiveRoomId(null)} />
          ) : (
            <motion.div key="main" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <MainView logs={logs} onSelectRoom={setActiveRoomId} />
              <GlobalLogs logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
