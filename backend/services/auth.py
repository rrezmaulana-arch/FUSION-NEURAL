# Project: FUSION NEURAL
# services/auth.py — Firebase JWT Verification Middleware (Solusi Keamanan #1)
#
# ARSITEKTUR BARU:
#   Frontend mengirim Firebase ID Token (JWT dinamis per sesi)
#   Backend memverifikasi token ini via Firebase Admin SDK
#   TIDAK ADA lagi static API key yang bocor di browser pengguna

import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer(auto_error=False)

# Flag: apakah Firebase Admin SDK aktif?
_FIREBASE_ADMIN_ACTIVE = False
try:
    import firebase_admin
    from firebase_admin import auth as fb_auth
    if firebase_admin._apps:
        _FIREBASE_ADMIN_ACTIVE = True
        print("[auth] [OK] Firebase JWT verification AKTIF")
    else:
        print("[auth] [ALERT] Firebase Admin belum diinit — JWT verification BYPASS (dev mode)")
except ImportError:
    print("[auth] [ALERT] firebase-admin tidak terinstall — JWT verification BYPASS")


# Static API key sebagai fallback untuk backward compatibility
_STATIC_API_KEY = os.getenv("BACKEND_API_KEY", "")


def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> dict:
    """
    Verifikasi token dari frontend.
    
    Strategi (2 lapis):
    1. Jika Firebase Admin aktif → verifikasi sebagai Firebase JWT (AMAN)
    2. Jika tidak → cek static BACKEND_API_KEY (backward compatible, dev mode)
    
    Return dict berisi info user: { uid, email, role }
    """
    if credentials is None:
        # Cek header X-API-KEY sebagai fallback legacy
        raise HTTPException(
            status_code=401,
            detail="Autentikasi diperlukan. Kirim Firebase ID Token via Authorization: Bearer <token>"
        )

    token = credentials.credentials

    # ── Jalur 1: Firebase JWT Verification (PRODUKSI) ────────────────────────
    if _FIREBASE_ADMIN_ACTIVE:
        try:
            from firebase_admin import auth as fb_auth
            decoded = fb_auth.verify_id_token(token)
            email = decoded.get("email", "")
            # Role from custom claims (set via Firebase Admin), fallback to viewer
            role = decoded.get("role", "viewer")
            return {
                "uid": decoded.get("uid", ""),
                "email": email,
                "role": role,
                "provider": "firebase_jwt"
            }
        except Exception as e:
            # Token Firebase tidak valid — coba fallback ke static key
            if token == _STATIC_API_KEY and _STATIC_API_KEY:
                return {"uid": "dev", "email": "dev@fusionneural.id", "role": "manager", "provider": "static_key"}
            raise HTTPException(
                status_code=403,
                detail=f"Token Firebase tidak valid atau sudah expired: {str(e)[:100]}"
            )

    # ── Jalur 2: Static API Key Fallback (DEV / Backward Compat) ─────────────
    if _STATIC_API_KEY and token == _STATIC_API_KEY:
        return {"uid": "dev", "email": "dev@fusionneural.id", "role": "manager", "provider": "static_key"}

    # Tidak ada Firebase dan static key tidak cocok — tolak
    raise HTTPException(status_code=403, detail="Akses ditolak: Token tidak valid.")


def verify_token_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> Optional[dict]:
    """Verifikasi token tapi tidak memblokir jika tidak ada (untuk endpoint publik)."""
    try:
        return verify_token(credentials)
    except HTTPException:
        return None
