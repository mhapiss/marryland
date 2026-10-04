// src/components/gallery/PhotoViewer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Maximize,
  Minimize,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import { toast } from 'sonner';

export interface ViewerPhoto {
  id: string;
  filename: string;
  thumbnail_url: string;
  width?: number | null;
  height?: number | null;
  rotation?: number;
  [key: string]: any;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  // Selection Adapter (Optional for read-only / album modes)
  isPhotoSelected?: (photoId: string) => boolean;
  onToggleSelection?: (photoId: string) => boolean;
  getSelectionOrder?: (photoId: string) => number | null;
  selectionCount?: number;
  maxSelectable?: number;
  allowDownload?: boolean;
  /** Sembunyikan kontrol memilih foto (dipakai album keluarga dan demo setelah terkirim). */
  readOnly?: boolean;
}

export default function PhotoViewer({
  photos,
  initialIndex,
  isOpen,
  onClose,
  isPhotoSelected,
  onToggleSelection,
  getSelectionOrder,
  selectionCount = 0,
  maxSelectable = 0,
  allowDownload = false,
  readOnly = false,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscapeShort, setIsLandscapeShort] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [highResLoaded, setHighResLoaded] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // High-res LRU image cache (max 3 images in memory)
  const highResCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Gesture State held in refs for 60fps direct DOM manipulation
  const gestureState = useRef({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isPointerDown: false,
    activePointers: new Map<number, { x: number; y: number }>(),
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    initialTranslateX: 0,
    initialTranslateY: 0,
    lastTapTime: 0,
    swipeDeltaX: 0,
    swipeDeltaY: 0,
    isSwiping: false,
    swipeDirection: null as 'horizontal' | 'vertical' | null,
    rafId: 0,
  });

  // Keep currentIndex updated when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      triggerElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, initialIndex]);

  // Check viewport height for mobile landscape mode
  useEffect(() => {
    const checkDimensions = () => {
      setIsLandscapeShort(window.innerHeight < 520 && window.innerWidth > window.innerHeight);
    };
    checkDimensions();
    window.addEventListener('resize', checkDimensions);
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  // Body scroll lock with scroll position preservation
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Push browser history state for mobile hardware back button
    window.history.pushState({ marrylandViewer: true }, '');

    const handlePopState = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        onClose();
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('popstate', handlePopState);

      // Restore focus to trigger element
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update image transform directly on DOM via RAF
  const applyTransform = useCallback((immediate = false) => {
    if (!imgRef.current) return;
    const { scale, translateX, translateY } = gestureState.current;

    imgRef.current.style.transition = immediate ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)';
    imgRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

    // Hide controls when zoomed
    if (scale > 1.08) {
      setControlsVisible(false);
    } else if (scale === 1 && !isFullscreen) {
      setControlsVisible(true);
    }
  }, [isFullscreen]);

  // Reset zoom & pan
  const resetZoom = useCallback(() => {
    gestureState.current.scale = 1;
    gestureState.current.translateX = 0;
    gestureState.current.translateY = 0;
    applyTransform();
  }, [applyTransform]);

  // Preload and cache high-res photo with LRU limit of 3
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentPhoto) return;

    resetZoom();
    setHighResLoaded(false);

    const highResUrl = currentPhoto.thumbnail_url.replace(/=w\d+/, '=w2000');
    const cache = highResCacheRef.current;

    if (cache.has(highResUrl)) {
      setHighResLoaded(true);
    } else {
      const img = new Image();
      img.src = highResUrl;
      img
        .decode()
        .then(() => {
          cache.set(highResUrl, img);
          if (cache.size > 3) {
            const firstKey = cache.keys().next().value;
            if (firstKey) cache.delete(firstKey);
          }
          setHighResLoaded(true);
        })
        .catch(() => {
          // If decode fails, fallback gracefully to thumbnail
          setHighResLoaded(true);
        });
    }

    // Preload next and prev photos
    if (currentIndex + 1 < photos.length) {
      const nextImg = new Image();
      nextImg.src = photos[currentIndex + 1].thumbnail_url.replace(/=w\d+/, '=w2000');
    }
    if (currentIndex - 1 >= 0) {
      const prevImg = new Image();
      prevImg.src = photos[currentIndex - 1].thumbnail_url.replace(/=w\d+/, '=w2000');
    }
  }, [isOpen, currentIndex, currentPhoto, photos, resetZoom]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, photos.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const toggleFullscreenMode = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
        setControlsVisible(false);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        setControlsVisible(true);
      }
    } catch (_) {
      // Fallback for browsers without Fullscreen API (e.g. iPhone Safari)
      setIsFullscreen((prev) => !prev);
      setControlsVisible((prev) => !prev);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') {
        if (gestureState.current.scale > 1) {
          resetZoom();
        } else if (isFullscreen) {
          toggleFullscreenMode();
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!readOnly && onToggleSelection && currentPhoto) {
          onToggleSelection(currentPhoto.id);
        }
      } else if (e.key === '+' || e.key === '=') {
        gestureState.current.scale = Math.min(4, gestureState.current.scale + 0.5);
        applyTransform();
      } else if (e.key === '-') {
        gestureState.current.scale = Math.max(1, gestureState.current.scale - 0.5);
        if (gestureState.current.scale === 1) {
          gestureState.current.translateX = 0;
          gestureState.current.translateY = 0;
        }
        applyTransform();
      } else if (e.key === '0') {
        resetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreenMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, resetZoom, isFullscreen, toggleFullscreenMode, readOnly, onToggleSelection, currentPhoto, applyTransform]);

  // Safari gesture prevention
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const preventSafariZoom = (e: Event) => e.preventDefault();

    stage.addEventListener('gesturestart', preventSafariZoom, { passive: false });
    stage.addEventListener('gesturechange', preventSafariZoom, { passive: false });
    stage.addEventListener('gestureend', preventSafariZoom, { passive: false });

    return () => {
      stage.removeEventListener('gesturestart', preventSafariZoom);
      stage.removeEventListener('gesturechange', preventSafariZoom);
      stage.removeEventListener('gestureend', preventSafariZoom);
    };
  }, []);

  // Desktop Mouse Wheel & Trackpad Pinch
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = gestureState.current;

      const delta = -e.deltaY;
      const factor = e.ctrlKey ? 0.05 : 0.002;
      const zoomMultiplier = Math.exp(delta * factor);
      const nextScale = Math.min(4, Math.max(1, state.scale * zoomMultiplier));

      if (nextScale === 1) {
        state.translateX = 0;
        state.translateY = 0;
      }

      state.scale = nextScale;
      applyTransform(true);
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleWheel);
  }, [applyTransform]);

  // Pointer Event Gestures (Pinch-to-zoom, Pan, Swipe)
  const handlePointerDown = (e: React.PointerEvent) => {
    const state = gestureState.current;
    state.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    state.isPointerDown = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.initialTranslateX = state.translateX;
    state.initialTranslateY = state.translateY;

    if (state.activePointers.size === 2) {
      const pts = Array.from(state.activePointers.values());
      state.startDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      state.startScale = state.scale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = gestureState.current;
    if (!state.isPointerDown) return;

    state.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-finger Pinch Zoom
    if (state.activePointers.size === 2) {
      const pts = Array.from(state.activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (state.startDistance > 0) {
        const ratio = dist / state.startDistance;
        state.scale = Math.min(4.5, Math.max(0.85, state.startScale * ratio));
        applyTransform(true);
      }
      return;
    }

    // Handle 1-finger Pan or Swipe
    if (state.activePointers.size === 1) {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (state.scale > 1.05) {
        // Pan clamped within stage bounds
        const maxPanX = (window.innerWidth * (state.scale - 1)) / 2;
        const maxPanY = (window.innerHeight * (state.scale - 1)) / 2;

        state.translateX = Math.min(maxPanX, Math.max(-maxPanX, state.initialTranslateX + dx));
        state.translateY = Math.min(maxPanY, Math.max(-maxPanY, state.initialTranslateY + dy));
        applyTransform(true);
      } else {
        // At 1x: detect horizontal slide or vertical swipe down
        if (!state.swipeDirection) {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            state.swipeDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
          }
        }

        if (state.swipeDirection === 'horizontal') {
          state.translateX = dx * 0.7; // Slight rubberband resistance
          applyTransform(true);
        } else if (state.swipeDirection === 'vertical' && dy > 0) {
          state.translateY = dy * 0.7;
          applyTransform(true);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const state = gestureState.current;
    state.activePointers.delete(e.pointerId);

    if (state.activePointers.size === 0) {
      state.isPointerDown = false;

      // Handle rubber-band bounce back if scale < 1
      if (state.scale < 1) {
        state.scale = 1;
        state.translateX = 0;
        state.translateY = 0;
        applyTransform();
        state.swipeDirection = null;
        return;
      }

      // Check for swipe completion at 1x
      if (state.scale === 1 && state.swipeDirection) {
        if (state.swipeDirection === 'horizontal') {
          if (state.translateX < -70 && currentIndex < photos.length - 1) {
            handleNext();
          } else if (state.translateX > 70 && currentIndex > 0) {
            handlePrev();
          }
        } else if (state.swipeDirection === 'vertical' && state.translateY > 90) {
          onClose();
        }
      }

      // Reset swipe offsets
      state.translateX = 0;
      state.translateY = 0;
      state.swipeDirection = null;
      applyTransform();
    }
  };

  // Double tap to zoom toggle
  const handleStageClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const state = gestureState.current;

    if (now - state.lastTapTime < 300) {
      // Double tap: toggle 1x <-> 2.5x
      if (state.scale > 1.2) {
        resetZoom();
      } else {
        state.scale = 2.5;
        // Focus zoom towards click position
        const rect = stageRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = e.clientX - rect.left - rect.width / 2;
          const clickY = e.clientY - rect.top - rect.height / 2;
          state.translateX = -clickX * 1.2;
          state.translateY = -clickY * 1.2;
        }
        applyTransform();
      }
      state.lastTapTime = 0;
    } else {
      // Single tap: toggle controls or toggle fullscreen
      state.lastTapTime = now;
      if (state.scale > 1.05) {
        setControlsVisible((prev) => !prev);
      } else {
        // Toggle control bar visibility
        setControlsVisible((prev) => !prev);
      }
    }
  };

  if (!isOpen || !currentPhoto) return null;

  const isSelected = isPhotoSelected ? isPhotoSelected(currentPhoto.id) : false;
  const selectionOrder = getSelectionOrder ? getSelectionOrder(currentPhoto.id) : null;
  const isLimitReached = maxSelectable > 0 && selectionCount >= maxSelectable && !isSelected;

  const handleDownload = () => {
    const downloadUrl = currentPhoto.thumbnail_url.replace(/=w\d+/, '=w2000');
    window.open(downloadUrl, '_blank');
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none overflow-hidden font-sans text-white"
      style={{ height: '100dvh' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${currentIndex + 1} dari ${photos.length}: ${currentPhoto.filename}`}
    >
      {/* ─────── TOP BAR (Normal / Landscape Mode) ─────── */}
      <div
        className={`shrink-0 z-30 transition-all duration-200 border-b border-white/10 ${
          isLandscapeShort ? 'h-12 px-4' : 'h-14 px-4 sm:px-6'
        } ${
          controlsVisible
            ? 'opacity-100 translate-y-0 bg-black/85 backdrop-blur-md'
            : 'opacity-0 -translate-y-full pointer-events-none'
        } flex items-center justify-between`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Left: filename & counter */}
        <div className="flex items-center gap-3 truncate max-w-[55%]">
          <span className="text-xs font-mono text-white/70 shrink-0">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="hidden sm:inline-block w-px h-3 bg-white/20" />
          <span className="text-xs font-mono truncate text-white/90" title={currentPhoto.filename}>
            {currentPhoto.filename}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Landscape compact select button */}
          {isLandscapeShort && !readOnly && onToggleSelection && (
            <button
              type="button"
              onClick={() => onToggleSelection(currentPhoto.id)}
              disabled={isLimitReached}
              className={`px-3 py-1 text-xs font-mono rounded-[2px] transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-merah text-white ring-1 ring-merah-tanda'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              } disabled:opacity-40`}
            >
              <Check className="w-3 h-3" />
              <span>{isSelected ? 'Terpilih' : 'Pilih'}</span>
            </button>
          )}

          {/* Download button if allowed */}
          {allowDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Unduh foto"
              aria-label="Unduh foto"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreenMode}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-merah transition-colors rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Tutup (Esc)"
            aria-label="Tutup penampil foto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─────── CENTER STAGE (Photos are 100% contained within, NO overlay overlap) ─────── */}
      <div
        ref={stageRef}
        onClick={handleStageClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {/* Base Thumbnail (Cached, immediate feedback) */}
        <img
          src={currentPhoto.thumbnail_url}
          alt={currentPhoto.filename}
          className={`absolute max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-300 ${
            highResLoaded ? 'opacity-0' : 'opacity-100 filter blur-[1px]'
          }`}
          draggable={false}
        />

        {/* High Resolution Render Element with Direct RAF Transform */}
        <img
          ref={imgRef}
          src={currentPhoto.thumbnail_url.replace(/=w\d+/, '=w2000')}
          alt={currentPhoto.filename}
          className={`max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-300 ${
            highResLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />

        {/* Navigation Arrow Left (Desktop hover or visible controls) */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white flex items-center justify-center border border-white/15 transition-all duration-200 z-20 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Foto sebelumnya (Panah Kiri)"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Arrow Right (Desktop hover or visible controls) */}
        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white flex items-center justify-center border border-white/15 transition-all duration-200 z-20 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Foto berikutnya (Panah Kanan)"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ─────── BOTTOM BAR (Normal Mode only, Hidden in Landscape Short) ─────── */}
      {!isLandscapeShort && (
        <div
          className={`shrink-0 z-30 transition-all duration-200 border-t border-white/10 ${
            controlsVisible
              ? 'opacity-100 translate-y-0 bg-black/85 backdrop-blur-md'
              : 'opacity-0 translate-y-full pointer-events-none'
          } flex flex-col justify-center px-4 sm:px-8 py-3`}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-4">
            {/* Left: Quota / Order indicator */}
            <div className="flex flex-col">
              {!readOnly && maxSelectable > 0 ? (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                    Kuota Kurasi
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {selectionCount} / {maxSelectable} Foto Dipilih
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono text-white/60">
                  Foto {currentIndex + 1} dari {photos.length}
                </span>
              )}
            </div>

            {/* Right: Big Selection Action Button */}
            {!readOnly && onToggleSelection ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection(currentPhoto.id);
                }}
                disabled={isLimitReached}
                aria-pressed={isSelected}
                className={`px-6 py-2.5 rounded-[2px] font-mono text-xs uppercase tracking-wider transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                  isLimitReached
                    ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                    : isSelected
                    ? 'bg-merah hover:bg-merah-hover text-white ring-2 ring-merah-tanda'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                {isLimitReached ? (
                  <span>Batas Kuota Tercapai</span>
                ) : isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Terpilih #{selectionOrder} · Batalkan</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 opacity-50" />
                    <span>Pilih Foto Ini</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
