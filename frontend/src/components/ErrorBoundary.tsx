import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                ડેશબોર્ડ દર્શાવવામાં સમસ્યા આવી / Error loading Dashboard
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                એપ્લિકેશનના પેજમાં તકનિકી ખામી આવી છે. કૃપા કરીને પેજ રીલોડ કરો અથવા ડેશબોર્ડ પર પાછા ફરો.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-red-300 font-mono text-left overflow-x-auto max-h-28">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>પેજ રીલોડ કરો (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-emerald-400" />
                <span>ડેશબોર્ડ પર જાઓ (Dashboard)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
