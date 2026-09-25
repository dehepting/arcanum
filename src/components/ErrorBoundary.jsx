import React from 'react';

/**
 * Error Boundary - Catches React component errors and displays fallback UI
 *
 * Wraps components to prevent entire app crashes when a component errors.
 * Shows user-friendly error message with option to reload.
 *
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReload = () => {
    // Reset error state and try again
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '100px auto',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try reloading.'}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: 'var(--space-3) var(--space-5)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReloadPage}
              style={{
                padding: 'var(--space-3) var(--space-5)',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
              }}
            >
              Reload Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: 'var(--space-6)',
                textAlign: 'left',
                background: 'var(--bg-panel)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: 'var(--space-3)' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-danger)',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
