// src/components/common/Button.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { prefetchRoute } from '../../lib/routeLoaders';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  to?: string;
  href?: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    to,
    href,
    loading = false,
    disabled = false,
    className = '',
    children,
    onMouseEnter,
    onFocus,
    ...props
  },
  ref
) {
  // Ukuran target sentuh: min-h 44px untuk md dan lg (standar WCAG/mobile)
  const sizeClasses: Record<ButtonSize, string> = {
    sm: variant === 'icon' ? 'min-h-[36px] min-w-[36px] p-2 text-xs' : 'min-h-[36px] px-3.5 py-1.5 text-xs',
    md: variant === 'icon' ? 'min-h-[44px] min-w-[44px] p-2.5 text-sm' : 'min-h-[44px] px-5 py-2.5 text-[15px]',
    lg: variant === 'icon' ? 'min-h-[48px] min-w-[48px] p-3 text-base' : 'min-h-[48px] px-7 py-3 text-base',
  };

  // Variants tanpa gradien, tanpa glow, transisi 150ms hanya pada warna
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-merah text-kertas border border-merah hover:bg-merah-hover hover:border-merah-hover active:bg-marun focus-visible:ring-merah focus-visible:ring-offset-kertas',
    secondary:
      'border border-tinta/35 text-tinta bg-transparent hover:bg-kertas-tua hover:border-tinta active:bg-kertas-tua/80 focus-visible:ring-tinta focus-visible:ring-offset-kertas',
    outline:
      'border border-tinta/35 text-tinta bg-transparent hover:bg-kertas-tua hover:border-tinta active:bg-kertas-tua/80 focus-visible:ring-tinta focus-visible:ring-offset-kertas',
    tertiary:
      'text-tinta bg-transparent link-vintage hover:text-merah focus-visible:ring-merah focus-visible:ring-offset-kertas !min-h-0 !p-1',
    ghost:
      'text-tinta bg-transparent hover:bg-kertas-tua/70 active:bg-kertas-tua focus-visible:ring-tinta focus-visible:ring-offset-kertas',
    danger:
      'bg-merah-tanda text-kertas border border-merah-tanda hover:bg-merah hover:border-merah active:bg-marun focus-visible:ring-merah-tanda focus-visible:ring-offset-kertas',
    icon:
      'text-tinta bg-transparent border border-garis hover:bg-kertas-tua active:bg-kertas-tua/80 focus-visible:ring-tinta focus-visible:ring-offset-kertas',
  };

  const isDisabled = disabled || loading;

  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-sans font-medium normal-case tracking-normal rounded-btn',
    'transition-colors duration-150 outline-none text-center select-none shadow-none',
    'focus-visible:ring-2 focus-visible:ring-offset-2',
    isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={baseClasses}
        onMouseEnter={(e) => {
          prefetchRoute(to);
          onMouseEnter?.(e as any);
        }}
        onFocus={(e) => {
          prefetchRoute(to);
          onFocus?.(e as any);
        }}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={baseClasses}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      {...props}
    >
      {content}
    </button>
  );
});
