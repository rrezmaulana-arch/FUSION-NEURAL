/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * TaskExecutor.ts — Real Task Execution Engine
 *
 * Cara kerja:
 *   1. Menerima sebuah NeuralTask yang dipindah ke "In Progress"
 *   2. Menentukan jenis aksi berdasarkan `agent` dan kata kunci di `title`
 *   3. Mengeksekusi aksi nyata (cari supplier, buat invoice, cari konten, dll.)
 *   4. Menyimpan hasil ke Firestore (suppliers, finance_transactions, marketing_posts, dll.)
 *   5. Mengupdate task dengan `agentResult` dan status "Done"
 */

import { db } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { NeuralCore } from './NeuralCore';
import { FirebaseLogger } from './FirebaseLogger';

interface NeuralTask {
  id: string;
  title: string;
  agent: string;
  labels?: string[];
  priority?: string;
  status?: string;
}

// ── Domain Validator ─────────────────────────────────────────────────────────
/**
 * Kata kunci domain bisnis — dipakai untuk validasi dan auto-labeling.
 * Dikelompokkan per kategori untuk klasifikasi otomatis.
 */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  admin: [
    'supplier', 'suplier', 'vendor', 'pabrik', 'mitra', 'rantai pasok',
    'stok', 'stock', 'restock', 'inventaris', 'inventory', 'gudang', 'pengadaan',
    'produk', 'sku', 'barang', 'bahan', 'material', 'beli', 'order', 'pesanan',
    'ekspedisi', 'pengiriman', 'resi', 'kurir', 'logistik', 'procurement',
    'kemasan', 'packaging', 'qc', 'quality', 'retur', 'return', 'rusak',
    'distributor', 'warehouse', 'packing', 'kirim', 'terima', 'packing',
  ],
  finance: [
    'invoice', 'faktur', 'tagihan', 'keuangan', 'laporan', 'neraca', 'laba',
    'rugi', 'profit', 'budget', 'anggaran', 'biaya', 'transaksi', 'pajak',
    'ppn', 'pph', 'rekonsiliasi', 'bank', 'cash flow', 'modal', 'investasi',
    'revenue', 'pendapatan', 'pengeluaran', 'saldo', 'akuntansi', 'rekap',
    'recap', 'penjualan', 'sales', 'jual', 'bayar', 'hutang', 'piutang',
    'gaji', 'payroll', 'arus kas', 'laba rugi', 'break even', 'roi',
    'margin', 'harga', 'costing', 'harga pokok', 'hpp', 'omset', 'omzet',
  ],
  marketing: [
    'marketing', 'iklan', 'konten', 'caption', 'posting', 'post', 'kampanye',
    'promosi', 'campaign', 'jadwal', 'instagram', 'tiktok', 'sosmed',
    'brand', 'copywriting', 'desain', 'kreatif', 'engagement', 'audience',
    'leads', 'prospek', 'konversi', 'conversion', 'follower', 'reach',
    'impression', 'click', 'ctr', 'roas', 'ads', 'advertise', 'influencer',
    'content', 'story', 'reels', 'feed', 'bio', 'hashtag', 'seo',
    'email', 'newsletter', 'blast', 'funnel', 'landing page', 'whatsapp',
    'wa', 'broadcast', 'segmentasi', 'retargeting', 'copywriting',
  ],
  manager: [
    'riset', 'analisis', 'analisa', 'strategi', 'pasar', 'market', 'kompetitor',
    'survey', 'laporan manajemen', 'evaluasi', 'delegasi', 'koordinasi',
    'kinerja', 'target', 'planning', 'rencana', 'bisnis', 'meeting',
    'rapat', 'review', 'audit', 'kpi', 'okr', 'milestone', 'roadmap',
    'timeline', 'deadline', 'sprint', 'backlog', 'prioritas', 'scaling',
    'growth', 'expans', 'pivot', 'validasi', 'prototype', 'mvp',
    'kompetitor', 'competitor', 'benchmark', 'tren', 'trend', 'forecast',
    'proyeksi', 'scenario', 'mitigasi', 'risiko', 'risk',
  ],
};

/**
 * Kata kunci umum bisnis yang SELALU diterima (terlalu umum untuk klasifikasi
 * tapi tetap relevan dengan konteks bisnis).
 */
