'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in child component tree
 *
 * Features:
 * - Displays fallback UI when error occurs
 * - Logs errors for debugging
 * - Allows recovery by resetting error state
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send to error tracking service
    // e.g., Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(error, errorInfo, this.props.componentName);
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

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <svg
            className="w-16 h-16 text-red-500 mb-4"
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

          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Something went wrong
          </h3>

          <p className="text-sm text-red-700 text-center mb-4">
            {this.props.componentName
              ? `The ${this.props.componentName} component encountered an error.`
              : 'An error occurred while rendering this component.'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 p-3 bg-white border border-red-300 rounded text-xs max-w-full overflow-auto">
              <summary className="cursor-pointer font-medium text-red-800 mb-2">
                Error Details
              </summary>
              <pre className="text-red-600 whitespace-pre-wrap">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * FormErrorBoundary
 * Specialized error boundary for form components
 * Saves form data before crashing and allows recovery
 */
export class FormErrorBoundary extends Component<
  ErrorBoundaryProps & { formData?: any; onRestore?: (data: any) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form error:', error, errorInfo);

    // Save form data to localStorage
    if (this.props.formData) {
      try {
        localStorage.setItem(
          'buildlight-form-recovery',
          JSON.stringify(this.props.formData)
        );
      } catch (e) {
        console.error('Failed to save form data:', e);
      }
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRestore = () => {
    // Try to restore form data
    try {
      const saved = localStorage.getItem('buildlight-form-recovery');
      if (saved) {
        const data = JSON.parse(saved);
        this.props.onRestore?.(data);
        localStorage.removeItem('buildlight-form-recovery');
      }
    } catch (e) {
      console.error('Failed to restore form data:', e);
    }

    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-lg">
          <svg
            className="w-16 h-16 text-amber-500 mb-4"
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

          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            Form Error
          </h3>

          <p className="text-sm text-amber-700 text-center mb-4">
            The form encountered an error, but your data has been saved. You can
            try again or reload the page.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleRestore}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Restore & Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GalleryErrorBoundary
 * Specialized error boundary for photo gallery
 */
export class GalleryErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Gallery error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Failed to load photos
          </h3>

          <p className="text-xs text-gray-500 text-center mb-3">
            There was an error loading the photo gallery.
          </p>

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
