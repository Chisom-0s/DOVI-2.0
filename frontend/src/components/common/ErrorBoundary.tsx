import React from 'react';

// ============================================================
// ErrorBoundary
// Catches unhandled React render errors and shows a recovery UI.
// ============================================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred. Please try again.</p>
            {this.state.error && (
              <pre className="error-boundary__message">
                {this.state.error.message}
              </pre>
            )}
            <button onClick={this.handleReset} className="error-boundary__btn">
              Try Again
            </button>
            <button onClick={() => window.location.reload()} className="error-boundary__btn error-boundary__btn--secondary">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
