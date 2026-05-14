# 📜 BUSINESS LOGIC RULES (FUSION NEURAL)
**Version**: 1.0  
**Domain**: Business Intelligence  

## ⚖️ REGULATORY COMPLIANCE
- **Pajak (Fiscal)**: Estimasi PPN 12% (tarif 2025+) dan PPh Final UMKM 0.5%.
- **Privasi (PDP)**: Data pelanggan tidak boleh dibagikan secara mentah ke model AI tanpa anonymization jika memungkinkan. Sesuai UU No. 27 Tahun 2022.
- **Etika AI**: Dilarang memberikan saran yang melanggar hukum atau merugikan kompetitor secara tidak sehat (UU No. 5 Tahun 1999).

## 💰 PRICING & PROFIT
- **Laba Bersih**: Dihitung setelah (HPP + Biaya Operasional + Pajak).
- **Anti-Zero Rule**: Dilarang menjual barang dengan harga 0 atau HPP 0 tanpa alasan promosi yang tervalidasi Manager.
- **Currency**: Semua transaksi dicatat dalam Rupiah (IDR).

## 🛠️ DATA INTEGRITY
- **Inventory Check**: Stok tidak boleh minus.
- **Audit Trail**: Setiap perubahan status pesanan harus mencatat `changed_by` (ID Agen) dan `timestamp`.
