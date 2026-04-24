import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

function GachaCard({ m, offset, isActive, onClick, isDark }: any) {
  const isRevealed = isActive;

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
              <div className="flex items-center gap-2 mb-2">
                  <h3 className={`${isDark ? 'text-white' : 'text-slate-800'} text-[22px] font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis m-0 drop-shadow-sm`} dangerouslySetInnerHTML={{ __html: m.name.replace('<br/>', ' ') }}></h3>
                  {isActive && (
                     <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-5 h-5 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)] ml-1">
                        <Check size={13} className="text-white" strokeWidth={3} />
                     </div>
                  )}
              </div>
              
              {/* Container for Jobdesk - hidden if not revealed */}
              <div className={`transition-all duration-700 ease-in-out overflow-hidden flex-1 flex flex-col ${isRevealed ? 'max-h-[220px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.jobdesk.map((job: string) => (
                         <span key={job} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border ${isDark ? 'text-slate-300 bg-white/5 border-white/10' : 'text-slate-700 bg-black/5 border-black/5'}`}>
                            {job}
                         </span>
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
                      <span>{m.jobdesk[0]}</span>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}

function TeamCarousel({ isDark }: { isDark: boolean }) {
  const TEAM_MEMBERS = [
    { name: 'Reza Maulana', color: '#0ea5e9', image: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=800', jobdesk: ['The Engineer', 'Arsitek Sistem'], instagram: 'https://www.instagram.com/rreza_.maulana' },
    { name: 'Dzaky Alfauzi', color: '#10b981', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', jobdesk: ['The Leader', 'Spesialis Presentasi'], instagram: 'https://www.instagram.com/dzakyalfauzii' },
    { name: 'Divo Farrelly', color: '#f59e0b', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800', jobdesk: ['The Brain', 'Konseptor'], instagram: 'https://www.instagram.com/divo.farrelly' }
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

  const onTouchStart = (e: any) => { 
      touchX.current = e.touches[0].clientX; 
      touchY.current = e.touches[0].clientY; 
  };
  
  const onTouchEnd = (e: any) => {
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

  return (
    <section id="developers" className="relative py-20 overflow-hidden select-none bg-[#f3f4f6]">
      <div className="max-w-6xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-4">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-slate-500 mb-4 px-4 py-1.5"
          >
            The Minds Behind NexusFlow
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-inter font-extrabold text-4xl md:text-5xl text-slate-800 tracking-tight"
          >
            Meet the Developers
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