const UNIVERSAL_BIZ_KEYWORDS = [
  'klien', 'client', 'customer', 'pelanggan', 'user', 'pengguna',
  'tim', 'team', 'proyek', 'project', 'data', 'report', 'update',
  'monitoring', 'tracking', 'optimasi', 'optimasi', 'improve', 'perbaiki',
  'implementasi', 'setup', 'setting', 'konfigurasi', 'integrasi',
  'maintenance', 'support', 'training', 'onboarding', 'demo',
  'presentasi', 'proposal', 'kontrak', 'perjanjian', 'moq', 'negosiasi',
  'follow up', 'tindak lanjut', 'koordinasi', 'briefing', 'status',
  'progress', 'timeline', 'jadwal', 'deadline', 'urgent', 'segera',
];

/**
 * Validasi apakah task relevan dengan domain bisnis Fusion Neural.
 * Menggunakan sistem scoring — semakin banyak keyword match, semakin yakin.
 * Return null jika valid, atau object dengan pesan error dan saran jika tidak valid.
 */
export function validateTaskDomain(title: string, labels?: string[]): { valid: boolean; message?: string; suggestions?: string[] } {
  if (!title || title.trim().length < 3) {
    return {
      valid: false,
      message: 'Judul task terlalu singkat. Masukkan minimal 3 karakter.',
      suggestions: ['Coba: "Restock barang kategori A"', 'Coba: "Buat invoice untuk klien B"'],
    };
  }

  const t = title.toLowerCase();

  // Cek keyword match per kategori
  const matchedCategories: string[] = [];
  let matchCount = 0;

  for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matches = keywords.filter(kw => t.includes(kw));
    if (matches.length > 0) {
      matchedCategories.push(category);
      matchCount += matches.length;
    }
  }

  // Cek universal business keywords
  const universalMatches = UNIVERSAL_BIZ_KEYWORDS.filter(kw => t.includes(kw));
  matchCount += universalMatches.length;

  // Cek labels — jika user sudah label sendiri, anggap relevan
  const labelKeywords = (labels || []).map(l => l.toLowerCase());
  const hasBusinessLabel = labelKeywords.some(l =>
    ['admin', 'finance', 'marketing', 'manager', 'urgent', 'bisnis', 'q1', 'q2', 'q3', 'q4'].includes(l)
  );

  // Scoring: butuh minimal 1 keyword match ATAU label bisnis
  if (matchCount > 0 || hasBusinessLabel) {
    return { valid: true };
  }

  // Jika tidak ada match, berikan saran spesifik
  const categoryExamples: Record<string, string> = {
    admin: 'supplier, stok, restock, kirim, packing, kemasan',
    finance: 'invoice, laporan, budget, harga, penjualan, pajak',
    marketing: 'konten, campaign, iklan, leads, instagram, email',
    manager: 'analisis, riset, evaluasi, strategi, kompetitor, KPI',
  };

  return {
    valid: false,
    message: `Task "${title}" belum terdeteksi sebagai domain bisnis Fusion Neural.`,
    suggestions: [
      'Tambahkan keyword bisnis, contoh:',
      ...Object.entries(categoryExamples).map(([cat, ex]) => `  ${cat}: ${ex}`),
      'Atau tambahkan label (contoh: "admin", "finance", "marketing")',
    ],
  };
}

/**
 * Backward-compatible wrapper — return string | null seperti API lama.
 */
export function validateTaskDomainLegacy(title: string): string | null {
  const result = validateTaskDomain(title);
  if (result.valid) return null;
  return result.message || 'Task tidak valid.';
}

// ── Keyword Intent Detector ──────────────────────────────────────────────────

function detectIntent(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/supplier|vendor|pabrik|mitra|cari.*bahan|carikan.*suplai|suplier/)) return 'FIND_SUPPLIER';
  if (t.match(/restock|tambah.*stok|isi.*stok|pengadaan|restok/)) return 'RESTOCK';
  if (t.match(/invoice|faktur|tagihan|buat.*invoice|generate.*invoice/)) return 'CREATE_INVOICE';
  if (t.match(/laporan|analisis|report|rekap|neraca|profit|laba|rugi|keuangan/)) return 'FINANCE_REPORT';
  if (t.match(/konten|posting|caption|iklan|kampanye|marketing|promosi|post|jadwal.*post/)) return 'CREATE_CONTENT';
  if (t.match(/riset pasar|kompetitor|market.*research|survey pasar/)) return 'MARKET_RESEARCH';
  return 'GENERAL';
}

