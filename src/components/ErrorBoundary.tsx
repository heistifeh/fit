import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Fitnex error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          minHeight: '100dvh',
          background: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: '-apple-system, sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 32, lineHeight: 1.6 }}>
            Fitnex hit an unexpected error. Your workout data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#10B981',
              border: 'none',
              borderRadius: 14,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload app
          </button>
          <p
            onClick={() => window.open('https://x.com/whoistife_x', '_blank')}
            style={{ fontSize: 13, color: '#9ca3af', marginTop: 20, cursor: 'pointer' }}
          >
            Still broken? DM <span style={{ color: '#10B981' }}>@whoistife_x</span>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
