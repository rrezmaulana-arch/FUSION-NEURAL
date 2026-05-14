/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function MicrochipCursor() {
  const mainRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGSVGElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const trail = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      if (mainRef.current) {
        gsap.set(mainRef.current, {
          x: pos.current.x - 10,
          y: pos.current.y - 10,
        });
      }
      trail.current.x += (pos.current.x - trail.current.x) * 0.12;
      trail.current.y += (pos.current.y - trail.current.y) * 0.12;
      if (trailRef.current) {
        gsap.set(trailRef.current, {
          x: trail.current.x - 20,
          y: trail.current.y - 20,
        });
      }
      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if hovering over input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (mainRef.current) gsap.to(mainRef.current, { opacity: 0, duration: 0.1 });
        if (trailRef.current) gsap.to(trailRef.current, { opacity: 0, duration: 0.1 });
        return;
      }

      // Check if hovering over interactive elements
      const isInteractive = target.closest('button, a, [data-cursor]');
      if (isInteractive) {
        if (mainRef.current) gsap.to(mainRef.current, { scale: 1.8, opacity: 1, duration: 0.25 });
        if (trailRef.current) gsap.to(trailRef.current, { scale: 1.4, opacity: 0.7, duration: 0.25 });
      } else {
        // Default state
        if (mainRef.current) gsap.to(mainRef.current, { scale: 1, opacity: 1, duration: 0.25 });
        if (trailRef.current) gsap.to(trailRef.current, { scale: 1, opacity: 0.4, duration: 0.25 });
      }
    };

    document.body.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Main cursor — microchip SVG */}
      <svg
        ref={mainRef}
        className="cursor-main"
        width="20" height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
      >
        {/* Chip body */}
        <rect x="4" y="4" width="12" height="12" rx="2" fill="#10B981" opacity="0.95" />
        {/* Grid lines */}
        <line x1="7" y1="4" x2="7" y2="16" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        <line x1="10" y1="4" x2="10" y2="16" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        <line x1="13" y1="4" x2="13" y2="16" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        <line x1="4" y1="7" x2="16" y2="7" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        <line x1="4" y1="10" x2="16" y2="10" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        <line x1="4" y1="13" x2="16" y2="13" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        {/* Center dot */}
        <circle cx="10" cy="10" r="1.5" fill="#fff" />
        {/* Pins */}
        <line x1="1" y1="7" x2="4" y2="7" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="10" x2="4" y2="10" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="13" x2="4" y2="13" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="7" x2="19" y2="7" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="10" x2="19" y2="10" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="13" x2="19" y2="13" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="1" x2="7" y2="4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10" y1="1" x2="10" y2="4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="1" x2="13" y2="4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="16" x2="7" y2="19" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10" y1="16" x2="10" y2="19" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="16" x2="13" y2="19" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Trail cursor — ring */}
      <svg
        ref={trailRef}
        width="40" height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998, opacity: 0.4 }}
      >
        <circle cx="20" cy="20" r="18" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="20" cy="20" r="12" stroke="#3B82F6" strokeWidth="0.8" opacity="0.5" />
      </svg>
    </>
  );
}
