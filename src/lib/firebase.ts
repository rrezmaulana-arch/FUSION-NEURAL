import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper for Hybrid Environment
// Vite requires static string replacement (import.meta.env.KEY)
// Vercel Serverless requires process.env.KEY
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' && process.env.VITE_FIREBASE_API_KEY 
    ? process.env.VITE_FIREBASE_API_KEY 
    : import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain: typeof process !== 'undefined' && process.env.VITE_FIREBASE_AUTH_DOMAIN 
    ? process.env.VITE_FIREBASE_AUTH_DOMAIN 
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId: typeof process !== 'undefined' && process.env.VITE_FIREBASE_PROJECT_ID 
    ? process.env.VITE_FIREBASE_PROJECT_ID 
    : import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket: typeof process !== 'undefined' && process.env.VITE_FIREBASE_STORAGE_BUCKET 
    ? process.env.VITE_FIREBASE_STORAGE_BUCKET 
    : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId: typeof process !== 'undefined' && process.env.VITE_FIREBASE_MESSAGING_SENDER_ID 
    ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID 
    : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId: typeof process !== 'undefined' && process.env.VITE_FIREBASE_APP_ID 
    ? process.env.VITE_FIREBASE_APP_ID 
    : import.meta.env.VITE_FIREBASE_APP_ID,

  measurementId: typeof process !== 'undefined' && process.env.VITE_FIREBASE_MEASUREMENT_ID 
    ? process.env.VITE_FIREBASE_MEASUREMENT_ID 
    : import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
