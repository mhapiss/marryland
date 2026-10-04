// src/components/common/PageHero.tsx
import React from 'react';

interface PageHeroProps {
  number?: string; // e.g. "№ 01"
  eyebrow?: string;
  title: string;
  italicWord?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHero({
  number = '№ 01',
  eyebrow,
  title,
  italicWord,
  description,
  actions,
  className = '',
}: PageHeroProps) {
  // If title has *words*, highlight them in italics
  const renderTitle = () => {
    if (italicWord && title.includes(italicWord)) {
      const parts = title.split(italicWord);
      return (
        <>
          {parts[0]}
          <span className="italic font-normal">{italicWord}</span>
          {parts[1]}
        </>
      );
    }
    if (title.includes('*')) {
      const parts = title.split(/(\*[^*]+\*)/g);
      return (
        <>
          {parts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <span key={i} className="italic font-normal">
                  {part.slice(1, -1)}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    }
    return title;
  };

  return (
    <div className={`pt-24 md:pt-36 pb-12 md:pb-20 border-b border-garis ${className}`}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs text-merah font-semibold">{number}</span>
          {eyebrow && (
            <>
              <span className="w-4 h-[1px] bg-garis" />
              <span className="label-caps text-tinta-lembut">{eyebrow}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline">
          <div className="lg:col-span-8">
            <h1 className="font-display-l text-tinta font-normal tracking-tight">
              {renderTitle()}
            </h1>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end">
            {description && (
              <p className="font-body text-tinta-lembut mb-6">
                {description}
              </p>
            )}
            {actions && <div className="flex flex-wrap items-center gap-4">{actions}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
