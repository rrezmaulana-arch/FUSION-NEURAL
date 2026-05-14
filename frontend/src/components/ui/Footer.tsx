/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-fn-navy py-12 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fn-emerald to-fn-blue flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-space font-bold text-white text-lg">
            FUSION<span className="text-fn-emerald">NEURAL</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="text-white/30 text-sm font-inter text-center">
          FusionNeural AI — An Autonomous Business Ecosystem Concept
        </p>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fn-emerald animate-pulse" />
          <span className="text-fn-emerald/60 text-xs font-inter">System Online · 24/7</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-white/5 text-center">
        <p id="sys-ref" className="text-white/20 text-xs font-inter">
          © 2026 Crafted with ❤️ by Miftah Afreza Maulana. Conceptual project.
        </p>
      </div>
    </footer>
  );
}
