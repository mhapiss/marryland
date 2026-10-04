// src/components/ImageWithFallback.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCcw, ImageOff } from 'lucide-react';
import { getOptimizedThumbnailUrl } from '../lib/justifiedLayout';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  isMissing?: boolean;
  renderWidth?: number;
  onDimensionDetected?: (naturalWidth: number, naturalHeight: number) => void;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  isMissing = false,
  renderWidth,
  onDimensionDetected,
  ...props
}: Props) {
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute optimized thumbnail URL according to target render width
  const baseSrc = useMemo(() => {
    if (!src) return '';
    if (renderWidth && renderWidth > 0) {
      return getOptimizedThumbnailUrl(src, renderWidth);
    }
    return src;
  }, [src, renderWidth]);

  // Sync with baseSrc
  useEffect(() => {
    setCurrentSrc(baseSrc);
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [baseSrc, isMissing]);

  // Handle native image load success
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      setHasError(false);

      const img = e.currentTarget;
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0 && onDimensionDetected) {
        onDimensionDetected(img.naturalWidth, img.naturalHeight);
      }
    },
    [onDimensionDetected]
  );

  // Handle native image load error with exponential backoff (max 3 retries)
  const handleError = useCallback(() => {
    if (retryCount < 3) {
      const nextAttempt = retryCount + 1;
      const delay = nextAttempt === 1 ? 500 : nextAttempt === 2 ? 1500 : 3000;

      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(nextAttempt);
        if (baseSrc) {
          // Append cache-busting retry parameter
          const separator = baseSrc.includes('?') ? '&' : '?';
          setCurrentSrc(`${baseSrc}${separator}_retry=${nextAttempt}&t=${Date.now()}`);
        }
      }, delay);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [retryCount, baseSrc]);

  // Manual retry handler
  const handleManualRetry = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHasError(false);
      setIsLoading(true);
      setRetryCount(0);
      if (baseSrc) {
        const separator = baseSrc.includes('?') ? '&' : '?';
        setCurrentSrc(`${baseSrc}${separator}_t=${Date.now()}`);
      }
    },
    [baseSrc]
  );

  // Missing from Drive state
  if (isMissing) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-kertas-tua border border-dashed border-merah/40 rounded-[2px] text-center select-none ${
          fallbackClassName || className
        }`}
      >
        <ImageOff className="w-6 h-6 text-merah mb-1.5 opacity-80" />
        <span className="text-[11px] font-mono text-merah font-medium leading-tight">
          Foto tidak ditemukan di Drive
        </span>
      </div>
    );
  }

  // Error after 3 backoff retries
  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-kertas-tua border border-garis rounded-[2px] text-center select-none ${
          fallbackClassName || className
        }`}
      >
        <ImageOff className="w-6 h-6 text-tinta-lembut mb-2 opacity-60" />
        <span className="text-[11px] font-mono text-tinta-lembut mb-2 leading-tight">
          Gagal memuat foto
        </span>
        <button
          type="button"
          onClick={handleManualRetry}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-kertas border border-garis text-tinta hover:text-merah text-[10px] font-mono rounded-[2px] transition-colors shadow-sm min-h-[32px] cursor-pointer"
          aria-label="Muat ulang foto ini"
        >
          <RotateCcw className="w-3 h-3 text-merah" />
          <span>Muat ulang foto ini</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${fallbackClassName ? '' : 'w-full h-full'}`}>
      {/* Neutral placeholder skeleton matching exact container dimensions */}
      {isLoading && (
        <div
          className={`absolute inset-0 bg-kertas-tua/70 animate-pulse flex items-center justify-center z-10 ${
            fallbackClassName || className
          }`}
          aria-hidden="true"
        >
          <div className="w-4 h-4 rounded-full border-2 border-merah/30 border-t-merah animate-spin" />
        </div>
      )}

      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt || ''}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={props.loading || 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}
