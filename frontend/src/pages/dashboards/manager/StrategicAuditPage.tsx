/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Brain, AlertTriangle, CheckCircle2, RefreshCw, Zap, Terminal, Shield, FileJson, MessageSquareWarning } from 'lucide-react';
import { NeuralCore } from '../../../services/NeuralCore';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { triggerSimulator } from '../../../services/apiClient';
import PageHeader from '../../../components/ui/PageHeader';

interface ActivityLog {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: any;
}

interface EvalResult {
  target_agent: string;
  new_prompt: string;
}

interface PendingApproval {
  id: string;
  agentId: string;
  actionType: string;
  description: string;
  jsonPayload?: string;
  status: string;
  timestamp: string;
}

export default function StrategicAuditPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityLog[]);
    });

    const qApp = query(collection(db, 'pending_approvals'), orderBy('timestamp', 'desc'));
    const unsubApp = onSnapshot(qApp, (snap) => {
      setApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PendingApproval[]);
    });
    return () => { unsub(); unsubApp(); };
  }, []);

  // Manager Autopilot Trigger — via Python FastAPI
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSimulator({ action: 'manager' })
        .catch(e => console.error("Manager simulator error:", e));
    }, 20000); // 20 detik setelah masuk halaman Manager
    return () => clearTimeout(timer);
  }, []);

  const resultRef = useRef<HTMLDivElement>(null);

  // The Big Button — Evaluate & Re-Align
  const handleAudit = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    setSuccessMsg('');
    setCustomPrompt('');
    try {
      const recentLogs = logs.slice(0, 50).map(l => `[${l.agent}] ${l.action}: ${l.details}`);
      const rawResult = await NeuralCore.evaluateAndRealignAgents(recentLogs);

      // Normalize result regardless of format AI returns
      let normalized: EvalResult;
      if (rawResult && typeof rawResult === 'object' && rawResult.target_agent) {
        normalized = rawResult as EvalResult;
      } else if (typeof rawResult === 'string') {
        normalized = { target_agent: 'unknown', new_prompt: rawResult };
      } else {
        normalized = { target_agent: 'none', new_prompt: 'Audit complete. All agents operating normally.' };
      }

      setEvalResult(normalized);
      await FirebaseLogger.logAgentAction('Manager', 'STRATEGIC_AUDIT', `Audit selesai. Target: ${normalized.target_agent}`);
      // Scroll result into view
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (error) {
      console.error(error);
      setEvalResult({ target_agent: 'error', new_prompt: 'Gagal menghubungi Manager AI. Periksa koneksi Groq API.' });
    } finally {
      setIsEvaluating(false);
    }
  };


  // Override Command — inject new prompt
  const handleInjectPrompt = async () => {
    if (!evalResult || evalResult.target_agent === 'none' || evalResult.target_agent === 'error') return;
    setIsInjecting(true);
    try {
      const promptToInject = customPrompt.trim() || evalResult.new_prompt;
      await setDoc(doc(db, 'neural_configs', evalResult.target_agent), { prompt: promptToInject });
      await FirebaseLogger.logAgentAction('Manager', 'INJECT_PROMPT', `${evalResult.target_agent} berhasil di-override dengan instruksi baru.`);
      setSuccessMsg(`Prompt baru berhasil disuntikkan ke "${evalResult.target_agent}"`);
      setEvalResult(null);
      setCustomPrompt('');
    } catch (e) { console.error(e); }
    finally { setIsInjecting(false); }
  };

  const agentColor = (agent: string) => {
    if (agent.includes('Admin')) return 'bg-blue-500/20 text-blue-400';
    if (agent.includes('Marketing')) return 'bg-purple-500/20 text-purple-400';
    if (agent.includes('Finance')) return 'bg-emerald-500/20 text-emerald-400';
    if (agent.includes('Manager')) return 'bg-teal-500/20 text-teal-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  const handleApprove = async (id: string, agent: string, actionType: string) => {
    try {
      await setDoc(doc(db, 'pending_approvals', id), { status: 'Approved', managerFeedback: 'OK' }, { merge: true });
      await FirebaseLogger.logAgentAction('Manager', 'APPROVE_AI_ACTION', `Menyetujui eksekusi ${actionType} oleh ${agent}. CI/CD Auto-Reload Triggered.`);
      setSuccessMsg(`Tindakan ${agent} berhasil di-approve! Eksekusi berjalan.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch(e) { console.error(e); }
  };

  const handleRejectScold = async (id: string, agent: string) => {
    const reason = prompt(`Beri teguran keras ke ${agent} (marah/tegas):`, 'DILARANG MENGUBAH KODE INI! Batal!');
    if (reason) {
      await setDoc(doc(db, 'pending_approvals', id), { status: 'Rejected', managerFeedback: reason }, { merge: true });
      await FirebaseLogger.logAgentAction('Manager', 'REJECT_SCOLD_AI', `Menolak tindakan ${agent}. Alasan: ${reason}`);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Strategic Audit Hub & AI Meeting"
        subtitle="Pusat kendali Human-in-the-Loop. Audit log AI dan setujui modifikasi kode/JSON krusial."
        accent="teal"
        icon={<Shield size={22} className="text-white" />}
      />

      {/* HUMAN-IN-THE-LOOP APPROVALS */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" /> Human-in-the-Loop: Pending Operations
        </h2>
        
        {approvals.filter(a => a.status === 'Pending').length === 0 ? (
          <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 text-center text-slate-400 text-sm">
            Tidak ada aksi krusial yang menunggu persetujuan (Approve).
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {approvals.filter(a => a.status === 'Pending').map(app => (
              <div key={app.id} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${agentColor(app.agentId)}`}>{app.agentId}</span>
                      <span className="text-xs text-slate-400">{new Date(app.timestamp).toLocaleString()}</span>
                    </div>
                    <h3 className="text-slate-200 font-bold">{app.actionType}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      <strong className="text-slate-300">Penjelasan AI:</strong> "{app.description}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(app.id, app.agentId, app.actionType)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all">
                      <CheckCircle2 size={14} /> Approve & Deploy
                    </button>
                    <button onClick={() => handleRejectScold(app.id, app.agentId)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-xs font-bold transition-all">
                      <MessageSquareWarning size={14} /> Reject & Scold
                    </button>
                  </div>
                </div>
                
                {app.jsonPayload && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase flex items-center gap-1"><FileJson size={12}/> Modifikasi JSON/Kode (Preview)</p>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{app.jsonPayload}</pre>
                  </div>
                )}
                
                <div className="text-[10px] text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                  ⚠️ <strong>Security Rule:</strong> AI Admin hanya boleh akses Data Produk. AI Finance tidak bisa ubah kode Marketing. Pastikan payload ini aman sebelum di-approve.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THE BIG BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#0D9488 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-teal-400" />
              <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Autonomous Intelligence</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
              Evaluate & Re-Align Agents
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              AI Manager akan menganalisis 50 log aktivitas terbaru, mendeteksi anomali, dan merekomendasikan instruksi sistem baru jika ada agen yang bekerja tidak efisien.
            </p>
            <div className="flex flex-wrap gap-3 mt-5 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Zap size={11} className="text-teal-400" /> 50 log terakhir</span>
              <span className="flex items-center gap-1"><Brain size={11} className="text-teal-400" /> Groq Llama-3.3-70b</span>
              <span className="flex items-center gap-1"><Terminal size={11} className="text-teal-400" /> JSON structured output</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAudit}
            disabled={isEvaluating}
            className="shrink-0 flex items-center gap-3 px-8 py-5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-600 text-white font-black text-base rounded-2xl shadow-2xl shadow-teal-500/30 transition-all"
          >
            <Brain size={22} className={isEvaluating ? 'animate-spin' : ''} />
            {isEvaluating ? 'Menganalisis...' : 'Jalankan Audit AI'}
          </motion.button>
        </div>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isEvaluating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
              <Brain size={24} className="text-teal-600 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Manager AI sedang menganalisis log...</p>
              <p className="text-sm text-slate-500 mt-0.5">Mengirim {logs.slice(0, 50).length} log ke Groq API</p>
            </div>
            <div className="flex gap-1 ml-auto">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  className="w-2 h-2 rounded-full bg-teal-400" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
          >
            <CheckCircle2 size={18} className="text-emerald-500" />
            <p className="font-bold text-emerald-700 text-sm">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-Alignment Output */}
      {!isEvaluating && evalResult && (
        <motion.div
          ref={resultRef}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
            <div className={`p-5 border-b border-slate-100 flex items-center gap-3 ${
              evalResult.target_agent === 'none' ? 'bg-emerald-50' :
              evalResult.target_agent === 'error' ? 'bg-rose-50' : 'bg-amber-50'
            }`}>
              {evalResult.target_agent === 'none' ? (
                <><CheckCircle2 size={18} className="text-emerald-600" />
                <div><p className="font-bold text-emerald-800">Semua Agen Bekerja Normal</p>
                <p className="text-xs text-emerald-600 mt-0.5">Tidak ada re-alignment yang diperlukan.</p></div></>
              ) : evalResult.target_agent === 'error' ? (
                <><AlertTriangle size={18} className="text-rose-500" />
                <div><p className="font-bold text-rose-700">Audit Gagal</p>
                <p className="text-xs text-rose-500 mt-0.5">{evalResult.new_prompt}</p></div></>
              ) : (
                <><AlertTriangle size={18} className="text-amber-600" />
                <div><p className="font-bold text-amber-800">Perlu Re-Alignment: <code className="font-mono bg-amber-100 px-1 rounded">{evalResult.target_agent}</code></p>
                <p className="text-xs text-amber-600 mt-0.5">AI merekomendasikan instruksi sistem baru untuk agen ini.</p></div></>
              )}
            </div>

            {evalResult.target_agent !== 'none' && evalResult.target_agent !== 'error' && (
              <div className="p-6 space-y-5">
                {/* AI Recommendation */}
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Re-Alignment Output (AI Recommendation)</p>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {evalResult.new_prompt.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                  </div>
                </div>

                {/* Override Command */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Terminal size={11} /> Override Command (Opsional — biarkan kosong untuk pakai rekomendasi AI)
                  </p>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder={`Ketik instruksi kustom Kak untuk ${evalResult.target_agent}...`}
                    rows={4}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-teal-300 resize-none"
                  />
                </div>

                {/* Inject Button */}
                <button
                  onClick={handleInjectPrompt}
                  disabled={isInjecting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-lg shadow-teal-500/20"
                >
                  {isInjecting
                    ? <><RefreshCw size={16} className="animate-spin" /> Menyuntikkan prompt...</>
                    : <><Zap size={16} /> Inject Prompt ke Firestore ({evalResult.target_agent})</>
                  }
                </button>
              </div>
            )}
          </motion.div>
      )}

      {/* Live Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Activity Log ({logs.length} entries)</h2>
          <div className="bg-[#0F172A] rounded-2xl p-4 h-[350px] overflow-y-auto space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                Belum ada log. Jalankan beberapa aksi di Admin/Marketing terlebih dahulu.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${agentColor(log.agent)}`}>
                    {log.agent}
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-medium truncate">{log.action}</p>
                    <p className="text-slate-600 text-[10px] truncate">{log.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquareWarning size={14} className="text-teal-500" />
            Direct Audit Chat (Owner & Manager AI)
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-[350px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <Brain size={14} />
                </div>
                <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/50">
                  <p className="text-xs text-teal-400 font-bold mb-1 uppercase tracking-widest text-[9px]">Manager AI</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Halo Kak Reza. Saya siap menerima instruksi strategis, melakukan audit manual, atau memarahi agen yang melanggar aturan. Apa yang bisa saya bantu hari ini?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                id="audit-input"
                placeholder="Ketik instruksi atau teguran keras untuk manajer..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder-slate-500"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const input = e.currentTarget;
                    const val = input.value;
                    input.value = '';
                    input.disabled = true;
                    // Append user message
                    const chatBox = input.parentElement?.previousElementSibling;
                    if (chatBox) {
                      chatBox.innerHTML += `
                        <div class="flex items-start gap-3 justify-end mt-4">
                          <div class="bg-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-3 border border-indigo-500/30 max-w-[85%]">
                            <p class="text-xs text-indigo-400 font-bold mb-1 text-right uppercase tracking-widest text-[9px]">Owner (Anda)</p>
                            <p class="text-sm text-slate-300 leading-relaxed text-right">${val}</p>
                          </div>
                        </div>
                      `;
                      chatBox.scrollTop = chatBox.scrollHeight;
                    }
                    
                    try {
                      // Visual loading
                      if (chatBox) {
                        chatBox.innerHTML += `
                          <div id="ai-loading" class="flex items-start gap-3 mt-4">
                            <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                              <span class="animate-spin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></span>
                            </div>
                          </div>
                        `;
                        chatBox.scrollTop = chatBox.scrollHeight;
                      }

                      const res = await NeuralCore.askAgent('manager', 'audit_chat', 'Sebagai Manager AI (The Compliance Architect), kamu sekarang sedang berdiskusi langsung dengan Owner. Jawab pertanyaan atau laksanakan instruksinya: ' + val);
                      
                      if (chatBox) {
                        const loader = chatBox.querySelector('#ai-loading');
                        if (loader) loader.remove();
                        
                        chatBox.innerHTML += `
                          <div class="flex items-start gap-3 mt-4">
                            <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.673 15.136l-2.454-2.453a1.5 1.5 0 0 0-2.122 0l-2.453 2.454a1.5 1.5 0 0 0 0 2.12l2.453 2.455a1.5 1.5 0 0 0 2.122 0l2.454-2.454a1.5 1.5 0 0 0 0-2.122Z"/><path d="M11 12V3"/><path d="M15 12V3"/><path d="M11 21v-5"/><path d="M15 21v-5"/><path d="M19 12h-4"/></svg>
                            </div>
                            <div class="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/50 max-w-[85%]">
                              <p class="text-xs text-teal-400 font-bold mb-1 uppercase tracking-widest text-[9px]">Manager AI</p>
                              <p class="text-sm text-slate-300 leading-relaxed">${res.replace(/\\n/g, '<br/>')}</p>
                            </div>
                          </div>
                        `;
                        chatBox.scrollTop = chatBox.scrollHeight;
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      input.disabled = false;
                      input.focus();
                    }
                  }
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  onClick={() => {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                      const recognition = new SpeechRecognition();
                      recognition.lang = 'id-ID';
                      const input = document.getElementById('audit-input') as HTMLInputElement;
                      if(input) {
                        input.placeholder = '🎙️ Mendengarkan...';
                        input.disabled = true;
                      }
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        if(input) {
                          input.value = transcript;
                          input.disabled = false;
                          input.placeholder = 'Ketik instruksi atau teguran keras untuk manajer...';
                          // Simulasikan Enter
                          const ev = new KeyboardEvent('keydown', { key: 'Enter' });
                          input.dispatchEvent(ev);
                          // Panggil handler manual
                          input.onkeydown?.(ev as any);
                        }
                      };
                      recognition.onerror = () => {
                         if(input) {
                           input.disabled = false;
                           input.placeholder = 'Ketik instruksi atau teguran keras untuk manajer...';
                         }
                      }
                      recognition.start();
                    } else {
                      alert('Browser tidak mendukung Voice Recognition (Gunakan Chrome).');
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white transition-colors"
                  title="Biometric Voice Command"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
                <div className="text-slate-500 text-[10px] font-bold bg-slate-700 px-2 py-1 rounded">ENTER</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
