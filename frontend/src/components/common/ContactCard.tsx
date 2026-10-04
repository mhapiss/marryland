// src/components/common/ContactCard.tsx
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ContactCardProps {
  number: string; // e.g. "№ 01"
  label: string; // e.g. "WHATSAPP"
  title: string; // e.g. "Chat Langsung"
  detail: string; // e.g. "+62 812 3456 7890"
  description: string;
  actionText: string;
  href: string;
  isExternal?: boolean;
  className?: string;
}

export function ContactCard({
  number,
  label,
  title,
  detail,
  description,
  actionText,
  href,
  isExternal = true,
  className = '',
}: ContactCardProps) {
  return (
    <div
      className={`border border-garis bg-kertas-tua/30 p-6 md:p-8 flex flex-col justify-between transition-colors hover:border-tinta/40 group ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs text-merah font-semibold">{number}</span>
          <span className="label-caps text-tinta-lembut">{label}</span>
        </div>

        <h3 className="font-serif text-xl md:text-2xl text-tinta font-normal mb-1">
          {title}
        </h3>
        <p className="font-mono text-sm text-merah font-medium mb-3">{detail}</p>
        <p className="font-body text-sm text-tinta-lembut mb-6">{description}</p>
      </div>

      <div>
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] font-bold text-tinta group-hover:text-merah transition-colors link-vintage"
        >
          <span>{actionText}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
