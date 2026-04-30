// ============================================================
// FUSIONEURAL — MEMORY & TELEMETRY SYSTEM
// Upstash Redis — Polyglot Persistence Layer (AI-only)
//
// KEY SCHEMA:
//   history:{sessionId}        — Chat history (LPUSH, max 20)
//   api_usage:{apiName}        — Call counter (INCR)
//   manager_eval:{sessionId}   — Manager conclusion (SET, 1h TTL)
//   error_log:system           — Error history (LPUSH, max 50)
//   mem:{agentId}:contexts     — Long-term context (LPUSH, max 10)
//   mem:{agentId}:feedback     — Evaluation feedback (LPUSH, max 20)
// ============================================================
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const USAGE_THRESHOLD = 50;

export const KNOWN_APIS = [
  'groq', 'cerebras', 'gemini', 'mistral',
  'deepseek', 'cohere', 'openrouter',
  'hf_text', 'gemini_image', 'hf_image', 'serper',
] as const;
export type KnownApi = (typeof KNOWN_APIS)[number];

async function redis(...args: (string | number)[]): Promise<any> {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Upstash Redis not configured');
  const path = args.map(a => encodeURIComponent(String(a))).join('/');
  const res  = await fetch(`${REDIS_URL}/${path}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Redis ${res.status}: ${await res.text()}`);
  return (await res.json() as any).result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body   = req.body as any;
    const action = body?.action as string;

    // ── LEGACY COMPAT ──────────────────────────────────────────────────────

    if (action === 'store') {
      const { agentId, prompt, output, metric = 'ok' } = body;
      const entry = JSON.stringify({ timestamp: new Date().toISOString(), prompt, output, metric });
      await redis('LPUSH', `mem:${agentId}:contexts`, entry);
      await redis('LTRIM', `mem:${agentId}:contexts`, 0, 9);
      return res.status(200).json({ ok: true, stored: agentId });
    }

    if (action === 'retrieve') {
      const { agentId, limit = 3 } = body;
      const items  = await redis('LRANGE', `mem:${agentId}:contexts`, 0, limit - 1) as string[] | null;
      const parsed = (items || []).map(i => { try { return JSON.parse(i); } catch { return { raw: i }; } });
      return res.status(200).json({ ok: true, agentId, contexts: parsed });
    }

    if (action === 'store_feedback') {
      const { agentId, feedback, score = -1 } = body;
      const entry = JSON.stringify({ timestamp: new Date().toISOString(), feedback, score });
      await redis('LPUSH', `mem:${agentId}:feedback`, entry);
      await redis('LTRIM', `mem:${agentId}:feedback`, 0, 19);
      return res.status(200).json({ ok: true, feedback_stored: agentId });
    }

    if (action === 'get_feedback') {
      const { agentId, limit = 5 } = body;
      const items  = await redis('LRANGE', `mem:${agentId}:feedback`, 0, limit - 1) as string[] | null;
      const parsed = (items || []).map(i => { try { return JSON.parse(i); } catch { return { raw: i }; } });
      return res.status(200).json({ ok: true, agentId, feedback: parsed });
    }

    // ── CHAT HISTORY ───────────────────────────────────────────────────────

    if (action === 'push_history') {
      const { sessionId, role, content } = body;
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
      const entry = JSON.stringify({ role, content, ts: new Date().toISOString() });
      await redis('LPUSH', `history:${sessionId}`, entry);
      await redis('LTRIM', `history:${sessionId}`, 0, 19);   // max 20 messages
      await redis('EXPIRE', `history:${sessionId}`, 86400);  // 24h TTL
      return res.status(200).json({ ok: true });
    }

    if (action === 'get_history') {
      const { sessionId, limit = 10 } = body;
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
      const items = await redis('LRANGE', `history:${sessionId}`, 0, limit - 1) as string[] | null;
      // LPUSH stores newest first → reverse for chronological order
      const history = (items || []).reverse().map(i => {
        try { return JSON.parse(i); } catch { return { role: 'user', content: i }; }
      });
      return res.status(200).json({ ok: true, sessionId, history });
    }

    // ── API USAGE TRACKING ─────────────────────────────────────────────────

    if (action === 'track_usage') {
      const { apiName } = body;
      if (!apiName) return res.status(400).json({ error: 'Missing apiName' });
      const count = await redis('INCR', `api_usage:${apiName}`) as number;
      return res.status(200).json({ ok: true, apiName, count, warning: count >= USAGE_THRESHOLD });
    }

    if (action === 'get_usage') {
      const { apiName } = body;
      if (!apiName) return res.status(400).json({ error: 'Missing apiName' });
      const raw   = await redis('GET', `api_usage:${apiName}`) as string | null;
      const count = parseInt(raw || '0', 10);
      return res.status(200).json({ ok: true, apiName, count, warning: count >= USAGE_THRESHOLD });
    }

    // ── MANAGER EVAL ────────────────────────────────────────────────────────

    if (action === 'set_eval') {
      const { sessionId, evaluation } = body;
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
      const val = typeof evaluation === 'string' ? evaluation : JSON.stringify(evaluation);
      await redis('SET', `manager_eval:${sessionId}`, val, 'EX', 3600); // 1h TTL
      return res.status(200).json({ ok: true });
    }

    if (action === 'get_eval') {
      const { sessionId } = body;
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
      const val = await redis('GET', `manager_eval:${sessionId}`) as string | null;
      let parsed: any = val;
      if (val) { try { parsed = JSON.parse(val); } catch { parsed = val; } }
      return res.status(200).json({ ok: true, sessionId, evaluation: parsed });
    }

    // ── ERROR LOG ───────────────────────────────────────────────────────────

    if (action === 'log_error') {
      const { apiName, errorMsg, agentRole } = body;
      const entry = JSON.stringify({ apiName, errorMsg, agentRole, ts: new Date().toISOString() });
      await redis('LPUSH', 'error_log:system', entry);
      await redis('LTRIM', 'error_log:system', 0, 49);
      return res.status(200).json({ ok: true });
    }

    if (action === 'get_error_log') {
      const { limit = 20 } = body;
      const items  = await redis('LRANGE', 'error_log:system', 0, limit - 1) as string[] | null;
      const errors = (items || []).map(i => { try { return JSON.parse(i); } catch { return { raw: i }; } });
      return res.status(200).json({ ok: true, errors });
    }

    // ── TELEMETRY SNAPSHOT (for AgentHealthPage) ───────────────────────────

    if (action === 'get_telemetry') {
      const usageKeys = KNOWN_APIS.map(n => `api_usage:${n}`);
      const values    = await redis('MGET', ...usageKeys) as (string | null)[];

      const counts: Record<string, number> = {};
      const warnings: string[] = [];
      KNOWN_APIS.forEach((name, i) => {
        const n = parseInt(values[i] || '0', 10);
        counts[name] = n;
        if (n >= USAGE_THRESHOLD) warnings.push(name);
      });

      const errorItems = await redis('LRANGE', 'error_log:system', 0, 29) as string[] | null;
      const errors     = (errorItems || []).map(i => { try { return JSON.parse(i); } catch { return { raw: i }; } });

      return res.status(200).json({ ok: true, counts, warnings, threshold: USAGE_THRESHOLD, errors });
    }

    // ── RESET USAGE (manual reset from health dashboard) ───────────────────

    if (action === 'reset_usage') {
      const keys = KNOWN_APIS.map(n => `api_usage:${n}`);
      await redis('DEL', ...keys);
      await redis('DEL', 'error_log:system');
      return res.status(200).json({ ok: true, reset: KNOWN_APIS });
    }

    return res.status(400).json({
      error: 'Invalid action',
      valid: ['store','retrieve','store_feedback','get_feedback','push_history','get_history',
              'track_usage','get_usage','set_eval','get_eval','log_error','get_error_log',
              'get_telemetry','reset_usage'],
    });

  } catch (error: any) {
    console.error('[Memory API]:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
