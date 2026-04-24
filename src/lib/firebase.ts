import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCmI02tN-czvSp16wA4ik8aSwZhOxQxLmg",
  authDomain: "fusion-neural.firebaseapp.com",
  projectId: "fusion-neural",
  storageBucket: "fusion-neural.firebasestorage.app",
  messagingSenderId: "916787468816",
  appId: "1:916787468816:web:7532546cc12427d1c20895",
  measurementId: "G-H1X8KLH426"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
