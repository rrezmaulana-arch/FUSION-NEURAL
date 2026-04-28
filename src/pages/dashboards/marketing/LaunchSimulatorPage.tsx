/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Square, Eye, Heart, MessageCircle, Share2, 
  TrendingUp, Zap, Globe, Users, BarChart3, History, 
  Library, Image as ImageIcon, Film, CheckCircle2
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Sesuaikan path ini dengan projectmu

interface Platform {
  name: string;
  color: string;
  textColor: string;
  accent: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface CampaignConfig {
  title: string;
  caption: string;
  platforms: string[];
}

// Data Library sekarang difetch dari Firebase

const PLATFORM_PRESETS: Record<string, { growthRate: number; likeRatio: number; commentRatio: number; shareRatio: number; color: string; textColor: string; accent: string }> = {
  TikTok: { growthRate: 450, likeRatio: 0.08, commentRatio: 0.015, shareRatio: 0.025, color: 'bg-slate-900', textColor: 'text-white', accent: '#ff0050' },
  Instagram: { growthRate: 180, likeRatio: 0.12, commentRatio: 0.02, shareRatio: 0.018, color: 'bg-gradient-to-br from-purple-500 to-pink-500', textColor: 'text-white', accent: '#e1306c' },
  Web: { growthRate: 90, likeRatio: 0.04, commentRatio: 0.008, shareRatio: 0.012, color: 'bg-blue-50 border border-blue-200', textColor: 'text-blue-800', accent: '#2563eb' },
};

export default function LaunchSimulatorPage() {
  const [isLaunched, setIsLaunched] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  
  const [config, setConfig] = useState<CampaignConfig>({
    title: '',
    caption: '',
    platforms: ['TikTok', 'Instagram'],
  });
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [peakViewsPerSec, setPeakViewsPerSec] = useState(0);
  const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
  const [viralMoments, setViralMoments] = useState<string[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
  const [libraryItems, setLibraryItems] = useState<any[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    // Fetch riwayat simulator
    const q = query(
      collection(db, 'simulator_campaigns_summary'),
      orderBy('completedAt', 'desc'),
      limit(10)
    );
    const unsubHistory = onSnapshot(q, snap => {
      setCampaignHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {}); 

    // Fetch marketing_posts untuk dijadikan library
    const unsubLibrary = onSnapshot(collection(db, 'marketing_posts'), snap => {
      const items: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        const contentStr = data.content || '';
        const titleMatch = contentStr.split('.')[0];
        const titleStr = titleMatch ? (titleMatch.length > 35 ? titleMatch.substring(0, 35) + '...' : titleMatch) : 'Untitled Content';
        
        items.push({
          id: d.id,
          title: titleStr,
          caption: contentStr,
          platform: data.platform || 'Instagram',
          type: data.mediaType || 'image',
          status: data.status || 'pending'
        });
      });
      // Prioritaskan yang approved
      items.sort((a, b) => a.status === 'approved' ? -1 : (b.status === 'approved' ? 1 : 0));
      setLibraryItems(items);
    }, () => {});

    return () => {
      unsubHistory();
      unsubLibrary();
    };
  }, []);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${Math.floor(n)}`;
  };

  const initPlatforms = (): Platform[] =>
    config.platforms.map(name => ({
      name,
      color: PLATFORM_PRESETS[name]?.color || 'bg-slate-50',
      textColor: PLATFORM_PRESETS[name]?.textColor || 'text-slate-800',
      accent: PLATFORM_PRESETS[name]?.accent || '#64748b',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }));

  const handleSelectLibraryItem = (item: any) => {
    if (selectedLibraryId === item.id) {
      // Deselect
      setSelectedLibraryId(null);
      setConfig({ title: '', caption: '', platforms: ['TikTok', 'Instagram'] });
    } else {
      // Select
      setSelectedLibraryId(item.id);
      setConfig({
        title: item.title,
        caption: item.caption,
        platforms: [item.platform] // Otomatis menyesuaikan platform bawaan konten
      });
    }
  };

  const launchCampaign = async () => {
    setPlatforms(initPlatforms());
    setTotalViews(0);
    setTotalLikes(0);
    setPeakViewsPerSec(0);
    setElapsed(0);
    setViralMoments([]);
    tickRef.current = 0;
    setIsLaunched(true);

    try {
      await addDoc(collection(db, 'simulator_campaigns'), {
        title: config.title || 'Untitled Campaign',
        caption: config.caption || '',
        platforms: config.platforms,
        status: 'running',
        source_library_id: selectedLibraryId, // Menyimpan log asal konten
        launchedAt: serverTimestamp(),
      });
    } catch (e) { console.warn('[LaunchSim] Firebase launch error:', e); }
  };

  const stopCampaign = async () => {
    setIsLaunched(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const campaignRef = doc(db, 'simulator_campaigns_summary', `campaign_${Date.now()}`);
      await setDoc(campaignRef, {
        title: config.title || 'Untitled Campaign',
        caption: config.caption || '',
        platforms: config.platforms,
        duration_seconds: elapsed,
        total_views: totalViews,
        total_likes: totalLikes,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        peak_views_per_sec: peakViewsPerSec,
        estimated_reach: Math.floor(totalViews * 1.4),
        estimated_new_followers: Math.floor(totalLikes * 0.12),
        estimated_conversions: Math.floor(totalViews * 0.008),
        viral_moments: viralMoments,
        source_library_id: selectedLibraryId,
        completedAt: serverTimestamp(),
      });
    } catch (e) { console.warn('[LaunchSim] Firebase save error:', e); }
  };

  useEffect(() => {
    if (!isLaunched) return;

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      setElapsed(tickRef.current);

      const t = tickRef.current;
      const viralMultiplier = Math.max(0.1, Math.sin(t / 20) * 1.5 + 1.2 - t / 200);

      let tickTotalViews = 0;
      let tickTotalLikes = 0;

      setPlatforms(prev => prev.map(p => {
        const preset = PLATFORM_PRESETS[p.name];
        if (!preset) return p;

        const baseGrowth = preset.growthRate * viralMultiplier;
        const noise = (Math.random() - 0.3) * baseGrowth * 0.4;
        const viewsGain = Math.max(0, Math.floor(baseGrowth + noise));

        const newViews = p.views + viewsGain;
        const newLikes = Math.floor(newViews * preset.likeRatio);
        const newComments = Math.floor(newViews * preset.commentRatio);
        const newShares = Math.floor(newViews * preset.shareRatio);

        tickTotalViews += viewsGain;
        tickTotalLikes += newLikes - p.likes;

        return { ...p, views: newViews, likes: newLikes, comments: newComments, shares: newShares };
      }));

      setTotalViews(prev => prev + tickTotalViews);
      setTotalLikes(prev => prev + Math.max(0, tickTotalLikes));
      setPeakViewsPerSec(prev => Math.max(prev, tickTotalViews));

      if (t === 5) setViralMoments(p => [`[ALERT] ${t}s — Konten mulai viral di FYP TikTok!`, ...p]);
      if (t === 15) setViralMoments(p => [`[TREND] ${t}s — ${formatNum(tickTotalViews * 15)} views/menit!`, ...p]);
      if (t === 30) setViralMoments(p => [`[VIRAL] ${t}s — Konten masuk trending #1 lokal!`, ...p]);
      if (t === 60) setViralMoments(p => [`[PEAK] ${t}s — 1 menit! Peak engagement tercapai!`, ...p]);
      if (t === 90) setViralMoments(p => [`[INFO] ${t}s — Growth mulai melambat, distribusi organik aktif`, ...p]);

    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLaunched, config.platforms]);

  const togglePlatform = (name: string) => {
    setConfig(c => ({
      ...c,
      platforms: c.platforms.includes(name)
        ? c.platforms.filter(p => p !== name)
        : [...c.platforms, name],
    }));
  };

  const elapsedLabel = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Launch Simulator</h1>
          <p className="text-slate-500 text-sm mt-1">Pilih konten dari library & simulasikan metrik viral secara real-time</p>
        </div>
        {isLaunched && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> LIVE · {elapsedLabel}
            </span>
            <button onClick={stopCampaign}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 shadow-md"
            >
              <Square size={14} /> Stop & Simpan
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 w-fit">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="font-bold">Terhubung ke Firebase</span>
        <span className="text-purple-400">— hasil disimpan ke <code className="font-mono">simulator_campaigns_summary</code> saat Stop</span>
      </div>

      {/* Setup Panel */}
      <AnimatePresence>
        {!isLaunched && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm space-y-6"
          >
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Rocket size={16} className="text-purple-500" /> Setup Campaign</h3>

            {/* --- NEW: Pilih dari Library --- */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Library size={12} /> Pilih dari Library Konten
              </label>
              {libraryItems.length === 0 ? (
                 <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold">
                   Tidak ada antrian konten. Coba jadwalkan sesuatu dari Content Launchpad!
                 </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {libraryItems.map((item: any) => {
                    const isSelected = selectedLibraryId === item.id;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectLibraryItem(item)}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                            : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-purple-600">
                            <CheckCircle2 size={16} className="fill-purple-100" />
                          </div>
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'bg-purple-100' : 'bg-slate-100'}`}>
                          {item.type === 'video' 
                            ? <Film size={14} className={isSelected ? 'text-purple-600' : 'text-slate-500'} /> 
                            : <ImageIcon size={14} className={isSelected ? 'text-purple-600' : 'text-slate-500'} />
                          }
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{item.caption}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            {item.platform}
                          </span>
                          {item.status === 'approved' && (
                            <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Judul Campaign</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                  placeholder="Atau ketik judul manual di sini..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-purple-300 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Preview Caption</label>
                <input
                  type="text"
                  value={config.caption}
                  onChange={e => setConfig(c => ({ ...c, caption: e.target.value }))}
                  placeholder="Ketik caption manual..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-purple-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Platform Target</label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(PLATFORM_PRESETS).map(name => (
                  <button key={name} onClick={() => togglePlatform(name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      config.platforms.includes(name)
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={launchCampaign}
              disabled={config.platforms.length === 0 || !config.title}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              <Rocket size={16} /> LAUNCH CAMPAIGN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Metrics */}
      <AnimatePresence>
        {isLaunched && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Total Views', value: formatNum(totalViews), icon: <Eye size={16} />, color: 'from-purple-500 to-indigo-600', textColor: 'text-white' },
                { label: 'Total Likes', value: formatNum(totalLikes), icon: <Heart size={16} />, color: 'from-pink-500 to-rose-600', textColor: 'text-white' },
                { label: 'Engagement', value: `${engagementRate.toFixed(1)}%`, icon: <TrendingUp size={16} />, color: 'from-emerald-500 to-teal-600', textColor: 'text-white' },
                { label: 'Peak Views/s', value: formatNum(peakViewsPerSec), icon: <Zap size={16} />, color: 'from-amber-500 to-orange-600', textColor: 'text-white' },
              ].map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl p-4 bg-gradient-to-br ${m.color} shadow-md`}
                >
                  <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 opacity-80 ${m.textColor}`}>{m.icon}{m.label}</div>
                  <div className={`text-2xl font-black tabular-nums ${m.textColor}`}>{m.value}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {platforms.map(p => (
                <motion.div key={p.name} layout
                  className={`rounded-2xl p-5 ${p.color} shadow-sm border border-white/10`}
                >
                  <div className={`font-black text-sm mb-3 ${p.textColor}`}>{p.name}</div>
                  <div className="space-y-2">
                    {[
                      { icon: <Eye size={11} />, label: 'Views', val: formatNum(p.views) },
                      { icon: <Heart size={11} />, label: 'Likes', val: formatNum(p.likes) },
                      { icon: <MessageCircle size={11} />, label: 'Comments', val: formatNum(p.comments) },
                      { icon: <Share2 size={11} />, label: 'Shares', val: formatNum(p.shares) },
                    ].map(stat => (
                      <div key={stat.label} className={`flex justify-between items-center text-xs opacity-90 ${p.textColor}`}>
                        <span className="flex items-center gap-1 opacity-70">{stat.icon}{stat.label}</span>
                        <span className="font-black tabular-nums">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min((p.views / Math.max(totalViews, 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-1.5 rounded-full bg-white/80"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Globe size={18} className="text-purple-500" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">Total Reach</p>
                  <p className="text-lg font-black text-slate-800">{formatNum(totalViews * 1.4)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center"><Users size={18} className="text-pink-500" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">New Followers</p>
                  <p className="text-lg font-black text-slate-800">{formatNum(totalLikes * 0.12)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><BarChart3 size={18} className="text-emerald-500" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">Est. Conversion</p>
                  <p className="text-lg font-black text-slate-800">{formatNum(totalViews * 0.008)}</p>
                </div>
              </div>
            </div>

            {viralMoments.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-5">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Viral Moments Log</h3>
                <AnimatePresence>
                  {viralMoments.map((m, i) => (
                    <motion.p key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-slate-300 font-mono py-1 border-b border-slate-800 last:border-0"
                    >
                      {m}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riwayat Campaign */}
      {!isLaunched && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <History size={15} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Riwayat Campaign</h3>
              <p className="text-[10px] text-slate-400">Tersinkronisasi dari Firebase · {campaignHistory.length} campaign tersimpan</p>
            </div>
          </div>

          {campaignHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-300">
              <History size={28} className="mx-auto mb-2" />
              <p className="text-sm font-bold">Belum ada riwayat campaign</p>
              <p className="text-xs mt-1">Jalankan simulasi dan klik "Stop & Simpan" untuk menyimpan ke Firebase</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {campaignHistory.map((c, i) => (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Rocket size={15} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{c.title || 'Untitled Campaign'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {(c.platforms || []).map((p: string) => (
                        <span key={p} className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{p}</span>
                      ))}
                      <span className="text-[10px] text-slate-400">{c.duration_seconds || 0}s</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Eye size={10} className="text-purple-400" />
                      <span className="text-xs font-black text-slate-800">{formatNum(c.total_views || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingUp size={10} className="text-emerald-400" />
                      <span className="text-[10px] text-slate-400">{c.engagement_rate || 0}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}