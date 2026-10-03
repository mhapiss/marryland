import React, { useEffect, useRef, useCallback } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  loading = false,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
      // Simple focus trap: Tab cycles between cancel and confirm
      if (e.key === 'Tab') {
        const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [loading, onCancel]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-elevated p-6 animate-slide-up"
        onKeyDown={handleKeyDown}
      >
        <h3
          id="confirm-dialog-title"
          className="font-serif text-lg font-bold text-text mb-2"
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-desc"
          className="text-sm text-muted leading-relaxed mb-6"
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-outline text-sm py-2.5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center text-sm py-2.5 rounded-full font-medium transition-all duration-300 active:scale-[0.98] ${
              destructive
                ? 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                : 'bg-primary text-white hover:bg-primary-500 disabled:opacity-50'
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
