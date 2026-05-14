# 🧠 FUSION NEURAL — PROJECT PROGRESS & STRUCTURE

**Owner**: Reza Moetia (Sutradara)  
**AI Strategist**: Antigravity (Google DeepMind)  
**Last Updated**: 2026-05-12 (V3.0 — Full Firebase Migration)  
**Version**: 3.0

> **Sumber Kebenaran Tunggal**: File ini adalah satu-satunya referensi struktur proyek.
> File `.agents.md` di root sudah **dihapus** — semua dokumen ada di folder `.agents/` ini.

---

## 🗂️ STRUKTUR FOLDER LENGKAP

```
FUSION NEURAL/
│
├── .agents/                          # 📁 DOKUMEN STRATEGIS & PANDUAN AI
│   ├── PROJECT_PROGRESS.md           # ← FILE INI: status, struktur, skema
│   ├── NEURAL_EVOLUTION.md           # Rencana evolusi sistem (V2 roadmap)
│   ├── OWNER_STRATEGY.md             # Dokumen pitch 76-poin untuk investor/owner
│   └── skills/                       # (Kosong — skill Supabase sudah dihapus)
│
├── frontend/                         # ✅ SELURUH KODE FRONTEND (React + Vite)
│   ├── index.html
│   ├── vite.config.ts                # Konfigurasi Vite + path alias firebase-mock
│   ├── tailwind.config.js
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   │
│   └── src/
│       ├── main.tsx                  # Entry point React
│       ├── App.tsx                   # Root component + Router + AuthProvider
│       ├── index.css                 # Global styles + Tailwind directives
│       │
│       ├── assets/                   # Media lokal (logo, foto tim)
│       ├── config/
│       │   └── pricing.ts            # Data paket harga (3 tier × 2 otonomi)
│       ├── context/
│       │   ├── AuthContext.tsx       # Firebase Auth state global
│       │   └── LanguageContext.tsx   # Multi-bahasa (ID/EN)
│       ├── data/
│       │   └── content.ts            # Copy teks Landing Page
│       ├── lib/
│       │   ├── firebase.ts           # ✅ Firebase client init (auth, db, analytics)
│       │   └── firebase-mock.ts      # Vite alias — re-exports firebase/firestore
│       ├── services/
│       │   ├── NeuralCore.ts         # ✅ Core AI orchestration (Firestore-based)
│       │   ├── apiClient.ts          # HTTP client → Python FastAPI
│       │   └── FirebaseLogger.ts     # ✅ Log agent actions ke Firestore audit_logs
│       ├── stores/                   # Zustand global state (4 role)
│       │   ├── useManagerStore.ts
│       │   ├── useAdminStore.ts
│       │   ├── useFinanceStore.ts
│       │   ├── useMarketingStore.ts
│       │   └── useSimulatorStore.ts
│       ├── components/
│       │   ├── auth/ProtectedRoute.tsx
│       │   ├── chat/ChatBot.tsx       # ✅ Realtime via Firebase Firestore onSnapshot
│       │   ├── cursor/MicrochipCursor.tsx
│       │   ├── three/HeroScene.tsx
│       │   ├── tutorial/NeuralGuide.tsx
│       │   └── ui/ (NavBar, Footer, PageHeader, GlobalScrollOrb)
│       ├── sections/                 # Seksi Landing Page (Hero, Pricing, CTA, dll)
│       └── pages/
│           ├── LandingPage.tsx
│           ├── LoginPage.tsx         # Firebase email login
│           ├── OrderPage.tsx
│           ├── DashboardPage.tsx     # Layout sidebar multi-role
│           └── dashboards/
│               ├── manager/          # 8 halaman
│               ├── admin/            # 6 halaman
│               ├── finance/          # 6 halaman
│               ├── marketing/        # 7 halaman
│               └── owner/            # 1 halaman (OrderLeadsPage)
│
├── backend/                          # 🐍 PYTHON FASTAPI BACKEND
│   ├── main.py                       # Server utama FastAPI — semua endpoint AI
│   ├── integrations.py               # Twilio, Instagram, Google Drive/Sheets, Serper
│   ├── patch_security.py             # Security patch utilities
│   ├── business_logic.json           # Konfigurasi aturan bisnis & jadwal otonom
│   ├── gcp-credentials.json          # 🔐 GCP service account (RAHASIA, gitignored)
│   ├── google_drive_credentials.json # 🔐 Google Drive OAuth (RAHASIA, gitignored)
│   ├── requirements.txt              # Python dependencies
│   ├── SETUP.md                      # Panduan setup backend
│   └── venv/                         # Python virtual environment
│
├── dist/                             # Build output Vite (auto-generated, gitignored)
├── node_modules/                     # NPM packages (gitignored)
│
├── .env                              # 🔐 Environment variables (gitignored)
├── .gitignore
├── package.json                      # NPM scripts & dependencies
├── firestore.rules                   # Aturan keamanan Firestore
├── vercel.json                       # Konfigurasi deploy Vercel (SPA rewrite)
├── skills-lock.json                  # Skills registry (kosong — Supabase dihapus)
├── pyrefly.toml / pyrightconfig.json # Python type checker config
├── ngrok.exe                         # Ngrok binary untuk tunnel lokal
├── MULAI_SISTEM.bat                  # Script Windows untuk start semua service
└── README.md
```