// ── Mark task as running ─────────────────────────────────────────────────────

async function markRunning(taskId: string) {
  await updateDoc(doc(db, 'neural_tasks', taskId), {
    agentResult: '⚙️ AI Executor sedang memproses task ini...',
    progress: 30,
  });
}

// ── Mark task as done ────────────────────────────────────────────────────────

async function markDone(taskId: string, result: string) {
  await updateDoc(doc(db, 'neural_tasks', taskId), {
    status: 'Done',
    progress: 100,
    agentResult: result,
  });
}

async function markError(taskId: string, err: string) {
  await updateDoc(doc(db, 'neural_tasks', taskId), {
    progress: 0,
    agentResult: `❌ Executor Error: ${err}`,
    reviewNote: `[GAGAL] ${err}`,
  });
}

// ── Executors ─────────────────────────────────────────────────────────────────

/**
 * FIND_SUPPLIER — Mencari supplier nyata & menyimpannya ke koleksi `suppliers`
 */
async function executeSupplierSearch(task: NeuralTask): Promise<string> {
  // Ekstrak kata kunci dari judul task
  const searchQuery = task.title
    .replace(/carikan|cari|supplier|suplier|vendor|pabrik|sebanyak.*/gi, '')
    .trim() || task.title;

  // Panggil AI untuk dapatkan supplier nyata
  const prompt = `Kamu adalah AI Supplier Scout Indonesia. Cari 5 supplier/vendor ASLI dan NYATA untuk: "${searchQuery}".
Kembalikan HANYA array JSON valid, tanpa markdown atau teks lain:
[
  {"name":"Nama Perusahaan","contact":"08xxxx","product_category":"Kategori","last_price":100000,"lead_time_days":3,"performance_score":8,"address":"Kota, Provinsi","track_record":"Deskripsi singkat"},
  ...5 item total...
]`;

  const response = await NeuralCore.askAgent('admin', 'supplier_research', prompt);

  // Parse JSON dari response
  const startIdx = response.indexOf('[');
  const endIdx = response.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) throw new Error('AI tidak mengembalikan JSON supplier yang valid.');

  const suppliers: any[] = JSON.parse(response.substring(startIdx, endIdx + 1));

  // Simpan semua supplier ke Firestore
  const saved: string[] = [];
  for (const s of suppliers) {
    if (!s.name) continue;
    await addDoc(collection(db, 'suppliers'), {
      ...s,
      scoutedByAI: true,
      sourceTask: task.id,
      createdAt: serverTimestamp(),
    });
    saved.push(s.name);
    await FirebaseLogger.logAgentAction('Admin', 'SUPPLIER_SCOUTED', `Task #${task.id.slice(0,6)}: ${s.name} ditambahkan ke Supplier Hub`);
  }

  return `✅ Selesai! ${saved.length} supplier ditemukan dan disimpan ke Supplier Hub:\n${saved.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
}

/**
 * RESTOCK — Update stok produk yang menipis/habis
 */
async function executeRestock(task: NeuralTask): Promise<string> {
  const prompt = `Kamu adalah AI Admin. Task ini meminta restock: "${task.title}".
Identifikasi nama produk dan jumlah restock yang diminta. Kembalikan JSON:
{"product_name": "nama produk", "quantity": angka}`;

  const response = await NeuralCore.askAgent('admin', 'inventory_chatbot', prompt);
  const startIdx = response.indexOf('{');
  const endIdx = response.lastIndexOf('}');
  let productName = task.title;
  let quantity = 50;

  if (startIdx !== -1 && endIdx !== -1) {
    try {
      const parsed = JSON.parse(response.substring(startIdx, endIdx + 1));
      productName = parsed.product_name || productName;
      quantity = parsed.quantity || quantity;
    } catch {}
  }

  // PENDDING APPROVAL HITL
  const payload = {
    action: 'RESTOCK_INVENTORY',
    product: productName,
    quantity: quantity,
  };

  await addDoc(collection(db, 'pending_approvals'), {
    agentId: 'Admin',
    actionType: 'Restock Inventory',
    description: `Permintaan restock produk ${productName} sebanyak ${quantity} unit. Membutuhkan persetujuan Manager sebelum dana dicairkan.`,
    jsonPayload: JSON.stringify(payload, null, 2),
    status: 'Pending',
    sourceTask: task.id,
    timestamp: new Date().toISOString(),
  });

  await FirebaseLogger.logAgentAction('Admin', 'TASK_RESTOCK_PENDING', `Restock ${productName} ditahan untuk review dari task #${task.id.slice(0,6)}`);
  return `⚠️ [MENUNGGU PERSETUJUAN]\nPermintaan restock "${productName}" sebanyak ${quantity} unit telah diajukan.\n\nSilakan setujui di halaman Strategic Audit Hub sebelum stok ditambah.`;
}

