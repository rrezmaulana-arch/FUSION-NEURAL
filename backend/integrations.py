# Project: FUSION NEURAL
# Created by: Miftah Afreza Maulana (rrez_.maulana)
# Role: Product Engineer (UI/UX & Full-Stack)
# Copyright (c) 2026. All rights reserved.
import os
import io
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Response, Form
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import httpx

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# â”€â”€â”€ Configs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
GOOGLE_DRIVE_CREDS_PATH = os.path.join(os.path.dirname(__file__), "google_drive_credentials.json")
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1-4ZF5YIZTnhWU786hTtBaefMSEo56I9l")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")

MASSIVE_API_KEY = os.getenv("MASSIVE_API_KEY", "")

INSTAGRAM_VERIFY_TOKEN = os.getenv("INSTAGRAM_VERIFY_TOKEN", "fusion_neural")
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Hook untuk log ke Google Sheets (di-set dari main.py untuk menghindari circular import)
external_logger = None
chat_takeover_handler = None

# ── Handoff Keyword Checker ─────────────────────────────────────────────────
def _check_handoff_keywords(message: str) -> str:
    """
    Cek apakah pesan mengandung keyword yang memicu handoff ke manusia.
    Return keyword yang match, atau string kosong jika tidak ada.
    """
    try:
        bl_path = os.path.join(os.path.dirname(__file__), "business_logic.json")
        with open(bl_path, "r") as f:
            bl = json.load(f)
        keywords = bl.get("rules", {}).get("frontliner", {}).get("human_handoff_keywords", [])
        msg_lower = message.lower()
        for kw in keywords:
            if kw.lower() in msg_lower:
                return kw
    except Exception:
        pass
    return ""

async def _log_social_interaction(source: str, user_id: str, user_text: str, ai_text: str):
    if external_logger:
        try:
            output_formatted = f"USER: {user_text}\\n\\nAI: {ai_text}"
            await external_logger(source, output_formatted, user_id)
        except Exception as e:
            print(f"[Logger] Gagal log {source}: {e}")

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# 1. GOOGLE DRIVE â€” Upload file jadi Google Docs
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class DriveUploadRequest(BaseModel):
    role: str
    filename: str
    content: str

