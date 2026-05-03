// api/neural.ts — FusionNeural Frontline Sales AI (Groq Direct, Sync)
// Digunakan oleh OrderPage.tsx untuk chat penjualan real-time.
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const { messages, model = 'llama-3.3-70b-versatile', temperature = 0.72, max_tokens = 600, response_format } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    const body: any = { model, messages, temperature, max_tokens };
    if (response_format) body.response_format = response_format;

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      console.error('[neural] Groq error:', data);
      return res.status(502).json({ error: data.error?.message || 'Groq API error' });
    }

    return res.status(200).json(data); // OpenAI-compatible format
  } catch (err: any) {
    console.error('[neural] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
