import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageWithFallback from '../components/ImageWithFallback';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Gallery } from './Dashboard';

interface Photo {
  id: string;
  gdrive_file_id: string;
  filename: string;
  thumbnail_url: string;
  order_index: number;
}

export default function GallerySelection() {
  const { client_slug } = useParams<{ client_slug: string }>();
  
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Array of photo IDs in order of selection
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);

  // SEO
  usePageMeta(
    gallery ? `Galeri ${gallery.client_name}` : 'Galeri Momen',
    gallery?.highlight_description || 'Pilih foto momen terbaikmu dari sesi foto kami.'
  );

  // ─── Realtime: gallery status changes (e.g. photographer resets status) ───
  useRealtime({
    table: 'galleries',
    filter: gallery ? `id=eq.${gallery.id}` : undefined,
    enabled: !!gallery,
    onUpdate: (payload) => {
      const updated = payload.new as Gallery;
      setGallery((prev) => prev ? { ...prev, status: updated.status, selected_count: updated.selected_count } : prev);
    },
  });

  // ─── Realtime: photo selections from other tabs/devices ───
  useRealtime({
    table: 'photo_selections',
    filter: gallery ? `gallery_id=eq.${gallery.id}` : undefined,
    enabled: !!gallery,
    onInsert: (payload) => {
      const newSel = payload.new as { gallery_photo_id: string };
      setSelectedPhotoIds((prev) => {
        if (prev.includes(newSel.gallery_photo_id)) return prev;
        return [...prev, newSel.gallery_photo_id];
      });
    },
    onDelete: (payload) => {
      const oldSel = payload.old as { gallery_photo_id: string };
      setSelectedPhotoIds((prev) => prev.filter((id) => id !== oldSel.gallery_photo_id));
    },
  });

  useEffect(() => {
    fetchGalleryData();
  }, [client_slug]);

  const fetchGalleryData = async () => {
    if (!client_slug) return;
    setIsLoading(true);
    setError('');

    try {
      // 1. Fetch Gallery
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('client_slug', client_slug)
        .single();

      if (galleryError || !galleryData) {
        throw new Error('Galeri tidak ditemukan atau link tidak valid.');
      }
      setGallery(galleryData);

      // 2. Fetch Photos
      const { data: photosData, error: photosError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('gallery_id', galleryData.id)
        .order('order_index', { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      // 3. Fetch Existing Selections
      const { data: selectionsData } = await supabase
        .from('photo_selections')
        .select('gallery_photo_id, selection_order')
        .eq('gallery_id', galleryData.id)
        .order('selection_order', { ascending: true });

      if (selectionsData) {
        setSelectedPhotoIds(selectionsData.map(s => s.gallery_photo_id));
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isCompleted = gallery?.status === 'completed';
  const isExpired = gallery?.deadline_date
    ? new Date(gallery.deadline_date).getTime() < Date.now()
    : false;
  const isLocked = isCompleted || isExpired;

  const toggleSelection = useCallback(
    async (photoId: string, e?: React.MouseEvent | React.KeyboardEvent | KeyboardEvent) => {
      if (e && 'stopPropagation' in e) e.stopPropagation();
      if (!gallery) return;

      if (gallery.status === 'completed' || isExpired) {
        if (isExpired) toast.error('Batas waktu seleksi telah berakhir.');
        return;
      }

      const isCurrentlySelected = selectedPhotoIds.includes(photoId);

      if (!isCurrentlySelected && selectedPhotoIds.length >= gallery.max_photos_selectable) {
        toast.warning(TOAST.limitReached(gallery.max_photos_selectable));
        return;
      }

      const nextSelections = isCurrentlySelected
        ? selectedPhotoIds.filter((id) => id !== photoId)
        : [...selectedPhotoIds, photoId];

      setSelectedPhotoIds(nextSelections);

      try {
        if (isCurrentlySelected) {
          await supabase
            .from('photo_selections')
            .delete()
            .match({ gallery_id: gallery.id, gallery_photo_id: photoId });
        } else {
          await supabase
            .from('photo_selections')
            .insert({
              gallery_id: gallery.id,
              gallery_photo_id: photoId,
              selection_order: nextSelections.length,
            });
        }

        await supabase
          .from('galleries')
          .update({ selected_count: nextSelections.length })
          .eq('id', gallery.id);
      } catch (err) {
        console.error('Failed to sync selection with database:', err);
      }
    },
    [gallery, isExpired, selectedPhotoIds]
  );

  const handleFinalSubmit = async () => {
    if (!gallery || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ status: 'completed' })
        .eq('id', gallery.id);

      if (error) throw error;

      setGallery({ ...gallery, status: 'completed' });
      setSubmitSuccess(true);
      setShowReviewModal(false);
      setShowConfirmSubmit(false);
      toast.success(TOAST.selectionSendSuccess);
    } catch {
      toast.error(TOAST.selectionSendFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lightbox Navigation
  const nextLightboxImage = useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex < photos.length - 1) {
      setLightboxImageLoaded(false);
      setLightboxIndex(lightboxIndex + 1);
    }
  }, [lightboxIndex, photos.length]);

  const prevLightboxImage = useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxImageLoaded(false);
      setLightboxIndex(lightboxIndex - 1);
    }
  }, [lightboxIndex]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSelection(photos[lightboxIndex].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, nextLightboxImage, prevLightboxImage, closeLightbox, photos]);

  // Simple hook to determine number of columns based on window width
  const [numCols, setNumCols] = useState(2);
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1024) setNumCols(4);
      else if (window.innerWidth >= 768) setNumCols(3);
      else setNumCols(2);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  // Split photos into columns to maintain left-to-right visual order while using flex columns
  const columns = Array.from({ length: numCols }, () => [] as { photo: Photo, index: number }[]);
  photos.forEach((photo, index) => {
    columns[index % numCols].push({ photo, index });
  });

  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  useEffect(() => {
    // Clear active photo on scroll or outside click on mobile
    const handleClear = () => setActivePhotoId(null);
    window.addEventListener('scroll', handleClear, { passive: true });
    return () => window.removeEventListener('scroll', handleClear);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center font-sans text-tinta">
        <div className="w-10 h-10 border-4 border-merah/25 border-t-merah rounded-full animate-spin mb-4"></div>
        <p className="text-tinta-lembut text-xs font-mono tracking-wider animate-pulse">Menyiapkan galeri foto kamu...</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-kertas flex flex-col items-center justify-center font-sans p-6 text-center text-tinta">
        <div className="w-16 h-16 bg-kertas-tua border border-garis text-merah rounded-[2px] flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h1 className="text-2xl font-serif font-normal text-tinta mb-2">Galeri Tidak Ditemukan</h1>
        <p className="text-tinta-lembut text-xs font-mono mb-8 max-w-md">{error}</p>
      </div>
    );
  }

  const progress = gallery ? (selectedPhotoIds.length / gallery.max_photos_selectable) * 100 : 0;

  return (
    <div className="min-h-screen bg-kertas font-sans pb-32 text-tinta">
      {/* ─────── White-label Navbar ─────── */}
      <nav className="bg-white border-b border-garis px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <h1 className="font-serif text-xl tracking-tight text-tinta">
          by.<span className="text-merah">marryland</span>
        </h1>
        <span className="text-xs font-mono uppercase tracking-widest text-tinta-lembut">
          {gallery.client_name}
        </span>
      </nav>

      {/* ─────── Header Info ─────── */}
      <header className="max-w-4xl mx-auto px-6 py-12 text-center animate-fade-in">
        <p className="text-xs font-mono uppercase tracking-widest text-merah mb-3">Galeri Seleksi Klien</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-tinta mb-4">{gallery.client_name}</h2>
        
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-tinta-lembut mb-4">
          {gallery.event_date && (
            <p className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {new Date(gallery.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {gallery.deadline_date && (
            <p className={`flex items-center gap-1.5 ${isExpired ? 'text-merah font-semibold' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Batas Seleksi: {new Date(gallery.deadline_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          )}
        </div>

        {gallery.highlight_description && (
          <p className="text-tinta-lembut max-w-xl mx-auto leading-relaxed mb-6 font-serif italic text-base border-y border-garis/60 py-3">
            &ldquo;{gallery.highlight_description}&rdquo;
          </p>
        )}
        
        {isCompleted && (
          <div className="inline-flex items-center gap-2 bg-kertas-tua text-tinta border border-garis px-4 py-2 rounded-[2px] font-mono text-xs uppercase tracking-wider mt-2">
            <svg className="w-4 h-4 text-merah" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Seleksi Selesai dan Telah Dikirim ke Fotografer
          </div>
        )}

        {isExpired && !isCompleted && (
          <div className="inline-flex items-center gap-2 bg-merah/10 text-merah border border-merah/30 px-4 py-2 rounded-[2px] font-mono text-xs uppercase tracking-wider mt-2">
            <svg className="w-4 h-4 text-merah" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Batas Waktu Seleksi Telah Berakhir
          </div>
        )}
      </header>

      {/* ─────── Photo Grid (Masonry with Google Photos Style Hover) ─────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 animate-slide-up">
        {photos.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-garis rounded-[2px]">
            <p className="text-tinta-lembut text-xs font-mono">Tidak ada foto di galeri ini.</p>
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 flex-1">
                {col.map(({ photo, index }) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  const isMobileActive = activePhotoId === photo.id;

                  return (
                    <div 
                      key={photo.id}
                      onMouseEnter={() => !('ontouchstart' in window) && setActivePhotoId(photo.id)}
                      onMouseLeave={() => !('ontouchstart' in window) && setActivePhotoId(null)}
                      onClick={(e) => {
                        // Logic for Mobile 2-Tap
                        if ('ontouchstart' in window) {
                          if (activePhotoId !== photo.id) {
                            setActivePhotoId(photo.id);
                            return; // Stop here, just show overlay
                          }
                        }
                        // Second tap on mobile, or direct click on desktop opens Lightbox
                        setLightboxImageLoaded(false);
                        setLightboxIndex(index);
                      }}
                      className={`group relative bg-[#f7f5f0] border border-garis rounded-[2px] overflow-hidden transition-all duration-200 w-full ${
                        isSelected ? 'ring-2 ring-merah-tanda z-10' : 'hover:border-merah cursor-pointer'
                      }`}
                    >
                      <ImageWithFallback
                        src={photo.thumbnail_url}
                        alt={photo.filename}
                        loading="lazy"
                        className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01] select-none"
                        fallbackClassName="w-full aspect-[3/2] bg-[#f7f5f0]"
                      />

                      {/* Permanent Badge (Top Right) - red marker circle */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-merah-tanda text-white rounded-full flex items-center justify-center font-mono text-xs font-bold shadow-md z-20 border-2 border-white pointer-events-none">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                      
                      {/* Hover Overlay Actions (Desktop hover or Mobile tap) */}
                      {!isLocked && (
                        <div className={`absolute inset-0 bg-black/35 flex items-center justify-center gap-3 transition-opacity duration-200 z-10 ${
                          isMobileActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {/* Zoom Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoId(null);
                              setLightboxImageLoaded(false);
                              setLightboxIndex(index);
                            }}
                            className="w-10 h-10 rounded-[2px] bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/30"
                            title="Perbesar"
                            aria-label="Perbesar foto"
                          >
                            <svg className="w-5 h-5 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                          </button>

                          {/* Select/Deselect Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(photo.id, e);
                            }}
                            className={`w-10 h-10 rounded-[2px] backdrop-blur-md flex items-center justify-center text-white transition-all border ${
                              isSelected 
                                ? 'bg-merah hover:bg-merah-hover border-merah' 
                                : 'bg-black/50 hover:bg-black/70 border-white/30'
                            }`}
                            title={isSelected ? "Batal Pilih" : "Pilih Foto"}
                            aria-label={isSelected ? "Batal Pilih" : "Pilih Foto"}
                          >
                            <svg className="w-5 h-5 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {isSelected ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                              )}
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─────── Lightbox Full-Size Preview ─────── */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black touch-none">
          {/* Top Header */}
          <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-4 md:px-6 z-20 pointer-events-auto bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white/70 font-mono text-sm tracking-widest drop-shadow-md">
              {lightboxIndex + 1} / {photos.length}
            </span>
            <button 
              onClick={closeLightbox} 
              className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10"
              title="Tutup (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Image Area */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            {/* Loading Spinner */}
            {!lightboxImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
              doubleClick={{ mode: "zoomIn" }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <React.Fragment>
                  <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                    <img 
                      src={photos[lightboxIndex].thumbnail_url.replace(/=w\d+/, '=w2000')}
                      alt={photos[lightboxIndex].filename}
                      className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${lightboxImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setLightboxImageLoaded(true)}
                      draggable={false}
                    />
                  </TransformComponent>

                  {/* Floating Action Button (Pilih Foto + Zoom) */}
                  <div className="absolute bottom-8 inset-x-0 flex justify-center z-20 pointer-events-none">
                    <div className="flex items-center gap-3">
                      {/* Zoom Out Button */}
                      <button
                        onClick={() => zoomOut()}
                        className="pointer-events-auto w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center border border-white/20 transition-all shadow-xl"
                        title="Zoom Out"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/></svg>
                      </button>

                      <button
                        onClick={(e) => {
                          if (!isLocked) toggleSelection(photos[lightboxIndex].id, e);
                        }}
                        disabled={isLocked}
                        className={`pointer-events-auto flex items-center gap-2 px-6 md:px-8 py-3 rounded-[2px] font-mono text-xs uppercase tracking-wider transition-all shadow-2xl ${
                          isLocked
                            ? 'bg-black/50 text-white/50 cursor-not-allowed border border-white/10'
                            : selectedPhotoIds.includes(photos[lightboxIndex].id)
                              ? 'bg-merah text-white ring-2 ring-merah-tanda'
                              : 'bg-black/70 backdrop-blur-md text-white hover:bg-black/90 border border-white/20'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {isExpired ? 'Batas Waktu Berakhir' : 'Terkunci'}
                          </>
                        ) : selectedPhotoIds.includes(photos[lightboxIndex].id) ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Terpilih
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            Pilih Foto
                          </>
                        )}
                      </button>

                      {/* Zoom In Button */}
                      <button
                        onClick={() => zoomIn()}
                        className="pointer-events-auto w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center border border-white/20 transition-all shadow-xl"
                        title="Zoom In"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              )}
            </TransformWrapper>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prevLightboxImage}
            disabled={lightboxIndex === 0}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 z-20"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <button 
            onClick={nextLightboxImage}
            disabled={lightboxIndex === photos.length - 1}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 z-20"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      )}

      {/* ─────── Sticky Bottom Action Bar ─────── */}
      {!isLocked && !submitSuccess && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-garis shadow-[0_-4px_20px_rgba(43,24,21,0.06)] z-30 animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-tinta-lembut">Progres Seleksi</div>
                <div className="font-serif text-2xl font-normal text-merah">
                  {selectedPhotoIds.length} <span className="text-xs text-tinta-lembut font-mono">/ {gallery.max_photos_selectable} foto</span>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-garis mx-2"></div>
              <div className="flex-1 sm:flex-none">
                <div className="h-2 bg-kertas-tua rounded-[2px] overflow-hidden w-24 sm:w-32">
                  <div 
                    className="h-full bg-merah rounded-[2px] transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowReviewModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-garis rounded-[2px] text-xs font-medium text-tinta hover:border-merah hover:text-merah transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tinjau Pilihan ({selectedPhotoIds.length})
              </button>
              <button 
                onClick={() => setShowReviewModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim Pilihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── Success State ─────── */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-garis rounded-[2px] max-w-md w-full p-8 text-center animate-slide-up font-sans text-tinta">
            <div className="w-14 h-14 bg-kertas-tua border border-garis text-merah rounded-[2px] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-tinta mb-2">Terima Kasih!</h2>
            <p className="text-tinta-lembut text-xs leading-relaxed mb-6">
              Pilihan foto kamu telah berhasil dikirim ke fotografer dan galeri telah dikunci. Fotografer akan melanjutkan proses pengeditan.
            </p>
            <button 
              onClick={() => setSubmitSuccess(false)} 
              className="w-full py-2.5 border border-garis rounded-[2px] text-xs font-medium text-tinta hover:border-merah hover:text-merah transition-colors"
            >
              Lihat Kembali Galeri
            </button>
          </div>
        </div>
      )}

      {/* ─────── Review Modal ─────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white border border-garis rounded-[2px] w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up overflow-hidden font-sans text-tinta">
            
            <div className="p-6 border-b border-garis flex items-center justify-between bg-kertas">
              <div>
                <h3 className="font-serif text-2xl font-normal text-tinta mb-1">Tinjau Pilihan Foto</h3>
                <p className="text-xs text-tinta-lembut font-mono">Pastikan foto yang dipilih sudah sesuai sebelum dikirim.</p>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)} 
                className="p-1.5 text-tinta-lembut hover:text-merah transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#f7f5f0]/50">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {selectedPhotoIds.map((id, index) => {
                  const photo = photos.find(p => p.id === id);
                  if (!photo) return null;
                  return (
                    <div key={id} className="relative aspect-square rounded-[2px] border border-garis overflow-hidden group bg-[#f7f5f0]">
                      <img src={photo.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => toggleSelection(id, e)}
                          className="bg-merah text-white p-1.5 rounded-[2px] hover:bg-merah-hover transition-colors"
                          title="Hapus pilihan"
                          aria-label="Hapus pilihan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                      <div className="absolute top-1 right-1 w-5 h-5 bg-merah-tanda text-white text-[10px] font-mono font-bold rounded-[2px] flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-garis">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <div className="font-mono text-sm font-bold text-tinta">Total: {selectedPhotoIds.length} foto</div>
                  <div className="text-xs text-tinta-lembut font-mono">Sisa kuota: {gallery.max_photos_selectable - selectedPhotoIds.length} foto</div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowReviewModal(false)} 
                    className="flex-1 sm:flex-none px-5 py-2.5 border border-garis rounded-[2px] text-xs font-medium text-tinta hover:border-merah hover:text-merah transition-colors"
                  >
                    Pilih Lagi
                  </button>
                  <button 
                    onClick={() => setShowConfirmSubmit(true)} 
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium transition-colors"
                  >
                    Kirim Sekarang
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirmSubmit}
        title="Kirim Pilihan Foto?"
        message="Setelah dikirim, kamu tidak bisa mengubah pilihan ini lagi. Pastikan semua foto yang dipilih sudah benar."
        confirmLabel="Ya, Kirim"
        cancelLabel="Cek Lagi"
        loading={isSubmitting}
        destructive={false}
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />
    </div>
  );
}
