# 🧠 NEURAL EVOLUTION: STRATEGIC MASTER PLAN
**Project**: FUSION NEURAL  
**Version**: 2.0 (Evolution)  
**Status**: Strategic Planning Phase  

---

## 📅 MEETING LOG: 11 MEI 2026
**Topic**: Agent Orchestrator V2, UI Streamlining, & Recursive Neural Learning.

### 1. UI & SIDEBAR RE-ARCHITECTURE
*   **Sidebar Cleanup**: Menghapus menu `Agent Health` dan `Neural Status` dari sidebar untuk menyederhanakan navigasi.
*   **Data Migration**: Seluruh indikator kesehatan agen dan konektivitas API dipindahkan ke dalam halaman **Agent Orchestrator**.
*   **Layered View (Basement Concept)**: 
    *   Implementasi dua layer tampilan: **Operations Floor** (6 kotak kerja) dan **Infrastructure Deck** (Engine Room).
    *   Menggunakan transisi lift/slide smooth (Framer Motion) untuk berpindah antar layer tanpa membuat UI terasa sempit.

### 2. INFRASTRUCTURE DECK (THE ENGINE ROOM)
Area baru di bawah lantai operasional yang memvisualisasikan "jantung" sistem:
*   **Server Room (The Connectivity Cluster)**: 
    *   Rak server visual untuk monitoring API: Groq & Gemini (Brain), HuggingFace (Vision), Firebase (Data), Midtrans/Serper (External).
    *   Lampu indikator real-time: Hijau (Active), Kuning (Latency), Merah (Down).
*   **Battery Room (The Power Grid)**: 
    *   **Main Core**: Menampilkan total Company Budget dalam Rupiah.
    *   **Sub-Tanks**: Menampilkan kuota/token harian untuk masing-masing provider API (Groq Token, HF Credits, dsb).
    *   Visual: Cairan neon yang berkurang saat agen melakukan tugas berat.

### 3. AGENT BEHAVIOR & INTERACTION MECHANICS
*   **Walking Paths**: Agen bergerak secara otonom dari meja kerja ke Server Room (untuk sinkronisasi data) atau ke Battery Room (untuk charging).
*   **Social Interaction (1-Click)**: "Nyenggol" agen akan memicu sapaan ringan via speech bubble dan efek suara *pop*.
*   **God Mode (3-Clicks)**: 
    *   Memicu **Holographic RPG Stats Overlay**.
    *   Menampilkan: **EXP** (Experience), **INT** (Intelligence/Model), **AGI** (Speed), dan **Neural Energy Bar**.
    *   **Thought Stream**: Menampilkan cuplikan logika/proses berpikir agen secara transparan.
*   **Immersive Audio**: Sound design khusus untuk perpindahan lantai, aktivasi God Mode, dan aktivitas agen.

### 4. NEURAL EVOLUTION (SELF-HEALING SYSTEM)
*   **Audit-to-Brain Feedback**: Manager AI mereview log audit harian untuk menemukan anomali atau kesalahan agen.
*   **Neural Patching**: Manager AI merumuskan perbaikan instruksi dan secara otomatis memperbarui (patch) prompt agen di Firestore (`neural_configs`).
*   **RPG Progression**: Agen berevolusi dari *Trainee* menjadi *Veteran* seiring bertambahnya EXP dan jumlah patching yang sukses.
*   **Safety Valve**: Setiap perubahan "otak" agen memerlukan konfirmasi satu kali (Sync) dari Sutradara (Manager Role).

---

## 🛠️ TECHNICAL IMPLEMENTATION PATH
1.  **State Management**: Expand `useManagerStore.ts` untuk melacak koordinat agen, stamina, dan global battery levels.
2.  **Component Split**: Pisahkan `OperationView.tsx` dan `InfrastructureView.tsx`.
3.  **NeuralCore Update**: Tambahkan fungsi `applyNeuralPatch()` untuk memfasilitasi self-learning.

---
**Sutradara**: Reza Moetia  
**AI Strategist**: Antigravity (Google DeepMind)
