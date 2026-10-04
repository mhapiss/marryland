// src/pages/PortfolioManager.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  PORTFOLIO_PALETTES,
  DEFAULT_COLLECTIONS,
  DEFAULT_EVENT_TYPES,
  PortfolioCollection,
  EventType,
  PortfolioPhotoItem,
  ThemePaletteKey,
  ThemeFontKey,
} from '../config/portfolioThemes';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ArrowLeft,
  Tag,
  Palette,
  Layout,
  Type,
  MessageSquare,
  Layers,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Upload,
} from 'lucide-react';

export default function PortfolioManager() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Top level tabs
  const [activeTab, setActiveTab] = useState<'collections' | 'eventTypes' | 'allPhotos'>('collections');

  // Collections state
  const [collections, setCollections] = useState<PortfolioCollection[]>(DEFAULT_COLLECTIONS);
  const [selectedCollection, setSelectedCollection] = useState<PortfolioCollection | null>(null);
  const [collectionTab, setCollectionTab] = useState<'dasar' | 'tampilan' | 'konten' | 'foto'>('dasar');
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Event types state
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [newEvName, setNewEvName] = useState('');
  const [newEvSlug, setNewEvSlug] = useState('');
  const [newEvDesc, setNewEvDesc] = useState('');

  // Photos state
  const [photos, setPhotos] = useState<PortfolioPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Delete modal state
  const [deleteTargetPhoto, setDeleteTargetPhoto] = useState<PortfolioPhotoItem | null>(null);
  const [deleteTargetCollection, setDeleteTargetCollection] = useState<PortfolioCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Upload in Collection
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoAlt, setPhotoAlt] = useState('');
  const [photoSlot, setPhotoSlot] = useState<PortfolioPhotoItem['slot']>('gallery');
  const [photoEventSlug, setPhotoEventSlug] = useState('akad');
  const [photoFocal, setPhotoFocal] = useState('center');

  // Fetch initial data
  useEffect(() => {
    fetchCollections();
    fetchEventTypes();
    fetchPhotos();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_collections')
        .select('*')
        .order('position', { ascending: true });

      if (!error && data && data.length > 0) {
        setCollections(data);
      } else {
        setCollections(DEFAULT_COLLECTIONS);
      }
    } catch {
      setCollections(DEFAULT_COLLECTIONS);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('position', { ascending: true });

      if (!error && data && data.length > 0) {
        setEventTypes(data);
      } else {
        setEventTypes(DEFAULT_EVENT_TYPES);
      }
    } catch {
      setEventTypes(DEFAULT_EVENT_TYPES);
    }
  };

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_photos')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data) {
        setPhotos(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Save Collection
  const handleSaveCollection = async () => {
    if (!selectedCollection) return;
    setIsSavingCollection(true);

    try {
      const isNew = selectedCollection.id.startsWith('new-') || selectedCollection.id.startsWith('col-');

      const payload = {
        name: selectedCollection.name,
        slug: selectedCollection.slug,
        short_description: selectedCollection.short_description,
        status: selectedCollection.status,
        theme_palette: selectedCollection.theme_palette,
        theme_font: selectedCollection.theme_font,
        layout: selectedCollection.layout,
        content: selectedCollection.content,
        position: selectedCollection.position || 0,
        cover_url: selectedCollection.cover_url || null,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('portfolio_collections')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        toast.success(`Koleksi "${payload.name}" berhasil dibuat`);
        setCollections((prev) => [...prev.filter((c) => c.id !== selectedCollection.id), data]);
        setSelectedCollection(data);
      } else {
        const { error } = await supabase
          .from('portfolio_collections')
          .update(payload)
          .eq('id', selectedCollection.id);

        if (error) throw error;
        toast.success(`Perubahan koleksi "${payload.name}" berhasil disimpan`);
        setCollections((prev) =>
          prev.map((c) => (c.id === selectedCollection.id ? { ...c, ...payload } : c))
        );
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan koleksi: ' + (err.message || 'Coba lagi nanti'));
    } finally {
      setIsSavingCollection(false);
    }
  };

  // Create New Collection
  const handleCreateCollection = () => {
    const newCol: PortfolioCollection = {
      id: `new-${Date.now()}`,
      name: 'Koleksi Baru',
      slug: `koleksi-baru-${Math.floor(Math.random() * 1000)}`,
      short_description: 'Deskripsi kuratorial singkat mengenai koleksi ini.',
      status: 'draft',
      theme_palette: 'hijau-botol',
      theme_font: 'editorial',
      position: collections.length + 1,
      layout: {
        hero_side: 'left',
        collage_variant: 'A',
        event_cards_staggered: true,
      },
      content: {
        hero_eyebrow: 'KOLEKSI DOKUMENTASI',
        hero_heading: 'Dokumentasi Adat [NAMA_ADAT]',
        hero_subheading: 'Tangkapan visual otentik yang mengabadikan setiap tata rias, busana, dan jalinan kasih keluarga.',
        about_eyebrow: 'TENTANG KOLEKSI',
        about_heading: 'Kehangatan Tradisi dalam Bingkai Editorial',
        about_description: 'Pendekatan kuratorial kami menitikberatkan pada keaslian emosi dan keindahan estetika budaya.',
        highlight_eyebrow: 'MOMEN SOROTAN',
        highlight_heading: 'Detail dan Emosi yang Terpatri',
        cta_heading: 'Rencanakan Dokumentasi Hari Bahagiamu',
        cta_subheading: 'Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.',
        wa_message_template: 'Halo by.marryland, saya tertarik dengan dokumentasi adat ini. Boleh info jadwal dan paket yang tersedia?',
      },
    };
    setSelectedCollection(newCol);
    setCollectionTab('dasar');
  };

  // Duplicate Collection
  const handleDuplicateCollection = (col: PortfolioCollection) => {
    const duplicated: PortfolioCollection = {
      ...col,
      id: `new-${Date.now()}`,
      name: `${col.name} (Salinan)`,
      slug: `${col.slug}-salinan-${Math.floor(Math.random() * 100)}`,
      status: 'draft',
      position: collections.length + 1,
    };
    setSelectedCollection(duplicated);
    setCollectionTab('dasar');
    toast.info('Koleksi disalin. Sesuaikan nama dan slug lalu klik Simpan.');
  };

  // Delete Collection
  const handleDeleteCollection = async () => {
    if (!deleteTargetCollection) return;
    setIsDeleting(true);

    try {
      if (!deleteTargetCollection.id.startsWith('new-') && !deleteTargetCollection.id.startsWith('col-')) {
        const { error } = await supabase
          .from('portfolio_collections')
          .delete()
          .eq('id', deleteTargetCollection.id);
        if (error) throw error;
      }

      setCollections((prev) => prev.filter((c) => c.id !== deleteTargetCollection.id));
      if (selectedCollection?.id === deleteTargetCollection.id) {
        setSelectedCollection(null);
      }
      toast.success(`Koleksi "${deleteTargetCollection.name}" berhasil dihapus`);
    } catch (err: any) {
      toast.error('Gagal menghapus koleksi: ' + err.message);
    } finally {
      setIsDeleting(false);
      setDeleteTargetCollection(null);
    }
  };

  // Upload Photo to Collection
  const handlePhotoUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress('Mengoptimalkan & mengompres foto...');

    try {
      let width = 1200;
      let height = 800;
      let uploadBlob: Blob = uploadFile;
      let isWebP = false;

      try {
        const bitmap = await createImageBitmap(uploadFile, { imageOrientation: 'from-image' });
        const origW = bitmap.width;
        const origH = bitmap.height;
        width = origW;
        height = origH;

        // Auto-optimize for ultra fast screen rendering:
        // Max edge 1920px keeps Retina sharpness while dropping file size by 90%
        const maxEdge = 1920;
        let targetW = origW;
        let targetH = origH;

        if (origW > maxEdge || origH > maxEdge) {
          if (origW >= origH) {
            targetW = maxEdge;
            targetH = Math.round((maxEdge / origW) * origH);
          } else {
            targetH = maxEdge;
            targetW = Math.round((maxEdge / origH) * origW);
          }
          width = targetW;
          height = targetH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, targetW, targetH);
          const compressed = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/webp', 0.85)
          );
          if (compressed) {
            uploadBlob = compressed;
            isWebP = true;
          }
        }
      } catch (err) {
        console.warn('Canvas optimization fallback to original file:', err);
      }

      setUploadProgress('Mengunggah ke penyimpanan cloud...');
      const fileExt = isWebP ? 'webp' : (uploadFile.name.split('.').pop() || 'jpg');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const storagePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(fileName, uploadBlob, {
          contentType: isWebP ? 'image/webp' : uploadFile.type,
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-library').getPublicUrl(fileName);

      // Find event type ID if any
      const matchedEv = eventTypes.find((e) => e.slug === photoEventSlug);

      const newPhotoData = {
        image_url: publicUrl,
        storage_path: storagePath,
        caption: photoCaption || null,
        alt: photoAlt || photoCaption || null,
        slot: photoSlot || 'gallery',
        collection_id: selectedCollection?.id?.startsWith('new-') || selectedCollection?.id?.startsWith('col-')
          ? null
          : selectedCollection?.id,
        event_type_id: matchedEv?.id || null,
        event_type_slug: photoEventSlug,
        category: photoEventSlug,
        focal: photoFocal,
        width,
        height,
        order_index: photos.length + 1,
        is_published: true,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('portfolio_photos')
        .insert(newPhotoData)
        .select()
        .single();

      if (insertError) throw insertError;

      setPhotos((prev) => [...prev, inserted]);

      // If slot is hero, also set collection cover_url if empty
      if (selectedCollection && (!selectedCollection.cover_url || photoSlot === 'hero')) {
        setSelectedCollection({
          ...selectedCollection,
          cover_url: publicUrl,
        });
      }

      toast.success('Foto berhasil ditambahkan ke koleksi');
      setShowPhotoModal(false);
      setUploadFile(null);
      setUploadPreview(null);
      setPhotoCaption('');
      setPhotoAlt('');
    } catch (err: any) {
      toast.error('Gagal mengupload foto: ' + (err.message || 'Coba lagi'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Add Event Type
  const handleAddEventType = async () => {
    if (!newEvName.trim()) {
      toast.error('Nama jenis acara tidak boleh kosong');
      return;
    }
    const slug = newEvSlug.trim() || newEvName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newEv: EventType = {
      id: `ev-${Date.now()}`,
      name: newEvName.trim(),
      slug,
      description: newEvDesc.trim(),
      position: eventTypes.length + 1,
    };

    try {
      const { data, error } = await supabase
        .from('event_types')
        .insert({
          name: newEv.name,
          slug: newEv.slug,
          description: newEv.description,
          position: newEv.position,
        })
        .select()
        .single();

      if (!error && data) {
        setEventTypes((prev) => [...prev, data]);
      } else {
        setEventTypes((prev) => [...prev, newEv]);
      }
      toast.success('Jenis acara berhasil ditambahkan');
      setNewEvName('');
      setNewEvSlug('');
      setNewEvDesc('');
    } catch {
      setEventTypes((prev) => [...prev, newEv]);
      toast.success('Jenis acara berhasil ditambahkan');
    }
  };

  // Delete Event Type
  const handleDeleteEventType = async (id: string, slug: string) => {
    try {
      await supabase.from('event_types').delete().eq('slug', slug);
      setEventTypes((prev) => prev.filter((e) => e.slug !== slug));
      toast.success('Jenis acara berhasil dihapus');
    } catch {
      setEventTypes((prev) => prev.filter((e) => e.slug !== slug));
      toast.success('Jenis acara berhasil dihapus');
    }
  };

  // Delete Photo
  const handleDeletePhoto = async () => {
    if (!deleteTargetPhoto) return;
    setIsDeleting(true);

    try {
      if (deleteTargetPhoto.storage_path) {
        const fileName = deleteTargetPhoto.storage_path.replace('portfolio/', '');
        await supabase.storage.from('portfolio').remove([fileName]);
      }

      await supabase.from('portfolio_photos').delete().eq('id', deleteTargetPhoto.id);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTargetPhoto.id));
      toast.success(TOAST.portfolioDeleteSuccess);
    } catch (err: any) {
      toast.error(TOAST.portfolioDeleteFail + (err.message ? `: ${err.message}` : ''));
    } finally {
      setIsDeleting(false);
      setDeleteTargetPhoto(null);
    }
  };

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif font-normal tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="border border-garis text-merah bg-kertas-tua text-[10px] px-2.5 py-0.5 rounded-[2px] font-mono uppercase">
            ADMIN PORTOFOLIO
          </span>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/admin" className="text-sm font-mono text-tinta-lembut hover:text-merah transition-colors">
            ← Dashboard Admin
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="text-tinta-lembut hover:text-merah font-mono transition-colors text-sm"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        {!selectedCollection && (
          <div className="flex border-b border-garis mb-8 gap-8">
            <button
              onClick={() => setActiveTab('collections')}
              className={`pb-4 text-sm font-mono uppercase tracking-wider transition-colors relative ${
                activeTab === 'collections'
                  ? 'text-merah border-b-2 border-merah font-medium'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              Koleksi Adat & Budaya ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('eventTypes')}
              className={`pb-4 text-sm font-mono uppercase tracking-wider transition-colors relative ${
                activeTab === 'eventTypes'
                  ? 'text-merah border-b-2 border-merah font-medium'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              Jenis Acara / Prosesi ({eventTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('allPhotos')}
              className={`pb-4 text-sm font-mono uppercase tracking-wider transition-colors relative ${
                activeTab === 'allPhotos'
                  ? 'text-merah border-b-2 border-merah font-medium'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              Pustaka Foto ({photos.length})
            </button>
          </div>
        )}

        {/* VIEW 1: COLLECTIONS LIST */}
        {activeTab === 'collections' && !selectedCollection && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-serif font-normal text-tinta">Koleksi Adat & Budaya</h2>
                <p className="text-sm text-tinta-lembut mt-1">
                  Setiap koleksi memiliki halaman publik tersendiri di{' '}
                  <span className="font-mono text-xs text-merah">/portofolio/:slug</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateCollection}
                className="bg-merah hover:bg-merah-hover text-white px-5 py-2.5 rounded-[2px] text-sm font-medium flex items-center gap-2 min-h-[44px] shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Koleksi Adat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => {
                const palette = PORTFOLIO_PALETTES[col.theme_palette] || PORTFOLIO_PALETTES['hijau-botol'];
                const colPhotos = photos.filter((p) => p.collection_id === col.id);

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-[2px] border border-garis overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Photo */}
                      <div className="aspect-[16/10] bg-[#f7f5f0] relative overflow-hidden border-b border-garis">
                        {col.cover_url ? (
                          <img
                            src={col.cover_url}
                            alt={col.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-tinta-lembut text-xs font-mono">
                            <ImageIcon className="w-8 h-8 opacity-40 mb-1 text-tinta-lembut" />
                            <span>Belum ada foto sampul</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider rounded-[2px] border ${
                              col.status === 'published'
                                ? 'bg-kertas-tua text-tinta border-garis'
                                : 'bg-neutral-800/80 text-white border-transparent'
                            }`}
                          >
                            {col.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {/* Palette Indicator */}
                        <div
                          className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: palette.dark }}
                          title={`Tema: ${palette.name}`}
                        />
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <h3 className="font-serif text-xl font-normal text-tinta">
                            Adat {col.name}
                          </h3>
                          <span className="text-xs font-mono text-tinta-lembut">/{col.slug}</span>
                        </div>
                        <p className="text-xs text-tinta-lembut line-clamp-2 leading-relaxed mb-4">
                          {col.short_description}
                        </p>

                        <div className="text-[11px] text-tinta-lembut flex items-center justify-between border-t border-garis/60 pt-3 font-mono">
                          <span>{colPhotos.length} Foto terdaftar</span>
                          <span className="capitalize">Font: {col.theme_font}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-kertas-tua/40 border-t border-garis flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/portofolio/${col.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-tinta-lembut hover:text-merah transition-colors"
                          title="Buka Halaman Publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDuplicateCollection(col)}
                          className="p-2 text-tinta-lembut hover:text-merah transition-colors"
                          title="Duplikasi Koleksi"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetCollection(col)}
                          className="p-2 text-tinta-lembut hover:text-merah transition-colors"
                          title="Hapus Koleksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCollection(col);
                          setCollectionTab('dasar');
                        }}
                        className="px-4 py-1.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Kelola</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: EDIT SELECTED COLLECTION */}
        {selectedCollection && (
          <div>
            {/* Top Bar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-garis">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCollection(null)}
                  className="p-2 text-tinta-lembut hover:text-tinta transition-colors border border-garis rounded-[2px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[11px] uppercase font-mono tracking-widest text-merah block">
                    Mengedit Koleksi
                  </span>
                  <h2 className="text-2xl font-serif font-normal text-tinta">
                    Adat {selectedCollection.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/portofolio/${selectedCollection.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-garis hover:bg-white text-tinta text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors min-h-[44px]"
                >
                  <span>Lihat Publik</span>
                  <ExternalLink className="w-3.5 h-3.5 text-merah" />
                </a>

                <button
                  type="button"
                  onClick={handleSaveCollection}
                  disabled={isSavingCollection}
                  className="px-6 py-2 bg-merah hover:bg-merah-hover text-white text-xs font-medium rounded-[2px] flex items-center gap-2 transition-colors min-h-[44px] shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingCollection ? 'Menyimpan...' : 'Simpan Koleksi'}</span>
                </button>
              </div>
            </div>

            {/* Collection Sub-Tabs */}
            <div className="flex border-b border-garis mb-8 gap-6">
              <button
                type="button"
                onClick={() => setCollectionTab('dasar')}
                className={`pb-3 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  collectionTab === 'dasar'
                    ? 'text-merah border-b-2 border-merah font-medium'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>1. Dasar & Status</span>
              </button>

              <button
                type="button"
                onClick={() => setCollectionTab('tampilan')}
                className={`pb-3 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  collectionTab === 'tampilan'
                    ? 'text-merah border-b-2 border-merah font-medium'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. Palet & Layout</span>
              </button>

              <button
                type="button"
                onClick={() => setCollectionTab('konten')}
                className={`pb-3 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  collectionTab === 'konten'
                    ? 'text-merah border-b-2 border-merah font-medium'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>3. Teks & Editorial</span>
              </button>

              <button
                type="button"
                onClick={() => setCollectionTab('foto')}
                className={`pb-3 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  collectionTab === 'foto'
                    ? 'text-merah border-b-2 border-merah font-medium'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>4. Foto Koleksi</span>
              </button>
            </div>

            {/* SUB-TAB 1: DASAR & STATUS */}
            {collectionTab === 'dasar' && (
              <div className="max-w-2xl bg-white p-8 rounded-[2px] border border-garis space-y-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-2">
                    Nama Koleksi (Adat / Budaya)
                  </label>
                  <input
                    type="text"
                    value={selectedCollection.name}
                    onChange={(e) =>
                      setSelectedCollection({
                        ...selectedCollection,
                        name: e.target.value,
                      })
                    }
                    className="w-full border border-garis rounded-[2px] px-4 py-2.5 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    placeholder="Contoh: Melayu, Batak, Minang, Jawa, Sunda, Bugis"
                  />
                  <p className="text-[11px] text-tinta-lembut mt-1.5 font-mono">
                    Nama ini akan tampil di judul galeri dan pesan WhatsApp klien.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-2">
                    Slug URL
                  </label>
                  <div className="flex items-center">
                    <span className="bg-kertas-tua border border-r-0 border-garis rounded-l-[2px] px-3 py-2.5 text-xs text-tinta-lembut font-mono">
                      /portofolio/
                    </span>
                    <input
                      type="text"
                      value={selectedCollection.slug}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                        })
                      }
                      className="w-full border border-garis rounded-r-[2px] px-4 py-2.5 text-sm bg-white text-tinta font-mono focus:outline-none focus:border-merah"
                      placeholder="melayu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-2">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    value={selectedCollection.short_description || ''}
                    onChange={(e) =>
                      setSelectedCollection({
                        ...selectedCollection,
                        short_description: e.target.value,
                      })
                    }
                    className="w-full border border-garis rounded-[2px] px-4 py-2.5 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    placeholder="Satu atau dua kalimat kuratorial untuk ringkasan kartu portofolio..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-2">
                    Status Publikasi
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={selectedCollection.status === 'published'}
                        onChange={() =>
                          setSelectedCollection({ ...selectedCollection, status: 'published' })
                        }
                        className="text-merah focus:ring-merah"
                      />
                      <span className="text-sm font-medium text-tinta">Published (Tampil untuk Umum)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={selectedCollection.status === 'draft'}
                        onChange={() =>
                          setSelectedCollection({ ...selectedCollection, status: 'draft' })
                        }
                        className="text-merah focus:ring-merah"
                      />
                      <span className="text-sm font-medium text-tinta">Draft (Hanya Admin)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: PALET & TAMPILAN */}
            {collectionTab === 'tampilan' && (
              <div className="max-w-3xl bg-white p-8 rounded-[2px] border border-garis space-y-8">
                {/* Palette Selector */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-4">
                    Palet Warna Koleksi (5 Pilihan Teruji Rasio Kontras)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.keys(PORTFOLIO_PALETTES) as ThemePaletteKey[]).map((key) => {
                      const p = PORTFOLIO_PALETTES[key];
                      const isSelected = selectedCollection.theme_palette === key;

                      return (
                        <div
                          key={key}
                          onClick={() =>
                            setSelectedCollection({
                              ...selectedCollection,
                              theme_palette: key,
                            })
                          }
                          className={`cursor-pointer p-4 rounded-[2px] border transition-all ${
                            isSelected
                              ? 'border-merah ring-2 ring-merah bg-merah/5'
                              : 'border-garis hover:border-tinta bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-tinta">{p.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-merah" />}
                          </div>

                          {/* Swatch row */}
                          <div className="grid grid-cols-5 gap-1.5 h-8 rounded-[2px] overflow-hidden border border-garis">
                            <div style={{ backgroundColor: p.paper }} title="Paper" />
                            <div style={{ backgroundColor: p.mutedPaper }} title="Muted Paper" />
                            <div style={{ backgroundColor: p.ink }} title="Ink" />
                            <div style={{ backgroundColor: p.dark }} title="Dark" />
                            <div style={{ backgroundColor: p.accent }} title="Accent" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Selection */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-3">
                    Gaya Tipografi
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['default', 'editorial', 'classic'] as ThemeFontKey[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() =>
                          setSelectedCollection({
                            ...selectedCollection,
                            theme_font: f,
                          })
                        }
                        className={`p-4 border rounded-[2px] text-center capitalize transition-all ${
                          selectedCollection.theme_font === f
                            ? 'border-merah bg-merah/10 text-merah font-medium'
                            : 'border-garis hover:border-tinta text-tinta'
                        }`}
                      >
                        <span className="block font-serif text-lg mb-1">
                          {f === 'editorial' ? 'Editorial Italic' : f === 'classic' ? 'Classic Serif' : 'Default Playfair'}
                        </span>
                        <span className="text-[11px] text-tinta-lembut font-mono capitalize">{f}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Options */}
                <div className="border-t border-garis pt-6 space-y-5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-tinta-lembut">
                    Opsi Tata Letak (Layout)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Hero Side */}
                    <div>
                      <label className="block text-xs text-tinta-lembut font-mono mb-2">Posisi Foto Hero</label>
                      <select
                        value={selectedCollection.layout?.hero_side || 'left'}
                        onChange={(e) =>
                          setSelectedCollection({
                            ...selectedCollection,
                            layout: {
                              ...selectedCollection.layout,
                              hero_side: e.target.value as 'left' | 'right',
                            },
                          })
                        }
                        className="w-full border border-garis rounded-[2px] px-3.5 py-2.5 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      >
                        <option value="left">Foto di Kiri (Teks di Kanan)</option>
                        <option value="right">Foto di Kanan (Teks di Kiri)</option>
                      </select>
                    </div>

                    {/* Collage Variant */}
                    <div>
                      <label className="block text-xs text-tinta-lembut font-mono mb-2">Varian Kolase "Tentang"</label>
                      <select
                        value={selectedCollection.layout?.collage_variant || 'A'}
                        onChange={(e) =>
                          setSelectedCollection({
                            ...selectedCollection,
                            layout: {
                              ...selectedCollection.layout,
                              collage_variant: e.target.value as 'A' | 'B',
                            },
                          })
                        }
                        className="w-full border border-garis rounded-[2px] px-3.5 py-2.5 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      >
                        <option value="A">Varian A (1 Foto Besar + 2 Foto Kecil)</option>
                        <option value="B">Varian B (2 Kolom Sejajar Staggered)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: TEKS & KONTEN EDITORIAL */}
            {collectionTab === 'konten' && (
              <div className="max-w-3xl bg-white p-8 rounded-[2px] border border-garis space-y-6">
                <div className="border-b border-garis pb-6 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-merah">
                    1. Hero Section
                  </h4>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">Eyebrow Hero</label>
                    <input
                      type="text"
                      value={selectedCollection.content?.hero_eyebrow || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, hero_eyebrow: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">Judul Besar Serif</label>
                    <input
                      type="text"
                      value={selectedCollection.content?.hero_heading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, hero_heading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">Subjudul / Cerita Singkat</label>
                    <textarea
                      rows={3}
                      value={selectedCollection.content?.hero_subheading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, hero_subheading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                </div>

                <div className="border-b border-garis pb-6 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-merah">
                    2. Tentang Koleksi
                  </h4>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">Judul Tentang</label>
                    <input
                      type="text"
                      value={selectedCollection.content?.about_heading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, about_heading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">Deskripsi Kuratorial</label>
                    <textarea
                      rows={4}
                      value={selectedCollection.content?.about_description || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, about_description: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-merah">
                    3. WhatsApp Booking Template
                  </h4>
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Template Pesan Otomatis (Saat Klien Klik Tombol WA)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedCollection.content?.wa_message_template || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, wa_message_template: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: FOTO KOLEKSI */}
            {collectionTab === 'foto' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-tinta">Foto Dalam Koleksi Ini</h3>
                    <p className="text-xs text-tinta-lembut mt-1">
                      Foto-foto yang diunggah ke slot hero, tentang, momen sorotan, dan galeri arsip.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="bg-merah hover:bg-merah-hover text-white px-4 py-2 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto ke Koleksi</span>
                  </button>
                </div>

                {/* Photos List Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos
                    .filter((p) => p.collection_id === selectedCollection.id)
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white rounded-[2px] border border-garis overflow-hidden flex flex-col justify-between group"
                      >
                        <div className="aspect-[3/4] bg-[#f7f5f0] relative overflow-hidden">
                          <img
                            src={photo.image_url}
                            alt={photo.alt || 'Foto'}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: photo.focal || 'center' }}
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded-[2px] uppercase">
                            {photo.slot || 'gallery'}
                          </span>
                        </div>

                        <div className="p-3">
                          <p className="text-xs text-tinta font-serif italic line-clamp-1 mb-2">
                            {photo.caption || 'Tanpa keterangan'}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-garis">
                            <span className="text-[10px] text-tinta-lembut uppercase font-mono">
                              {photo.event_type_slug || 'Umum'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetPhoto(photo)}
                              className="p-1 text-tinta-lembut hover:text-merah transition-colors"
                              title="Hapus foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: EVENT TYPES MANAGER */}
        {activeTab === 'eventTypes' && !selectedCollection && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-white p-6 rounded-[2px] border border-garis">
              <h3 className="font-serif text-xl font-normal text-tinta mb-2">Tambah Jenis Acara / Prosesi</h3>
              <p className="text-xs text-tinta-lembut mb-4">
                Jenis acara dipakai sebagai tag per foto (misal: Lamaran, Akad, Resepsi, Siraman, Wisuda).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Nama Acara</label>
                  <input
                    type="text"
                    value={newEvName}
                    onChange={(e) => setNewEvName(e.target.value)}
                    className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    placeholder="Contoh: Akad Nikah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={newEvSlug}
                    onChange={(e) => setNewEvSlug(e.target.value)}
                    className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta font-mono focus:outline-none focus:border-merah"
                    placeholder="akad"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={newEvDesc}
                  onChange={(e) => setNewEvDesc(e.target.value)}
                  className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                  placeholder="Deskripsi satu kalimat..."
                />
              </div>

              <button
                type="button"
                onClick={handleAddEventType}
                className="bg-merah hover:bg-merah-hover text-white px-5 py-2.5 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Jenis Acara</span>
              </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2px] border border-garis overflow-hidden">
              <div className="p-4 bg-kertas-tua/50 border-b border-garis font-mono text-xs uppercase tracking-wider text-tinta-lembut">
                Daftar Jenis Acara ({eventTypes.length})
              </div>
              <div className="divide-y divide-garis/50">
                {eventTypes.map((evt) => (
                  <div key={evt.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-normal text-tinta">{evt.name}</span>
                        <span className="font-mono text-xs text-tinta-lembut">/{evt.slug}</span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-tinta-lembut mt-1">{evt.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEventType(evt.id, evt.slug)}
                      className="p-2 text-tinta-lembut hover:text-merah transition-colors"
                      title="Hapus Jenis Acara"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ALL PHOTOS LIBRARY */}
        {activeTab === 'allPhotos' && !selectedCollection && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-serif text-2xl font-normal text-tinta">Pustaka Foto Portofolio</h3>
                <p className="text-xs text-tinta-lembut mt-1">Seluruh foto yang pernah diunggah ke sistem portofolio.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="bg-merah hover:bg-merah-hover text-white px-5 py-2.5 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Foto Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-[2px] border border-garis overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-[3/4] bg-[#f7f5f0] relative overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.alt || 'Foto'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-tinta font-serif italic line-clamp-1 mb-2">
                      {photo.caption || 'Tanpa keterangan'}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-garis">
                      <span className="text-[10px] text-tinta-lembut uppercase font-mono">
                        {photo.category || photo.slot || 'Umum'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetPhoto(photo)}
                        className="p-1 text-tinta-lembut hover:text-merah transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* UPLOAD PHOTO MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPhotoModal(false)} />
          <div className="relative bg-white rounded-[2px] border border-garis w-full max-w-lg p-6 shadow-elevated z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-normal mb-4 text-tinta">Upload Foto Portofolio</h3>

            {/* File input */}
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    setUploadPreview(URL.createObjectURL(file));
                  }
                }}
                className="w-full text-xs font-mono text-tinta"
              />
            </div>

            {uploadPreview && (
              <div className="aspect-[16/10] bg-[#f7f5f0] rounded-[2px] overflow-hidden mb-4 border border-garis">
                <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Caption Foto</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full border border-garis rounded-[2px] px-3 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                  placeholder="Keterangan momen foto..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Slot Posisi di Halaman</label>
                <select
                  value={photoSlot}
                  onChange={(e) => setPhotoSlot(e.target.value as any)}
                  className="w-full border border-garis rounded-[2px] px-3 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                >
                  <option value="gallery">Galeri Arsip (Biasa)</option>
                  <option value="hero">Hero (Foto Utama Atas)</option>
                  <option value="about_1">Tentang Koleksi - Foto 1</option>
                  <option value="about_2">Tentang Koleksi - Foto 2</option>
                  <option value="about_3">Tentang Koleksi - Foto 3</option>
                  <option value="highlight">Momen Sorotan (Dark Section)</option>
                  <option value="event_cover">Sampul Jenis Acara</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Jenis Acara</label>
                <select
                  value={photoEventSlug}
                  onChange={(e) => setPhotoEventSlug(e.target.value)}
                  className="w-full border border-garis rounded-[2px] px-3 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                >
                  {eventTypes.map((evt) => (
                    <option key={evt.id} value={evt.slug}>
                      {evt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Titik Fokus (Focal Point)</label>
                <select
                  value={photoFocal}
                  onChange={(e) => setPhotoFocal(e.target.value)}
                  className="w-full border border-garis rounded-[2px] px-3 py-2 text-sm bg-white text-tinta capitalize focus:outline-none focus:border-merah"
                >
                  <option value="center">Center (Tengah)</option>
                  <option value="top center">Top Center (Atas)</option>
                  <option value="bottom center">Bottom Center (Bawah)</option>
                  <option value="center left">Center Left (Kiri)</option>
                  <option value="center right">Center Right (Kanan)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-garis">
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 border border-garis rounded-[2px] text-xs font-medium text-tinta-lembut hover:text-tinta min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={uploading || !uploadFile}
                className="px-5 py-2 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium min-h-[44px] shadow-sm disabled:opacity-50"
              >
                {uploading ? uploadProgress || 'Mengunggah...' : 'Unggah Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmDialog
        isOpen={deleteTargetPhoto !== null}
        title="Hapus Foto Portofolio"
        message="Apakah kamu yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeleteTargetPhoto(null)}
      />

      <ConfirmDialog
        isOpen={deleteTargetCollection !== null}
        title={`Hapus Koleksi "${deleteTargetCollection?.name}"`}
        message="Apakah kamu yakin ingin menghapus koleksi ini? Foto di dalamnya tidak akan terhapus dari basis data, namun halaman koleksi ini tidak akan dapat diakses lagi."
        confirmLabel="Ya, Hapus Koleksi"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteTargetCollection(null)}
      />
    </div>
  );
}
