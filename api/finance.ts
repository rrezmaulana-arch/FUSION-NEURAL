// api/finance.ts — Single Entry: n8n Facade → Python Backend
// ═══════════════════════════════════════════════════════════════════════════
// n8n dan Python HARUS dua-duanya hidup.
// Jika n8n mati → 503. Jika Python mati → n8n gagal → 502.
// Tidak ada fallback. Input 1, Output 1.
// ═══════════════════════════════════════════════════════════════════════════
import type { VercelRequest, VercelResponse } from '@vercel/node';

const N8N_WEBHOOK = process.env.N8N_CORE_WEBHOOK
  || 'https://confined-simple-handiwork.ngrok-free.dev/webhook/fusionneural-core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // Tambahkan penanda action agar n8n routing ke branch finance
  const body = { action: 'finance', agent: 'finance', prompt };

  let n8nRes: Response;
  try {
    n8nRes = await fetch(N8N_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (err: any) {
    return res.status(503).json({
      error:  'n8n tidak dapat dihubungi.',
      detail: err.message,
      hint:   'Pastikan ngrok aktif dan n8n berjalan di port 5678.',
    });
  }

  if (!n8nRes.ok) {
    const errBody = await n8nRes.json().catch(() => ({ raw: n8nRes.statusText }));
    return res.status(502).json({
      error:  'n8n gagal memproses request (kemungkinan Python backend mati).',
      status: n8nRes.status,
      detail: errBody,
      hint:   'Pastikan Python FastAPI berjalan di port 8000.',
    });
  }

  const data = await n8nRes.json();
  const p    = Array.isArray(data) ? (data[0]?.json ?? data[0]) : data;

  return res.status(200).json({
    agent:      'finance',
    provider:   p?.provider   || 'n8n→python',
    result:     p?.result     || p?.output || '',
    memoryUsed: p?.memoryUsed ?? 0,
    timestamp:  p?.timestamp  || new Date().toISOString(),
  });
}
