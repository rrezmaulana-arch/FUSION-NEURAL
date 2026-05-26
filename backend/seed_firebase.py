"""
seed_firebase.py - Standalone Firestore Seeder (NO dependency on main.py)
Jalankan dengan: python seed_firebase.py
Dari folder: c:/Olivia/FUSION NEURAL/backend
"""
import os
import sys
import json
import asyncio
from datetime import datetime, timezone

# ── Path Bootstrap ─────────────────────────────────────────────────────────────
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _BACKEND_DIR)

# ── Load GCP Credentials directly ─────────────────────────────────────────────
from google.oauth2 import service_account
import google.auth.transport.requests
import requests as req_sync

_CRED_PATH = os.path.join(_BACKEND_DIR, "gcp-credentials.json")

if not os.path.exists(_CRED_PATH):
    print("❌ gcp-credentials.json tidak ditemukan di folder backend/")
    sys.exit(1)

_CREDS = service_account.Credentials.from_service_account_file(
    _CRED_PATH,
    scopes=["https://www.googleapis.com/auth/cloud-platform"],
)
with open(_CRED_PATH) as f:
    _PROJECT_ID = json.load(f)["project_id"]

_FS_BASE = f"https://firestore.googleapis.com/v1/projects/{_PROJECT_ID}/databases/(default)/documents"


def _token() -> str:
    if not _CREDS.valid:
        _CREDS.refresh(google.auth.transport.requests.Request())
    return _CREDS.token


def _h(): return {"Authorization": f"Bearer {_token()}"}


def _enc(v):
    if isinstance(v, bool):  return {"booleanValue": v}
    if isinstance(v, int):   return {"integerValue": str(v)}
    if isinstance(v, float): return {"doubleValue": v}
    if isinstance(v, str):   return {"stringValue": v}
    if v is None:            return {"nullValue": None}
    if isinstance(v, dict):  return {"mapValue": {"fields": {k: _enc(vv) for k, vv in v.items()}}}
    if isinstance(v, list):  return {"arrayValue": {"values": [_enc(i) for i in v]}}
    return {"stringValue": str(v)}


def fs_set(collection: str, doc_id: str, data: dict):
    url = f"{_FS_BASE}/{collection}/{doc_id}"
    r = req_sync.patch(url, headers=_h(), json={"fields": {k: _enc(v) for k, v in data.items()}}, timeout=10)
    if r.status_code not in (200, 201):
        print(f"  ⚠️  {collection}/{doc_id} → HTTP {r.status_code}: {r.text[:200]}")
    else:
        print(f"  ✅ {collection}/{doc_id}")


def fs_add(collection: str, data: dict):
    url = f"{_FS_BASE}/{collection}"
    r = req_sync.post(url, headers=_h(), json={"fields": {k: _enc(v) for k, v in data.items()}}, timeout=10)
    if r.status_code not in (200, 201):
        print(f"  ⚠️  {collection} (add) → HTTP {r.status_code}: {r.text[:200]}")
    else:
        print(f"  ✅ {collection} (auto-id)")


NOW = datetime.now(timezone.utc).isoformat()


