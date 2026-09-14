import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
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

      // 3. Fetch Existing Selections (if client returns)
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

  const toggleSelection = async (photoId: string) => {
    if (!gallery || gallery.status === 'completed') return;

    const isSelected = selectedPhotoIds.includes(photoId);
    
    // Check max limit if trying to select
    if (!isSelected && selectedPhotoIds.length >= gallery.max_photos_selectable) {
      alert(`Kamu sudah mencapai batas maksimal ${gallery.max_photos_selectable} foto.`);
      return;
    }

    // Optimistic UI Update
    let newSelections = [...selectedPhotoIds];
    if (isSelected) {
      newSelections = newSelections.filter(id => id !== photoId);
    } else {
      newSelections.push(photoId);
    }
    setSelectedPhotoIds(newSelections);

    // Sync with DB
    if (isSelected) {
      // Delete selection
      await supabase
        .from('photo_selections')
        .delete()
        .match({ gallery_id: gallery.id, gallery_photo_id: photoId });
    } else {
      // Insert selection
      await supabase
        .from('photo_selections')
        .insert({
          gallery_id: gallery.id,
          gallery_photo_id: photoId,
          selection_order: newSelections.length
        });
    }

    // Update gallery count
    await supabase
      .from('galleries')
      .update({ selected_count: newSelections.length })
      .eq('id', gallery.id);
  };

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
    <div className="min-h-screen bg-background font-sans pb-32">
      {/* ─────── White-label Navbar ─────── */}
      <nav className="bg-white px-6 py-4 flex items-center justify-center shadow-sm sticky top-0 z-40">
        <h1 className="font-serif text-xl font-bold tracking-tight text-text">
          {/* Default to by.marryland if no studio name is denormalized yet */}
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

      {/* ─────── Photo Grid ─────── */}
      <main className="max-w-7xl mx-auto px-6 animate-slide-up">
        {photos.length === 0 ? (
          <div className="text-center py-20 card border-dashed border-2 border-primary-200">
            <p className="text-muted">Tidak ada foto di galeri ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {photos.map((photo) => {
              const selectionIndex = selectedPhotoIds.indexOf(photo.id);
              const isSelected = selectionIndex !== -1;
              const selectionNumber = selectionIndex + 1;

              return (
                <div 
                  key={photo.id}
                  onClick={() => toggleSelection(photo.id)}
                  className={`group relative aspect-[2/3] md:aspect-square bg-primary-50 rounded-xl overflow-hidden cursor-pointer shadow-sm transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-primary ring-offset-2' : 'hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  <img
                    src={photo.thumbnail_url}
                    alt={photo.filename}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                  />
                  
                  {/* Hover Overlay */}
                  {!isSelected && !isCompleted && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-text font-bold text-sm px-4 py-2 rounded-full shadow-lg">
                        Pilih Foto
                      </div>
                    </div>
                  )}

                  {/* Selected Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex flex-col">
                      <div className="absolute top-3 right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-glow text-sm">
                        {selectionNumber}
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          Terpilih
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────── Sticky Bottom Bar ─────── */}
      {!isCompleted && photos.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-primary-100 shadow-elevated rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto transition-transform duration-500 animate-slide-up">
            
            {/* Progress Info */}
            <div className="w-full md:w-auto flex-1">
              <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                <span className="font-bold text-text text-sm uppercase tracking-wider">Terpilih</span>
                <span className="font-serif text-2xl font-bold text-primary">
                  {selectedPhotoIds.length} <span className="text-muted text-lg font-sans">/ {gallery.max_photos_selectable}</span>
                </span>
              </div>
              <div className="w-full bg-primary-100/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="w-full md:w-auto flex items-center gap-3">
              <button 
                onClick={() => setShowReviewModal(true)}
                className="flex-1 md:flex-none btn-outline py-2.5 px-6 border-primary-200 text-sm"
              >
                Review Pilihan
              </button>
              <button 
                onClick={() => setShowReviewModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="flex-1 md:flex-none btn-primary py-2.5 px-8 text-sm shadow-glow disabled:opacity-50 disabled:shadow-none"
              >
                Selesai & Kirim
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
                          onClick={() => toggleSelection(id)}
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