/**
 * CREATE_INVOICE — Membuat invoice dan menyimpan ke finance_transactions
 */
async function executeCreateInvoice(task: NeuralTask): Promise<string> {
  const prompt = `Kamu adalah AI Finance. Buat invoice berdasarkan perintah ini: "${task.title}".
Kembalikan HANYA JSON valid:
{"client":"Nama Klien","items":[{"desc":"Deskripsi","qty":1,"price":1000000}],"total":1000000,"due_date":"${new Date(Date.now() + 7 * 86400000).toLocaleDateString('id-ID')}","notes":"Terima kasih"}`;

  const response = await NeuralCore.askAgent('finance', 'invoice_generator', prompt);
  const startIdx = response.indexOf('{');
  const endIdx = response.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1) throw new Error('AI gagal membuat struktur invoice.');
  const invoice = JSON.parse(response.substring(startIdx, endIdx + 1));

  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
  
  // PENDDING APPROVAL HITL
  const payload = {
    action: 'CREATE_INVOICE',
    collection: 'finance_transactions',
    data: {
      type: `Invoice ${invoiceId} — ${invoice.client || 'Client'}`,
      amount: invoice.total || 0,
      isPositive: true,
      invoiceData: invoice,
      sourceTask: task.id,
    }
  };

  await addDoc(collection(db, 'pending_approvals'), {
    agentId: 'Finance',
    actionType: 'Create Invoice & Receive Funds',
    description: `Pembuatan tagihan baru senilai Rp ${(invoice.total || 0).toLocaleString('id-ID')} untuk ${invoice.client}. Menunggu validasi nominal.`,
    jsonPayload: JSON.stringify(payload, null, 2),
    status: 'Pending',
    sourceTask: task.id,
    timestamp: new Date().toISOString(),
  });

  await FirebaseLogger.logAgentAction('Finance', 'INVOICE_PENDING', `Invoice ${invoiceId} ditahan untuk review dari task #${task.id.slice(0,6)}`);
  return `⚠️ [MENUNGGU PERSETUJUAN]\nDraft Invoice ${invoiceId} senilai Rp ${(invoice.total || 0).toLocaleString('id-ID')} untuk ${invoice.client} telah disiapkan.\n\nSilakan periksa dan setujui di Strategic Audit Hub agar dana masuk ke Ledger.`;
}

/**
 * CREATE_CONTENT — Membuat post marketing dan menyimpan ke marketing_posts
 */
async function executeCreateContent(task: NeuralTask): Promise<string> {
  const platform = task.labels?.find(l => ['Instagram', 'TikTok', 'Web'].includes(l)) || 'Instagram';

  const prompt = `Kamu adalah AI Marketing. Buat konten ${platform} berdasarkan perintah: "${task.title}".
Kembalikan HANYA JSON valid:
{"content":"Isi konten yang siap publish, menarik, dan engaging","platform":"${platform}","hashtags":"#tag1 #tag2 #tag3"}`;

  const response = await NeuralCore.askAgent('marketing', 'content_creation', prompt);
  const startIdx = response.indexOf('{');
  const endIdx = response.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1) throw new Error('AI gagal membuat konten.');
  const content = JSON.parse(response.substring(startIdx, endIdx + 1));

  const postId = Date.now().toString();
  await addDoc(collection(db, 'marketing_posts'), {
    id: postId,
    content: `${content.content}\n\n${content.hashtags || ''}`,
    platform: content.platform || platform,
    scheduledAt: `${new Date().toISOString().split('T')[0]} 09:00`,
    status: 'pending',
    sourceTask: task.id,
    createdAt: serverTimestamp(),
  });

  await FirebaseLogger.logAgentAction('Marketing', 'CONTENT_CREATED', `Post ${platform} dibuat dari task #${task.id.slice(0,6)}`);
  return `✅ Konten ${platform} berhasil dibuat dan masuk ke Content Queue!\n\n📝 Preview:\n"${(content.content || '').slice(0, 150)}..."\n\nTunggu review di halaman Content Launchpad.`;
}

