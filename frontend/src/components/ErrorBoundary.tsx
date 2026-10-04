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
        <div className="min-h-screen bg-kertas flex items-center justify-center p-6 font-sans text-tinta">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <span className="text-2xl font-serif tracking-tight text-tinta">
                by.<span className="text-merah">marryland</span>
              </span>
            </div>
            <div className="bg-white rounded-[2px] border border-garis p-8">
              <div className="w-14 h-14 bg-kertas-tua text-merah border border-garis rounded-[2px] flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-serif font-normal text-tinta mb-2">{fallbackTitle}</h2>
              <p className="text-xs text-tinta-lembut mb-6 leading-relaxed">{fallbackMessage}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover text-white text-xs font-medium rounded-[2px] transition-colors"
                >
                  Muat Ulang Halaman
                </button>
                {showHomeButton && (
                  <a
                    href="/"
                    className="w-full py-2.5 px-4 border border-garis hover:border-merah text-tinta hover:text-merah text-xs font-medium rounded-[2px] transition-colors inline-block"
                  >
                    Kembali ke Beranda
                  </a>
                )}
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-tinta-lembut cursor-pointer hover:text-tinta font-mono">
                    Detail teknis (development)
                  </summary>
                  <pre className="mt-2 p-3 bg-kertas rounded-[2px] border border-garis text-[11px] font-mono text-merah overflow-auto max-h-40">
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
