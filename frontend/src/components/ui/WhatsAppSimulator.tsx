import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Check, CheckCheck, X } from 'lucide-react';

interface WAMessage {
  id: string;
  text: string;
  time: string;
}

export default function WhatsAppSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WAMessage[]>([
    { id: '1', text: 'Sistem FUSION NEURAL online. Menunggu laporan...', time: '08:00' }
  ]);
  const [unread, setUnread] = useState(0);

  // Expose a global function to allow other components to send WA messages
  useEffect(() => {
    (window as any).sendWAMessage = (text: string) => {
      const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { id: Math.random().toString(), text, time }]);
      if (!isOpen) setUnread(prev => prev + 1);
    };
    return () => { delete (window as any).sendWAMessage; };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(0);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[120] w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center justify-center shadow-xl transition-all"
      >
        <MessageCircle size={28} className="text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#060b18]">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[120] w-80 bg-[#EFEAE2] border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
          >
            {/* WA Header */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">Neural Finance Bot</h3>
                  <p className="text-purple-100 text-[10px]">online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-purple-100 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* WA Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover max-h-96 min-h-80 space-y-3 custom-scrollbar">
              <div className="flex justify-center mb-4">
                <span className="bg-amber-100/80 text-amber-900 text-[10px] px-3 py-1 rounded-lg backdrop-blur-sm shadow-sm">
                  Pesan dilindungi enkripsi end-to-end.
                </span>
              </div>
              
              {messages.map((m) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={m.id} className="flex justify-start">
                  <div className="bg-white px-3 pt-2 pb-1.5 rounded-b-xl rounded-tr-xl shadow-sm max-w-[85%] relative">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pr-2">{m.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[9px] text-slate-400">{m.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* WA Input */}
            <div className="bg-[#F0F0F0] p-2 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-slate-500 shadow-sm border border-slate-200">
                Pesan terkirim 1-arah...
              </div>
              <div className="w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center text-white shrink-0">
                <MessageCircle size={18} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