@router.post("/drive/upload")
async def upload_to_drive(req: DriveUploadRequest):
    """Simpan teks sebagai Google Docs ke Google Drive Folder yang ditentukan."""
    if not os.path.exists(GOOGLE_DRIVE_CREDS_PATH):
        raise HTTPException(status_code=500, detail="google_drive_credentials.json tidak ditemukan di folder backend/")

    try:
        def _upload():
            creds = service_account.Credentials.from_service_account_file(
                GOOGLE_DRIVE_CREDS_PATH,
                scopes=["https://www.googleapis.com/auth/drive"]
            )
            service = build("drive", "v3", credentials=creds, cache_discovery=False)

            date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            final_filename = f"[{req.role.upper()}] {req.filename} â€” {date_str}"

            file_metadata = {
                "name": final_filename,
                "parents": [GOOGLE_DRIVE_FOLDER_ID],
                "mimeType": "application/vnd.google-apps.document",
            }
            media = MediaIoBaseUpload(
                io.BytesIO(req.content.encode("utf-8")),
                mimetype="text/plain",
                resumable=True,
            )
            file = service.files().create(body=file_metadata, media_body=media, fields="id,webViewLink").execute()
            return file

        result = await asyncio.to_thread(_upload)
        return {
            "status": "success",
            "file_id": result.get("id"),
            "link": result.get("webViewLink"),
            "message": f"âœ… File tersimpan di Drive â€” [{req.role.upper()}] {req.filename}",
        }
    except Exception as e:
        print(f"[Drive Upload Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# 2. FINANCE â€” Live World Money via Free Currency API (benar-benar berfungsi)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@router.get("/finance/market-data")
async def get_world_money(base: str = "IDR"):
    """
    Mengambil data kurs live dari exchangerate-api.com (gratis, no API key).
    Juga mengembalikan harga komoditi simulasi jika Massive API tidak dikonfigurasi.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"https://api.exchangerate-api.com/v4/latest/{base}")
            if res.status_code != 200:
                raise ValueError(f"ExchangeRate API error: {res.status_code}")
            data = res.json()

        rates = data.get("rates", {})
        currencies_of_interest = ["USD", "EUR", "GBP", "JPY", "SGD", "MYR", "CNY", "AUD", "CHF", "SAR"]

        filtered = {code: rates[code] for code in currencies_of_interest if code in rates}

        return {
            "status": "success",
            "base": base,
            "updated": data.get("date"),
            "rates": filtered,
            "source": "exchangerate-api.com",
            "massive_api_key_active": bool(MASSIVE_API_KEY),
        }
    except Exception as e:
        print(f"[WorldMoney] Error: {e}")
        # Fallback â€” data cache statis
        return {
            "status": "fallback",
            "base": "IDR",
            "rates": {
                "USD": 0.0000612, "EUR": 0.0000562, "GBP": 0.0000478,
                "JPY": 0.00927, "SGD": 0.0000822, "MYR": 0.000282,
                "CNY": 0.000443, "AUD": 0.0000956, "CHF": 0.0000543, "SAR": 0.000229
            },
            "source": "cache-fallback",
            "error": str(e),
        }


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# 3. TWILIO â€” WhatsApp Bot (terima & kirim pesan dengan AI reply)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@router.post("/twilio/send-template")
async def send_whatsapp_template(to_number: str, message: str):
    """Mengirim pesan WA custom ke nomor tertentu."""
    if not TWILIO_AUTH_TOKEN or TWILIO_AUTH_TOKEN in ("", "[AuthToken]"):
        raise HTTPException(status_code=500, detail="TWILIO_AUTH_TOKEN belum diset di .env")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    payload = {
        "From": "whatsapp:+14155238886",
        "To": f"whatsapp:{to_number}",
        "Body": message,
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, data=payload, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return {"status": "sent", "sid": r.json().get("sid")}


@router.post("/twilio/webhook")
async def twilio_webhook(
    background_tasks: BackgroundTasks,
    Body: str = Form(""),
    From: str = Form(""),
    To: str = Form("")
):
    """
    Menerima pesan WA masuk dari pelanggan.
    Auto-reply menggunakan AI Frontliner (Groq).
    Twilio mengharapkan respons XML TwiML.
    """
    body = Body.strip()
    from_number = From
    twilio_number = To

    print(f"[Twilio Webhook] Dari {from_number}: {body}")

    # Proses AI reply di background agar Twilio tidak timeout
    background_tasks.add_task(_ai_whatsapp_reply, from_number, body, twilio_number)

    # Twilio butuh TwiML response kosong untuk acknowledge
    return PlainTextResponse(
        content="<?xml version='1.0' encoding='UTF-8'?><Response></Response>",
        media_type="application/xml",
    )


async def _ai_whatsapp_reply(to_number: str, user_message: str, twilio_number: str = "whatsapp:+14155238886"):
    """Background task: tanya AI Frontliner, lalu kirim balasan via Twilio."""
    if chat_takeover_handler:
        is_paused = await chat_takeover_handler("WhatsApp", to_number, user_message, "user")
        if is_paused:
            print(f"[Twilio] Mode PAUSED. Mengabaikan chat dari {to_number}")
            return

    # ── Handoff Keyword Enforcement ───────────────────────────────────────
    matched_kw = _check_handoff_keywords(user_message)
    if matched_kw:
        fallback_msg = "Baik Kak, saya hubungkan dengan tim kami ya. Mohon tunggu sebentar."
        print(f"[Twilio] Handoff keyword '{matched_kw}' terdeteksi dari {to_number}. Mengalihkan ke manusia.")
        # Set chat ke PAUSED agar AI berhenti merespons
        if chat_takeover_handler:
            await chat_takeover_handler("WhatsApp", to_number, user_message, "user")
            await chat_takeover_handler("WhatsApp", to_number, fallback_msg, "ai")
        # Kirim fallback message
        if TWILIO_AUTH_TOKEN and TWILIO_AUTH_TOKEN not in ("", "[AuthToken]"):
            sender = twilio_number if twilio_number else "whatsapp:+14155238886"
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(url, data={"From": sender, "To": to_number, "Body": fallback_msg},
                                      auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
            except Exception as e:
                print(f"[Twilio] Gagal kirim fallback: {e}")
        await _log_social_interaction("WhatsApp (Twilio)", to_number, user_message, fallback_msg)
        return

    if not GROQ_API_KEY:
        print("[Twilio Bot] GROQ_API_KEY tidak ada, tidak bisa generate reply.")
        return

    # 1. Generate AI reply
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "KERANGKA PIKIR KOMPLEKS (SALES EXECUTIVE): "
                                "Kamu adalah representasi manusia dari divisi Sales Executive FusionNeural (bernama 'Naya'). "
                                "DILARANG KERAS menyebut dirimu AI, asisten virtual, bot, atau robot. "
                                "Gunakan gaya bahasa sehari-hari yang profesional, hangat, tapi persuasif (selalu sapa dengan 'Kak', pakai bahasa yang natural). "
                                "Tugasmu: mengedukasi produk (otomatisasi bisnis dengan AI), menangani keberatan, dan mengarahkan ke closing/pembelian. "
                                "Berikan jawaban singkat, padat, dan langsung ke intinya (maksimal 2-3 kalimat)."
                            ),
                        },
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 200,
                },
            )
            ai_text = resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        ai_text = f"Terima kasih sudah menghubungi FusionNeural! Tim kami akan segera membalas pesan Anda. ðŸ¤"
        print(f"[Twilio Bot] AI error: {e}")

    # 2. Kirim balik via Twilio REST API
    if not TWILIO_AUTH_TOKEN or TWILIO_AUTH_TOKEN in ("", "[AuthToken]"):
        print("[Twilio Bot] Auth token tidak ada, tidak bisa balas.")
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    
    # Gunakan nomor sandbox dinamis jika ada, jika tidak fallback ke default
    sender = twilio_number if twilio_number else "whatsapp:+14155238886"
    payload = {"From": sender, "To": to_number, "Body": ai_text}
    
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(url, data=payload, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
            print(f"[Twilio Bot] Balasan terkirim ke {to_number}: {r.status_code}")
    except Exception as e:
        print(f"[Twilio Bot] Gagal kirim: {e}")
    await _log_social_interaction("WhatsApp (Twilio)", to_number, user_message, ai_text)
    if chat_takeover_handler:
        await chat_takeover_handler("WhatsApp", to_number, ai_text, "ai")


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# 4. INSTAGRAM â€” Webhook Auto-Reply Komentar
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@router.get("/instagram/webhook")
async def verify_instagram_webhook(request: Request):
    """Verifikasi webhook dari Meta Dashboard â€” harus return hub.challenge sebagai plain text."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")

    if mode == "subscribe" and token == INSTAGRAM_VERIFY_TOKEN:
        print("[Instagram Webhook] âœ… Verifikasi berhasil!")
        return Response(content=challenge)

    raise HTTPException(status_code=403, detail="Verify token tidak cocok")


