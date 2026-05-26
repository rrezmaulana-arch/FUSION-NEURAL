import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Command, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VoiceCommandOverlay() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback('Browser tidak mendukung Voice Command.');
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setFeedback('Mendengarkan...');
    };

    recognition.onresult = (event: any) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      setTranscript(speech);
      
      // Simple routing logic based on keywords
      if (speech.includes('keuangan') || speech.includes('profit') || speech.includes('ledger')) {
        setFeedback('Membuka Profit Ledger...');
        setTimeout(() => { navigate('/dashboard/profit-ledger'); setIsListening(false); setTranscript(''); }, 1500);
      } else if (speech.includes('pesanan') || speech.includes('order')) {
        setFeedback('Membuka Order Stream...');
        setTimeout(() => { navigate('/dashboard/order-stream'); setIsListening(false); setTranscript(''); }, 1500);
      } else if (speech.includes('marketing') || speech.includes('kampanye')) {
        setFeedback('Membuka Marketing Analytics...');
        setTimeout(() => { navigate('/dashboard/marketing-analytics'); setIsListening(false); setTranscript(''); }, 1500);
      } else if (speech.includes('war room') || speech.includes('rapat')) {
        setFeedback('Membuka War Room...');
        setTimeout(() => { navigate('/dashboard/war-room'); setIsListening(false); setTranscript(''); }, 1500);
      } else if (speech.includes('audit') || speech.includes('strategi')) {
        setFeedback('Membuka Strategic Audit...');
        setTimeout(() => { navigate('/dashboard/strategic-audit'); setIsListening(false); setTranscript(''); }, 1500);
      } else {
        setFeedback('Perintah tidak dikenali. Coba "Buka keuangan".');
        setTimeout(() => { setIsListening(false); setTranscript(''); }, 2000);
      }
    };

    recognition.onerror = () => {
      setFeedback('Gagal menangkap suara.');
      setTimeout(() => { setIsListening(false); setTranscript(''); }, 1500);
    };

    recognition.onend = () => {
      if (feedback === 'Mendengarkan...') setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }

    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [isListening, navigate]);

  return (
    <>
      <button 
        onClick={() => setIsListening(!isListening)}
        className={`fixed bottom-6 left-6 z-[120] w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
          isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/40' : 'bg-slate-800 text-teal-400 hover:bg-slate-700 border border-slate-700'
        }`}
      >
        {isListening ? <Mic size={24} /> : <Command size={24} />}
      </button>

      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-6 z-[120] bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl w-64"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                {feedback === 'Mendengarkan...' ? <Loader2 size={16} className="text-teal-400 animate-spin" /> : <MicOff size={16} className="text-slate-500" />}
              </div>
              <p className="text-sm font-bold text-slate-200">Global Command</p>
            </div>
            {transcript && (
              <p className="text-xs text-slate-400 mb-2 italic">"{transcript}"</p>
            )}
            <p className={`text-xs font-bold ${feedback.includes('Gagal') || feedback.includes('tidak dikenali') ? 'text-red-400' : 'text-teal-400'}`}>
              {feedback}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
