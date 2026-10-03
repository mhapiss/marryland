import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production, you could send this to an error reporting service
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Terjadi Kesalahan',
        fallbackMessage = 'Maaf, ada yang tidak beres. Coba muat ulang halaman ini.',
        showHomeButton = true,
      } = this.props;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <span className="text-2xl font-serif font-bold">
                by.<span className="text-primary">marryland</span>
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-primary-100/50 shadow-soft p-8">
              <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-serif font-bold text-text mb-2">{fallbackTitle}</h2>
              <p className="text-sm text-muted mb-6 leading-relaxed">{fallbackMessage}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full text-sm"
                >
                  Muat Ulang Halaman
                </button>
                {showHomeButton && (
                  <a
                    href="/"
                    className="btn-outline w-full text-sm"
                  >
                    Kembali ke Beranda
                  </a>
                )}
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-muted cursor-pointer hover:text-text">
                    Detail teknis (hanya terlihat di development)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
