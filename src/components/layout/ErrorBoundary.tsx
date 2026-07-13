import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in admin interface:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-red-50/10 border border-dashed border-red-200 rounded-[32px] animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6 border border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6 font-normal leading-relaxed">
            An unexpected error occurred while rendering this section. The rest of the application remains functional.
          </p>
          {this.state.error && (
            <pre className="text-left text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-xl overflow-x-auto text-red-600 mb-6 max-h-40 w-full">
              {this.state.error.toString()}
            </pre>
          )}
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
