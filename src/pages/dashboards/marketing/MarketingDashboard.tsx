import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemEngine } from '../../../context/SystemEngineContext';
import { 
  Play, Pause, SkipForward, SkipBack, 
  BarChart3, MoreHorizontal, Shuffle, Repeat, CheckCircle2
} from 'lucide-react';

export default function MarketingDashboard() {
  const { campaignActive, setCampaignActive, budgetUsed, conversions, eqHeights } = useSystemEngine();
  const [isPlaying, setIsPlaying] = useState(true);

  // Sync isPlaying with campaignActive for the UI controls
  const handleToggleCampaign = () => {
    const newState = !campaignActive;
    setCampaignActive(newState);
    setIsPlaying(newState);
  };

  return (
    <div className="pb-10 font-sans text-slate-800">
      
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Marketing Hub</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* KIRI: Main Content (Hero, Ad Sets, Trending) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* 1. Hero Section (Mirip "Listen to trending songs") */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-[32px] p-8 md:p-10 overflow-hidden shadow-lg transition-colors duration-700 ${campaignActive ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-emerald-500/20' : 'bg-gradient-to-r from-[#A855F7] to-[#D946EF] shadow-purple-500/20'}`}
          >
            {/* Dekorasi Background */}
            <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-10 bottom-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-sm">
              <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3 block">
                {campaignActive ? 'Campaign Running' : 'AI Marketing Engine'}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                {campaignActive ? 'Pumping leads to your pipeline' : 'Boost your brand visibility to the max'}
              </h2>
              <p className="text-white/80 text-sm mb-8 leading-relaxed">
                {campaignActive ? 'The neural engine is currently optimizing ad delivery across all selected channels in real-time.' : 'With the FusionNeural marketing node, you can automate ad placements and track conversions in real-time.'}
              </p>
              
              <button 
                onClick={handleToggleCampaign}
                className={`font-bold text-sm px-6 py-3 rounded-full shadow-lg transition-all flex items-center gap-2
                  ${campaignActive ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md' : 'bg-white text-purple-600 hover:scale-105'}`}
              >
                {campaignActive ? <><Pause size={16} className="fill-current" /> Pause Campaign</> : <><Play size={16} className="fill-current" /> Launch Campaign</>}
              </button>
            </div>
          </motion.div>

          {/* 2. Ad Sets (Mirip "Playlist" kotak-kotak) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Active Ad Sets</h3>
              <button className="text-xs text-slate-400 font-bold hover:text-purple-600">See More</button>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-2 px-2">
              {[
                { title: 'Promo Q3', leads: '1.2k Leads', bg: 'from-[#E9D5FF] to-[#D8B4FE]' },
                { title: 'Retargeting', leads: '850 Leads', bg: 'from-[#FBCFE8] to-[#F0ABFC]' },
                { title: 'Brand Gen Z', leads: '3.4k Leads', bg: 'from-[#DDD6FE] to-[#C084FC]' },
                { title: 'B2B Tech', leads: '420 Leads', bg: 'from-[#E0E7FF] to-[#A78BFA]' },
              ].map((item, i) => (
                <div key={i} className="min-w-[140px] md:min-w-[160px] cursor-pointer group">
                  <div className={`w-full aspect-square rounded-[28px] bg-gradient-to-br ${item.bg} p-4 relative shadow-sm transition-transform group-hover:-translate-y-2`}>
                    <div className="absolute inset-0 bg-white/20 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Fake Play Button */}
                    <div className={`absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md ${campaignActive ? 'text-emerald-500' : 'text-purple-600'} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                      {campaignActive ? <CheckCircle2 size={16} /> : <Play size={14} className="ml-0.5 fill-current" />}
                    </div>
                    <div className="absolute bottom-4 left-4 text-slate-800">
                      <p className="text-sm font-bold leading-tight">{item.title}</p>
                      <p className="text-[10px] font-medium opacity-70 mt-0.5">{item.leads}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3. Live Conversions (Mirip "Trending" List) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Trending Conversions</h3>
              <div className="flex items-center gap-2">
                {campaignActive && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full mr-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live</div>}
                <button className="text-xs text-slate-400 font-bold hover:text-purple-600">See More</button>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {conversions.map((row, i) => (
                  <motion.div 
                    key={row.id} 
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 w-4">0{i + 1}</span>
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-500 flex items-center justify-center">
                        <row.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{row.title}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{row.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-bold text-slate-700 hidden sm:block">{row.val}</span>
                      <button className="w-8 h-8 rounded-full bg-slate-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Play size={14} className="ml-0.5 fill-current" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

        {/* KANAN: Sidebar Content (Top Artist & Player) */}
        <div className="xl:col-span-1 flex flex-col gap-8">
          
          {/* Top Channels (Mirip "Top Artist") */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Top Channels</h3>
            <div className="space-y-5">
              {[
                { name: 'TikTok Ads', followers: '1.2M Reach', plays: '42K Clicks', color: 'bg-black text-white' },
                { name: 'Instagram Reels', followers: '850K Reach', plays: '28K Clicks', color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white' },
                { name: 'LinkedIn B2B', followers: '120K Reach', plays: '5K Clicks', color: 'bg-[#0A66C2] text-white' },
              ].map((channel, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${channel.color}`}>
                    {channel.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{channel.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mt-0.5">
                      <span>{channel.followers}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{channel.plays}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs font-bold text-purple-600 mt-6 hover:text-purple-700">See More</button>
          </motion.div>

          {/* Player Card (Mirip kotak musik ungu gelap di kanan bawah) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-[#1C0E3C] rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between h-full min-h-[280px]">
            {/* Soft glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div className={`backdrop-blur-md rounded-2xl w-20 h-20 flex items-center justify-center border border-white/10 shadow-inner transition-colors duration-500 ${isPlaying ? 'bg-fuchsia-500/20' : 'bg-white/10'}`}>
                <BarChart3 size={32} className={isPlaying ? 'text-fuchsia-300' : 'text-purple-300'} />
              </div>
              <button className="text-white/50 hover:text-white"><MoreHorizontal size={20} /></button>
            </div>

            <div className="relative z-10 mt-6 text-center">
              <h4 className="font-bold text-lg">Main Ad Engine Active</h4>
              <p className="text-xs text-purple-300/80 mt-1">Status: {isPlaying ? 'Consuming Budget & Pumping Leads' : 'Engine Paused'}</p>
            </div>

            {/* Fake Audio Wave (Memvisualisasikan traffic ads yang fluktuatif) */}
            <div className="relative z-10 flex items-center justify-center gap-1 h-12 mt-6">
              {eqHeights.map((h, i) => (
                <motion.div 
                  key={i} 
                  animate={{ height: `${h}%` }}
                  transition={{ type: 'tween', duration: 0.4 }}
                  className={`w-1 rounded-full ${i < 8 ? 'bg-fuchsia-400' : 'bg-white/20'}`} 
                />
              ))}
            </div>

            {/* Time / Budget Tracker */}
            <div className="relative z-10 flex justify-between text-[10px] text-white/50 font-bold mt-2 px-1">
              <span>${budgetUsed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              <span>$5,000 Limit</span>
            </div>

            {/* Controls (Play/Pause Ads) */}
            <div className="relative z-10 flex items-center justify-center gap-6 mt-6">
              <button className="text-white/50 hover:text-white"><Shuffle size={18} /></button>
              <button className="text-white/80 hover:text-white"><SkipBack size={24} className="fill-current" /></button>
              <button 
                onClick={handleToggleCampaign}
                className="w-14 h-14 bg-white text-[#1C0E3C] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {campaignActive ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </button>
              <button className="text-white/80 hover:text-white"><SkipForward size={24} className="fill-current" /></button>
              <button className="text-white/50 hover:text-white"><Repeat size={18} /></button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}