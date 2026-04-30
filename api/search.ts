// ============================================================
// FUSIONEURAL — SERPER.DEV REAL-TIME SEARCH TOOL
// Vercel Serverless Function — api/search.ts
// ============================================================

/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { query, num = 5, gl = 'id', hl = 'id' } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing required field: query' });
  }

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SERPER_API_KEY not configured' });
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num, gl, hl }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Serper Error]:', errText);
      return res.status(response.status).json({ error: 'Search provider error', detail: errText });
    }

    const data = await response.json() as any;

    // Return structured results: organic links + knowledge graph
    return res.status(200).json({
      query,
      organic:        data.organic       || [],
      knowledgeGraph: data.knowledgeGraph || null,
      topStories:     data.topStories    || [],
      answerBox:      data.answerBox     || null,
    });

  } catch (error: any) {
    console.error('[Search API Error]:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
