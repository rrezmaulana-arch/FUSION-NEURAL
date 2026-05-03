// ============================================================
// FUSIONEURAL — MARKETING AGENT (Visual & Copywriting)
// • Teks Promosi : Hugging Face (Mistral-7B-Instruct-v0.3)
// • Gambar Cepat : Hugging Face (FLUX.1-schnell) [BACKUP]
// • Gambar Premium: Gemini Imagen (gemini-2.0-flash-preview-image-generation) [UTAMA]
// Vercel Serverless Function — api/marketing.ts
// ============================================================

/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Redis agent status helper ─────────────────────────────────────────────
const R_URL   = process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
async function setAgentStatus(status: 'WORKING' | 'IDLE'): Promise<void> {
  if (!R_URL || !R_TOKEN) return;
  try {
    await fetch(`${R_URL}/${encodeURIComponent('SET')}/${encodeURIComponent('agent_status:marketing')}/${encodeURIComponent(status)}`, {
      headers: { Authorization: `Bearer ${R_TOKEN}` },
    });
    if (status === 'WORKING') {
      await fetch(`${R_URL}/${encodeURIComponent('EXPIRE')}/${encodeURIComponent('agent_status:marketing')}/30`, {
        headers: { Authorization: `Bearer ${R_TOKEN}` },
      });
    }
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────
// HELPER: Call Hugging Face Inference API (Text)
// ─────────────────────────────────────────────
async function callHuggingFaceText(prompt: string): Promise<string> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HF_TOKEN not configured');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.8,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace Text Error: ${err}`);
  }

  const data = await response.json() as any;
  // HF inference returns array of generated_text objects
  const text = Array.isArray(data)
    ? data[0]?.generated_text?.trim()
    : data?.generated_text?.trim();

  return text || 'Konten berhasil dibuat.';
}

// ─────────────────────────────────────────────
// HELPER: Generate image via HuggingFace FLUX.1-schnell (BACKUP)
// Returns base64-encoded PNG
// ─────────────────────────────────────────────
async function callHuggingFaceImage(prompt: string): Promise<string> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HF_TOKEN not configured');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace Image Error: ${err}`);
  }

  // Response is raw binary PNG
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

// ─────────────────────────────────────────────
// HELPER: Generate image via Gemini Imagen [UTAMA]
// Uses gemini-2.0-flash-preview-image-generation via REST
// Returns base64-encoded PNG
// ─────────────────────────────────────────────
async function callGeminiImage(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = 'gemini-2.0-flash-preview-image-generation';
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Image Error: ${err}`);
  }

  const data = await response.json() as any;
  const parts = data?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Gemini returned no image data');
}

// ─────────────────────────────────────────────
// HELPER: OpenRouter fallback (general purpose)
// ─────────────────────────────────────────────
async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fusion-neural.vercel.app',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter Fallback Error: ${err}`);
  }

  const data = await response.json() as any;
  return data?.choices?.[0]?.message?.content?.trim() || 'Konten fallback berhasil.';
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// POST /api/marketing
// Body:
//   type: "text" | "image"
//   prompt: string
//   imageMode?: "premium" | "fast"   (default: "premium")
// ─────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { type = 'text', prompt, imageMode = 'premium' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing required field: prompt' });
  }

  // ── TEXT GENERATION ──────────────────────────────────────────────────────────────
  if (type === 'text') {
    await setAgentStatus('WORKING');
    let result: string;
    let provider = 'HuggingFace/Mistral-7B';

    try {
      result = await callHuggingFaceText(prompt);
    } catch (primaryErr: any) {
      console.warn('[Marketing Text] HF primary failed, falling back to OpenRouter:', primaryErr.message);
      provider = 'OpenRouter/gpt-4o-mini (fallback)';
      try {
        result = await callOpenRouter(prompt);
      } catch (fallbackErr: any) {
        await setAgentStatus('IDLE');
        return res.status(502).json({
          error: 'All text providers failed',
          primary_error: primaryErr.message,
          fallback_error: fallbackErr.message,
        });
      }
    }

    await setAgentStatus('IDLE');
    return res.status(200).json({ type: 'text', provider, result });
  }

  // ── IMAGE GENERATION ──────────────────────────────────────────────────────────────
  if (type === 'image') {
    await setAgentStatus('WORKING');
    let imageBase64: string;
    let provider: string;

    if (imageMode === 'premium') {
      // PRIMARY: Gemini Imagen
      try {
        imageBase64 = await callGeminiImage(prompt);
        provider    = 'Gemini/gemini-2.0-flash-preview-image-generation';
      } catch (primaryErr: any) {
        console.warn('[Marketing Image] Gemini failed, falling back to FLUX.1-schnell:', primaryErr.message);
        // BACKUP: HuggingFace FLUX.1-schnell
        try {
          imageBase64 = await callHuggingFaceImage(prompt);
          provider    = 'HuggingFace/FLUX.1-schnell (fallback)';
        } catch (fallbackErr: any) {
          return res.status(502).json({
            error: 'All image providers failed',
            primary_error: primaryErr.message,
            fallback_error: fallbackErr.message,
          });
        }
      }
    } else {
      // FAST mode: HuggingFace FLUX.1-schnell directly
      try {
        imageBase64 = await callHuggingFaceImage(prompt);
        provider    = 'HuggingFace/FLUX.1-schnell';
      } catch (err: any) {
        console.warn('[Marketing Image] FLUX failed, trying Gemini:', err.message);
        try {
          imageBase64 = await callGeminiImage(prompt);
          provider    = 'Gemini/gemini-2.0-flash-preview-image-generation (fallback)';
        } catch (fallbackErr: any) {
          return res.status(502).json({
            error: 'All image providers failed',
            primary_error: err.message,
            fallback_error: fallbackErr.message,
          });
        }
      }
    }

    await setAgentStatus('IDLE');
    return res.status(200).json({ type: 'image', provider, imageBase64: imageBase64! });
  }

  return res.status(400).json({ error: 'Invalid type. Use: text | image' });
}
