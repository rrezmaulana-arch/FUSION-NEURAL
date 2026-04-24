import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TECH_STACK } from '../data/content';
import { MessageCircle, Network, ShoppingBag, ShoppingCart, MessageSquare } from 'lucide-react';

const nodeIcons: Record<string, React.ReactNode> = {
  telegram: <MessageCircle size={20} />,
  n8n: <Network size={24} />,
  tiktok: <ShoppingBag size={20} />,
  shopee: <ShoppingCart size={20} />,
  whatsapp: <MessageSquare size={20} />,
};

export default function TechStackSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  // Separate nodes
  const telegram = TECH_STACK.find(n => n.id === 'telegram')!;
  const n8n = TECH_STACK.find(n => n.id === 'n8n')!;
  const outputs = TECH_STACK.filter(n => n.id !== 'telegram' && n.id !== 'n8n');

  return (
    <section id="tech-stack" className="relative py-20 overflow-hidden bg-[#0a1628]" ref={ref}>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-inter font-medium tracking-widest uppercase text-fn-emerald mb-4 px-4 py-1.5 rounded-full bg-fn-emerald/10 border border-fn-emerald/20"
          >
            Neural Path · Tech Stack
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-space font-bold text-4xl md:text-6xl text-white"
          >
            The Nervous System
            <br />
            <span className="text-fn-emerald">of the Ecosystem</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-white/50 font-inter text-lg max-w-xl mx-auto"
          >
            Every signal flows through the n8n Centralized Engine — connecting Telegram commands to marketplace actions in milliseconds.
          </motion.p>
        </div>

        {/* Responsive Flow Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">

          {/* Left: Telegram Input */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col items-center select-none"
          >
            <NodeCard node={telegram} />
          </motion.div>

          {/* Connector Arrow 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex lg:flex-row flex-col items-center mx-2 lg:mx-4"
          >
            <div className="flex lg:flex-row flex-col items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  className="w-1 lg:w-2 h-2 lg:h-0.5 rounded-full bg-fn-emerald"
                />
              ))}
              <div className="text-fn-emerald text-sm mt-1 lg:mt-0 lg:ml-1 rotate-90 lg:rotate-0">▶</div>
            </div>
          </motion.div>

          {/* Center: n8n Engine — highlighted */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-2 lg:mx-4 select-none"
          >
            <div
              className="relative px-8 py-6 rounded-3xl text-center min-w-[200px] bg-[#112240]"
              style={{
                border: '1px solid rgba(16,185,129,0.5)',
              }}
            >
              {/* Short label */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
              >
                {nodeIcons[n8n.id] || <Network size={28} />}
              </div>
              <h3 className="font-space font-bold text-white text-xl">{n8n.label}</h3>
              <p className="text-fn-emerald text-xs font-inter mt-1">{n8n.desc}</p>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {['Webhook', 'AI Router', 'Executor', 'Handler'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-inter text-fn-emerald bg-fn-emerald/10 border border-fn-emerald/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Connector Arrow 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="flex lg:flex-row flex-col items-center mx-2 lg:mx-4"
          >
            <div className="flex lg:flex-row flex-col items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 + 0.3 }}
                  className="w-1 lg:w-2 h-2 lg:h-0.5 rounded-full bg-fn-blue"
                />
              ))}
              <div className="text-fn-blue text-sm mt-1 lg:mt-0 lg:ml-1 rotate-90 lg:rotate-0">▶</div>
            </div>
          </motion.div>

          {/* Right: Output nodes stacked */}
          <div className="flex flex-col lg:grid lg:grid-cols-1 grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
            {outputs.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                className="select-none"
              >
                <NodeCard node={node} small />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NodeCard({ node, small }: { node: typeof TECH_STACK[0]; small?: boolean }) {
  return (
    <div
      className={`rounded-2xl text-center transition-all hover:scale-[1.02] bg-[#112240] select-none ${small ? 'px-4 py-3 flex items-center gap-3 text-left min-w-[180px] w-full' : 'p-6 min-w-[160px]'}`}
      style={{
        border: `1px solid ${node.color}20`,
      }}
    >
      {/* Icon badge */}
      <div
        className={`rounded-xl flex items-center justify-center flex-shrink-0 ${small ? 'w-10 h-10' : 'w-14 h-14 mx-auto mb-4'}`}
        style={{ background: `${node.color}15`, color: node.color }}
      >
        {nodeIcons[node.id] || <Network size={20} />}
      </div>
      <div>
        <h4 className={`font-space font-semibold text-white ${small ? 'text-sm' : 'text-base'}`}>{node.label}</h4>
        <p className="text-white/40 text-xs font-inter mt-0.5">{node.desc}</p>
      </div>
    </div>
  );
}
