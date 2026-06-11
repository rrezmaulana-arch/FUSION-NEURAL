/**
 * FUSION NEURAL — FAQ Section
 * Pertanyaan yang sering ditanyakan oleh calon klien UMKM
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang } from '../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  q: string;
  qEn: string;
  a: string;
  aEn: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    q: 'Apa itu Fusion Neural?',
    qEn: 'What is Fusion Neural?',
    a: 'Fusion Neural adalah AI Business Operating System (AI-BOS) yang menghadirkan 4 Agen AI — Admin, Finance, Marketing, dan Manager — yang bekerja 24/7 secara otonom untuk mengelola bisnis UMKM Anda. Bayangkan punya 4 karyawan ahli yang tidak pernah tidur, tidak perlu digaji, dan selalu konsisten.',
    aEn: 'Fusion Neural is an AI Business Operating System (AI-BOS) that provides 4 AI Agents — Admin, Finance, Marketing, and Manager — working 24/7 autonomously to manage your SME business. Imagine having 4 expert employees who never sleep, need no salary, and are always consistent.',
  },
  {
    q: 'Apakah saya perlu keahlian teknis untuk menggunakan Fusion Neural?',
    qEn: 'Do I need technical skills to use Fusion Neural?',
    a: 'Tidak sama sekali. Fusion Neural dirancang untuk pemilik UMKM yang tidak memiliki latar belakang teknis. Semua fungsi AI berjalan otomatis melalui dashboard yang intuitif. Anda cukup melihat hasilnya dan memberikan persetujuan saat diperlukan (Human-in-the-Loop).',
    aEn: 'Not at all. Fusion Neural is designed for SME owners with no technical background. All AI functions run automatically through an intuitive dashboard. You just review the results and provide approval when needed (Human-in-the-Loop).',
  },
  {
    q: 'Berapa biaya berlangganan Fusion Neural?',
    qEn: 'How much does Fusion Neural cost?',
    a: 'Kami menawarkan 3 paket: Starter Agent (Rp 1,8 juta/bulan) untuk 1 Agen AI, Dual Synergy (Rp 3 juta/bulan) untuk 2 Agen AI, dan Full One Man Company (Rp 4,8 juta/bulan) untuk ekosistem penuh 4 Agen AI. Semua paket termasuk setup fee satu kali.',
    aEn: 'We offer 3 plans: Starter Agent (Rp 1.8M/month) for 1 AI Agent, Dual Synergy (Rp 3M/month) for 2 AI Agents, and Full One Man Company (Rp 4.8M/month) for the full 4 AI Agent ecosystem. All plans include a one-time setup fee.',
  },
  {
    q: 'Apakah data bisnis saya aman?',
    qEn: 'Is my business data safe?',
    a: 'Sangat aman. Kami menggunakan enkripsi end-to-end, beroperasi di cloud infrastructure tingkat enterprise (Firebase/Google Cloud), dan sepenuhnya patuh terhadap UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022). Data Anda tidak akan pernah dibagikan ke pihak ketiga.',
    aEn: 'Very safe. We use end-to-end encryption, operate on enterprise-grade cloud infrastructure (Firebase/Google Cloud), and are fully compliant with Indonesian Personal Data Protection Law (UU PDP No. 27/2022). Your data will never be shared with third parties.',
  },
  {
    q: 'Platform e-commerce apa saja yang didukung?',
    qEn: 'What e-commerce platforms are supported?',
    a: 'Saat ini Fusion Neural mendukung integrasi dengan Shopee, TikTok Shop, Tokopedia, dan Instagram. Kami terus menambahkan platform baru sesuai kebutuhan UMKM Indonesia. Arsitektur kami bersifat platform-independent, sehingga tidak terikat pada satu marketplace.',
    aEn: 'Currently Fusion Neural supports integration with Shopee, TikTok Shop, Tokopedia, and Instagram. We continuously add new platforms based on Indonesian SME needs. Our architecture is platform-independent, so you are not tied to one marketplace.',
  },
  {
    q: 'Bagaimana jika AI membuat kesalahan?',
    qEn: 'What if the AI makes a mistake?',
    a: 'Fusion Neural menggunakan prinsip Human-in-the-Loop — keputusan strategis selalu memerlukan persetujuan Anda sebelum dieksekusi. AI hanya bertindak otonom untuk tugas-tugas operasional rutin. Untuk keputusan penting seperti perubahan harga besar atau pengiriman PO, sistem akan menunggu approval Anda.',
    aEn: 'Fusion Neural uses Human-in-the-Loop — strategic decisions always require your approval before execution. AI only acts autonomously for routine operational tasks. For important decisions like major price changes or PO shipments, the system waits for your approval.',
  },
];

function FAQAccordion({ item, isOpen, onToggle, isEnglish }: { item: FAQItem; isOpen: boolean; onToggle: () => void; isEnglish: boolean }) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-emerald-200 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-semibold text-slate-800 text-sm pr-4">
          {isEnglish ? item.qEn : item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={18} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {isEnglish ? item.aEn : item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const { isEnglish } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-faq="content"]',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="faq" className="relative py-24 bg-slate-50" ref={sectionRef}>
      <div className="max-w-3xl mx-auto px-6">
        <div data-faq="content" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle size={14} />
            {isEnglish ? 'Frequently Asked Questions' : 'Pertanyaan yang Sering Diajukan'}
          </div>
          <h2 className="font-space font-bold text-3xl md:text-4xl text-fn-navy">
            {isEnglish ? 'Got Questions?' : 'Ada Pertanyaan?'}
          </h2>
          <p className="text-slate-500 mt-3 text-sm">
            {isEnglish
              ? 'Everything you need to know about Fusion Neural'
              : 'Semua yang perlu Anda ketahui tentang Fusion Neural'}
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item, i) => (
            <FAQAccordion
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              isEnglish={isEnglish}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
