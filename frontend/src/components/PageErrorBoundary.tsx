/**
 * FUSION NEURAL — Page-level Error Boundary
 * Catches errors in individual pages without crashing the entire dashboard.
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State { hasError: boolean; error?: Error }

export class PageErrorBoundary extends React.Component<{ children: React.ReactNode; pageName?: string }, State> {
  constructor(props: { children: React.ReactNode; pageName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PageErrorBoundary] ${this.props.pageName || 'Page'} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-800 mb-2">
            {this.props.pageName || 'Halaman'} mengalami error
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Terjadi kesalahan saat memuat modul ini. Silakan coba muat ulang.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} /> Muat Ulang
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-rose-600 max-w-lg overflow-auto text-left">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