def seed():
    print(f"\n🌱 Fusion Neural Seeder — Project: {_PROJECT_ID}\n")

    # ── 1. Agent Budgets ──────────────────────────────────────────────────────
    print("📦 Seeding agent_budgets...")
    fs_set("agent_budgets", "marketing",  {"name": "Neural Marketing", "role": "Marketing",  "monthlyBudget": 15000000, "currentSpend": 4500000, "status": "Active"})
    fs_set("agent_budgets", "finance",    {"name": "Neural Finance",   "role": "Finance",    "monthlyBudget": 5000000,  "currentSpend": 4800000, "status": "Throttled"})
    fs_set("agent_budgets", "admin",      {"name": "Neural Admin",     "role": "Admin",      "monthlyBudget": 2000000,  "currentSpend": 50000,   "status": "Active"})
    fs_set("agent_budgets", "manager",    {"name": "Neural Manager",   "role": "Manager",    "monthlyBudget": 3000000,  "currentSpend": 900000,  "status": "Active"})

    # ── 2. Pending Approvals (Human-in-the-Loop) ───────────────────────────────
    print("\n🔐 Seeding pending_approvals...")
    fs_set("pending_approvals", "app_admin_restock", {
        "agentId": "Neural Admin",
        "actionType": "Restock Request — Produk Baju Batik Premium",
        "description": "Stok tersisa 12 unit (batas minimum: 30). Saya mengajukan PO 100 unit ke supplier Pak Budi. Mohon disetujui oleh Manager.",
        "jsonPayload": json.dumps({"supplier": "CV Batik Nusantara", "product_id": "PRD-0012", "qty_requested": 100, "unit_price": 125000, "total": 12500000}, indent=2),
        "status": "Pending",
        "timestamp": NOW
    })
    fs_set("pending_approvals", "app_finance_invoice", {
        "agentId": "Neural Finance",
        "actionType": "Draft Invoice — Tagihan Server Vercel (Beta)",
        "description": "Saya telah membuat draft invoice bulanan untuk biaya server Vercel. Ini adalah dokumen internal Beta yang belum resmi. Mohon di-review sebelum dikirim ke klien.",
        "jsonPayload": json.dumps({"invoice_no": "INV-2026-005", "vendor": "Vercel Inc.", "period": "Mei 2026", "items": [{"desc": "Pro Plan Hosting", "qty": 1, "price": 240000}], "ppn_12pct": 28800, "total": 268800, "note": "BETA — Belum final"}, indent=2),
        "status": "Pending",
        "timestamp": NOW
    })
    fs_set("pending_approvals", "app_marketing_code", {
        "agentId": "Neural Marketing",
        "actionType": "Usulan Update Teks Iklan (Web Code)",
        "description": "Analytics menunjukkan CTR di bawah 2%. Saya ingin mengganti teks CTA di halaman utama dari 'Pelajari Lebih Lanjut' menjadi 'Mulai Gratis Sekarang'. Perlu approval Manager.",
        "jsonPayload": json.dumps({"file": "src/pages/LandingPage.tsx", "component": "HeroSection", "change": {"from": "Pelajari Lebih Lanjut", "to": "Mulai Gratis Sekarang"}, "estimated_ctr_lift": "+1.8%"}, indent=2),
        "status": "Pending",
        "timestamp": NOW
    })

    # ── 3. AI Tickets ─────────────────────────────────────────────────────────
    print("\n🎫 Seeding ai_tickets...")
    fs_set("ai_tickets", "tck1", {"title": "Generate Konten Q3 IG Campaign", "agent": "Neural Marketing", "status": "In Progress", "comments": 3, "createdAt": NOW})
    fs_set("ai_tickets", "tck2", {"title": "Audit Biaya Server & Hosting Q2", "agent": "Neural Finance",   "status": "Review",      "comments": 12, "createdAt": NOW})
    fs_set("ai_tickets", "tck3", {"title": "Onboarding Email Sequence Draft",  "agent": "Neural Marketing", "status": "To Do",       "comments": 0,  "createdAt": NOW})
    fs_set("ai_tickets", "tck4", {"title": "Rekonsiliasi Stok Gudang Mei",      "agent": "Neural Admin",     "status": "In Progress", "comments": 5,  "createdAt": NOW})

    # ── 4. Run Transcripts (AI Audit Log) ─────────────────────────────────────
    print("\n📜 Seeding run_transcripts...")
    fs_set("run_transcripts", "trx1", {"agentId": "Neural Marketing", "ticketId": "tck1", "action": "Analyzing market trends for Q3", "thoughtProcess": "Ditemukan 3 tren dominan: short-form video, UGC campaign, dan influencer micro-tier. Processing data segmentasi...", "timestamp": NOW, "status": "Success"})
    fs_set("run_transcripts", "trx2", {"agentId": "Neural Finance",   "ticketId": "tck2", "action": "Calculating server cost delta",   "thoughtProcess": "Biaya AWS naik 12% QoQ. Rekomendasi: migrasi Lightsail ke Vercel Pro + Redis caching. Estimasi penghematan Rp 2.4jt/bulan.", "timestamp": NOW, "status": "Success"})
    fs_set("run_transcripts", "trx3", {"agentId": "Neural Admin",     "ticketId": "tck4", "action": "Rekonsiliasi stok fisik vs sistem", "thoughtProcess": "Ditemukan 3 SKU dengan selisih stok: PRD-0012 (-18 unit), PRD-0034 (-7 unit), PRD-0089 (+2 unit). Mengajukan restock PRD-0012.", "timestamp": NOW, "status": "Success"})

    # ── 5. Activity Logs ──────────────────────────────────────────────────────
    print("\n📊 Seeding activity_logs...")
    for log in [
        {"agent": "Admin",     "action": "STOCK_CHECK",      "details": "Stok PRD-0012 tersisa 12 unit. Threshold: 30. Mengajukan restock."},
        {"agent": "Finance",   "action": "INVOICE_DRAFT",    "details": "Draft INV-2026-005 dibuat. Menunggu approval Manager."},
        {"agent": "Marketing", "action": "CAMPAIGN_ANALYZE", "details": "Analisis CTR Q2 selesai. CTR: 1.87%. Di bawah target 3%."},
        {"agent": "Manager",   "action": "AUDIT_TRIGGERED",  "details": "Manager memulai Strategic Audit. Mengevaluasi 3 agen aktif."},
        {"agent": "Admin",     "action": "PO_SUBMITTED",     "details": "Purchase Order 100 unit Batik Premium diajukan ke supplier."},
    ]:
        fs_add("activity_logs", {**log, "timestamp": NOW})

    # ── 6. Neural Tasks (Kanban Board) ────────────────────────────────────────
    print("\n🗂️  Seeding neural_tasks...")
    tasks = [
        {"title": "Analisis Tren Pasar Q3", "client": "Internal", "agent": "Neural Marketing", "labels": ["Marketing", "Research"], "status": "In Progress", "dueDate": "2d", "comments": 3, "attachments": 1, "progress": 45},
        {"title": "Buat Draft Invoice Server", "client": "Vercel Inc.", "agent": "Neural Finance", "labels": ["Finance", "Document"], "status": "In Review", "dueDate": "1d", "comments": 0, "attachments": 0, "progress": 90},
        {"title": "Rekonsiliasi Stok Gudang", "client": "Internal", "agent": "Neural Admin", "labels": ["Admin", "Inventory"], "status": "To Do", "dueDate": "3d", "comments": 5, "attachments": 2, "progress": 0},
        {"title": "Kirim Sequence Email Onboarding", "client": "New Leads", "agent": "Neural Marketing", "labels": ["Marketing", "Email"], "status": "To Do", "dueDate": "5d", "comments": 0, "attachments": 0, "progress": 0},
    ]
    for i, t in enumerate(tasks):
        fs_set("neural_tasks", f"task_{i+1}", {**t, "createdAt": NOW})

    print("\n✅ Seeding selesai! Database siap digunakan.\n")


if __name__ == "__main__":
    seed()