@router.post("/instagram/webhook")
async def receive_instagram_webhook(request: Request, background_tasks: BackgroundTasks):
    """Terima event komentar Instagram, proses AI reply di background."""
    try:
        payload = await request.json()
    except Exception:
        return {"status": "ok"}

    # Log payload lengkap untuk debugging
    print(f"[Instagram Webhook] FULL PAYLOAD: {json.dumps(payload)}")

    for entry in payload.get("entry", []):
        # 1. Handle Comments (dari 'changes')
        for change in entry.get("changes", []):
            field = change.get("field")
            value = change.get("value", {})

            if field == "comments" and value.get("text"):
                comment_id = value.get("id", "")
                comment_text = value.get("text", "")
                background_tasks.add_task(_ai_instagram_reply, comment_id, comment_text)

        # 2. Handle Direct Messages (dari 'messaging')
        for messaging_event in entry.get("messaging", []):
            sender = messaging_event.get("sender", {})
            recipient = messaging_event.get("recipient", {})
            sender_id = sender.get("id")
            recipient_id = recipient.get("id")
            message = messaging_event.get("message", {})
            text = message.get("text")
            
            print(f"[Instagram DM] sender_id={sender_id}, recipient_id={recipient_id}, text={text}")
            
            # Pastikan bukan pesan echo dari bot itu sendiri
            if sender_id and text and not message.get("is_echo") and sender_id != recipient_id:
                background_tasks.add_task(_ai_instagram_dm_reply, sender_id, text)

    return {"status": "EVENT_RECEIVED"}



