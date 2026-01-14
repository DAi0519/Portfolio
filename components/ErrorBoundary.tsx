import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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
        <div className="bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center p-6 text-center font-mono">
            <h1 className="text-4xl font-bold mb-4">500</h1>
            <p className="text-lg mb-6 max-w-md">
                Application halted due to an unexpected error.
            </p>
            {this.state.error && (
                <div className="bg-white/50 p-4 rounded text-xs text-left w-full max-w-xl overflow-auto border border-red-100 mb-8">
                    <p className="font-bold mb-2">Error Details:</p>
                    <pre>{this.state.error.message}</pre>
                </div>
            )}
             <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors uppercase tracking-widest text-xs font-bold"
             >
                Reload Application
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
