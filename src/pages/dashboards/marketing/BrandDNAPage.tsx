import { useState, useEffect } from 'react';

import { Fingerprint, Save, CheckCircle2, RefreshCw, Palette, Tag } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

const VISUAL_TAGS = ['Glassmorphism', 'Dark Premium', 'Minimal White', 'Futuristik', 'Typographic', 'Bold Gradient', 'Anti-Gravity Aesthetic'];

export default function BrandDNAPage() {
  const [persona, setPersona] = useState('');
  const [brandVision, setBrandVision] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Glassmorphism', 'Anti-Gravity Aesthetic']);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'neural_configs', 'marketing_brain'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPersona(data.persona || '');
        setBrandVision(data.brand_vision || '');
        if (data.visual_tags) setSelectedTags(data.visual_tags);
      }
    });
    return () => unsub();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const fullPrompt = `Kamu adalah AI Marketing premium untuk brand FusionNeural.
Identitas: ${persona}
Visi Brand: ${brandVision}
Estetika Visual: ${selectedTags.join(', ')}

Selalu berbicara dengan otoritas yang elegan, presisi, dan kepercayaan diri seorang pemimpin industri.
JANGAN pernah keluar dari karakter ini. JANGAN menggunakan bahasa kasual atau informal.
Setiap konten yang kamu hasilkan harus mencerminkan standar premium FusionNeural.`;

      await setDoc(doc(db, 'neural_configs', 'marketing_brain'), {
        prompt: fullPrompt,
        persona,
        brand_vision: brandVision,
        visual_tags: selectedTags,
        updated_at: new Date().toISOString(),
      });
      await FirebaseLogger.logAgentAction('Marketing', 'BRAND_DNA_UPDATED', 'Persona & visual guidelines disimpan ke neural_configs');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Brand DNA</h1>
          <p className="text-slate-500 text-sm mt-1">Mengunci identitas AI agar selalu selaras dengan karakter brand</p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md ${
            saved ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
          } disabled:opacity-50`}
        >
          {isSaving ? <><RefreshCw size={15} className="animate-spin" /> Menyimpan...</>
            : saved ? <><CheckCircle2 size={15} /> Tersimpan!</>
            : <><Save size={15} /> Simpan ke AI</>}
        </button>
      </div>

      {/* Persona Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Fingerprint size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Persona Settings</h3>
            <p className="text-[10px] text-slate-400">Identitas dan gaya bicara AI Marketing Kak</p>
          </div>
        </div>
        <textarea
          value={persona}
          onChange={e => setPersona(e.target.value)}
          placeholder="Contoh: AI ini adalah Chief Marketing Officer premium dari FusionNeural. Berbicara dengan otoritas, elegan, dan presisi seorang pemimpin industri. Tidak pernah menggunakan bahasa kasual. Setiap kata dipilih dengan penuh perhitungan..."
          rows={5}
          className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-purple-300 resize-none"
        />
      </div>

      {/* Brand Vision */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Tag size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Visi & Misi Brand</h3>
            <p className="text-[10px] text-slate-400">Narasi besar yang mengarahkan semua konten</p>
          </div>
        </div>
        <textarea
          value={brandVision}
          onChange={e => setBrandVision(e.target.value)}
          placeholder="Contoh: FusionNeural hadir untuk mereka yang menolak kompromi. Sebuah ekosistem AI yang tidak hanya membantu bisnis berkembang, tapi mendefinisikan ulang standar kelas premium di industri..."
          rows={4}
          className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 ring-indigo-300 resize-none"
        />
      </div>

      {/* Visual Guidelines */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
            <Palette size={18} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Visual Guidelines</h3>
            <p className="text-[10px] text-slate-400">Standar estetika untuk konten visual AI</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {VISUAL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {selectedTags.includes(tag) && <CheckCircle2 size={10} className="inline mr-1" />}
              {tag}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          {selectedTags.length} guideline dipilih · Akan disuntikkan ke instruksi AI Marketing
        </p>
      </div>

      {/* Preview System Prompt */}
      <div className="bg-slate-900 rounded-2xl p-6">
        <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">Preview — System Prompt yang Akan Disimpan</p>
        <div className="font-mono text-xs text-slate-400 leading-relaxed space-y-1">
          <p><span className="text-purple-400">Identitas:</span> {persona || <span className="opacity-40">Belum diisi...</span>}</p>
          <p><span className="text-blue-400">Visi:</span> {brandVision || <span className="opacity-40">Belum diisi...</span>}</p>
          <p><span className="text-rose-400">Estetika:</span> {selectedTags.join(', ') || <span className="opacity-40">–</span>}</p>
        </div>
      </div>
    </div>
  );
}
