import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Di Vite, gunakan import.meta.env secara langsung. 
// Vercel akan otomatis mengganti ini saat proses build jika sudah di-set di dashboard.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inisialisasi Firebase (cek agar tidak inisialisasi ganda saat hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Auth dan DB (bisa jalan di lingkungan server/build)
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics khusus Browser. 
// Menggunakan isSupported() agar tidak eror saat proses build di Vercel.
export const analytics = typeof window !== "undefined" 
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  : null;

export default app;