import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import CreateGalleryForm from '../components/CreateGalleryForm';
import GalleryCard from '../components/GalleryCard';
import SelectedPhotosModal from '../components/SelectedPhotosModal';
import StudioSettings from '../components/StudioSettings';
import AccountSettings from '../components/AccountSettings';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import { copyToClipboard } from '../lib/clipboard';

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
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);

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

  const handleDeleteGallery = (gallery: Gallery) => {
    setGalleryToDelete(gallery);
  };

  const confirmDeleteGallery = async () => {
    if (!galleryToDelete) return;
    setIsDeletingGallery(true);
    
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryToDelete.id);

      if (error) throw error;
      setGalleries((prev) => prev.filter((g) => g.id !== galleryToDelete.id));
      toast.success(TOAST.galleryDeleteSuccess);
    } catch {
      toast.error(TOAST.galleryDeleteFail);
    } finally {
      setIsDeletingGallery(false);
      setGalleryToDelete(null);
    }
  };

  const generateWhatsAppLink = (gallery: Gallery) => {
    const studioSlug = user?.user_metadata?.studio_slug || 'studio';
    const domain = window.location.origin;
    const message = `Halo ${gallery.client_name},\nGaleri foto kamu dari by.marryland sudah siap!\n\nPilih foto favorit kamu di sini:\n${domain}/${studioSlug}/${gallery.client_slug}\n\nSelamat menikmati momennya!`;
    const phone = gallery.client_whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const copyGalleryLink = (gallery: Gallery) => {
    const studioSlug = user?.user_metadata?.studio_slug || 'studio';
    const link = `${window.location.origin}/${studioSlug}/${gallery.client_slug}`;
    copyToClipboard(link);
  };

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif tracking-tight text-tinta">by.<span className="text-merah">marryland</span></Link>
          <span className="hidden sm:inline-block border border-garis text-merah bg-kertas-tua/60 text-[10px] px-2.5 py-0.5 rounded-[2px] font-mono uppercase tracking-widest">
            Untuk Fotografer
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* Admin Panel Link */}
          {user?.email === 'admin@marryland.com' && (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs bg-merah/10 text-merah border border-merah/25 px-3 py-1.5 rounded-[2px] font-medium hover:bg-merah/20 transition-colors"
            >
              Panel Admin
            </button>
          )}
          {/* User email */}
          <span className="text-xs text-tinta-lembut hidden sm:inline truncate max-w-[200px] font-mono">
            {user?.email}
          </span>
          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="text-tinta-lembut hover:text-merah transition-colors"
            title="Keluar"
            aria-label="Keluar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex gap-8 border-b border-garis mt-6">
          <button
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative ${
              activeTab === 'galeri'
                ? 'text-merah font-bold'
                : 'text-tinta-lembut hover:text-tinta'
            }`}
            onClick={() => setActiveTab('galeri')}
          >
            Galeri
            {activeTab === 'galeri' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah"></div>
            )}
          </button>
          <button
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative ${
              activeTab === 'pengaturan'
                ? 'text-merah font-bold'
                : 'text-tinta-lembut hover:text-tinta'
            }`}
            onClick={() => setActiveTab('pengaturan')}
          >
            Pengaturan Studio
            {activeTab === 'pengaturan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah"></div>
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
              <h2 className="text-xl font-serif font-normal text-tinta mb-5">Semua Galeri Klien</h2>
              {loadingGalleries ? (
                <div className="text-center text-tinta-lembut py-12 text-sm">Memuat galeri...</div>
              ) : galleries.length === 0 ? (
                <div className="bg-white p-12 text-center text-tinta-lembut border border-dashed border-garis rounded-[2px] text-sm">
                  Belum ada galeri aktif. Buat galeri pertamamu pada formulir di atas.
                </div>
              ) : (
                <div className="space-y-4">
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

      {/* Delete Gallery Confirm Dialog */}
      <ConfirmDialog
        open={!!galleryToDelete}
        title="Hapus Galeri"
        message={`Galeri untuk klien "${galleryToDelete?.client_name}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        loading={isDeletingGallery}
        destructive
        onConfirm={confirmDeleteGallery}
        onCancel={() => setGalleryToDelete(null)}
      />
    </div>
  );
};

export default Dashboard;
