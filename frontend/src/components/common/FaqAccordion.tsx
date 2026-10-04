// src/components/common/FaqAccordion.tsx
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
  group?: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function FaqAccordion({
  items,
  allowMultiple = false,
  className = '',
}: FaqAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggle = (idx: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(idx) ? [] : [idx]));
    }
  };

  return (
    <div className={`border-double-t border-double-b divide-y divide-garis ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        const itemNumber = `№ ${String(index + 1).padStart(2, '0')}`;
        const contentId = `faq-answer-${index}`;
        const headerId = `faq-header-${index}`;

        return (
          <div key={index} className="py-5 md:py-6 transition-colors">
            <button
              id={headerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggle(index)}
              className="w-full text-left flex items-start justify-between gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <span className="font-mono text-xs text-merah font-semibold pt-1 shrink-0">
                  {itemNumber}
                </span>
                <span className="font-serif text-lg md:text-xl text-tinta group-hover:text-merah transition-colors">
                  {item.question}
                </span>
              </div>
              <span className="mt-1 p-1 text-tinta-lembut group-hover:text-merah transition-colors shrink-0">
                {isOpen ? (
                  <Minus className="w-5 h-5 stroke-[1.5]" />
                ) : (
                  <Plus className="w-5 h-5 stroke-[1.5]" />
                )}
              </span>
            </button>

            {isOpen && (
              <div
                id={contentId}
                role="region"
                aria-labelledby={headerId}
                className="mt-3 pl-8 md:pl-12 pr-4 md:pr-10 text-tinta-lembut font-body text-base leading-relaxed"
              >
                <p className="whitespace-pre-line">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
