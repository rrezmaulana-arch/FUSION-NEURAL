# Project: FUSION NEURAL
# services/sheets_logger.py — Google Sheets & Drive Side Effects

import os
import asyncio
from datetime import datetime, timezone
from typing import Optional


async def log_to_sheets(agent: str, output: str, session_id: str, gcp_creds=None):
    """Menyimpan log percakapan AI ke Google Sheets."""
    if not gcp_creds:
        return
    try:
        import httpx
        import google.auth.transport.requests

        def _refresh():
            if not gcp_creds.valid:
                gcp_creds.refresh(google.auth.transport.requests.Request())
            return gcp_creds.token

        token = await asyncio.to_thread(_refresh)
        if not token:
            return

        sheet_id = os.getenv("GOOGLE_SHEETS_ID", "1Sm8fSB8Fa6X5kugX4I9tZBoCJ2-nBe-qtklyPdeRCiA")
        range_name = "Sheet1!A:D"
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{range_name}:append?valueInputOption=USER_ENTERED"

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        body = {"values": [[datetime.now(timezone.utc).isoformat(), agent, output[:1500], session_id]]}

        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, headers=headers, json=body)
            if r.status_code == 200:
                print(f"[sheets] ✅ Berhasil mencatat log {agent} ke Google Sheets")
            else:
                print(f"[sheets] ⚠️ Gagal mencatat log: {r.text}")
    except Exception as e:
        print(f"[sheets] ❌ Error: {e}")


async def save_image_to_drive(prompt: str, image_bytes: bytes, mime_type: str, gcp_creds=None):
    """Simpan gambar hasil AI ke Google Drive."""
    if not gcp_creds:
        return
    try:
        def _upload():
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaIoBaseUpload
            import io as _io

            GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1-4ZF5YIZTnhWU786hTtBaefMSEo56I9l")
            service = build("drive", "v3", credentials=gcp_creds, cache_discovery=False)
            date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            safe_prompt = prompt[:40].replace("/", "_").replace("\\", "_")
            file_metadata = {
                "name": f"[AI Image] {safe_prompt} - {date_str}.jpg",
                "parents": [GOOGLE_DRIVE_FOLDER_ID]
            }
            media = MediaIoBaseUpload(_io.BytesIO(image_bytes), mimetype=mime_type, resumable=True)
            service.files().create(body=file_metadata, media_body=media, fields="id").execute()

        await asyncio.to_thread(_upload)
        print(f"[Drive] ✅ Gambar AI berhasil disimpan ke Drive")
    except Exception as e:
        print(f"[Drive] ❌ Gagal simpan gambar: {e}")
