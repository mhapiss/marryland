// src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  initialFocusRef?: React.RefObject<HTMLElement>;
  onEscape?: () => void;
  returnFocus?: boolean;
}

/**
 * Traps keyboard focus within container while dialog is open.
 * Cycles Tab / Shift+Tab between first and last focusable elements,
 * handles Escape, and restores focus to trigger element when closed.
 */
export function useFocusTrap(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>,
  options?: UseFocusTrapOptions
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Set initial focus
    const focusTimer = setTimeout(() => {
      if (options?.initialFocusRef?.current) {
        options.initialFocusRef.current.focus();
      } else {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(
          (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
        );

        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
          }
          container.focus();
        }
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.onEscape) {
        options.onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(
          (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: cycle to last if currently on first or outside
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: cycle to first if currently on last or outside
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      if (options?.returnFocus !== false && previousActiveElement.current) {
        const toFocus = previousActiveElement.current;
        if (toFocus.isConnected && typeof toFocus.focus === 'function') {
          toFocus.focus();
        }
        previousActiveElement.current = null;
      }
    };
  }, [isOpen, containerRef, options?.initialFocusRef, options?.onEscape, options?.returnFocus]);
}
