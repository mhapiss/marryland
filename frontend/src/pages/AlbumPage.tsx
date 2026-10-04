// src/pages/AlbumPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ImageWithFallback from '../components/ImageWithFallback';
import PhotoViewer from '../components/gallery/PhotoViewer';
import { copyToClipboard } from '../lib/clipboard';
import { toast } from 'sonner';
import {
  Lock,
  Share2,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface AlbumData {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  highlight_description: string | null;
  studio_name: string;
  cover_url: string | null;
  allow_download: boolean;
  expires_at: string | null;
  scope: string;
  photo_count: number;
}

interface PhotoItem {
  id: string;
  gdrive_file_id: string;
  filename: string;
  thumbnail_url: string;
  order_index: number;
  is_missing?: boolean;
}

export default function AlbumPage() {
  const { client_slug } = useParams<{ client_slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  // PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Album state
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch album via secure RPC function
  const fetchAlbum = useCallback(
    async (pin?: string) => {
      if (!client_slug) return;
      setLoading(true);
      setErrorStatus(null);
      setPinError(null);

      try {
        const { data, error } = await supabase.rpc('get_family_album', {
          p_slug: client_slug,
          p_token: token,
          p_pin: pin || null,
        });

        if (error) {
          throw error;
        }

        if (!data || !data.success) {
          setErrorStatus(data?.error || 'UNKNOWN_ERROR');
          setErrorMessage(data?.message || 'Gagal memuat album.');
          if (data?.lock_remaining_seconds) {
            setLockCountdown(data.lock_remaining_seconds);
          }
          if (data?.error === 'PIN_INCORRECT') {
            setPinError(
              `${data.message} ${
                data.remaining_attempts !== undefined
                  ? `(Sisa ${data.remaining_attempts} percobaan)`
                  : ''
              }`
            );
          }
          return;
        }

        // Successfully unlocked!
        setAlbum(data.album);
        setPhotos(data.photos || []);
      } catch (err: any) {
        setErrorStatus('UNKNOWN_ERROR');
        setErrorMessage(err.message || 'Terjadi gangguan saat memuat album.');
      } finally {
        setLoading(false);
      }
    },
    [client_slug, token]
  );

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  // Lock countdown timer
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchAlbum();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockCountdown, fetchAlbum]);

  // Handle PIN Submission
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsSubmittingPin(true);
    await fetchAlbum(pinInput.trim());
    setIsSubmittingPin(false);
  };

  // Keyboard navigation for Lightbox
  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : prev === 0 ? photos.length - 1 : prev - 1
    );
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % photos.length
    );
  }, [photos.length]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, handleCloseLightbox, handlePrev, handleNext]);

  // Web Share or Copy Link
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: album ? `Album Foto Keluarga: ${album.title}` : 'Album Foto Keluarga',
      text: album
        ? `Dokumentasi kenangan ${album.title} oleh ${album.studio_name}`
        : 'Dokumentasi foto kenangan keluarga',
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to copy link
      }
    }

    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedLink(true);
      toast.success('Tautan album keluarga berhasil disalin.');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Download Single Photo (from Google Drive)
  const handleDownload = (photo: PhotoItem) => {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${photo.gdrive_file_id}`;
    window.open(downloadUrl, '_blank');
  };

  // 1. LOADING SCREEN
  if (loading && !album) {
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 text-center font-sans text-tinta">
        <div className="w-10 h-10 border-2 border-merah border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg text-tinta">Memuat Album Keluarga...</p>
        <p className="font-mono text-xs text-tinta-lembut mt-1">Menyiapkan dokumentasi beresolusi tinggi</p>
      </div>
    );
  }

  // 2. PIN LOCKED SCREEN (Temporary Lockout after 5 failed attempts)
  if (errorStatus === 'PIN_LOCKED') {
    const minutes = Math.floor(lockCountdown / 60);
    const seconds = lockCountdown % 60;
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 font-sans text-tinta">
        <div className="bg-white border border-garis rounded-[2px] shadow-soft max-w-md w-full p-8 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-merah/10 text-merah border border-merah/25 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-tinta mb-2">Album Terkunci Sementara</h2>
          <p className="text-xs text-tinta-lembut leading-relaxed mb-6 font-mono">
            {errorMessage} Silakan tunggu hingga waktu hitung mundur selesai sebelum mencoba kembali.
          </p>
          <div className="p-4 bg-kertas rounded-[2px] border border-garis font-mono text-2xl font-bold text-merah tracking-widest mb-6">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-[11px] text-tinta-lembut font-mono">
            Jika Anda lupa PIN, hubungi fotografer yang membagikan tautan ini.
          </p>
        </div>
      </div>
    );
  }

  // 3. PIN REQUIRED SCREEN
  if (errorStatus === 'PIN_REQUIRED' || errorStatus === 'PIN_INCORRECT') {
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 font-sans text-tinta">
        <div className="bg-white border border-garis rounded-[2px] shadow-soft max-w-sm w-full p-8 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-kertas-tua text-merah border border-garis flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-tinta mb-1">Album Dilindungi PIN</h2>
          <p className="text-xs text-tinta-lembut font-mono mb-6">
            Masukkan PIN 4–6 digit yang diberikan oleh pihak keluarga atau fotografer.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 bg-kertas border border-garis rounded-[2px] focus:outline-none focus:border-merah font-mono text-tinta"
              />
              {pinError && (
                <p className="text-xs text-merah font-mono mt-2 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pinInput.length < 4 || isSubmittingPin}
              className="w-full py-3 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {isSubmittingPin ? 'Memverifikasi...' : 'Buka Album Foto'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-garis text-[11px] font-mono text-tinta-lembut">
            by.<span className="text-merah">marryland</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. ERROR STATES: EXPIRED, DISABLED, OR INVALID TOKEN
  if (errorStatus || !album) {
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 text-center font-sans text-tinta">
        <div className="bg-white border border-garis rounded-[2px] shadow-soft max-w-md w-full p-8 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-kertas-tua text-merah border border-garis flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-tinta mb-2">Album Tidak Tersedia</h2>
          <p className="text-xs text-tinta-lembut leading-relaxed mb-6 font-mono">
            {errorMessage || 'Tautan album keluarga tidak valid atau telah kedaluwarsa.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    );
  }

  // 5. SUCCESS: FULL EDITORIAL ALBUM VIEW
  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta flex flex-col selection:bg-merah/20 selection:text-merah">
      {/* Top Brand Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-garis sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg tracking-tight text-tinta">
          by.<span className="text-merah">marryland</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-kertas hover:bg-white border border-garis rounded-[2px] text-xs font-mono text-tinta hover:text-merah transition-colors min-h-[36px]"
            title="Bagikan tautan album"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-sukses" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tersalin' : 'Bagikan Album'}</span>
          </button>
        </div>
      </header>

      {/* Hero Section with Cover Photo */}
      <section className="relative bg-marun text-white py-20 md:py-28 px-4 sm:px-8 overflow-hidden border-b border-garis">
        {album.cover_url && (
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src={album.cover_url.replace(/=w\d+/, '=w1600')}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-105"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-marun via-marun/80 to-transparent z-0" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/70 block">
            Dokumentasi Album Keluarga
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal leading-tight tracking-tight">
            {album.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-white/80 flex-wrap pt-2">
            {album.event_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(album.event_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
            <span className="opacity-40">•</span>
            <span>Dokumentasi oleh {album.studio_name}</span>
            <span className="opacity-40">•</span>
            <span>{photos.length} Foto Tersimpan</span>
          </div>

          {album.highlight_description && (
            <p className="text-xs sm:text-sm text-white/80 font-serif italic max-w-xl mx-auto pt-2 leading-relaxed">
              "{album.highlight_description}"
            </p>
          )}
        </div>
      </section>

      {/* Photo Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white border border-garis rounded-[2px]">
            <p className="text-sm font-serif text-tinta-lembut">Belum ada foto di album ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxIndex(index);
                  }
                }}
                className="group relative aspect-[3/4] bg-white border border-garis rounded-[2px] p-2 frame-cetakan shadow-soft overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300"
                aria-label={`Buka foto: ${photo.filename}`}
              >
                <div className="w-full h-full overflow-hidden rounded-[1px] bg-kertas-tua/40 relative">
                  <ImageWithFallback
                    src={photo.thumbnail_url}
                    alt={photo.filename}
                    isMissing={photo.is_missing}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3 text-white">
                    <span className="text-[10px] font-mono truncate max-w-[80%]">
                      {photo.filename}
                    </span>
                    {album.allow_download && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                        className="p-1.5 bg-black/60 hover:bg-black/90 rounded-[2px] text-white"
                        title="Unduh foto ini"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-garis bg-white py-8 px-6 text-center font-mono text-xs text-tinta-lembut">
        <p>
          Dokumentasi album kenangan bersama keluarga • {album.studio_name}
        </p>
        <p className="text-[11px] text-tinta-lembut/60 mt-1">
          Didukung oleh by.marryland — Platform galeri kuratorial pernikahan & perhelatan adat
        </p>
      </footer>

      {/* Reusable PhotoViewer */}
      <PhotoViewer
        photos={photos}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={handleCloseLightbox}
        allowDownload={album.allow_download}
        readOnly={true}
      />
    </div>
  );
}
