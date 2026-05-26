/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook untuk animasi GSAP yang dipicu saat elemen masuk viewport.
 * Menggantikan Framer Motion useInView untuk animasi berbasis scroll yang lebih halus.
 */
export function useGsapReveal() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Semua elemen dengan data-gsap="reveal" akan muncul dari bawah
      gsap.utils.toArray<HTMLElement>('[data-gsap="reveal"]').forEach((el) => {
        gsap.fromTo(el,
          { y: 48, opacity: 0, filter: 'blur(6px)' },
          {
            y: 0, opacity: 1, filter: 'blur(0px)',
            duration: 0.9, ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            }
          }
        );
      });

      // Elemen dengan data-gsap="stagger" akan muncul berurutan
      gsap.utils.toArray<HTMLElement>('[data-gsap-parent="stagger"]').forEach((parent) => {
        const children = parent.querySelectorAll<HTMLElement>('[data-gsap="child"]');
        if (children.length > 0) {
          gsap.fromTo(children,
            { y: 40, opacity: 0 },
            {
              y: 0, opacity: 1,
              duration: 0.7, ease: 'power2.out',
              stagger: 0.12,
              scrollTrigger: {
                trigger: parent,
                start: 'top 85%',
                once: true,
              }
            }
          );
        }
      });

      // Elemen parallax ringan
      gsap.utils.toArray<HTMLElement>('[data-gsap="parallax"]').forEach((el) => {
        gsap.to(el, {
          yPercent: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        });
      });

      // Counter animation untuk angka statistik
      gsap.utils.toArray<HTMLElement>('[data-gsap="counter"]').forEach((el) => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        const isRp = el.getAttribute('data-format') === 'rp';
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.fromTo({ val: 0 }, { val: target }, {
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: function() {
                el.textContent = isRp
                  ? `Rp ${Math.round(this.targets()[0].val).toLocaleString('id-ID')}`
                  : Math.round(this.targets()[0].val).toString();
              }
            });
          }
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return containerRef;
}

export { gsap, ScrollTrigger };
