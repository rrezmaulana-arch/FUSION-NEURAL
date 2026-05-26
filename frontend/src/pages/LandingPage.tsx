/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import NavBar from '../components/ui/NavBar';
import Footer from '../components/ui/Footer';
import GlobalScrollOrb from '../components/ui/GlobalScrollOrb';
import HeroSection from '../sections/HeroSection';
import VisionSection from '../sections/VisionSection';
import AgentsSection from '../sections/AgentsSection';
import CrossIndustrySection from '../sections/CrossIndustrySection';
import TechStackSection from '../sections/TechStackSection';
import DevicesSection from '../sections/DevicesSection';
import DevelopersSection from '../sections/DevelopersSection';
import CTASection from '../sections/CTASection';
import PricingSection from '../sections/PricingSection';
import ChatBot from '../components/chat/ChatBot';
import { LanguageProvider } from '../context/LanguageContext';
import { useGsapReveal, gsap, ScrollTrigger } from '../hooks/useGsapReveal';

export default function LandingPage() {
  // Root GSAP context — seluruh landing page
  const pageRef = useGsapReveal();

  useEffect(() => {
    // Parallax blob backgrounds
    const blobs = document.querySelectorAll<HTMLElement>('[data-gsap="parallax"]');
    blobs.forEach(blob => {
      gsap.to(blob, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: blob,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        }
      });
    });

    // Section title stagger animations
    const sectionHeaders = document.querySelectorAll<HTMLElement>('.fn-section-header');
    sectionHeaders.forEach(header => {
      gsap.fromTo(header,
        { y: 32, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: header, start: 'top 88%', once: true }
        }
      );
    });

    // Card hover magnetic effect
    const cards = document.querySelectorAll<HTMLElement>('[data-magnetic]');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
        gsap.to(card, { rotateX: -y, rotateY: x, duration: 0.4, ease: 'power2.out', transformPerspective: 800 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <LanguageProvider>
      <ReactLenis root options={{ lerp: 0.07, smoothWheel: true }}>
        {/* @ts-ignore - ref type mismatch for div */}
        <div className="relative" ref={pageRef as any}>
          <ChatBot />
          <GlobalScrollOrb />
          <NavBar />
          <main>
            <HeroSection />
            <VisionSection />
            <AgentsSection />
            <CrossIndustrySection />
            <DevicesSection />
            <TechStackSection />
            <PricingSection />
            <DevelopersSection />
            <CTASection />
          </main>
          <Footer />
        </div>
      </ReactLenis>
    </LanguageProvider>
  );
}
