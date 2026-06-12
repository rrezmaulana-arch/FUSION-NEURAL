/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Send, X, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface Message {
  role: "user" | "bot";
  text: string;
}

interface ChatBotProps {
  userRole?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ userRole }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate sessionId sekali saat komponen mount — digunakan oleh Python Backend untuk memory
  const sessionId = useRef<string>(
    `chatbot_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`
  );

  // ── Realtime Agent Status via Firebase Firestore ─────────────────
  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    // Initial fetch
    const q = query(collection(db, 'realtime_signals'), orderBy('created_at', 'desc'), limit(5));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data) {
        const thirtySecondsAgo = Date.now() - 30_000;
        const active = [...new Set(data.filter((d: any) => new Date(d.created_at).getTime() > thirtySecondsAgo).map((d: any) => String(d.agent).toLowerCase()))];
        setActiveAgents(active as string[]);
      }
    });

    // Realtime subscription
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > 0) {
        const payload = data[0] as any;
        const agentName = String(payload.agent).toLowerCase();
        setActiveAgents(prev => {
          if (!prev.includes(agentName)) return [...prev, agentName];
          return prev;
        });
        
        // Auto-remove after 30s
        setTimeout(() => {
          setActiveAgents(prev => prev.filter(a => a !== agentName));
        }, 30000);
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // ── Scroll logic ──────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isAtBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 60;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    if (isLoading) scrollToBottom(false);
  }, [isLoading]);

  // ── Core: kirim pesan ke /api/agents (Direct → Python) ──────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const newMessages: Message[] = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/trigger-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "frontliner",
          message: userText,
          sessionId: sessionId.current,
          task: "chat",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const botReply =
        data.result ||
        data.choices?.[0]?.message?.content ||
        "Maaf, terjadi kesalahan sinkronisasi.";

      setMessages([...newMessages, { role: "bot", text: botReply }]);
    } catch (error) {
      console.error("FusionNeural Sync Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "bot",
          text: "Sistem sedang melakukan sinkronisasi ulang. Mohon coba beberapa saat lagi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[420px] bg-white/70 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[24px] sm:rounded-[32px] ring-1 ring-black/5 flex flex-col"
            style={{ height: "min(600px, 75dvh)" }}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-white/40 bg-white/30 flex items-center justify-between shadow-sm rounded-t-[24px] sm:rounded-t-[32px] flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-800/20">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 border-4 border-white rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold tracking-tight leading-tight">
                    FusionNeural <span className="text-slate-500 text-[10px] tracking-widest uppercase ml-1">v2.0</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activeAgents.length > 0 ? (
                      <>
                        <Activity className="w-3 h-3 text-purple-600 animate-pulse" />
                        <span className="text-purple-600/90 text-[11px] font-semibold uppercase tracking-wider">
                          Agen Aktif: {activeAgents.join(", ")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                          Sistem Otonom Siap
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-900 transition-all shadow-sm group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5"
              style={{ overscrollBehavior: "contain" }}
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/50">
                    <Sparkles className="w-10 h-10 text-slate-400" />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-2 text-lg">Neural Core Siap</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tanya apa saja — strategi bisnis, analisis pasar, atau operasional. 4 Agen AI siap bekerja untuk Anda.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative px-5 py-3.5 text-sm max-w-[85%] leading-relaxed shadow-md whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white rounded-2xl rounded-tr-none"
                        : "bg-white/90 border border-white/60 text-slate-800 rounded-2xl rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/80 border border-white/60 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      Sinkronisasi Data...
                    </span>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={chatEndRef} className="h-px" />
            </div>

            {/* Scroll to bottom hint */}
            <AnimatePresence>
              {!isAtBottom && messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-6 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                  ↓ Terbaru
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Footer */}
            <div className="p-4 sm:p-5 bg-white/40 border-t border-white/50 backdrop-blur-xl rounded-b-[24px] sm:rounded-b-[32px] flex-shrink-0">
              <div className="flex gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm focus-within:ring-2 ring-slate-800/20 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent px-3 sm:px-4 py-3 text-slate-800 text-base sm:text-sm outline-none placeholder-slate-500"
                  placeholder="Ketik pesan Anda..."
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md shadow-slate-800/20 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-white/90 backdrop-blur-xl rounded-[24px] shadow-[0_12px_48px_-12px_rgba(0,0,0,0.3)] flex items-center justify-center border border-white/60 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-8 h-8 text-slate-800 relative z-10" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative">
              <Brain className="w-8 h-8 text-slate-800 relative z-10" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 border-4 border-white rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/50 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default ChatBot;

