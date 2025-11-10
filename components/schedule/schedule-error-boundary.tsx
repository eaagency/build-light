"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ScheduleErrorBoundary Component
 * Error boundary wrapper for schedule components
 *
 * Features:
 * - Catches errors in schedule components
 * - Shows fallback UI when errors occur
 * - Logs errors to console and Sentry
 * - Allows recovery without full page reload
 */
export class ScheduleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console
    console.error("Schedule component error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to Sentry if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center max-w-md mx-auto">
            {/* Error Icon */}
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h3 className="text-xl font-semibold text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-6">
              The schedule view encountered an error and couldn't load properly.
            </p>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 dark:text-red-200 mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-muted-foreground mt-6">
              If the problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for error boundary with custom fallback
 */
export function ScheduleErrorBoundaryWithFallback({
  children,
  fallbackView = "list",
}: {
  children: ReactNode;
  fallbackView?: "list" | "calendar";
}) {
  const fallback = (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto text-yellow-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-primary mb-2">
          Gantt chart failed to load
        </h3>
        <p className="text-muted-foreground mb-4">
          Showing {fallbackView} view instead.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
        >
          Reload to try Gantt view
        </button>
      </div>
    </div>
  );

  return <ScheduleErrorBoundary fallback={fallback}>{children}</ScheduleErrorBoundary>;
}