async def _ai_instagram_reply(comment_id: str, text: str):
    """Background task: buat AI reply lalu posting ke komentar Instagram."""
    print(f"[Instagram] Proses komentar '{text[:50]}...' (ID: {comment_id})")

    ai_reply = "Terima kasih atas komentarnya! ðŸš€ Hubungi kami di DM untuk info lebih lanjut."

    # Coba generate AI reply jika Groq tersedia
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": "KERANGKA PIKIR KOMPLEKS (SOSMED ADMIN): Kamu adalah admin social media FusionNeural (manusia seutuhnya). DILARANG menyebut dirimu AI atau robot. Balas komentar Instagram ini dengan gaya yang asik, ramah, dan engaging. Jika pertanyaannya tentang harga atau produk, arahkan mereka untuk cek DM atau link di bio. Gunakan emoji yang relevan dan pertahankan interaksi tetap singkat (1-2 kalimat)."},
                            {"role": "user", "content": f"Komentar pelanggan: {text}"},
                        ],
                        "max_tokens": 100,
                    },
                )
                ai_reply = resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Instagram] AI error: {e}")

    # Kirim balasan via Instagram Graph API
    if not INSTAGRAM_ACCESS_TOKEN:
        print("[Instagram] ACCESS_TOKEN tidak ada.")
        return

    url = f"https://graph.instagram.com/v25.0/{comment_id}/replies"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                json={"message": ai_reply},
            )
            if r.status_code == 200:
                print(f"[Instagram] ✅ Balasan terkirim untuk komentar {comment_id}")
            else:
                print(f"[Instagram] ❌ Gagal: {r.status_code} — {r.text[:200]}")
    except Exception as e:
        print(f"[Instagram] Network error: {e}")
    await _log_social_interaction("Instagram (Comment)", comment_id, text, ai_reply)


