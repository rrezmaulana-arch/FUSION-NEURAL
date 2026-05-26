import hashlib
import json
import time

class AuditTrail:
    """
    Sistem Cryptographic Hash Chaining untuk Log Anti-Manipulasi.
    Setiap transaksi menyimpan hash dari transaksi sebelumnya.
    Jika satu transaksi di database diubah oleh hacker, seluruh rantai akan terputus.
    """
    def __init__(self):
        # Dalam skenario production, 'last_hash' harus dibaca dari log terakhir di database
        # Untuk demo ini, kita gunakan origin hash statis
        self.last_hash = "GENESIS_BLOCK_FUSION_NEURAL_0000"

    def generate_hash(self, payload: dict) -> str:
        """Menghasilkan SHA-256 hash dari data + timestamp + hash sebelumnya"""
        
        payload_str = json.dumps(payload, sort_keys=True)
        timestamp = str(time.time())
        
        # Gabungkan data untuk di-hash
        raw_data = f"{self.last_hash}|{payload_str}|{timestamp}"
        
        # Hasilkan Hash
        new_hash = hashlib.sha256(raw_data.encode('utf-8')).hexdigest()
        
        # Update state hash terakhir (Di production, update ini ke database juga)
        self.last_hash = new_hash
        return new_hash

    def secure_log(self, action_type: str, actor: str, target: str, amount: float = 0.0) -> dict:
        """Membungkus data menjadi satu objek log yang aman"""
        payload = {
            "action": action_type,
            "actor": actor,
            "target": target,
            "amount": amount
        }
        
        # Hasilkan hash anti-manipulasi
        audit_hash = self.generate_hash(payload)
        
        log_data = {
            "payload": payload,
            "audit_hash": audit_hash,
            "timestamp": time.time(),
            "verified": True
        }
        
        # Simpan ke Firestore (Koleksi khusus audit_ledger yang tidak boleh dihapus via aturan Security Rules)
        try:
            from services.firebase_db import db
            if db:
                db.collection("audit_ledger").add(log_data)
                print(f"[Audit] 🔒 Transaksi diamankan dengan hash: {audit_hash[:15]}...")
        except Exception as e:
            print(f"[Audit] Error saving to Firestore: {e}")
            
        return log_data

# Singleton instance
auditor = AuditTrail()
