// FUSIONEURAL — MULTI-AGENT ROUTING ENGINE v2
// 7-Step Manager Orchestration + Redis Telemetry + UX Error Handling
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// ── Firebase (server-side, reads SOP from neural_configs) ──────────────────
const _fb = getApps().length === 0
  ? initializeApp({
      apiKey:            process.env.VITE_FIREBASE_API_KEY,
      authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.VITE_FIREBASE_APP_ID,
    })
  : getApps()[0];
const db = getFirestore(_fb);

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

interface AgentRequest {
  agent:           'frontliner' | 'manager' | 'admin' | 'finance';
  messages:        ChatMessage[];
  sessionId?:      string;
  model?:          string;
  temperature?:    number;
  max_tokens?:     number;
  response_format?: { type: 'json_object' | 'text' };
  task?:           'supplier_search' | 'format_json' | 'general';
  useMemory?:      boolean;
  useOrchestrator?: boolean;   // triggers full 7-step Manager flow
  targetAgentId?:  string;
  previousOutput?: string;
}

// ── Upstash Redis inline helpers ───────────────────────────────────────────
const R_URL   = process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const THRESHOLD = 50;

async function redis(...args: (string | number)[]): Promise<any> {
  if (!R_URL || !R_TOKEN) return null;
  const path = args.map(a => encodeURIComponent(String(a))).join('/');
  try {
    const r = await fetch(`${R_URL}/${path}`, { headers: { Authorization: `Bearer ${R_TOKEN}` } });
    return (await r.json() as any).result;
  } catch { return null; }
}

async function trackUsage(apiName: string): Promise<{ count: number; warning: boolean }> {
  const count = (await redis('INCR', `api_usage:${apiName}`)) as number ?? 0;
  return { count, warning: count >= THRESHOLD };
}

async function logError(apiName: string, agentRole: string, errorMsg: string): Promise<void> {
  const entry = JSON.stringify({ apiName, agentRole, errorMsg, ts: new Date().toISOString() });
  await redis('LPUSH', 'error_log:system', entry);
  await redis('LTRIM', 'error_log:system', 0, 49);
}

async function pushHistory(sessionId: string, role: string, content: string): Promise<void> {
  const entry = JSON.stringify({ role, content, ts: new Date().toISOString() });
  await redis('LPUSH', `history:${sessionId}`, entry);
  await redis('LTRIM', `history:${sessionId}`, 0, 19);
  await redis('EXPIRE', `history:${sessionId}`, 86400);
}

async function getHistory(sessionId: string, limit = 10): Promise<ChatMessage[]> {
  const items = await redis('LRANGE', `history:${sessionId}`, 0, limit - 1) as string[] | null;
  return (items || []).reverse().map(i => {
    try { return JSON.parse(i); } catch { return { role: 'user' as const, content: i }; }
  });
}

async function setManagerEval(sessionId: string, text: string): Promise<void> {
  await redis('SET', `manager_eval:${sessionId}`, text, 'EX', 3600);
}

// ── Firestore SOP reader ───────────────────────────────────────────────────
const SOP_FALLBACK: Record<string, string> = {
  manager_brain:  'Kamu adalah AI Manager FusionNeural. Koordinasikan agen, evaluasi strategi, dan buat keputusan bisnis yang tepat. Bahasa Indonesia.',
  finance_brain:  'Kamu adalah AI Finance FusionNeural. Hitung profit, pajak, dan ROI dengan presisi. Selalu gunakan Rupiah.',
  admin_brain:    'Kamu adalah AI Admin FusionNeural. Kelola inventaris, pesanan, dan logistik secara efisien.',
  marketing_brain:'Kamu adalah AI Marketing FusionNeural. Buat kampanye kreatif, persuasif, dan etis.',
};

async function getAgentSOP(agentId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'neural_configs', agentId));
    if (snap.exists()) return snap.data().prompt as string;
  } catch { /* fallback below */ }
  return SOP_FALLBACK[agentId] ?? 'You are a helpful AI assistant.';
}

// ── UX Error Formatter ─────────────────────────────────────────────────────
function uxError(agentName: string, aiName: string, err: string): string {
  return `Maaf, Agen ${agentName} (${aiName}) sedang mengalami kendala teknis (${err.slice(0, 120)}). Sistem sedang mengalihkan ke agen cadangan...`;
}

