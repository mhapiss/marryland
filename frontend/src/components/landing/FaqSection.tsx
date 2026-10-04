import React from 'react';
import { Link } from 'react-router-dom';
import { Section } from './Section';
import { ArrowRight } from 'lucide-react';
import { FaqAccordion } from '../common/FaqAccordion';

interface FaqSectionProps {
  data?: any;
}

export function FaqSection({ data }: FaqSectionProps) {
  const heading = data?.heading || 'Pertanyaan yang Sering Diajukan';
  const allItems = data?.items || [];
  const displayItems = allItems.slice(0, 5);

  return (
    <Section id="faq" bg="kertas-tua" doubleBorderTop doubleBorderBottom belowFold>
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-merah font-semibold">№ 07</span>
            <span className="w-4 h-[1px] bg-garis" />
            <span className="label-caps text-tinta-lembut">PUSAT INFORMASI</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
            {heading}
          </h2>
        </div>

        {/* Accessible Accordion List with Double Borders */}
        <FaqAccordion items={displayItems} className="mb-10" />

        <div>
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-bold text-tinta hover:text-merah link-vintage transition-all group min-h-[44px]"
          >
            <span>Buka Seluruh Pertanyaan &amp; Jawaban</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
