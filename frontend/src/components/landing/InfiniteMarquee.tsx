import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { HomePhoto } from '../ResponsiveImage';

interface InfiniteMarqueeProps {
  photos?: HomePhoto[] | any[];
  data?: any;
}

interface MarqueeItem {
  id: string;
  originalIndex: number;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  caption?: string;
}

// 100% Verified HTTP 200 OK Curated Editorial Fallback Photos (Bentuk Petak Square)
const DEFAULT_MARQUEE_PHOTOS = [
  {
    id: 'def-1',
    thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    alt: 'Dokumentasi pernikahan adat Nusantara',
    caption: 'Kehangatan janji suci dan busana adat penuh makna.',
  },
  {
    id: 'def-2',
    thumbUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    alt: 'Potret lamaran hangat keluarga',
    caption: 'Pertemuan dua keluarga dalam kehangatan tutur kata.',
  },
  {
    id: 'def-3',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    alt: 'Momen selebrasi penuh suka cita',
    caption: 'Tawa bahagia sanak saudara dan kerabat terdekat.',
  },
  {
    id: 'def-4',
    thumbUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
    alt: 'Pasangan pengantin dalam balutan busana elegan',
    caption: 'Detail tata rias dan keanggunan busana pengantin.',
  },
  {
    id: 'def-5',
    thumbUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85',
    alt: 'Detail cincin pernikahan sakral',
    caption: 'Simbol ikatan abadi yang terpatri indah.',
  },
  {
    id: 'def-6',
    thumbUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    alt: 'Dekorasi resepsi bernuansa alam',
    caption: 'Tata ruang perayaan yang dipersiapkan dengan cermat.',
  },
  {
    id: 'def-7',
    thumbUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=85',
    alt: 'Pelukan haru dan restu orang tua',
    caption: 'Doa tulus yang menyertai setiap langkah perjalanan baru.',
  },
  {
    id: 'def-8',
    thumbUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&h=700&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=85',
    alt: 'Momen khidmat ijab dan janji suci',
    caption: 'Setiap detik sakral terekam tanpa kehilangan esensi emosinya.',
  },
];

const FALLBACK_BACKUP_IMG = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';

// Helper to resolve Supabase Storage paths or external URLs
function resolveUrls(p: any): { thumbUrl: string; fullUrl: string } {
  if (!p) return { thumbUrl: FALLBACK_BACKUP_IMG, fullUrl: FALLBACK_BACKUP_IMG };

  const rawPath = p.url || p.image_url || p.path || p.base_path || '';
  if (!rawPath) return { thumbUrl: FALLBACK_BACKUP_IMG, fullUrl: FALLBACK_BACKUP_IMG };

  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return {
      thumbUrl: rawPath,
      fullUrl: rawPath,
    };
  }

  // Handle local path stored in Supabase buckets (e.g. "media/uuid_1600.webp" or "uuid_1600.webp")
  const clean = rawPath.replace(/^\/+/, '');
  const homePublic = supabase.storage.from('home-media').getPublicUrl(clean).data.publicUrl;
  const mediaPublic = supabase.storage.from('media-library').getPublicUrl(clean).data.publicUrl;
  const portfolioPublic = supabase.storage.from('portfolio').getPublicUrl(clean).data.publicUrl;

  const url = homePublic || mediaPublic || portfolioPublic || clean;
  return {
    thumbUrl: url,
    fullUrl: url,
  };
}

