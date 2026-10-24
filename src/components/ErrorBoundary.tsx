import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;
  setState: any;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // Clear URL query parameters that might have caused bad state
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      try {
        window.location.reload();
      } catch (_) {
        window.location.href = '/';
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] p-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl m-4 shadow-sm">
          <div className="max-w-lg w-full text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {this.props.fallbackTitle || 'Project Audit View Encountered an Issue'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sentinel AI caught an unexpected rendering exception while displaying this module.
                The rest of your session and data remain fully intact.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-900 text-rose-300 rounded-lg text-left font-mono text-[11px] overflow-x-auto max-h-32 border border-slate-800">
                <p className="font-bold text-rose-400">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft size={14} />
                <span>Return to Safe View</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reload Portal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