---

## 🔥 TECH STACK (100% Firebase)

### Frontend
| Layer | Tech | Versi |
|-------|------|-------|
| Framework | React | 19.2 |
| Build | Vite | 8.0 |
| Language | TypeScript | 6.0 |
| Styling | TailwindCSS | 3.4 |
| Animation | Framer Motion | 12.38 |
| State | Zustand | 5.0 |
| Routing | React Router DOM | 7.14 |

### Backend
| Layer | Tech | Catatan |
|-------|------|---------|
| API Server | Python FastAPI | `backend/main.py` — port 8000 |
| AI Primary | Gemini 2.0 Flash | Manager agent |
| AI Multi | Groq, DeepSeek, Mistral, Cerebras, OpenRouter | Per-agent routing |
| Image Gen | HuggingFace FLUX.1-schnell | Via Inference API |
| Search | Serper API | Google Search untuk supplier |
| Tunnel | Ngrok | Expose localhost:8000 |

### Database — SINGLE FIREBASE ARCHITECTURE
| Service | Fungsi |
|---------|--------|
| **Firebase Firestore** | Satu-satunya database — semua data, realtime, AI config |
| **Firebase Auth** | Login email/password, role detection dari email prefix |
| **Firebase Admin SDK** | Backend Python update Firestore langsung |

> ✅ **Tidak ada Supabase** — migrasi selesai 2026-05-12

---

## 🔑 ENVIRONMENT VARIABLES (`.env` di root)

```env
# Firebase (Frontend — Vite)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Backend Connection
VITE_API_URL=https://confined-simple-handiwork.ngrok-free.dev
VITE_API_SECRET=fusion-neural-secret-key-2026
BACKEND_API_KEY=fusion-neural-secret-key-2026

# AI Providers (Backend)
GROQ_API_KEY=...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
MISTRAL_API_KEY=...
CEREBRAS_API_KEY=...
OPENROUTER_API_KEY=...
HF_TOKEN=...
SERPER_API_KEY=...

# Memory (Upstash Redis)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Integrations
MIDTRANS_SERVER_KEY=...
TELEGRAM_BOT_TOKEN=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
INSTAGRAM_APP_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

---

## 🔥 FIRESTORE SCHEMA (Semua Collection)

| Collection | Field Utama | Dikelola Oleh |
|------------|-------------|---------------|
| `neural_configs` | `role, prompt` | NeuralCore.ts — system prompts agen |
| `agent_health` | `agent_id, status, total_tasks_completed, average_latency_ms, last_active` | Backend Firebase Admin SDK |
| `system_config` | `autonomous_mode: {value: "ON"\|"OFF"}` | Backend — toggle autonomous loop |
| `realtime_signals` | `agent, status, message, created_at` | Backend — live feed aktivitas agen |
| `audit_logs` | `agent, action_type, legal_protocol, details, timestamp` | FirebaseLogger.ts |
| `inventory` | `sku, name, category, qty, min_stock, cost_price, selling_price` | Admin role |
| `orders` | `product, price, address, time, status` | Admin OrderStream |
| `order_leads` | `customer_name, whatsapp_number, package_tier, status, ai_notes` | Owner role |
| `finance_transactions` | `type, gross_amount, ppn_tax, pph_tax, net_amount, description` | Finance role |
| `marketing_campaigns` | `campaign_name, platform, content, budget, status` | Marketing role |
| `market_signals` | `source, sentiment, insight, detected_at` | Admin SupplySignals |
| `activity_logs` | `type, message, timestamp` | Manager dashboard |
| `executive_summaries` | `summary_text, action_items` | Manager ExecutiveSummary |

**Realtime `onSnapshot`**: `agent_health`, `realtime_signals`, `inventory`, `order_leads`

---

## 🤖 AGENT SYSTEM

| Agent ID | Role | Provider Utama | Backup |
|----------|------|---------------|--------|
| `manager` | Manager | Gemini 2.0 Flash | Groq |
| `admin` | Admin | OpenRouter GPT-OSS | Cerebras |
| `finance` | Finance | DeepSeek | Groq |
| `marketing` | Marketing | Mistral Large | OpenRouter |
| `frontliner` | Sales/Frontliner | Cerebras | Mistral |

Prompts disimpan di Firestore `neural_configs/{agent_id}`. Manager AI bisa auto-patch prompt agen lain via `NeuralCore.applyNeuralPatch()`.

---

## 🔌 BACKEND API ENDPOINTS

| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/trigger-agent` | Kirim pesan ke AI agent (utama) |
| POST | `/generate-image` | Generate gambar via HuggingFace FLUX |
| POST | `/search` | Supplier search via Serper |
| POST | `/api/autonomous/toggle` | Toggle autonomous heartbeat ON/OFF |
| GET | `/api/agent/progress` | RPG stats semua agen (rank, EXP, tasks) |
| POST | `/api/agent/progress` | Update EXP agen setelah task selesai |
| POST | `/api/drive/upload` | Simpan konten ke Google Drive |
| GET | `/health` | Health check |

