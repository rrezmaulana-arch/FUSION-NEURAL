import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface GachaCardProps {
  m: {
    name: string;
    nim: string;
    color: string;
    image: string;
    jobdesk: string[];
    jobdeskEN: string[];
    instagram: string;
  };
  offset: number;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}

function GachaCard({ m, offset, isActive, onClick, isDark }: GachaCardProps) {
  const isRevealed = isActive;
  const { isEnglish } = useLang();
  const jobs = isEnglish ? m.jobdeskEN : m.jobdesk;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
      onClick={onClick}
      style={{
         transform: `
            translateX(${offset * (isActive ? 110 : 80)}%) 
            scale(${isActive ? 1 : 0.85 - Math.abs(offset) * 0.05})
            translateZ(${isActive ? 50 : -Math.abs(offset) * 100}px)
            rotateY(${-offset * 15}deg)
         `,
         zIndex: 100 - Math.abs(offset),
         opacity: Math.abs(offset) > 2 ? 0 : (isActive ? 1 : 0.6)
      }}
    >
      {/* MORE MODERN SINGLE FACE CARD DESIGN */}
      <div className={`w-full h-full relative overflow-hidden flex flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group`} style={{ 
           backgroundColor: isDark 
              ? (isActive ? 'rgba(8, 12, 25, 0.88)' : 'rgba(8, 12, 25, 0.78)')
              : (isActive ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)'), 
           borderRadius: '32px',
           border: `1px solid ${isDark ? `rgba(255,255,255,${isActive ? '0.12' : '0.06'})` : `rgba(0,0,0,${isActive ? '0.08' : '0.04'})`}`,
           backdropFilter: 'blur(24px)',
           WebkitBackdropFilter: 'blur(24px)',
           boxShadow: isDark 
              ? (isActive ? `0 30px 60px -15px ${m.color}40, 0 0 0 1px rgba(255,255,255,0.06)` : '0 15px 40px rgba(0,0,0,0.7)')
              : (isActive ? `0 20px 40px -10px ${m.color}30, inset 0 2px 20px rgba(255,255,255,0.5)` : '0 10px 25px rgba(0,0,0,0.07)')
      }}>
          {/* TOP COLOR ACCENT */}
          <div 
            className="absolute top-0 left-0 w-full h-1" 
            style={{ background: isActive ? `linear-gradient(90deg, transparent, ${m.color}, transparent)` : 'transparent', transition: 'all 0.5s' }}
          />

          {/* Photo Area */}
          <div 
              className={`relative transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? 'bg-slate-900' : 'bg-slate-200'} shrink-0
                  ${isRevealed ? 'h-[220px] m-3 mb-2 rounded-[24px]' : 'h-[360px] m-0 rounded-none'}
              `}
              style={{
                  backgroundImage: `url('${m.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  maskImage: isRevealed ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: isRevealed ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                  willChange: 'transform'
              }}
          >
              {/* Subtle vignette for the image */}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#080c19] via-[#080c19]/30' : 'from-white/90 via-white/20'} to-transparent transition-opacity duration-700 ${isRevealed ? 'opacity-60' : 'opacity-100'}`}></div>
          </div>
          
          {/* Text & Button Area */}
          <div className={`px-6 pb-6 flex flex-col flex-1 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isRevealed ? 'mt-0' : '-mt-[90px] relative z-10'}`}>
              {/* Name — allow wrap, scale down font if name is long */}
              <div className="flex items-start gap-2 mb-0.5">
                  <h3
                    className={`${isDark ? 'text-white' : 'text-slate-800'} font-extrabold tracking-tight m-0 drop-shadow-sm leading-tight ${m.name.length > 20 ? 'text-[16px]' : 'text-[20px]'}`}
                    dangerouslySetInnerHTML={{ __html: m.name.replace('<br/>', '<br/>') }}
                  />
                  {isActive && (
                     <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-5 h-5 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)] mt-0.5">
                        <Check size={13} className="text-white" strokeWidth={3} />
                     </div>
                  )}
              </div>
              <p className={`text-[10px] font-mono tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>NIM: {m.nim}</p>
              
              {/* Container for Jobdesk - hidden if not revealed */}
              <div className={`transition-all duration-700 ease-in-out overflow-hidden flex-1 flex flex-col ${isRevealed ? 'max-h-[220px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  {/* Elegant list style */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {/* First item — role badge */}
                    <span
                      className="self-start text-[11px] font-bold px-3 py-1 rounded-full"
                      style={{ background: `${m.color}20`, color: m.color }}
                    >
                      {jobs[0]}
                    </span>
                    {/* Remaining items — clean dotted list */}
                    {jobs.slice(1).map((job: string) => (
                      <div key={job} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: m.color }} />
                        <span className={`text-[12px] font-medium leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{job}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bottom Row */}
                  <div className={`flex items-center justify-end pt-4 mt-auto border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <a href={m.instagram || `https://instagram.com/${m.name.split('<')[0].replace(/ /g, '').toLowerCase()}`} target="_blank" rel="noopener noreferrer" 
                         onClick={(e) => e.stopPropagation()}
                         className={`flex w-full items-center justify-center px-5 py-2.5 rounded-full font-semibold text-[13px] transition-all backdrop-blur-xl border shadow-sm ${isDark ? 'bg-white/5 hover:bg-white/15 border-white/10 text-white hover:text-white hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]' : 'bg-[#0B1221] hover:bg-[#1a2333] border-black/5 text-white shadow-md'}`}>
                          Instagram
                      </a>
                  </div>
              </div>

              {/* Initial state Info */}
              <div className={`transition-all duration-500 overflow-hidden ${!isRevealed ? 'max-h-[50px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-emerald-600'} text-[13px] font-bold tracking-wide`}>
                      <span>{jobs[0]}</span>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}

function TeamCarousel({ isDark }: { isDark: boolean }) {
  const TEAM_MEMBERS = [
    {
      name: 'Dzaky Al Fauzy Naw-Waf Akbar',
      nim: '243140707111046',
      color: '#10b981',
      image: new URL('../assets/Dzaky Al Fauzy Naw-Waf Akbar - 243140707111046.jpeg', import.meta.url).href,
      jobdesk: [
        'Ketua Tim',
        'Koordinator Tim & Manajemen Proyek',
        'Presentasi, Komunikasi & Negosiasi',
        'Perancang Alur Logika & Keputusan AI',
        'Perencana Skenario Bisnis Otonom',
        'Quality Assurance & Validasi Sistem',
      ],
      jobdeskEN: [
        'Team Leader',
        'Team Coordination & Project Management',
        'Presentation, Communication & Negotiation',
        'AI Logic & Decision Flow Design',
        'Autonomous Business Scenario Planning',
        'Quality Assurance & System Validation',
      ],
      instagram: 'https://www.instagram.com/dzakyalfauzii'
    },
    {
      name: 'Miftah Afreza Maulana',
      nim: '243140700111026',
      color: '#0ea5e9',
      image: new URL('../assets/Miftah Afreza Maulana - 243140700111026.jpeg', import.meta.url).href,
      jobdesk: [
        'Lead Engineer',
        'Arsitek Sistem & Full-Stack Dev',
        'Integrasi Firebase & Groq AI',
        'UI/UX & DevOps',
      ],
      jobdeskEN: [
        'Lead Engineer',
        'System Architect & Full-Stack Dev',
        'Firebase & Groq AI Integration',
        'UI/UX & DevOps',
      ],
      instagram: 'https://www.instagram.com/rreza_.maulana'
    },
    {
      name: 'Divo Farrelly Sattar',
      nim: '243140707111074',
      color: '#f59e0b',
      image: new URL('../assets/Divo Farrelly Sattar - 243140707111074.jpeg', import.meta.url).href,
      jobdesk: [
        'Chief Conceptor',
        'Perancang Model Bisnis & Logika AI',
        'Analis Kebutuhan Pengguna',
        'Riset & Pengembangan Fitur',
        'Desain Alur Sistem Otonom',
        'Dokumentasi Teknis',
      ],
      jobdeskEN: [
        'Chief Conceptor',
        'Business Model & AI Logic Designer',
        'User Needs Analyst',
        'Feature Research & Development',
        'Autonomous System Flow Design',
        'Technical Documentation',
      ],
      instagram: 'https://www.instagram.com/divo.farrelly'
    },
  ];



  const [active, setActive] = useState(0);

  const next = () => setActive((p) => p + 1);
  const prev = () => setActive((p) => p - 1);
  
  const select = (index: number) => {
      const L = TEAM_MEMBERS.length;
      let curr = active % L;
      if (curr < 0) curr += L;
      let diff = index - curr;
      if (diff > Math.floor(L/2)) diff -= L;
      else if (diff < -Math.floor(L/2)) diff += L;
      setActive(active + diff);
  };

  const touchX = useRef(0);
  const touchY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => { 
      touchX.current = e.touches[0].clientX; 
      touchY.current = e.touches[0].clientY; 
  };
  
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchX.current - e.changedTouches[0].clientX;
    const dy = touchY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) next();
      else prev();
      
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="team-carousel-container relative w-full h-[620px] flex flex-col items-center justify-center overflow-hidden perspective-[1200px]">
       
       <div className="team-carousel relative w-full max-w-[320px] h-[500px] flex items-center justify-center transform-style-3d top-[-20px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ transformStyle: 'preserve-3d' }}>
          {TEAM_MEMBERS.map((m, i) => {
             const L = TEAM_MEMBERS.length;
             let normalizedActive = active % L;
             if (normalizedActive < 0) normalizedActive += L;

             let offset = i - normalizedActive;
             if (offset > Math.floor(L / 2)) offset -= L;
             else if (offset < -Math.floor(L / 2)) offset += L;

             return (
               <GachaCard 
                 key={m.name} 
                 m={m} 
                 offset={offset} 
                 isActive={i === normalizedActive}
                 onClick={() => select(i)} 
                 isDark={isDark}
               />
             )
          })}
       </div>

       {/* Pagination and Arrows container at the bottom */}
       <div className="absolute bottom-6 flex items-center justify-center gap-6 z-20 w-full">
           <button className={`team-nav-arrow w-[44px] h-[44px] flex items-center justify-center rounded-full backdrop-blur-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/80 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/70 hover:bg-white border-black/5 text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`} onClick={prev}>
               <ChevronLeft size={20} strokeWidth={2.5}/>
           </button>

           <div className="flex gap-2.5 items-center">
              {TEAM_MEMBERS.map((_, i) => {
                 const L = TEAM_MEMBERS.length;
                 let normalizedActive = active % L;
                 if (normalizedActive < 0) normalizedActive += L;
                 return (
                   <div key={i} className={`h-2 rounded-full cursor-pointer transition-all duration-500 ease-out ${i === normalizedActive ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] w-10' : `w-2 ${isDark ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-300 hover:bg-slate-400'}`}`} onClick={() => select(i)} />
                 )
              })}
           </div>

           <button className={`team-nav-arrow w-[44px] h-[44px] flex items-center justify-center rounded-full backdrop-blur-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/80 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/70 hover:bg-white border-black/5 text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`} onClick={next}>
               <ChevronRight size={20} strokeWidth={2.5}/>
           </button>
       </div>
    </div>
  )
}

export default function DevelopersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { isEnglish } = useLang();

  return (
    <section id="developers" className="relative py-20 overflow-hidden select-none bg-white">
      <div className="max-w-6xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-4">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-slate-500 mb-4 px-4 py-1.5"
          >
            {isEnglish ? 'The Minds Behind FusionNeural' : 'Otak di Balik FusionNeural'}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-inter font-extrabold text-4xl md:text-5xl text-slate-800 tracking-tight"
          >
            {isEnglish ? 'Meet the Developers' : 'Kenali Tim Developer'}
          </motion.h2>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
        >
          <TeamCarousel isDark={false} />
        </motion.div>
      </div>
    </section>
  );
}
