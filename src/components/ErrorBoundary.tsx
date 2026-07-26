import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-6">
          <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/10 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Something went wrong</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
              We encountered an unexpected error. Don't worry, your progress might still be safe.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-white rounded-xl font-medium transition-colors"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
