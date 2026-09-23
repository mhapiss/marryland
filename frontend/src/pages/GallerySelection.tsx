import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);

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

  const toggleSelection = useCallback(async (photoId: string, e?: React.MouseEvent | React.KeyboardEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (!gallery) return;
    
    // Only truly lock if completed
    const isLocked = gallery.status === 'completed';
    if (isLocked) return;

    // Use a ref or functional update to check if it's selected to avoid stale closures
    let wasSelected = false;
    let newLength = 0;
    
    setSelectedPhotoIds((prev) => {
      wasSelected = prev.includes(photoId);
      
      if (!wasSelected && prev.length >= gallery.max_photos_selectable) {
        // Will be handled outside via alert
        return prev;
      }

      let nextSelections = [...prev];
      if (wasSelected) {
        nextSelections = nextSelections.filter(id => id !== photoId);
      } else {
        nextSelections.push(photoId);
      }
      newLength = nextSelections.length;
      return nextSelections;
    });

    // Check if we hit the limit during functional update
    if (!wasSelected && selectedPhotoIds.length >= gallery.max_photos_selectable) {
      alert(`Kamu sudah mencapai batas maksimal ${gallery.max_photos_selectable} foto.`);
      return;
    }

    // Sync with DB
    if (wasSelected) {
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
          selection_order: newLength
        });
    }

    // Update gallery count
    await supabase
      .from('galleries')
      .update({ selected_count: newLength })
      .eq('id', gallery.id);
  }, [gallery, selectedPhotoIds.length]);

  const handleFinalSubmit = async () => {
    if (!gallery) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('galleries')
      .update({ status: 'completed' })
      .eq('id', gallery.id);

    setIsSubmitting(false);
    if (!error) {
      setGallery({ ...gallery, status: 'completed' });
      setSubmitSuccess(true);
      setShowReviewModal(false);
    } else {
      alert('Gagal mengirim data. Silakan coba lagi.');
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-muted font-medium animate-pulse">Menyiapkan galeri momen kamu...</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-text mb-2">Galeri Tidak Ditemukan</h1>
        <p className="text-muted mb-8 max-w-md">{error}</p>
      </div>
    );
  }

  const isCompleted = gallery.status === 'completed';
  const progress = (selectedPhotoIds.length / gallery.max_photos_selectable) * 100;

  return (
    <div className="min-h-screen bg-background font-sans pb-32 ambient-bg">
      {/* ─────── Decorative Elements ─────── */}
      <div className="deco-float w-64 h-64 bg-primary-100 top-20 -left-20 blur-3xl"></div>
      <div className="deco-float-reverse w-96 h-96 bg-primary-200/50 top-1/2 -right-32 blur-[100px]"></div>

      {/* ─────── White-label Navbar ─────── */}
      <nav className="bg-white px-6 py-4 flex items-center justify-center shadow-sm sticky top-0 z-30">
        <h1 className="font-serif text-xl font-bold tracking-tight text-text">
          by.<span className="text-primary">marryland</span>
        </h1>
      </nav>

      {/* ─────── Header Info ─────── */}
      <header className="max-w-7xl mx-auto px-6 py-12 text-center animate-fade-in">
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-primary mb-4">Galeri Seleksi</h2>
        <h3 className="text-4xl md:text-5xl font-serif font-bold text-text mb-4">{gallery.client_name}</h3>
        {gallery.event_date && (
          <p className="text-muted font-medium flex items-center justify-center gap-2 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {new Date(gallery.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {gallery.highlight_description && (
          <p className="text-muted max-w-2xl mx-auto leading-relaxed mb-6 italic font-serif text-lg">
            "{gallery.highlight_description}"
          </p>
        )}
        
        {isCompleted && (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full font-bold text-sm mt-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Seleksi Selesai Diterima
          </div>
        )}
      </header>

      {/* ─────── Photo Grid (Masonry with Google Photos Style Hover) ─────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 animate-slide-up">
        {photos.length === 0 ? (
          <div className="text-center py-20 card border-dashed border-2 border-primary-200">
            <p className="text-muted">Tidak ada foto di galeri ini.</p>
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
                      className={`group relative bg-primary-50 rounded-xl overflow-hidden shadow-sm transition-all duration-200 w-full ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 z-10' : 'hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.filename}
                        loading="lazy"
                        className="w-full h-auto object-contain block transition-transform duration-500 group-hover:scale-[1.02] select-none"
                      />

                      {/* Permanent Badge (Top Right) - always visible if selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md z-20 border-2 border-white pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                      
                      {/* Hover Overlay Actions (Desktop hover or Mobile tap) */}
                      {!isCompleted && (
                        <div className={`absolute inset-0 bg-black/25 flex items-center justify-center gap-4 transition-opacity duration-200 z-10 ${
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
                            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-transform duration-200 transform hover:scale-105 shadow-lg border border-white/30"
                            title="Perbesar (Preview)"
                          >
                            <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                          </button>

                          {/* Select/Deselect Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(photo.id, e);
                            }}
                            className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-transform duration-200 transform hover:scale-105 shadow-lg border ${
                              isSelected 
                                ? 'bg-primary/90 hover:bg-primary border-primary' 
                                : 'bg-black/40 hover:bg-black/60 border-white/30'
                            }`}
                            title={isSelected ? "Batal Pilih" : "Pilih Foto"}
                          >
                            <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          if (!isCompleted) toggleSelection(photos[lightboxIndex].id, e);
                        }}
                        disabled={isCompleted}
                        className={`pointer-events-auto flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-sm md:text-base transition-all shadow-2xl ${
                          isCompleted
                            ? 'bg-black/50 text-white/50 cursor-not-allowed border border-white/10'
                            : selectedPhotoIds.includes(photos[lightboxIndex].id)
                              ? 'bg-primary text-white scale-105 ring-4 ring-primary/30'
                              : 'bg-black/70 backdrop-blur-md text-white hover:bg-black/90 border border-white/20'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Terkunci
                          </>
                        ) : selectedPhotoIds.includes(photos[lightboxIndex].id) ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Terpilih
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
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
      {!isCompleted && !submitSuccess && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-primary-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30 animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <div className="text-sm text-muted font-medium">Progress Seleksi</div>
                <div className="font-serif text-2xl font-bold text-primary">
                  {selectedPhotoIds.length} <span className="text-base text-muted font-sans font-normal">/ {gallery.max_photos_selectable}</span>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-primary-100 mx-4"></div>
              <div className="flex-1 sm:flex-none">
                <div className="h-2 bg-primary-50 rounded-full overflow-hidden w-24 sm:w-32">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowReviewModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="flex-1 sm:flex-none btn-outline px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lihat Pilihan
              </button>
              <button 
                onClick={() => setShowReviewModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="flex-1 sm:flex-none btn-primary px-8 py-2.5 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Kirim Pilihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── Success State ─────── */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background">
          <div className="card max-w-md w-full p-10 text-center animate-slide-up">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 className="text-3xl font-serif font-bold text-text mb-4">Terima Kasih!</h2>
            <p className="text-muted leading-relaxed mb-8">
              Pilihan foto kamu berhasil dikirim ke fotografer. Mereka akan segera memprosesnya.
            </p>
            <button onClick={() => setSubmitSuccess(false)} className="btn-outline w-full">
              Lihat Kembali Galeri
            </button>
          </div>
        </div>
      )}

      {/* ─────── Review Modal ─────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative card w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up overflow-hidden bg-background">
            
            <div className="p-6 md:p-8 border-b border-primary-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-serif text-2xl font-bold text-text mb-1">Review Pilihan</h3>
                <p className="text-sm text-muted">Pastikan foto yang kamu pilih sudah benar.</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-2 text-muted hover:bg-primary-50 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {selectedPhotoIds.map((id, index) => {
                  const photo = photos.find(p => p.id === id);
                  if (!photo) return null;
                  return (
                    <div key={id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={photo.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => toggleSelection(id, e)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          title="Hapus pilihan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white border-t border-primary-100">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <div className="font-bold text-text">Total: {selectedPhotoIds.length} foto</div>
                  <div className="text-sm text-muted">Sisa kuota: {gallery.max_photos_selectable - selectedPhotoIds.length} foto</div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 sm:flex-none btn-outline px-6">
                    Pilih Lagi
                  </button>
                  <button 
                    onClick={handleFinalSubmit} 
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none btn-primary px-8"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
