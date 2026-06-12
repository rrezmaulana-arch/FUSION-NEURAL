import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Bot, CheckCircle2, X } from 'lucide-react';
import { useVoiceAI } from '../../hooks/useVoiceAI';

interface Toast {
  id: string;
  agent: string;
  title: string;
}

export default function GlobalNeuralNotifier() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const initialized = useRef(false);
  const { speak } = useVoiceAI();

  useEffect(() => {
    // Only listen if user is authenticated
    if (!auth.currentUser) return;

    // Listen for recent tasks
    const q = query(collection(db, 'neural_tasks'), orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initialized.current) {
        // First load, don't show notifications for existing tasks
        initialized.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'Done' && data.progress === 100) {
            // Check if we already showed this
            setToasts((prev) => {
              if (prev.find(t => t.id === change.doc.id)) return prev;
              const newToast = { id: change.doc.id, agent: data.agent, title: data.title };
              
              // Speak the notification
              speak(`${data.agent.replace('Neural ', '')} has completed task: ${data.title.substring(0, 30)}`, 'manager');
              
              return [...prev, newToast];
            });
            
            // Auto dismiss after 5s
            setTimeout(() => {
              setToasts((prev) => prev.filter(t => t.id !== change.doc.id));
            }, 5000);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [speak]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto w-80 bg-[#0f172a]/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-2xl shadow-emerald-500/10 flex items-start gap-3"
          >
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Bot size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} /> {toast.agent}
              </h4>
              <p className="text-slate-300 text-sm mt-1 leading-tight line-clamp-2">
                {toast.title}
              </p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
