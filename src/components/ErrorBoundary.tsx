import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // If the error came from an injected browser extension (e.g. MetaMask), silently ignore and recover
    const msg = error?.message || '';
    const stack = error?.stack || '';
    if (
      msg.toLowerCase().includes('metamask') ||
      msg.toLowerCase().includes('ethereum') ||
      stack.includes('chrome-extension://')
    ) {
      this.setState({ hasError: false, error: null });
      return;
    }
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            {this.state.error && (
              <div className="mb-4 text-left bg-slate-900 text-rose-300 p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-40 border border-slate-800">
                <p className="font-bold text-rose-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('pas_shares_v3');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Reset Cache &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
