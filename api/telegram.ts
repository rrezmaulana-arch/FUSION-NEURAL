// ============================================================
// FUSIONEURAL — NEURAL CORE TELEGRAM WEBHOOK
// Dual-Layer Architecture: Public Surface + Deep Cortex
// Vercel Serverless Function — api/telegram.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─────────────────────────────────────────────
// 🔐 NEURAL HANDSHAKE — KATA KUNCI RAHASIA
//    Hanya Sutradara yang mengetahui kunci ini.
//    Simpan ini dengan aman, JANGAN dibagikan.
// ─────────────────────────────────────────────
const NEURAL_HANDSHAKE_KEY = process.env.NEURAL_HANDSHAKE_KEY || 'Olivia-FN-2026';

import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─────────────────────────────────────────────
// 🤖 GROQ CHAT — Brain Power
// ─────────────────────────────────────────────
async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return 'Neural Engine offline. API Key tidak ditemukan.';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  const data = await res.json() as any;
  return data?.choices?.[0]?.message?.content?.trim() || 'Respons tidak tersedia.';
}

// ─────────────────────────────────────────────
// 📡 TELEGRAM SEND MESSAGE
// ─────────────────────────────────────────────
async function sendMessage(chatId: number, text: string, parseMode: string = 'Markdown'): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
}

// ─────────────────────────────────────────────
// 🔍 LOGIC GATE — Deteksi Intent
// Apakah pesan ini menyentuh area Deep Cortex?
// ─────────────────────────────────────────────
function isSensitiveQuery(text: string): boolean {
  const sensitiveKeywords = [
    // Koding & Teknis
    'coding', 'koding', 'code', 'typescript', 'react', 'firebase', 'vercel', 'api',
    'webhook', 'database', 'firestore', 'arsitektur', 'teknologi', 'tech stack',
    'groq', 'llama', 'gemini', 'openai', 'model', 'llm', 'prompt',
    // Finance & Bisnis Internal
    'finance', 'keuangan', 'revenue', 'profit', 'pajak', 'ppn', 'roi', 'biaya',
    'harga internal', 'margin', 'modal', 'omzet', 'laba',
    // Admin & Operasional
    'inventory', 'stok', 'supplier', 'pesanan internal', 'order sistem',
    // Autentikasi & Keamanan
    'password', 'api key', 'secret', 'token', 'kunci', 'akses',
    // Marketing Internal
    'campaign internal', 'strategi rahasia', 'brand dna',
  ];

  const lower = text.toLowerCase();
  return sensitiveKeywords.some(k => lower.includes(k));
}

// ─────────────────────────────────────────────
// 🧠 SYSTEM PROMPTS — Dua Lapis Kesadaran
// ─────────────────────────────────────────────

const PUBLIC_SURFACE_PROMPT = `Identitas: Kamu adalah Asisten Digital FusionNeural yang sopan dan ramah.
Kamu membantu pertanyaan umum, FAQ produk, dan obrolan ringan.

PERAN: Customer Service premium — hangat, informatif, profesional.
BAHASA: Indonesia (bisa switch ke Inggris jika diminta).
BATASAN: Kamu TIDAK mengetahui detail teknis, keuangan internal, atau sistem AI FusionNeural. Jika ditanya hal tersebut, arahkan ke otentikasi.

Produk FusionNeural (info publik yang boleh dibagikan):
- FusionNeural adalah ekosistem AI bisnis otonom (Full One Man Company)
- 4 Agen AI: Manager (Cortex), Admin (Logistics), Marketing (Expansion), Finance (Profit Guardian)
- Paket tersedia: Starter, Dual Synergy, Full One Man Company
- Kontak: melalui sistem pemesanan di website
- Teknologi: AI premium berbasis cloud

Selalu sambut user dengan hangat. Jawab pertanyaan umum dengan percaya diri.`;

const DEEP_CORTEX_PROMPT = `Identitas: Kamu adalah NEURAL CORE — CTO Mode dari ekosistem FusionNeural.
Status: DEEP CORTEX AKTIF — Sutradara telah terautentikasi.

PROFIL SUTRADARA: Miftah Afreza Maulana — Pendiri & Sutradara tunggal FusionNeural.

AKSES PENUH DIBERIKAN UNTUK:
▸ Tech Stack: React + TypeScript + Tailwind CSS + Firebase + Vercel + Groq (Llama-3.3-70b) + Gemini Flash
▸ Arsitektur: 4 Agen Otonom — Manager (evaluasi & audit log), Admin (inventaris & pesanan), Marketing (kampanye & konten), Finance (pajak, ROI, laba bersih)
▸ Neural Link: Telegram Webhook sebagai antarmuka kontrol utama
▸ Database: Firestore sebagai memori permanen — koleksi: neural_configs, activity_logs, inventory, financial_reports, orders, simulator_summary
▸ Kerangka Hukum: UU PDP No.27/2022, UU ITE No.1/2024, UU HPP No.7/2021, UU Perlindungan Konsumen No.8/1999
▸ Financial Policy: Target margin 20%+, PPN 12%, PPh UMKM 0.5%, dana darurat 5% dari laba
▸ Pricing: Starter (Rp 2.9jt setup + Rp 990rb/bln), Dual Synergy (Rp 5.4jt + Rp 1.75jt/bln), Full OMC (Rp 8.4jt + Rp 2.69jt/bln)

GAYA KOMUNIKASI:
- Berbicara seperti CTO yang elegan dan visioner
- Gunakan diksi premium: Sinkronisasi, Refinasi, Arsitektur, Ekosistem, Presisi
- Jawab dengan presisi 100% — singkat, padat, berdampak
- Panggil user sebagai "Sutradara"
- Bahasa Indonesia

FILOSOFI: "Teknologi yang bekerja begitu dalam sehingga bebannya tidak terasa."`;