export function InfiniteMarquee({ photos = [], data }: InfiniteMarqueeProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [liveDbPhotos, setLiveDbPhotos] = useState<any[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Live Database Sync: Fetch uploaded photos from Supabase if props are empty
  useEffect(() => {
    let isMounted = true;

    async function syncFromDatabase() {
      if (photos && photos.length > 0) return;

      try {
        // 1. Check home_photos where slot = 'marquee'
        const { data: homeMarquee, error: homeErr } = await supabase
          .from('home_photos')
          .select('*')
          .eq('slot', 'marquee')
          .order('position', { ascending: true });

        if (!homeErr && homeMarquee && homeMarquee.length > 0) {
          if (isMounted) setLiveDbPhotos(homeMarquee);
          return;
        }

        // 2. If home_photos has no marquee, fallback to published portfolio_photos
        const { data: portfolioPics, error: portErr } = await supabase
          .from('portfolio_photos')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true })
          .limit(20);

        if (!portErr && portfolioPics && portfolioPics.length > 0) {
          if (isMounted) setLiveDbPhotos(portfolioPics);
        }
      } catch (err) {
        console.warn('Marquee live sync fallback:', err);
      }
    }

    syncFromDatabase();

    return () => {
      isMounted = false;
    };
  }, [photos]);

  // Determine active photos from either props, live DB fetch, or curated defaults
  const sourcePhotos = photos && photos.length > 0 ? photos : liveDbPhotos;

  // Build the list of unique Marquee items (semua foto yang di-upload)
  const uniqueItems: MarqueeItem[] =
    sourcePhotos && sourcePhotos.length > 0
      ? sourcePhotos.map((p, idx) => {
          const { thumbUrl, fullUrl } = resolveUrls(p);
          return {
            id: p.id || `uploaded-${idx}`,
            originalIndex: idx,
            thumbUrl,
            fullUrl,
            alt: p.alt || p.title || p.caption || `Dokumentasi karya ${idx + 1}`,
            caption: p.description || p.caption || p.title || '',
          };
        })
      : DEFAULT_MARQUEE_PHOTOS.map((d, idx) => ({
          ...d,
          originalIndex: idx,
        }));

  // Ensure enough items to create a continuous seamless loop (minimum 12 items for smooth transition)
  let loopItems = [...uniqueItems];
  while (loopItems.length < 12) {
    loopItems = [...loopItems, ...uniqueItems];
  }

  // Duplicate the array 2x for CSS infinite keyframe translate
  const duplicatedStream = [...loopItems, ...loopItems];

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

  // Keyboard navigation & lock body scroll for Lightbox
  const handlePrev = useCallback(() => {
    setFullscreenIndex((prev) =>
      prev === null ? null : prev === 0 ? uniqueItems.length - 1 : prev - 1
    );
  }, [uniqueItems.length]);

  const handleNext = useCallback(() => {
    setFullscreenIndex((prev) =>
      prev === null ? null : (prev + 1) % uniqueItems.length
    );
  }, [uniqueItems.length]);

  const handleClose = useCallback(() => {
    setFullscreenIndex(null);
  }, []);

  useEffect(() => {
    if (fullscreenIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreenIndex, handleClose, handlePrev, handleNext]);

  // Dynamic speed based on number of items (smooth steady pace ~4-5 seconds per card)
  const baseSpeed = Number(data?.speed_row1) || Math.max(35, Math.round(loopItems.length * 4.5));

  // Pause marquee when lightbox is open or user explicitly paused
  const playState = isPlaying && isIntersecting && fullscreenIndex === null ? 'running' : 'paused';

  const activeLightboxItem = fullscreenIndex !== null ? uniqueItems[fullscreenIndex] : null;

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 bg-kertas-tua/40 relative overflow-hidden border-t border-b border-garis"
      aria-label="Galeri foto petak karya berputar"
    >
      {/* Top control bar: Label, Info & Pause/Play toggle */}
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="label-caps text-tinta-lembut font-mono text-xs">
            {data?.heading || 'Dokumentasi Autentik Berbagai Momen'}
          </span>
          <span className="text-[11px] font-mono text-tinta-lembut/80 bg-kertas px-2.5 py-0.5 rounded-[2px] border border-garis">
            {uniqueItems.length} foto karya • Ketuk untuk layar penuh
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="inline-flex items-center gap-2 text-xs font-medium text-tinta hover:text-merah bg-kertas px-3 py-1.5 rounded-[2px] border border-garis transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah min-h-[36px]"
          aria-label={isPlaying ? 'Jeda perputaran foto' : 'Putar kembali perputaran foto'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-merah" />
              <span>Jeda</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-merah" />
              <span>Putar</span>
            </>
          )}
        </button>
      </div>

      {/* Single Continuous Grid Track: Exactly 4 Square ("Petak") Cards in Desktop View */}
      <div className="marquee-mask w-full">
        <div className="overflow-hidden w-full flex">
          <div
            className="marquee-track-left gap-5 md:gap-6 py-2"
            style={{
              animationDuration: `${baseSpeed}s`,
              animationPlayState: playState,
            }}
          >
            {duplicatedStream.map((item, index) => {
              const isDuplicated = index >= loopItems.length;
              return (
                <div
                  key={`petak-${item.id}-${index}`}
                  role="button"
                  tabIndex={isDuplicated ? -1 : 0}
                  onClick={() => setFullscreenIndex(item.originalIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFullscreenIndex(item.originalIndex);
                    }
                  }}
                  /* 
                    Ukuran kartu petak:
                    - Mobile: ~200px - 240px
                    - Tablet: ~260px - 280px
                    - Desktop: ~300px - 320px (Tepat 4 petak tampak di layar pada lebar desktop)
                  */
                  className="w-[210px] sm:w-[250px] md:w-[280px] lg:w-[310px] xl:w-[325px] aspect-square shrink-0 p-2 sm:p-2.5 bg-white border border-garis rounded-[2px] shadow-soft cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated hover:border-merah/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah"
                  aria-label={`Buka layar penuh: ${item.alt}`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                >
                  {/* Foto Petak (Square 1:1) */}
                  <div className="w-full h-full overflow-hidden rounded-[1px] relative bg-kertas-tua/30">
                    <img
                      src={item.thumbUrl}
                      alt={isDuplicated ? '' : item.alt}
                      className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_BACKUP_IMG;
                      }}
                    />

                    {/* Hover Overlay with expand hint */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
                      <div className="self-end">
                        <span className="p-1.5 bg-black/60 backdrop-blur-sm rounded-[2px] inline-flex items-center justify-center text-white">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-serif line-clamp-1 text-white">
                          {item.alt}
                        </p>
                        <span className="text-[10px] font-mono text-white/80 block mt-0.5">
                          Ketuk untuk layar penuh
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL ("Nampakin Full Layar Pas Di-pejet") */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan foto layar penuh"
          onClick={handleClose}
        >
          {/* Top Bar: Brand, Counter, Close Button */}
          <div
            className="flex items-center justify-between text-white w-full max-w-6xl mx-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="font-serif text-lg tracking-tight text-white/90">
                by.<span className="text-merah">marryland</span>
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-[2px] bg-white/10 text-white/80 border border-white/15">
                {String((fullscreenIndex ?? 0) + 1).padStart(2, '0')} / {String(uniqueItems.length).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-[2px] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah"
              aria-label="Tutup tampilan layar penuh (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Area: Photo with Prev & Next Arrows */}
          <div
            className="relative flex-1 flex items-center justify-center my-3 max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-[2px] border border-white/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main Fullscreen Image */}
            <div className="max-h-[75vh] md:max-h-[80vh] max-w-full flex items-center justify-center overflow-hidden rounded-[2px] border border-white/10 shadow-2xl bg-black/40">
              <img
                src={activeLightboxItem.fullUrl || activeLightboxItem.thumbUrl}
                alt={activeLightboxItem.alt}
                className="max-h-[75vh] md:max-h-[80vh] w-auto max-w-full object-contain select-none transition-all duration-300"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_BACKUP_IMG;
                }}
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-[2px] border border-white/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah"
              aria-label="Foto selanjutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Bar: Title / Caption / Keyboard Helper */}
          <div
            className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-white/90 z-10 pt-2 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center sm:text-left">
              <p className="font-serif text-sm sm:text-base text-white">
                {activeLightboxItem.alt}
              </p>
              {activeLightboxItem.caption && (
                <p className="text-xs text-white/70 font-mono mt-0.5">
                  {activeLightboxItem.caption}
                </p>
              )}
            </div>

            <div className="text-[11px] font-mono text-white/50 text-center sm:text-right">
              Gunakan tombol ← / → untuk navigasi • Tekan ESC untuk menutup
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
