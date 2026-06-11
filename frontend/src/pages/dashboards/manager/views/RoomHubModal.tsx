/**
 * FUSION NEURAL — Room Hub Modal
 * Extracted from AgentOrchestratorPage.tsx for code splitting.
 * Manager-Only, Room-Context-Aware modal with Task Board, Inspector, Governance, Scheduler, Settings.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, ClipboardList, Wallet, CalendarDays, Plus, Trash2, X, Clock, Settings, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { db } from '../../../../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ROOMS } from '../orchestratorConfig';

const ROOM_ROLE_MAP: Record<string, string> = {
  admin: 'admin', finance: 'finance', marketing: 'marketing',
  manager: 'manager', frontliner: 'frontliner', core: 'core'
};

const ROOM_PROMPTS: Record<string, { prompt: string; tools: string[] }> = {
  admin: { prompt: "# IDENTITY\nYou are Neural Admin, Logistics Guardian.\nMaintain structural integrity of all operations.\n\n# CAPABILITIES\n- Manage inventory & orders\n- Sync supplier database\n- Enforce procurement SOP", tools: ['firestore_read', 'inventory_sync', 'supplier_api', 'error_logger'] },
  finance: { prompt: "# IDENTITY\nYou are Neural Finance, Tax & Profit Sentinel.\nOptimize costs and prevent zero-price anomalies.\n\n# CAPABILITIES\n- Audit invoices & bank recon\n- Calculate ROI & PPN 12%\n- Enforce budget locks", tools: ['firestore_sync', 'deepseek_reasoner', 'budget_lock', 'human_approval_gate'] },
  marketing: { prompt: "# IDENTITY\nYou are Neural Marketing, Ethical Persuader.\nMaximize campaign reach while adhering to UU ITE.\n\n# CAPABILITIES\n- Generate ad copy & visuals\n- Schedule IG/Tokopedia posts\n- Analyze ROAS performance", tools: ['groq_llm', 'flux_image', 'campaign_generator', 'slack_notify'] },
  manager: { prompt: "# IDENTITY\nYou are Neural Manager, the Grand Orchestrator.\nOversee ALL departments and delegate to agents.\n\n# CAPABILITIES\n- Full system override\n- Cross-department reports\n- Approve high-value actions", tools: ['agent_delegator', 'system_override', 'global_broadcast', 'ticket_manager'] },
  frontliner: { prompt: "# IDENTITY\nYou are Neural Frontliner, Customer Champion.\nDeliver lightning-fast, empathetic responses.\n\n# CAPABILITIES\n- Reply IG DMs & WhatsApp\n- Qualify sales leads\n- Escalate complex tickets", tools: ['groq_70b', 'cerebras_llm', 'crm_writer', 'lead_scorer'] },
  core: { prompt: "# IDENTITY\nYou are Neural Core, the Data Intelligence Layer.\nProvide real-time web intelligence to all agents.\n\n# CAPABILITIES\n- Live Google search via Serper\n- Trend detection\n- Competitor monitoring", tools: ['serper_search', 'trend_analyzer', 'competitor_api', 'data_cache'] },
};

export default function RoomHubModal({ room, hubTab, setHubTab, onClose }: {
  room: typeof ROOMS[0];
  hubTab: string;
  setHubTab: (t: any) => void;
  onClose: () => void;
}) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [typingText, setTypingText] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newSched, setNewSched] = useState('');
  const [schedTime, setSchedTime] = useState('');

  const promptData = ROOM_PROMPTS[room.id] || ROOM_PROMPTS['manager'];
  const [editablePrompt, setEditablePrompt] = useState(promptData.prompt);
  const [promptSaved, setPromptSaved] = useState(false);

  useEffect(() => {
    setTypingText('');
    let i = 0;
    const iv = setInterval(() => {
      if (i < promptData.prompt.length) { setTypingText(p => p + promptData.prompt[i]); i++; }
      else clearInterval(iv);
    }, 12);
    return () => clearInterval(iv);
  }, [room.id]);

  useEffect(() => {
    const role = ROOM_ROLE_MAP[room.id];
    const unsubs: any[] = [];

    const activeQ = room.id === 'manager'
      ? query(collection(db, 'neural_tasks'), where('status', 'in', ['To Do', 'In Progress', 'Review']))
      : query(collection(db, 'neural_tasks'), where('agent', '==', room.label), where('status', 'in', ['To Do', 'In Progress', 'Review']));
    const doneQ = room.id === 'manager'
      ? query(collection(db, 'neural_tasks'), where('status', '==', 'Done'), limit(50))
      : query(collection(db, 'neural_tasks'), where('agent', '==', room.label), where('status', '==', 'Done'), limit(50));

    let activeList: any[] = [];
    let doneList: any[] = [];
    unsubs.push(onSnapshot(activeQ, s => { activeList = s.docs.map(d => ({ id: d.id, ...d.data() })); setTickets([...activeList, ...doneList]); }));
    unsubs.push(onSnapshot(doneQ, s => { doneList = s.docs.map(d => ({ id: d.id, ...d.data() })); setTickets([...activeList, ...doneList]); }));

    const aq = room.id === 'manager' ? collection(db, 'pending_approvals') : query(collection(db, 'pending_approvals'), where('role', '==', role));
    unsubs.push(onSnapshot(aq, s => setApprovals(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    unsubs.push(onSnapshot(doc(db, 'agent_budgets', role), s => { if (s.exists()) setBudget({ id: s.id, ...s.data() }); }));

    const sq = room.id === 'manager' ? collection(db, 'agent_schedules') : query(collection(db, 'agent_schedules'), where('role', '==', role));
    unsubs.push(onSnapshot(sq, s => setSchedules(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    return () => unsubs.forEach(u => u());
  }, [room.id]);

  const addTicket = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'neural_tasks'), { title: newTask, role: ROOM_ROLE_MAP[room.id], agent: room.label, status: 'To Do', createdAt: new Date().toISOString(), companyId: "COMP-FUSION" });
    setNewTask('');
  };

  const addSchedule = async () => {
    if (!newSched.trim() || !schedTime.trim()) return;
    await addDoc(collection(db, 'agent_schedules'), { title: newSched, schedule: schedTime, role: ROOM_ROLE_MAP[room.id], agent: room.label, status: 'pending', createdAt: new Date().toISOString(), companyId: "COMP-FUSION" });
    setNewSched(''); setSchedTime('');
  };

  const handleApprove = async (id: string) => { await updateDoc(doc(db, 'pending_approvals', id), { status: 'Approved' }); };
  const handleReject = async (id: string) => { await updateDoc(doc(db, 'pending_approvals', id), { status: 'Rejected' }); };

  const tabs = [
    { id: 'board', label: 'Task Board', icon: ClipboardList },
    { id: 'inspector', label: 'Agent Intel', icon: Terminal },
    { id: 'gov', label: 'Governance', icon: Wallet },
    { id: 'sched', label: 'Scheduler', icon: CalendarDays },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statusColor: any = { 'To Do': '#6366f1', 'In Progress': '#f59e0b', 'Done': '#10b981', 'Review': '#8b5cf6' };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#060b18', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ padding: '14px 24px', background: '#0a1628', borderBottom: `1px solid ${room.accent}40`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${room.accent}20`, border: `1px solid ${room.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><room.icon size={20} color={room.accent} /></div>
        <div><div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{room.label}</div><div style={{ fontSize: 10, color: room.accent, fontFamily: 'monospace', letterSpacing: '1px' }}>{room.sublabel.toUpperCase()} · MANAGER COMMAND HUB</div></div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 24 }}>
          {tabs.map(t => (<button key={t.id} onClick={() => setHubTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid ${hubTab === t.id ? room.accent : 'transparent'}`, cursor: 'pointer', background: hubTab === t.id ? `${room.accent}20` : 'transparent', color: hubTab === t.id ? room.accent : '#64748b', transition: 'all 0.2s' }}>{t.label}</button>))}
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {hubTab === 'board' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTicket()} placeholder={`New task for ${room.label}...`} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${room.accent}40`, borderRadius: 10, padding: '10px 14px', color: '#f8fafc', fontSize: 13, outline: 'none' }} />
              <button onClick={addTicket} style={{ padding: '10px 20px', background: room.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {['To Do', 'In Progress', 'Review', 'Done'].map(col => (
                <div key={col} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: statusColor[col] || '#94a3b8', letterSpacing: '1px', marginBottom: 10 }}>{col.toUpperCase()} · {tickets.filter(t => t.status === col).length}</div>
                  {tickets.filter(t => t.status === col).length === 0 ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: 11 }}>Empty</div> : tickets.filter(t => t.status === col).map(t => (
                    <div key={t.id} style={{ background: '#0f172a', border: `1px solid ${room.accent}20`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}><div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{t.title}</div><div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{t.agent || room.label}</div></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {hubTab === 'inspector' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '1px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Terminal size={12} color={room.accent} /> SYSTEM_PROMPT.MD</div>
              <div style={{ background: '#020617', border: `1px solid ${room.accent}30`, borderRadius: 14, padding: 18, fontFamily: 'monospace', fontSize: 11, color: room.accent, height: 320, overflowY: 'auto', lineHeight: 1.7 }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{typingText}<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ display: 'inline-block', width: 7, height: 12, background: room.accent, marginLeft: 2 }} /></pre></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '1px', marginBottom: 10 }}>COGNITIVE TOOLS · {room.agents.length} AGENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {room.agents.map(a => (<div key={a.id} style={{ background: '#0f172a', border: `1px solid ${room.accent}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}><Cpu size={16} color={room.accent} /><div><div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{a.name}</div><div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{a.model}</div></div><div style={{ marginLeft: 'auto', fontSize: 9, background: `${room.accent}15`, border: `1px solid ${room.accent}30`, color: room.accent, padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>ACTIVE</div></div>))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {promptData.tools.map(tool => (<div key={tool} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px' }}><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{tool}</span><span style={{ fontSize: 9, color: '#10b981', fontWeight: 800, letterSpacing: '1px' }}>ENABLED</span></div>))}
              </div>
            </div>
          </div>
        )}

        {hubTab === 'gov' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${room.accent}30`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: room.accent, letterSpacing: '1px', marginBottom: 14 }}>MONTHLY BUDGET — SPEND TRACKER</div>
              {budget ? (<>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}><div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc' }}>Rp {(budget.currentSpend || 0).toLocaleString('id-ID')}</div><div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>/ Rp {(budget.monthlyBudget || 0).toLocaleString('id-ID')}</div></div>
                <div style={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={[{ day: 'W1', spend: Math.round((budget.currentSpend || 0) * 0.18) }, { day: 'W2', spend: Math.round((budget.currentSpend || 0) * 0.42) }, { day: 'W3', spend: Math.round((budget.currentSpend || 0) * 0.67) }, { day: 'W4', spend: Math.round((budget.currentSpend || 0) * 0.88) }, { day: 'Now', spend: budget.currentSpend || 0 }]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: `1px solid ${room.accent}40`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: room.accent }} formatter={(v: any) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Spend']} />
                      <Line type="monotone" dataKey="spend" stroke={room.accent} strokeWidth={2} dot={{ fill: room.accent, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 8 }}><span>{budget.monthlyBudget ? Math.round((budget.currentSpend / budget.monthlyBudget) * 100) : 0}% Used</span><span style={{ color: budget.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{budget.status || '—'}</span></div>
              </>) : <div style={{ color: '#334155', fontSize: 12, paddingTop: 20 }}>No budget data. Neural Engine will populate once active.</div>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '1px', marginBottom: 14 }}>PENDING APPROVALS · {approvals.filter(a => a.status === 'Pending').length}</div>
              {approvals.length === 0 ? <div style={{ color: '#334155', fontSize: 12, paddingTop: 20, textAlign: 'center' }}>No pending approvals. All clear.</div> : approvals.map(app => (
                <div key={app.id} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{app.actionType}</div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{app.description}</div>
                  {app.estimatedCost > 0 && <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8 }}>Est. Rp {app.estimatedCost.toLocaleString('id-ID')}</div>}
                  {app.status === 'Pending' ? (<div style={{ display: 'flex', gap: 8 }}><button onClick={() => handleApprove(app.id)} style={{ flex: 1, padding: '6px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Approve</button><button onClick={() => handleReject(app.id)} style={{ flex: 1, padding: '6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Reject</button></div>) : <div style={{ fontSize: 11, fontWeight: 700, color: app.status === 'Approved' ? '#10b981' : '#ef4444' }}>{app.status}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {hubTab === 'sched' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input value={newSched} onChange={e => setNewSched(e.target.value)} placeholder="Instruksi tugas..." style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: `1px solid ${room.accent}40`, borderRadius: 10, padding: '10px 14px', color: '#f8fafc', fontSize: 13, outline: 'none' }} />
              <input value={schedTime} onChange={e => setSchedTime(e.target.value)} placeholder="Jadwal (Senin 09:00)" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${room.accent}40`, borderRadius: 10, padding: '10px 14px', color: '#f8fafc', fontSize: 13, outline: 'none' }} />
              <button onClick={addSchedule} style={{ padding: '10px 20px', background: room.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}><Plus size={16} /></button>
            </div>
            {schedules.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}><CalendarDays size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><div style={{ fontSize: 13 }}>No scheduled tasks. Add SOP above.</div></div> : schedules.map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${room.accent}20`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Clock size={18} color={s.status === 'completed' ? '#10b981' : '#f59e0b'} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: s.status === 'completed' ? '#475569' : '#cbd5e1', textDecoration: s.status === 'completed' ? 'line-through' : 'none' }}>{s.title}</div><div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>📅 {s.schedule}</div></div>
                <button onClick={async () => { if (db) await updateDoc(doc(db, 'agent_schedules', s.id), { status: 'deleted' }); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {hubTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${room.accent}30`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: room.accent, letterSpacing: '1px' }}>AGENT SOP — SYSTEM PROMPT EDITOR</div>
                <div style={{ fontSize: 10, color: '#475569' }}>Changes apply on next agent invocation</div>
              </div>
              <textarea value={editablePrompt} onChange={e => { setEditablePrompt(e.target.value); setPromptSaved(false); }} rows={14} style={{ width: '100%', background: '#0a1628', border: `1px solid ${room.accent}30`, borderRadius: 10, padding: '14px 16px', color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button onClick={async () => { try { const { doc: fsDoc, setDoc } = await import('firebase/firestore'); await setDoc(fsDoc(db, 'system_prompts', room.id), { prompt: editablePrompt, role: room.id, updatedAt: new Date().toISOString(), updatedBy: 'Manager' }); setPromptSaved(true); } catch (e) { console.error(e); } }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: room.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}><Save size={14} /> Save SOP</button>
                {promptSaved && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Saved to Firebase</span>}
                <button onClick={() => { setEditablePrompt(promptData.prompt); setPromptSaved(false); }} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Reset Default</button>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: 14 }}>ACTIVE TOOL INTEGRATIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {promptData.tools.map(tool => (<div key={tool} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} /><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{tool}</span></div>))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
