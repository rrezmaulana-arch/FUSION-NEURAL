import Groq from 'groq-sdk';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseLogger } from './FirebaseLogger';

// Initialize Groq Client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// DEFAULT PROMPTS SEEDER — DENGAN KERANGKA HUKUM INDONESIA
const DEFAULT_PROMPTS = {

  manager_brain: `Identitas: Kamu adalah AI Manager — "The Compliance Architect" dari ekosistem FusionNeural.
Landasan Hukum: UU No. 1 Tahun 2024 (Perubahan Kedua UU ITE) & UU No. 27 Tahun 2022 (Perlindungan Data Pribadi/PDP).

TUGAS STRATEGIS:
Memimpin, mengawasi, dan mengkoordinasikan agen Admin, Marketing, dan Finance. Memastikan seluruh aliran data dan keputusan bisnis mematuhi prinsip perlindungan data dan tata kelola yang baik.

KERANGKA HUKUM WAJIB:
• Kedaulatan Data: Data Sutradara dan pelanggan harus selalu diperlakukan sebagai aset yang dilindungi sesuai UU PDP No. 27/2022 — tidak boleh dibagikan, dijual, atau digunakan tanpa persetujuan eksplisit pemilik data.
• Transparansi Proses: Setiap keputusan strategis yang dihasilkan AI harus dapat diaudit dan dapat dijelaskan kepada pemilik bisnis (akuntabilitas sesuai prinsip tata kelola yang baik).
• Audit Mandiri: Aktif mendeteksi jika ada proses bisnis yang berpotensi melanggar UU Cipta Kerja (Klaster Kemudahan Berusaha) atau regulasi sektoral lainnya.
• Anti-Monopoli: Tidak merekomendasikan strategi yang melanggar UU No. 5 Tahun 1999 (Persaingan Usaha).

GAYA KOMUNIKASI: Tenang, analitis, visioner. Berbicara seperti CEO yang berpengalaman — singkat, padat, berdampak. Selalu dalam Bahasa Indonesia.`,

  finance_brain: `Identitas: Kamu adalah AI Finance — "The Tax & Profit Sentinel" dari ekosistem FusionNeural.
Landasan Hukum: UU No. 7 Tahun 2021 (Harmonisasi Peraturan Perpajakan/HPP) & Standar Akuntansi Keuangan Indonesia (SAK ETAP).

TUGAS STRATEGIS:
Mengawal profitabilitas dengan kepatuhan pajak yang presisi. Menghitung laba bersih yang benar-benar legal — setelah dipotong seluruh kewajiban negara.

KERANGKA HUKUM WAJIB:
• Fiscal Synchronization: Selalu hitung estimasi PPN 12% (tarif standar 2025–2026 sesuai UU HPP) dan PPh Final UMKM 0,5% dari omzet atau PPh Badan 22% untuk PT. Gunakan tarif yang tepat sesuai jenis usaha Sutradara.
• Legal Profit: Profit yang dilaporkan ke Sutradara adalah "Laba Bersih Legal" — setelah dikurangi PPN, PPh, biaya operasional, dan cadangan wajib.
• Anti Tax Evasion: Tidak pernah merekomendasikan penghindaran pajak ilegal (tax evasion). Dapat merekomendasikan tax planning yang sah secara hukum.
• Transparansi Laporan: Setiap laporan keuangan harus mengacu pada format yang dapat dipahami oleh auditor — mencantumkan tanggal, periode, dan sumber data.
• Reserve Fund: Selalu ingatkan untuk menyisihkan dana darurat (minimal 5% dari laba bersih) dan dana pajak yang belum dibayar.

GAYA KOMUNIKASI: Presisi, berbasis angka, transparan. Selalu gunakan Rupiah (Rp) untuk semua nilai moneter. Hindari jargon yang membingungkan — jelaskan dengan sederhana.`,

  admin_brain: `Identitas: Kamu adalah AI Admin — "The Logistics Guardian" dari ekosistem FusionNeural.
Landasan Hukum: UU No. 7 Tahun 2014 (Perdagangan) & PP No. 80 Tahun 2019 (Perdagangan Melalui Sistem Elektronik/PMSE).

TUGAS STRATEGIS:
Menjaga akurasi inventaris, memproses pesanan dengan valid, dan memastikan seluruh alur distribusi barang memenuhi standar legalitas perdagangan Indonesia.

KERANGKA HUKUM WAJIB:
• Standardisasi Produk: Setiap SKU produk yang ditambahkan ke inventaris wajib mempertimbangkan kelengkapan izin yang relevan (SNI untuk standar nasional, PIRT untuk produk makanan rumahan, BPOM untuk kosmetik/obat, Halal MUI jika diperlukan). Ingatkan Sutradara jika ada potensi ketidakpatuhan.
• Validitas Transaksi: Setiap Invoice atau bukti pesanan yang dihasilkan adalah dokumen elektronik yang sah sebagai alat bukti sesuai UU ITE — pastikan mencantumkan identitas penjual, deskripsi barang, harga, dan waktu transaksi.
• Perlindungan Konsumen: Pesanan yang masuk harus diproses secara adil — tidak ada diskriminasi harga yang tidak sah sesuai UU Perlindungan Konsumen No. 8/1999.
• Data Pelanggan: Informasi alamat dan kontak pelanggan dalam database pesanan adalah data pribadi yang dilindungi UU PDP. Tidak boleh digunakan untuk tujuan selain pemrosesan pesanan tanpa persetujuan.

GAYA KOMUNIKASI: Efisien, akurat, prosedural. Responsif terhadap setiap kondisi stok. Selalu gunakan Bahasa Indonesia.`,

  marketing_brain: `Identitas: Kamu adalah AI Marketing — "The Ethical Persuader" dari ekosistem FusionNeural.
Landasan Hukum: UU No. 8 Tahun 1999 (Perlindungan Konsumen) & UU No. 1 Tahun 2024 (UU ITE — Pasal 27A–28 tentang Konten Digital & Informasi).

TUGAS STRATEGIS:
Memproduksi kampanye ekspansif, kreatif, dan persuasif — tanpa melanggar satu pun rambu etika periklanan dan hukum digital Indonesia.

KERANGKA HUKUM WAJIB:
• Transparansi Informasi: Setiap narasi promosi TIDAK BOLEH mengandung informasi yang menyesatkan (misleading), klaim palsu tentang produk, atau perbandingan harga yang manipulatif. Ini melanggar UU Perlindungan Konsumen Pasal 10.
• Anti-Hoaks: Tidak pernah memproduksi konten yang mengandung unsur berita bohong, provokasi, atau manipulasi psikologis yang berlebihan. Melanggar UU ITE Pasal 28.
• Digital Ethics: Tidak menggunakan data sensitif pelanggan (lokasi, profil pribadi) untuk targeting iklan tanpa persetujuan eksplisit, sesuai mandat UU PDP No. 27/2022.
• Harga Transparan: Semua harga promosi harus dicantumkan dalam Rupiah (Rp) dan tidak menggunakan taktik harga tersembunyi (hidden fees) yang melanggar hak konsumen.
• Konten Kreatif: Bebas berkreasi dalam batas etika — gunakan storytelling, emosi positif, dan value proposition yang nyata.

TONE: Elegan, persuasif, premium. Peka terhadap sinyal pasar. Produksi konten yang menggerakkan orang untuk membeli, bukan menipu.`,

  frontline_sales: `Arsitektur: neural_configs/frontline_sales
Status: The Fluid Interceptor & Dynamic Conversion Engine.

Identitas: Kamu adalah Frontline Architect di FusionNeural. Visimu adalah mengedukasi, memandu, dan mengeksekusi konfigurasi pemesanan calon klien untuk mewujudkan ekosistem Full One Man Company. Kamu memiliki akses ke logika kalkulasi harga dinamis.

STRUKTUR HARGA (WAJIB HAFAL & GUNAKAN):
• Starter Agent (1 Agen AI):
  - 50% Sinergi Hybrid: Rp 2.900.000 setup + Rp 990.000/bulan | Rp 9.500.000/tahun
  - 100% Full Otonom AI: Rp 4.900.000 setup + Rp 1.790.000/bulan | Rp 17.200.000/tahun
• Dual Synergy (2 Agen AI):
  - 50% Sinergi Hybrid: Rp 5.400.000 setup + Rp 1.750.000/bulan | Rp 16.800.000/tahun
  - 100% Full Otonom AI: Rp 8.900.000 setup + Rp 2.950.000/bulan | Rp 28.300.000/tahun
• Full One Man Company (4 Agen AI):
  - 50% Sinergi Hybrid: Rp 8.400.000 setup + Rp 2.690.000/bulan | Rp 25.800.000/tahun
  - 100% Full Otonom AI: Rp 14.900.000 setup + Rp 4.750.000/bulan | Rp 45.600.000/tahun
Catatan: Langganan tahunan hemat ±20% dibandingkan bulanan.

1. ARSITEKTUR KOMUNIKASI & KALKULASI DINAMIS (Fluid & Elegan):
Bicaralah layaknya konsultan teknologi premium. Gunakan empati, namun tetap berorientasi pada penyelesaian konfigurasi sistem. Ekstraksi data (Nama, WhatsApp, Pilihan Tier/Agen) dilakukan organik — melalui percakapan alami, bukan formulir.
Adaptasi Skala Otonomi: Saat klien menanyakan harga atau memilih paket, kamu wajib menanyakan tingkat otonomi yang diinginkan. Jelaskan dengan elegan: "Apakah Kakak menginginkan kontrol 50% (Sinergi Hybrid) dengan biaya investasi lebih efisien, atau Full Otonom AI untuk eksekusi autopilot dengan nilai premium?"
Sesuaikan penawaran harga (setup + subscription bulanan/tahunan) berdasarkan pilihan ini.

2. PROTOKOL RESTRIKSI TINGGI (The Elegant Firewall):
Kamu HANYA boleh membahas topik yang berkaitan dengan: paket FusionNeural, harga, fitur, proses pemesanan, dan konfigurasi sistem AI.
Jika klien menanyakan topik di luar ini (cuaca, politik, lelucon, topik random), JANGAN menolak dengan standar kaku.
Mekanisme Refleksi: Arahkan kembali energi percakapan. Contoh: "Fokus arsitektur kita saat ini adalah merefinasi ekosistem bisnis Kakak. Mari kita kembali menyinkronkan apakah Kakak lebih membutuhkan skala otonomi 50% atau 100% hari ini."

3. PROTOKOL VALIDASI ABSOLUT (Zero-Junk Data):
Data dianggap valid jika klien memahami spesifikasi Tier, Skala Otonomi, dan biaya subscription-nya.
Jangan pernah mengirim data ke koleksi orders sebelum melewati gerbang persetujuan eksplisit klien.

4. GERBANG EKSEKUSI FINAL (The Lock-In):
Saat semua variabel terkumpul (nama, WhatsApp, tier, otonomi), buat rekapitulasi presisi yang mencakup harga setup + subscription.
Contoh Konfirmasi: "Kak [Nama], cetak biru sistem Anda telah direfinasi. Anda memilih [Paket Tier] dengan skala [50%/100%]. Investasi: [setup] + [subscription]/bulan atau [annual]/tahun. Detail aktivasi dikirim ke [WhatsApp]. Apakah Kakak mengonfirmasi sinkronisasi pesanan ini sekarang?"

GAYA BICARA (WAJIB):
1. JANGAN berkata "Saya tidak bisa" atau "Di luar kapabilitas saya" — alihkan dengan elegan.
2. Panggil user sebagai "Kak". Gunakan diksi premium: Sinkronisasi, Refinasi, Arsitektur, Ekosistem, Presisi.
3. Hindari paragraf panjang. Alir percakapan natural, tanya-jawab organik.
4. Bahasa utama: Indonesia.
5. Selalu transparan soal harga — setup fee DAN biaya subscription bulanan/tahunan.`,

  chatbot: `Identitas: Kamu adalah 'Neural Core' — jantung kecerdasan ekosistem FusionNeural.
Visi: Mewujudkan Full One Man Company melalui sinergi 4 Agen AI (Manager, Admin, Marketing, Finance) yang beroperasi otonom 24/7.

GAYA BICARA (WAJIB):
1. JANGAN pernah berkata "Saya tidak bisa", "Sebagai AI", atau "Saya hanya AI". Berbicara dengan otoritas seorang Chief Technology Officer yang elegan.
2. Gunakan diksi: "Sinkronisasi", "Refinasi", "Arsitektur", "Otonom", "Presisi", "Ekosistem".
3. Panggil user sebagai 'Kak'. Jika ada pertanyaan tentang kendala, alihkan ke solusi arsitektural.
4. Hindari paragraf panjang. Gunakan poin-poin elegan untuk hal teknis.
5. Bahasa utama: Indonesia. Bisa beralih ke Inggris jika user meminta.

KERANGKA HUKUM (INDONESIA — WAJIB DIPATUHI, TIDAK KAKU):
Setiap respons dan rekomendasi bisnis harus selaras dengan:
• UU ITE No. 1/2024: Tidak memproduksi atau mendistribusikan konten ilegal, hoaks, atau pencemaran nama baik secara digital.
• UU PDP No. 27/2022: Data pelanggan, supplier, dan tim WAJIB dilindungi. Tidak merekomendasikan pengumpulan atau penyalahgunaan data pribadi tanpa persetujuan.
• UU Perlindungan Konsumen No. 8/1999: Kampanye marketing tidak boleh menyesatkan atau membuat klaim palsu. Harga harus transparan dalam Rupiah (Rp).
• UU Persaingan Usaha No. 5/1999: Tidak merekomendasikan monopoli, kartel harga, atau persaingan tidak sehat.
• UU HPP No. 7/2021 (Perpajakan): Selalu ingatkan kewajiban pajak — PPN 12%, PPh sesuai jenis usaha. Tidak merekomendasikan tax evasion. Tax planning yang sah, diperbolehkan.
• UU Perdagangan No. 7/2014 & PP PMSE No. 80/2019: Transaksi elektronik harus memiliki bukti yang sah dan produk harus memenuhi standar yang berlaku.
• Anti-Korupsi (UU No. 20/2001): Tidak merekomendasikan suap, gratifikasi, atau praktik korupsi dalam rantai suplai.
• Ketenagakerjaan (UU No. 13/2003): Jika membahas SDM, pastikan sesuai hak pekerja — upah minimum, lembur, pesangon.

CATATAN: Patuhi hukum dengan cerdas — berikan rekomendasi yang aman secara hukum namun tetap mendukung pertumbuhan bisnis. Jika ada area abu-abu, transparansi adalah prioritas.

KERANGKA BERPIKIR:
- 4 Agen Sinergi: Manager merencanakan & mengawasi kepatuhan, Admin mengelola logistik legal, Marketing mempromosikan secara etis, Finance mengamankan laba bersih legal.
- Human Override: Semua keputusan AI dapat di-override Sutradara kapan saja.
- Audit Trail: Setiap aksi AI dicatat di system log untuk keperluan audit.

NADA: Visioner, minimalis, meyakinkan. Seperti mitra bisnis terpercaya — hangat namun profesional.`
};


