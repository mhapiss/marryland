import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
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

  useEffect(() => {
    fetchGalleries();
  }, [user]);

  const fetchGalleries = async () => {
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
  };

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
    <div className="min-h-screen bg-background font-sans text-text">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-primary-100/40 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif font-bold tracking-tight">by.<span className="text-primary">marryland</span></h1>
          <span className="hidden sm:inline-block border border-primary-200 text-primary-700 bg-primary-50 text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
            for photographers
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* Credit badge */}
          <div className="flex items-center gap-1.5 border border-primary/30 bg-primary-50 text-primary text-sm px-3 py-1.5 rounded-full font-medium cursor-pointer hover:bg-primary-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>0 kredit</span>
            <span className="text-lg leading-none font-light ml-1">+</span>
          </div>
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

            {/* Mbak Pili Banner (Phase 2 - info only) */}
            <div className="card p-8 text-center bg-gradient-to-br from-white to-primary-50">
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <span className="bg-primary-100 text-primary-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Baru</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-text mb-2">
                Capek urus vendor kamu <span className="text-primary italic font-serif">sendiri?</span>
              </h2>
              <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed mb-6">
                Kenalan sama Mbak Pili, asisten yang bantu ngurus vendor foto kamu.
                Editan telat, tagihan yang sungkan dikejar, jadwal numpuk — biar dia yang jagain.
                Dia catat job, ingetin deadline, sampai bikinin galeri. Kamu tinggal fokus berkarya.
              </p>
              <button className="btn-primary w-full max-w-sm py-2.5">
                Hubungkan Telegram
              </button>
            </div>

            {/* Gallery Selection Info Banner */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-text mb-3">Gallery Selection gratis untuk fotografer.</h3>
              <div className="flex flex-col md:flex-row gap-5 items-start">
                <div className="flex-1">
                  {/* Pilihin Job teaser */}
                  <div className="bg-primary-50/50 rounded-xl p-4 flex items-start gap-3 mb-3 border border-primary-100/50">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold flex items-center gap-2">
                        Pilihin Job
                        <span className="bg-primary-100 text-primary-700 text-[10px] px-1.5 py-0.5 rounded font-bold">PRO</span>
                      </p>
                      <p className="text-xs text-muted leading-relaxed mt-1">
                        Terima booking klien lewat form online, lalu ubah jadi invoice yang rapi & profesional — semua terkelola dari satu tempat, tanpa ribet catat manual.{' '}
                        <a href="#" className="text-primary font-medium hover:underline">Coba gratis sekarang →</a>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    <strong>Pilihin Picker</strong> (RAW ke Lightroom) & <strong>Download Pilihan JPG</strong> (JPG asli di layout atau, ke percetakan).
                    1 kredit membuka satu galeri untuk dua-duanya — atau <strong>Pro</strong> bebas semua tanpa batas.
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="btn-primary text-sm px-5 py-2.5 rounded-xl">
                    Coba Picker →
                  </button>
                  <button className="btn-outline text-sm px-5 py-2.5 rounded-xl border-primary-200">
                    Pelajari Pilihin Job →
                  </button>
                  <button className="text-muted text-xs hover:text-primary transition-colors mt-1 font-medium">
                    ▸ Demo Picker
                  </button>
                </div>
              </div>
            </div>

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
