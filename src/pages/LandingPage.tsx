import MicrochipCursor from '../components/cursor/MicrochipCursor';
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

export default function LandingPage() {
  return (
    <div className="relative">
      <GlobalScrollOrb />
      <MicrochipCursor />
      <NavBar />
      <main>
        <HeroSection />
        <VisionSection />
        <AgentsSection />
        <CrossIndustrySection />
        <DevicesSection />
        <TechStackSection />
        <DevelopersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
