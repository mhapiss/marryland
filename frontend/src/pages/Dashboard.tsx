import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import CreateGalleryForm from '../components/CreateGalleryForm';
import GalleryCard from '../components/GalleryCard';
import SelectedPhotosModal from '../components/SelectedPhotosModal';
import StudioSettings from '../components/StudioSettings';
import AccountSettings from '../components/AccountSettings';

export interface Gallery {
  id: string;
  user_id: string;
  client_name: string;
  client_slug: string;
  gdrive_folder_url: string;
  gdrive_folder_id: string;
  event_date: string | null;
  max_photos_selectable: number;
  deadline_date: string | null;
  highlight_description: string | null;
  client_email: string | null;
  client_whatsapp: string;
  allow_download: boolean;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  selected_count?: number;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'galeri' | 'pengaturan'>('galeri');
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loadingGalleries, setLoadingGalleries] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  const fetchGalleries = useCallback(async () => {
    if (!user) return;
    setLoadingGalleries(true);
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGalleries(data);
    }
    setLoadingGalleries(false);
  }, [user]);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  // ─── Realtime: gallery status & selected_count updates ───
  // When a client submits selections or completes a gallery,
  // the dashboard updates instantly without manual refresh.
  useRealtime({
    table: 'galleries',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onUpdate: (payload) => {
      const updated = payload.new as Gallery;
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === updated.id
            ? { ...g, status: updated.status, selected_count: updated.selected_count }
            : g
        )
      );
    },
    onInsert: (payload) => {
      const newGallery = payload.new as Gallery;
      setGalleries((prev) => {
        // Avoid duplicates (e.g. from optimistic insert + realtime)
        if (prev.some((g) => g.id === newGallery.id)) return prev;
        return [newGallery, ...prev];
      });
    },
    onDelete: (payload) => {
      const deleted = payload.old as { id: string };
      setGalleries((prev) => prev.filter((g) => g.id !== deleted.id));
    },
  });

  // ─── Realtime: photo_selections changes ───
  // When a client selects/deselects photos, we re-fetch gallery data
  // to get updated selected_count for the progress bar.
  useRealtime({
    table: 'photo_selections',
    enabled: !!user,
    onAny: () => {
      // Re-fetch galleries to update selected_count across all gallery cards
      fetchGalleries();
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGalleryCreated = (newGallery: Gallery) => {
    setGalleries((prev) => [newGallery, ...prev]);
  };

  const handleViewSelections = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setShowPhotosModal(true);
  };

  const handleDeleteGallery = async (galleryId: string) => {
    const { error } = await supabase
      .from('galleries')
      .delete()
      .eq('id', galleryId);

    if (!error) {
      setGalleries((prev) => prev.filter((g) => g.id !== galleryId));
    }
  };

  const generateWhatsAppLink = (gallery: Gallery) => {
    const studioSlug = user?.user_metadata?.studio_slug || 'studio';
    const domain = window.location.origin;
    const message = `Halo ${gallery.client_name},\nGaleri foto kamu dari by.marryland sudah siap!\n\n📸 Pilih foto favorit kamu di sini:\n${domain}/${studioSlug}/${gallery.client_slug}\n\nSelamat menikmati momennya! ✨`;
    const phone = gallery.client_whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const copyGalleryLink = (gallery: Gallery) => {
    const studioSlug = user?.user_metadata?.studio_slug || 'studio';
    const link = `${window.location.origin}/${studioSlug}/${gallery.client_slug}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-text ambient-bg">
      {/* ─────── Decorative Elements ─────── */}
      <div className="deco-float w-64 h-64 bg-primary-100 top-20 -left-20 blur-3xl"></div>
      <div className="deco-float-reverse w-96 h-96 bg-primary-200/50 top-1/2 -right-32 blur-[100px]"></div>

      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-primary-100/40 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif font-bold tracking-tight">by.<span className="text-primary">marryland</span></h1>
          <span className="hidden sm:inline-block border border-primary-200 text-primary-700 bg-primary-50 text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
            for photographers
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* User email */}
          <span className="text-sm text-muted hidden sm:inline truncate max-w-[200px]">
            {user?.email}
          </span>
          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="text-muted hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex gap-8 border-b border-primary-100 mt-6">
          <button
            className={`pb-3 text-sm font-semibold tracking-wide uppercase transition-colors relative ${
              activeTab === 'galeri'
                ? 'text-primary'
                : 'text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('galeri')}
          >
            Galeri
            {activeTab === 'galeri' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
          <button
            className={`pb-3 text-sm font-semibold tracking-wide uppercase transition-colors relative ${
              activeTab === 'pengaturan'
                ? 'text-primary'
                : 'text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('pengaturan')}
          >
            Pengaturan
            {activeTab === 'pengaturan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'galeri' && (
          <div className="space-y-8 animate-fade-in">

            {/* Create Gallery Form */}
            <CreateGalleryForm onGalleryCreated={handleGalleryCreated} />

            {/* Gallery List */}
            <div>
              <h3 className="text-xl font-serif font-bold text-text mb-5">Semua Galeri</h3>
              {loadingGalleries ? (
                <div className="text-center text-muted py-12">Memuat galeri...</div>
              ) : galleries.length === 0 ? (
                <div className="card p-12 text-center text-muted border-dashed border-2 border-primary-200">
                  Belum ada galeri. Buat galeri pertamamu di atas!
                </div>
              ) : (
                <div className="space-y-5">
                  {galleries.map((gallery) => (
                    <GalleryCard
                      key={gallery.id}
                      gallery={gallery}
                      onViewSelections={handleViewSelections}
                      onDelete={handleDeleteGallery}
                      onShareWhatsApp={() => window.open(generateWhatsAppLink(gallery), '_blank')}
                      onCopyLink={() => copyGalleryLink(gallery)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pengaturan' && (
          <div className="space-y-8 animate-fade-in">
            <StudioSettings />
            <AccountSettings />
          </div>
        )}
      </main>

      {/* Selected Photos Modal */}
      {showPhotosModal && selectedGallery && (
        <SelectedPhotosModal
          gallery={selectedGallery}
          onClose={() => {
            setShowPhotosModal(false);
            setSelectedGallery(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
