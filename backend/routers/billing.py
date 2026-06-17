"""
routers/billing.py — Subscription & Invoice Management

Handles subscription lifecycle, invoice generation, and Midtrans payment callbacks.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/billing", tags=["billing"])

# ── Midtrans Config ──────────────────────────────────────────────────────────
MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY", "")
MIDTRANS_ENV = os.getenv("MIDTRANS_ENV", "sandbox")
MIDTRANS_BASE = (
    "https://api.sandbox.midtrans.com/v2"
    if MIDTRANS_ENV == "sandbox"
    else "https://api.midtrans.com/v2"
)

# ── Plan Pricing (IDR) ───────────────────────────────────────────────────────
PLANS = {
    "starter": {"name": "Starter Agent", "setup": 4_900_000, "monthly": 1_800_000, "agents": 1},
    "dual": {"name": "Dual Synergy", "setup": 8_900_000, "monthly": 3_000_000, "agents": 2},
    "full": {"name": "Full One Man Company", "setup": 14_900_000, "monthly": 4_800_000, "agents": 4},
}


# ── Pydantic Models ──────────────────────────────────────────────────────────
class CreateSubscriptionRequest(BaseModel):
    companyId: str
    plan: str  # starter | dual | full
    customerName: str
    customerEmail: str
    customerPhone: Optional[str] = None


class ChangePlanRequest(BaseModel):
    companyId: str
    newPlan: str


# ── Firestore helper (imported from main) ────────────────────────────────────
def _get_db():
    """Lazy import to avoid circular dependency."""
    import main
    return main.db


def _get_firebase_token():
    import main
    return main._get_firebase_token()


def _fs_headers():
    return {"Authorization": f"Bearer {_get_firebase_token()}"}


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/create-subscription")
async def create_subscription(req: CreateSubscriptionRequest):
    """Create a subscription and initiate setup payment via Midtrans."""
    db = _get_db()
    if not db:
        raise HTTPException(503, "Database not configured")

    plan = PLANS.get(req.plan)
    if not plan:
        raise HTTPException(400, f"Invalid plan: {req.plan}. Choose: {list(PLANS.keys())}")

    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    order_id = f"setup_{sub_id}_{int(datetime.now().timestamp())}"

    # Create subscription document
    now = datetime.now(timezone.utc).isoformat()
    period_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    sub_data = {
        "id": sub_id,
        "companyId": req.companyId,
        "plan": req.plan,
        "status": "pending_setup",
        "setupFee": plan["setup"],
        "monthlyAmount": plan["monthly"],
        "agentsIncluded": plan["agents"],
        "currentPeriodStart": now,
        "currentPeriodEnd": period_end,
        "createdAt": now,
        "midtransOrderId": order_id,
    }

    def _save():
        db.collection("subscriptions").document(sub_id).set(sub_data)
    import asyncio
    await asyncio.to_thread(_save)

    # Create Midtrans Snap token for setup payment
    if not MIDTRANS_SERVER_KEY:
        raise HTTPException(500, "MIDTRANS_SERVER_KEY not configured")

    import base64
    encoded_key = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{MIDTRANS_BASE}/charge",
            headers={
                "Authorization": f"Basic {encoded_key}",
                "Content-Type": "application/json",
            },
            json={
                "payment_type": "bank_transfer",
                "transaction_details": {
                    "order_id": order_id,
                    "gross_amount": plan["setup"],
                },
                "customer_details": {
                    "first_name": req.customerName,
                    "email": req.customerEmail,
                    "phone": req.customerPhone or "",
                },
                "bank_transfer": {"bank": "bca"},
            },
        )

    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"Midtrans error: {resp.text[:200]}")

    data = resp.json()

    # Create invoice
    invoice_id = f"inv_{uuid.uuid4().hex[:12]}"
    invoice_data = {
        "id": invoice_id,
        "companyId": req.companyId,
        "subscriptionId": sub_id,
        "type": "setup",
        "amount": plan["setup"],
        "status": "pending",
        "midtransOrderId": order_id,
        "dueDate": now,
        "createdAt": now,
    }
    await asyncio.to_thread(lambda: db.collection("invoices").document(invoice_id).set(invoice_data))

    return {
        "subscriptionId": sub_id,
        "invoiceId": invoice_id,
        "orderId": order_id,
        "amount": plan["setup"],
        "paymentType": data.get("payment_type"),
        "vaNumber": data.get("va_numbers", [{}])[0].get("va_number"),
        "bank": data.get("va_numbers", [{}])[0].get("bank"),
    }


@router.get("/subscription/{company_id}")
async def get_subscription(company_id: str):
    """Get active subscription for a company."""
    db = _get_db()
    if not db:
        raise HTTPException(503, "Database not configured")

    import asyncio

    def _read():
        docs = db.collection("subscriptions").stream()
        for doc in docs:
            data = doc.to_dict()
            if data.get("companyId") == company_id:
                return data
        return None

    sub = await asyncio.to_thread(_read)
    if not sub:
        raise HTTPException(404, "No subscription found")

    return sub


@router.post("/cancel")
async def cancel_subscription(req: dict):
    """Cancel a subscription at end of current period."""
    db = _get_db()
    if not db:
        raise HTTPException(503, "Database not configured")

    sub_id = req.get("subscriptionId")
    if not sub_id:
        raise HTTPException(400, "subscriptionId required")

    import asyncio

    def _update():
        doc = db.collection("subscriptions").document(sub_id)
        existing = doc.get()
        if not existing.exists:
            raise Exception("Subscription not found")
        doc.update({
            "status": "canceled",
            "canceledAt": datetime.now(timezone.utc).isoformat(),
        })

    try:
        await asyncio.to_thread(_update)
        return {"status": "canceled", "message": "Subscription will end at current period"}
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/change-plan")
async def change_plan(req: ChangePlanRequest):
    """Upgrade or downgrade subscription plan."""
    db = _get_db()
    if not db:
        raise HTTPException(503, "Database not configured")

    new_plan = PLANS.get(req.newPlan)
    if not new_plan:
        raise HTTPException(400, f"Invalid plan: {req.newPlan}")

    import asyncio

    def _update():
        docs = db.collection("subscriptions").stream()
        for doc in docs:
            data = doc.to_dict()
            if data.get("companyId") == req.companyId and data.get("status") in ("active", "trialing"):
                doc_ref = db.collection("subscriptions").document(doc.id)
                doc_ref.update({
                    "plan": req.newPlan,
                    "monthlyAmount": new_plan["monthly"],
                    "agentsIncluded": new_plan["agents"],
                    "planChangedAt": datetime.now(timezone.utc).isoformat(),
                })
                return True
        return False

    updated = await asyncio.to_thread(_update)
    if not updated:
        raise HTTPException(404, "No active subscription found")

    return {"status": "updated", "newPlan": req.newPlan, "monthlyAmount": new_plan["monthly"]}


@router.get("/invoices/{company_id}")
async def get_invoices(company_id: str):
    """Get all invoices for a company."""
    db = _get_db()
    if not db:
        raise HTTPException(503, "Database not configured")

    import asyncio

    def _read():
        docs = db.collection("invoices").stream()
        invoices = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("companyId") == company_id:
                invoices.append(data)
        invoices.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return invoices

    invoices = await asyncio.to_thread(_read)
    return {"invoices": invoices}


# ── Midtrans Webhook ─────────────────────────────────────────────────────────

@router.post("/webhooks/midtrans")
async def midtrans_webhook(request: Request):
    """Handle Midtrans payment notification callbacks."""
    db = _get_db()
    if not db:
        return {"status": "error", "message": "db not configured"}

    body = await request.json()
    order_id = body.get("order_id", "")
    transaction_status = body.get("transaction_status", "")
    fraud_status = body.get("fraud_status", "")
    status_code = body.get("status_code", "")

    import asyncio

    # Verify with Midtrans
    if not MIDTRANS_SERVER_KEY:
        return {"status": "error", "message": "server key not configured"}

    import base64
    encoded_key = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()

    async with httpx.AsyncClient(timeout=15) as client:
        verify_resp = await client.get(
            f"{MIDTRANS_BASE}/{order_id}/status",
            headers={"Authorization": f"Basic {encoded_key}"},
        )

    if verify_resp.status_code != 200:
        return {"status": "error", "message": "verification failed"}

    verify_data = verify_resp.json()
    if verify_data.get("status_code") != status_code:
        return {"status": "error", "message": "status mismatch"}

    # Determine payment status
    if transaction_status == "capture" and fraud_status == "accept":
        payment_status = "paid"
    elif transaction_status == "settlement":
        payment_status = "paid"
    elif transaction_status in ("deny", "cancel", "expire"):
        payment_status = "failed"
    elif transaction_status == "pending":
        payment_status = "pending"
    else:
        payment_status = "unknown"

    # Update invoice and subscription
    def _update():
        # Find invoice by midtransOrderId
        invoices = db.collection("invoices").stream()
        for inv_doc in invoices:
            inv_data = inv_doc.to_dict()
            if inv_data.get("midtransOrderId") == order_id:
                db.collection("invoices").document(inv_doc.id).update({
                    "status": payment_status,
                    "paidAt": datetime.now(timezone.utc).isoformat() if payment_status == "paid" else None,
                    "midtransCallback": body,
                })

                # Update subscription
                sub_id = inv_data.get("subscriptionId")
                if sub_id and payment_status == "paid":
                    sub_doc = db.collection("subscriptions").document(sub_id)
                    sub_data = sub_doc.get().to_dict()
                    if sub_data and sub_data.get("status") == "pending_setup":
                        sub_doc.update({
                            "status": "active",
                            "activatedAt": datetime.now(timezone.utc).isoformat(),
                        })
                break

    await asyncio.to_thread(_update)
    return {"status": "ok", "payment_status": payment_status}
