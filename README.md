# FusionNeural — Ekosistem Bisnis AI Otonom

Platform multi-agent AI pertama di Indonesia yang mengotomasi operasi bisnis dengan 4 agen AI otonom: Manager, Admin, Marketing, dan Finance.

## Arsitektur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend       │────▶│   Vite Proxy     │────▶│   Backend       │
│   React + Vite   │     │   (Dev Mode)     │     │   FastAPI       │
│   Port 5173      │     └──────────────────┘     │   Port 8001     │
└─────────────────┘                                └────────┬────────┘
                                                            │
                              ┌──────────────────────────────┼──────────────┐
                              │                              │              │
                        ┌─────▼─────┐  ┌──────────┐  ┌──────▼──────┐  ┌───▼───┐
                        │  Firebase  │  │  Redis   │  │  AI Providers│  │ MySQL │
                        │  Firestore │  │  Upstash │  │  Groq/Gemini │  │       │
                        └───────────┘  └──────────┘  └─────────────┘  └───────┘
```

### Agen AI

| Agen | Model Primary | Model Backup | Fungsi |
|------|---------------|--------------|--------|
| Manager | Gemini 2.5 Flash | Groq | Koordinasi, audit, review |
| Admin | Groq | Gemini | Inventaris, logistik, stok |
| Marketing | Mistral Large | Groq | Kampanye, konten, CRM |
| Finance | DeepSeek | Gemini | Akuntansi, pajak, laporan |
| Frontliner | Groq | Mistral | Sales, customer service |

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 8 (build tool)
- Tailwind CSS 3
- Framer Motion (animasi)
- Three.js (3D hero section)
- Zustand (state management)
- Firebase SDK (auth + Firestore)

**Backend:**
- Python 3.11 + FastAPI
- Uvicorn (ASGI server)
- Firebase Admin SDK (auth verification)
- Upstash Redis (memory/cache)
- httpx (async HTTP client)

**Infrastructure:**
- Docker + Docker Compose
- Nginx (reverse proxy + static serve)
- GitHub Actions (CI/CD)
- Vercel (frontend hosting alternatif)

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (opsional)

### 1. Clone & Install

```bash
git clone https://github.com/rrezmaulana-arch/FUSION-NEURAL.git
cd FUSION-NEURAL
npm install
cd backend && python -m venv venv && source venv/Scripts/activate && pip install -r requirements.txt
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env dengan API keys Anda
```

### 3. Development

```bash
# Jalankan frontend + backend bersamaan
npm run dev

# Atau terpisah:
npm run dev:ui      # Frontend di http://localhost:5173
npm run dev:backend # Backend di http://localhost:8001
```

### 4. Docker (Production)

```bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8001
```

## Testing

```bash
# Frontend tests (Vitest)
npm test

# Backend tests (pytest)
cd backend && python -m pytest
```

## API Documentation

Setelah backend jalan, buka:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Environment Variables

Lihat `.env.example` untuk daftar lengkap variabel yang dibutuhkan.

**Variabel wajib:**
- `VITE_FIREBASE_*` — Firebase client config
- `FIREBASE_BACKEND_EMAIL/PASS` — Firebase service account
- `GROQ_API_KEY` — Minimal 1 AI provider key
- `BACKEND_API_KEY` — Static auth key untuk backend

## Project Structure

```
FUSION-NEURAL/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Landing, Dashboard, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client, Firebase config
│   │   ├── lib/           # Utility libraries
│   │   └── sections/      # Landing page sections
│   ├── public/            # Static assets
│   └── index.html         # Entry point
├── backend/
│   ├── main.py            # FastAPI app + AI agents
│   ├── services/          # Auth, utilities
│   ├── routers/           # WebSocket routes
│   ├── integrations.py    # Third-party integrations
│   └── tests/             # pytest tests
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Docker orchestration
├── nginx.conf             # Nginx reverse proxy
└── .env.example           # Environment template
```

## Security

- Semua endpoint dilindungi Firebase JWT authentication
- Rate limiting: 60 request/menit per IP
- CORS dikonfigurasi untuk production domains
- Input validation di semua user-facing endpoints
- API keys tidak pernah di-expose ke frontend (kecuali VITE_ prefix)

## License

Copyright (c) 2026 Miftah Afreza Maulana. All rights reserved.
