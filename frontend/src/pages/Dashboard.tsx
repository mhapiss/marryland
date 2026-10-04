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
import SendClientMessageModal from '../components/SendClientMessageModal';
import GallerySettingsModal from '../components/GallerySettingsModal';
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
  album_enabled?: boolean;
  album_token?: string | null;
  album_pin_hash?: string | null;
  album_expires_at?: string | null;
  album_allow_download?: boolean;
  album_scope?: 'all' | 'selected_only';
  submitted_at?: string | null;
  photographer_phone?: string | null;
  studio_name?: string | null;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'galeri' | 'pengaturan'>('galeri');
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loadingGalleries, setLoadingGalleries] = useState(true);

  // Modals state
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);
  const [galleryForMessage, setGalleryForMessage] = useState<Gallery | null>(null);
  const [galleryForSettings, setGalleryForSettings] = useState<Gallery | null>(null);

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

  // Realtime updates
  useRealtime({
    table: 'galleries',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onUpdate: (payload) => {
      const updated = payload.new as Gallery;
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === updated.id
            ? { ...g, ...updated }
            : g
        )
      );
    },
    onInsert: (payload) => {
      const newGallery = payload.new as Gallery;
      setGalleries((prev) => {
        if (prev.some((g) => g.id === newGallery.id)) return prev;
        return [newGallery, ...prev];
      });
    },
    onDelete: (payload) => {
      const deleted = payload.old as { id: string };
      setGalleries((prev) => prev.filter((g) => g.id !== deleted.id));
    },
  });

  useRealtime({
    table: 'photo_selections',
    enabled: !!user,
    onAny: () => {
      fetchGalleries();
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGalleryCreated = (newGallery: Gallery) => {
    setGalleries((prev) => [newGallery, ...prev]);
    // Automatically open SendClientMessageModal so photographer can share immediately
    setGalleryForMessage(newGallery);
  };

  const handleGalleryUpdated = (updated: Gallery) => {
    setGalleries((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
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
      const { error } = await supabase.from('galleries').delete().eq('id', galleryToDelete.id);

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

  const handleCopySelectLink = (gallery: Gallery) => {
    const origin = window.location.origin;
    const link = `${origin}/g/${gallery.client_slug}`;
    copyToClipboard(link);
    toast.success('Tautan kurasi klien berhasil disalin.');
  };

  const handleCopyAlbumLink = (gallery: Gallery) => {
    if (!gallery.album_enabled) {
      setGalleryForSettings(gallery);
      toast.info('Album keluarga belum aktif. Atur dan aktifkan di panel ini.');
      return;
    }
    const origin = window.location.origin;
    const token = gallery.album_token || '';
    const link = token
      ? `${origin}/album/${gallery.client_slug}?t=${token}`
      : `${origin}/album/${gallery.client_slug}`;
    copyToClipboard(link);
    toast.success('Tautan album keluarga berhasil disalin.');
  };

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="hidden sm:inline-block border border-garis text-merah bg-kertas-tua/60 text-[10px] px-2.5 py-0.5 rounded-[2px] font-mono uppercase tracking-widest">
            Untuk Fotografer
          </span>
        </div>
        <div className="flex items-center gap-5">
          {user?.email === 'admin@marryland.com' && (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs bg-merah/10 text-merah border border-merah/25 px-3 py-1.5 rounded-[2px] font-medium hover:bg-merah/20 transition-colors"
            >
              Panel Admin
            </button>
          )}
          <span className="text-xs text-tinta-lembut hidden sm:inline truncate max-w-[200px] font-mono">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-tinta-lembut hover:text-merah transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Keluar"
            aria-label="Keluar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex gap-8 border-b border-garis mt-6">
          <button
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative min-h-[44px] flex items-center ${
              activeTab === 'galeri' ? 'text-merah font-bold' : 'text-tinta-lembut hover:text-tinta'
            }`}
            onClick={() => setActiveTab('galeri')}
          >
            Galeri Klien
            {activeTab === 'galeri' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />}
          </button>
          <button
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative min-h-[44px] flex items-center ${
              activeTab === 'pengaturan'
                ? 'text-merah font-bold'
                : 'text-tinta-lembut hover:text-tinta'
            }`}
            onClick={() => setActiveTab('pengaturan')}
          >
            Pengaturan Studio & Pesan
            {activeTab === 'pengaturan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-serif font-normal text-tinta">Daftar Galeri Klien</h2>
                <span className="text-xs font-mono text-tinta-lembut">
                  Total: {galleries.length} galeri
                </span>
              </div>

              {loadingGalleries ? (
                <div className="text-center text-tinta-lembut py-12 text-sm font-mono">
                  Memuat galeri klien...
                </div>
              ) : galleries.length === 0 ? (
                <div className="bg-white p-12 text-center text-tinta-lembut border border-dashed border-garis rounded-[2px] text-sm">
                  Belum ada galeri aktif. Masukkan tautan folder Google Drive pada formulir di atas untuk membuat galeri pertama.
                </div>
              ) : (
                <div className="space-y-4">
                  {galleries.map((gallery) => (
                    <GalleryCard
                      key={gallery.id}
                      gallery={gallery}
                      onViewSelections={handleViewSelections}
                      onDelete={handleDeleteGallery}
                      onSendClientMessage={(g) => setGalleryForMessage(g)}
                      onOpenSettings={(g) => setGalleryForSettings(g)}
                      onCopySelectLink={handleCopySelectLink}
                      onCopyAlbumLink={handleCopyAlbumLink}
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

      {/* Send Client Message Modal (Bagian D) */}
      {galleryForMessage && (
        <SendClientMessageModal
          gallery={galleryForMessage}
          onClose={() => setGalleryForMessage(null)}
          photographerName={user?.user_metadata?.full_name || 'Fotografer'}
          studioName={user?.user_metadata?.studio_name || 'by.marryland'}
          studioSlug={user?.user_metadata?.studio_slug || 'studio'}
          mainTemplate={user?.user_metadata?.message_template_main}
          albumTemplate={user?.user_metadata?.message_template_album}
        />
      )}

      {/* Gallery Settings Modal (Bagian A & E) */}
      {galleryForSettings && (
        <GallerySettingsModal
          gallery={galleryForSettings}
          onClose={() => setGalleryForSettings(null)}
          onGalleryUpdated={handleGalleryUpdated}
        />
      )}

      {/* Delete Gallery Confirm Dialog */}
      <ConfirmDialog
        open={!!galleryToDelete}
        title="Hapus Galeri Klien"
        message={`Galeri untuk klien "${galleryToDelete?.client_name}" beserta data kurasinya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Galeri"
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