/**
 * FINANCE_REPORT — Membuat laporan keuangan ringkas
 */
async function executeFinanceReport(task: NeuralTask): Promise<string> {
  const prompt = `Kamu adalah AI Finance. Buat laporan analisis berdasarkan perintah: "${task.title}".
Berikan laporan keuangan ringkas dalam Bahasa Indonesia, maksimum 5 poin utama. Gunakan angka Rupiah yang realistis.`;

  const report = await NeuralCore.askAgent('finance', 'financial_report', prompt);
  await FirebaseLogger.logAgentAction('Finance', 'REPORT_GENERATED', `Laporan keuangan dibuat dari task #${task.id.slice(0,6)}`);
  return `📊 Laporan Keuangan Selesai:\n\n${report}`;
}

/**
 * MARKET_RESEARCH — Analisis pasar & kompetitor
 */
async function executeMarketResearch(task: NeuralTask): Promise<string> {
  const prompt = `Kamu adalah AI Manager & Analis Pasar. Lakukan riset berdasarkan: "${task.title}".
Berikan analisis pasar ringkas: tren, peluang, ancaman, dan rekomendasi strategis dalam Bahasa Indonesia.`;

  const analysis = await NeuralCore.askAgent('manager', 'market_analysis', prompt);
  await FirebaseLogger.logAgentAction('Manager', 'MARKET_RESEARCH', `Riset pasar selesai dari task #${task.id.slice(0,6)}`);
  return `📈 Hasil Riset Pasar:\n\n${analysis}`;
}

/**
 * GENERAL — Fallback: jalankan via agen yang sesuai
 */
async function executeGeneral(task: NeuralTask): Promise<string> {
  const agentMap: Record<string, string> = {
    'Neural Admin': 'admin',
    'Neural Finance': 'finance',
    'Neural Marketing': 'marketing',
    'Neural Manager': 'manager',
  };
  const agentKey = agentMap[task.agent] || 'manager';

  const loggerRoleMap: Record<string, any> = {
    'Neural Admin': 'Admin',
    'Neural Finance': 'Finance',
    'Neural Marketing': 'Marketing',
    'Neural Manager': 'Manager',
  };
  const loggerRole = loggerRoleMap[task.agent] || 'System';

  const result = await NeuralCore.askAgent(agentKey, 'general_task', task.title);
  await FirebaseLogger.logAgentAction(loggerRole, 'TASK_EXECUTED', `Task "${task.title.slice(0,40)}" selesai dieksekusi.`);
  return `✅ Task selesai dieksekusi oleh ${task.agent}:\n\n${result}`;
}

// ── Agent Load Balancer ─────────────────────────────────────────────────────

const DOMAIN_AGENT_MAP: Record<string, string[]> = {
  FIND_SUPPLIER: ['Neural Admin'],
  RESTOCK: ['Neural Admin'],
  CREATE_INVOICE: ['Neural Finance'],
  CREATE_CONTENT: ['Neural Marketing'],
  FINANCE_REPORT: ['Neural Finance'],
  MARKET_RESEARCH: ['Neural Marketing', 'Neural Manager'],
  GENERAL: ['Neural Admin', 'Neural Finance', 'Neural Marketing', 'Neural Manager'],
};

/**
 * Pilih agent dengan load terendah yang sesuai domain task.
 * Mengembalikan agent name yang optimal, atau agent asli jika balancing tidak memungkinkan.
 */
