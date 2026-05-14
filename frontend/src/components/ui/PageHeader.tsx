/**
 * PageHeader — Reusable dashboard page header dengan warna konsisten per role.
 * Desain: gradient hero banner + subtitle + optional action button.
 */
import { motion } from 'framer-motion';

export type RoleAccent = 'emerald' | 'purple' | 'slate' | 'teal' | 'red' | 'indigo';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  accent: RoleAccent;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const ACCENTS: Record<RoleAccent, {
  bg: string; dot: string; badge: string; badgeText: string; iconBg: string;
}> = {
  emerald: {
    bg: 'from-emerald-600 via-emerald-700 to-teal-800',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/20 border-emerald-400/30',
    badgeText: 'text-emerald-200',
    iconBg: 'bg-white/15',
  },
  purple: {
    bg: 'from-purple-700 via-purple-800 to-indigo-900',
    dot: 'bg-purple-400',
    badge: 'bg-purple-500/20 border-purple-400/30',
    badgeText: 'text-purple-200',
    iconBg: 'bg-white/15',
  },
  slate: {
    bg: 'from-slate-700 via-slate-800 to-slate-900',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/20 border-slate-400/30',
    badgeText: 'text-slate-300',
    iconBg: 'bg-white/10',
  },
  teal: {
    bg: 'from-teal-600 via-teal-700 to-cyan-900',
    dot: 'bg-teal-400',
    badge: 'bg-teal-500/20 border-teal-400/30',
    badgeText: 'text-teal-200',
    iconBg: 'bg-white/15',
  },
  red: {
    bg: 'from-red-700 via-red-800 to-rose-900',
    dot: 'bg-red-400',
    badge: 'bg-red-500/20 border-red-400/30',
    badgeText: 'text-red-200',
    iconBg: 'bg-white/15',
  },
  indigo: {
    bg: 'from-indigo-700 via-indigo-800 to-blue-900',
    dot: 'bg-indigo-400',
    badge: 'bg-indigo-500/20 border-indigo-400/30',
    badgeText: 'text-indigo-200',
    iconBg: 'bg-white/15',
  },
};

export default function PageHeader({ title, subtitle, accent, icon, actions }: PageHeaderProps) {
  const a = ACCENTS[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl bg-gradient-to-br ${a.bg} p-7 mb-6 overflow-hidden`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {icon && (
            <div className={`w-12 h-12 rounded-2xl ${a.iconBg} backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20`}>
              {icon}
            </div>
          )}
          <div>
            <div className={`flex items-center gap-2 mb-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-pulse`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${a.badgeText}`}>
                Live System
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
            <p className="text-white/60 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
