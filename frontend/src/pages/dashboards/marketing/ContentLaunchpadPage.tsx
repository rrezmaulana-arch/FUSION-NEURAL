/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Globe, Plus, UploadCloud,
  Image as ImageIcon, Film, Loader2
} from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import { uploadMediaFile } from '../../../services/MediaUploader';
import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import PageHeader from '../../../components/ui/PageHeader';

interface ScheduledPost {
  id: string;
  content: string;
  platform: 'TikTok' | 'Instagram' | 'Web';
  scheduledAt: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
}

const PLATFORMS = ['Instagram', 'TikTok', 'Web'];
const SLOTS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

export default function ContentLaunchpadPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  
  const [newContent, setNewContent] = useState('');
  const [newPlatform, setNewPlatform] = useState<'TikTok' | 'Instagram' | 'Web'>('Instagram');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('09:00');
  const [newMediaId, setNewMediaId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [calendarView, setCalendarView] = useState<'Month' | 'Week' | 'Day'>('Month');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with Firestore
  useEffect(() => {
    // Seed initial data if empty
    const initData = async () => {
      const postsSnap = await getDocs(collection(db, 'marketing_posts'));
      if (postsSnap.empty) {
        await setDoc(doc(db, 'marketing_posts', '1'), { id: '1', content: 'Koleksi eksklusif hadir — diproduksi untuk mereka yang menolak kompromi. Limited edition. Premium. Yours.', platform: 'Instagram', scheduledAt: '2026-04-28 09:00', status: 'pending', mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80', mediaType: 'image' });
        await setDoc(doc(db, 'marketing_posts', '2'), { id: '2', content: 'POV: Kamu akhirnya upgrade ke yang terbaik. FusionNeural Edisi Visioner — untuk yang selalu selangkah di depan.', platform: 'TikTok', scheduledAt: '2026-04-29 18:00', status: 'pending' });
      }
      const mediaSnap = await getDocs(collection(db, 'marketing_assets'));
      if (mediaSnap.empty) {
        await setDoc(doc(db, 'marketing_assets', 'demo1'), { id: 'demo1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80', type: 'image', name: 'Product Hero' });
        await setDoc(doc(db, 'marketing_assets', 'demo2'), { id: 'demo2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80', type: 'image', name: 'Lifestyle Shot' });
      }
    };
    initData();

    const unsubPosts = onSnapshot(collection(db, 'marketing_posts'), (snap) => {
      const data: ScheduledPost[] = [];
      snap.forEach(d => data.push(d.data() as ScheduledPost));
      // sort by scheduledAt descending
      data.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
      setPosts(data);
    });

    const unsubMedia = onSnapshot(collection(db, 'marketing_assets'), (snap) => {
      const data: MediaItem[] = [];
      snap.forEach(d => data.push(d.data() as MediaItem));
      setMediaLibrary(data);
    });

    return () => {
      unsubPosts();
      unsubMedia();
    };
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'marketing_posts', id), { status: 'approved' });
    await FirebaseLogger.logAgentAction('Marketing', 'POST_APPROVED', `Post ID ${id} disetujui untuk publikasi`);
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'marketing_posts', id), { status: 'rejected' });
    await FirebaseLogger.logAgentAction('Marketing', 'POST_REJECTED', `Post ID ${id} ditolak`);
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    const selectedMedia = mediaLibrary.find(m => m.id === newMediaId);
    const newId = Date.now().toString();
    const newPost: ScheduledPost = {
      id: newId,
      content: newContent,
      platform: newPlatform,
      scheduledAt: `${newDate} ${newSlot}`,
      status: 'pending',
      mediaUrl: selectedMedia?.url,
      mediaType: selectedMedia?.type
    };
    
    await setDoc(doc(db, 'marketing_posts', newId), newPost);
    
    setNewContent('');
    setNewMediaId('');
    setIsAdding(false);
    await FirebaseLogger.logAgentAction('Marketing', 'POST_SCHEDULED', `Post baru dijadwalkan ke ${newPlatform} pada ${newDate} jam ${newSlot}`);
  };

  // --- Handlers Media ---
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

    setIsUploading(true);
    let successCount = 0;

    for (const file of validFiles) {
      try {
        // Upload ke Firebase Storage → dapat public URL
        const result = await uploadMediaFile(file);
        const newId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const newMedia: MediaItem = {
          id: newId,
          url: result.url,
          type: result.type,
          name: file.name,
        };

        await setDoc(doc(db, 'marketing_assets', newId), newMedia);
        successCount++;
      } catch (e) {
        console.error(`Upload gagal untuk ${file.name}:`, e);
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      await FirebaseLogger.logAgentAction(
        'Marketing',
        'MEDIA_UPLOADED',
        `${successCount} aset konten diupload ke Firebase Storage`,
      );
    }
  };

  const platformIcon = (p: string) => {
    if (p === 'Instagram') return <Heart size={13} />;
    if (p === 'TikTok') return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z"/></svg>;
    return <Globe size={13} />;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      <PageHeader
        title="Content Launchpad"
        subtitle="Timeline, distribusi & aset — kendali penuh atas publikasi"
        accent="purple"
        actions={
          <>
            <button
          onClick={() => setIsAdding(!isAdding)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md"
        >
          <Plus size={16} /> Jadwalkan Post
        </button>
          </>
        }
      />

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
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Platform</label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setNewPlatform(p as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${newPlatform === p ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Media Terlampir</label>
                <select value={newMediaId} onChange={e => setNewMediaId(e.target.value)}
                  className="text-sm w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
                >
                  <option value="">-- Tanpa Media --</option>
                  {mediaLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tanggal</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
                  />
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800">Content Library</h3>
             <p className="text-sm text-slate-500 mt-0.5">Manage and organize your brand's media assets.</p>
           </div>
           <div className="flex items-center gap-2">
             {showNewFolder ? (
               <div className="flex items-center gap-2">
                 <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => {
                   if (e.key === 'Enter' && newFolderName.trim()) {
                     const tag = newFolderName.trim();
                     setMediaLibrary(prev => [...prev, { id: `folder-${Date.now()}`, name: tag, url: '', type: 'image' }]);
                     setNewFolderName('');
                     setShowNewFolder(false);
                   }
                 }} placeholder="Nama folder..." className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" autoFocus />
                 <button onClick={() => { if (newFolderName.trim()) { setMediaLibrary(prev => [...prev, { id: `folder-${Date.now()}`, name: newFolderName.trim(), url: '', type: 'image' }]); setNewFolderName(''); setShowNewFolder(false); } }}
                   className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">Simpan</button>
                 <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
               </div>
             ) : (
               <button onClick={() => setShowNewFolder(true)}
                 className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                 New Folder
               </button>
             )}
             <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
               className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-colors shadow-sm disabled:opacity-50">
               {isUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Upload Asset</>}
             </button>
           </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <select className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none">
                <option>All Types</option>
                <option>Images</option>
                <option>Videos</option>
              </select>
              <select className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none">
                <option>Any Tag</option>
                <option>Campaign</option>
                <option>Product</option>
              </select>
              <select className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none">
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
            </div>
            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
              <button className="p-1.5 rounded-md bg-white shadow-sm text-slate-800"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
              <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
            </div>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`transition-colors rounded-xl ${isDragging ? 'bg-teal-50 border-2 border-dashed border-teal-500 p-8 text-center' : ''}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
            />
            {isDragging && (
              <div>
                <UploadCloud className="mx-auto mb-2 text-teal-500" size={32} />
                <p className="text-sm font-bold text-slate-700">Tarik & Lepas file ke sini</p>
              </div>
            )}

            {!isDragging && mediaLibrary.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {mediaLibrary.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.05 }}
                      className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full relative">
                            <video src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-purple-600 shadow-sm">
                                <Film size={14} className="ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                              0:45
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="w-6 h-6 rounded bg-white/90 backdrop-blur flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm">
                             <ImageIcon size={12} />
                           </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-slate-800 truncate mb-1">{item.name}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>2.4 MB • {item.type === 'image' ? 'JPEG' : 'MP4'}</span>
                          <span>Oct 24</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {!isDragging && mediaLibrary.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <ImageIcon size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Belum ada aset</p>
                <p className="text-xs text-slate-400 mt-1">Upload gambar atau video untuk memulai</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <h3 className="text-xl font-bold text-slate-800">Content Calendar (Jadwal Tayang)</h3>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
           </div>
           <div className="flex gap-4">
             <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-xs font-bold text-slate-600">
               <button onClick={() => setCalendarView('Month')} className={`px-3 py-1.5 border-r border-slate-200 ${calendarView === 'Month' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>Month</button>
               <button onClick={() => setCalendarView('Week')} className={`px-3 py-1.5 border-r border-slate-200 ${calendarView === 'Week' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>Week</button>
               <button onClick={() => setCalendarView('Day')} className={`px-3 py-1.5 ${calendarView === 'Day' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>Day</button>
             </div>
             <button onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 ${showFilters ? 'border-purple-400 bg-purple-50' : 'border-slate-200'}`}>
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
               Filters {showFilters ? '▲' : '▼'}
             </button>
           </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-b border-slate-100 overflow-hidden">
              <div className="px-6 py-4 flex flex-wrap items-center gap-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Platform:</span>
                  <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none">
                    <option value="All">Semua</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Web">Web</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none">
                    <option value="All">Semua</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <button onClick={() => { setFilterPlatform('All'); setFilterStatus('All'); }}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 ml-auto">Reset Filter</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const today = now.getDate();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayOfWeek = new Date(year, month, 1).getDay();
                const cells: React.ReactNode[] = [];

                // Empty cells for days before the 1st
                for (let i = 0; i < firstDayOfWeek; i++) {
                  cells.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border-r border-b border-slate-100 bg-slate-50/30" />);
                }

                // Actual days of the month
                for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                  const isToday = dayNum === today;
                  const dayPosts = posts.filter(post => {
                    try {
                      const dateParts = post.scheduledAt.split(' ');
                      const d = new Date(dateParts[0]);
                      return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
                    } catch { return false; }
                  });

                  cells.push(
                    <div key={dayNum} className={`min-h-[120px] p-2 border-r border-b border-slate-100 last:border-r-0 ${isToday ? 'bg-teal-50/30' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${isToday ? 'text-teal-600' : 'text-slate-600'}`}>{dayNum}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 mr-1"/>}
                      </div>
                      {dayPosts.map((post, idx) => (
                        <div key={post.id || idx} className="text-[10px] font-bold px-2 py-1.5 rounded-md mb-1 truncate flex items-center gap-1.5 border bg-purple-50 text-purple-700 border-purple-100">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {post.content.substring(0, 15)}...
                        </div>
                      ))}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-6 text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Draft</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-200" /> Scheduled</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-200" /> Published</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
           <div>
             <h3 className="text-sm font-bold text-slate-800">Content Queue</h3>
             <p className="text-xs text-slate-500 mt-0.5">Manage and organize your upcoming publications.</p>
           </div>
           <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {posts.length} Total Queued
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Waktu</th>
                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[250px]">Preview Konten</th>
                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const dateParts = post.scheduledAt.split(' ');
                const dateOnly = dateParts[0];
                const timeOnly = dateParts[1] || '00:00';
                
                // Status mapping for visual
                let dotColor = 'bg-slate-300';
                let pillClass = 'bg-slate-100 text-slate-500';
                let statusLabel = 'Draft';

                if (post.status === 'approved') {
                  dotColor = 'bg-purple-500';
                  pillClass = 'bg-purple-100 text-purple-700';
                  statusLabel = 'Scheduled';
                } else if (post.status === 'rejected') {
                  dotColor = 'bg-rose-500';
                  pillClass = 'bg-rose-100 text-rose-700';
                  statusLabel = 'Rejected';
                }

                // Platform circle style
                let pClass = 'bg-blue-600 text-white';
                if (post.platform === 'Instagram') pClass = 'bg-pink-600 text-white';
                if (post.platform === 'TikTok') pClass = 'bg-slate-900 text-white';

                return (
                  <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 align-top">
                       <div className="font-bold text-slate-800 text-xs mb-1">{dateOnly}</div>
                       <div className="text-slate-500 text-[10px] flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {timeOnly}
                       </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {post.mediaUrl ? (
                             post.mediaType === 'video' ? <video src={post.mediaUrl} className="w-full h-full object-cover"/> : <img src={post.mediaUrl} className="w-full h-full object-cover"/>
                          ) : (
                             <ImageIcon size={16} className="text-slate-300"/>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 mb-0.5 line-clamp-1">{post.content.split('.')[0] || 'Untitled Content'}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2 max-w-sm">{post.content}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center ${pClass}`} title={post.platform}>
                          {platformIcon(post.platform)}
                       </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${pillClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-top text-right">
                      {post.status === 'pending' ? (
                         <div className="flex justify-end gap-2">
                           <button onClick={() => handleApprove(post.id)} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors">Approve</button>
                           <button onClick={() => handleReject(post.id)} className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 transition-colors">Reject</button>
                         </div>
                      ) : post.status === 'approved' ? (
                         <button
                           onClick={async () => {
                             try {
                               // Langsung publish via backend endpoint (tidak perlu autonomous mode)
                               const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
                               const res = await fetch(`${apiUrl}/api/marketing/publish`, {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ postId: post.id }),
                               });
                               const result = await res.json();
                               if (result.status === 'success') {
                                 await FirebaseLogger.logAgentAction('Marketing', 'PUBLISHED', `Post ${post.id} berhasil dipublish ke ${post.platform}`);
                                 showFeedback('success', `Post berhasil dipublish ke ${post.platform}!`);
                               } else {
                                 console.error('Publish failed:', result.detail);
                                 showFeedback('error', `Publish gagal: ${result.detail}`);
                               }
                             } catch (e) {
                               console.error('Publish error:', e);
                               showFeedback('error', 'Gagal menghubungi backend.');
                             }
                           }}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors ml-auto"
                         >
                           <Globe size={12} /> Auto Publish
                         </button>
                      ) : (
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}