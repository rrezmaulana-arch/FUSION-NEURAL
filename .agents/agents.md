# Fusion Neural — Ultimate Architecture, Purpose & Progress Protocol

## 1. Visi & Tujuan Utama (Ultimate Web Purpose)
**Tujuan Esensial:** Fusion Neural adalah "Autonomous B2B Management Suite" berskala enterprise. Ini bukan sekadar alat pencatat atau *dashboard* analitik biasa.
**Fungsi Inti:** Menggantikan peran manajerial manusia dengan agen AI yang bekerja secara otonom di latar belakang. Manusia tidak lagi mengeklik form untuk memproses *invoice* atau mengubah status inventaris. Manusia (Manager) hanya perlu mengetik perintah natural (contoh: *"AI Finance, tolong buatkan invoice palsu untuk testing bulan ini, dan AI Admin tolong restock barang X"*).
Sistem akan memecah teks tersebut menjadi **tugas Kanban (Neural Tasks)** dan **Payload eksekusi (Pending Approvals)** yang akan menunggu di *Strategic Audit Hub* untuk disetujui manusia.

## 2. Struktur Tech Stack & Framework (Super Detail)

### A. Frontend (The Command Suite)
- **Framework Utama:** React 18 menggunakan *build tool* Vite (ditulis 100% dalam TypeScript).
- **Styling & UI/UX:** 
  - Tidak menggunakan *utility classes* standar seperti Tailwind secara penuh untuk komponen *core glassmorphism*.
  - Mengandalkan **Vanilla CSS (index.css)** dengan *CSS Variables* untuk menciptakan efek tembus pandang tingkat tinggi (`backdrop-filter: blur()`, `rgba` transparan, dan `radial-gradient`).
  - Menggunakan **Framer Motion** (`motion.div`) untuk animasi UI yang *fluid* (contoh: *hover state*, *entry animations*, dan animasi simulasi pergerakan *agent* di `WalkingCanvas`).
- **Icons:** Eksklusif menggunakan `lucide-react` (bersih, minimalis, dan vektor murni).
- **Routing:** `react-router-dom` v6. Menu diletakkan pada `Sidebar.tsx` yang memfasilitasi perpindahan mulus antardepartemen.
- **State Management:** *React Hooks* (`useState`, `useEffect`) yang digabungkan secara *real-time* dengan *listener* Firestore (`onSnapshot`).

### B. Backend (The Neural Core)
- **Framework Utama:** Python 3.x dengan **FastAPI** (performa asinkron tinggi).
- **Server:** `uvicorn` berjalan di *port* 8000.
- **Database:** Google Cloud Platform (GCP) - **Firestore (Firebase)**.
- **Metode Koneksi Database:** Menggunakan **REST API Kustom (`FirestoreRESTClient`)**. Ini keputusan arsitektural krusial untuk menghindari konflik instalasi *library* `grpcio` milik Google yang sering *crash* di sistem operasi Windows. Autentikasi dilakukan dengan menyuntikkan *token* dari `gcp-credentials.json`.
- **Otak AI (LLM Integration):** Menggunakan `google-genai` (Gemini 2.5 Flash / 1.5 Pro) sebagai pemroses utama logika *prompt* manusia menjadi JSON (terpusat di fungsi `handle_orchestration`).

### C. Alur Komunikasi Data (Data Flow)
1. **User Input:** Manager mengetik di *Agent Orchestrator Page*.
2. **API Call:** Frontend mem-POST ke `/api/orchestrate` di Backend.
3. **LLM Processing:** Backend mengirim *prompt* beserta *system rules* ke Gemini. Gemini membalas dengan struktur JSON berisikan `tasks` dan `approvals`.
4. **Database Write:** Backend menulis langsung JSON tersebut ke koleksi `neural_tasks` dan `pending_approvals` di Firestore melalui HTTP PATCH/POST.
5. **Real-time Reactivity:** Frontend yang menggunakan `onSnapshot` langsung mendeteksi perubahan di database. Animasi UI (seperti indikator *"ON TASK"*) langsung menyala tanpa perlu *refresh* halaman.

## 3. Current State of the Ecosystem
Fusion Neural has officially transitioned from a standard UI/UX dashboard into a **High-Fidelity Autonomous AI Command Center**. The web is no longer just visualizing data; it is actively orchestrating AI agents to perform real business logic.

## The Direction (Where we are heading)
1. **Autonomous Workflow Orchestration**
   - The user inputs natural language commands (e.g., "Run a marketing campaign" or "Generate an invoice").
   - The backend (`/api/orchestrate`) uses LLMs (like Gemini/Groq) to intelligently break this down into actionable Kanban tasks (`neural_tasks`).
   - If the task requires modifying code, sending emails, or executing financial transactions, the AI generates a JSON payload for approval.

