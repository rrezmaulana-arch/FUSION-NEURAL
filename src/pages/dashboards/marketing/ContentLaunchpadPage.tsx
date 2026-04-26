import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, CheckCircle2, XCircle, Heart, Globe, Plus, Rocket } from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface ScheduledPost {
  id: string;
  content: string;
  platform: 'TikTok' | 'Instagram' | 'Web';
  scheduledAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const PLATFORMS = ['Instagram', 'TikTok', 'Web'];

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const SLOTS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

export default function ContentLaunchpadPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([
    { id: '1', content: 'Koleksi eksklusif hadir — diproduksi untuk mereka yang menolak kompromi. Limited edition. Premium. Yours.', platform: 'Instagram', scheduledAt: '2026-04-28 09:00', status: 'pending' },
    { id: '2', content: 'POV: Kamu akhirnya upgrade ke yang terbaik. FusionNeural Edisi Visioner — untuk yang selalu selangkah di depan.', platform: 'TikTok', scheduledAt: '2026-04-29 18:00', status: 'pending' },
    { id: '3', content: 'Clarity. Precision. Elegance. Satu produk. Satu standar.', platform: 'Web', scheduledAt: '2026-04-30 12:00', status: 'approved' },
  ]);
  const [newContent, setNewContent] = useState('');
  const [newPlatform, setNewPlatform] = useState<'TikTok' | 'Instagram' | 'Web'>('Instagram');
  const [newSlot, setNewSlot] = useState('09:00');
  const [isAdding, setIsAdding] = useState(false);

  const handleApprove = async (id: string) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'approved' } : post));
    await FirebaseLogger.logAgentAction('Marketing', 'POST_APPROVED', `Post ID ${id} disetujui untuk publikasi`);
  };

  const handleReject = async (id: string) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'rejected' } : post));
    await FirebaseLogger.logAgentAction('Marketing', 'POST_REJECTED', `Post ID ${id} ditolak`);
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      content: newContent,
      platform: newPlatform,
      scheduledAt: `2026-05-01 ${newSlot}`,
      status: 'pending',
    };
    setPosts(p => [newPost, ...p]);
    setNewContent('');
    setIsAdding(false);
    await FirebaseLogger.logAgentAction('Marketing', 'POST_SCHEDULED', `Post baru dijadwalkan ke ${newPlatform} jam ${newSlot}`);
  };

  const platformIcon = (p: string) => {
    if (p === 'Instagram') return <Heart size={13} />;
    if (p === 'TikTok') return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z"/></svg>;
    return <Globe size={13} />;
  };

  const platformColor = (p: string) => {
    if (p === 'Instagram') return 'bg-pink-100 text-pink-700';
    if (p === 'TikTok') return 'bg-slate-900 text-white';
    return 'bg-blue-100 text-blue-700';
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={9} /> Approved</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700"><XCircle size={9} /> Rejected</span>;
    return <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock size={9} /> Pending</span>;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Content Launchpad</h1>
          <p className="text-slate-500 text-sm mt-1">Timeline & distribusi — kendali penuh atas kapan visi dipublikasikan</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md"
        >
          <Plus size={16} /> Jadwalkan Post
        </button>
      </div>

      {/* Add Post Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-black text-slate-800">Post Baru</h3>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Isi konten yang akan dijadwalkan..."
              rows={3}
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-purple-300 resize-none"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Platform</label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setNewPlatform(p as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${newPlatform === p ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Waktu</label>
                <select value={newSlot} onChange={e => setNewSlot(e.target.value)}
                  className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
                >
                  {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Batal</button>
              <button onClick={handleAdd} className="px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700">
                Jadwalkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Omnichannel Calendar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><CalendarDays size={16} /> Omnichannel Calendar</h3>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[300px]">
            {DAYS.map((day, i) => {
              const dayPosts = posts.filter((_, idx) => idx % 7 === i && posts[idx]?.status === 'approved');
              return (
                <div key={day} className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 mb-2">{day}</div>
                  <div className={`h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                    dayPosts.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {dayPosts.length > 0 ? `${dayPosts.length}` : '–'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 inline-block" /> Konten terjadwal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Kosong</span>
        </div>
      </div>

      {/* Queue */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Antrian Konten ({posts.length})</h2>
        {posts.map((post, i) => (
          <motion.div key={post.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${platformColor(post.platform)}`}>
                {platformIcon(post.platform)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${platformColor(post.platform)}`}>{post.platform}</span>
                  {statusBadge(post.status)}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} />{post.scheduledAt}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{post.content}</p>
              </div>
              {post.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApprove(post.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 size={13} /> Setuju
                  </button>
                  <button onClick={() => handleReject(post.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    <XCircle size={13} /> Tolak
                  </button>
                </div>
              )}
              {post.status === 'approved' && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
                  <Rocket size={14} /> Siap Tayang
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
