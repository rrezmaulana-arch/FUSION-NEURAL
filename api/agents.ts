// api/agents.ts — Single Entry: Frontend → Python Backend (Direct, No n8n)
// ═══════════════════════════════════════════════════════════════════════════
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL
  || 'https://confined-simple-handiwork.ngrok-free.dev';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const agentId = (req.body?.agent || 'frontliner') as string;
  const body = { ...req.body, action: 'chat', agent: agentId };

  try {
    const pythonRes = await fetch(`${PYTHON_BACKEND}/trigger-agent`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!pythonRes.ok) {
      const errBody = await pythonRes.json().catch(() => ({ raw: pythonRes.statusText }));
      return res.status(pythonRes.status).json({
        error:  'Python Backend mengembalikan error.',
        detail: errBody,
        hint:   'Pastikan Python FastAPI berjalan di port 8000 dan ngrok aktif.',
      });
    }

    const data = await pythonRes.json();
    return res.status(200).json(data);
    
  } catch (err: any) {
    return res.status(503).json({
      error:  'Python Backend tidak dapat dihubungi.',
      detail: err.message,
      hint:   'Pastikan ngrok aktif dan Python berjalan.',
    });
  }
}
