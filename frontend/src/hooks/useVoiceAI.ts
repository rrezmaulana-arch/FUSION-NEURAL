/**
 * Project: FUSION NEURAL
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect, useState } from 'react';

export function useVoiceAI() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string, voiceType: 'manager' | 'admin' | 'finance' | 'marketing' = 'manager') => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean up text (remove emojis, markdown, UI tags)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // Emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/\[.*?\]/g, '') // Tags like [MENUNGGU PERSETUJUAN]
      .replace(/✅|⚠️|🤖|👑|🗣️|🌐/g, '') // Common icons
      .replace(/\*/g, '') // Markdown bold
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Customize pitch/rate based on Agent Type for Sci-Fi J.A.R.V.I.S vibe
    switch(voiceType) {
      case 'manager':
        utterance.pitch = 0.8;
        utterance.rate = 1.05;
        break;
      case 'finance':
        utterance.pitch = 1.1; // Slightly higher, calculating
        utterance.rate = 1.1;
        break;
      case 'admin':
        utterance.pitch = 0.6; // Deep, robust
        utterance.rate = 0.95;
        break;
      case 'marketing':
        utterance.pitch = 1.2; // Energetic
        utterance.rate = 1.15;
        break;
      default:
        utterance.pitch = 0.9;
        utterance.rate = 1;
    }

    // Try to find English or Indonesian voice that sounds robotic/clear
    const preferredVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google')) || 
                           voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                           voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return { speak, stop, isSpeaking };
}
