import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy endpoint for Groq API to prevent exposing the API key on the frontend
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, model = 'llama-3.3-70b-versatile', response_format, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Internal Server Error: API Key missing' });
    }

    const payload: any = {
      model,
      messages,
      temperature: temperature ?? 0.7,
    };

    if (max_tokens) payload.max_tokens = max_tokens;
    if (response_format) payload.response_format = response_format;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to communicate with AI provider' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Neural proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