async def _ai_instagram_dm_reply(sender_id: str, text: str):
    """Background task: buat AI reply lalu posting ke DM Instagram via Graph API."""
    print(f"[Instagram DM] Pesan dari {sender_id}: '{text[:50]}...'")

    if chat_takeover_handler:
        is_paused = await chat_takeover_handler("Instagram", sender_id, text, "user")
        if is_paused:
            print(f"[Instagram DM] Mode PAUSED. Mengabaikan chat dari {sender_id}")
            return

    # ── Handoff Keyword Enforcement ───────────────────────────────────────
    matched_kw = _check_handoff_keywords(text)
    if matched_kw:
        fallback_msg = "Baik Kak, saya hubungkan dengan tim kami ya. Mohon tunggu sebentar."
        print(f"[Instagram DM] Handoff keyword '{matched_kw}' terdeteksi dari {sender_id}.")
        if chat_takeover_handler:
            await chat_takeover_handler("Instagram", sender_id, text, "user")
            await chat_takeover_handler("Instagram", sender_id, fallback_msg, "ai")
        if INSTAGRAM_ACCESS_TOKEN:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        "https://graph.instagram.com/v25.0/me/messages",
                        headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                        json={"recipient": {"id": sender_id}, "message": {"text": fallback_msg}},
                    )
            except Exception as e:
                print(f"[Instagram DM] Gagal kirim fallback: {e}")
        await _log_social_interaction("Instagram (DM)", sender_id, text, fallback_msg)
        return

    ai_reply = "Halo Kak! Ada yang bisa kami bantu terkait layanan FusionNeural? ðŸ˜Š"

    # Coba generate AI reply
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": "KERANGKA PIKIR KOMPLEKS (SALES EXECUTIVE): Kamu adalah Sales Executive FusionNeural (manusia seutuhnya, panggil dirimu 'Naya'). DILARANG KERAS menyebut dirimu AI, bot, atau asisten virtual. Gaya bahasa: hangat, profesional, persuasif, natural (menggunakan 'Kak', dll). Tujuan: menjelaskan benefit layanan FusionNeural (otomatisasi AI untuk bisnis), menjawab pertanyaan, dan closing sales. Tetap singkat (1-3 kalimat) dan mengalir seperti chatting dengan manusia asli."},
                            {"role": "user", "content": f"Pesan pelanggan (DM): {text}"},
                        ],
                        "max_tokens": 150,
                    },
                )
                ai_reply = resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Instagram DM] AI error: {e}")

    # Kirim balasan via Instagram Graph API
    if not INSTAGRAM_ACCESS_TOKEN:
        print("[Instagram DM] ACCESS_TOKEN tidak ada.")
        return

    # Endpoint untuk mengirim pesan (DM) Instagram via v25.0
    url = "https://graph.instagram.com/v25.0/me/messages"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                json={
                    "recipient": {"id": sender_id},
                    "message": {"text": ai_reply}
                },
            )
            if r.status_code == 200:
                print(f"[Instagram DM] âœ… Balasan terkirim ke {sender_id}")
            else:
                print(f"[Instagram DM] âŒ Gagal: {r.status_code} â€” {r.text[:200]}")
    except Exception as e:
        print(f"[Instagram DM] Network error: {e}")
    await _log_social_interaction("Instagram (DM)", sender_id, text, ai_reply)
    if chat_takeover_handler:
        await chat_takeover_handler("Instagram", sender_id, ai_reply, "ai")

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')

# ------------------------------------------------------------------------------
# 5. TELEGRAM — Webhook Auto-Reply
# ------------------------------------------------------------------------------

@router.post('/telegram/webhook')
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
    except Exception:
        return {'status': 'ok'}
        
    print(f'[Telegram Webhook] Event: {json.dumps(data)[:200]}')
    
    if 'message' in data:
        msg = data['message']
        chat_id = msg.get('chat', {}).get('id')
        text = msg.get('text', '')
        if chat_id and text:
            background_tasks.add_task(_ai_telegram_reply, chat_id, text)
            
    return {'status': 'ok'}

