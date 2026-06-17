"""
services/email_service.py — Transactional Email via Resend

Provides pre-built templates and a send wrapper for system notifications.
"""
import os
import httpx
from typing import Optional
from logging_config import get_logger

logger = get_logger("email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM", "FusionNeural <onboarding@resend.dev>")
RESEND_API = "https://api.resend.com/emails"


async def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    tags: Optional[dict] = None,
) -> bool:
    """Send an email via Resend API. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("[email] RESEND_API_KEY not configured, skipping email")
        return False

    recipients = [to] if isinstance(to, str) else to

    payload = {
        "from": RESEND_FROM,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if tags:
        payload["tags"] = [{"name": k, "value": v} for k, v in tags.items()]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                RESEND_API,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if resp.status_code == 200:
            logger.info(f"[email] Sent to {recipients}: {subject}")
            return True
        else:
            logger.error(f"[email] Failed ({resp.status_code}): {resp.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"[email] Error: {e}")
        return False


# ── Email Templates ──────────────────────────────────────────────────────────

def _base_template(title: str, content: str) -> str:
    """Wrap content in a branded email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#760EFF;font-size:24px;margin:0;">FusionNeural</h1>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">Ekosistem Bisnis AI Otonom</p>
        </div>
        <div style="background:#111827;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
          <h2 style="color:#f1f5f9;font-size:18px;margin:0 0 16px;">{title}</h2>
          <div style="color:#cbd5e1;font-size:14px;line-height:1.7;">{content}</div>
        </div>
        <p style="color:#475569;font-size:11px;text-align:center;margin-top:24px;">
          &copy; 2026 FusionNeural. Otomasi bisnis Anda dengan AI.
        </p>
      </div>
    </body>
    </html>
    """


def task_completed_email(agent: str, task_title: str, result_snippet: str) -> tuple[str, str]:
    subject = f"[FusionNeural] Task Selesai: {task_title[:50]}"
    html = _base_template(
        "Task Selesai",
        f"""
        <p style="margin:0 0 12px;">Agen <strong style="color:#760EFF;">{agent}</strong> telah menyelesaikan task:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:12px 0;">
          <p style="margin:0;color:#f1f5f9;font-weight:600;">{task_title}</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">{result_snippet[:200]}...</p>
        </div>
        <a href="https://fusionneural.web.id/dashboard" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#760EFF;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Lihat di Dashboard</a>
        """,
    )
    return subject, html


def approval_needed_email(task_title: str, agent: str) -> tuple[str, str]:
    subject = f"[FusionNeural] Approval Dibutuhkan: {task_title[:50]}"
    html = _base_template(
        "Approval Dibutuhkan",
        f"""
        <p style="margin:0 0 12px;">Agen <strong style="color:#f59e0b;">{agent}</strong> meminta persetujuan Anda:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #f59e0b;">
          <p style="margin:0;color:#f1f5f9;">{task_title}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">Silakan review dan approve di Strategic Audit Hub.</p>
        <a href="https://fusionneural.web.id/dashboard/orchestrator" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#f59e0b;color:#000;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Review Sekarang</a>
        """,
    )
    return subject, html


def budget_alert_email(current_budget: int, threshold: int) -> tuple[str, str]:
    subject = "[FusionNeural] Budget Menipis!"
    html = _base_template(
        "Alert: Budget Menipis",
        f"""
        <p style="margin:0 0 12px;">Budget operasional Anda sudah di bawah threshold.</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #ef4444;">
          <p style="margin:0;color:#f1f5f9;">Sisa Budget: <strong>Rp {current_budget:,.0f}</strong></p>
          <p style="margin:8px 0 0;color:#94a3b8;">Threshold: Rp {threshold:,.0f}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">Segera review cash flow dan alokasi anggaran.</p>
        """,
    )
    return subject, html


def stock_low_email(product_name: str, current_qty: int, safety_stock: int) -> tuple[str, str]:
    subject = f"[FusionNeural] Stok Kritis: {product_name}"
    html = _base_template(
        "Alert: Stok Kritis",
        f"""
        <p style="margin:0 0 12px;">Stok produk sudah di bawah batas aman.</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #ef4444;">
          <p style="margin:0;color:#f1f5f9;"><strong>{product_name}</strong></p>
          <p style="margin:8px 0 0;color:#94a3b8;">Stok: {current_qty} unit | Safety Stock: {safety_stock} unit</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">Task restock otomatis sudah dibuat oleh sistem.</p>
        """,
    )
    return subject, html


def payment_success_email(amount: int, order_id: str, plan_name: str) -> tuple[str, str]:
    subject = "[FusionNeural] Pembayaran Berhasil"
    html = _base_template(
        "Pembayaran Berhasil",
        f"""
        <p style="margin:0 0 12px;">Terima kasih! Pembayaran Anda telah berhasil diproses.</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #10b981;">
          <p style="margin:0;color:#f1f5f9;">Plan: <strong>{plan_name}</strong></p>
          <p style="margin:8px 0 0;color:#94a3b8;">Jumlah: Rp {amount:,.0f}</p>
          <p style="margin:4px 0 0;color:#94a3b8;">Order ID: {order_id}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">Invoice Anda tersedia di dashboard Finance.</p>
        """,
    )
    return subject, html


def welcome_email(display_name: str, role: str) -> tuple[str, str]:
    subject = "Selamat Datang di FusionNeural!"
    html = _base_template(
        f"Selamat Datang, {display_name}!",
        f"""
        <p style="margin:0 0 12px;">Akun Anda telah berhasil dibuat dengan role <strong style="color:#760EFF;">{role}</strong>.</p>
        <p style="margin:0 0 12px;">Anda sekarang memiliki akses ke dashboard FusionNeural dengan 4 agen AI otonom yang siap membantu operasional bisnis Anda 24/7.</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#f1f5f9;font-weight:600;">Langkah Selanjutnya:</p>
          <ul style="color:#cbd5e1;padding-left:20px;margin:8px 0 0;">
            <li>Login ke dashboard Anda</li>
            <li>Kenali 4 agen AI (Manager, Admin, Marketing, Finance)</li>
            <li>Mulai dengan membuat task pertama</li>
          </ul>
        </div>
        <a href="https://fusionneural.web.id/login" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#760EFF;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Login Sekarang</a>
        """,
    )
    return subject, html
