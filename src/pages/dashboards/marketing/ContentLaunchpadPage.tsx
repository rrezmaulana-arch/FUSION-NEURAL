import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, Clock, CheckCircle2, XCircle, 
  Heart, Globe, Plus, Rocket, UploadCloud, 
  Image as ImageIcon, Film 
} from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface ScheduledPost {
  id: string;
  content: string;
  platform: 'TikTok' | 'Instagram' | 'Web';
  scheduledAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
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

  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- Handlers Media (Sudah ditambahkan Tipe TypeScript untuk elemen Div) ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files as Iterable<File> | ArrayLike<File>);
      await processFiles(filesArray);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files as Iterable<File> | ArrayLike<File>);
      await processFiles(filesArray);
    }
    // Reset agar file yang sama bisa diupload ulang
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    
    if (validFiles.length === 0) return;

    const newMediaItems: MediaItem[] = validFiles.map(file => {
      const isVideo = file.type.startsWith('video/');
      const fileUrl = isVideo ? `${URL.createObjectURL(file)}#t=0.1` : URL.createObjectURL(file);

      return {
        id: `${Date.now()}-${Math.random()}`,
        url: fileUrl,
        type: isVideo ? 'video' : 'image',
        name: file.name
      };
    });

    setMediaLibrary(prev => [...newMediaItems, ...prev]);
    
    // PERBAIKAN: Menggunakan kategori 'Marketing' dan memodifikasi pesannya agar tidak error
    await FirebaseLogger.logAgentAction(
      'Marketing', 
      'POST_SCHEDULED', 
      `${validFiles.length} aset konten baru masuk antrian library`
    );
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
          <p className="text-slate-500 text-sm mt-1">Timeline, distribusi & aset — kendali penuh atas publikasi</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md"
        >
          <Plus size={16} /> Jadwalkan Post
        </button>
      </div>

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

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ImageIcon size={16} /> Stok Konten (Firebase Asset Library)
          </h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
            {mediaLibrary.length} Media
          </span>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
          />
          <UploadCloud className={`mx-auto mb-2 ${isDragging ? 'text-purple-500' : 'text-slate-400'}`} size={32} />
          <p className="text-sm font-bold text-slate-700">Tarik & Lepas file ke sini</p>
          <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih foto/video</p>
        </div>

        {mediaLibrary.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6">
            <AnimatePresence>
              {mediaLibrary.map((item, i) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: i * 0.05 }}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full relative">
                      <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="text-white drop-shadow-md" size={24} />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-[9px] text-white font-medium truncate">{item.name}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

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