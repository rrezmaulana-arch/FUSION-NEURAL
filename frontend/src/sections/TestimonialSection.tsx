/**
 * FUSION NEURAL — Testimonial Section
 * Social proof dari pengguna UMKM
 */
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  name: string;
  role: string;
  roleEn: string;
  avatar: string;
  rating: number;
  text: string;
  textEn: string;
  metric: string;
  metricEn: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sari Dewi',
    role: 'Pemilik Toko Fashion Online',
    roleEn: 'Online Fashion Store Owner',
    avatar: 'SD',
    rating: 5,
    text: 'Sebelum pakai Fusion Neural, saya habiskan 4 jam sehari untuk urusan admin. Sekarang AI Admin yang handle semuanya — dari sinkronisasi stok Shopee-TikTok sampai balas chat pelanggan. Saya bisa fokus desain produk.',
    textEn: 'Before Fusion Neural, I spent 4 hours daily on admin. Now AI Admin handles everything — from Shopee-TikTok stock sync to customer chat replies. I can focus on product design.',
    metric: '4 jam/hari dihemat',
    metricEn: '4 hours/day saved',
  },
  {
    name: 'Budi Santoso',
    role: 'Owner UMKM Makanan Ringan',
    roleEn: 'Snack SME Owner',
    avatar: 'BS',
    rating: 5,
    text: 'AI Finance-nya luar biasa. Saya yang dulunya tidak paham laporan keuangan, sekarang punya dashboard yang menunjukkan laba bersih, ROI, dan estimasi pajak — semua otomatis. Bank saya kagum dengan laporannya.',
    textEn: 'The AI Finance is incredible. I who never understood financial reports now have a dashboard showing net profit, ROI, and tax estimates — all automatic. My bank is impressed with the reports.',
    metric: 'Laporan keuangan otomatis',
    metricEn: 'Automatic financial reports',
  },
  {
    name: 'Rina Putri',
    role: 'Marketing Freelancer',
    roleEn: 'Marketing Freelancer',
    avatar: 'RP',
    rating: 5,
    text: 'AI Marketing bikin caption Instagram dan script TikTok dalam hitungan detik. Yang biasanya saya pikir 2 jam, sekarang tinggal review dan posting. Engagement naik 40% sejak pakai AI untuk optimasi jadwal posting.',
    textEn: 'AI Marketing creates Instagram captions and TikTok scripts in seconds. What used to take 2 hours now just needs review and post. Engagement up 40% since using AI for posting schedule optimization.',
    metric: 'Engagement +40%',
    metricEn: 'Engagement +40%',
  },
  {
    name: 'Hadi Prasetyo',
    role: 'Dropshipper Multi-Platform',
    roleEn: 'Multi-Platform Dropshipper',
    avatar: 'HP',
    rating: 4,
    text: 'Sebagai dropshipper yang jual di 4 platform sekaligus, sinkronisasi order adalah mimpi buruk. Fusion Neural menyatukan semuanya di satu dashboard. AI Manager bahkan kasih rekomendasi produk mana yang paling laku.',
    textEn: 'As a dropshipper selling on 4 platforms simultaneously, order sync was a nightmare. Fusion Neural unifies everything in one dashboard. AI Manager even recommends which products sell best.',
    metric: '4 platform terintegrasi',
    metricEn: '4 platforms integrated',
  },
];

function TestimonialCard({ t, index, isEnglish }: { t: Testimonial; index: number; isEnglish: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
        ))}
      </div>

      <div className="relative mb-4">
        <Quote size={20} className="text-purple-200 absolute -top-1 -left-1" />
        <p className="text-sm text-slate-600 leading-relaxed pl-6">
          {isEnglish ? t.textEn : t.text}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
          {t.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t.name}</p>
          <p className="text-[10px] text-slate-400">{isEnglish ? t.roleEn : t.role}</p>
        </div>
        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
          {isEnglish ? t.metricEn : t.metric}
        </span>
      </div>
    </motion.div>
  );
}

export default function TestimonialSection() {
  const { isEnglish } = useLang();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-testimonial="header"]',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="testimoni" className="relative py-24 bg-white" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-6">
        <div data-testimonial="header" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-widest mb-4">
            <Star size={14} />
            {isEnglish ? 'What Users Say' : 'Kata Mereka'}
          </div>
          <h2 className="font-space font-bold text-3xl md:text-4xl text-fn-navy">
            {isEnglish ? 'Trusted by Indonesian SMEs' : 'Dipercaya UMKM Indonesia'}
          </h2>
          <p className="text-slate-500 mt-3 text-sm">
            {isEnglish
              ? 'Real stories from real business owners using Fusion Neural'
              : 'Cerita nyata dari pelaku bisnis yang menggunakan Fusion Neural'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} isEnglish={isEnglish} />
          ))}
        </div>
      </div>
    </section>
  );
}

