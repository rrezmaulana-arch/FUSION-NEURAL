import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, Briefcase, Calculator, TrendingUp, Send, Loader2, Sparkles, Download, Settings } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { NeuralCore } from '../../../services/NeuralCore';

interface ChatMessage {
  id: string;
  sender: 'Admin' | 'Finance' | 'Marketing' | 'Manager' | 'System';
  role: 'admin' | 'finance' | 'marketing' | 'manager' | 'system';
  text: string;
  isAi: boolean;
}

export default function WarRoomPage() {
  const [topic, setTopic] = useState('Strategi Peningkatan Keuntungan Q3');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'System', role: 'system', text: 'War Room Session Dimulai. Mengundang AI Admin, AI Finance, dan AI Marketing.', isAi: false }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Variasi Kepribadian Agen AI State
  const [adminPersonality, setAdminPersonality] = useState<'disciplined' | 'relaxed'>('disciplined');
  const [financePersonality, setFinancePersonality] = useState<'frugal' | 'aggressive'>('frugal');
  const [marketingPersonality, setMarketingPersonality] = useState<'roi' | 'brand'>('roi');
  const [showConfig, setShowConfig] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const downloadMeetingLog = () => {
    const textContent = messages.map(m => `[${m.sender}] - ${m.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `War_Room_Meeting_Log_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const runMeetingSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setMessages([{ id: Date.now().toString(), sender: 'System', role: 'system', text: `Memulai rapat otomatis dengan topik: "${topic}"...`, isAi: false }]);

    const adminPersPrompt = adminPersonality === 'disciplined' 
      ? 'Gunakan kepribadian: SANGAT DISIPLIN (fokus kaku pada efisiensi stok & data rigid, tolak kelonggaran).' 
      : 'Gunakan kepribadian: LEBIH SANTAI (fokus kelancaran operasional harian, fleksibel terhadap pengiriman).';

    const mktPersPrompt = marketingPersonality === 'roi'
      ? 'Gunakan kepribadian: FOKUS ROI TINGGI (fokus pada laba instan per spend, konversi ketat).'
      : 'Gunakan kepribadian: FOKUS BRAND AWARENESS (fokus jangkauan pasar luas, bangun loyalitas merek).';

    const finPersPrompt = financePersonality === 'frugal'
      ? 'Gunakan kepribadian: SANGAT HEMAT (fokus pemotongan biaya agresif, tolak keras anggaran baru).'
      : 'Gunakan kepribadian: AGRESIF INVESTASI (fokus pertumbuhan cepat, dukung bakar duit jika ROI masuk akal).';

    try {
      // 1. Admin Speaks
      const adminPrompt = `Manager meminta rapat tentang: "${topic}". Berikan pendapat ringkas Anda (1 kalimat) sebagai Admin Gudang. ${adminPersPrompt}`;
      const adminRes = await NeuralCore.askAgent('admin', 'war_room_meeting', adminPrompt);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'Admin', role: 'admin', text: adminRes, isAi: true }]);
      
      // 2. Marketing Speaks
      const mktPrompt = `Topik: "${topic}". Admin baru saja berkata: "${adminRes}". Sebagai Marketing, berikan pendapat ringkas Anda (1 kalimat). ${mktPersPrompt}`;
      const mktRes = await NeuralCore.askAgent('marketing', 'war_room_meeting', mktPrompt);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'Marketing', role: 'marketing', text: mktRes, isAi: true }]);

      // 3. Finance Speaks
      const finPrompt = `Topik: "${topic}". Marketing berkata: "${mktRes}". Sebagai Finance, berikan pendapat ringkas Anda (1 kalimat). ${finPersPrompt}`;
      const finRes = await NeuralCore.askAgent('finance', 'war_room_meeting', finPrompt);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'Finance', role: 'finance', text: finRes, isAi: true }]);

      // 4. Manager Synthesizes
      const mgrPrompt = `Topik: "${topic}". Kesimpulan rapat: Admin ("${adminRes}"), Marketing ("${mktRes}"), Finance ("${finRes}"). Sebagai CEO/Manager, berikan keputusan final 2 kalimat yang elegan.`;
      const mgrRes = await NeuralCore.askAgent('manager', 'war_room_meeting', mgrPrompt);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'Manager', role: 'manager', text: mgrRes, isAi: true }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', role: 'system', text: 'Koneksi ke AI terputus. Simulasi rapat gagal.', isAi: false }]);
    } finally {
      setIsSimulating(false);
    }
  };

  const getAgentColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'finance': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'marketing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'manager': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Briefcase size={16} />;
      case 'finance': return <Calculator size={16} />;
      case 'marketing': return <TrendingUp size={16} />;
      case 'manager': return <Sparkles size={16} />;
      default: return <Bot size={16} />;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="AI Multi-Agent War Room"
        subtitle="Saksikan agen-agen AI berkolaborasi secara otonom untuk menyelesaikan masalah bisnis."
        accent="slate"
        icon={<Users size={22} className="text-white" />}
      />

      <div className="bg-[#0B1120] rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        
        {/* Header Control */}
        <div className="relative z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 mb-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowConfig(!showConfig)} className="bg-slate-800 text-slate-300 p-3 rounded-xl hover:bg-slate-700 transition-colors">
              <Settings size={20} />
            </button>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Masukkan Topik Rapat (Misal: Strategi Diskon Akhir Tahun)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              disabled={isSimulating}
            />
            <button 
              onClick={runMeetingSimulation}
              disabled={isSimulating || !topic}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSimulating ? 'Sedang Rapat...' : 'Mulai Rapat AI'}
            </button>
            {messages.length > 1 && !isSimulating && (
              <button 
                onClick={downloadMeetingLog}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                <Download size={16} /> Log
              </button>
            )}
          </div>

          {/* Config Panel */}
          <AnimatePresence>
            {showConfig && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Personality</label>
                    <select value={adminPersonality} onChange={(e) => setAdminPersonality(e.target.value as 'disciplined'|'relaxed')} className="bg-slate-800 text-slate-300 text-xs rounded-lg p-2 border border-slate-700">
                      <option value="disciplined">Sangat Disiplin (Fokus Efisiensi)</option>
                      <option value="relaxed">Lebih Santai (Fokus Operasional)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finance Personality</label>
                    <select value={financePersonality} onChange={(e) => setFinancePersonality(e.target.value as 'frugal'|'aggressive')} className="bg-slate-800 text-slate-300 text-xs rounded-lg p-2 border border-slate-700">
                      <option value="frugal">Sangat Hemat (Potong Biaya)</option>
                      <option value="aggressive">Agresif (Investasi Pertumbuhan)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketing Personality</label>
                    <select value={marketingPersonality} onChange={(e) => setMarketingPersonality(e.target.value as 'roi'|'brand')} className="bg-slate-800 text-slate-300 text-xs rounded-lg p-2 border border-slate-700">
                      <option value="roi">Fokus ROI (Cuan Instan)</option>
                      <option value="brand">Fokus Brand (Jangkauan Luas)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 relative z-10 overflow-y-auto space-y-4 custom-scrollbar p-2">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`flex ${m.role === 'manager' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                {m.role === 'system' ? (
                  <div className="bg-slate-800/50 text-slate-400 text-xs px-4 py-1.5 rounded-full border border-slate-700/50">
                    {m.text}
                  </div>
                ) : (
                  <div className={`max-w-[75%] rounded-2xl p-4 border shadow-sm flex flex-col gap-2 ${getAgentColor(m.role)} ${m.role === 'manager' ? 'bg-indigo-600/10' : 'bg-slate-900/50'}`}>
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                      {getAgentIcon(m.role)}
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.sender} AI</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${m.role === 'manager' ? 'text-indigo-100' : 'text-slate-300'}`}>
                      {m.text}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
            
            {isSimulating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-500 text-sm italic ml-2">
                <Loader2 size={14} className="animate-spin" /> AI sedang mengetik argumen...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
