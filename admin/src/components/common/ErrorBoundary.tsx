import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by Admin ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '32px 24px',
            maxWidth: '640px',
            margin: '40px auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fee2e2',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
            }}
          >
            ⚠️
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            Something went wrong rendering this view
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this page. You can try refreshing or returning to the dashboard.
          </p>
          {this.state.error?.message && (
            <div
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#b91c1c',
                textAlign: 'left',
                marginBottom: '20px',
                overflowX: 'auto',
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              ← Go Back
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#ff7a00',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
