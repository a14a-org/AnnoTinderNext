"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Always log to server for telemetry (both dev and production)
    if (typeof window !== "undefined") {
      this.logErrorToServer(error, errorInfo);
    }
  }

  private logErrorToServer(error: Error, errorInfo: ErrorInfo): void {
    try {
      // Try to get session token from localStorage if available
      let sessionToken: string | null = null;
      try {
        const urlMatch = window.location.pathname.match(/\/f\/([^/]+)/);
        if (urlMatch) {
          sessionToken = localStorage.getItem(`session_${urlMatch[1]}`);
        }
      } catch {
        // localStorage may not be available
      }

      // Send error to API endpoint for logging
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionToken,
        }),
      }).catch(() => {
        // Silently fail if logging fails
      });
    } catch {
      // Silently fail
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private getErrorReport = (): string => {
    const { error, errorInfo } = this.state;
    const report = {
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      componentStack: errorInfo?.componentStack,
    };
    return JSON.stringify(report, null, 2);
  };

  private handleCopyError = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(this.getErrorReport());
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = this.getErrorReport();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Er is iets misgegaan
            </h2>

            <p className="text-gray-600 text-sm mb-4">
              We hebben een onverwachte fout ondervonden. Probeer het opnieuw of
              neem contact op met ondersteuning als het probleem aanhoudt.
            </p>

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Opnieuw proberen
            </button>

            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Technische details (klik om te delen met ondersteuning)
                </summary>
                <div className="mt-2">
                  <button
                    onClick={this.handleCopyError}
                    className="mb-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        Gekopieerd!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Kopieer foutrapport
                      </>
                    )}
                  </button>
                  <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {"\n\n"}
                        {this.state.error.stack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
