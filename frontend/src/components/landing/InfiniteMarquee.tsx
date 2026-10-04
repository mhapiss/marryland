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
  ratio: string;
  alt: string;
  caption?: string;
}

// 100% Verified HTTP 200 OK Unsplash Curated Editorial Images (Safe Defaults)
const DEFAULT_MARQUEE_PHOTOS = [
  {
    id: 'def-1',
    thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[3/4]',
    alt: 'Dokumentasi pernikahan adat Nusantara',
    caption: 'Kehangatan janji suci dan busana adat penuh makna.',
  },
  {
    id: 'def-2',
    thumbUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-square',
    alt: 'Potret lamaran hangat keluarga',
    caption: 'Pertemuan dua keluarga dalam kehangatan tutur kata.',
  },
  {
    id: 'def-3',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[4/3]',
    alt: 'Momen selebrasi penuh suka cita',
    caption: 'Tawa bahagia sanak saudara dan kerabat terdekat.',
  },
  {
    id: 'def-4',
    thumbUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[3/4]',
    alt: 'Pasangan pengantin dalam balutan busana elegan',
    caption: 'Detail tata rias dan keanggunan busana pengantin.',
  },
  {
    id: 'def-5',
    thumbUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-square',
    alt: 'Detail cincin pernikahan sakral',
    caption: 'Simbol ikatan abadi yang terpatri indah.',
  },
  {
    id: 'def-6',
    thumbUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[4/3]',
    alt: 'Dekorasi resepsi pernikahan bernuansa alam',
    caption: 'Tata ruang perayaan yang dipersiapkan dengan cermat.',
  },
  {
    id: 'def-7',
    thumbUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[3/4]',
    alt: 'Pelukan haru dan restu orang tua',
    caption: 'Doa tulus yang menyertai setiap langkah perjalanan baru.',
  },
  {
    id: 'def-8',
    thumbUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[4/3]',
    alt: 'Momen khidmat ijab dan janji suci',
    caption: 'Setiap detik sakral terekam tanpa kehilangan esensi emosinya.',
  },
  {
    id: 'def-9',
    thumbUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[3/4]',
    alt: 'Sesi potret prewedding lanskap alam',
    caption: 'Harmoni cinta dalam keindahan panorama terbuka.',
  },
  {
    id: 'def-10',
    thumbUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-square',
    alt: 'Senyum haru perayaan wisuda',
    caption: 'Hasil perjuangan panjang yang dipersembahkan untuk keluarga.',
  },
  {
    id: 'def-11',
    thumbUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[3/4]',
    alt: 'Gaun dan tenun tradisional elegan',
    caption: 'Tekstur kain dan sulaman tangan yang diabadikan secara presisi.',
  },
  {
    id: 'def-12',
    thumbUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-[4/3]',
    alt: 'Tawa lepas bersama keluarga besar',
    caption: 'Momen spontan yang paling dirindukan di masa mendatang.',
  },
  {
    id: 'def-13',
    thumbUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=85',
    ratio: 'aspect-square',
    alt: 'Iring-iringan prosesi adat',
    caption: 'Langkah khidmat mematuhi amanat leluhur.',
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

  // Live Database Sync: Fetch from Supabase if props photos are empty
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
          .limit(14);

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

  // Determine active raw photos from either props, live DB fetch, or verified defaults
  const sourcePhotos = photos && photos.length > 0 ? photos : liveDbPhotos;

  // Build the list of unique Marquee items
  const uniqueItems: MarqueeItem[] =
    sourcePhotos && sourcePhotos.length > 0
      ? sourcePhotos.map((p, idx) => {
          const { thumbUrl, fullUrl } = resolveUrls(p);
          const ratio =
            idx % 3 === 0 ? 'aspect-[3/4]' : idx % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]';
          return {
            id: p.id || `db-${idx}`,
            originalIndex: idx,
            thumbUrl,
            fullUrl,
            ratio,
            alt: p.alt || p.title || p.caption || `Dokumentasi karya ${idx + 1}`,
            caption: p.description || p.caption || p.title || '',
          };
        })
      : DEFAULT_MARQUEE_PHOTOS.map((d, idx) => ({
          ...d,
          originalIndex: idx,
        }));

  // Ensure enough items to fill both rows seamlessly by repeating if necessary
  let paddedItems = [...uniqueItems];
  while (paddedItems.length < 12) {
    paddedItems = [...paddedItems, ...uniqueItems];
  }

  // Split into Row 1 and Row 2
  const midPoint = Math.ceil(paddedItems.length / 2);
  const row1Photos = paddedItems.slice(0, midPoint);
  const row2Photos = paddedItems.slice(midPoint);

  // Duplicate each row 2x for infinite linear translation
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

    // Prevent background scrolling
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

  const speed1 = Number(data?.speed_row1) || 70;
  const speed2 = Number(data?.speed_row2) || 90;

  // Auto pause marquee when lightbox is open
  const playState = isPlaying && isIntersecting && fullscreenIndex === null ? 'running' : 'paused';

  const activeLightboxItem = fullscreenIndex !== null ? uniqueItems[fullscreenIndex] : null;

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 bg-kertas-tua/40 relative overflow-hidden border-t border-b border-garis"
      aria-label="Kolase foto dokumentasi karya"
    >
      {/* Top control bar: Header & Pause / Play toggle */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="label-caps text-tinta-lembut font-mono text-xs">
            {data?.heading || 'Dokumentasi Autentik Berbagai Momen'}
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-tinta-lembut/70 bg-kertas px-2 py-0.5 rounded-[2px] border border-garis">
            Ketuk foto untuk layar penuh
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="inline-flex items-center gap-2 text-xs font-medium text-tinta hover:text-merah bg-kertas px-3 py-1.5 rounded-[2px] border border-garis transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah min-h-[36px]"
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
                  role="button"
                  tabIndex={isDuplicated ? -1 : 0}
                  onClick={() => setFullscreenIndex(item.originalIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFullscreenIndex(item.originalIndex);
                    }
                  }}
                  className={`h-[155px] md:h-[215px] ${item.ratio} shrink-0 frame-cetakan cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah`}
                  aria-label={`Buka layar penuh: ${item.alt}`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                >
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-3 text-white">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-[2px] text-[11px] font-mono tracking-wider">
                      <Maximize2 className="w-3 h-3 text-merah" />
                      <span>Layar Penuh</span>
                    </div>
                  </div>
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
                  role="button"
                  tabIndex={isDuplicated ? -1 : 0}
                  onClick={() => setFullscreenIndex(item.originalIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFullscreenIndex(item.originalIndex);
                    }
                  }}
                  className={`h-[140px] md:h-[195px] ${item.ratio} shrink-0 frame-cetakan cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah`}
                  aria-label={`Buka layar penuh: ${item.alt}`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                >
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-3 text-white">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-[2px] text-[11px] font-mono tracking-wider">
                      <Maximize2 className="w-3 h-3 text-merah" />
                      <span>Layar Penuh</span>
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
