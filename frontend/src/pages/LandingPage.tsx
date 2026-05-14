/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
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

export default function LandingPage() {
  return (
    <LanguageProvider>
      <ReactLenis root options={{ lerp: 0.07, smoothWheel: true }}>
        <div className="relative">
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

