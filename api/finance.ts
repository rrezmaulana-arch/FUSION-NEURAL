// api/finance.ts — Thin proxy ke Python FastAPI backend
// Finance agent dengan retry otomatis ada di backend/main.py
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Pastikan agent = finance
    const payload = { ...req.body, agent: 'finance' };

    const response = await fetch(`${PYTHON_BACKEND}/trigger-agent`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err: any) {
    console.error('[finance proxy] Error:', err.message);
    return res.status(500).json({ error: 'Python backend tidak dapat dihubungi.', detail: err.message });
  }
}
