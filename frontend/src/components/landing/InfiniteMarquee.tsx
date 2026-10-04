import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { HomePhoto } from '../ResponsiveImage';

interface InfiniteMarqueeProps {
  photos?: HomePhoto[];
  data?: any;
}

// Curated sample photos with proper ratios (3:4, 1:1, 4:3) for realistic editorial look
const DEFAULT_MARQUEE_PHOTOS_ROW1 = [
  { id: 'm1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[3/4]', alt: 'Pernikahan adat Indonesia' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-square', alt: 'Potret lamaran hangat' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[4/3]', alt: 'Momen bahagia wisuda' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[3/4]', alt: 'Pasangan pengantin bahagia' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-square', alt: 'Detail cincin pernikahan' },
  { id: 'm6', url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[4/3]', alt: 'Dekorasi resepsi pernikahan' },
  { id: 'm7', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[3/4]', alt: 'Pelukan hangat orang tua' },
];

const DEFAULT_MARQUEE_PHOTOS_ROW2 = [
  { id: 'm8', url: 'https://images.unsplash.com/photo-1519225438848-75cbe0da4034?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[4/3]', alt: 'Pemberian buket bunga wisuda' },
  { id: 'm9', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[3/4]', alt: 'Sesi foto prewedding alam' },
  { id: 'm10', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-square', alt: 'Senyum haru wisudawan' },
  { id: 'm11', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[3/4]', alt: 'Gaun pernikahan elegan' },
  { id: 'm12', url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-[4/3]', alt: 'Tawa ceria bersama keluarga' },
  { id: 'm13', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=480&q=80', ratio: 'aspect-square', alt: 'Momen akad nikah khidmat' },
];

export function InfiniteMarquee({ photos = [], data }: InfiniteMarqueeProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Distribute custom admin photos if provided, otherwise use curated defaults
  const customPhotos = photos && photos.length >= 6 ? photos : [];
  
  const row1Photos = customPhotos.length >= 6 
    ? customPhotos.slice(0, Math.ceil(customPhotos.length / 2)).map((p, idx) => ({
        id: p.id,
        url: p.path.startsWith('http') ? p.path : `${p.path}_480.webp`,
        ratio: idx % 3 === 0 ? 'aspect-[3/4]' : idx % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]',
        alt: p.alt || 'Dokumentasi karya'
      }))
    : DEFAULT_MARQUEE_PHOTOS_ROW1;

  const row2Photos = customPhotos.length >= 6
    ? customPhotos.slice(Math.ceil(customPhotos.length / 2)).map((p, idx) => ({
        id: p.id,
        url: p.path.startsWith('http') ? p.path : `${p.path}_480.webp`,
        ratio: idx % 3 === 0 ? 'aspect-[4/3]' : idx % 3 === 1 ? 'aspect-[3/4]' : 'aspect-square',
        alt: p.alt || 'Dokumentasi karya'
      }))
    : DEFAULT_MARQUEE_PHOTOS_ROW2;

  // Duplicate items 2x to guarantee seamless full-viewport infinite translation
  const duplicatedRow1 = [...row1Photos, ...row1Photos];
  const duplicatedRow2 = [...row2Photos, ...row2Photos];

  // Pause when offscreen using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const speed1 = Number(data?.speed_row1) || 70;
  const speed2 = Number(data?.speed_row2) || 90;

  const playState = isPlaying && isIntersecting ? 'running' : 'paused';

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 bg-kertas-tua/40 relative overflow-hidden border-t border-b border-garis"
      aria-label="Kolase foto dokumentasi karya"
    >
      {/* Top control bar: WCAG Accessible Pause / Play toggle */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 mb-6 flex justify-between items-center">
        <span className="label-caps text-tinta-lembut">
          {data?.heading || 'Dokumentasi Autentik Berbagai Momen'}
        </span>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="inline-flex items-center gap-2 text-xs font-medium text-tinta hover:text-merah bg-kertas px-3 py-1.5 rounded-sm border border-garis transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah min-h-[36px]"
          aria-label={isPlaying ? 'Jeda animasi kolase foto' : 'Putar animasi kolase foto'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-merah" />
              <span>Jeda Animasi</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-merah" />
              <span>Putar Animasi</span>
            </>
          )}
        </button>
      </div>

      {/* Marquee Container with edge fading mask */}
      <div className="marquee-mask w-full space-y-5">
        
        {/* Row 1: Speed ~70s moving to RIGHT */}
        <div className="overflow-hidden w-full flex">
          <div
            className="marquee-track-right gap-4 md:gap-6"
            style={{
              animationDuration: `${speed1}s`,
              animationPlayState: playState,
            }}
          >
            {duplicatedRow1.map((item, index) => {
              const isDuplicated = index >= row1Photos.length;
              return (
                <div
                  key={`r1-${item.id}-${index}`}
                  className={`h-[155px] md:h-[215px] ${item.ratio} shrink-0 frame-cetakan`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                  tabIndex={isDuplicated ? -1 : undefined}
                >
                  <img
                    src={item.url}
                    alt={isDuplicated ? '' : item.alt}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2: Speed ~90s moving to RIGHT (different rhythm) */}
        <div className="overflow-hidden w-full flex">
          <div
            className="marquee-track-right gap-4 md:gap-6"
            style={{
              animationDuration: `${speed2}s`,
              animationPlayState: playState,
            }}
          >
            {duplicatedRow2.map((item, index) => {
              const isDuplicated = index >= row2Photos.length;
              return (
                <div
                  key={`r2-${item.id}-${index}`}
                  className={`h-[140px] md:h-[195px] ${item.ratio} shrink-0 frame-cetakan`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                  tabIndex={isDuplicated ? -1 : undefined}
                >
                  <img
                    src={item.url}
                    alt={isDuplicated ? '' : item.alt}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