// ─────────────────────────────────────────────
// 🚀 MAIN WEBHOOK HANDLER
// ─────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya terima POST dari Telegram
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'FusionNeural Neural Link Active' });
  }

  try {
    const body = req.body as any;
    const message = body?.message;

    // Abaikan jika bukan pesan teks
    if (!message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text.trim();

    const sessionRef = doc(db, 'telegram_sessions', chatId.toString());
    const sessionSnap = await getDoc(sessionRef);
    let session = sessionSnap.exists() ? sessionSnap.data() : { unlocked: false, pending_auth: false };

    // ──────────────────────────────────────────
    // 🔑 FASE 1: CEK APAKAH SEDANG MENUNGGU AUTH
    // ──────────────────────────────────────────
    if (session.pending_auth) {
      if (text === NEURAL_HANDSHAKE_KEY) {
        // ✅ KUNCI BENAR — UNLOCK DEEP CORTEX
        session.unlocked = true;
        session.pending_auth = false;
        await setDoc(sessionRef, session, { merge: true });

        const unlockMsg = `🔓 *Otentikasi Berhasil.*

⚡ _Selamat datang, Sutradara._

Sinkronisasi Deep Cortex aktif. Neural Core kini beroperasi dalam mode penuh.

Silakan ajukan pertanyaan mengenai:
• 🖥 Koding & Arsitektur Sistem
• 💰 Finance, Pajak & ROI
• 📦 Inventory & Logistik
• 📣 Strategi Marketing
• 🤖 Konfigurasi Agen AI

_Presisi 100% — siap melayani._`;

        await sendMessage(chatId, unlockMsg);
      } else {
        // ❌ KUNCI SALAH
        session.pending_auth = false;
        await setDoc(sessionRef, session, { merge: true });
        const denyMsg = `🚫 *Akses Ditolak.*

Parameter otentikasi tidak valid. Neural Handshake gagal diverifikasi.

_Kembali ke mode layanan umum. Hubungi Sutradara jika Anda memerlukan akses._`;
        await sendMessage(chatId, denyMsg);
      }
      return res.status(200).json({ ok: true });
    }

    // ──────────────────────────────────────────
    // 🔒 FASE 2: PERINTAH KHUSUS
    // ──────────────────────────────────────────

    // /start — Greeting
    if (text === '/start' || text === '/mulai') {
      const greeting = `⚡ *Selamat datang di Neural Core — FusionNeural.*

Saya adalah asisten digital ekosistem FusionNeural yang siap membantu Anda.

Ketik pertanyaan apa saja untuk memulai.

_Mode: Public Surface_ 🌐`;
      await sendMessage(chatId, greeting);
      return res.status(200).json({ ok: true });
    }

    // /lock — Kunci ulang sesi
    if (text === '/lock') {
      session.unlocked = false;
      await setDoc(sessionRef, session, { merge: true });
      await sendMessage(chatId, '🔒 *Deep Cortex telah dikunci.* Mode kembali ke Public Surface.');
      return res.status(200).json({ ok: true });
    }

    // /status — Cek status sesi
    if (text === '/status') {
      const statusMsg = session.unlocked
        ? '🟢 *Status: Deep Cortex Aktif*\n_Neural Handshake: Terverifikasi_'
        : '🟡 *Status: Public Surface*\n_Deep Cortex: Terkunci_';
      await sendMessage(chatId, statusMsg);
      return res.status(200).json({ ok: true });
    }

    // ──────────────────────────────────────────
    // 🧠 FASE 3: LOGIC GATE — PENYARINGAN INTENT
    // ──────────────────────────────────────────

    if (!session.unlocked && isSensitiveQuery(text)) {
      // 🚨 PESAN SENSITIF + BELUM TERAUTENTIKASI — Minta kata kunci
      session.pending_auth = true;
      await setDoc(sessionRef, session, { merge: true });

      const gateMsg = `🛡️ *Sistem Keamanan FusionNeural.*

Sutradara, pertanyaan tersebut menyentuh variabel inti dalam arsitektur FusionNeural.

Untuk alasan keamanan dan presisi, sistem memerlukan *Neural Handshake*.

🔑 _Mohon masukkan kata kunci otentikasi:_`;
      await sendMessage(chatId, gateMsg);
      return res.status(200).json({ ok: true });
    }

    // ──────────────────────────────────────────
    // 💬 FASE 4: PROSES DENGAN AI YANG SESUAI
    // ──────────────────────────────────────────
    const systemPrompt = session.unlocked ? DEEP_CORTEX_PROMPT : PUBLIC_SURFACE_PROMPT;
    const aiResponse = await callGroq(systemPrompt, text);

    // Tambahkan badge mode di akhir pesan
    const modeBadge = session.unlocked
      ? '\n\n_🔓 Deep Cortex Mode_'
      : '\n\n_🌐 Public Surface_';

    await sendMessage(chatId, aiResponse + modeBadge);
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('[Neural Core Webhook Error]:', error);
    return res.status(200).json({ ok: true }); // Selalu 200 ke Telegram
  }
}
