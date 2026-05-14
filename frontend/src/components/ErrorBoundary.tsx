import React from 'react';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FusionNeural] App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0F172A', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', color: '#fff', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem' }}>
            FusionNeural — System Restart
          </h1>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Modul inti mengalami gangguan sementara. Sistem sedang melakukan resinkronisasi.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#10B981', color: '#fff', border: 'none', padding: '0.75rem 2rem',
              borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600
            }}
          >
            Restart Neural Core
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: '2rem', background: '#1E293B', padding: '1rem', borderRadius: '8px',
              fontSize: '0.75rem', color: '#F87171', maxWidth: '600px', overflow: 'auto', textAlign: 'left'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
