import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
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
  title?: string;
  subtitle?: string;
  tag?: string;
  alt: string;
  caption?: string;
}

// Koleksi Foto Kurasi Sinematik Default (Potret Vertikal Presisi Estetik - Mirip Poster Film)
const DEFAULT_MARQUEE_PHOTOS: Omit<MarqueeItem, 'originalIndex'>[] = [
  {
    id: 'def-1',
    thumbUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=85',
    title: "TODAY'S CHAPTER",
    subtitle: 'A FILM BY MARRYLAND',
    tag: 'Wisuda',
    alt: 'Dokumentasi wisuda dengan buket bunga dan toga',
    caption: 'Langkah awal menggapai asa dan kebanggaan keluarga.',
  },
  {
    id: 'def-2',
    thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    title: 'JAVANESE TRADITIONS',
    subtitle: 'WARISAN LELUHUR',
    tag: 'Tradisi',
    alt: 'Dokumentasi tradisi pengantin Jawa beludru merah',
    caption: 'Keanggunan busana beludru dan keluhuran filosofi adat.',
  },
  {
    id: 'def-3',
    thumbUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85',
    title: 'THE PROMISE',
    subtitle: 'IKATAN DUA JIWA',
    tag: 'Janji Suci',
    alt: 'Potret cincin lamaran dan buket bunga pastel',
    caption: 'Tanda ikatan abadi yang terpatri di hadapan keluarga.',
  },
  {
    id: 'def-4',
    thumbUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    title: 'BARALEK GADANG',
    subtitle: 'KILAU SUNTIANG',
    tag: 'Adat Minang',
    alt: 'Mahkota suntiang emas megah pernikahan Minang',
    caption: 'Semarak kemegahan tradisi Ranah Minang.',
  },
  {
    id: 'def-5',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    title: 'NEW HORIZONS',
    subtitle: 'SELEBRASI DEDIKASI',
    tag: 'Wisuda',
    alt: 'Selebrasi kelulusan wisudawati arsitektur',
    caption: 'Perayaan perjuangan dan pencapaian bermakna.',
  },
  {
    id: 'def-6',
    thumbUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
    title: 'LEMBARAN KASIH',
    subtitle: 'HALUSNYA ADAT',
    tag: 'Adat Melayu',
    alt: 'Busana tenun songket adat Melayu',
    caption: 'Sentuhan anggun adat Melayu dalam bingkai tenang.',
  },
  {
    id: 'def-7',
    thumbUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=85',
    title: 'DOA & RESTU',
    subtitle: 'MOMEN HARU',
    tag: 'Keluarga',
    alt: 'Pelukan haru dan restu orang tua',
    caption: 'Pelukan tulus yang menyertai setiap langkah baru.',
  },
  {
    id: 'def-8',
    thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85',
    title: 'ETERNAL BOND',
    subtitle: 'HARI BAHAGIA',
    tag: 'Resepsi',
    alt: 'Potret pengantin di pelaminan bahagia',
    caption: 'Setiap tatap penuh rasa dan kebahagiaan murni.',
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

  // Handle local path stored in Supabase buckets
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
  const [isPlaying] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [liveDbPhotos, setLiveDbPhotos] = useState<any[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Live Database Sync: Ambil HANYA foto khusus dengan slot = 'marquee' dari home_photos
  // PENTING: DILARANG fallback ke portfolio_photos agar foto yang baru di-upload fotografer tidak tercampur!
  useEffect(() => {
    let isMounted = true;

    async function syncFromDatabase() {
      if (photos && photos.length > 0) return;

      try {
        const { data: homeMarquee, error: homeErr } = await supabase
          .from('home_photos')
          .select('*')
          .eq('slot', 'marquee')
          .order('position', { ascending: true });

        if (!homeErr && homeMarquee && homeMarquee.length > 0) {
          if (isMounted) setLiveDbPhotos(homeMarquee);
        }
      } catch (err) {
        console.warn('Marquee live sync error:', err);
      }
    }

    syncFromDatabase();

    return () => {
      isMounted = false;
    };
  }, [photos]);

  // Tentukan foto aktif: Props -> live DB home_photos(slot='marquee') -> Curated Fallbacks
  const sourcePhotos = photos && photos.length > 0 ? photos : liveDbPhotos;

  // Bangun daftar item Marquee
  const uniqueItems: MarqueeItem[] =
    sourcePhotos && sourcePhotos.length > 0
      ? sourcePhotos.map((p, idx) => {
          const { thumbUrl, fullUrl } = resolveUrls(p);
          return {
            id: p.id || `uploaded-${idx}`,
            originalIndex: idx,
            thumbUrl,
            fullUrl,
            title: p.title || '',
            subtitle: p.subtitle || 'A FILM BY MARRYLAND',
            tag: p.alt || p.category || 'Momen Pilihan',
            alt: p.alt || p.title || p.caption || `Dokumentasi karya ${idx + 1}`,
            caption: p.description || p.caption || '',
          };
        })
      : DEFAULT_MARQUEE_PHOTOS.map((d, idx) => ({
          ...d,
          originalIndex: idx,
        }));

  // Buat loop array yang cukup panjang agar transisi marquee mulus tanpa jeda (minimum 12 item)
  let loopItems = [...uniqueItems];
  while (loopItems.length < 12) {
    loopItems = [...loopItems, ...uniqueItems];
  }

  // Gandakan array 2x untuk infinite keyframe translate CSS
  const duplicatedStream = [...loopItems, ...loopItems];

  // Pause ketika komponen tidak tampak di layar
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

  // Keyboard navigation untuk Fullscreen Lightbox
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

  // Kecepatan gulir yang tenang, santai, dan estetik (~4.5s per kartu)
  const baseSpeed = Number(data?.speed_row1) || Math.max(50, Math.round(loopItems.length * 4.8));

  // Pause marquee saat lightbox terbuka atau tab tidak aktif
  const playState = isPlaying && isIntersecting && fullscreenIndex === null ? 'running' : 'paused';

  const activeLightboxItem = fullscreenIndex !== null ? uniqueItems[fullscreenIndex] : null;

  return (
    <section
      ref={sectionRef}
      className="py-14 sm:py-20 md:py-24 bg-[#13110E] text-[#F5EFEB] relative overflow-hidden border-y border-[#26211C]"
      aria-label="Pita sorotan dokumentasi sinematik berputar"
    >
      {/* Editorial Header Section (Menyatu dalam tema gelap bioskop) */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-amber-400 uppercase bg-amber-400/10 border border-amber-400/25 px-3.5 py-1 rounded-full mb-3.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>PITA SOROTAN • EDISI PILIHAN</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F6F1EA] font-normal tracking-wide mb-2.5">
          {data?.heading || 'Cerita Murni yang Terekam Abadi'}
        </h2>
        <p className="text-xs sm:text-sm text-[#A59B8E] font-body max-w-lg mx-auto leading-relaxed">
          Koleksi visual otentik pilihan yang mengabadikan jiwa tradisi, kelulusan, dan ikatan janji suci tanpa henti.
        </p>
      </div>

      {/* Gradien Pudar Halus di Tepi Kiri & Kanan (Seamless Edge Masking) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 md:w-40 bg-gradient-to-r from-[#13110E] via-[#13110E]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 md:w-40 bg-gradient-to-l from-[#13110E] via-[#13110E]/80 to-transparent z-10" />

      {/* Track Infinity Scroll Marquee */}
      <div className="w-full">
        <div className="overflow-hidden w-full flex">
          <div
            className="marquee-track-left gap-4 sm:gap-6 py-4"
            style={{
              animationDuration: `${baseSpeed}s`,
              animationPlayState: playState,
            }}
          >
            {duplicatedStream.map((item, index) => {
              const isDuplicated = index >= loopItems.length;
              return (
                <div
                  key={`reel-${item.id}-${index}`}
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
                    Kartu Potret Sinematik (Estetik Sesuai Gambar 2):
                    - Rasio Potret Vertikal Tinggi (aspect-[10/14])
                    - Sudut Membulat Halus (rounded-2xl)
                    - Tanpa Border Putih Kaku (Borderless Edge-to-Edge)
                    - Bayangan Gelap Dalam (shadow-2xl shadow-black/80)
                  */
                  className="w-[230px] sm:w-[260px] md:w-[290px] lg:w-[310px] aspect-[10/14] shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer shadow-2xl shadow-black/80 transition-transform duration-500 hover:scale-[1.03] select-none bg-[#1C1816]"
                  aria-label={`Buka layar penuh: ${item.alt}`}
                  aria-hidden={isDuplicated ? 'true' : undefined}
                >
                  {/* Foto Utama Edge-to-Edge */}
                  <img
                    src={item.thumbUrl}
                    alt={isDuplicated ? '' : item.alt}
                    className="w-full h-full object-cover object-top select-none transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_BACKUP_IMG;
                    }}
                  />

                  {/* Overlay Gradien Sinematik Bawah */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-300" />

                  {/* Poster Tipografi Atas (Mirip "TODAY'S CHAPTER" di Gambar 2) */}
                  {item.title && (
                    <div className="absolute top-5 inset-x-3 text-center pointer-events-none drop-shadow-md">
                      <span className="text-[9px] tracking-[0.28em] font-mono uppercase text-red-500 font-semibold block mb-0.5">
                        {item.subtitle || 'A FILM BY MARRYLAND'}
                      </span>
                      <h3 className="font-sans font-black tracking-tight text-xl sm:text-2xl text-red-600 drop-shadow-md uppercase leading-none">
                        {item.title}
                      </h3>
                    </div>
                  )}

                  {/* Tipografi Bawah (Kategori & Sub-judul ala Film Poster) */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
                    <div>
                      {item.tag && (
                        <span className="font-sans font-bold text-xs sm:text-sm text-white tracking-wide block drop-shadow-md">
                          {item.tag}
                        </span>
                      )}
                      {item.caption && (
                        <p className="text-[10px] text-white/75 font-mono tracking-tight line-clamp-1 mt-0.5 max-w-[180px]">
                          {item.caption}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-white/60 tracking-wider uppercase font-semibold">
                      CINEMA ABSOLUTE
                    </span>
                  </div>

                  {/* Micro Icon Buka Layar Penuh Saat Hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full inline-flex items-center justify-center text-white/90">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
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
            <div className="max-h-[75vh] md:max-h-[80vh] max-w-full flex items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black/40">
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
                {activeLightboxItem.title ? `${activeLightboxItem.title} • ${activeLightboxItem.alt}` : activeLightboxItem.alt}
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