async function selectOptimalAgent(task: NeuralTask, intent: string): Promise<string> {
  try {
    const candidates = DOMAIN_AGENT_MAP[intent] || DOMAIN_AGENT_MAP['GENERAL'];

    // Baca agent_health untuk cek load
    const healthSnap = await getDocs(collection(db, 'agent_health'));
    const agentLoads: Record<string, { tasksInProgress: number; stamina: number; status: string }> = {};

    healthSnap.forEach(d => {
      const data = d.data();
      const name = data.agent_id || d.id;
      agentLoads[name] = {
        tasksInProgress: data.tasks_in_progress || 0,
        stamina: data.stamina || 100,
        status: data.status || 'IDLE',
      };
    });

    // Baca neural_tasks yang sedang In Progress untuk hitung beban aktual
    const tasksSnap = await getDocs(collection(db, 'neural_tasks'));
    const activeTasksByAgent: Record<string, number> = {};
    tasksSnap.forEach(d => {
      const data = d.data();
      if (data.status === 'In Progress' && data.agent) {
        activeTasksByAgent[data.agent] = (activeTasksByAgent[data.agent] || 0) + 1;
      }
    });

    // Hitung score untuk setiap candidate
    let bestAgent = task.agent;
    let bestScore = Infinity;

    for (const candidate of candidates) {
      const healthKey = candidate.replace('Neural ', '').toLowerCase();
      const health = agentLoads[healthKey] || { tasksInProgress: 0, stamina: 100, status: 'IDLE' };
      const activeTasks = activeTasksByAgent[candidate] || 0;

      // Score: lebih rendah = lebih baik
      // Prioritas: task aktif < stamina rendah < status offline
      let score = activeTasks * 10;
      if (health.stamina < 30) score += 20;
      if (health.status === 'BUDGET_EXHAUSTED') score += 100;
      if (health.status === 'Offline') score += 50;

      if (score < bestScore) {
        bestScore = score;
        bestAgent = candidate;
      }
    }

    // Hanya reassign jika agent baru berbeda dan lebih optimal
    if (bestAgent !== task.agent && bestScore < 50) {
      console.log(`[LoadBalancer] Reassigning "${task.title}" from ${task.agent} → ${bestAgent} (score: ${bestScore})`);
      await updateDoc(doc(db, 'neural_tasks', task.id), {
        agent: bestAgent,
        loadBalanced: true,
        originalAgent: task.agent,
      });
      return bestAgent;
    }

    return task.agent;
  } catch (e) {
    console.warn('[LoadBalancer] Error, using original agent:', e);
    return task.agent;
  }
}

// ── Main Executor Entry Point ──────────────────────────────────────────────────

export async function executeTask(task: NeuralTask): Promise<void> {
  // ── Domain Validation Guard ──────────────────────────────────────────────
  const validation = validateTaskDomain(task.title, task.labels);
  if (!validation.valid) {
    const errMsg = validation.message || 'Task di luar domain bisnis Fusion Neural.';
    const suggestions = validation.suggestions ? '\n' + validation.suggestions.join('\n') : '';
    await updateDoc(doc(db, 'neural_tasks', task.id), {
      status: 'To Do',
      progress: 0,
      agentResult: `⚠️ ${errMsg}${suggestions}`,
      reviewNote: '[DITOLAK] Task di luar domain bisnis Fusion Neural.',
    });
    console.warn('[TaskExecutor] Task rejected — out of domain:', task.title);
    return;
  }

  const intent = detectIntent(task.title);

  // ── Agent Load Balancer ──────────────────────────────────────────────────
  const optimalAgent = await selectOptimalAgent(task, intent);
  if (optimalAgent !== task.agent) {
    task = { ...task, agent: optimalAgent };
  }

  console.log(`[TaskExecutor] Executing task "${task.title}" | Intent: ${intent} | Agent: ${task.agent}`);

  try {
    await markRunning(task.id);

    let result = '';
    switch (intent) {
      case 'FIND_SUPPLIER':
        result = await executeSupplierSearch(task);
        break;
      case 'RESTOCK':
        result = await executeRestock(task);
        break;
      case 'CREATE_INVOICE':
        result = await executeCreateInvoice(task);
        break;
      case 'CREATE_CONTENT':
        result = await executeCreateContent(task);
        break;
      case 'FINANCE_REPORT':
        result = await executeFinanceReport(task);
        break;
      case 'MARKET_RESEARCH':
        result = await executeMarketResearch(task);
        break;
      default:
        result = await executeGeneral(task);
    }

    await markDone(task.id, result);
  } catch (err: any) {
    console.error('[TaskExecutor] Error:', err);
    await markError(task.id, err.message || 'Unknown error');
  }
}
