import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  areaName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full flex items-center justify-center p-6 min-h-[300px]">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 animate-pulse" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Failed to load {this.props.areaName || 'this section'}
            </h2>
            
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              An unexpected runtime error occurred within this interface component. The rest of the workspace remains safe and interactive.
            </p>

            {this.state.error && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-left mb-6 overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                  Diagnostics (Error Info)
                </span>
                <span className="text-xs font-mono text-red-600 block line-clamp-3">
                  {this.state.error.name}: {this.state.error.message}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-100 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Component</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Full Refresh</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // According to agent instructions:
    // When referencing children properties in class components, use props.children instead of children.
    return this.props.children;
  }
}
