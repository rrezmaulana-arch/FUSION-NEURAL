/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LogIn, LayoutDashboard, Globe } from 'lucide-react';
import logoImg from '../../assets/Logo (2).png';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

const navLinksID = [
  { label: 'Visi', href: '#vision' },
  { label: 'Agen AI', href: '#agents' },
  { label: 'Industri', href: '#cross-industry' },
  { label: 'Platform', href: '#devices' },
  { label: 'Developer', href: '#developers' },
];
const navLinksEN = [
  { label: 'Vision', href: '#vision' },
  { label: 'Agents', href: '#agents' },
  { label: 'Applications', href: '#cross-industry' },
  { label: 'Omnichannel', href: '#devices' },
  { label: 'Developers', href: '#developers' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser } = useAuth();
  const { isEnglish, toggle } = useLang();
  const navLinks = isEnglish ? navLinksEN : navLinksID;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-500 ${
        scrolled ? 'glass border-b border-white/50 shadow-sm' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group" data-cursor>
          <img src={logoImg} alt="Fusion Neural" className="w-8 h-8 rounded-lg object-contain group-hover:scale-110 transition-transform" />
          <span className="font-space font-700 text-fn-navy text-lg tracking-tight">
            FUSION<span className="text-fn-emerald">NEURAL</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              data-cursor
              className="font-inter text-sm text-fn-navy/70 hover:text-fn-emerald transition-colors font-medium tracking-wide"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA + Language Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-space font-bold border border-fn-navy/20 text-fn-navy/60 hover:text-fn-emerald hover:border-fn-emerald/40 transition-all"
          >
            <Globe size={13} />
            {isEnglish ? 'ID' : 'EN'}
          </button>
          <a
            href="#cta"
            data-cursor
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-space font-semibold text-white bg-fn-navy hover:bg-fn-navy-light transition-all shadow-lg btn-shimmer"
          >
            <span className="w-2 h-2 rounded-full bg-fn-emerald animate-pulse" />
            {isEnglish ? 'Join Revolution' : 'Mulai Sekarang'}
          </a>
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            data-cursor
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-space font-semibold border border-fn-navy text-fn-navy hover:bg-fn-navy/5 transition-all shadow-sm"
          >
            {currentUser ? (
              <><LayoutDashboard size={16} /> Dashboard</>
            ) : (
              <><LogIn size={16} /> Login</>
            )}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          data-cursor
        >
          <span className={`w-5 h-0.5 bg-fn-navy transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-5 h-0.5 bg-fn-navy transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-0.5 bg-fn-navy transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 glass rounded-2xl p-4 flex flex-col gap-3"
        >
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-inter text-sm text-fn-navy/80 hover:text-fn-emerald py-2 px-3 rounded-lg hover:bg-fn-emerald/10 transition-all"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setMobileOpen(false)}
            className="mt-1 text-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-fn-navy"
          >
            Join Revolution
          </a>
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            onClick={() => setMobileOpen(false)}
            className="mt-1 text-center px-5 py-2.5 rounded-full text-sm font-semibold border border-fn-navy text-fn-navy"
          >
            {currentUser ? "Dashboard" : "Login"}
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
