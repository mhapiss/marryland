// src/components/ImageWithFallback.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCcw, ImageOff } from 'lucide-react';
import { getOptimizedThumbnailUrl } from '../lib/justifiedLayout';
import { loadImageWithBackoff, imageLoadQueue } from '../lib/imageQueue';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  isMissing?: boolean;
  renderWidth?: number;
  priority?: 'high' | 'normal';
  onDimensionDetected?: (naturalWidth: number, naturalHeight: number) => void;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  isMissing = false,
  renderWidth,
  priority = 'normal',
  onDimensionDetected,
  ...props
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelLoadRef = useRef<(() => void) | null>(null);

  // Compute optimized thumbnail URL according to target render width
  const baseSrc = useMemo(() => {
    if (!src) return '';
    if (renderWidth && renderWidth > 0) {
      return getOptimizedThumbnailUrl(src, renderWidth);
    }
    return src;
  }, [src, renderWidth]);

  // Determine if image is in view or already cached
  const [isInView, setIsInView] = useState<boolean>(() => {
    if (priority === 'high') return true;
    if (baseSrc && imageLoadQueue.isLoaded(baseSrc)) return true;
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) return true;
    return false;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (isMissing || !baseSrc) return false;
    return !imageLoadQueue.isLoaded(baseSrc);
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (isMissing || !baseSrc) return false;
    return imageLoadQueue.isLoaded(baseSrc);
  });
  const [hasError, setHasError] = useState<boolean>(false);

  // IntersectionObserver to schedule loading when approaching viewport (rootMargin: 350px)
  useEffect(() => {
    if (isInView) return;
    if (isMissing || !baseSrc) return;

    if (imageLoadQueue.isLoaded(baseSrc)) {
      setIsInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '350px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isInView, isMissing, baseSrc]);

  // Load image via concurrency queue once in view
  useEffect(() => {
    // Cancel previous queued load if baseSrc or isMissing changes
    if (cancelLoadRef.current) {
      cancelLoadRef.current();
      cancelLoadRef.current = null;
    }

    if (!isInView || isMissing || !baseSrc) {
      return;
    }

    // Fast path: if already cached in current session
    if (imageLoadQueue.isLoaded(baseSrc)) {
      setIsLoaded(true);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    cancelLoadRef.current = loadImageWithBackoff(
      baseSrc,
      (_loadedSrc, nw, nh) => {
        setIsLoaded(true);
        setIsLoading(false);
        setHasError(false);
        if (nw && nh && onDimensionDetected) {
          onDimensionDetected(nw, nh);
        }
      },
      () => {
        setIsLoading(false);
        setIsLoaded(false);
        setHasError(true);
      },
      {
        priority,
        maxRetries: 3,
        baseDelayMs: 1000,
      }
    );

    return () => {
      if (cancelLoadRef.current) {
        cancelLoadRef.current();
        cancelLoadRef.current = null;
      }
    };
  }, [isInView, baseSrc, isMissing, priority, onDimensionDetected]);

  // Manual retry handler (high priority, zero Date.now cache-busting)
  const handleManualRetry = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!baseSrc) return;

      if (cancelLoadRef.current) {
        cancelLoadRef.current();
      }

      setHasError(false);
      setIsLoading(true);

      cancelLoadRef.current = loadImageWithBackoff(
        baseSrc,
        (_loadedSrc, nw, nh) => {
          setIsLoaded(true);
          setIsLoading(false);
          setHasError(false);
          if (nw && nh && onDimensionDetected) {
            onDimensionDetected(nw, nh);
          }
        },
        () => {
          setIsLoading(false);
          setIsLoaded(false);
          setHasError(true);
        },
        {
          priority: 'high',
          maxRetries: 3,
          baseDelayMs: 1000,
        }
      );
    },
    [baseSrc, onDimensionDetected]
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

  // Error after retries exhausted
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
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${fallbackClassName ? '' : 'w-full h-full'}`}
    >
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

      {isLoaded && (
        <img
          src={baseSrc}
          alt={alt || ''}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={props.loading || 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
}
