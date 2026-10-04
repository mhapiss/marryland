import React from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  bg?: 'kertas' | 'kertas-tua' | 'marun' | 'background' | 'ivory' | 'dark' | 'white';
  doubleBorderTop?: boolean;
  doubleBorderBottom?: boolean;
  children: React.ReactNode;
}

export function Section({
  id,
  className = '',
  containerClassName = '',
  bg = 'kertas',
  doubleBorderTop = false,
  doubleBorderBottom = false,
  children,
}: SectionProps) {
  const bgClasses: Record<string, string> = {
    kertas: 'bg-kertas text-tinta',
    background: 'bg-kertas text-tinta',
    'kertas-tua': 'bg-kertas-tua text-tinta border-t border-b border-garis',
    ivory: 'bg-kertas-tua text-tinta border-t border-b border-garis',
    marun: 'bg-marun text-kertas border-t border-marun',
    dark: 'bg-marun text-kertas border-t border-marun',
    white: 'bg-kertas text-tinta',
  };

  const currentBg = bgClasses[bg] || bgClasses.kertas;
  const borderTop = doubleBorderTop ? 'border-double-t' : '';
  const borderBottom = doubleBorderBottom ? 'border-double-b' : '';

  return (
    <section id={id} className={`py-16 md:py-28 relative ${currentBg} ${borderTop} ${borderBottom} ${className}`}>
      <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}