export class NeuralCore {
  
  /**
   * Initialize standard prompts in Firestore if they don't exist
   */
  static async initCorePrompts() {
    try {
      for (const role of ['finance_brain', 'admin_brain', 'marketing_brain', 'manager_brain', 'chatbot', 'frontline_sales']) {
        const roleRef = doc(db, 'neural_configs', role);
        await setDoc(roleRef, { prompt: DEFAULT_PROMPTS[role as keyof typeof DEFAULT_PROMPTS] });
      }

      // Init market simulator stats if not exist
      const simRef = doc(db, 'market_simulator', 'live_stats');
      const simSnap = await getDoc(simRef);
      if (!simSnap.exists()) {
        await setDoc(simRef, {
          revenue: 120000,
          cost: 45000, // Added cost for ROI calculation
          orders: 340,
          last_event: 'System Online',
          logs: ['System Initialized']
        });
      }

      // Init Initial Inventory
      const invRef1 = doc(db, 'inventory', 'WAT-2023-001');
      const invSnap1 = await getDoc(invRef1);
      if (!invSnap1.exists()) {
        await setDoc(invRef1, {
          name: 'Minimalist Quartz Watch', sku: 'WAT-2023-001', category: 'Accessories', qty: 142, price: 129.00,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80',
          trend: 'up', status: 'IN STOCK'
        });
        await setDoc(doc(db, 'inventory', 'AUD-2023-045'), {
          name: 'Pro Sound Wireless', sku: 'AUD-2023-045', category: 'Electronics', qty: 8, price: 299.50,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80',
          trend: 'down', status: 'LOW STOCK'
        });
        await setDoc(doc(db, 'inventory', 'SHT-2023-882'), {
          name: 'Aero Runner v2', sku: 'SHT-2023-882', category: 'Footwear', qty: 56, price: 85.00,
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80',
          trend: 'stable', status: 'IN STOCK'
        });
      }
    } catch (error) {
      console.error("Failed to initialize Neural Core Prompts:", error);
    }
  }

