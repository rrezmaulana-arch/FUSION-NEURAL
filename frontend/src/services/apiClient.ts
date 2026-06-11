/**
 * Project: FUSION NEURAL
 * services/apiClient.ts — Updated dengan Firebase JWT Authentication (Solusi #1)
 *
 * PERUBAHAN KEAMANAN UTAMA:
 *   SEBELUM: Kirim static VITE_BACKEND_API_KEY (bocor di browser pengguna)
 *   SESUDAH: Kirim Firebase ID Token dinamis per sesi (tidak bisa dicuri)
 *
 * Arsitektur:
 *   Frontend React → [Firebase JWT Token] → Python FastAPI → Verifikasi via Firebase Admin SDK
 */
import { auth } from '../lib/firebase';

// Base URL dari environment variable Vite
const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined)
  ?? (import.meta.env.VITE_PYTHON_BACKEND_URL as string | undefined)
  ?? 'http://localhost:8001';

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

// ─── Auth Token Helper ────────────────────────────────────────────────────────

/**
 * Ambil Firebase ID Token dari sesi login aktif.
 * Token ini diverifikasi di backend via Firebase Admin SDK.
 * Refresh otomatis setiap 1 jam oleh Firebase SDK.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  try {
    const user = auth.currentUser;
    if (user) {
      // getIdToken(true) = force refresh jika token hampir expired
      const idToken = await user.getIdToken(true);
      return {
        ...baseHeaders,
        'Authorization': `Bearer ${idToken}`,
      };
    }
  } catch (err) {
    console.warn('[apiClient] Gagal ambil Firebase token:', err);
  }

  // Jika tidak ada user (belum login), kirim tanpa Authorization header
  // Backend akan menolak dengan 401 sesuai Firebase Security Rules
  return baseHeaders;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<TResponse>(
  path: string,
  payload: unknown,
  timeoutMs: number = 120_000,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
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
 * Kirim pesan ke salah satu agen AI.
 * Sekarang otomatis menyertakan Firebase JWT token.
 */
export async function triggerAgent(
  payload: AgentRequestPayload,
): Promise<AgentResponsePayload> {
  return apiFetch<AgentResponsePayload>('/trigger-agent', payload, 120_000);
}

/**
 * Generate gambar marketing via HuggingFace FLUX.1-schnell.
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
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/health`, {
      headers,
      signal: controller.signal,
    });
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
