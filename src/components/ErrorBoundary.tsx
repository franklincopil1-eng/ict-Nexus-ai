import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">System Error</h1>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              {errorMessage}
            </p>
            
            {isFirestoreError && (
              <div className="mb-8 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-left">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Technical Details</p>
                <code className="text-[10px] text-rose-400 break-all font-mono">
                  {this.state.error?.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
              <RefreshCw size={18} />
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