// ── AI Providers ───────────────────────────────────────────────────────────
async function callGroq(msgs: ChatMessage[], model = 'llama-3.3-70b-versatile', temp = 0.7, max_tokens?: number, rf?: any): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY missing');
  const payload: any = { model, messages: msgs, temperature: temp };
  if (max_tokens) payload.max_tokens = max_tokens;
  if (rf) payload.response_format = rf;
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
  return (await r.json() as any).choices?.[0]?.message?.content?.trim() || '';
}

async function callCerebras(msgs: ChatMessage[], temp = 0.7): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) throw new Error('CEREBRAS_API_KEY missing');
  const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b', messages: msgs, temperature: temp, max_tokens: 1024 }),
  });
  if (!r.ok) throw new Error(`Cerebras ${r.status}: ${await r.text()}`);
  return (await r.json() as any).choices?.[0]?.message?.content?.trim() || '';
}

async function callGemini(msgs: ChatMessage[], model = 'gemini-2.5-flash-preview-05-20', temp = 0.7): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const systemParts = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const contents    = msgs.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }],
  }));
  const body: any = { contents, generationConfig: { temperature: temp, maxOutputTokens: 2048 } };
  if (systemParts) body.systemInstruction = { parts: [{ text: systemParts }] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
  return (await r.json() as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function callMistral(msgs: ChatMessage[], temp = 0.7): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('MISTRAL_API_KEY missing');
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'mistral-large-latest', messages: msgs, temperature: temp, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`Mistral ${r.status}: ${await r.text()}`);
  return (await r.json() as any).choices?.[0]?.message?.content?.trim() || '';
}

async function callOpenRouter(msgs: ChatMessage[], model = 'openai/gpt-4o-mini:free', temp = 0.6): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY missing');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fusion-neural.vercel.app', 'X-Title': 'FusionNeural' },
    body: JSON.stringify({ model, messages: msgs, temperature: temp, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
  return (await r.json() as any).choices?.[0]?.message?.content?.trim() || '';
}

async function callCohere(msgs: ChatMessage[], temp = 0.3): Promise<string> {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error('COHERE_API_KEY missing');
  const system  = msgs.find(m => m.role === 'system')?.content || '';
  const history = msgs.filter(m => m.role !== 'system').slice(0, -1)
    .map(m => ({ role: m.role === 'user' ? 'USER' : 'CHATBOT', message: m.content }));
  const lastMsg = msgs.filter(m => m.role === 'user').at(-1)?.content || '';
  const r = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'command-r-plus', message: lastMsg, preamble: system, chat_history: history, temperature: temp, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`Cohere ${r.status}: ${await r.text()}`);
  return (await r.json() as any)?.text?.trim() || '';
}

