# 📁 CORE FIRESTORE PATTERNS
**Version**: 1.0  
**Domain**: Database Operations  

## 🛠️ STANDARD COLLECTIONS
Agen harus menggunakan koleksi berikut untuk operasi data:
- `orders`: Data pesanan masuk, status pengiriman, dan riwayat pembayaran.
- `inventory`: Stok barang, HPP, harga jual, dan kategori produk.
- `agent_health`: Status heartbeat dan latensi API masing-masing agen.
- `neural_configs`: Prompt sistem dan konfigurasi model yang digunakan.
- `audit_logs`: Catatan aktivitas penting untuk transparansi dan kepatuhan.

## 🔐 SECURITY PROTOCOLS
1. **owner_id**: Setiap dokumen WAJIB memiliki field `owner_id` untuk isolasi data antar tenant.
2. **Security Rules**: Akses ditolak otomatis di level kernel jika `request.auth.uid` tidak cocok dengan `resource.data.owner_id`.
3. **Atomic Transactions**: Gunakan transaksi untuk update stok guna mencegah *race condition*.

## 📡 REAL-TIME SYNC
Sistem menggunakan `onSnapshot` di frontend untuk update UI tanpa refresh. Agen backend cukup melakukan `update()` atau `set()` pada dokumen, dan UI akan langsung bereaksi.
