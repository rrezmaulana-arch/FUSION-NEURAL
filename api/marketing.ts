// api/marketing.ts — Thin proxy ke Python FastAPI backend
// Teks → /trigger-agent (agent: marketing)
// Gambar → /generate-image (HuggingFace FLUX.1-schnell)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type = 'text', prompt, tone, format, sessionId } = req.body || {};

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    let endpoint: string;
    let payload: object;

    if (type === 'image_gen') {
      // Gambar: delegasikan ke /generate-image di Python
      endpoint = `${PYTHON_BACKEND}/generate-image`;
      payload  = { prompt };
    } else {
      // Teks marketing: delegasikan ke /trigger-agent dengan agent=marketing
      endpoint = `${PYTHON_BACKEND}/trigger-agent`;
      payload  = {
        agent:     'marketing',
        message:   `Buat ${format || 'Caption Instagram'} dengan tone ${tone || 'premium'}: ${prompt}`,
        sessionId: sessionId || '',
      };
    }

    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    // Normalisasi respons agar kompatibel dengan frontend
    if (type === 'image_gen') {
      return res.status(response.ok ? 200 : response.status).json(data);
    } else {
      return res.status(response.ok ? 200 : response.status).json({
        type:     'text',
        provider: data.provider || 'mistral',
        result:   data.result   || data.output || '',
      });
    }
  } catch (err: any) {
    console.error('[marketing proxy] Error:', err.message);
    return res.status(500).json({ error: 'Python backend tidak dapat dihubungi.', detail: err.message });
  }
}