async function callDeepSeek(msgs: ChatMessage[], temp = 0.3, rf?: any): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY missing');
  const payload: any = { model: 'deepseek-reasoner', messages: msgs, temperature: temp, max_tokens: 4096 };
  if (rf) payload.response_format = rf;
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${await r.text()}`);
  return (await r.json() as any).choices?.[0]?.message?.content?.trim() || '';
}

// ── Universal fallback wrapper ─────────────────────────────────────────────
async function withFallback(
  primary: () => Promise<string>,
  msgs: ChatMessage[],
  apiLabel: string,
  agentRole: string,
  usageWarnings: string[]
): Promise<{ result: string; provider: string }> {
  try {
    const result = await primary();
    const { warning } = await trackUsage(apiLabel.split('/')[0].toLowerCase());
    if (warning) usageWarnings.push(apiLabel);
    return { result, provider: apiLabel };
  } catch (err: any) {
    await logError(apiLabel, agentRole, err.message);
    const uxMsg = uxError(agentRole, apiLabel, err.message);
    console.warn(`[${agentRole}] ${apiLabel} failed: ${err.message} → OpenRouter fallback`);
    try {
      const result = await callOpenRouter(msgs, 'openai/gpt-4o-mini:free');
      const { warning } = await trackUsage('openrouter');
      if (warning) usageWarnings.push('openrouter');
      return { result, provider: `OpenRouter (fallback — ${uxMsg.slice(0, 60)}...)` };
    } catch (fb: any) {
      throw new Error(`${uxMsg} | Fallback juga gagal: ${fb.message}`);
    }
  }
}

// ── AGENT: FRONTLINER (Groq → Cerebras → OpenRouter) ─────────────────────
async function routeFrontliner(msgs: ChatMessage[], opts: Partial<AgentRequest>, usageWarnings: string[]) {
  try {
    const result = await callGroq(msgs, opts.model || 'llama-3.3-70b-versatile', opts.temperature ?? 0.7, opts.max_tokens, opts.response_format);
    const { warning } = await trackUsage('groq');
    if (warning) usageWarnings.push('groq');
    return { result, provider: 'Groq/llama-3.3-70b-versatile' };
  } catch (e1: any) {
    await logError('groq', 'Frontliner', e1.message);
    console.warn('[Frontliner] Groq failed:', e1.message);
    try {
      const result = await callCerebras(msgs, opts.temperature ?? 0.7);
      const { warning } = await trackUsage('cerebras');
      if (warning) usageWarnings.push('cerebras');
      return { result, provider: `Cerebras/llama-3.3-70b (backup — ${uxError('Frontliner','Groq',e1.message).slice(0,50)}...)` };
    } catch (e2: any) {
      await logError('cerebras', 'Frontliner', e2.message);
      const result = await callOpenRouter(msgs, 'openai/gpt-4o-mini:free');
      await trackUsage('openrouter');
      return { result, provider: 'OpenRouter/gpt-4o-mini (last resort)' };
    }
  }
}

// ── AGENT: MANAGER — 7-STEP ORCHESTRATION ─────────────────────────────────
async function routeManager(msgs: ChatMessage[], opts: AgentRequest, usageWarnings: string[]) {
  const sessionId = opts.sessionId || `sess_${Date.now()}`;

  // ── STEP 1: Retrieve SOP from Firestore (READ ONLY) ────────────────────
  const sop = await getAgentSOP('manager_brain');

  // ── STEP 2: Retrieve history:{sessionId} from Redis ────────────────────
  const history = await getHistory(sessionId, 10);

  // ── STEP 3: Build enriched prompt (Evaluate history context) ──────────
  let systemContent = sop;
  if (history.length > 0) {
    systemContent += '\n\n=== RIWAYAT PERCAKAPAN AKTIF (Redis) ===\n' +
      history.map(h => `[${h.role.toUpperCase()}]: ${h.content?.slice(0, 300)}`).join('\n') +
      '\n\n[EVALUASI]: Analisis riwayat di atas. Berikan respons yang BERBEDA dari pola sebelumnya.';
  }

  // Inject old mem:manager:contexts if useMemory is on
  if (opts.useMemory !== false) {
    try {
      const path = `mem:manager:contexts`;
      const items = await redis('LRANGE', path, 0, 2) as string[] | null;
      if (items && items.length > 0) {
        const ctxBlock = items.map((i, idx) => {
          try { const p = JSON.parse(i); return `[${idx+1}] ${p.prompt?.slice(0,150)} → ${p.output?.slice(0,200)}`; }
          catch { return `[${idx+1}] ${i.slice(0,200)}`; }
        }).join('\n');
        systemContent += `\n\n=== MEMORI JANGKA PANJANG (3 Terakhir) ===\n${ctxBlock}`;
      }
    } catch { /* non-blocking */ }
  }

  // ── STEP 4: Execute — Call Gemini (primary) ────────────────────────────
  const enriched: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...msgs.filter(m => m.role !== 'system'),
  ];

  let result = '';
  let provider = '';

  try {
    result   = await callGemini(enriched, 'gemini-2.5-flash-preview-05-20', opts.temperature ?? 0.7);
    const { warning } = await trackUsage('gemini');
    if (warning) usageWarnings.push('gemini');
    provider = 'Gemini/gemini-2.5-flash-preview-05-20';
  } catch (ge: any) {
    await logError('gemini', 'Manager', ge.message);
    console.warn('[Manager] Gemini failed:', ge.message);
    try {
      result   = await callMistral(enriched, opts.temperature ?? 0.7);
      const { warning } = await trackUsage('mistral');
      if (warning) usageWarnings.push('mistral');
      provider = `Mistral/mistral-large-latest (backup — ${uxError('Manager','Gemini',ge.message).slice(0,50)}...)`;
    } catch (me: any) {
      await logError('mistral', 'Manager', me.message);
      result   = await callOpenRouter(enriched, 'openai/gpt-4o-mini:free');
      await trackUsage('openrouter');
      provider = 'OpenRouter (last resort)';
    }
  }

  // ── STEP 5: Conclude — build brief summary ─────────────────────────────
  const conclusion = `[${new Date().toISOString()}] Respons diberikan oleh ${provider}. Input: "${(msgs.at(-1)?.content || '').slice(0,100)}". Output ringkasan: "${result.slice(0,200)}"`;

  // ── STEP 6: Store to Redis (non-blocking) ─────────────────────────────
  const lastUserMsg = msgs.filter(m => m.role === 'user').at(-1)?.content || '';
  await Promise.allSettled([
    setManagerEval(sessionId, conclusion),
    pushHistory(sessionId, 'user', lastUserMsg),
    pushHistory(sessionId, 'assistant', result),
    redis('LPUSH', 'mem:manager:contexts', JSON.stringify({
      timestamp: new Date().toISOString(), prompt: lastUserMsg, output: result.slice(0, 400), metric: 'ok',
    })).then(() => redis('LTRIM', 'mem:manager:contexts', 0, 9)),
  ]);

  // ── STEP 7: Evaluate target agent output (if provided) → Firestore signal
  let firestoreSignal: any = null;
  if (opts.targetAgentId && opts.previousOutput) {
    try {
      const evalMsgs: ChatMessage[] = [
        { role: 'system', content: 'Evaluasi output agen. Kembalikan JSON: {"score":N,"feedback":"...","action":"none|rewrite|escalate"}' },
        { role: 'user', content: `Agen: ${opts.targetAgentId}\nOutput:\n${opts.previousOutput}` },
      ];
      let evalRaw = '';
      try { evalRaw = await callGemini(evalMsgs, 'gemini-2.5-flash-preview-05-20', 0.3); }
      catch { evalRaw = await callOpenRouter(evalMsgs); }
      const match = evalRaw.match(/\{[\s\S]*\}/);
      if (match) {
        const evalObj = JSON.parse(match[0]);
        await redis('LPUSH', `mem:${opts.targetAgentId}:feedback`,
          JSON.stringify({ timestamp: new Date().toISOString(), ...evalObj }));
        await redis('LTRIM', `mem:${opts.targetAgentId}:feedback`, 0, 19);
        if (evalObj.score < 5) {
          firestoreSignal = { collection: 'agent_evaluations', data: { agentId: opts.targetAgentId, ...evalObj, evaluatedAt: new Date().toISOString() }};
        }
      }
    } catch { /* non-blocking */ }
  }

  return { result, provider, sessionId, firestoreSignal };
}

// ── AGENT: ADMIN ───────────────────────────────────────────────────────────
async function routeAdmin(msgs: ChatMessage[], task: AgentRequest['task'], opts: Partial<AgentRequest>, usageWarnings: string[]) {
  if (task === 'format_json') {
    return withFallback(() => callCohere(msgs, opts.temperature ?? 0.2), msgs, 'cohere/command-r-plus', 'Admin', usageWarnings);
  }
  // supplier_search + general: OpenRouter
  return withFallback(() => callOpenRouter(msgs, 'openai/gpt-4o-mini:free', opts.temperature ?? 0.5), msgs, 'openrouter/gpt-4o-mini', 'Admin', usageWarnings);
}

// ── AGENT: FINANCE ─────────────────────────────────────────────────────────
async function routeFinance(msgs: ChatMessage[], opts: Partial<AgentRequest>, usageWarnings: string[]) {
  return withFallback(() => callDeepSeek(msgs, opts.temperature ?? 0.2, opts.response_format), msgs, 'deepseek/deepseek-reasoner', 'Finance', usageWarnings);
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body as AgentRequest;
  const { agent, messages, temperature, max_tokens, response_format, task, sessionId } = body;

  if (!agent)    return res.status(400).json({ error: 'Missing: agent', valid: ['frontliner','manager','admin','finance'] });
  if (!messages?.length) return res.status(400).json({ error: 'Missing: messages' });

  const usageWarnings: string[] = [];

  try {
    let response: { result: string; provider: string; sessionId?: string; firestoreSignal?: any };

    switch (agent) {
      case 'frontliner':
        response = await routeFrontliner(messages, { model: body.model, temperature, max_tokens, response_format }, usageWarnings);
        break;

      case 'manager':
        response = await routeManager(messages, body, usageWarnings);
        break;

      case 'admin':
        response = await routeAdmin(messages, task, { temperature, response_format }, usageWarnings);
        break;

      case 'finance':
        response = await routeFinance(messages, { temperature, response_format }, usageWarnings);
        break;

      default:
        return res.status(400).json({ error: `Unknown agent: ${agent}` });
    }

    return res.status(200).json({
      agent,
      provider:       response.provider,
      result:         response.result,
      sessionId:      response.sessionId || sessionId,
      firestoreSignal: response.firestoreSignal || null,
      usageWarnings,                          // ← frontend shows banner if non-empty
      timestamp:      new Date().toISOString(),
    });

  } catch (error: any) {
    console.error(`[Agents] agent=${agent}:`, error);
    return res.status(500).json({
      agent, error: error?.message,
      uxMessage: `Semua agen cadangan habis. Mohon coba beberapa saat lagi atau hubungi administrator.`,
    });
  }
}