---

## ✅ FITUR YANG SUDAH SELESAI

### Foundation
- [x] React + Vite + TypeScript + TailwindCSS
- [x] Firebase Auth (email/password, role dari email prefix)
- [x] ✅ **Full Firebase Firestore** — migrasi dari Supabase selesai
- [x] Zustand stores (4 role agen)
- [x] Protected route + sidebar multi-role

### Landing Page
- [x] HeroSection + Three.js 3D scene
- [x] AgentsSection, TechStackSection, PricingSection, CTASection
- [x] MicrochipCursor, GlobalScrollOrb
- [x] NeuralGuide — tutorial gamified interaktif per role (28 halaman)
- [x] ChatBot widget floating (Firestore realtime)

### Dashboard (28 Halaman)
- [x] Manager: Orchestrator, ExecutiveSummary, StrategicAudit, NeuralSettings, WarRoom
- [x] Admin: InventoryTracker, OrderStream, SupplierHub, SupplySignals, MarketplaceSim
- [x] Finance: ProfitLedger, OperationalBurn, ROIIntelligence, TaxCalculator, WorldMoney, FinancialPolicy
- [x] Marketing: CampaignForge, ContentLaunchpad, LaunchSimulator, ConversionFeedback, MarketSignals, ImageStudio, BrandDNA
- [x] Owner: OrderLeads

### Backend FastAPI
- [x] Multi-agent AI dengan primary + backup provider
- [x] Finance auto-retry jika harga Rp 0
- [x] Firebase Admin SDK (agent_health, system_config, realtime_signals)
- [x] Redis memory (Upstash) untuk conversation history
- [x] RPG progression system (EXP, rank: Trainee → Overlord)
- [x] Autonomous heartbeat loop (ON/OFF via Firestore)
- [x] Webhook Instagram + Twilio WhatsApp + Google Drive/Sheets
- [x] Ngrok tunnel + Vercel deploy

---

## 🔴 NEXT STEPS / BACKLOG

| Item | Prioritas |
|------|-----------|
| Midtrans payment gateway backend (endpoint ada, key belum diisi) | 🔴 Tinggi |
| Neural patch system — Manager AI auto-update prompt agen lain | 🟡 Medium |
| Vercel serverless → full FastAPI routing | 🟡 Medium |

---

## 🚨 CATATAN TEKNIS PENTING

| Item | Keterangan |
|------|------------|
| `lib/firebase.ts` | Firebase client — jangan hapus, dipakai Auth + Firestore di semua halaman |
| `backend/gcp-credentials.json` | JANGAN di-commit ke Git (sudah di `.gitignore`) |
| `VITE_API_URL` | Ganti setiap kali URL Ngrok berubah (atau pakai domain tetap) |
| `AuthContext.tsx` | Role = email prefix: `manager@...` → role `manager` |
| `firebase-mock.ts` | Vite alias re-export firebase/firestore — jangan hapus |

---

## 📋 CHANGELOG

| Tanggal | Perubahan | File Terdampak |
|---------|-----------|----------------|
| 2026-05-12 | **V3.0 FULL FIREBASE MIGRATION**: Hapus Supabase dari semua file. Hapus `supabase_schema.sql`, skills Supabase, `replace_logger.js`. Update `.agents.md` → digabung ke file ini | `.env`, `backend/`, `skills-lock.json`, `.agents/skills/` |
| 2026-05-12 | Konsolidasi docs: `.agents.md` root dihapus, semua doc dipusatkan ke `.agents/PROJECT_PROGRESS.md` | `.agents.md` |
| 2026-05-11 | V2 Neural Evolution: Walking Paths, Immersive Audio, RPG Progression | `AgentOrchestratorPage.tsx`, `main.py` |
| 2026-05-11 | Backend: GET/POST `/api/agent/progress` — EXP otomatis naik | `backend/main.py` |
| 2026-05-10 | Complete NeuralGuide rewrite: Neon Trace system, 28-page deep-dive | `NeuralGuide.tsx` |
| 2026-05-09 | Instagram webhook, autonomous heartbeat loop | `main.py`, `integrations.py` |

---

*Dokumen ini dikelola oleh Antigravity (Google DeepMind) — Sumber kebenaran tunggal FUSION NEURAL*
