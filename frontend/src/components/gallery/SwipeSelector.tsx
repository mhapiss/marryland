// src/components/gallery/SwipeSelector.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ViewerPhoto } from './PhotoViewer';

interface SwipeSelectorProps {
  photos: ViewerPhoto[];
  onToggleSelection: (photoId: string) => boolean;
  isPhotoSelected: (photoId: string) => boolean;
  onOpenViewer: (photoIndex: number) => void;
  maxSelectable: number;
  totalSelected: number;
  onViewSelections: () => void;
}

export default function SwipeSelector({
  photos,
  onToggleSelection,
  isPhotoSelected,
  onOpenViewer,
  maxSelectable,
  totalSelected,
  onViewSelections,
}: SwipeSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ index: number; action: 'selected' | 'skipped' }[]>([]);

  // Refs for current top card drag animation
  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentDeltaRef = useRef({ x: 0, y: 0 });

  const currentPhoto = photos[currentIndex];
  const isFinished = currentIndex >= photos.length;
  const isLimitReached = maxSelectable > 0 && totalSelected >= maxSelectable;

  const applyCardTransform = useCallback((dx: number, dy: number, rotateDeg: number) => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rotateDeg}deg)`;
  }, []);

  const handleSwipeAction = useCallback(
    (action: 'select' | 'skip') => {
      if (currentIndex >= photos.length) return;
      const targetPhoto = photos[currentIndex];

      if (action === 'select') {
        if (isLimitReached && !isPhotoSelected(targetPhoto.id)) {
          // Reset card position if limit reached
          if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.25s ease-out';
            applyCardTransform(0, 0, 0);
          }
          return;
        }
        if (!isPhotoSelected(targetPhoto.id)) {
          onToggleSelection(targetPhoto.id);
        }
        setHistory((prev) => [...prev, { index: currentIndex, action: 'selected' }]);
      } else {
        setHistory((prev) => [...prev, { index: currentIndex, action: 'skipped' }]);
      }

      // Animate card flying out
      if (cardRef.current) {
        const flyX = action === 'select' ? window.innerWidth + 200 : -window.innerWidth - 200;
        cardRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        applyCardTransform(flyX, 0, action === 'select' ? 25 : -25);
      }

      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'none';
          applyCardTransform(0, 0, 0);
        }
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    },
    [applyCardTransform, currentIndex, isLimitReached, isPhotoSelected, onToggleSelection, photos]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (last.action === 'selected') {
      const prevPhoto = photos[last.index];
      if (isPhotoSelected(prevPhoto.id)) {
        onToggleSelection(prevPhoto.id);
      }
    }

    setCurrentIndex(last.index);
  }, [history, isPhotoSelected, onToggleSelection, photos]);

  // Pointer drag events for card
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isFinished) return;
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentDeltaRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    currentDeltaRef.current = { x: dx, y: dy };

    const rotate = (dx / window.innerWidth) * 20;
    applyCardTransform(dx, dy * 0.4, rotate);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dx = currentDeltaRef.current.x;

    if (dx > 100) {
      handleSwipeAction('select');
    } else if (dx < -100) {
      handleSwipeAction('skip');
    } else {
      // Snap back
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)';
        applyCardTransform(0, 0, 0);
      }
    }
  };

  // Keyboard navigation for swipe mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleSwipeAction('select');
      } else if (e.key === 'ArrowLeft') {
        handleSwipeAction('skip');
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipeAction, handleUndo]);

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-[#1a1a1c] border border-garis rounded-panel text-center font-sans text-tinta dark:text-white">
        <div className="w-16 h-16 bg-kertas-tua dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-merah border border-garis">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-2xl font-normal mb-2">Tumpukan Selesai Ditinjau</h3>
        <p className="text-xs text-tinta-lembut dark:text-white/60 mb-6 leading-relaxed">
          Kamu telah meninjau seluruh foto pada mode geser. Kamu telah memilih{' '}
          <strong className="text-merah">{totalSelected}</strong> dari batas {maxSelectable} foto.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewSelections}
            className="w-full py-3 bg-merah hover:bg-merah-hover active:bg-marun text-kertas text-sm font-sans font-medium rounded-btn transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
          >
            Lihat & kirim pilihan
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(0)}
            className="w-full py-2.5 bg-kertas dark:bg-white/5 hover:bg-kertas-tua border border-garis text-sm font-sans font-medium rounded-btn transition-colors duration-150 text-tinta dark:text-white min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
          >
            Mulai ulang dari awal
          </button>
        </div>
      </div>
    );
  }

  const nextPhoto = currentIndex + 1 < photos.length ? photos[currentIndex + 1] : null;

  return (
    <div className="max-w-md mx-auto py-6 px-4 flex flex-col items-center select-none font-sans text-tinta dark:text-white">
      {/* Top progress indicator */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-tinta-lembut dark:text-white/60 mb-3 px-1">
        <span>
          Foto {currentIndex + 1} dari {photos.length}
        </span>
        <span className={isLimitReached ? 'text-merah font-bold' : ''}>
          Terpilih: {totalSelected} / {maxSelectable}
        </span>
      </div>

      {/* Card Stack Area */}
      <div className="relative w-full aspect-[3/4] max-h-[62vh] rounded-[2px] flex items-center justify-center overflow-visible">
        {/* Underneath Card (next photo preview) */}
        {nextPhoto && (
          <div className="absolute inset-0 bg-[#f7f5f0] dark:bg-[#202024] border border-garis rounded-[2px] overflow-hidden scale-95 opacity-60 translate-y-3 pointer-events-none flex items-center justify-center">
            <img
              src={nextPhoto.thumbnail_url}
              alt=""
              className="w-full h-full object-contain p-2"
              draggable={false}
            />
          </div>
        )}

        {/* Top Active Card */}
        <div
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 bg-white dark:bg-[#1a1a1c] border border-garis rounded-[2px] shadow-lg overflow-hidden cursor-grab active:cursor-grabbing flex flex-col z-10 touch-none"
        >
          {/* Photo container (contained, uncropped) */}
          <div className="flex-1 relative bg-[#f7f5f0] dark:bg-[#111] flex items-center justify-center p-2 overflow-hidden">
            <img
              src={currentPhoto.thumbnail_url}
              alt={currentPhoto.filename}
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />

            {/* Quick full-size magnifier button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenViewer(currentIndex);
              }}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white text-xs transition-colors z-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Perbesar layar penuh"
              aria-label="Perbesar layar penuh"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Card footer (name) */}
          <div className="p-3 border-t border-garis bg-white dark:bg-[#1a1a1c] flex items-center justify-between">
            <span className="text-xs font-mono truncate text-tinta-lembut dark:text-white/70">
              {currentPhoto.filename}
            </span>
            <span className="text-[10px] font-mono text-tinta-lembut/50">
              Geser Kiri (Lewati) • Kanan (Pilih)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Button Ribbon (Never on top of photo) */}
      <div className="w-full max-w-xs flex items-center justify-between gap-4 mt-6">
        {/* Lewati (Skip) */}
        <button
          type="button"
          onClick={() => handleSwipeAction('skip')}
          className="w-14 h-14 rounded-full bg-white dark:bg-[#202024] border border-garis hover:border-tinta-lembut shadow-sm text-tinta-lembut dark:text-white/70 hover:text-tinta flex items-center justify-center transition-all"
          title="Lewati (Panah Kiri)"
          aria-label="Lewati foto ini"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Urungkan (Undo) */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-11 h-11 rounded-full bg-white dark:bg-[#202024] border border-garis text-tinta-lembut/70 hover:text-tinta dark:text-white/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          title="Urungkan langkah sebelumnya (Z)"
          aria-label="Urungkan langkah sebelumnya"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pilih (Select) */}
        <button
          type="button"
          onClick={() => handleSwipeAction('select')}
          disabled={isLimitReached && !isPhotoSelected(currentPhoto.id)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
            isLimitReached && !isPhotoSelected(currentPhoto.id)
              ? 'bg-kertas-tua dark:bg-white/10 text-tinta-lembut/40 cursor-not-allowed border border-garis'
              : 'bg-merah hover:bg-merah-hover text-white'
          }`}
          title="Pilih foto ini (Panah Kanan)"
          aria-label="Pilih foto ini"
        >
          <Check className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