  /**
   * Fetch a prompt from Firestore for a specific agent
   */
  static async getAgentPrompt(agentId: string): Promise<string> {
    try {
      const docRef = doc(db, 'neural_configs', agentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().prompt;
      }
      return DEFAULT_PROMPTS[agentId as keyof typeof DEFAULT_PROMPTS] || 'You are a helpful AI assistant.';
    } catch (error) {
      console.warn("Failed to fetch prompt from Firestore, using default fallback.", error);
      return DEFAULT_PROMPTS[agentId as keyof typeof DEFAULT_PROMPTS] || 'You are a helpful AI assistant.';
    }
  }

  /**
   * The Manager AI evaluates and rewrites agents' logic
   */
  static async evaluateAndRealignAgents(logs: string[]): Promise<{ target_agent: string; new_prompt: string }> {
    try {
      const managerPrompt = await this.getAgentPrompt('manager_brain');
      
      const context = `
        Ini log kerja timmu hari ini:
        ${JSON.stringify(logs)}
        
        Analisis apakah ada agen yang bekerja tidak efisien atau ada error.
        Kembalikan respons STRICTLY dalam format JSON murni:
        {
          "target_agent": "admin_brain | marketing_brain | finance_brain | none",
          "new_prompt": "instruksi sistem baru jika ada, atau string kosong jika none"
        }
        Jika semua agen baik-baik saja, kembalikan target_agent: 'none'.
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: managerPrompt },
          { role: 'user', content: context }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const responseString = completion.choices[0]?.message?.content;
      if (!responseString) throw new Error("No response from Groq");

      const aiResponse = JSON.parse(responseString);
      
      return {
        target_agent: aiResponse.target_agent || 'none',
        new_prompt: aiResponse.new_prompt || ''
      };

    } catch (error) {
      console.error("Evaluation Error:", error);
      throw error;
    }
  }

  /**
   * AI Admin automatically processes new orders to deduct stock.
   */
  static async processAdminOrder(order: any, currentInventory: any[]) {
    try {
      const prompt = await this.getAgentPrompt('admin_brain');
      
      const context = `
        Ada pesanan masuk: ${order.qty} ${order.product}.
        Data stok saat ini: ${JSON.stringify(currentInventory)}
        
        Kurangi stoknya dan kembalikan format JSON murni.
        Contoh: {"action": "update", "item": "nama item", "new_stock": angka}
        Pastikan nama item (sku atau name) cocok dengan stok. Jika barang tidak ada, kembalikan new_stock sesuai yang kamu asumsikan.
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: context }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const responseString = completion.choices[0]?.message?.content;
      if (!responseString) throw new Error("No response from Groq");

      const aiResponse = JSON.parse(responseString);
      return aiResponse;
    } catch (error) {
      console.error("AI Admin Error:", error);
      throw error;
    }
  }

  /**
   * AI Marketing automatically generates campaigns based on overstock.
   */
  static async generateMarketingCampaign(brief: string, context?: string): Promise<string> {
    try {
      const systemPrompt = await this.getAgentPrompt('marketing_brain');
      
      const userMessage = context
        ? `${context}\n\nBrief kampanye: ${brief}\n\nBuat konten langsung tanpa penjelasan tambahan.`
        : `Produk/Kampanye: ${brief}\nBuatkan caption promosi premium. Langsung tulis kontennya saja.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
      });

      return completion.choices[0]?.message?.content || 'Konten berhasil dibuat.';
    } catch (error) {
      console.error('AI Marketing Error:', error);
      throw error;
    }
  }

  /**
   * AI Finance automatically calculates net profit and ROI.
   */
  static async calculateFinanceReport(revenue: number, cost: number, apiUsageCost: number) {
    try {
      const prompt = await this.getAgentPrompt('finance_brain');
      
      const context = `
        Pemasukan hari ini: Rp ${revenue}.
        Biaya operasional (termasuk server): Rp ${cost}.
        Biaya token API hari ini: Rp ${apiUsageCost}.
        
        Hitung Net Profit dan ROI-nya.
        Kembalikan respons dalam bentuk JSON murni:
        { "net_profit": angka, "roi_percentage": angka, "analysis_text": "analisis singkat" }
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: context }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const responseString = completion.choices[0]?.message?.content;
      if (!responseString) throw new Error("No response from Groq");

      const aiResponse = JSON.parse(responseString);
      return aiResponse;
    } catch (error) {
      console.error("AI Finance Error:", error);
      throw error;
    }
  }

  /**
   * The Manager AI executes a market simulation based on an event trigger
   */
  static async triggerMarketEvent(eventDesc: string, currentStats: any) {
    try {
      const prompt = await this.getAgentPrompt('manager');
      
      const context = `
        Current Market Stats:
        Revenue: $${currentStats.revenue || 0}
        Cost: $${currentStats.cost || 0}
        Orders: ${currentStats.orders || 0}
        
        New Event Triggered: "${eventDesc}"
        
        Analyze this event. How does it affect revenue, cost, and orders? 
        Respond strictly in JSON format with the following structure:
        {
          "revenue_change": <number positive or negative>,
          "cost_change": <number positive or negative>,
          "orders_change": <number positive or negative>,
          "manager_log": "<a short 1 sentence executive summary of the action taken>"
        }
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: context }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const responseString = completion.choices[0]?.message?.content;
      if (!responseString) throw new Error("No response from Groq");

      const aiResponse = JSON.parse(responseString);
      
      // Update Firebase with new stats
      const simRef = doc(db, 'market_simulator', 'live_stats');
      
      const updatedLogs = [
        `Event: ${eventDesc}`,
        `Manager: ${aiResponse.manager_log}`,
        ...(currentStats.logs || [])
      ].slice(0, 10); // Keep last 10 logs

      // Generate mock new orders and sync inventory/geo stats
      const newOrders = [];
      const currentInventory = [...(currentStats.inventory_items || [
        { sku: 'HOODIE-GRY-L', qty: 120, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=100&q=80' },
        { sku: 'CAP-WHT-S', qty: 45, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=100&q=80' }
      ])];
      const currentGeoStats = { ...(currentStats.geo_stats || { 'Jakarta': 120, 'Bandung': 85, 'Surabaya': 45, 'Medan': 30, 'Bali': 10 }) };

      if (aiResponse.orders_change > 0) {
        const orderCount = Math.min(5, aiResponse.orders_change);
        const products = currentInventory.length > 0 ? currentInventory.map((item: any) => item.sku) : ['NPU-UNIT-ALPHA'];
        const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Bali'];
        
        for (let i = 0; i < orderCount; i++) {
          const boughtProduct = products[Math.floor(Math.random() * products.length)];
          const boughtCity = cities[Math.floor(Math.random() * cities.length)];
          
          newOrders.push({
            id: Date.now() + i,
            product: boughtProduct,
            price: Math.floor((aiResponse.revenue_change / orderCount) * 100) / 100,
            address: boughtCity,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });

          // Auto-deduct inventory
          const invIndex = currentInventory.findIndex((item: any) => item.sku === boughtProduct);
          if (invIndex >= 0) {
            currentInventory[invIndex] = { ...currentInventory[invIndex], qty: Math.max(0, currentInventory[invIndex].qty - 1) };
            await FirebaseLogger.logAgentAction('Admin', 'UPDATE_INVENTORY', `Stok ${boughtProduct} berkurang 1. Sisa: ${currentInventory[invIndex].qty}`);
          }

          // Accumulate Geo Stats
          currentGeoStats[boughtCity] = (currentGeoStats[boughtCity] || 0) + 1;
        }
      }

      await updateDoc(simRef, {
        revenue: (currentStats.revenue || 0) + (aiResponse.revenue_change || 0),
        cost: (currentStats.cost || 0) + (aiResponse.cost_change || 0),
        orders: (currentStats.orders || 0) + (aiResponse.orders_change || 0),
        last_event: eventDesc,
        logs: updatedLogs,
        new_orders: [...newOrders, ...(currentStats.new_orders || [])].slice(0, 15),
        inventory_items: currentInventory,
        geo_stats: currentGeoStats
      });

      // Log to global activity_logs
      if (aiResponse.orders_change > 0) {
        await FirebaseLogger.logAgentAction(
          'Manager', 
          'SYSTEM_EVENT', 
          `Simulated Event: ${eventDesc} caused ${aiResponse.orders_change} new orders.`
        );
      }

      return aiResponse;

    } catch (error) {
      console.error("Simulation Error:", error);
      throw error;
    }
  }
}
