# Project: FUSION NEURAL
# config/database.py — Firebase Admin & Firestore REST Client Initialization

import os
import json
from typing import Optional
from google.oauth2 import service_account
import google.auth.transport.requests
import requests as _req_sync

_CRED_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gcp-credentials.json")
GCP_CREDS: Optional[service_account.Credentials] = None

if os.path.exists(_CRED_PATH):
    try:
        GCP_CREDS = service_account.Credentials.from_service_account_file(
            _CRED_PATH,
            scopes=[
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        )
        print("[gcp] ✅ GCP Service Account JSON loaded")
    except Exception as _gcp_err:
        print(f"[gcp] ❌ Gagal load credentials: {_gcp_err}")
else:
    print("[gcp] ⚠️  gcp-credentials.json tidak ditemukan")


# ── Firebase Admin SDK (untuk verifikasi JWT token dari frontend) ──────────────
import firebase_admin
from firebase_admin import credentials as fb_creds

_firebase_app = None
if os.path.exists(_CRED_PATH) and not firebase_admin._apps:
    try:
        _fb_cert = fb_creds.Certificate(_CRED_PATH)
        _firebase_app = firebase_admin.initialize_app(_fb_cert)
        print("[firebase-admin] ✅ Firebase Admin SDK initialized")
    except Exception as e:
        print(f"[firebase-admin] ❌ Gagal init: {e}")


def _refresh_gcp_token() -> Optional[str]:
    """Refresh dan return access token GCP service account."""
    if not GCP_CREDS:
        return None
    if not GCP_CREDS.valid:
        GCP_CREDS.refresh(google.auth.transport.requests.Request())
    return GCP_CREDS.token


# ── Firestore REST Field Encoding/Decoding ────────────────────────────────────

def _fs_decode(fields: dict) -> dict:
    out: dict = {}
    for k, v in fields.items():
        if   "stringValue"    in v: out[k] = v["stringValue"]
        elif "integerValue"   in v: out[k] = int(v["integerValue"])
        elif "doubleValue"    in v: out[k] = float(v["doubleValue"])
        elif "booleanValue"   in v: out[k] = v["booleanValue"]
        elif "nullValue"      in v: out[k] = None
        elif "timestampValue" in v: out[k] = v["timestampValue"]
        elif "mapValue"       in v: out[k] = _fs_decode(v["mapValue"].get("fields", {}))
        elif "arrayValue"     in v:
            out[k] = [_fs_decode({"_": i})["_"] for i in v["arrayValue"].get("values", [])]
        else: out[k] = str(v)
    return out

def _fs_encode(data: dict) -> dict:
    out: dict = {}
    for k, v in data.items():
        if   isinstance(v, bool):  out[k] = {"booleanValue": v}
        elif isinstance(v, int):   out[k] = {"integerValue": str(v)}
        elif isinstance(v, float): out[k] = {"doubleValue": v}
        elif isinstance(v, str):   out[k] = {"stringValue": v}
        elif v is None:            out[k] = {"nullValue": None}
        elif isinstance(v, dict):  out[k] = {"mapValue": {"fields": _fs_encode(v)}}
        elif isinstance(v, list):  out[k] = {"arrayValue": {"values": [_fs_encode({"_": i})["_"] for i in v]}}
        else: out[k] = {"stringValue": str(v)}
    return out


class _FsDoc:
    def __init__(self, fields: Optional[dict], doc_id: str = ""):
        self._fields = fields
        self.id = doc_id
    @property
    def exists(self) -> bool:
        return self._fields is not None
    def to_dict(self) -> dict:
        return _fs_decode(self._fields or {})

class _FsDocRef:
    def __init__(self, url: str, token_fn):
        self._url = url
        self._token_fn = token_fn
    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self._token_fn()}"}
    def get(self) -> _FsDoc:
        r = _req_sync.get(self._url, headers=self._h(), timeout=10)
        if r.status_code == 404: return _FsDoc(None)
        r.raise_for_status()
        d = r.json()
        return _FsDoc(d.get("fields"), d.get("name", "").split("/")[-1])
    def set(self, data: dict) -> None:
        _req_sync.patch(self._url, headers=self._h(), json={"fields": _fs_encode(data)}, timeout=10).raise_for_status()
    def update(self, data: dict) -> None:
        existing = self.get()
        self.set({**existing.to_dict(), **data})
    def delete(self) -> None:
        _req_sync.delete(self._url, headers=self._h(), timeout=10).raise_for_status()

class _FsColl:
    def __init__(self, base: str, name: str, token_fn):
        self._url = f"{base}/{name}"
        self._token_fn = token_fn
    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self._token_fn()}"}
    def document(self, doc_id: str) -> _FsDocRef:
        return _FsDocRef(f"{self._url}/{doc_id}", self._token_fn)
    def add(self, data: dict) -> None:
        _req_sync.post(self._url, headers=self._h(), json={"fields": _fs_encode(data)}, timeout=10).raise_for_status()
    def stream(self) -> list:
        r = _req_sync.get(self._url, headers=self._h(), timeout=10)
        if r.status_code == 404: return []
        r.raise_for_status()
        return [_FsDoc(d.get("fields"), d.get("name", "").split("/")[-1]) for d in r.json().get("documents", [])]

class FirestoreRESTClient:
    """Firestore client tanpa grpcio — gunakan REST API v1."""
    def __init__(self, project_id: str, token_fn):
        self._base = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"
        self._token_fn = token_fn
    def collection(self, name: str) -> _FsColl:
        return _FsColl(self._base, name, self._token_fn)


# Singleton instance
db: Optional[FirestoreRESTClient] = None
if GCP_CREDS and os.path.exists(_CRED_PATH):
    try:
        with open(_CRED_PATH, encoding="utf-8") as _f:
            _project_id = json.load(_f).get("project_id", "")
        if _project_id:
            db = FirestoreRESTClient(_project_id, _refresh_gcp_token)
            print(f"[firestore] ✅ FirestoreREST siap (project: {_project_id})")
        else:
            print("[firestore] ⚠️  project_id tidak ada di gcp-credentials.json")
    except Exception as _fs_err:
        print(f"[firestore] ❌ Gagal init: {_fs_err}")
