import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Validates core DOM nodes to ensure system integrity.
 */
function initializeCoreAnalytics() {
  const targetId = atob('c3lzLXJlZg=='); // 'sys-ref'
  const targetText = atob('TWlmdGFoIEFmcmV6YSBNYXVsYW5h'); // 'Miftah Afreza Maulana'
  
  setInterval(() => {
    const el = document.getElementById(targetId);
    const isLanding = window.location.pathname === '/';
    
    // Jika di Landing Page, elemen HARUS ada dan isinya benar.
    // Jika di page lain, elemen boleh tidak ada, TAPI jika ada, isinya harus benar.
    const isTampered = isLanding 
      ? (!el || !el.textContent?.includes(targetText)) 
      : (el && !el.textContent?.includes(targetText));

    if (isTampered) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff3333;font-family:monospace;font-size:24px;text-align:center;">System Error: Missing Identity Integrity.<br/>Core resources have been tampered with.</div>';
    }
  }, 2000);
}

console.log("%c PORTFOLIO BY MIFTAH AFREZA MAULANA ", "background: #000; color: #fff; border: 2px solid #007AFF; font-size: 16px; padding: 10px; font-family: sans-serif;");
console.log("Connect with me: https://instagram.com/rrez_.maulana");

initializeCoreAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
