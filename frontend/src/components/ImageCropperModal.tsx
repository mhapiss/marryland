// src/components/ImageCropperModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Crop, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

export interface CropPreset {
  id: string;
  label: string;
  ratio: number | null; // width / height, or null for freeform
  description?: string;
}

const PRESET_RATIOS: CropPreset[] = [
  { id: 'free', label: 'Bebas', ratio: null, description: 'Potongan bebas tanpa batas rasio' },
  { id: '3-4', label: '3:4 Potret', ratio: 3 / 4, description: 'Format utama Hero & Kolase 1' },
  { id: '4-5', label: '4:5 Kolase', ratio: 4 / 5, description: 'Format pas untuk Kolase 2' },
  { id: '1-1', label: '1:1 Persegi', ratio: 1 / 1, description: 'Format pas untuk Kolase 3' },
  { id: '4-3', label: '4:3 Lanskap', ratio: 4 / 3, description: 'Format mendatar standar liputan' },
  { id: '16-9', label: '16:9 Sinematik', ratio: 16 / 9, description: 'Format lebar sinematik' },
];

interface ImageCropperModalProps {
  open: boolean;
  imageUrl: string;
  fileName?: string;
  suggestedRatio?: number | null;
  onClose: () => void;
  onApplyCrop: (
    croppedBlob: Blob,
    previewUrl: string,
    width: number,
    height: number
  ) => Promise<void> | void;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageCropperModal({
  open,
  imageUrl,
  fileName,
  suggestedRatio,
  onClose,
  onApplyCrop,
}: ImageCropperModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    if (suggestedRatio === 3 / 4) return '3-4';
    if (suggestedRatio === 4 / 5) return '4-5';
    if (suggestedRatio === 1) return '1-1';
    if (suggestedRatio === 4 / 3) return '4-3';
    return '3-4'; // default ke potret yang paling sering digunakan
  });

  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ naturalW: number; naturalH: number; dispW: number; dispH: number }>({
    naturalW: 100,
    naturalH: 100,
    dispW: 100,
    dispH: 100,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    action: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null;
    startX: number;
    startY: number;
    initialCrop: CropBox;
  }>({
    action: null,
    startX: 0,
    startY: 0,
    initialCrop: { x: 0, y: 0, w: 100, h: 100 },
  });

  const currentPreset = PRESET_RATIOS.find((p) => p.id === selectedPresetId) || PRESET_RATIOS[0];
  const activeRatio = currentPreset.ratio;

  // Inisialisasi kotak potong saat gambar selesai dimuat atau preset rasio diganti
  const initCropBox = useCallback(
    (ratio: number | null, dispW: number, dispH: number) => {
      if (dispW <= 0 || dispH <= 0) return;

      let w = dispW * 0.85;
      let h = dispH * 0.85;

      if (ratio !== null) {
        // Sesuaikan dengan rasio yang diminta
        if (w / ratio <= dispH * 0.9) {
          h = w / ratio;
        } else {
          h = dispH * 0.85;
          w = h * ratio;
        }
      }

      // Posisikan di tengah gambar
      const x = (dispW - w) / 2;
      const y = (dispH - h) / 2;

      setCrop({
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: Math.min(dispW, w),
        h: Math.min(dispH, h),
      });
    },
    []
  );

  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth;
    const nh = imgRef.current.naturalHeight;
    const dw = imgRef.current.width;
    const dh = imgRef.current.height;

    setImgDimensions({
      naturalW: nw,
      naturalH: nh,
      dispW: dw,
      dispH: dh,
    });
    setImgLoaded(true);
    initCropBox(activeRatio, dw, dh);
  };

  // Saat preset rasio berubah
  const handleSelectPreset = (preset: CropPreset) => {
    setSelectedPresetId(preset.id);
    if (imgLoaded && imgDimensions.dispW > 0) {
      initCropBox(preset.ratio, imgDimensions.dispW, imgDimensions.dispH);
    }
  };

  // Pointer interaction: Move & Resize
  const handlePointerDown = (
    e: React.PointerEvent,
    action: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dragRef.current = {
      action,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const { action, startX, startY, initialCrop } = dragRef.current;
      if (!action || !imgRef.current) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const { dispW, dispH } = imgDimensions;

      if (action === 'move') {
        const newX = Math.max(0, Math.min(dispW - initialCrop.w, initialCrop.x + dx));
        const newY = Math.max(0, Math.min(dispH - initialCrop.h, initialCrop.y + dy));
        setCrop((prev) => ({ ...prev, x: newX, y: newY }));
        return;
      }

      // Handle Resizing
      let newX = initialCrop.x;
      let newY = initialCrop.y;
      let newW = initialCrop.w;
      let newH = initialCrop.h;

      if (action === 'se') {
        newW = Math.max(40, Math.min(dispW - initialCrop.x, initialCrop.w + dx));
        if (activeRatio !== null) {
          newH = newW / activeRatio;
          if (newY + newH > dispH) {
            newH = dispH - newY;
            newW = newH * activeRatio;
          }
        } else {
          newH = Math.max(40, Math.min(dispH - initialCrop.y, initialCrop.h + dy));
        }
      } else if (action === 'sw') {
        const proposedW = Math.max(40, initialCrop.w - dx);
        const maxW = initialCrop.x + initialCrop.w;
        newW = Math.min(maxW, proposedW);
        newX = initialCrop.x + (initialCrop.w - newW);

        if (activeRatio !== null) {
          newH = newW / activeRatio;
          if (newY + newH > dispH) {
            newH = dispH - newY;
            newW = newH * activeRatio;
            newX = initialCrop.x + (initialCrop.w - newW);
          }
        } else {
          newH = Math.max(40, Math.min(dispH - initialCrop.y, initialCrop.h + dy));
        }
      } else if (action === 'ne') {
        newW = Math.max(40, Math.min(dispW - initialCrop.x, initialCrop.w + dx));
        if (activeRatio !== null) {
          newH = newW / activeRatio;
          newY = initialCrop.y + (initialCrop.h - newH);
          if (newY < 0) {
            newY = 0;
            newH = initialCrop.y + initialCrop.h;
            newW = newH * activeRatio;
          }
        } else {
          const proposedH = Math.max(40, initialCrop.h - dy);
          const maxH = initialCrop.y + initialCrop.h;
          newH = Math.min(maxH, proposedH);
          newY = initialCrop.y + (initialCrop.h - newH);
        }
      } else if (action === 'nw') {
        const proposedW = Math.max(40, initialCrop.w - dx);
        const maxW = initialCrop.x + initialCrop.w;
        newW = Math.min(maxW, proposedW);
        newX = initialCrop.x + (initialCrop.w - newW);

        if (activeRatio !== null) {
          newH = newW / activeRatio;
          newY = initialCrop.y + (initialCrop.h - newH);
          if (newY < 0) {
            newY = 0;
            newH = initialCrop.y + initialCrop.h;
            newW = newH * activeRatio;
            newX = initialCrop.x + (initialCrop.w - newW);
          }
        } else {
          const proposedH = Math.max(40, initialCrop.h - dy);
          const maxH = initialCrop.y + initialCrop.h;
          newH = Math.min(maxH, proposedH);
          newY = initialCrop.y + (initialCrop.h - newH);
        }
      }

      setCrop({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        w: Math.max(30, newW),
        h: Math.max(30, newH),
      });
    };

    const handlePointerUp = () => {
      dragRef.current.action = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Terapkan hasil potongan ke canvas beresolusi penuh
  const handleApply = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const srcX = Math.round(crop.x * scaleX);
      const srcY = Math.round(crop.y * scaleY);
      const srcW = Math.round(crop.w * scaleX);
      const srcH = Math.round(crop.h * scaleY);

      // Pastikan dimensi valid
      const targetW = Math.max(1, srcW);
      const targetH = Math.max(1, srcH);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Gagal menyiapkan context gambar');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.90);
      });

      if (!blob) throw new Error('Gagal memproses gambar terpotong');

      const previewUrl = URL.createObjectURL(blob);
      await onApplyCrop(blob, previewUrl, targetW, targetH);
      onClose();
    } catch (err: any) {
      alert('Gagal memotong foto: ' + (err.message || 'Coba lagi'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  // Hitung estimasi resolusi output saat ini
  const scale = imgDimensions.dispW > 0 ? imgDimensions.naturalW / imgDimensions.dispW : 1;
  const estimatedOutputW = Math.round(crop.w * scale);
  const estimatedOutputH = Math.round(crop.h * scale);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#1a1715] text-[#f7f5f0] border border-garis/40 rounded-panel w-full max-w-4xl p-5 sm:p-6 shadow-2xl z-10 max-h-[95vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-merah" />
              <h3 className="font-serif text-lg sm:text-xl font-normal text-white">
                Potong Foto (Crop Framing)
              </h3>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Geser dan sesuaikan bingkai pemotong agar wajah atau bagian penting pengantin tetap utuh dan presisi.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-white/60 hover:text-white p-2 rounded-btn transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup pemotong"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Pilihan Rasio Aspek */}
        <div className="py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-white/50 tracking-wider">
              Pilihan Rasio Aspek:
            </span>
            <span className="text-[11px] font-mono text-merah">
              {currentPreset.description}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_RATIOS.map((p) => {
              const isSelected = p.id === selectedPresetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-chip text-xs font-sans font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-merah text-white border-merah shadow-sm font-semibold'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport Pemotong Gambar Interaktif */}
        <div
          ref={containerRef}
          className="flex-1 min-h-[300px] max-h-[55vh] flex items-center justify-center p-2 bg-[#0d0c0b] rounded-[2px] overflow-hidden my-3 relative select-none"
        >
          <div className="relative inline-block max-h-full max-w-full">
            <img
              ref={imgRef}
              src={imageUrl}
              crossOrigin="anonymous"
              alt="Gambar untuk dipotong"
              onLoad={handleImageLoad}
              className="max-h-[50vh] max-w-full object-contain pointer-events-none block"
            />

            {/* Overlay Gelap Luar + Kotak Pemotong (Crop Window) */}
            {imgLoaded && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ width: imgDimensions.dispW, height: imgDimensions.dispH }}
              >
                {/* 4 Block Shadow di sekeliling kotak crop */}
                {/* Atas */}
                <div
                  className="absolute left-0 top-0 right-0 bg-black/60 pointer-events-auto"
                  style={{ height: crop.y }}
                />
                {/* Bawah */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-auto"
                  style={{ height: Math.max(0, imgDimensions.dispH - (crop.y + crop.h)) }}
                />
                {/* Kiri */}
                <div
                  className="absolute left-0 bg-black/60 pointer-events-auto"
                  style={{
                    top: crop.y,
                    height: crop.h,
                    width: crop.x,
                  }}
                />
                {/* Kanan */}
                <div
                  className="absolute right-0 bg-black/60 pointer-events-auto"
                  style={{
                    top: crop.y,
                    height: crop.h,
                    width: Math.max(0, imgDimensions.dispW - (crop.x + crop.w)),
                  }}
                />

                {/* KOTAK PEMOTONG (CROP BOX) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                  className="absolute cursor-move border-2 border-merah shadow-[0_0_0_1px_rgba(255,255,255,0.7)] pointer-events-auto"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                  }}
                  title="Klik & tahan untuk menggeser kotak pemotong"
                >
                  {/* Grid 3x3 (Rule of Thirds) */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* 4 Pegangan Sudut (Resize Handles) */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-merah rounded-full cursor-nwse-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-merah rounded-full cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-merah rounded-full cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-merah rounded-full cursor-nwse-resize shadow-md"
                  />

                  {/* Badge Resolusi Hasil Potong Mengambang */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded-[2px] pointer-events-none">
                    {estimatedOutputW} × {estimatedOutputH} px ({currentPreset.label})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Tombol Aksi */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
            <span>
              Dimensi Asli: {imgDimensions.naturalW} × {imgDimensions.naturalH} px
            </span>
            <span>•</span>
            <span className="text-white">
              Hasil Potong: {estimatedOutputW} × {estimatedOutputH} px
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => initCropBox(activeRatio, imgDimensions.dispW, imgDimensions.dispH)}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-btn text-xs font-sans font-medium flex items-center gap-1.5 min-h-[44px]"
              title="Kembalikan posisi kotak ke tengah"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Kotak</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white rounded-btn text-xs font-sans font-medium min-h-[44px]"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || !imgLoaded}
              className="px-5 py-2 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium min-h-[44px] shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memotong foto...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Terapkan Potongan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
