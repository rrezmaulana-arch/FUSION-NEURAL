import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy, limit, updateDoc, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, Clock, MessageSquare, Paperclip, CheckCircle2,
  Plus, RefreshCw, Zap, Power, Terminal, ChevronRight, ChevronLeft, AlertTriangle,
  TrendingUp, Activity, Shield, X, Trash2, GripVertical
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { executeTask, validateTaskDomain } from '../../../services/TaskExecutor';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NeuralTask {
  id: string;
  title: string;
  client: string;
  agent: string;
  labels: string[];
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  dueDate: string;
  progress: number;
  comments: number;
  attachments: number;
  createdAt: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  agentResult?: string;
  reviewNote?: string;
}

interface Transcript {
  id: string;
  agentId: string;
  action: string;
  thoughtProcess: string;
  timestamp: string;
  status: string;
  provider?: string;
  latencyMs?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
  'Neural Admin':     '#a855f7',
  'Neural Finance':   '#10b981',
  'Neural Marketing': '#ec4899',
  'Neural Manager':   '#3b82f6',
};

const PRIORITY_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  high:     { label: 'HIGH',     color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  normal:   { label: 'NORMAL',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  low:      { label: 'LOW',      color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' },
};

const COL_CONFIG = {
  'To Do':      { color: '#3b82f6', glow: 'rgba(59,130,246,0.05)' },
  'In Progress':{ color: '#f59e0b', glow: 'rgba(245,158,11,0.05)' },
  'Review':     { color: '#a855f7', glow: 'rgba(168,85,247,0.05)' },
  'Done':       { color: '#10b981', glow: 'rgba(16,185,129,0.05)' },
} as const;

const PRIORITY_ORDER = { critical: 0, high: 1, normal: 2, low: 3 };

// ── Component ─────────────────────────────────────────────────────────────────
export default function NeuralTasksPage() {
  const [tasks, setTasks] = useState<NeuralTask[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [autonomousOn, setAutonomousOn] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'list'>('board');
  const [showFeed, setShowFeed] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', agent: 'Neural Admin', priority: 'normal' as 'critical'|'high'|'normal'|'low', labels: '' });
  const [isSaving, setIsSaving] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const user = auth?.currentUser;

  // ── Live Tasks ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'neural_tasks'));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as NeuralTask)));
    }, err => setErrorMsg('Gagal connect ke Neural Core'));
  }, []);

  // ── Live Transcripts ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'run_transcripts'), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, snap => {
      setTranscripts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transcript)));
      setTimeout(() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    });
  }, []);

  // ── Autonomous Mode Read ─────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'system_config'));
    return onSnapshot(q, snap => {
      snap.docs.forEach(d => {
        if (d.id === 'autonomous_mode') setAutonomousOn(d.data().value === 'ON');
      });
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleOrchestrate = async () => {
    if (!prompt.trim()) return;
    
    // Validasi domain bisnis sebelum lempar ke AI Orchestrator
    const validationError = validateTaskDomain(prompt);
    if (validationError) {
      setErrorMsg(validationError.split('\n')[0]);
      return;
    }

    setIsProcessing(true); setErrorMsg('');
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agent: user?.uid || 'Manager', aiModel: 'gemini-2.0-flash', targetColumn: 'To Do' })
      });
      if (!res.ok) throw new Error('AI Orchestrator unavailable');
      setPrompt('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally { setIsProcessing(false); }
  };

  const toggleAutonomous = async () => {
    const newMode = autonomousOn ? 'OFF' : 'ON';
    try {
      await fetch('/api/autonomous/toggle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newMode })
      });
    } catch {}
  };

  const moveTask = async (id: string, status: NeuralTask['status']) => {
    try {
      await updateDoc(doc(db, 'neural_tasks', id), { status });
      // Jika task dipindahkan ke "In Progress", jalankan eksekutor nyata
      if (status === 'In Progress') {
        const task = tasks.find(t => t.id === id);
        if (task) {
          executeTask({ ...task, status: 'In Progress' });
        }
      }
    } catch {}
  };

  // ── Auto-Loop Engine (Self-Driving Kanban) ───────────────────────────────────
  useEffect(() => {
    if (!autonomousOn) return;
    const interval = setInterval(() => {
      // Hanya eksekusi jika tidak ada task yang sedang 'In Progress'
      const inProgress = tasks.filter(t => t.status === 'In Progress');
      if (inProgress.length > 0) return;

      // Ambil task tertua di 'To Do' (karena disortir desc, ambil elemen terakhir)
      const todos = tasks.filter(t => t.status === 'To Do');
      if (todos.length > 0) {
        const oldestTodo = todos[todos.length - 1];
        console.log('[Auto-Loop Engine] Menggerakkan task:', oldestTodo.title);
        moveTask(oldestTodo.id, 'In Progress');
      }
    }, 15000); // 15 detik jeda

    return () => clearInterval(interval);
  }, [autonomousOn, tasks]);

  const deleteTask = async (id: string) => {
    if (!window.confirm('Hapus task ini?')) return;
    try { await deleteDoc(doc(db, 'neural_tasks', id)); } catch {}
  };

  const handleAddTask = async () => {
    if (!addForm.title.trim()) return;

    // Validasi domain bisnis untuk task manual
    const validationError = validateTaskDomain(addForm.title);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'neural_tasks'), {
        title: addForm.title.trim(),
        agent: addForm.agent,
        priority: addForm.priority,
        status: 'To Do',
        labels: addForm.labels ? addForm.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        progress: 0,
        comments: 0,
        attachments: 0,
        dueDate: '3d',
        createdAt: serverTimestamp(),
        client: user?.email || 'Manager',
      });
      setAddForm({ title: '', agent: 'Neural Admin', priority: 'normal', labels: '' });
      setShowAddModal(false);
    } catch(e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const columns = ['To Do', 'In Progress', 'Review', 'Done'] as const;
  const sortedTasks = (col: string) =>
    tasks.filter(t => t.status === col)
         .sort((a, b) => (PRIORITY_ORDER[a.priority || 'normal'] ?? 2) - (PRIORITY_ORDER[b.priority || 'normal'] ?? 2));

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === 'In Progress').length,
    review: tasks.filter(t => t.status === 'Review').length,
    done: tasks.filter(t => t.status === 'Done').length,
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen text-slate-300 font-sans tracking-wide overflow-x-hidden"
         style={{ background: '#090f19' }}>
      <div className="max-w-[1600px] mx-auto p-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Neural Tasks
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-full border border-indigo-500/20 uppercase tracking-widest">
                Live Sync
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Autonomous AI Kanban — Priority Queue · Peer Review · Memory</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            {[
              { icon: Activity, val: stats.total, label: 'Total', color: '#64748b' },
              { icon: Zap, val: stats.active, label: 'Active', color: '#f59e0b' },
              { icon: Shield, val: stats.review, label: 'Review', color: '#a855f7' },
              { icon: CheckCircle2, val: stats.done, label: 'Done', color: '#10b981' },
            ].map(({ icon: Icon, val, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/70 bg-slate-900/40">
                <Icon size={14} style={{ color }} />
                <span className="text-white font-bold text-sm">{val}</span>
                <span className="text-slate-500 text-xs">{label}</span>
              </div>
            ))}

            {/* Autonomous Toggle */}
            <button onClick={toggleAutonomous}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border"
              style={{
                background: autonomousOn ? 'rgba(16,185,129,0.05)' : 'rgba(100,116,139,0.1)',
                borderColor: autonomousOn ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.3)',
                color: autonomousOn ? '#10b981' : '#64748b',
              }}>
              <Power size={14} className={autonomousOn ? 'animate-pulse' : ''} />
              {autonomousOn ? 'AUTO: ON' : 'AUTO: OFF'}
            </button>

            {/* View toggle */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button onClick={() => setActiveTab('board')} className={`p-2 rounded-lg transition-all ${activeTab === 'board' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setActiveTab('list')}  className={`p-2 rounded-lg transition-all ${activeTab === 'list'  ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><List size={16} /></button>
            </div>

            {/* Feed toggle */}
            <button onClick={() => setShowFeed(!showFeed)}
              className={`p-2 rounded-xl border transition-all ${showFeed ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-500 hover:text-white'}`}>
              <Terminal size={16} />
            </button>
          </div>
        </div>

        {/* ── AI Command Input ── */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl hidden transition-all" />
          <div className="relative flex items-center bg-transparent border-b border-slate-700/60 pb-2">
            <div className="pl-2 pr-4 text-indigo-500">
              <RefreshCw size={18} className={isProcessing ? 'animate-spin' : ''} />
            </div>
            <input value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleOrchestrate()}
              disabled={isProcessing}
              placeholder="Ketik instruksi atau prompt Anda di sini..."
              className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-600 text-sm py-2 px-0 disabled:opacity-50" />
            <button onClick={handleOrchestrate} disabled={isProcessing || !prompt.trim()}
              className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {isProcessing ? 'PROCESSING...' : 'ORCHESTRATE'}
            </button>
          </div>
          {errorMsg && <p className="text-red-400 text-xs mt-2 ml-4">{errorMsg}</p>}
        </div>

        {/* ── Main content + Feed panel ── */}
        <div className={`flex gap-4 ${showFeed ? 'items-start' : ''}`}>

          {/* ── Board / List ── */}
          <div className="flex-1 min-w-0">

            {/* BOARD VIEW */}
            {activeTab === 'board' && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map(col => {
                  const cfg = COL_CONFIG[col];
                  const colTasks = sortedTasks(col);
                  return (
                    <div key={col} className="min-w-[300px] flex-1 flex flex-col rounded-xl border border-slate-800/60 overflow-hidden bg-[#0d1321]">
                      {/* Col header */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                          <h3 className="font-bold text-xs uppercase tracking-widest" style={{ color: cfg.color }}>{col}</h3>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">{colTasks.length}</span>
                        </div>
                        {col === 'To Do' && (
                          <button onClick={() => setShowAddModal(true)} className="text-slate-600 hover:text-white transition-colors">
                            <Plus size={14} />
                          </button>
                        )}
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-3 p-3 flex-1">
                        <AnimatePresence>
                          {colTasks.map(task => (
                            <TaskCard key={task.id} task={task} col={col} cfg={cfg} onMove={moveTask} onDelete={deleteTask} />
                          ))}
                        </AnimatePresence>
                        {colTasks.length === 0 && (
                          <div className="flex-1 border-2 border-dashed border-slate-800/50 rounded-xl flex flex-col items-center justify-center min-h-[100px] text-slate-700 gap-1">
                            <CheckCircle2 size={20} className="opacity-30" />
                            <span className="text-xs">Empty</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {activeTab === 'list' && (
              <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-[#0a1120]/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {['Task', 'Agent', 'Priority', 'Status', 'Progress', 'Due'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {[...tasks].sort((a, b) =>
                        (PRIORITY_ORDER[a.priority || 'normal'] ?? 2) - (PRIORITY_ORDER[b.priority || 'normal'] ?? 2)
                      ).map(task => {
                        const pCfg = PRIORITY_CONFIG[task.priority || 'normal'];
                        const sCfg = COL_CONFIG[task.status] || COL_CONFIG['To Do'];
                        const agentColor = AGENT_COLORS[task.agent] || '#64748b';
                        return (
                          <motion.tr key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-200 max-w-[260px] truncate">{task.title}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${agentColor}20`, color: agentColor }}>
                                {task.agent}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase" style={{ color: pCfg.color, background: pCfg.bg, borderColor: pCfg.border }}>
                                {pCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase" style={{ color: sCfg.color, background: `${sCfg.glow}`, borderColor: `${sCfg.color}40` }}>
                                {task.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-20">
                                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${task.progress || 0}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{task.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{task.dueDate || '1d'}</td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Live Transcript Feed ── */}
          <AnimatePresence>
            {showFeed && (
              <motion.div initial={{ opacity: 0, x: 30, width: 0 }} animate={{ opacity: 1, x: 0, width: 340 }}
                exit={{ opacity: 0, x: 30, width: 0 }} transition={{ duration: 0.3 }}
                className="flex-shrink-0 rounded-2xl border border-slate-800/60 overflow-hidden"
                style={{ background: 'rgba(7,13,26,0.8)', backdropFilter: 'blur(12px)', height: 'calc(100vh - 240px)' }}>
                {/* Feed header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live AI Feed</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  <button onClick={() => setShowFeed(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                {/* Feed entries */}
                <div ref={feedRef} className="overflow-y-auto h-full pb-4">
                  <AnimatePresence>
                    {transcripts.map((t, i) => {
                      const agentColor = AGENT_COLORS[t.agentId] || '#64748b';
                      const isWarn = t.status === 'Warning';
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-3 border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: isWarn ? '#f59e0b' : agentColor }} />
                              <span className="text-[10px] font-bold uppercase" style={{ color: isWarn ? '#f59e0b' : agentColor }}>{t.agentId}</span>
                            </div>
                            {t.latencyMs && (
                              <span className="text-[9px] text-slate-600">{t.latencyMs}ms</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-1 line-clamp-2">
                            {t.action}
                          </p>
                          <p className="text-[9px] text-slate-600 font-mono leading-relaxed line-clamp-3">
                            {t.thoughtProcess?.slice(0, 180)}...
                          </p>
                          <p className="text-[9px] text-slate-700 mt-1">
                            {new Date(t.timestamp).toLocaleTimeString('id-ID')}
                            {t.provider && ` · ${t.provider}`}
                          </p>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {transcripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-700 gap-2">
                      <Terminal size={24} className="opacity-30" />
                      <span className="text-xs">Belum ada aktivitas AI</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Add Task Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6"
              style={{ background: '#0d1321' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-bold text-base">Tambah Neural Task</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Judul Task</label>
                  <input
                    value={addForm.title}
                    onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Contoh: Restock barang kategori fashion..."
                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-indigo-500/50"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Agent</label>
                    <select value={addForm.agent} onChange={e => setAddForm(p => ({ ...p, agent: e.target.value }))}
                      className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2.5 outline-none">
                      <option>Neural Admin</option>
                      <option>Neural Finance</option>
                      <option>Neural Marketing</option>
                      <option>Neural Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Priority</label>
                    <select value={addForm.priority} onChange={e => setAddForm(p => ({ ...p, priority: e.target.value as any }))}
                      className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2.5 outline-none">
                      <option value="critical">🔴 Critical</option>
                      <option value="high">🟠 High</option>
                      <option value="normal">🔵 Normal</option>
                      <option value="low">⚪ Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Labels (pisah koma)</label>
                  <input
                    value={addForm.labels}
                    onChange={e => setAddForm(p => ({ ...p, labels: e.target.value }))}
                    placeholder="Contoh: finance, urgent, Q2"
                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-indigo-500/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Batal</button>
                <button onClick={handleAddTask} disabled={!addForm.title.trim() || isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {isSaving ? 'Menyimpan...' : '+ Tambah Task'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Task Card Component ────────────────────────────────────────────────────────
const COLUMN_SEQUENCE: NeuralTask['status'][] = ['To Do', 'In Progress', 'Review', 'Done'];

function TaskCard({ task, col, cfg, onMove, onDelete }: {
  task: NeuralTask;
  col: string;
  cfg: { color: string; glow: string };
  onMove: (id: string, status: NeuralTask['status']) => void;
  onDelete: (id: string) => void;
}) {
  const agentColor = AGENT_COLORS[task.agent] || '#64748b';
  const pCfg = PRIORITY_CONFIG[task.priority || 'normal'];
  const isActive = col === 'In Progress';
  const isReview = col === 'Review';

  const colIdx = COLUMN_SEQUENCE.indexOf(col as NeuralTask['status']);
  const prevCol = colIdx > 0 ? COLUMN_SEQUENCE[colIdx - 1] : null;
  const nextCol = colIdx < COLUMN_SEQUENCE.length - 1 ? COLUMN_SEQUENCE[colIdx + 1] : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-xl p-3.5 cursor-pointer overflow-hidden transition-all"
      style={{
        background: '#0c1628',
        border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : isReview ? 'rgba(168,85,247,0.4)' : 'rgba(30,41,59,0.8)'}`,
      }}>

      {/* Active/Review top glow bar */}
      {(isActive || isReview) && (
        <div className="absolute top-0 left-0 w-full h-0.5 animate-pulse"
          style={{ background: `linear-gradient(90deg, transparent, ${isActive ? '#f59e0b' : '#a855f7'}, transparent)` }} />
      )}

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:text-rose-500 z-10"
      >
        <Trash2 size={12} />
      </button>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase"
            style={{ color: pCfg.color, background: pCfg.bg, borderColor: pCfg.border }}>
            {pCfg.label}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              On Task
            </span>
          )}
          {isReview && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
              <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              In Review
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[10px] flex-shrink-0 pr-5">
          <Clock size={10} />
          {task.dueDate || '1d'}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-slate-100 text-[13px] leading-snug mb-2.5 line-clamp-2">{task.title}</h4>

      {/* Review note */}
      {task.reviewNote && (
        <div className="mb-2.5 p-2 rounded-lg text-[10px] leading-relaxed"
          style={{ background: task.reviewNote.startsWith('[APPROVED]') ? 'rgba(16,185,129,0.08)' : 'rgba(249,115,22,0.08)',
                   color: task.reviewNote.startsWith('[APPROVED]') ? '#6ee7b7' : '#fdba74', border: '1px solid rgba(255,255,255,0.05)' }}>
          {task.reviewNote.slice(0, 120)}
        </div>
      )}

      {/* Labels */}
      {(task.labels || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.map(label => (
            <span key={label} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* AI Execution Result */}
      {task.agentResult && (
        <div className="mb-2.5 p-2 rounded-lg text-[10px] leading-relaxed border"
          style={{
            background: task.agentResult.startsWith('✅') ? 'rgba(16,185,129,0.06)' : task.agentResult.startsWith('⚙️') ? 'rgba(59,130,246,0.06)' : 'rgba(249,115,22,0.06)',
            color: task.agentResult.startsWith('✅') ? '#6ee7b7' : task.agentResult.startsWith('⚙️') ? '#93c5fd' : '#fdba74',
            borderColor: task.agentResult.startsWith('✅') ? 'rgba(16,185,129,0.15)' : task.agentResult.startsWith('⚙️') ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)',
          }}>
          <div className="font-bold mb-1">
            {task.agentResult.startsWith('⚙️') ? '⚙️ Sedang diproses...' : '🤖 Hasil AI:'}
          </div>
          <p className="whitespace-pre-line line-clamp-5">{task.agentResult}</p>
        </div>
      )}

      {/* Progress bar */}
      {task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-slate-600 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${task.progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: isActive ? 'linear-gradient(90deg,#f59e0b,#f97316)' : isReview ? 'linear-gradient(90deg,#a855f7,#8b5cf6)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5 text-slate-600 text-[10px]">
          <span className="flex items-center gap-1 hover:text-indigo-400 transition-colors"><MessageSquare size={10} /> {task.comments || 0}</span>
          <span className="flex items-center gap-1 hover:text-indigo-400 transition-colors"><Paperclip size={10} /> {task.attachments || 0}</span>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: `${agentColor}25`, border: `1.5px solid ${agentColor}50`, color: agentColor }}
          title={task.agent}>
          {task.agent ? task.agent.split(' ').map(w => w[0]).join('').slice(0, 2) : 'AI'}
        </div>
      </div>

      {/* Hover quick move actions */}
      <div className="absolute bottom-2 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        {prevCol && (
          <button onClick={e => { e.stopPropagation(); onMove(task.id, prevCol); }}
            className="text-[10px] text-slate-600 hover:text-slate-300 flex items-center gap-0.5 transition-colors">
            <ChevronLeft size={10} /> {prevCol}
          </button>
        )}
        {nextCol && (
          <button onClick={e => { e.stopPropagation(); onMove(task.id, nextCol); }}
            className="text-[10px] text-slate-600 hover:text-green-400 flex items-center gap-0.5 transition-colors ml-auto">
            {nextCol} <ChevronRight size={10} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
