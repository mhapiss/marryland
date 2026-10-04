import React from 'react';
import { Link } from 'react-router-dom';
import { HomePhoto, ResponsiveImage } from '../ResponsiveImage';
import { ArrowUpRight } from 'lucide-react';

interface FeaturedSectionProps {
  photos?: HomePhoto[];
  data?: any;
}

const DEFAULT_FEATURED_PHOTOS = [
  { id: 'f1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', alt: 'Pernikahan bahagia' },
  { id: 'f2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', alt: 'Lamaran romantis' },
  { id: 'f3', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80', alt: 'Sorotan utama pernikahan' }, // Center photo
  { id: 'f4', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', alt: 'Wisuda sarjana' },
  { id: 'f5', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80', alt: 'Pasangan elegan' },
];

export function FeaturedSection({ photos = [], data }: FeaturedSectionProps) {
  const heading = data?.heading || 'Cerita Terpilih';
  const subheading =
    data?.subheading || 'Rangkaian momen berharga yang terabadikan secara autentik dan bermakna.';
  const ctaText = data?.cta_text || 'Lihat Portofolio Lengkap';

  const displayPhotos = photos && photos.length >= 3 ? photos : null;

  return (
    <section className="py-24 md:py-32 bg-marun text-kertas overflow-hidden border-t border-marun">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 mb-14 md:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-kertas/60 font-semibold">№ 04</span>
            <span className="w-4 h-[1px] bg-kertas/20" />
            <span className="label-caps text-kertas/60">
              SOROTAN KARYA
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-kertas font-normal tracking-tight">
            {heading}
          </h2>
          <p className="font-body text-base text-kertas/75 mt-3 max-w-xl">
            {subheading}
          </p>
        </div>

        <Link
          to="/portofolio"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-bold text-kertas hover:text-kertas/80 link-vintage transition-all shrink-0 min-h-[44px]"
        >
          <span>{ctaText}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Horizontal Snap Scroll with center photo largest */}
      <div className="flex gap-5 md:gap-8 px-6 md:px-[max(48px,calc((100vw-1200px)/2))] overflow-x-auto snap-x snap-mandatory pb-8 pt-2 hide-scrollbar items-center">
        {displayPhotos
          ? displayPhotos.map((photo, i) => {
              const isCenter = i === Math.floor(displayPhotos.length / 2);
              return (
                <div
                  key={photo.id || i}
                  className={`shrink-0 snap-center frame-cetakan transition-all duration-500 ${
                    isCenter
                      ? 'w-[75vw] sm:w-[50vw] md:w-[35vw] aspect-[3/4]'
                      : 'w-[55vw] sm:w-[35vw] md:w-[25vw] aspect-[4/5] opacity-90'
                  }`}
                >
                  <ResponsiveImage
                    photo={photo}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })
          : DEFAULT_FEATURED_PHOTOS.map((item, i) => {
              const isCenter = i === 2;
              return (
                <div
                  key={item.id}
                  className={`shrink-0 snap-center frame-cetakan transition-all duration-500 ${
                    isCenter
                      ? 'w-[75vw] sm:w-[50vw] md:w-[35vw] aspect-[3/4]'
                      : 'w-[55vw] sm:w-[35vw] md:w-[25vw] aspect-[4/5] opacity-90'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
      </div>
    </section>
  );
}
