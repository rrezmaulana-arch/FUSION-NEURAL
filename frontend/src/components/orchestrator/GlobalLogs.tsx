/**
 * Project: FUSION NEURAL
 * components/orchestrator/GlobalLogs.tsx
 * Dipisah dari AgentOrchestratorPage.tsx (Solusi #3)
 */
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, Clock } from 'lucide-react';

export interface Log {
  id: string;
  agent: string;
  details: string;
  timestamp: any;
}

const ROOMS_META: Record<string, { label: string; accent: string }> = {
  admin:      { label: 'OPS Admin',     accent: '#8b5cf6' },
  manager:    { label: 'Manager CMD',   accent: '#3b82f6' },
  marketing:  { label: 'Creative MKT',  accent: '#ec4899' },
  finance:    { label: 'Finance Vault', accent: '#760EFF' },
  frontliner: { label: 'Comms & Sales', accent: '#f59e0b' },
  core:       { label: 'Data Core',     accent: '#6366f1' },
};

function timeAgo(ts: any): string {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date());
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface Props {
  logs: Log[];
}

export default function GlobalLogs({ logs }: Props) {
  return (
    <motion.div
      id="ao-logs"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="ao-card"
      style={{ borderRadius: 16, overflow: 'hidden', marginTop: 24 }}
    >
      <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={16} color='#94a3b8' />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Global Network Activity</span>
        </div>
        <div className="ao-mono" style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
          {logs.length} EVENTS
        </div>
      </div>
      <div className="ao-scroll" style={{ overflowX: 'auto', maxHeight: 280 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
              {['Time', 'Agent', 'Zone', 'Status', 'Output'].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="ao-mono" style={{ fontSize: 12 }}>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#334155' }}>Waiting for neural activity…</td></tr>
            ) : logs.map(log => {
              const zone = ROOMS_META[log.agent.toLowerCase()] || ROOMS_META['core'];
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 20px', color: '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={10} /> {timeAgo(log.timestamp)}
                  </td>
                  <td style={{ padding: '12px 20px', color: '#f8fafc', fontWeight: 700, textTransform: 'capitalize' }}>{log.agent}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ color: zone.accent, background: `${zone.accent}15`, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid ${zone.accent}25` }}>{zone.label}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#760EFF', background: 'rgba(16,185,129,0.1)', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
                      <CheckCircle2 size={10} /> SUCCESS
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#94a3b8', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

