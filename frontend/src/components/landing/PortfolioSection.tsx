// src/components/landing/PortfolioSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Section } from './Section';
import { ArrowUpRight } from 'lucide-react';
import { usePortfolioCollections } from '../../hooks/usePortfolioData';

interface PortfolioSectionProps {
  data?: any;
}

export function PortfolioSection({ data }: PortfolioSectionProps) {
  const heading = data?.heading || 'Koleksi Portofolio';
  const subheading =
    data?.subheading ||
    'Dokumentasi visual pernikahan adat dan perhelatan budaya dengan kurasi standar editorial tinggi.';
  const ctaText = data?.cta_text || 'Lihat Semua Koleksi';

  const { collections } = usePortfolioCollections();

  // Use collections from hook or fallback to data.categories
  const displayItems = (collections && collections.length > 0
    ? collections
    : data?.categories || []
  ).slice(0, 4);

  return (
    <Section id="portofolio" bg="kertas" belowFold>
      {/* Header: Left title, Right link */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 md:mb-16 pb-6 border-b border-garis">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-merah font-semibold">№ 08</span>
            <span className="w-4 h-[1px] bg-garis" />
            <span className="label-caps text-tinta-lembut">
              GALERI ADAT &amp; PERHELATAN
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
            {heading}
          </h2>
          <p className="font-body text-base text-tinta-lembut mt-3 max-w-xl">
            {subheading}
          </p>
        </div>

        <Link
          to="/portofolio"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-bold text-tinta hover:text-merah link-vintage transition-all shrink-0 min-h-[44px]"
        >
          <span>{ctaText}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Staggered magazine cards: 0, 48px, 0 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {displayItems.map((cat: any, idx: number) => {
          const staggerClass = idx === 1 ? 'md:translate-y-12' : '';
          const coverPhoto =
            cat.cover_url ||
            (cat.content as any)?.cover_url ||
            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';

          return (
            <Link
              key={cat.slug || idx}
              to={`/portofolio/${cat.slug}`}
              className={`group flex flex-col frame-cetakan transition-all duration-300 ${staggerClass}`}
            >
              {/* Cover Photo 3:4 */}
              <div className="aspect-[3/4] w-full relative overflow-hidden bg-kertas-tua border border-garis">
                <img
                  src={coverPhoto}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Card Meta */}
              <div className="pt-5 pb-2 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-2xl font-normal text-tinta group-hover:text-merah transition-colors">
                      Adat {cat.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-tinta-lembut group-hover:text-merah transition-colors" />
                  </div>
                  <p className="font-body text-sm text-tinta-lembut line-clamp-2 leading-relaxed">
                    {cat.short_description || cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-garis flex items-center justify-between text-xs text-tinta-lembut font-mono">
                  <span>KOLEKSI 0{idx + 1}</span>
                  <span className="text-merah font-semibold group-hover:underline">Buka Koleksi &rarr;</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
