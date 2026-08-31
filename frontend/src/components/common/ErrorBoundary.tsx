import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

// ============================================================
// ErrorBoundary (Class Component)
// Catches unhandled React render errors in local trees.
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
        <div style={errorContainerStyles}>
          <div style={errorCardStyles}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
            <h2 style={errorTitleStyles}>Something went wrong</h2>
            <p style={errorDescStyles}>An unexpected error occurred while rendering this component.</p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button onClick={this.handleReset} style={retryBtnStyles}>
                Try Again
              </button>
              <button onClick={() => window.location.reload()} style={reloadBtnStyles}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// RouteErrorBoundary (Functional Component for React Router)
// Used as errorElement on routes to gracefully catch runtime errors
// ============================================================
export function RouteErrorBoundary() {
  const error = useRouteError();

  let message = 'An unexpected error occurred while loading this page.';
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText} — ${typeof error.data === 'string' ? error.data : 'Page not found or unavailable'}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div style={errorContainerStyles}>
      <div style={errorCardStyles}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
        <h2 style={errorTitleStyles}>Page Loading Error</h2>
        <p style={errorDescStyles}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.location.reload()} style={retryBtnStyles}>
            🔄 Reload Page
          </button>
          <Link to="/products" style={homeBtnStyles}>
            🏪 Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

const errorContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '50vh',
  padding: 'var(--space-6)',
};

const errorCardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-8)',
  textAlign: 'center',
  maxWidth: '480px',
  width: '100%',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
};

const errorTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginBottom: 'var(--space-2)',
};

const errorDescStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--space-6)',
  lineHeight: 1.5,
};

const retryBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontWeight: 'var(--font-semibold)',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

const reloadBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontWeight: 'var(--font-semibold)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

const homeBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontWeight: 'var(--font-semibold)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 'var(--text-sm)',
};
