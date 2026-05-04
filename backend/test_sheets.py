import os
import asyncio
from datetime import datetime, timezone
import httpx
from google.oauth2 import service_account
import google.auth.transport.requests

_CRED_PATH = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
GCP_CREDS = service_account.Credentials.from_service_account_file(
    _CRED_PATH,
    scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/firebase.database", "https://www.googleapis.com/auth/userinfo.email"]
)

def _refresh_gcp_token():
    if not GCP_CREDS.valid:
        req = google.auth.transport.requests.Request()
        GCP_CREDS.refresh(req)
    return GCP_CREDS.token

async def test_sheets():
    token = _refresh_gcp_token()
    sheet_id = "1Sm8fSB8Fa6X5kugX4I9tZBoCJ2-nBe-qtklyPdeRCiA"
    range_name = "Sheet1!A:D"
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{range_name}:append?valueInputOption=USER_ENTERED"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    body = {
        "values": [
            [datetime.now(timezone.utc).isoformat(), "test_agent", "Test output", "sess_123"]
        ]
    }
    print("Sending request to Sheets API...")
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=body)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")

if __name__ == "__main__":
    asyncio.run(test_sheets())
