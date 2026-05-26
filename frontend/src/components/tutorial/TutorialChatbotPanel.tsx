import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, MessageSquare, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminGuide from './AdminGuide';
import FinanceGuide from './FinanceGuide';
import MarketingGuide from './MarketingGuide';
import ManagerGuide from './ManagerGuide';
import { NeuralCore } from '../../services/NeuralCore';

export default function TutorialChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tutorial' | 'chatbot'>('tutorial');
  const { currentUser: user } = useAuth();
  
  // Safe role check
  let safeRole = 'manager';
  if (user?.email) {
    if (user.email.includes('admin')) safeRole = 'admin';
    if (user.email.includes('finance')) safeRole = 'finance';
    if (user.email.includes('marketing')) safeRole = 'marketing';
  }

  // Chatbot State
  const [chatLogs, setChatLogs] = useState<{sender: string, text: string}[]>([{
    sender: 'SYSTEM', text: `Halo ${safeRole.toUpperCase()}. Ada yang bisa saya bantu terkait modul Anda?`
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatLogs(prev => [...prev, { sender: 'Anda', text: msg }]);
    setIsTyping(true);

    try {
      const res = await NeuralCore.askAgent(
        safeRole, 
        'tutorial_chatbot', 
        `Sebagai Asisten ${safeRole.toUpperCase()}, jawab singkat dan jelas: ${msg}`
      );
      setChatLogs(prev => [...prev, { sender: 'AI', text: res }]);
    } catch (e) {
      setChatLogs(prev => [...prev, { sender: 'SYSTEM', text: 'Koneksi ke otak AI terputus.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderGuide = () => {
    switch (safeRole) {
      case 'admin': return <AdminGuide />;
      case 'finance': return <FinanceGuide />;
      case 'marketing': return <MarketingGuide />;
      case 'manager':
      default: return <ManagerGuide />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <BookOpen size={16} className="text-teal-400" />
        <span className="text-xs font-bold tracking-wider">GUIDE & AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#0B1120] border-l border-slate-800 shadow-2xl z-[999] flex flex-col font-['Outfit']"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('tutorial')}
                  className={`text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'tutorial' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <BookOpen size={14} className="inline mr-2 -mt-0.5" /> Tutorial
                </button>
                <button 
                  onClick={() => setActiveTab('chatbot')}
                  className={`text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'chatbot' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <MessageSquare size={14} className="inline mr-2 -mt-0.5" /> Chatbot
                </button>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
              {activeTab === 'tutorial' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {renderGuide()}
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex-1 space-y-4 mb-4">
                    {chatLogs.map((log, i) => (
                      <div key={i} className={`flex ${log.sender === 'Anda' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          log.sender === 'Anda' 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : log.sender === 'SYSTEM' 
                              ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-tl-sm'
                              : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm'
                        }`}>
                          <div className="text-[9px] font-black tracking-widest uppercase mb-1 opacity-60">
                            {log.sender}
                          </div>
                          {log.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                          <Terminal size={14} className="text-teal-400 animate-pulse" />
                          <span className="text-xs text-teal-400 tracking-widest animate-pulse">Mengetik...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="relative mt-auto shrink-0">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="Tanya AI tentang modul ini..."
                      disabled={isTyping}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
