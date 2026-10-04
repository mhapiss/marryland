// src/pages/PortfolioManager.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import ConfirmDialog from '../components/ConfirmDialog';
import { EditorWithPreview, PageSectionItem } from '../components/admin/EditorWithPreview';
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
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Save,
  Sparkles,
  X,
  Filter,
} from 'lucide-react';

export default function PortfolioManager() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Top level tabs (when no collection is selected)
  const [activeTab, setActiveTab] = useState<'collections' | 'eventTypes' | 'allPhotos'>('collections');

  // Collections state
  const [collections, setCollections] = useState<PortfolioCollection[]>(DEFAULT_COLLECTIONS);
  const [selectedCollection, setSelectedCollection] = useState<PortfolioCollection | null>(null);
  const [initialCollectionStr, setInitialCollectionStr] = useState<string>('');
  const [initialSlug, setInitialSlug] = useState<string>('');
  const [collectionTab, setCollectionTab] = useState<'dasar' | 'tampilan' | 'konten' | 'foto'>('konten');
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

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

  // Slot photo picker modal state
  const [slotPickerTarget, setSlotPickerTarget] = useState<PortfolioPhotoItem['slot'] | null>(null);

  // Delete modal state
  const [deleteTargetPhoto, setDeleteTargetPhoto] = useState<PortfolioPhotoItem | null>(null);
  const [deleteTargetCollection, setDeleteTargetCollection] = useState<PortfolioCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Upload in Collection Modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoAlt, setPhotoAlt] = useState('');
  const [photoSlot, setPhotoSlot] = useState<PortfolioPhotoItem['slot']>('gallery');
  const [photoEventSlug, setPhotoEventSlug] = useState('akad');
  const [photoFocal, setPhotoFocal] = useState('center');

  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);

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

  // Filter photos belonging to current selected collection
  const currentCollectionPhotos = useMemo(() => {
    if (!selectedCollection) return [];
    return photos.filter((p) => p.collection_id === selectedCollection.id);
  }, [photos, selectedCollection]);

  // Derived slot photos
  const heroPhoto = useMemo(() => {
    return currentCollectionPhotos.find((p) => p.slot === 'hero') || currentCollectionPhotos[0];
  }, [currentCollectionPhotos]);

  const aboutPhotos = useMemo(() => {
    return currentCollectionPhotos.filter((p) => p.slot?.startsWith('about_'));
  }, [currentCollectionPhotos]);

  const highlightPhotos = useMemo(() => {
    return currentCollectionPhotos.filter((p) => p.slot === 'highlight');
  }, [currentCollectionPhotos]);

  // Dirty state calculation
  const isDirty = useMemo(() => {
    if (!selectedCollection || !initialCollectionStr) return false;
    return JSON.stringify(selectedCollection) !== initialCollectionStr;
  }, [selectedCollection, initialCollectionStr]);

  // Select collection helper
  const handleSelectCollection = (col: PortfolioCollection) => {
    setSelectedCollection(col);
    setInitialCollectionStr(JSON.stringify(col));
    setInitialSlug(col.slug);
    setCollectionTab('konten');
  };

  // Publishing validation check
  const publishingRequirements = useMemo(() => {
    if (!selectedCollection) return [];
    return [
      {
        id: 'name',
        label: 'Nama koleksi terisi (minimal 3 huruf)',
        passed: (selectedCollection.name || '').trim().length >= 3,
      },
      {
        id: 'slug',
        label: 'Slug URL valid (huruf kecil, angka, dan tanda strip)',
        passed: Boolean(selectedCollection.slug && /^[a-z0-9-]+$/.test(selectedCollection.slug)),
      },
      {
        id: 'desc',
        label: 'Deskripsi kuratorial singkat terisi (minimal 10 huruf)',
        passed: (selectedCollection.short_description || '').trim().length >= 10,
      },
      {
        id: 'hero',
        label: 'Minimal 1 foto sampul hero dipilih',
        passed: Boolean(heroPhoto),
      },
      {
        id: 'photos',
        label: 'Minimal 5 foto diunggah ke koleksi ini',
        passed: currentCollectionPhotos.length >= 5,
        detail: `${currentCollectionPhotos.length}/5 foto`,
      },
    ];
  }, [selectedCollection, heroPhoto, currentCollectionPhotos.length]);

  const isPublishable = useMemo(() => {
    return publishingRequirements.every((r) => r.passed);
  }, [publishingRequirements]);

  // Save collection changes to Supabase
  const handleSaveCollection = async () => {
    if (!selectedCollection) return;
    setIsSavingCollection(true);

    try {
      const isNew = selectedCollection.id.startsWith('new-') || selectedCollection.id.startsWith('col-');

      // Check if published collection changed slug: record redirect
      const slugChanged = !isNew && initialSlug && selectedCollection.slug !== initialSlug;

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
        cover_url: heroPhoto ? heroPhoto.image_url : selectedCollection.cover_url || null,
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
        setInitialCollectionStr(JSON.stringify(data));
        setInitialSlug(data.slug);
      } else {
        const { error } = await supabase
          .from('portfolio_collections')
          .update(payload)
          .eq('id', selectedCollection.id);

        if (error) throw error;

        // If slug changed on published collection, try inserting redirect
        if (slugChanged && selectedCollection.status === 'published') {
          try {
            await supabase.from('slug_redirects').insert({
              entity_type: 'portfolio_collection',
              old_slug: initialSlug,
              new_slug: selectedCollection.slug,
            });
            toast.info(`Pengalihan dari /portofolio/${initialSlug} ke /portofolio/${selectedCollection.slug} telah dicatat.`);
          } catch {
            // Ignore if redirect table not yet run
          }
        }

        toast.success(`Perubahan koleksi "${payload.name}" berhasil disimpan`);
        setCollections((prev) =>
          prev.map((c) => (c.id === selectedCollection.id ? { ...c, ...payload } : c))
        );
        setInitialCollectionStr(JSON.stringify(selectedCollection));
        setInitialSlug(selectedCollection.slug);
      }

      // Clear local draft backup after successful server save
      localStorage.removeItem(`draft_portfolio_${selectedCollection.id}`);
    } catch (err: any) {
      toast.error('Gagal menyimpan koleksi: ' + (err.message || 'Coba lagi nanti'));
    } finally {
      setIsSavingCollection(false);
    }
  };

  // Create New Collection
  const handleCreateCollection = () => {
    const newId = `new-${Date.now()}`;
    const newCol: PortfolioCollection = {
      id: newId,
      name: 'Koleksi Baru',
      slug: `koleksi-baru-${Math.floor(Math.random() * 1000)}`,
      short_description: 'Deskripsi kuratorial singkat mengenai koleksi ini.',
      status: 'draft',
      theme_palette: 'merah-vintage',
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
    handleSelectCollection(newCol);
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
    handleSelectCollection(duplicated);
    toast.info('Koleksi disalin. Silakan sesuaikan nama dan slug lalu klik Simpan.');
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

        // Auto-optimize 1920px max edge
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

      const matchedEv = eventTypes.find((e) => e.slug === photoEventSlug);

      const targetColId = selectedCollection?.id?.startsWith('new-') || selectedCollection?.id?.startsWith('col-')
        ? null
        : selectedCollection?.id;

      const newPhotoData = {
        image_url: publicUrl,
        storage_path: storagePath,
        caption: photoCaption || null,
        alt: photoAlt || photoCaption || null,
        slot: photoSlot || 'gallery',
        collection_id: targetColId,
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

  // Assign photo to a specific slot
  const handleAssignPhotoToSlot = async (photoId: string, slot: PortfolioPhotoItem['slot']) => {
    try {
      // If photo was in another slot or another photo had this unique slot, handle assignment
      const { error } = await supabase
        .from('portfolio_photos')
        .update({ slot })
        .eq('id', photoId);

      if (error) throw error;

      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id === photoId) return { ...p, slot };
          // If singular slot like hero or about_1, reset previous holder to 'gallery'
          if (slot !== 'gallery' && slot !== 'highlight' && p.slot === slot) {
            return { ...p, slot: 'gallery' };
          }
          return p;
        })
      );

      toast.success(`Foto dialokasikan ke slot "${slot}"`);
      setSlotPickerTarget(null);
    } catch (err: any) {
      toast.error('Gagal mengatur slot foto: ' + err.message);
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
        await supabase.storage.from('media-library').remove([fileName]);
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

  // Jump to section in form & flash highlight
  const jumpToSectionCard = (sectionId: string) => {
    setCollectionTab('konten');
    setHighlightedCardId(sectionId);

    setTimeout(() => {
      const el = document.getElementById(`card-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedCardId(null);
    }, 2000);
  };

  // Page Map Section Items definition
  const pageMapSections: PageSectionItem[] = useMemo(() => {
    if (!selectedCollection) return [];
    return [
      {
        id: 'hero_section',
        label: '1. Hero & Sampul',
        isComplete: Boolean(selectedCollection.name && heroPhoto),
      },
      {
        id: 'about_section',
        label: '2. Pembuka & Kolase',
        isComplete: Boolean(selectedCollection.content?.about_heading && aboutPhotos.length > 0),
      },
      {
        id: 'events_section',
        label: '3. Rangkaian Acara',
        isComplete: Boolean(eventTypes.length > 0),
      },
      {
        id: 'highlight_section',
        label: '4. Momen Sorotan',
        isComplete: Boolean(highlightPhotos.length >= 3),
      },
      {
        id: 'testimonials_section',
        label: '5. Kutipan Pengantin',
        isComplete: Boolean(selectedCollection.content?.testimonials?.length),
      },
      {
        id: 'gallery_section',
        label: '6. Galeri Arsip',
        isComplete: Boolean(currentCollectionPhotos.length >= 5),
      },
      {
        id: 'cta_section',
        label: '7. Konsultasi WhatsApp',
        isComplete: Boolean(selectedCollection.content?.cta_heading),
      },
    ];
  }, [selectedCollection, heroPhoto, aboutPhotos.length, eventTypes.length, highlightPhotos.length, currentCollectionPhotos.length]);

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta flex flex-col">
      {/* Top Main Navigation Header */}
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

      {/* ========================================================================= */}
      {/* CASE A: NO COLLECTION SELECTED -> SHOW LIST VIEW */}
      {/* ========================================================================= */}
      {!selectedCollection && (
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
          {/* Navigation Tabs */}
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

          {/* VIEW 1: COLLECTIONS LIST */}
          {activeTab === 'collections' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-serif font-normal text-tinta">Koleksi Adat & Budaya</h2>
                  <p className="text-sm text-tinta-lembut mt-1">
                    Setiap koleksi memiliki halaman publik tersendiri di{' '}
                    <span className="font-mono text-xs text-merah">/portofolio/:slug</span> dengan editor pratinjau langsung.
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
                  const palette = PORTFOLIO_PALETTES[col.theme_palette] || PORTFOLIO_PALETTES['merah-vintage'];
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
                                  ? 'bg-kertas-tua text-tinta border-garis font-semibold'
                                  : 'bg-neutral-800/80 text-white border-transparent'
                              }`}
                            >
                              {col.status === 'published' ? 'Tayang' : 'Draf'}
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
                          onClick={() => handleSelectCollection(col)}
                          className="px-4 py-1.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Buka Editor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: EVENT TYPES MANAGER */}
          {activeTab === 'eventTypes' && (
            <div className="max-w-3xl space-y-8">
              <div className="bg-white p-6 rounded-[2px] border border-garis">
                <h3 className="font-serif text-xl font-normal text-tinta mb-2">Tambah Jenis Acara / Prosesi</h3>
                <p className="text-xs text-tinta-lembut mb-4">
                  Jenis acara dipakai sebagai filter dan penanda per foto (Lamaran, Akad, Resepsi, Siraman, Wisuda, dll).
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

              {/* Event Types List */}
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

          {/* VIEW 3: ALL PHOTOS LIBRARY */}
          {activeTab === 'allPhotos' && (
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
      )}

      {/* ========================================================================= */}
      {/* CASE B: COLLECTION SELECTED -> 3-ZONE EDITOR WITH LIVE PREVIEW */}
      {/* ========================================================================= */}
      {selectedCollection && (
        <EditorWithPreview
          title={`Adat ${selectedCollection.name}`}
          subtitle={`/portofolio/${selectedCollection.slug} • ${selectedCollection.status === 'published' ? 'Status: Tayang' : 'Status: Draf'}`}
          previewUrl="/admin/pratinjau/koleksi"
          draftData={{
            collection: selectedCollection,
            photos: currentCollectionPhotos,
            eventTypes,
          }}
          isDirty={isDirty}
          isSaving={isSavingCollection}
          onSave={handleSaveCollection}
          pageSections={pageMapSections}
          highlightedSectionId={highlightedCardId}
          onSelectSection={(secId) => jumpToSectionCard(secId)}
          localStorageKey={`draft_portfolio_${selectedCollection.id}`}
          onRestoreLocalDraft={(draft) => {
            if (draft.collection) {
              setSelectedCollection(draft.collection);
            }
          }}
          topActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCollection(null)}
                className="px-3 py-1.5 border border-garis bg-white hover:bg-kertas-tua text-tinta rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daftar Koleksi</span>
              </button>

              <a
                href={`/portofolio/${selectedCollection.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 border border-garis bg-white hover:bg-kertas-tua text-tinta rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Buka halaman publik di tab baru"
              >
                <span className="hidden sm:inline">Lihat Publik</span>
                <ExternalLink className="w-3.5 h-3.5 text-merah" />
              </a>

              {/* Publish Toggle Button */}
              {selectedCollection.status === 'draft' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isPublishable) {
                      setShowValidationModal(true);
                    } else {
                      setSelectedCollection({
                        ...selectedCollection,
                        status: 'published',
                      });
                      toast.success('Status diubah ke "Tayang". Klik Simpan untuk menerapkan.');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isPublishable
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-kertas-tua text-tinta-lembut border border-garis'
                  }`}
                  title="Terbitkan koleksi ke publik"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Terbitkan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCollection({
                      ...selectedCollection,
                      status: 'draft',
                    });
                    toast.info('Status diubah ke "Draf". Koleksi disembunyikan dari umum.');
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Kembalikan status ke Draf"
                >
                  <span>Tarik ke Draf</span>
                </button>
              )}
            </div>
          }
          quickStart={
            currentCollectionPhotos.length < 5 ? (
              <div className="bg-white border border-garis p-4 rounded-[2px] shadow-2xs mb-2">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-wider text-merah font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Panduan Cepat Pembuatan Koleksi (3 Langkah)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div
                    onClick={() => setCollectionTab('dasar')}
                    className="p-3 bg-kertas-tua/40 border border-garis rounded-[2px] cursor-pointer hover:border-merah/50 transition-colors"
                  >
                    <span className="font-semibold block mb-0.5">1. Isi Info Dasar</span>
                    <span className="text-tinta-lembut">Tentukan nama adat, slug URL, dan deskripsi kuratorial.</span>
                  </div>
                  <div
                    onClick={() => setShowPhotoModal(true)}
                    className="p-3 bg-kertas-tua/40 border border-garis rounded-[2px] cursor-pointer hover:border-merah/50 transition-colors"
                  >
                    <span className="font-semibold block mb-0.5">2. Upload Foto Koleksi</span>
                    <span className="text-tinta-lembut">Unggah minimal 5 foto (disarankan foto potret 3:4 untuk hero).</span>
                  </div>
                  <div
                    onClick={() => setCollectionTab('tampilan')}
                    className="p-3 bg-kertas-tua/40 border border-garis rounded-[2px] cursor-pointer hover:border-merah/50 transition-colors"
                  >
                    <span className="font-semibold block mb-0.5">3. Pilih Tata Letak & Terbitkan</span>
                    <span className="text-tinta-lembut">Atur palet warna, tipografi, dan klik Terbitkan.</span>
                  </div>
                </div>
              </div>
            ) : null
          }
        >
          {/* Published slug modification alert */}
          {selectedCollection.status === 'published' && initialSlug && selectedCollection.slug !== initialSlug && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-[2px] text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Peringatan Pengubahan Slug URL Koleksi Tayang</span>
                <span>
                  Koleksi ini berstatus "Tayang". Mengubah slug dari{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">/portofolio/{initialSlug}</code> ke{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">/portofolio/{selectedCollection.slug}</code>{' '}
                  dapat memutuskan tautan yang sudah tersebar ke klien. Pengalihan otomatis akan didaftarkan ke sistem redirect saat disimpan.
                </span>
              </div>
            </div>
          )}

          {/* Collection Sub-Tabs Bar */}
          <div className="flex border-b border-garis pb-2 gap-6 bg-white p-4 rounded-[2px] border">
            <button
              type="button"
              onClick={() => setCollectionTab('konten')}
              className={`pb-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                collectionTab === 'konten'
                  ? 'text-merah border-b-2 border-merah font-semibold'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Konten Halaman (Teks & Foto)</span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionTab('dasar')}
              className={`pb-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                collectionTab === 'dasar'
                  ? 'text-merah border-b-2 border-merah font-semibold'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Dasar & Status</span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionTab('tampilan')}
              className={`pb-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                collectionTab === 'tampilan'
                  ? 'text-merah border-b-2 border-merah font-semibold'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Tampilan & Tema</span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionTab('foto')}
              className={`pb-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                collectionTab === 'foto'
                  ? 'text-merah border-b-2 border-merah font-semibold'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Pustaka Koleksi ({currentCollectionPhotos.length})</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: KONTEN HALAMAN (MAIN TAB - COMBINED TEXT & PHOTO SLOTS PER SECTION) */}
          {/* ========================================================================= */}
          {collectionTab === 'konten' && (
            <div className="space-y-6">
              {/* CARD 1: HERO SECTION */}
              <div
                id="card-hero_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'hero_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      1
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Hero (Judul & Foto Sampul)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    Slot: Hero
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left: Text inputs */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-tinta-lembut mb-1">
                        Eyebrow (Label Kecil Atas)
                      </label>
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
                        placeholder="Contoh: KOLEKSI DOKUMENTASI"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-tinta-lembut mb-1">
                        Judul Besar Serif
                      </label>
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
                        placeholder={`Dokumentasi Adat ${selectedCollection.name}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-tinta-lembut mb-1">
                        Subjudul / Cerita Singkat
                      </label>
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
                        placeholder="Kalimat pengantar yang menonjolkan esensi liputan adat ini..."
                      />
                    </div>
                  </div>

                  {/* Right: Hero Photo Slot */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-mono text-tinta-lembut mb-2 block self-start">
                      Foto Sampul Hero (Rasio 3:4)
                    </span>
                    {heroPhoto ? (
                      <div className="relative group w-full max-w-[220px] aspect-[3/4] rounded-[2px] overflow-hidden border border-garis bg-[#f7f5f0]">
                        <img
                          src={heroPhoto.image_url}
                          alt={heroPhoto.alt || 'Foto Hero'}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: heroPhoto.focal || 'center' }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setSlotPickerTarget('hero')}
                            className="px-3 py-1.5 bg-white text-tinta rounded-[2px] text-xs font-medium hover:bg-kertas-tua transition-colors"
                          >
                            Ganti Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setSlotPickerTarget('hero')}
                        className="w-full max-w-[220px] aspect-[3/4] border-2 border-dashed border-garis hover:border-merah rounded-[2px] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-kertas-tua/40 hover:bg-merah/5"
                      >
                        <ImageIcon className="w-8 h-8 text-tinta-lembut mb-2 opacity-50" />
                        <span className="text-xs font-medium text-tinta">Pilih Foto Hero</span>
                        <span className="text-[10px] text-tinta-lembut font-mono mt-1">Potret 3:4</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: ABOUT SECTION */}
              <div
                id="card-about_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'about_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      2
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Pembuka (Tentang & Kolase Foto)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    Slot: about_1, about_2, about_3
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Eyebrow Tentang
                    </label>
                    <input
                      type="text"
                      value={selectedCollection.content?.about_eyebrow || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, about_eyebrow: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="TENTANG KOLEKSI"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Judul Tentang
                    </label>
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
                      placeholder="Kehangatan Tradisi dalam Bingkai Editorial"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Deskripsi Kuratorial
                    </label>
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
                      placeholder="Ceritakan pendekatan liputan, makna tradisi, dan sentuhan kehangatan keluarga..."
                    />
                  </div>
                </div>

                {/* Collage Photo Slots */}
                <div>
                  <span className="text-xs font-mono uppercase text-tinta-lembut mb-3 block">
                    Slot Foto Kolase (3 Posisi)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['about_1', 'about_2', 'about_3'] as const).map((slotKey, idx) => {
                      const photoInSlot = currentCollectionPhotos.find((p) => p.slot === slotKey);

                      return (
                        <div
                          key={slotKey}
                          className="border border-garis rounded-[2px] p-3 bg-kertas-tua/20 flex flex-col justify-between"
                        >
                          <div className="aspect-[4/3] bg-white rounded-[2px] overflow-hidden border border-garis mb-2 relative group">
                            {photoInSlot ? (
                              <img
                                src={photoInSlot.image_url}
                                alt={`Kolase ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-tinta-lembut text-xs">
                                <span className="font-mono text-[11px]">Foto Kolase {idx + 1}</span>
                                <span className="text-[10px] text-tinta-lembut opacity-70">Belum terisi</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] font-mono text-tinta-lembut capitalize">
                              Slot {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSlotPickerTarget(slotKey)}
                              className="text-xs text-merah font-medium hover:underline"
                            >
                              {photoInSlot ? 'Ganti' : 'Pilih Foto'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 3: EVENTS SECTION */}
              <div
                id="card-events_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'events_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      3
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Rangkaian Acara (Prosesi)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCollection(null);
                      setActiveTab('eventTypes');
                    }}
                    className="text-xs text-merah font-medium hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Kelola Jenis Acara ({eventTypes.length})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-kertas-tua/40 rounded-[2px] border border-garis">
                  <div>
                    <span className="text-xs font-medium text-tinta block mb-0.5">
                      Gaya Kartu Bertingkat (Staggered Layout)
                    </span>
                    <span className="text-[11px] text-tinta-lembut">
                      Memberikan ritme visual editorial dengan menggeser kartu genap ke bawah secara dinamis.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCollection({
                        ...selectedCollection,
                        layout: {
                          ...selectedCollection.layout,
                          event_cards_staggered: !selectedCollection.layout?.event_cards_staggered,
                        },
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      selectedCollection.layout?.event_cards_staggered ?? true ? 'bg-merah' : 'bg-garis'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        selectedCollection.layout?.event_cards_staggered ?? true ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* CARD 4: HIGHLIGHT SECTION */}
              <div
                id="card-highlight_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'highlight_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      4
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Momen Sorotan (Dark Showcase Section)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    Slot: highlight ({highlightPhotos.length}/3)
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Eyebrow Sorotan
                    </label>
                    <input
                      type="text"
                      value={selectedCollection.content?.highlight_eyebrow || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, highlight_eyebrow: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="MOMEN SOROTAN"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Judul Momen Sorotan
                    </label>
                    <input
                      type="text"
                      value={selectedCollection.content?.highlight_heading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, highlight_heading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="Detail dan Emosi yang Terpatri"
                    />
                  </div>
                </div>

                {/* 3 Showcase Photos Slots */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase text-tinta-lembut">
                      3 Foto Sorotan Utama (Kiri, Pusat Skala Terbesar, Kanan)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSlotPickerTarget('highlight')}
                      className="text-xs text-merah font-medium hover:underline font-mono"
                    >
                      + Tambah Foto Sorotan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((idx) => {
                      const photo = highlightPhotos[idx];

                      return (
                        <div
                          key={idx}
                          className="border border-garis rounded-[2px] p-3 bg-neutral-900 text-white flex flex-col justify-between"
                        >
                          <div className="aspect-[3/4] bg-neutral-800 rounded-[2px] overflow-hidden mb-2 relative group">
                            {photo ? (
                              <img
                                src={photo.image_url}
                                alt={`Sorotan ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white/50 text-xs p-4 text-center font-mono">
                                <span>Slot Sorotan {idx === 1 ? '2 (Pusat)' : `${idx + 1}`}</span>
                                <span className="text-[10px] opacity-70 mt-1">Kosong</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="font-mono text-[10px] text-white/70">
                              {idx === 1 ? 'Pusat (Terbesar)' : `Sayap ${idx === 0 ? 'Kiri' : 'Kanan'}`}
                            </span>
                            {photo && (
                              <button
                                type="button"
                                onClick={() => handleAssignPhotoToSlot(photo.id, 'gallery')}
                                className="text-[10px] text-red-400 hover:underline"
                              >
                                Lepas Slot
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 5: TESTIMONIALS SECTION */}
              <div
                id="card-testimonials_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'testimonials_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      5
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Kutipan / Testimoni Pengantin
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedCollection.content?.testimonials || [];
                      setSelectedCollection({
                        ...selectedCollection,
                        content: {
                          ...selectedCollection.content,
                          testimonials: [
                            ...current,
                            {
                              quote: 'Dokumentasi by.marryland menangkap setiap senyum dan rasa haru tanpa terasa kaku.',
                              couple_names: 'Rian & Sarah',
                              event_date: 'Oktober 2026',
                            },
                          ],
                        },
                      });
                    }}
                    className="text-xs text-merah font-medium hover:underline flex items-center gap-1 font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kutipan</span>
                  </button>
                </div>

                {(!selectedCollection.content?.testimonials || selectedCollection.content.testimonials.length === 0) ? (
                  <p className="text-xs text-tinta-lembut italic font-serif">
                    Belum ada kutipan pengantin. Bagian ini akan disembunyikan di halaman publik sampai kamu menambahkannya.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedCollection.content.testimonials.map((t, tIdx) => (
                      <div key={tIdx} className="p-4 bg-kertas-tua/30 border border-garis rounded-[2px] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-medium text-tinta">
                            Kutipan #{tIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedCollection.content?.testimonials?.filter((_, i) => i !== tIdx);
                              setSelectedCollection({
                                ...selectedCollection,
                                content: {
                                  ...selectedCollection.content,
                                  testimonials: updated,
                                },
                              });
                            }}
                            className="text-xs text-red-700 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-tinta-lembut mb-1">
                            Teks Kutipan Pengantin
                          </label>
                          <textarea
                            rows={2}
                            value={t.quote}
                            onChange={(e) => {
                              const copy = [...(selectedCollection.content?.testimonials || [])];
                              copy[tIdx] = { ...copy[tIdx], quote: e.target.value };
                              setSelectedCollection({
                                ...selectedCollection,
                                content: { ...selectedCollection.content, testimonials: copy },
                              });
                            }}
                            className="w-full border border-garis rounded-[2px] p-2 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-mono text-tinta-lembut mb-1">
                              Nama Mempelai
                            </label>
                            <input
                              type="text"
                              value={t.couple_names}
                              onChange={(e) => {
                                const copy = [...(selectedCollection.content?.testimonials || [])];
                                copy[tIdx] = { ...copy[tIdx], couple_names: e.target.value };
                                setSelectedCollection({
                                  ...selectedCollection,
                                  content: { ...selectedCollection.content, testimonials: copy },
                                });
                              }}
                              className="w-full border border-garis rounded-[2px] px-3 py-1.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono text-tinta-lembut mb-1">
                              Tanggal Acara
                            </label>
                            <input
                              type="text"
                              value={t.event_date || ''}
                              onChange={(e) => {
                                const copy = [...(selectedCollection.content?.testimonials || [])];
                                copy[tIdx] = { ...copy[tIdx], event_date: e.target.value };
                                setSelectedCollection({
                                  ...selectedCollection,
                                  content: { ...selectedCollection.content, testimonials: copy },
                                });
                              }}
                              className="w-full border border-garis rounded-[2px] px-3 py-1.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              placeholder="Oktober 2026"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 6: GALLERY SECTION */}
              <div
                id="card-gallery_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'gallery_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      6
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Galeri Arsip Lengkap
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    {currentCollectionPhotos.length} Foto Terdaftar
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-kertas-tua/40 rounded-[2px] border border-garis">
                  <div>
                    <span className="text-xs font-medium text-tinta block mb-0.5">
                      Kelola dan Unggah Foto Tambahan
                    </span>
                    <span className="text-[11px] text-tinta-lembut">
                      Semua foto yang tidak ditetapkan ke slot hero atau tentang akan otomatis masuk ke grid galeri arsip ini.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCollectionTab('foto')}
                    className="px-4 py-2 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Buka Pustaka Foto</span>
                  </button>
                </div>
              </div>

              {/* CARD 7: CTA SECTION */}
              <div
                id="card-cta_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'cta_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      7
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Konsultasi WhatsApp & Penutup
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    Slot: CTA
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Judul Ajakan Konsultasi
                    </label>
                    <input
                      type="text"
                      value={selectedCollection.content?.cta_heading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, cta_heading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="Rencanakan Dokumentasi Hari Bahagiamu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Subjudul Ajakan Konsultasi
                    </label>
                    <textarea
                      rows={2}
                      value={selectedCollection.content?.cta_subheading || ''}
                      onChange={(e) =>
                        setSelectedCollection({
                          ...selectedCollection,
                          content: { ...selectedCollection.content, cta_subheading: e.target.value },
                        })
                      }
                      className="w-full border border-garis rounded-[2px] px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="Hubungi kami untuk memastikan ketersediaan tanggal dan berdiskusi..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-tinta-lembut mb-1">
                      Template Pesan Otomatis WhatsApp (Saat Klien Menekan Tombol Konsultasi)
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
                      placeholder="Halo by.marryland, saya tertarik dengan dokumentasi adat ini..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DASAR & STATUS */}
          {/* ========================================================================= */}
          {collectionTab === 'dasar' && (
            <div className="bg-white p-6 sm:p-8 rounded-[2px] border border-garis space-y-6">
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
                  Deskripsi Kuratorial Singkat
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
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={selectedCollection.status === 'published'}
                      onChange={() => {
                        if (!isPublishable) {
                          setShowValidationModal(true);
                        } else {
                          setSelectedCollection({ ...selectedCollection, status: 'published' });
                        }
                      }}
                      className="text-merah focus:ring-merah"
                    />
                    <span className="text-sm font-medium text-tinta">Tayang (Tampil untuk Umum)</span>
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
                    <span className="text-sm font-medium text-tinta">Draf (Hanya Admin)</span>
                  </label>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="pt-4 border-t border-garis">
                <span className="text-xs font-mono uppercase tracking-wider text-tinta-lembut block mb-3">
                  Kelayakan Sebelum Terbitkan (Syarat Minimal)
                </span>
                <div className="space-y-2">
                  {publishingRequirements.map((req) => (
                    <div key={req.id} className="flex items-center gap-2 text-xs">
                      {req.passed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-amber-500 text-amber-600 flex items-center justify-center text-[10px] shrink-0">
                          !
                        </span>
                      )}
                      <span className={req.passed ? 'text-tinta' : 'text-amber-800'}>
                        {req.label} {req.detail && `(${req.detail})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TAMPILAN & TEMA */}
          {/* ========================================================================= */}
          {collectionTab === 'tampilan' && (
            <div className="bg-white p-6 sm:p-8 rounded-[2px] border border-garis space-y-8">
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

          {/* ========================================================================= */}
          {/* TAB 4: PUSTAKA KOLEKSI */}
          {/* ========================================================================= */}
          {collectionTab === 'foto' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-xl font-normal text-tinta">Foto Dalam Koleksi Ini</h3>
                  <p className="text-xs text-tinta-lembut mt-1">
                    Kelola foto, tentukan slot tampilan, kategori prosesi acara, dan titik fokus.
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

              {currentCollectionPhotos.length === 0 ? (
                <div className="text-center py-16 bg-white border border-garis rounded-[2px] p-8">
                  <ImageIcon className="w-12 h-12 text-tinta-lembut opacity-40 mx-auto mb-3" />
                  <h4 className="font-serif text-lg text-tinta mb-1">Belum Ada Foto di Koleksi Ini</h4>
                  <p className="text-xs text-tinta-lembut max-w-sm mx-auto mb-6">
                    Unggah foto liputan pertamamu agar koleksi dapat ditampilkan di halaman publik dan pratinjau.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-5 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Foto Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentCollectionPhotos.map((photo) => (
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
                          <span className="text-[10px] text-tinta-lembut uppercase font-mono truncate max-w-[80px]">
                            {photo.event_type_slug || 'Umum'}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Fast slot assigner */}
                            <select
                              value={photo.slot || 'gallery'}
                              onChange={(e) => handleAssignPhotoToSlot(photo.id, e.target.value as any)}
                              className="text-[10px] font-mono border border-garis rounded p-0.5 bg-white text-tinta"
                              title="Ubah slot foto"
                            >
                              <option value="gallery">Galeri</option>
                              <option value="hero">Hero</option>
                              <option value="about_1">Tentang 1</option>
                              <option value="about_2">Tentang 2</option>
                              <option value="about_3">Tentang 3</option>
                              <option value="highlight">Sorotan</option>
                            </select>

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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </EditorWithPreview>
      )}

      {/* ========================================================================= */}
      {/* SLOT PICKER MODAL (From existing collection photos) */}
      {/* ========================================================================= */}
      {slotPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSlotPickerTarget(null)}
          />
          <div className="relative bg-white rounded-[2px] border border-garis w-full max-w-2xl p-6 shadow-elevated z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-garis pb-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-tinta">
                  Pilih Foto untuk Slot: <span className="text-merah uppercase font-mono">{slotPickerTarget}</span>
                </h3>
                <p className="text-xs text-tinta-lembut mt-0.5">
                  Klik foto di bawah ini untuk mengalokasikannya ke slot tersebut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlotPickerTarget(null)}
                className="p-1 text-tinta-lembut hover:text-tinta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {currentCollectionPhotos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleAssignPhotoToSlot(p.id, slotPickerTarget)}
                  className={`group cursor-pointer rounded-[2px] overflow-hidden border transition-all ${
                    p.slot === slotPickerTarget
                      ? 'border-merah ring-2 ring-merah'
                      : 'border-garis hover:border-merah'
                  }`}
                >
                  <div className="aspect-[3/4] bg-[#f7f5f0] relative">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    {p.slot && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-mono rounded">
                        {p.slot}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-garis flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPhotoSlot(slotPickerTarget);
                  setShowPhotoModal(true);
                  setSlotPickerTarget(null);
                }}
                className="text-xs text-merah font-medium hover:underline flex items-center gap-1 font-mono"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Foto Baru ke Slot Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSlotPickerTarget(null)}
                className="px-4 py-2 border border-garis rounded-[2px] text-xs font-medium text-tinta"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PUBLISHING VALIDATION MODAL */}
      {/* ========================================================================= */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowValidationModal(false)}
          />
          <div className="relative bg-white rounded-[2px] border border-garis w-full max-w-md p-6 shadow-elevated z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-normal text-tinta">
                  Belum Memenuhi Syarat Tayang
                </h3>
                <p className="text-xs text-tinta-lembut">Lengkapi poin berikut sebelum menerbitkan:</p>
              </div>
            </div>

            <div className="space-y-2.5 my-4 bg-kertas-tua/40 p-4 rounded-[2px] border border-garis">
              {publishingRequirements.map((req) => (
                <div key={req.id} className="flex items-start gap-2.5 text-xs">
                  {req.passed ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-amber-600 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✕
                    </span>
                  )}
                  <span className={req.passed ? 'text-tinta-lembut line-through' : 'text-amber-900 font-medium'}>
                    {req.label} {req.detail && `(${req.detail})`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-5 py-2 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium"
              >
                Saya Mengerti, Lengkapi Dulu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD PHOTO MODAL */}
      {/* ========================================================================= */}
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
        open={deleteTargetPhoto !== null}
        title="Hapus Foto Portofolio"
        message="Apakah kamu yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        destructive={true}
        loading={isDeleting}
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeleteTargetPhoto(null)}
      />

      <ConfirmDialog
        open={deleteTargetCollection !== null}
        title={`Hapus Koleksi "${deleteTargetCollection?.name}"`}
        message="Apakah kamu yakin ingin menghapus koleksi ini? Foto di dalamnya tidak akan terhapus dari basis data, namun halaman koleksi ini tidak akan dapat diakses lagi."
        confirmLabel="Ya, Hapus Koleksi"
        destructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteTargetCollection(null)}
      />
    </div>
  );
}