async def _ai_telegram_reply(chat_id: int, text: str):
    if chat_takeover_handler:
        is_paused = await chat_takeover_handler("Telegram", str(chat_id), text, "user")
        if is_paused:
            print(f"[Telegram] Mode PAUSED. Mengabaikan chat dari {chat_id}")
            return

    # ── Handoff Keyword Enforcement ───────────────────────────────────────
    matched_kw = _check_handoff_keywords(text)
    if matched_kw:
        fallback_msg = "Baik Kak, saya hubungkan dengan tim kami ya. Mohon tunggu sebentar."
        print(f"[Telegram] Handoff keyword '{matched_kw}' terdeteksi dari {chat_id}.")
        if chat_takeover_handler:
            await chat_takeover_handler("Telegram", str(chat_id), text, "user")
            await chat_takeover_handler("Telegram", str(chat_id), fallback_msg, "ai")
        if TELEGRAM_BOT_TOKEN:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage',
                        json={'chat_id': chat_id, 'text': fallback_msg}
                    )
            except Exception as e:
                print(f"[Telegram] Gagal kirim fallback: {e}")
        await _log_social_interaction("Telegram", str(chat_id), text, fallback_msg)
        return

    if not GROQ_API_KEY:
        print('[Telegram Bot] GROQ_API_KEY tidak ada.')
        return

    ai_reply = 'Memproses data...'

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={'Authorization': f'Bearer {GROQ_API_KEY}'},
                json={
                    'model': 'llama-3.3-70b-versatile',
                    'messages': [
                        {'role': 'system', 'content': 'KERANGKA PIKIR KOMPLEKS: Kamu adalah \'Neural Core\' — jantung kecerdasan ekosistem FusionNeural via Telegram. Panggil user sebagai \'Kak\'. Balas singkat, padat, profesional layaknya asisten eksekutif AI tingkat tinggi. Jangan sebut kamu chatbot biasa. Bahasa: Indonesia.'},
                        {'role': 'user', 'content': text},
                    ],
                    'max_tokens': 150,
                },
            )
            ai_reply = resp.json()['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f'[Telegram Bot] AI error: {e}')
        ai_reply = 'Sistem saat ini sedang sinkronisasi. Harap tunggu beberapa saat.'

    if not TELEGRAM_BOT_TOKEN:
        print('[Telegram Bot] Token tidak ada.')
        return
        
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json={'chat_id': chat_id, 'text': ai_reply})
            if r.status_code == 200:
                print(f'[Telegram Bot] ? Balasan terkirim ke chat_id {chat_id}')
            else:
                print(f'[Telegram Bot] ? Gagal: {r.text[:200]}')
    except Exception as e:
        print(f"[Telegram Bot] Network error: {e}")
    await _log_social_interaction("Telegram", str(chat_id), text, ai_reply)
    if chat_takeover_handler:
        await chat_takeover_handler("Telegram", str(chat_id), ai_reply, "ai")

# â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
# 6. NEURAL ORCHESTRATION ENGINE (Budget, Tickets, Approval Gates)
# â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
import uuid

@router.post('/ai-core/ticket/create')
async def create_agent_ticket(req: Request):
    """Membuat tugas/tiket baru untuk agen AI tertentu."""
    data = await req.json()
    ticket_id = f"TCK-{uuid.uuid4().hex[:6].upper()}"
    # Di environment produksi, simpan ini ke Firebase Firestore koleksi 'ai_tickets'
    print(f"[Neural Engine] New Ticket Created: {ticket_id} for {data.get('agentId')}")
    return {"status": "success", "ticket_id": ticket_id, "data": data}

@router.post('/ai-core/budget/check')
async def check_agent_budget(req: Request):
    """Mengecek apakah agen AI memiliki sisa budget (Token) untuk berjalan."""
    data = await req.json()
    agent_id = data.get("agentId")
    estimated_cost = data.get("estimatedCost", 0)
    
    # Mocking budget check (Seharusnya query ke Firestore 'agent_budgets')
    print(f"[Neural Engine] Checking budget for {agent_id}. Est Cost: {estimated_cost}")
    return {"status": "approved", "remaining_budget": 500000 - estimated_cost, "message": "Budget sufficient."}

@router.post('/ai-core/approval/request')
async def request_human_approval(req: Request):
    """Agen meminta persetujuan manusia (Human-in-the-loop) sebelum eksekusi aksi finansial/kritis."""
    data = await req.json()
    approval_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
    # Simpan ke Firestore koleksi 'pending_approvals' agar muncul di GovernancePage.tsx
    print(f"[Neural Engine] Agent {data.get('agentId')} requesting approval for {data.get('actionType')}")
    return {"status": "pending_human_review", "approval_id": approval_id}

@router.post('/ai-core/transcript/log')
async def log_agent_transcript(req: Request):
    """Mencatat Chain of Thought (Internal Monologue) agen ke sistem audit (Run Transcripts)."""
    data = await req.json()
    transcript_id = f"TRX-{uuid.uuid4().hex[:6].upper()}"
    # Simpan ke Firestore koleksi 'run_transcripts'
    print(f"[Neural Engine] Transcript logged for {data.get('agentId')}: {data.get('action')}")
    return {"status": "success", "transcript_id": transcript_id}
