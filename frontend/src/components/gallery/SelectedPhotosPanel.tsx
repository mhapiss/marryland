import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, Send, Eye, CheckCircle2, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import type { ViewerPhoto } from './PhotoViewer';

interface SelectedPhotosPanelProps {
  isOpen: boolean;
  onClose: () => void;
  photos: ViewerPhoto[];
  selectedPhotoIds: string[];
  onRemoveSelection: (photoId: string) => void;
  onOpenViewer: (photoIndex: number) => void;
  onSubmit: () => void;
  maxSelectable: number;
}

export default function SelectedPhotosPanel({
  isOpen,
  onClose,
  photos,
  selectedPhotoIds,
  onRemoveSelection,
  onOpenViewer,
  onSubmit,
  maxSelectable,
}: SelectedPhotosPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Esc key listener & focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter selected photos in their preserved selection order
  const selectedPhotosList = selectedPhotoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as ViewerPhoto[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Panel Foto Terpilih"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#161618] border-l border-garis w-full sm:max-w-2xl h-full flex flex-col font-sans text-tinta dark:text-white shadow-2xl"
      >
        {/* Panel Header */}
        <div className="p-5 sm:p-6 border-b border-garis flex items-center justify-between bg-kertas/50 dark:bg-white/5">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-tinta dark:text-white">
              Foto Terpilih ({selectedPhotosList.length})
            </h2>
            <p className="text-xs font-mono text-tinta-lembut dark:text-white/60 mt-0.5">
              Urutan kurasi yang akan dikirimkan ke fotografer
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-tinta-lembut hover:text-merah transition-colors duration-150 rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup panel pilihan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Content (Scrollable Grid) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f7f7f8] dark:bg-[#121214]">
          {selectedPhotosList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-tinta-lembut dark:text-white/50">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-garis flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-tinta-lembut/40" />
              </div>
              <p className="text-sm font-medium mb-1">Belum ada foto yang dipilih</p>
              <p className="text-xs max-w-xs leading-relaxed">
                Ketuk lingkaran centang pada foto di galeri untuk memasukkannya ke daftar pilihan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedPhotosList.map((photo, index) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id);

                return (
                  <div
                    key={photo.id}
                    className="group relative aspect-[3/2] bg-white dark:bg-[#1a1a1c] border border-garis rounded-[2px] overflow-hidden flex items-center justify-center shadow-sm"
                  >
                    <img
                      src={photo.thumbnail_url}
                      alt={photo.filename}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onOpenViewer(globalIndex >= 0 ? globalIndex : 0)}
                      loading="lazy"
                    />

                    {/* Order badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-merah-tanda text-white text-[10px] font-mono font-bold rounded-[2px] shadow-sm pointer-events-none">
                      #{index + 1}
                    </div>

                    {/* Action overlay on hover / touch */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenViewer(globalIndex >= 0 ? globalIndex : 0)}
                        className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Lihat ukuran besar"
                        aria-label="Lihat ukuran besar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveSelection(photo.id)}
                        className="p-2 bg-merah/90 hover:bg-merah rounded-full text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Hapus dari pilihan"
                        aria-label="Hapus dari pilihan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div
          className="p-5 sm:p-6 border-t border-garis bg-white dark:bg-[#161618] flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <div className="w-full sm:w-auto">
            <span className="text-xs font-mono text-tinta-lembut dark:text-white/60 block">
              Total Dipilih: <strong className="text-tinta dark:text-white">{selectedPhotosList.length}</strong> / {maxSelectable} foto
            </span>
            <span className="text-[11px] font-mono text-tinta-lembut/70 dark:text-white/40">
              {maxSelectable - selectedPhotosList.length > 0
                ? `Sisa kuota: ${maxSelectable - selectedPhotosList.length} foto lagi`
                : 'Kuota pilihan telah lengkap tercapai'}
            </span>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {selectedPhotosList.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  const text = selectedPhotosList.map((p, idx) => `${idx + 1}. ${p.filename}`).join('\n');
                  const ok = await copyToClipboard(text);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="flex-1 sm:flex-none px-3.5 py-2.5 border border-garis text-sm font-sans font-medium rounded-btn hover:border-merah hover:bg-kertas transition-colors duration-150 min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
                title="Salin daftar foto terpilih"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-tinta-lembut" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-garis text-sm font-sans font-medium rounded-btn hover:border-tinta hover:bg-kertas-tua transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
            >
              Kembali memilih
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={selectedPhotosList.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun text-kertas text-sm font-sans font-medium rounded-btn transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 focus-visible:ring-offset-kertas"
            >
              <Send className="w-4 h-4" />
              <span>Kirim pilihan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
