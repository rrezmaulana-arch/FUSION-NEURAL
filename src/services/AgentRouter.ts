// ============================================================
// FUSIONEURAL — MULTI-AGENT CLIENT SDK
// src/services/AgentRouter.ts
//
// Use this from any React component or NeuralCore method
// to call the multi-agent backend without exposing API keys.
// ============================================================

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type AgentId = 'frontliner' | 'manager' | 'admin' | 'finance';
export type AdminTask = 'supplier_search' | 'format_json' | 'general';
export type ImageMode = 'premium' | 'fast';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  agent: AgentId;
  provider: string;
  result: string;
  memoryUsed: number;
  timestamp: string;
}

export interface MarketingTextResponse {
  type: 'text';
  provider: string;
  result: string;
}

export interface MarketingImageResponse {
  type: 'image';
  provider: string;
  imageBase64: string; // data:image/png;base64,...
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface SearchResponse {
  query: string;
  organic: SearchResult[];
  knowledgeGraph: any | null;
  topStories: any[];
  answerBox: any | null;
}

// ─────────────────────────────────────────────
// BASE FETCH WRAPPER
// ─────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as any;
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// AGENT ROUTER
// ─────────────────────────────────────────────

export class AgentRouter {

  // ── 1. FRONTLINER (Chat UI Instan) ─────────────────────────────────────
  // Groq → Cerebras → OpenRouter
  static async frontliner(
    messages: ChatMessage[],
    opts?: {
      temperature?: number;
      max_tokens?: number;
      response_format?: { type: 'json_object' | 'text' };
    }
  ): Promise<AgentResponse> {
    return apiFetch<AgentResponse>('/api/agents', {
      agent: 'frontliner',
      messages,
      ...opts,
    });
  }

  // ── 2. MANAGER (Strategi & Evaluasi) ───────────────────────────────────
  // Gemini → Mistral → OpenRouter
  // Automatically loads memory context and stores output.
  static async manager(
    messages: ChatMessage[],
    opts?: {
      temperature?: number;
      useMemory?: boolean;
      /** Set when evaluating another agent's output — triggers feedback storage */
      targetAgentId?: AgentId;
      /** Raw output of the agent being evaluated */
      previousOutput?: string;
    }
  ): Promise<AgentResponse> {
    return apiFetch<AgentResponse>('/api/agents', {
      agent: 'manager',
      messages,
      useMemory: opts?.useMemory ?? true,
      targetAgentId: opts?.targetAgentId,
      previousOutput: opts?.previousOutput,
      temperature: opts?.temperature,
    });
  }

  // ── 3. ADMIN (Riset & Data) ────────────────────────────────────────────
  // OpenRouter (supplier search) | Cohere → Mistral (JSON format) | OpenRouter (general)
  static async admin(
    messages: ChatMessage[],
    task: AdminTask = 'general',
    opts?: { temperature?: number; response_format?: { type: 'json_object' | 'text' } }
  ): Promise<AgentResponse> {
    return apiFetch<AgentResponse>('/api/agents', {
      agent: 'admin',
      messages,
      task,
      ...opts,
    });
  }

  // ── 4. FINANCE (Logika & Matematika) ───────────────────────────────────
  // DeepSeek → OpenRouter
  static async finance(
    messages: ChatMessage[],
    opts?: {
      temperature?: number;
      response_format?: { type: 'json_object' | 'text' };
    }
  ): Promise<AgentResponse> {
    return apiFetch<AgentResponse>('/api/agents', {
      agent: 'finance',
      messages,
      ...opts,
    });
  }

  // ── 5. MARKETING — Text ────────────────────────────────────────────────
  // HuggingFace/Mistral-7B → OpenRouter
  static async marketingText(prompt: string): Promise<MarketingTextResponse> {
    return apiFetch<MarketingTextResponse>('/api/marketing', {
      type: 'text',
      prompt,
    });
  }

  // ── 6. MARKETING — Image ───────────────────────────────────────────────
  // premium: Gemini → FLUX.1-schnell
  // fast:    FLUX.1-schnell → Gemini
  static async marketingImage(
    prompt: string,
    mode: ImageMode = 'premium'
  ): Promise<MarketingImageResponse> {
    return apiFetch<MarketingImageResponse>('/api/marketing', {
      type: 'image',
      prompt,
      imageMode: mode,
    });
  }

  // ── 7. SEARCH TOOL (Serper.dev) ────────────────────────────────────────
  static async search(
    query: string,
    opts?: { num?: number; gl?: string; hl?: string }
  ): Promise<SearchResponse> {
    return apiFetch<SearchResponse>('/api/search', {
      query,
      num: opts?.num ?? 5,
      gl:  opts?.gl  ?? 'id',
      hl:  opts?.hl  ?? 'id',
    });
  }

  // ── 8. MANAGER WITH RESEARCH ───────────────────────────────────────────
  // Convenience: search first, inject results, then call Manager
  static async managerWithResearch(
    userPrompt: string,
    systemPrompt: string,
    searchQuery?: string,
    opts?: { targetAgentId?: AgentId; previousOutput?: string }
  ): Promise<AgentResponse & { searchResults?: SearchResult[] }> {
    let searchContext = '';
    let searchResults: SearchResult[] = [];

    if (searchQuery) {
      try {
        const searchRes = await AgentRouter.search(searchQuery);
        searchResults = searchRes.organic.slice(0, 3);
        searchContext = searchResults.length > 0
          ? '\n\n=== HASIL RISET REAL-TIME (Serper.dev) ===\n' +
            searchResults.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.link}`).join('\n---\n')
          : '';
      } catch (err) {
        console.warn('[AgentRouter] Search failed, proceeding without:', err);
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt + searchContext },
      { role: 'user',   content: userPrompt },
    ];

    const response = await AgentRouter.manager(messages, {
      useMemory: true,
      ...opts,
    });

    return { ...response, searchResults };
  }
}
