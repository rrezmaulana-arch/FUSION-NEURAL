/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────
// 🔐 FIREBASE SECURE INIT — FusionNeural (Client SDK Only)
// File ini HANYA untuk browser (Vite build).
// Vercel Serverless Functions di /api/ tidak boleh mengimport
// file ini secara langsung — gunakan Firebase Admin SDK.
// ─────────────────────────────────────────────────────────────

// Casting ke `any` diperlukan agar aman saat TypeScript
// mengcompile dalam konteks Node (tsconfig.node.json),
// yang tidak memiliki type 'vite/client' (ImportMeta.env).
const _env = (import.meta as any).env ?? {};

const FIREBASE_CONFIG = {
  apiKey:            _env.VITE_FIREBASE_API_KEY            as string | undefined,
  authDomain:        _env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined,
  projectId:         _env.VITE_FIREBASE_PROJECT_ID         as string | undefined,
  storageBucket:     _env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
  messagingSenderId: _env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             _env.VITE_FIREBASE_APP_ID             as string | undefined,
  measurementId:     _env.VITE_FIREBASE_MEASUREMENT_ID     as string | undefined,
};

// ─── Validasi env vars wajib ──────────────────────────────────
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

for (const key of REQUIRED_KEYS) {
  if (!FIREBASE_CONFIG[key]) {
    console.warn(
      `[FusionNeural] Firebase env var manquante: VITE_FIREBASE_${key
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()}. Periksa file .env Anda.`
    );
  }
}

// ─── Singleton — hindari inisialisasi duplikat ────────────────
const app = getApps().length === 0
  ? initializeApp(FIREBASE_CONFIG)
  : getApps()[0];

// ─── Auth & Firestore ─────────────────────────────────────────
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Analytics — Lazy init, HANYA di browser ─────────────────
const isBrowser = typeof globalThis !== 'undefined' && 'window' in globalThis;

let _analyticsInstance: Analytics | null = null;

export function getFirebaseAnalytics(): Analytics | null {
  if (!isBrowser || !FIREBASE_CONFIG.measurementId) return null;
  if (!_analyticsInstance) {
    try {
      _analyticsInstance = getAnalytics(app);
    } catch (err) {
      console.warn('[FusionNeural] Analytics init gagal:', err);
    }
  }
  return _analyticsInstance;
}

// Backward-compat export
export const analytics = isBrowser ? getFirebaseAnalytics() : null;
