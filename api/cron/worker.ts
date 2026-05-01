/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp, collection, addDoc } from 'firebase/firestore';

// ── Firebase Init ──────────────────────────────────────────────────────────
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

// ── Redis Helpers ──────────────────────────────────────────────────────────
const R_URL   = process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...args: (string | number)[]): Promise<any> {
  if (!R_URL || !R_TOKEN) return null;
  const path = args.map(a => encodeURIComponent(String(a))).join('/');
  try {
    const r = await fetch(`${R_URL}/${path}`, { headers: { Authorization: `Bearer ${R_TOKEN}` } });
    return (await r.json() as any).result;
  } catch { return null; }
}

async function setAgentStatus(agentId: string, status: 'IDLE' | 'WORKING') {
  await redis('SET', `agent_status:${agentId}`, status);
}

// ── AI Helpers ────────────────────────────────────────────────────────────
// We will call the internal /api/agents via fetch or direct import.
// Since this is Vercel Serverless, we can fetch our own endpoint or call the AI providers directly.
// To keep it clean, we'll fetch our own `/api/agents` or implement lightweight direct calls.
// Actually, it's safer to directly use fetch to the AI APIs to avoid recursive Vercel timeouts if we call ourselves.

async function callGemini(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
  };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Gemini Error: ${await r.text()}`);
  return (await r.json() as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function callOpenRouter(msgs: {role: string, content: string}[]) {
  const key = process.env.OPENROUTER_API_KEY;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini:free', messages: msgs, temperature: 0.5 }),
  });
  return (await r.json() as any).choices?.[0]?.message?.content || '';
}

async function callDeepSeek(msgs: {role: string, content: string}[]) {
  const key = process.env.DEEPSEEK_API_KEY;
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-reasoner', messages: msgs, temperature: 0.2 }),
  });
  return (await r.json() as any).choices?.[0]?.message?.content || '';
}

// ── MAIN WORKER ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow cron or internal fetch
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { action, input, sessionId } = req.body || req.query || {};

    // ── TRIGGER / PLAN PHASE ──
    if (action === 'trigger') {
      if (!input) return res.status(400).json({ error: 'Missing input for trigger' });
      await setAgentStatus('manager', 'WORKING');
      
      const managerSystem = `Kamu adalah Manager AI. Pecah instruksi user berikut menjadi sub-task JSON array. Format:
      {
        "tasks": [
          {
            "agent": "admin" | "finance" | "marketing",
            "task": "Deskripsi spesifik yang harus dilakukan",
            "payload": {}
          }
        ]
      }`;
      
      const rawPlan = await callGemini(managerSystem, input);
      const plan = JSON.parse(rawPlan.replace(/```json/g, '').replace(/```/g, '').trim());

      const tasksToQueue = plan.tasks || [];
      const session = sessionId || `sess_${Date.now()}`;
      
      for (const t of tasksToQueue) {
        const bgTask = {
          id: `task_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          sessionId: session,
          agent: t.agent,
          task: t.task,
          payload: t.payload || {},
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        await redis('RPUSH', 'queue:tasks', JSON.stringify(bgTask));
      }

      await setAgentStatus('manager', 'IDLE');
      return res.status(200).json({ ok: true, msg: 'Tasks planned and queued', count: tasksToQueue.length });
    }

    // ── EXECUTE PHASE ──
    // This is called by cron or polling to process 1 task from queue
    const rawTask = await redis('LPOP', 'queue:tasks');
    if (!rawTask) {
      return res.status(200).json({ ok: true, msg: 'Queue is empty' });
    }

    const taskData = JSON.parse(rawTask);
    const { agent, task, payload, sessionId: taskSession } = taskData;
    
    // Check if agent is busy (optional, but good for real autonomy)
    // Actually, setting it to working now.
    await setAgentStatus(agent, 'WORKING');

    let result = '';
    const messages = [
      { role: 'system', content: `Kamu adalah spesialis ${agent}. Selesaikan tugas: ${task}` },
      { role: 'user', content: JSON.stringify(payload || {}) }
    ];

    if (agent === 'admin') {
      result = await callOpenRouter(messages);
    } else if (agent === 'finance') {
      result = await callDeepSeek(messages);
    } else if (agent === 'marketing') {
      result = await callOpenRouter(messages); // fallback marketing
    } else {
      result = "Agent not found";
    }

    await setAgentStatus(agent, 'IDLE');

    // ── EVALUATE PHASE (Manager reflection) ──
    await setAgentStatus('manager', 'WORKING');
    const evalSystem = `Evaluasi hasil dari agen ${agent}. Apakah memenuhi tugas: "${task}"?
    Balas dengan JSON: {"status": "ok" | "revision", "feedback": "...", "finalResult": "..."}`;
    
    const evalResultRaw = await callGemini(evalSystem, result);
    let evalObj: any = {};
    try {
      evalObj = JSON.parse(evalResultRaw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      evalObj = { status: 'ok', finalResult: result };
    }

    if (evalObj.status === 'revision') {
      // Re-queue
      taskData.payload.feedback = evalObj.feedback;
      await redis('RPUSH', 'queue:tasks', JSON.stringify(taskData));
    } else {
      // Save final to Firestore
      await addDoc(collection(db, 'task_results'), {
        sessionId: taskSession,
        agent,
        task,
        result: evalObj.finalResult || result,
        completedAt: serverTimestamp()
      });
    }
    
    await setAgentStatus('manager', 'IDLE');

    return res.status(200).json({ ok: true, msg: `Processed task for ${agent}`, evaluation: evalObj });

  } catch (error: any) {
    console.error('[Worker Error]:', error);
    return res.status(500).json({ error: error?.message });
  }
}
