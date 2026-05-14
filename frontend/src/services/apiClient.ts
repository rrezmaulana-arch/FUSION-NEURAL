/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
// src/services/apiClient.ts
// ─────────────────────────────────────────────────────────────────────────────
// FusionNeural — Direct API Client (Bypass Vercel 10s Timeout)
//
// Arsitektur baru:
//   Frontend React → LANGSUNG → Python FastAPI (via Ngrok/Cloud)
//   Tidak lagi melewati /api/* Vercel Serverless Functions untuk request LLM.
//
// Keuntungan:
//   - Tidak ada batas 10s timeout dari Vercel hobby tier
//   - Response streaming lebih mudah diimplementasikan di masa depan
//   - Lebih sedikit hop/latency jaringan
// ─────────────────────────────────────────────────────────────────────────────

// Base URL dari environment variable Vite.
// Pastikan VITE_API_URL ada di .env (contoh: https://xyz.ngrok-free.dev)
const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined)
  ?? (import.meta.env.VITE_PYTHON_BACKEND_URL as string | undefined)
  ?? 'http://localhost:8000';

// API secret — harus cocok dengan FUSIONNEURAL_API_SECRET di backend .env
// Kosongkan (atau tidak set) untuk mode dev lokal tanpa auth.
const API_SECRET: string = (import.meta.env.VITE_API_SECRET as string | undefined) ?? '';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface AgentRequestPayload {
  message: string;
  agent: string;
  sessionId?: string;
  task?: string;
  role?: string;
}

export interface AgentResponsePayload {
  agent: string;
  provider: string;
  result: string;
  attempts: number;
  timestamp: string;
}

export interface SearchRequestPayload {
  query: string;
  num?: number;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface SearchResponsePayload {
  query: string;
  organic: SearchResult[];
  answerBox?: Record<string, unknown>;
  knowledgeGraph?: Record<string, unknown>;
}

export interface ImageGenerationResponsePayload {
  base64: string;
  mimeType: string;
  provider: string;
}

export interface SimulatorTriggerPayload {
  action?: 'trigger' | 'reset' | 'finance' | 'marketing' | 'manager';
  orders?: number;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<TResponse>(
  path: string,
  payload: unknown,
  timeoutMs: number = 120_000, // 2 menit default — cukup untuk LLM generation
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Ngrok requires this header to bypass the browser warning page
        'ngrok-skip-browser-warning': 'true',
        // Backend auth guard — matches FUSIONNEURAL_API_SECRET in .env
        ...(API_SECRET ? { 'X-API-Key': API_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail: string;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail ?? errJson.error ?? response.statusText;
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(`[API ${response.status}] ${errorDetail}`);
    }

    return response.json() as Promise<TResponse>;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Request timeout setelah ${timeoutMs / 1000}s. Backend AI mungkin sedang sibuk.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Public API Methods ───────────────────────────────────────────────────────

/**
 * Kirim pesan ke salah satu agen AI (Admin, Finance, Marketing, Manager, dll).
 * Langsung menembak Python FastAPI, tidak melewati Vercel /api/agents.ts.
 */
export async function triggerAgent(
  payload: AgentRequestPayload,
): Promise<AgentResponsePayload> {
  return apiFetch<AgentResponsePayload>('/trigger-agent', payload, 120_000);
}

/**
 * Generate gambar marketing via HuggingFace FLUX.1-schnell.
 * Timeout 120 detik karena model bisa cold-start lambat.
 */
export async function generateImage(
  prompt: string,
): Promise<ImageGenerationResponsePayload> {
  return apiFetch<ImageGenerationResponsePayload>(
    '/generate-image',
    { prompt },
    120_000,
  );
}

/**
 * Cari supplier/produk menggunakan Serper Google Search.
 */
export async function searchSupplier(
  payload: SearchRequestPayload,
): Promise<SearchResponsePayload> {
  return apiFetch<SearchResponsePayload>('/search', payload, 15_000);
}

/**
 * Trigger simulator (admin autopilot, finance run, dll).
 */
export async function triggerSimulator(
  payload: SimulatorTriggerPayload,
): Promise<unknown> {
  const action = payload.action ?? 'trigger';
  return apiFetch<unknown>(`/simulator/${action}`, payload, 60_000);
}

/**
 * Health check — cek apakah Python backend aktif.
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal: controller.signal,
    });
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
