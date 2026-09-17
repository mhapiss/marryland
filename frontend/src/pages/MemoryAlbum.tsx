import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Photo {
  id: string;
  thumbnail_url: string;
  filename: string;
}

interface Selection {
  selection_order: number;
  gallery_photos: Photo;
}

const MemoryAlbum: React.FC = () => {
  const { client_slug } = useParams<{ client_slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const [gallery, setGallery] = useState<any>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlbumData();
  }, [client_slug]);

  const fetchAlbumData = async () => {
    if (!client_slug) return;
    setIsLoading(true);
    
    try {
      // 1. Fetch gallery details
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('client_slug', client_slug)
        .single();
        
      if (galleryError || !galleryData) {
        throw new Error('Album tidak ditemukan.');
      }
      setGallery(galleryData);

      // 2. Fetch selected photos
      const { data: selectionData, error: selectionError } = await supabase
        .from('photo_selections')
        .select(`
          selection_order,
          gallery_photos (
            id,
            thumbnail_url,
            filename
          )
        `)
        .eq('gallery_id', galleryData.id)
        .order('selection_order', { ascending: true });

      if (selectionError) throw selectionError;
      
      // Filter out any null joins (just in case)
      const validSelections = (selectionData || []).filter((s: any) => s.gallery_photos) as unknown as Selection[];
      setSelections(validSelections);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-muted font-medium animate-pulse">Menyiapkan memori indah...</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-6 text-center">
        <h1 className="text-2xl font-serif font-bold text-text mb-2">Album Tidak Tersedia</h1>
        <p className="text-muted">{error}</p>
      </div>
    );
  }

  // Cover photo is the first selected photo, or a placeholder if empty
  const coverPhoto = selections.length > 0 ? selections[0].gallery_photos.thumbnail_url : '';

  return (
    <div className="min-h-screen bg-[#FBF8F2] font-sans selection:bg-primary-200">
      {/* ─────── Magazine Cover Section ─────── */}
      <section className="relative w-full h-[80vh] md:h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {coverPhoto ? (
            <img 
              src={coverPhoto.replace('sz=w800', 'sz=w2000')} // Try to get higher res
              alt="Cover" 
              className="w-full h-full object-cover animate-image-pan"
            />
          ) : (
            <div className="w-full h-full bg-primary-100/50"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#FBF8F2]"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 mt-32 md:mt-48 animate-fade-in drop-shadow-xl text-white">
          <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4 opacity-90">
            Sebuah Kenangan
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 italic leading-tight">
            {gallery.client_name}
          </h1>
          {gallery.event_date && (
            <p className="text-sm md:text-base font-medium tracking-widest uppercase opacity-90 border-t border-white/30 pt-4 max-w-[200px] mx-auto">
              {new Date(gallery.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </section>

      {/* ─────── Intro Section ─────── */}
      {gallery.highlight_description && (
        <section className="max-w-3xl mx-auto px-6 py-20 md:py-32 text-center animate-slide-up">
          <svg className="w-8 h-8 text-primary mx-auto mb-8 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M11.22 13.979c0 1.258-.87 2.383-2.07 2.383-1.42 0-2.48-1.285-2.48-2.614 0-2.736 2.03-5.26 4.67-6.096l.46 1.488c-1.63.468-2.6 1.706-2.6 3.125h2.02v1.714zm8.46 0c0 1.258-.87 2.383-2.07 2.383-1.42 0-2.48-1.285-2.48-2.614 0-2.736 2.03-5.26 4.67-6.096l.46 1.488c-1.63.468-2.6 1.706-2.6 3.125h2.02v1.714z"/></svg>
          <p className="font-serif text-xl md:text-3xl text-text leading-relaxed italic">
            "{gallery.highlight_description}"
          </p>
        </section>
      )}

      {/* ─────── Editorial Grid Section ─────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
        {selections.length === 0 ? (
          <div className="text-center py-20 text-muted">
            Belum ada foto yang dipilih untuk album ini.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-8 space-y-4 md:space-y-8">
            {selections.map((selection, idx) => (
              <div 
                key={selection.gallery_photos.id}
                className="break-inside-avoid relative group"
              >
                <img 
                  src={selection.gallery_photos.thumbnail_url} 
                  alt={`Memory ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-auto rounded-sm shadow-sm transition-transform duration-700 hover:scale-[1.02] cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="bg-text text-[#FBF8F2] py-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-serif text-2xl italic mb-2">Diabadikan oleh</p>
          <h3 className="text-xl font-bold tracking-widest uppercase mb-12 text-primary-200">
            by.marryland
          </h3>
          
          <div className="h-px w-24 bg-primary/30 mx-auto mb-8"></div>
          
          <p className="text-xs text-muted">
            Dibuat menggunakan <a href="/" className="text-primary hover:underline">by.marryland app</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MemoryAlbum;
