/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// A subtle glowing orb that drifts vertically as the user scrolls
export default function GlobalScrollOrb() {
  const { scrollYProgress } = useScroll();

  // Map scroll 0→1 to vertical range (top to bottom of viewport in %)
  const rawY = useTransform(scrollYProgress, [0, 1], ['5vh', '85vh']);
  const rawX = useTransform(scrollYProgress, [0, 0.5, 1], ['75vw', '20vw', '65vw']);

  // Spring for smooth lag effect
  const y = useSpring(rawY, { stiffness: 30, damping: 20 });
  const x = useSpring(rawX, { stiffness: 30, damping: 20 });

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Primary orb - purple */}
      <motion.div
        style={{ top: y, left: x }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(118,14,255,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>

      {/* Secondary orb - blue, offset */}
      <motion.div
        style={{
          top: useTransform(scrollYProgress, [0, 1], ['80vh', '10vh']),
          left: useTransform(scrollYProgress, [0, 0.5, 1], ['15vw', '70vw', '30vw']),
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.09, 0.04] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 2 }}
          className="w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </motion.div>
    </div>
  );
}

