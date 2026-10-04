// src/components/common/Button.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }[size];

  const variantClasses = {
    primary:
      'bg-merah text-kertas border border-merah hover:bg-marun hover:border-marun active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 focus-visible:ring-offset-kertas',
    secondary:
      'border border-tinta/25 text-tinta bg-transparent hover:bg-tinta hover:text-kertas active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-tinta',
    outline:
      'border border-tinta/25 text-tinta bg-transparent hover:bg-tinta hover:text-kertas active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-tinta',
    ghost:
      'text-tinta hover:bg-kertas-tua/60 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-tinta',
  }[variant];

  const baseClasses =
    `inline-flex items-center justify-center gap-2 font-medium rounded-sm transition-colors duration-200 outline-none text-center shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`;

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={baseClasses} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  );
}
