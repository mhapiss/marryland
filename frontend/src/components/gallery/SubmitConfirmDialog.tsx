// src/components/gallery/SubmitConfirmDialog.tsx
import React, { useEffect } from 'react';
import { Send, AlertCircle, RefreshCw } from 'lucide-react';

interface SubmitConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalSelected: number;
  maxSelectable: number;
  remainingQuota: number;
  isSubmitting?: boolean;
}

export default function SubmitConfirmDialog({
  open,
  onClose,
  onConfirm,
  totalSelected,
  maxSelectable,
  remainingQuota,
  isSubmitting = false,
}: SubmitConfirmDialogProps) {
  // Esc key closes confirm dialog
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const isOffline = !navigator.onLine;
  const isZeroSelected = totalSelected === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Kirim Pilihan Foto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161618] border border-garis rounded-[2px] max-w-md w-full p-6 sm:p-8 font-sans text-tinta dark:text-white shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-[2px] bg-kertas-tua dark:bg-white/10 text-merah border border-garis flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-tinta dark:text-white mb-1">
              Kirim Pilihan Foto?
            </h3>
            <p className="text-xs font-mono text-tinta-lembut dark:text-white/60">
              Konfirmasi penyelesaian kurasi galeri
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-xs sm:text-sm text-tinta-lembut dark:text-white/75 leading-relaxed">
            Kamu telah memilih <strong className="text-tinta dark:text-white">{totalSelected} dari {maxSelectable} foto</strong>. Pilihan foto ini akan dikirimkan langsung ke fotografer untuk proses pengeditan.
          </p>

          {/* Quota guidance note */}
          {remainingQuota > 0 && !isZeroSelected && (
            <div className="p-3 bg-kertas-tua/60 dark:bg-white/5 border border-garis rounded-[2px] text-xs font-mono text-tinta-lembut dark:text-white/70">
              Kamu masih bisa memilih <strong className="text-merah">{remainingQuota} foto</strong> lagi sebelum mengirim.
            </div>
          )}

          {remainingQuota === 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-[2px] text-xs font-mono text-emerald-800 dark:text-emerald-300">
              Kamu telah memilih seluruh kuota yang tersedia ({totalSelected} dari {maxSelectable} foto).
            </div>
          )}

          {isZeroSelected && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-[2px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Pilih minimal 1 foto sebelum mengirimkan pilihan.</span>
            </div>
          )}

          {isOffline && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-[2px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Koneksi internet terputus. Sambungkan kembali internet untuk mengirim pilihan.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-garis">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-garis text-xs font-mono rounded-[2px] hover:border-merah hover:text-merah transition-colors min-h-[44px]"
          >
            Periksa Lagi
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || isOffline || isZeroSelected}
            className="px-6 py-2.5 bg-merah hover:bg-merah-hover text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : (
              <span>Ya, Kirim Pilihan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
