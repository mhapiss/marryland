// src/components/gallery/SubmitResultDialog.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  AlertTriangle,
  RefreshCw,
  Copy,
  MessageCircle,
  X,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import type { ViewerPhoto } from './PhotoViewer';

export type SubmitResultState = 'submitting' | 'success' | 'error';

interface SubmitResultDialogProps {
  open: boolean;
  state: SubmitResultState;
  onClose: () => void;
  onRetry: () => void;
  totalSelected: number;
  selectedPhotos: ViewerPhoto[];
  studioName?: string;
  photographerPhone?: string;
  galleryName: string;
  submittedAt?: string | null;
  errorMessage?: string;
  isRetrying?: boolean;
}

export default function SubmitResultDialog({
  open,
  state,
  onClose,
  onRetry,
  totalSelected,
  selectedPhotos,
  studioName = 'Studio',
  photographerPhone,
  galleryName,
  submittedAt,
  errorMessage,
  isRetrying = false,
}: SubmitResultDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Esc key handler (disabled while submitting)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'submitting') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, state, onClose]);

  if (!open) return null;

  // Format date and time in Indonesian
  const formattedDateTime = (() => {
    const d = submittedAt ? new Date(submittedAt) : new Date();
    try {
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${datePart}, pukul ${timePart} WIB`;
    } catch {
      return 'Baru saja';
    }
  })();

  // Copy filenames to clipboard
  const handleCopyFilenames = async () => {
    const text = selectedPhotos.map((p, idx) => `${idx + 1}. ${p.filename}`).join('\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // WhatsApp Message Composer
  const cleanPhone = (photographerPhone || '').replace(/[^0-9]/g, '');
  const hasPhone = cleanPhone.length >= 8;

  const waMessage = (() => {
    const photoList = selectedPhotos
      .slice(0, 50)
      .map((p, idx) => `${idx + 1}. ${p.filename}`)
      .join('\n');
    const extraCount = selectedPhotos.length > 50 ? `\n...dan ${selectedPhotos.length - 50} foto lainnya` : '';

    return (
      `Halo ${studioName}, saya telah mengirimkan pilihan ${totalSelected} foto untuk galeri ${galleryName} melalui website by.marryland.\n\n` +
      `Waktu pengiriman: ${formattedDateTime}\n\n` +
      `Daftar foto terpilih:\n${photoList}${extraCount}\n\n` +
      `Terima kasih!`
    );
  })();

  const waUrl = hasPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-labelledby="submit-result-title"
      onClick={() => {
        if (state !== 'submitting') onClose();
      }}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161618] border border-garis rounded-t-[4px] sm:rounded-[2px] max-w-lg w-full max-h-[92vh] flex flex-col font-sans text-tinta dark:text-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Top Accent Strip */}
        <div
          className={`h-1.5 w-full ${
            state === 'submitting'
              ? 'bg-amber-600 animate-pulse'
              : state === 'success'
              ? 'bg-emerald-700'
              : 'bg-merah'
          }`}
        />

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* ================================================================= */}
          {/* 1. STATE: SUBMITTING */}
          {/* ================================================================= */}
          {state === 'submitting' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-merah/25 border-t-merah rounded-full animate-spin mx-auto" />
              <div>
                <h3
                  id="submit-result-title"
                  className="font-serif text-2xl font-normal text-tinta dark:text-white mb-2"
                >
                  Sedang Mengirim Pilihan...
                </h3>
                <p className="text-xs font-mono text-tinta-lembut dark:text-white/70 max-w-sm mx-auto leading-relaxed">
                  Menyimpan {totalSelected} foto kurasi ke studio dan mengunci galeri foto. Mohon jangan menutup halaman ini.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. STATE: SUCCESS */}
          {/* ================================================================= */}
          {state === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h3
                  id="submit-result-title"
                  className="font-serif text-2xl sm:text-3xl font-normal text-tinta dark:text-white mb-2"
                >
                  Pilihan Terkirim
                </h3>
                <p className="text-xs sm:text-sm font-medium text-tinta dark:text-white">
                  {totalSelected} foto dikirim untuk {studioName}
                </p>
                <p className="text-[11px] font-mono text-tinta-lembut dark:text-white/60 mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formattedDateTime}</span>
                </p>
              </div>

              <div className="p-3 bg-kertas-tua/50 dark:bg-white/5 border border-garis rounded-[2px] text-xs text-tinta-lembut dark:text-white/75 leading-relaxed">
                Pilihan fotomu telah berhasil dikirim ke fotografer. Kamu tetap dapat melihat galeri ini dan memperbarui pilihan foto kapan saja jika diperlukan.
              </div>

              {/* Scrollable File List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-tinta-lembut dark:text-white/60">
                    Daftar Foto Terpilih ({selectedPhotos.length})
                  </span>
                  <span className="text-[10px] font-mono text-tinta-lembut dark:text-white/40">
                    Hanya Baca
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto border border-garis rounded-[2px] bg-white dark:bg-[#121214] p-2.5 space-y-1 font-mono text-xs text-tinta dark:text-white/90">
                  {selectedPhotos.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between py-1 px-2 hover:bg-kertas-tua/30 dark:hover:bg-white/5 rounded-[2px]"
                    >
                      <span className="truncate pr-2">
                        <strong className="text-merah mr-1.5">{idx + 1}.</strong> {p.filename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. STATE: ERROR */}
          {/* ================================================================= */}
          {state === 'error' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 text-merah border border-red-200 dark:border-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3
                  id="submit-result-title"
                  className="font-serif text-2xl sm:text-3xl font-normal text-tinta dark:text-white mb-2"
                >
                  Pilihan Belum Terkirim
                </h3>
                <p className="text-xs sm:text-sm text-tinta dark:text-white max-w-sm mx-auto leading-relaxed">
                  {errorMessage ||
                    'Terjadi kendala saat menghubungkan ke sistem studio. Foto pilihanmu tetap tersimpan aman di perangkat ini.'}
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-[2px] leading-relaxed">
                <strong>Foto pilihanmu tidak hilang:</strong> Kamu dapat mencoba mengirim ulang, atau menyalin daftar nama file dan mengirimkannya langsung lewat WhatsApp agar proses tidak terhambat.
              </div>

              {/* Scrollable File List for Manual Copy */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-tinta-lembut dark:text-white/60 block mb-2">
                  Daftar Foto Siap Kirim ({selectedPhotos.length})
                </span>
                <div className="max-h-36 overflow-y-auto border border-garis rounded-[2px] bg-white dark:bg-[#121214] p-2.5 space-y-1 font-mono text-xs text-tinta dark:text-white/90">
                  {selectedPhotos.map((p, idx) => (
                    <div key={p.id || idx} className="truncate py-0.5">
                      <strong className="text-merah mr-1.5">{idx + 1}.</strong> {p.filename}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* BOTTOM ACTION BUTTONS */}
        {/* ================================================================= */}
        {state !== 'submitting' && (
          <div
            className="p-4 sm:p-6 border-t border-garis bg-kertas-tua/30 dark:bg-white/5 flex flex-col gap-2.5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            {state === 'success' && (
              <>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFilenames}
                    className="flex-1 px-4 py-2.5 border border-garis bg-white dark:bg-[#161618] hover:border-merah text-xs font-mono rounded-[2px] flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-tinta-lembut" />
                        <span>Salin Daftar Foto</span>
                      </>
                    )}
                  </button>

                  {hasPhone && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono rounded-[2px] flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Juga Lewat WA</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-merah hover:bg-merah-hover text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors min-h-[44px] shadow-sm font-semibold"
                >
                  Selesai
                </button>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFilenames}
                    className="flex-1 px-4 py-2.5 border border-garis bg-white dark:bg-[#161618] text-xs font-mono rounded-[2px] flex items-center justify-center gap-2 hover:border-merah transition-colors min-h-[44px]"
                  >
                    <Copy className="w-4 h-4 text-tinta-lembut" />
                    <span>Salin Daftar Foto</span>
                  </button>

                  {hasPhone && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono rounded-[2px] flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Manual ke WA</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-garis text-xs font-mono rounded-[2px] text-tinta-lembut hover:text-tinta transition-colors min-h-[44px]"
                  >
                    Tutup Sementara
                  </button>

                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="flex-1 px-5 py-2.5 bg-merah hover:bg-merah-hover text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mencoba Lagi...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Coba Kirim Lagi</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
