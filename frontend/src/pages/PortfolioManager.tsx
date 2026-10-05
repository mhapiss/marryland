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
  Crop,
  Star,
  Info,
} from 'lucide-react';
import ImageCropperModal from '../components/ImageCropperModal';

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait' | 'square';
  selected: boolean;
  slot: PortfolioPhotoItem['slot'];
  caption: string;
  focal: string;
}

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
  const [slotPickerTarget, setSlotPickerTarget] = useState<PortfolioPhotoItem['slot'] | 'cover' | null>(null);

  // Delete modal state
  const [deleteTargetPhoto, setDeleteTargetPhoto] = useState<PortfolioPhotoItem | null>(null);
  const [deleteTargetCollection, setDeleteTargetCollection] = useState<PortfolioCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Upload in Collection Modal (Mendukung Batch / Multi-Upload & Seleksi Pilihan)
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [activeFocalQueueId, setActiveFocalQueueId] = useState<string | null>(null);
  const [batchTargetSlot, setBatchTargetSlot] = useState<PortfolioPhotoItem['slot']>('gallery');
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoSlot, setPhotoSlot] = useState<PortfolioPhotoItem['slot']>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper Modal state
  const [cropperState, setCropperState] = useState<{
    open: boolean;
    imageUrl: string;
    fileName?: string;
    targetType: 'queue' | 'existing' | 'cover';
    queueItemId?: string;
    photoItem?: PortfolioPhotoItem;
    suggestedRatio?: number | null;
  }>({
    open: false,
    imageUrl: '',
    targetType: 'queue',
  });

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

  const coverPhotoUrl = useMemo(() => {
    if (!selectedCollection) return null;
    return (
      selectedCollection.cover_url ||
      (selectedCollection.content as any)?.cover_url ||
      heroPhoto?.image_url ||
      null
    );
  }, [selectedCollection, heroPhoto]);

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

      const payload: Record<string, any> = {
        name: selectedCollection.name,
        slug: selectedCollection.slug,
        short_description: selectedCollection.short_description,
        status: selectedCollection.status,
        theme_palette: selectedCollection.theme_palette,
        theme_font: selectedCollection.theme_font,
        layout: selectedCollection.layout,
        content: {
          ...selectedCollection.content,
          cover_url:
            selectedCollection.cover_url ||
            (selectedCollection.content as any)?.cover_url ||
            (heroPhoto ? heroPhoto.image_url : null),
        },
        position: selectedCollection.position || 0,
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

  const getSlotLabel = (slot: PortfolioPhotoItem['slot']) => {
    switch (slot) {
      case 'hero':
        return 'Hero (Foto Utama Atas)';
      case 'highlight':
        return 'Momen Sorotan (Infinity)';
      case 'about_1':
        return 'Tentang Koleksi - Foto 1';
      case 'about_2':
        return 'Tentang Koleksi - Foto 2';
      case 'about_3':
        return 'Tentang Koleksi - Foto 3';
      case 'gallery':
      default:
        return 'Galeri Arsip';
    }
  };

  // Bersihkan memory preview URL
  const handleClearQueue = useCallback(() => {
    uploadQueue.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // no-op
      }
    });
    setUploadQueue([]);
    setActiveFocalQueueId(null);
  }, [uploadQueue]);

  const handleClosePhotoModal = () => {
    if (uploading) return;
    handleClearQueue();
    setShowPhotoModal(false);
  };

  // Proses file yang dipilih dari input file atau dropzone
  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error('Pilihlah berkas gambar (JPG, PNG, atau WEBP)');
      return;
    }

    const newItems: UploadQueueItem[] = fileArray.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      return {
        id,
        file,
        previewUrl,
        width: 1200,
        height: 800,
        orientation: 'landscape',
        selected: true,
        slot: photoSlot || 'gallery',
        caption: '',
        focal: 'center',
      };
    });

    // Deteksi dimensi dan orientasi masing-masing gambar
    newItems.forEach((item) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const orientation: 'landscape' | 'portrait' | 'square' =
          w > h ? 'landscape' : h > w ? 'portrait' : 'square';
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, width: w, height: h, orientation } : q))
        );
      };
      img.src = item.previewUrl;
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
    toast.info(`${fileArray.length} foto ditambahkan ke antrean. Pilih mana yang mau diunggah.`);
  };

  const handleToggleSelectItem = (id: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setUploadQueue((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // no-op
        }
      }
      return prev.filter((item) => item.id !== id);
    });
    if (activeFocalQueueId === id) {
      setActiveFocalQueueId(null);
    }
  };

  const handleUpdateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleApplyBatchSlot = () => {
    const selectedCount = uploadQueue.filter((item) => item.selected).length;
    if (selectedCount === 0) {
      toast.error('Centang foto yang ingin diubah slotnya terlebih dahulu');
      return;
    }
    setUploadQueue((prev) =>
      prev.map((item) => (item.selected ? { ...item, slot: batchTargetSlot } : item))
    );
    toast.success(`Slot berhasil diubah ke "${getSlotLabel(batchTargetSlot)}" untuk ${selectedCount} foto terpilih`);
  };

  // Batch Upload Photo to Collection
  const handleBatchPhotoUpload = async () => {
    const selectedItems = uploadQueue.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 foto yang ingin diunggah');
      return;
    }

    setUploading(true);
    let successCount = 0;
    const total = selectedItems.length;

    try {
      const targetColId =
        selectedCollection?.id?.startsWith('new-') || selectedCollection?.id?.startsWith('col-')
          ? null
          : selectedCollection?.id;

      let lastHeroUrl: string | null = null;
      const uploadedPhotosList: PortfolioPhotoItem[] = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const progressPct = Math.round(((i + 1) / total) * 100);
        setUploadProgress(`Mengunggah foto ${i + 1} dari ${total} (${progressPct}%): ${item.file.name}`);

        let width = item.width;
        let height = item.height;
        let uploadBlob: Blob = item.file;
        let isWebP = false;

        try {
          const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
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

        const fileExt = isWebP ? 'webp' : (item.file.name.split('.').pop() || 'jpg');
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const storagePath = `portfolio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(fileName, uploadBlob, {
            contentType: isWebP ? 'image/webp' : item.file.type,
            cacheControl: '31536000',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('media-library').getPublicUrl(fileName);

        if (item.slot === 'hero') {
          lastHeroUrl = publicUrl;
        }

        const newPhotoData = {
          image_url: publicUrl,
          storage_path: storagePath,
          caption: item.caption || null,
          alt: item.caption || null,
          slot: item.slot || 'gallery',
          collection_id: targetColId,
          category: 'pernikahan',
          focal: item.focal || 'center',
          width,
          height,
          order_index: photos.length + i + 1,
          is_published: true,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('portfolio_photos')
          .insert(newPhotoData)
          .select()
          .single();

        if (insertError) throw insertError;

        uploadedPhotosList.push(inserted);
        successCount++;
      }

      setPhotos((prev) => [...prev, ...uploadedPhotosList]);

      if (lastHeroUrl && selectedCollection) {
        setSelectedCollection({
          ...selectedCollection,
          cover_url: lastHeroUrl,
        });
      }

      toast.success(`${successCount} foto berhasil diunggah ke koleksi`);
      handleClearQueue();
      setShowPhotoModal(false);
    } catch (err: any) {
      toast.error('Gagal mengupload foto: ' + (err.message || 'Coba lagi'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Terapkan hasil potongan (crop) foto
  const handleApplyCrop = async (
    croppedBlob: Blob,
    previewUrl: string,
    width: number,
    height: number
  ) => {
    if (cropperState.targetType === 'queue' && cropperState.queueItemId) {
      // 1. Potong foto yang ada di antrean upload masal
      const itemId = cropperState.queueItemId;
      setUploadQueue((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            try {
              URL.revokeObjectURL(item.previewUrl);
            } catch {
              // no-op
            }
            const cleanName = item.file.name.replace(/\.[^/.]+$/, '');
            const newFile = new File([croppedBlob], `${cleanName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            const orientation: 'landscape' | 'portrait' | 'square' =
              width > height ? 'landscape' : height > width ? 'portrait' : 'square';
            return {
              ...item,
              file: newFile,
              previewUrl,
              width,
              height,
              orientation,
            };
          }
          return item;
        })
      );
      toast.success('Foto di antrean berhasil dipotong');
    } else if (cropperState.targetType === 'existing' && cropperState.photoItem) {
      // 2. Potong foto yang sudah tersimpan di database Supabase
      const photo = cropperState.photoItem;
      const fileName = `${Date.now()}-cropped-${Math.random().toString(36).slice(2, 8)}.webp`;
      const storagePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(fileName, croppedBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        toast.error('Gagal mengunggah hasil potongan: ' + uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-library').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('portfolio_photos')
        .update({
          image_url: publicUrl,
          storage_path: storagePath,
          width,
          height,
        })
        .eq('id', photo.id);

      if (updateError) {
        toast.error('Gagal memperbarui data foto: ' + updateError.message);
        return;
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, image_url: publicUrl, storage_path: storagePath, width, height }
            : p
        )
      );

      if (photo.slot === 'hero' && selectedCollection) {
        setSelectedCollection({
          ...selectedCollection,
          cover_url: publicUrl,
        });
      }

      toast.success('Foto koleksi berhasil dipotong dan diperbarui');
    } else if (cropperState.targetType === 'cover') {
      const fileName = `${Date.now()}-cover-${Math.random().toString(36).slice(2, 8)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(fileName, croppedBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        toast.error('Gagal mengunggah foto sampul: ' + uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-library').getPublicUrl(fileName);

      if (selectedCollection) {
        setSelectedCollection({
          ...selectedCollection,
          cover_url: publicUrl,
          content: {
            ...selectedCollection.content,
            cover_url: publicUrl,
          },
        });
      }

      toast.success('Foto sampul menu portofolio berhasil dipotong dan diperbarui');
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

  // Clean duplicate photos in current collection
  const handleCleanDuplicates = async () => {
    if (!selectedCollection || currentCollectionPhotos.length === 0) return;

    const seenUrls = new Set<string>();
    const duplicateIds: string[] = [];

    // Prioritize keeping photos with specific slots over generic 'gallery'
    const sorted = [...currentCollectionPhotos].sort((a, b) => {
      const aRank = a.slot && a.slot !== 'gallery' ? 1 : 0;
      const bRank = b.slot && b.slot !== 'gallery' ? 1 : 0;
      return bRank - aRank;
    });

    for (const photo of sorted) {
      if (seenUrls.has(photo.image_url)) {
        duplicateIds.push(photo.id);
      } else {
        seenUrls.add(photo.image_url);
      }
    }

    if (duplicateIds.length === 0) {
      toast.info('Tidak ada foto kembar / duplikat yang terdeteksi di koleksi ini.');
      return;
    }

    if (!window.confirm(`Ditemukan ${duplicateIds.length} foto kembar dengan URL yang sama. Hapus foto-foto duplikat ini untuk merapikan galeri?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('portfolio_photos')
        .delete()
        .in('id', duplicateIds);

      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => !duplicateIds.includes(p.id)));
      toast.success(`${duplicateIds.length} foto duplikat berhasil dibersihkan`);
    } catch (err: any) {
      toast.error('Gagal membersihkan foto duplikat: ' + err.message);
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
        id: 'highlight_section',
        label: '3. Pita Sorotan Infinity',
        isComplete: Boolean(highlightPhotos.length >= 1 || currentCollectionPhotos.length >= 3),
      },
      {
        id: 'testimonials_section',
        label: '4. Kutipan Pengantin',
        isComplete: Boolean(selectedCollection.content?.testimonials?.length),
      },
      {
        id: 'gallery_section',
        label: '5. Galeri Arsip',
        isComplete: Boolean(currentCollectionPhotos.length >= 5),
      },
      {
        id: 'cta_section',
        label: '6. Konsultasi WhatsApp',
        isComplete: Boolean(selectedCollection.content?.cta_heading),
      },
    ];
  }, [selectedCollection, heroPhoto, aboutPhotos.length, highlightPhotos.length, currentCollectionPhotos.length]);

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta flex flex-col">
      {/* Top Main Navigation Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif font-normal tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="border border-garis text-merah bg-kertas-tua text-[10px] px-2.5 py-0.5 rounded-chip font-sans font-medium uppercase">
            ADMIN PORTOFOLIO
          </span>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/admin" className="text-sm font-sans font-medium text-tinta-lembut hover:text-merah transition-colors">
            ← Dashboard Admin
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="text-tinta-lembut hover:text-merah font-sans font-medium transition-colors text-sm"
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
                  className="bg-merah hover:bg-merah-hover text-white px-5 py-2.5 rounded-btn text-sm font-sans font-medium flex items-center gap-2 min-h-[44px] shadow-sm transition-all"
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
                          {(() => {
                            const coverSrc =
                              colPhotos.find((p) => p.slot === 'hero')?.image_url ||
                              colPhotos[0]?.image_url ||
                              (col.content as any)?.cover_url ||
                              col.cover_url;

                            return coverSrc ? (
                              <img
                                src={coverSrc}
                                alt={col.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-tinta-lembut text-xs font-mono">
                                <ImageIcon className="w-8 h-8 opacity-40 mb-1 text-tinta-lembut" />
                                <span>Belum ada foto sampul</span>
                              </div>
                            );
                          })()}

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-2.5 py-1 text-[10px] uppercase font-sans font-medium tracking-wider rounded-chip border ${
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
                            className="p-2 text-tinta-lembut hover:text-merah transition-colors rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Buka Halaman Publik"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDuplicateCollection(col)}
                            className="p-2 text-tinta-lembut hover:text-merah transition-colors rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Duplikasi Koleksi"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetCollection(col)}
                            className="p-2 text-tinta-lembut hover:text-merah transition-colors rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Hapus Koleksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCollection(col)}
                          className="px-4 py-2 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
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
                      className="w-full border border-garis rounded-input px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                      placeholder="Contoh: Akad Nikah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Slug URL</label>
                    <input
                      type="text"
                      value={newEvSlug}
                      onChange={(e) => setNewEvSlug(e.target.value)}
                      className="w-full border border-garis rounded-input px-3.5 py-2 text-sm bg-white text-tinta font-mono focus:outline-none focus:border-merah"
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
                    className="w-full border border-garis rounded-input px-3.5 py-2 text-sm bg-white text-tinta focus:outline-none focus:border-merah"
                    placeholder="Deskripsi satu kalimat..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddEventType}
                  className="bg-merah hover:bg-merah-hover text-white px-5 py-2.5 rounded-btn text-xs font-sans font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
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
                            onClick={() => {
                              setCropperState({
                                open: true,
                                imageUrl: heroPhoto.image_url,
                                fileName: heroPhoto.caption || 'Foto Hero',
                                targetType: 'existing',
                                photoItem: heroPhoto,
                                suggestedRatio: 3 / 4,
                              });
                            }}
                            className="px-3 py-1.5 bg-merah text-white rounded-[2px] text-xs font-medium hover:bg-merah-hover transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Potong Foto</span>
                          </button>
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
                            <div className="flex items-center gap-2">
                              {photoInSlot && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropperState({
                                      open: true,
                                      imageUrl: photoInSlot.image_url,
                                      fileName: photoInSlot.caption || `Foto Kolase ${idx + 1}`,
                                      targetType: 'existing',
                                      photoItem: photoInSlot,
                                      suggestedRatio:
                                        slotKey === 'about_1'
                                          ? 3 / 4
                                          : slotKey === 'about_2'
                                          ? 4 / 5
                                          : 1,
                                    });
                                  }}
                                  className="text-xs text-merah font-medium hover:underline flex items-center gap-0.5"
                                  title="Potong foto agar pas dengan bingkai"
                                >
                                  <Crop className="w-3 h-3" />
                                  <span>Potong</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSlotPickerTarget(slotKey)}
                                className="text-xs text-tinta-lembut hover:text-tinta font-medium hover:underline"
                              >
                                {photoInSlot ? 'Ganti' : 'Pilih Foto'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 3: HIGHLIGHT SECTION (Infinity Marquee) */}
              <div
                id="card-highlight_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'highlight_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      3
                    </span>
                    <h3 className="font-serif text-lg font-medium text-tinta">
                      Bagian Momen Sorotan (Pita Infinity Bergulir)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tinta-lembut">
                    Prioritas Sorotan: {highlightPhotos.length} Foto
                  </span>
                </div>

                <p className="text-xs text-tinta-lembut mb-5 leading-relaxed">
                  Bagian ini menampilkan foto berbusana adat yang bergulir horizontal secara terus menerus (infinity marquee) tanpa interaksi klik. Foto yang diberi slot &quot;highlight&quot; akan diprioritaskan tampil di pita sorotan. Jika kosong, semua foto koleksi otomatis diputar bergantian.
                </p>

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

                {/* Highlight Photos Slots */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase text-tinta-lembut">
                      Foto Prioritas Pita Infinity ({highlightPhotos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSlotPickerTarget('highlight')}
                      className="text-xs text-merah font-medium hover:underline font-mono"
                    >
                      + Tambah Foto Sorotan
                    </button>
                  </div>

                  {highlightPhotos.length === 0 ? (
                    <div className="p-5 bg-kertas rounded-[2px] border border-dashed border-garis text-center">
                      <p className="text-xs text-tinta-lembut mb-2">
                        Belum ada foto yang ditandai khusus sebagai sorotan. Semua foto koleksi akan otomatis diputar di pita infinity.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSlotPickerTarget('highlight')}
                        className="text-xs text-merah font-semibold hover:underline font-mono"
                      >
                        + Pilih Foto Prioritas
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {highlightPhotos.map((photo, idx) => (
                        <div
                          key={photo.id}
                          className="border border-garis rounded-[2px] p-2 bg-neutral-900 text-white flex flex-col justify-between"
                        >
                          <div className="aspect-[3/4] bg-neutral-800 rounded-[2px] overflow-hidden mb-2 relative group">
                            <img
                              src={photo.image_url}
                              alt={`Sorotan ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="font-mono text-[10px] text-white/70">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAssignPhotoToSlot(photo.id, 'gallery')}
                              className="text-[10px] text-red-400 hover:underline"
                            >
                              Lepas
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 4: TESTIMONIALS SECTION */}
              <div
                id="card-testimonials_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'testimonials_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      4
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

              {/* CARD 5: GALLERY SECTION */}
              <div
                id="card-gallery_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'gallery_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      5
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
                      Semua foto yang diunggah ke koleksi ini otomatis tampil di Galeri Arsip Lengkap publik. Anda tetap dapat menetapkan foto pilihan sebagai Hero, Kolase Tentang, atau Pita Sorotan tanpa menghilangkannya dari galeri.
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

              {/* CARD 6: CTA SECTION */}
              <div
                id="card-cta_section"
                className={`bg-white p-6 rounded-[2px] border transition-all duration-300 ${
                  highlightedCardId === 'cta_section' ? 'border-merah ring-2 ring-merah bg-merah/[0.02]' : 'border-garis'
                }`}
              >
                <div className="flex items-center justify-between border-b border-garis pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-merah/10 text-merah flex items-center justify-center font-mono text-xs font-semibold">
                      6
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

              {/* Foto Sampul Kartu Menu Portofolio */}
              <div className="pt-6 border-t border-garis">
                <div className="mb-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta font-semibold">
                    Foto Sampul Menu Direktori (/portofolio & Beranda)
                  </label>
                  <p className="text-xs text-tinta-lembut mt-0.5">
                    Foto lanskap (rasio 16:9 / 16:10) yang tampil pada kartu pilihan koleksi di halaman direktori portofolio dan beranda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-kertas-tua/30 p-4 rounded-[2px] border border-garis">
                  {/* Preview Bingkai Kartu */}
                  <div className="sm:col-span-6">
                    <div className="aspect-[16/10] bg-[#f7f5f0] rounded-[2px] overflow-hidden border border-garis relative group shadow-sm">
                      {coverPhotoUrl ? (
                        <>
                          <img
                            src={coverPhotoUrl}
                            alt="Sampul Menu"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => setSlotPickerTarget('cover')}
                              className="px-3 py-1.5 bg-white text-tinta rounded-[2px] text-xs font-medium hover:bg-kertas-tua shadow-sm"
                            >
                              Ganti Foto
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCropperState({
                                  open: true,
                                  imageUrl: coverPhotoUrl,
                                  fileName: 'Sampul Menu ' + selectedCollection.name,
                                  targetType: 'cover',
                                  suggestedRatio: 16 / 9,
                                });
                              }}
                              className="px-3 py-1.5 bg-merah text-white rounded-[2px] text-xs font-medium hover:bg-merah-hover shadow-sm flex items-center gap-1"
                            >
                              <Crop className="w-3.5 h-3.5" />
                              <span>Potong 16:9</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div
                          onClick={() => setSlotPickerTarget('cover')}
                          className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer p-4 hover:bg-merah/5 transition-colors"
                        >
                          <ImageIcon className="w-8 h-8 text-tinta-lembut opacity-40 mb-2" />
                          <span className="text-xs font-medium text-tinta">Pilih Foto Sampul Menu</span>
                          <span className="text-[10px] text-tinta-lembut font-mono mt-0.5">Rasio 16:9 / 16:10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kontrol Aksi Sampul */}
                  <div className="sm:col-span-6 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSlotPickerTarget('cover')}
                      className="w-full px-4 py-2.5 bg-white border border-garis hover:border-merah text-tinta rounded-[2px] text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[40px]"
                    >
                      <ImageIcon className="w-4 h-4 text-merah" />
                      <span>Pilih dari Foto Koleksi Ini</span>
                    </button>

                    {heroPhoto && heroPhoto.image_url !== coverPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCollection({
                            ...selectedCollection,
                            cover_url: heroPhoto.image_url,
                            content: {
                              ...selectedCollection.content,
                              cover_url: heroPhoto.image_url,
                            },
                          });
                          toast.success('Foto Hero disalin menjadi foto sampul menu');
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-garis hover:border-tinta text-tinta rounded-[2px] text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[40px]"
                      >
                        <Copy className="w-4 h-4 text-tinta-lembut" />
                        <span>Gunakan Foto Hero Koleksi</span>
                      </button>
                    )}

                    {coverPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCollection({
                            ...selectedCollection,
                            cover_url: null,
                            content: {
                              ...selectedCollection.content,
                              cover_url: null,
                            },
                          });
                          toast.info('Foto sampul di-reset ke foto Hero otomatis');
                        }}
                        className="w-full px-3 py-2 text-xs text-red-600 hover:underline flex items-center justify-center gap-1 font-mono"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset ke Foto Hero Otomatis</span>
                      </button>
                    )}
                  </div>
                </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-xl font-normal text-tinta">Foto Dalam Koleksi Ini</h3>
                  <p className="text-xs text-tinta-lembut mt-1">
                    Kelola foto, tentukan slot tampilan, kategori prosesi acara, dan titik fokus.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCleanDuplicates}
                    className="border border-garis hover:border-red-400 hover:text-red-600 text-tinta-lembut px-3 py-2 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
                    title="Pindai dan bersihkan foto yang diunggah berulang kali"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Duplikat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="bg-merah hover:bg-merah-hover text-white px-4 py-2 rounded-[2px] text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto ke Koleksi</span>
                  </button>
                </div>
              </div>

              <div className="mb-6 p-3.5 bg-merah/[0.04] border border-merah/20 rounded-[2px] flex items-start gap-3 text-xs text-tinta">
                <Info className="w-4 h-4 text-merah shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-merah block mb-0.5">Semua Foto Otomatis Masuk Galeri Arsip Lengkap</span>
                  <span className="text-tinta-lembut leading-relaxed">
                    Setiap foto yang Anda unggah otomatis ditampilkan di Galeri Arsip publik. Anda dapat menandai foto tertentu sebagai <strong>Sorotan (Highlight)</strong> untuk pita bergulir infinity, atau memilihnya sebagai <strong>Hero</strong> dan <strong>Kolase Tentang</strong> tanpa menghilangkannya dari galeri.
                  </span>
                </div>
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
                            {photo.width && photo.height ? (photo.width > photo.height ? 'Lanskap' : 'Potret') : 'Foto'}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Tombol Cepat Sorotan (Highlight) */}
                            <button
                              type="button"
                              onClick={() =>
                                handleAssignPhotoToSlot(
                                  photo.id,
                                  photo.slot === 'highlight' ? 'gallery' : 'highlight'
                                )
                              }
                              className={`p-1 rounded-[2px] transition-colors ${
                                photo.slot === 'highlight'
                                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                  : 'text-tinta-lembut hover:text-amber-600'
                              }`}
                              title={
                                photo.slot === 'highlight'
                                  ? 'Lepas dari pita sorotan'
                                  : 'Tandai sebagai sorotan pita bergulir'
                              }
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  photo.slot === 'highlight' ? 'fill-amber-500 text-amber-500' : ''
                                }`}
                              />
                            </button>

                            {/* Tombol Crop Foto Tersimpan */}
                            <button
                              type="button"
                              onClick={() => {
                                setCropperState({
                                  open: true,
                                  imageUrl: photo.image_url,
                                  fileName: photo.caption || 'Foto Koleksi',
                                  targetType: 'existing',
                                  photoItem: photo,
                                  suggestedRatio:
                                    photo.slot === 'hero' || photo.slot === 'about_1'
                                      ? 3 / 4
                                      : photo.slot === 'about_2'
                                      ? 4 / 5
                                      : photo.slot === 'about_3'
                                      ? 1
                                      : null,
                                });
                              }}
                              className="p-1 text-tinta-lembut hover:text-merah transition-colors"
                              title="Potong (Crop) foto ini"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>

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
          <div className="relative bg-white rounded-panel border border-garis w-full max-w-3xl p-6 shadow-elevated z-10 max-h-[85vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-garis pb-3 mb-4 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-medium text-tinta">
                  Pilih Foto untuk Slot:{' '}
                  <span className="text-merah uppercase font-mono">
                    {slotPickerTarget === 'cover' ? 'SAMPUL MENU PORTOFOLIO' : slotPickerTarget}
                  </span>
                </h3>
                <p className="text-xs text-tinta-lembut mt-0.5">
                  {slotPickerTarget === 'cover'
                    ? 'Klik foto di bawah untuk menjadikannya foto sampul kartu koleksi ini di menu /portofolio dan beranda.'
                    : 'Klik foto di bawah untuk menetapkannya ke slot ini. Foto akan tetap tampil di Galeri Arsip Lengkap.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlotPickerTarget(null)}
                className="p-2 text-tinta-lembut hover:text-tinta rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {currentCollectionPhotos.length === 0 ? (
                <div className="text-center py-12 text-tinta-lembut">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Belum ada foto yang diunggah ke koleksi ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {currentCollectionPhotos.map((p) => {
                    const isSelected =
                      slotPickerTarget === 'cover'
                        ? selectedCollection?.cover_url === p.image_url ||
                          (selectedCollection?.content as any)?.cover_url === p.image_url
                        : p.slot === slotPickerTarget;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (slotPickerTarget === 'cover') {
                            if (selectedCollection) {
                              setSelectedCollection({
                                ...selectedCollection,
                                cover_url: p.image_url,
                                content: {
                                  ...selectedCollection.content,
                                  cover_url: p.image_url,
                                },
                              });
                              toast.success('Foto sampul menu portofolio berhasil dipilih. Silakan klik Simpan.');
                            }
                            setSlotPickerTarget(null);
                            return;
                          }

                          if (isSelected && slotPickerTarget === 'highlight') {
                            handleAssignPhotoToSlot(p.id, 'gallery');
                          } else {
                            handleAssignPhotoToSlot(p.id, slotPickerTarget);
                          }
                        }}
                        className={`group cursor-pointer rounded-[2px] overflow-hidden border transition-all relative flex flex-col ${
                          isSelected
                            ? 'border-merah ring-2 ring-merah bg-merah/5'
                            : 'border-garis hover:border-merah bg-white'
                        }`}
                      >
                        <div className="w-full aspect-[3/4] min-h-[130px] bg-[#f7f5f0] relative overflow-hidden">
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />

                          {/* Badge slot saat ini */}
                          {p.slot && p.slot !== 'gallery' && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-mono rounded-[2px] uppercase">
                              {p.slot}
                            </span>
                          )}

                          {/* Indikator terpilih */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-merah text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white font-mono text-center">
                              {isSelected ? 'Klik untuk Lepas' : 'Pilih Foto Ini'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-garis flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPhotoSlot(slotPickerTarget === 'cover' ? 'hero' : (slotPickerTarget || 'gallery'));
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
                className="px-4 py-2 border border-garis rounded-[2px] text-xs font-medium text-tinta hover:bg-kertas-tua"
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
          <div className="relative bg-white rounded-panel border border-garis w-full max-w-md p-6 shadow-elevated z-10 font-sans">
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

            <div className="space-y-2.5 my-4 bg-kertas-tua/40 p-4 rounded-input border border-garis">
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
                className="px-5 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium min-h-[44px]"
              >
                Saya Mengerti, Lengkapi Dulu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD PHOTO MODAL (BATCH / MULTI-UPLOAD & SELEKSI PILIHAN) */}
      {/* ========================================================================= */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClosePhotoModal}
          />
          <div className="relative bg-white rounded-panel border border-garis w-full max-w-4xl p-6 shadow-elevated z-10 max-h-[92vh] flex flex-col overflow-hidden font-sans">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-garis shrink-0">
              <div>
                <h3 className="font-serif text-xl font-normal text-tinta">Upload Foto Portofolio</h3>
                <p className="text-xs text-tinta-lembut mt-1">
                  Pilih banyak foto sekaligus, tentukan mana yang ingin di-up, dan atur penempatannya sebelum diunggah.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePhotoModal}
                disabled={uploading}
                className="text-tinta-lembut hover:text-tinta p-2 rounded-btn disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden Multi-file Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(e.target.files);
                }
                e.target.value = '';
              }}
            />

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Jika belum ada file di antrean: Tampilkan Dropzone */}
              {uploadQueue.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFilesSelected(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2px] p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[320px] ${
                    isDragOver
                      ? 'border-merah bg-merah/5'
                      : 'border-garis hover:border-merah bg-kertas-tua/20 hover:bg-kertas-tua/40'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-white border border-garis flex items-center justify-center mb-4 shadow-sm text-merah">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-lg text-tinta mb-1">
                    Pilih atau Tarik Foto ke Sini
                  </h4>
                  <p className="text-xs text-tinta-lembut max-w-md mb-5 leading-relaxed">
                    Bisa memilih belasan hingga puluhan foto sekaligus. Semua foto akan ditinjau dalam daftar sehingga kamu bisa mencentang mana saja yang mau di-up ke koleksi.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-6 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium inline-flex items-center gap-2 shadow-sm min-h-[44px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Foto (Bisa Banyak Sekaligus)</span>
                  </button>
                  <span className="text-[11px] font-mono text-tinta-lembut mt-3">
                    Format didukung: JPG, PNG, WEBP • Otomatis dikompres & orientasi potret/lanskap terjaga
                  </span>
                </div>
              ) : activeFocalQueueId ? (
                /* Sub-tampilan Pengaturan Titik Fokus Interaktif untuk 1 Foto */
                (() => {
                  const activeItem = uploadQueue.find((q) => q.id === activeFocalQueueId);
                  if (!activeItem) return null;

                  return (
                    <div className="p-4 bg-kertas-tua/40 border border-garis rounded-[2px] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-garis">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-merah font-semibold tracking-wider">
                            Atur Titik Fokus Foto
                          </span>
                          <h4 className="font-serif text-base text-tinta truncate max-w-md">
                            {activeItem.file.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCropperState({
                                open: true,
                                imageUrl: activeItem.previewUrl,
                                fileName: activeItem.file.name,
                                targetType: 'queue',
                                queueItemId: activeItem.id,
                                suggestedRatio:
                                  activeItem.slot === 'hero' || activeItem.slot === 'about_1'
                                    ? 3 / 4
                                    : activeItem.slot === 'about_2'
                                    ? 4 / 5
                                    : activeItem.slot === 'about_3'
                                    ? 1
                                    : null,
                              });
                            }}
                            className="px-3 py-1.5 bg-merah text-white rounded-[2px] text-xs font-medium hover:bg-merah-hover flex items-center gap-1 shadow-sm"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Potong (Crop)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveFocalQueueId(null)}
                            className="px-4 py-1.5 bg-white border border-garis hover:border-tinta rounded-[2px] text-xs font-medium text-tinta"
                          >
                            Selesai & Kembali ke Daftar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        {/* Interactive image preview */}
                        <div
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width;
                            const y = (e.clientY - rect.top) / rect.height;
                            const xPos = x < 0.35 ? 'left' : x > 0.65 ? 'right' : 'center';
                            const yPos = y < 0.35 ? 'top' : y > 0.65 ? 'bottom' : 'center';
                            let val = 'center';
                            if (yPos === 'center' && xPos === 'center') val = 'center';
                            else if (yPos === 'center') val = `center ${xPos}`;
                            else if (xPos === 'center') val = `${yPos} center`;
                            else val = `${yPos} ${xPos}`;
                            handleUpdateQueueItem(activeItem.id, { focal: val });
                          }}
                          className={`cursor-crosshair relative bg-neutral-900 rounded-[2px] overflow-hidden border border-garis select-none ${
                            activeItem.orientation === 'portrait'
                              ? 'aspect-[3/4] max-h-[380px] mx-auto'
                              : 'aspect-[4/3] max-h-[320px]'
                          }`}
                          title="Klik foto untuk menetapkan titik fokus"
                        >
                          <img
                            src={activeItem.previewUrl}
                            alt="Focal Preview"
                            className="w-full h-full object-cover pointer-events-none"
                            style={{ objectPosition: activeItem.focal }}
                          />

                          {/* Cincin indikator fokus */}
                          <div
                            className="absolute w-8 h-8 rounded-full border-2 border-merah bg-merah/25 shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-200 flex items-center justify-center"
                            style={{
                              top: activeItem.focal.includes('top')
                                ? '22%'
                                : activeItem.focal.includes('bottom')
                                ? '78%'
                                : '50%',
                              left: activeItem.focal.includes('left')
                                ? '22%'
                                : activeItem.focal.includes('right')
                                ? '78%'
                                : '50%',
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-merah shadow-sm" />
                          </div>

                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono rounded-[2px]">
                            Klik gambar untuk menetapkan fokus
                          </span>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-mono uppercase text-tinta-lembut block mb-1">
                              Status Orientasi & Dimensi
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-[2px] font-mono text-[11px] font-semibold uppercase ${
                                  activeItem.orientation === 'landscape'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : activeItem.orientation === 'portrait'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                                }`}
                              >
                                {activeItem.orientation === 'landscape'
                                  ? 'Lanskap (Mendatar)'
                                  : activeItem.orientation === 'portrait'
                                  ? 'Potret (Tegak)'
                                  : 'Persegi (1:1)'}
                              </span>
                              <span className="font-mono text-xs text-tinta-lembut">
                                {activeItem.width} × {activeItem.height} px
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-mono uppercase text-tinta-lembut block mb-1.5">
                              Pilih Titik Fokus 3×3
                            </span>
                            <div className="grid grid-cols-3 gap-1.5 max-w-[260px]">
                              {[
                                { id: 'top left', label: 'Kiri Atas' },
                                { id: 'top center', label: 'Tengah Atas' },
                                { id: 'top right', label: 'Kanan Atas' },
                                { id: 'center left', label: 'Kiri' },
                                { id: 'center', label: 'Tengah' },
                                { id: 'center right', label: 'Kanan' },
                                { id: 'bottom left', label: 'Kiri Bawah' },
                                { id: 'bottom center', label: 'Tengah Bawah' },
                                { id: 'bottom right', label: 'Kanan Bawah' },
                              ].map((btn) => (
                                <button
                                  key={btn.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQueueItem(activeItem.id, { focal: btn.id })
                                  }
                                  className={`py-1.5 px-2 text-[11px] font-mono rounded-[2px] border text-center transition-all ${
                                    activeItem.focal === btn.id
                                      ? 'bg-merah text-white border-merah font-semibold shadow-sm'
                                      : 'bg-white border-garis text-tinta hover:border-tinta'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] text-tinta-lembut mt-2 leading-relaxed">
                              Titik fokus menjaga posisi wajah pengantin tetap di tengah saat foto dipotong responsif di berbagai resolusi layar ponsel.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">
                              Slot Penempatan
                            </label>
                            <select
                              value={activeItem.slot}
                              onChange={(e) =>
                                handleUpdateQueueItem(activeItem.id, { slot: e.target.value as any })
                              }
                              className="w-full border border-garis rounded-[2px] px-3 py-2 text-xs bg-white text-tinta"
                            >
                              <option value="gallery">Galeri Arsip (Grid Foto)</option>
                              <option value="hero">Hero (Foto Utama Atas)</option>
                              <option value="highlight">Momen Sorotan (Infinity)</option>
                              <option value="about_1">Tentang Koleksi - Foto 1</option>
                              <option value="about_2">Tentang Koleksi - Foto 2</option>
                              <option value="about_3">Tentang Koleksi - Foto 3</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Daftar Antrean Foto (Multi-Upload Selector) */
                <div className="space-y-4">
                  {/* Bar Ringkasan & Aksi Seleksi */}
                  <div className="p-3 bg-kertas-tua/50 border border-garis rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-tinta">
                        {uploadQueue.filter((q) => q.selected).length} dari {uploadQueue.length} foto dipilih untuk diunggah
                      </span>
                      <div className="h-4 w-px bg-garis hidden sm:block" />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(true)}
                          className="px-2.5 py-1 text-[11px] font-mono bg-white border border-garis hover:border-tinta rounded-[2px] text-tinta"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAll(false)}
                          className="px-2.5 py-1 text-[11px] font-mono bg-white border border-garis hover:border-tinta rounded-[2px] text-tinta"
                        >
                          Batalkan Semua
                        </button>
                        <button
                          type="button"
                          onClick={handleClearQueue}
                          className="px-2.5 py-1 text-[11px] font-mono text-merah hover:underline"
                        >
                          Hapus Antrean
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-tinta-lembut hidden lg:inline">
                          Ubah slot terpilih:
                        </span>
                        <select
                          value={batchTargetSlot}
                          onChange={(e) => setBatchTargetSlot(e.target.value as any)}
                          className="text-xs border border-garis rounded-[2px] px-2 py-1 bg-white text-tinta"
                        >
                          <option value="gallery">Galeri Arsip</option>
                          <option value="hero">Hero (Foto Utama)</option>
                          <option value="highlight">Momen Sorotan</option>
                          <option value="about_1">Tentang - Foto 1</option>
                          <option value="about_2">Tentang - Foto 2</option>
                          <option value="about_3">Tentang - Foto 3</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleApplyBatchSlot}
                          className="px-2.5 py-1 text-xs font-medium bg-white border border-garis hover:border-tinta rounded-[2px] text-tinta"
                        >
                          Terapkan
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-white border border-garis hover:border-merah text-tinta text-xs rounded-[2px] font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-merah" />
                        <span>Tambah Foto</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid Kartu Antrean Foto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[52vh] overflow-y-auto pr-1">
                    {uploadQueue.map((item, index) => {
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-[2px] overflow-hidden flex flex-col justify-between transition-all ${
                            item.selected
                              ? 'bg-white border-merah/50 shadow-sm ring-1 ring-merah/20'
                              : 'bg-neutral-50/80 border-garis opacity-65'
                          }`}
                        >
                          {/* Card Header: Checkbox & Remove */}
                          <div className="p-2.5 flex items-center justify-between border-b border-garis/80 bg-white">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleSelectItem(item.id)}
                                className="w-4 h-4 accent-merah rounded cursor-pointer"
                              />
                              <span
                                className={`text-xs font-mono font-medium ${
                                  item.selected ? 'text-merah' : 'text-tinta-lembut'
                                }`}
                              >
                                {item.selected ? 'Mau Di-up' : 'Dilewati'}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveQueueItem(item.id)}
                              className="text-tinta-lembut hover:text-merah p-1 rounded transition-colors"
                              title="Hapus dari antrean"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Image Thumbnail with Dynamic Orientation Aspect Ratio */}
                          <div className="relative bg-neutral-900 border-b border-garis overflow-hidden group">
                            <div
                              className={`w-full overflow-hidden flex items-center justify-center ${
                                item.orientation === 'portrait'
                                  ? 'aspect-[3/4] max-h-[200px]'
                                  : 'aspect-[4/3] max-h-[160px]'
                              }`}
                            >
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-full h-full object-cover select-none"
                                style={{ objectPosition: item.focal }}
                              />
                            </div>

                            {/* Orientation & Dimensions Badge */}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] font-semibold uppercase ${
                                  item.orientation === 'landscape'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : item.orientation === 'portrait'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                                }`}
                              >
                                {item.orientation === 'landscape'
                                  ? 'Lanskap'
                                  : item.orientation === 'portrait'
                                  ? 'Potret'
                                  : '1:1'}
                              </span>
                            </div>

                            {/* Focal Point Indicator Link */}
                            <button
                              type="button"
                              onClick={() => setActiveFocalQueueId(item.id)}
                              className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 hover:bg-black text-white text-[10px] font-mono rounded-[2px] transition-colors"
                              title="Klik untuk mengubah titik fokus foto ini"
                            >
                              Fokus: {item.focal}
                            </button>
                          </div>

                          {/* Card Body: Slot & Caption */}
                          <div className="p-3 space-y-2.5 bg-white flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-mono text-tinta-lembut truncate">
                                <span className="truncate max-w-[130px]" title={item.file.name}>
                                  {index + 1}. {item.file.name}
                                </span>
                                <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono uppercase text-tinta-lembut mb-0.5">
                                  Slot Penempatan
                                </label>
                                <select
                                  value={item.slot}
                                  onChange={(e) =>
                                    handleUpdateQueueItem(item.id, { slot: e.target.value as any })
                                  }
                                  className="w-full border border-garis rounded-[2px] px-2 py-1 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                                >
                                  <option value="gallery">Galeri Arsip</option>
                                  <option value="hero">Hero (Foto Utama)</option>
                                  <option value="highlight">Momen Sorotan (Infinity)</option>
                                  <option value="about_1">Tentang - Foto 1</option>
                                  <option value="about_2">Tentang - Foto 2</option>
                                  <option value="about_3">Tentang - Foto 3</option>
                                </select>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={item.caption}
                                  onChange={(e) =>
                                    handleUpdateQueueItem(item.id, { caption: e.target.value })
                                  }
                                  placeholder="Keterangan momen (opsional)..."
                                  className="w-full border border-garis rounded-[2px] px-2 py-1 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-garis mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCropperState({
                                    open: true,
                                    imageUrl: item.previewUrl,
                                    fileName: item.file.name,
                                    targetType: 'queue',
                                    queueItemId: item.id,
                                    suggestedRatio:
                                      item.slot === 'hero' || item.slot === 'about_1'
                                        ? 3 / 4
                                        : item.slot === 'about_2'
                                        ? 4 / 5
                                        : item.slot === 'about_3'
                                        ? 1
                                        : null,
                                  });
                                }}
                                className="text-[11px] font-mono text-merah hover:underline flex items-center gap-1 font-medium"
                              >
                                <Crop className="w-3 h-3" />
                                <span>Potong (Crop)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveFocalQueueId(item.id)}
                                className="text-[11px] font-mono text-tinta-lembut hover:text-tinta"
                              >
                                Fokus ({item.focal})
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-garis flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              {/* Progress info */}
              <div className="flex-1">
                {uploading ? (
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center justify-between text-xs font-mono text-merah">
                      <span>{uploadProgress || 'Mengunggah foto...'}</span>
                    </div>
                    <div className="w-full bg-garis h-2 rounded-[2px] overflow-hidden">
                      <div className="bg-merah h-full transition-all duration-300 animate-pulse w-full" />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-tinta-lembut font-mono">
                    {uploadQueue.length > 0
                      ? `${uploadQueue.filter((q) => q.selected).length} foto akan diunggah ke koleksi ini`
                      : 'Belum ada foto yang dipilih'}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={handleClosePhotoModal}
                  disabled={uploading}
                  className="px-4 py-2 border border-garis rounded-btn text-xs font-sans font-medium text-tinta-lembut hover:text-tinta min-h-[44px] disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBatchPhotoUpload}
                  disabled={uploading || uploadQueue.filter((q) => q.selected).length === 0}
                  className="px-6 py-2 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium min-h-[44px] shadow-sm disabled:opacity-40 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        Unggah {uploadQueue.filter((q) => q.selected).length} Foto Terpilih
                      </span>
                    </>
                  )}
                </button>
              </div>
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

      {/* IMAGE CROPPER MODAL (FITUR PEMOTONG FOTO INTERAKTIF) */}
      <ImageCropperModal
        open={cropperState.open}
        imageUrl={cropperState.imageUrl}
        fileName={cropperState.fileName}
        suggestedRatio={cropperState.suggestedRatio}
        onClose={() => setCropperState((prev) => ({ ...prev, open: false }))}
        onApplyCrop={handleApplyCrop}
      />
    </div>
  );
}