2. **Strict Human-in-the-Loop (HITL) Governance**
   - We have abandoned fully autonomous execution for critical actions.
   - The **Strategic Audit Hub** serves as a "Virtual Meeting Room".
   - AI agents (Admin, Finance, Marketing) submit their code changes or actions to the `pending_approvals` collection.
   - A human Manager must review the JSON payload, then either click **Approve & Deploy** or **Reject & Scold** (sending angry feedback directly back to the AI's memory).

3. **Domain-Restricted AI (Security Guardrails)**
   - **AI Admin:** Only handles inventory, products, and supplier restocking.
   - **AI Finance:** Only handles ledgers, invoices, and budget locks. Cannot modify marketing code.
   - **AI Marketing:** Generates ad copy and handles UX textual modifications.
   - **AI Manager:** The ultimate delegator.
   - Security warnings are visually embedded into the UI to remind human operators of these boundaries before approving actions.

4. **Real-Time Data Consumption (No More Dummies)**
   - The web now consumes 100% real data from Google Cloud Firestore.
   - Even "fake" data (like Beta invoices) are legitimately generated by the AI backend and stored in the database, meaning the frontend always reflects actual database state.

## Core UI Paradigm
- **Glassmorphism & High-End Sci-Fi Aesthetics:** Heavy use of translucent gradients, blurs, and neon accents.
- **Dynamic Gamification:** Agents have RPG-style stats (Stamina, EXP, Level) and their visual state changes automatically based on active database tasks (e.g., `ON TASK` vs `RECHARGING`).

## 5. Arsitektur Folder Frontend & Backend (Mapping Ekstensif)
```text
/FUSION NEURAL
├── /.agents/                  # KNOWLEDGE BASE AI (File Ini)
│   ├── agents.md              # Visi, Tujuan, Flow Data, Arsitektur Inti
│   ├── cloud.md               # Struktur Firestore & GCP Credentials config
│   ├── design.md              # Aturan UI/UX, Glassmorphism, Palet Warna
│   ├── gemini.md              # Dokumentasi orkestrasi LLM backend
│   ├── pertanyaan.md          # RIWAYAT LOG MENTAL & PERTANYAAN OWNER (100KB)
│   └── /skills/               # Aturan ketat pemisahan departemen & integrasi UI frontend
│
├── /backend/                  # OTAK FASTAPI SERVER
│   ├── main.py                # File Induk API (/api/orchestrate, /api/midtrans, FirestoreRESTClient)
│   ├── integrations.py        # Wrapper untuk pemanggilan API pihak ke-3 (LLM)
│   ├── seed_firebase.py       # Skrip isolasi untuk injeksi data dummy awal ke Firestore
│   └── gcp-credentials.json   # Kunci rahasia server GCP (Jangan pernah di-push ke GitHub!)
│
└── /frontend/                 # WAJAH APLIKASI (REACT VITE)
    ├── /src/
    │   ├── /components/       # Komponen UI Reusable (Header.tsx, Sidebar.tsx, dll)
    │   ├── /hooks/            # Logika reaktif kustom (useFirestore.ts, useAgentAudio.ts)
    │   ├── /pages/            # HALAMAN UTAMA DASHBOARD
    │   │   ├── DashboardPage.tsx         # Root Layout pengatur tata letak & Menu
    │   │   ├── /dashboards/
    │   │       ├── /admin/               # DOMAIN AI ADMIN (Ungu)
    │   │       │   ├── InventoryTrackerPage.tsx  # Cek stok barang secara real-time
    │   │       │   └── OrderStreamPage.tsx       # Alur pesanan pelanggan
    │   │       ├── /finance/             # DOMAIN AI FINANCE (Hijau)
    │   │       │   ├── ProfitLedgerPage.tsx      # Laporan keuangan & neraca 
    │   │       │   └── BankReconPage.tsx         # Rekonsiliasi mutasi bank
    │   │       ├── /marketing/           # DOMAIN AI MARKETING (Pink)
    │   │       │   └── ImageStudioPage.tsx       # Studio kreatif AI Marketing
    │   │       ├── /manager/             # DOMAIN UTAMA: MANAGER CMD (Biru & Amber)
    │   │       │   ├── AgentOrchestratorPage.tsx # Pusat perintah AI bergaya RPG (Gamifikasi UI)
    │   │   │   │   ├── NeuralTasksPage.tsx       # Papan Kanban Tugas AI
    │   │       │   └── StrategicAuditPage.tsx    # "Ruang Rapat" HITL (Approve/Reject tindakan AI)
    │   └── index.css                     # NYAWA DARI GLASSMORPHISM & ANIMASI CSS
```

## 7. Development Changelog & Progress Log
*Log history of what was added, changed, or created.*

**[Mei 2026] - Phase: Governance & Orchestration Hardening**
- **Dibuat (Created):** 
  - `StrategicAuditPage.tsx` (Virtual AI Meeting Room untuk *Human-in-the-loop*).
  - Standalone `seed_firebase.py` (Seeder mandiri menggunakan REST API, memisahkan dependency dari `main.py`).
  - `.agents/pertanyaan.md` (Pemulihan riwayat pertanyaan owner web).
- **Diubah (Changed):** 
  - `AgentOrchestratorPage.tsx`: Menghapus tombol *AUTO-LOOP* statis, diganti dengan sistem reaktif `neural_tasks` yang mendeteksi tugas agen (menampilkan status `ON TASK` dengan animasi *pulse* oranye).
  - `main.py`: Refactoring `/api/orchestrate` agar Gemini dapat memecah *prompt* menjadi *tasks* dan/atau *pending_approvals* (JSON Payload). Memperbaiki *unbound variable errors*.
  - UI Web secara keseluruhan: Transisi dari warna abu-abu redup ke estetika **Premium Glassmorphism** dengan aksen warna khusus tiap departemen.
- **Dihapus (Removed):**
  - Dependency *cyclic* di `main.py` yang menyebabkan error saat diimport.
  - Opsi *dummy data* untuk operasional utama (Semua dasbor Analytics dan Finance sekarang mengambil data 100% *real-time* dari Firestore).
