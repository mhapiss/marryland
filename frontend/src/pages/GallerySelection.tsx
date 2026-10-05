// src/pages/GallerySelection.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import { usePageMeta } from '../hooks/usePageMeta';
import { useGallerySelections } from '../hooks/useGallerySelections';
import {
  computeJustifiedLayout,
  getPhotoRawAspectRatio,
  ThumbnailSizePreset,
} from '../lib/justifiedLayout';
import PhotoViewer, { ViewerPhoto } from '../components/gallery/PhotoViewer';
import SwipeSelector from '../components/gallery/SwipeSelector';
import SelectedPhotosPanel from '../components/gallery/SelectedPhotosPanel';
import SubmitConfirmDialog from '../components/gallery/SubmitConfirmDialog';
import SubmitResultDialog, { SubmitResultState } from '../components/gallery/SubmitResultDialog';
import ImageWithFallback from '../components/ImageWithFallback';
import { copyToClipboard } from '../lib/clipboard';
import { isDeadlinePassed } from '../lib/deadline';
import { toast } from 'sonner';
import {
  Search,
  X,
  ArrowUpDown,
  Filter,
  Sun,
  Moon,
  Check,
  Send,
  Calendar,
  AlertCircle,
  Eye,
  Images,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Gallery } from './Dashboard';

export interface GalleryPhotoItem extends ViewerPhoto {
  id: string;
  gallery_id: string;
  gdrive_file_id: string;
  filename: string;
  thumbnail_url: string;
  order_index: number;
  width?: number | null;
  height?: number | null;
  rotation?: number;
  is_highlight?: boolean;
  folder_path?: string;
  is_missing?: boolean;
}

export default function GallerySelection() {
  const { client_slug } = useParams<{ client_slug: string }>();

  // State
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([]);
  const [initialSelections, setInitialSelections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState('');

  // Neutral Theme state (Light / Dark, independent of vintage brand colors)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('marryland_client_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (_) {
      return 'light';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('marryland_client_theme', nextTheme);
    } catch (_) {}
  };

  // Tab State: 'semua' | 'highlight' | 'terpilih' | 'swipe'
  const [activeTab, setActiveTab] = useState<'semua' | 'highlight' | 'terpilih' | 'swipe'>('semua');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'name-asc' | 'name-desc' | 'selected'>('order');
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'portrait' | 'landscape'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  // Thumbnail Size state (Kecil, Sedang, Besar) with localStorage persistence
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSizePreset>(() => {
    try {
      const saved = localStorage.getItem('marryland_client_grid_size');
      if (saved === 'small' || saved === 'medium' || saved === 'large') return saved;
    } catch (_) {}
    return 'medium';
  });

  const handleThumbnailSizeChange = (newSize: ThumbnailSizePreset) => {
    setThumbnailSize(newSize);
    try {
      localStorage.setItem('marryland_client_grid_size', newSize);
    } catch (_) {}
  };

  // Modals / Panels
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showSelectedPanel, setShowSelectedPanel] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Submit Result Modal State (Submitting, Success, Error)
  const [showResultModal, setShowResultModal] = useState(false);
  const [submitResultState, setSubmitResultState] = useState<SubmitResultState>('submitting');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [submittedAtTime, setSubmittedAtTime] = useState<string | null>(null);

  // Container width monitoring for justified row layout
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Scroll & viewport height tracking for row virtualization
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollTop(window.scrollY);
      });
    };

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // RAF-batched dimension updates for photos loaded without width/height
  const pendingDimensionsRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const dimensionRafRef = useRef<number | null>(null);

  const handleDimensionDetected = useCallback((photoId: string, naturalWidth: number, naturalHeight: number) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (target && target.width && target.height) {
        return prev; // Already has dimensions, no update needed
      }

      pendingDimensionsRef.current.set(photoId, { width: naturalWidth, height: naturalHeight });

      if (!dimensionRafRef.current) {
        dimensionRafRef.current = requestAnimationFrame(() => {
          dimensionRafRef.current = null;
          const updates = pendingDimensionsRef.current;
          if (updates.size === 0) return;

          setPhotos((currentPhotos) =>
            currentPhotos.map((p) => {
              const u = updates.get(p.id);
              if (u) {
                return { ...p, width: u.width, height: u.height };
              }
              return p;
            })
          );
          updates.clear();
        });
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setContainerWidth(width);
        }, 60);
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [isLoading]);

  // Fetch Gallery & Photos
  const fetchGalleryData = useCallback(async () => {
    if (!client_slug) return;
    setIsLoading(true);
    setInitialLoadError('');

    try {
      // 1. Fetch Gallery info (try RPC first, fallback to direct query)
      let galleryData: any = null;
      const { data: rpcGallery, error: rpcError } = await supabase.rpc('get_public_gallery', {
        p_slug: client_slug,
      });

      const parsedRpc = Array.isArray(rpcGallery) ? rpcGallery[0] : rpcGallery;

      if (!rpcError && parsedRpc && parsedRpc.id && !parsedRpc.error) {
        galleryData = parsedRpc;
      } else {
        const isFunctionMissing =
          rpcError?.code === 'PGRST202' ||
          Boolean(rpcError?.message?.toLowerCase().includes('function'));
        if (!isFunctionMissing) {
          throw new Error('Galeri tidak ditemukan atau tautan tidak valid.');
        }

        const { data, error } = await supabase
          .from('galleries')
          .select('*')
          .eq('client_slug', client_slug)
          .single();

        if (error || !data) {
          throw new Error('Galeri tidak ditemukan atau tautan tidak valid.');
        }
        galleryData = data;
      }

      setGallery(galleryData);
      if (galleryData.submitted_at) {
        setSubmittedAtTime(galleryData.submitted_at);
      }

      // 2. Fetch Photos (try RPC first, fallback to direct query)
      let photosData: any[] = [];
      const { data: rpcPhotos, error: rpcPhotosError } = await supabase.rpc(
        'get_public_gallery_photos',
        { p_slug: client_slug }
      );

      if (!rpcPhotosError && Array.isArray(rpcPhotos)) {
        photosData = rpcPhotos;
      } else {
        const isFunctionMissing =
          rpcPhotosError?.code === 'PGRST202' ||
          Boolean(rpcPhotosError?.message?.toLowerCase().includes('function'));
        if (!isFunctionMissing && rpcPhotosError) {
          throw rpcPhotosError;
        }

        const { data, error } = await supabase
          .from('gallery_photos')
          .select('*')
          .eq('gallery_id', galleryData.id)
          .order('order_index', { ascending: true });

        if (error) throw error;
        photosData = data || [];
      }
      setPhotos(photosData);

      // 3. Fetch Existing Selections
      const { data: selectionsData } = await supabase
        .from('photo_selections')
        .select('gallery_photo_id, selection_order')
        .eq('gallery_id', galleryData.id)
        .order('selection_order', { ascending: true });

      if (selectionsData && selectionsData.length > 0) {
        setInitialSelections(selectionsData.map((s) => s.gallery_photo_id));
      }
    } catch (err: any) {
      setInitialLoadError(err.message || 'Gagal memuat galeri foto.');
    } finally {
      setIsLoading(false);
    }
  }, [client_slug]);

  useEffect(() => {
    fetchGalleryData();
  }, [fetchGalleryData]);

  // Gallery Status conditions
  const isCompleted = gallery?.status === 'completed';
  const isExpired = isDeadlinePassed(gallery?.deadline_date);
  const hasBeenSubmitted = isCompleted || submitSuccess || Boolean(submittedAtTime || gallery?.submitted_at);

  // Selections Hook
  const {
    selectedIds,
    syncStatus,
    toggleSelection,
    removeSelection,
    isPhotoSelected,
    getSelectionOrder,
    totalSelected,
    remainingQuota,
  } = useGallerySelections({
    galleryId: gallery?.id || '',
    initialSelections,
    maxSelectable: gallery?.max_photos_selectable || 50,
  });

  // Realtime updates from photographer side
  useRealtime({
    table: 'galleries',
    filter: gallery ? `id=eq.${gallery.id}` : undefined,
    enabled: !!gallery,
    onUpdate: (payload) => {
      const updated = payload.new as Gallery;
      setGallery((prev) => (prev ? { ...prev, status: updated.status } : prev));
    },
  });

  // SEO Meta & Structured Data
  usePageMeta({
    title: gallery ? `Galeri ${gallery.client_name}` : 'Galeri Kurasi Foto',
    description:
      gallery?.highlight_description || 'Pilih foto momen terbaikmu dari sesi foto kami.',
    jsonLd: gallery
      ? {
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: `Galeri Foto ${gallery.client_name}`,
          description:
            gallery.highlight_description ||
            `Galeri kurasi dan seleksi foto untuk ${gallery.client_name}`,
          url: window.location.href.split('?')[0],
        }
      : undefined,
  });

  // Subfolder options
  const subfolders = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.folder_path) set.add(p.folder_path);
    });
    return Array.from(set);
  }, [photos]);

  // Check if any highlights exist
  const hasHighlights = useMemo(() => photos.some((p) => p.is_highlight), [photos]);

  // Filtered & Sorted Photos
  const filteredPhotos = useMemo(() => {
    let list = [...photos];

    // Filter by Tab
    if (activeTab === 'highlight') {
      list = list.filter((p) => p.is_highlight);
    } else if (activeTab === 'terpilih') {
      list = list.filter((p) => isPhotoSelected(p.id));
    }

    // Filter by Subfolder
    if (selectedFolder !== 'all') {
      list = list.filter((p) => p.folder_path === selectedFolder);
    }

    // Filter by Orientation
    if (orientationFilter !== 'all') {
      list = list.filter((p) => {
        const ar = getPhotoRawAspectRatio(p);
        return orientationFilter === 'portrait' ? ar < 1 : ar >= 1;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.filename.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
    } else if (sortBy === 'name-desc') {
      list.sort((a, b) => b.filename.localeCompare(a.filename, undefined, { numeric: true }));
    } else if (sortBy === 'selected') {
      list.sort((a, b) => {
        const orderA = getSelectionOrder(a.id) ?? 999999;
        const orderB = getSelectionOrder(b.id) ?? 999999;
        return orderA - orderB;
      });
    } else {
      list.sort((a, b) => a.order_index - b.order_index);
    }

    return list;
  }, [photos, activeTab, selectedFolder, orientationFilter, searchQuery, sortBy, isPhotoSelected, getSelectionOrder]);

  // Compute Justified Layout Rows & Dimensions
  const layoutResult = useMemo(() => {
    return computeJustifiedLayout(filteredPhotos, {
      containerWidth,
      thumbnailSize,
      gap: containerWidth < 640 ? 6 : 8,
    });
  }, [filteredPhotos, containerWidth, thumbnailSize]);

  const { rows: justifiedRows, totalHeight, gap } = layoutResult;

  // Anchor scroll preservation across layout recalculations
  const anchorPhotoIdRef = useRef<string | null>(null);

  // Monitor the first visible photo in the viewport
  useEffect(() => {
    if (justifiedRows.length === 0) return;
    const gridTop = gridContainerRef.current?.getBoundingClientRect().top ?? 0;
    const relativeScroll = Math.max(0, -gridTop);
    const visibleRow = justifiedRows.find((r) => r.top + r.height >= relativeScroll);
    if (visibleRow && visibleRow.items.length > 0) {
      anchorPhotoIdRef.current = visibleRow.items[0].item.id;
    }
  }, [scrollTop, justifiedRows]);

  // Maintain scroll anchor across layout recalculations (prevent jump on resize / rotate / thumbnail size change)
  useLayoutEffect(() => {
    if (!anchorPhotoIdRef.current || justifiedRows.length === 0) return;
    const anchorId = anchorPhotoIdRef.current;
    const targetRow = justifiedRows.find((r) => r.items.some((it) => it.item.id === anchorId));
    if (targetRow && gridContainerRef.current) {
      const gridOffsetTop = gridContainerRef.current.offsetTop;
      const targetScrollY = gridOffsetTop + targetRow.top;

      if (Math.abs(window.scrollY - targetScrollY) > 20) {
        window.scrollTo({
          top: targetScrollY,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    }
  }, [justifiedRows]);

  // Compute Virtualized Window of rows (visible rows + overscan)
  const { visibleRows, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (justifiedRows.length === 0) {
      return { visibleRows: [], topSpacerHeight: 0, bottomSpacerHeight: 0 };
    }

    const gridTop = gridContainerRef.current?.offsetTop || 0;
    const relativeScrollTop = Math.max(0, scrollTop - gridTop);
    const overscan = 600; // ~3-4 rows above and below

    const visibleStart = Math.max(0, relativeScrollTop - overscan);
    const visibleEnd = relativeScrollTop + viewportHeight + overscan;

    let startIndex = 0;
    let endIndex = justifiedRows.length - 1;

    for (let i = 0; i < justifiedRows.length; i++) {
      if (justifiedRows[i].top + justifiedRows[i].height >= visibleStart) {
        startIndex = i;
        break;
      }
    }

    for (let i = startIndex; i < justifiedRows.length; i++) {
      if (justifiedRows[i].top > visibleEnd) {
        endIndex = i;
        break;
      }
      endIndex = i;
    }

    const topSpacer = justifiedRows[startIndex]?.top || 0;
    const lastRendered = justifiedRows[endIndex];
    const bottomSpacer = lastRendered
      ? Math.max(0, totalHeight - (lastRendered.top + lastRendered.height))
      : 0;

    return {
      visibleRows: justifiedRows.slice(startIndex, endIndex + 1),
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
    };
  }, [justifiedRows, scrollTop, viewportHeight, totalHeight]);

  // List of selected photo items (for modal preview, copying, WA export)
  const selectedPhotosList = useMemo(() => {
    return selectedIds
      .map((id) => photos.find((p) => p.id === id))
      .filter((p): p is GalleryPhotoItem => Boolean(p));
  }, [selectedIds, photos]);

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!gallery || !gallery.id || gallery.id === 'undefined') {
      setSubmitErrorMessage('ID galeri tidak valid. Silakan muat ulang halaman galeri.');
      setSubmitResultState('error');
      setShowResultModal(true);
      return;
    }

    if (totalSelected === 0) {
      setSubmitErrorMessage('Pilih minimal 1 foto sebelum mengirimkan pilihan.');
      setSubmitResultState('error');
      setShowResultModal(true);
      return;
    }

    // Check deadline
    if (isDeadlinePassed(gallery.deadline_date)) {
      setSubmitErrorMessage('Batas waktu pemilihan foto untuk galeri ini telah berakhir. Hubungi fotografer untuk memperpanjang.');
      setSubmitResultState('error');
      setShowResultModal(true);
      return;
    }

    // Check quota
    if (totalSelected > maxSelectable) {
      setSubmitErrorMessage(`Jumlah foto terpilih (${totalSelected}) melebihi kuota maksimal (${maxSelectable} foto). Kurangi pilihan terlebih dahulu.`);
      setSubmitResultState('error');
      setShowResultModal(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitResultState('submitting');
    setShowConfirmSubmit(false);
    setShowSelectedPanel(false);
    setShowResultModal(true);

    try {
      // 1. Try atomic & idempotent RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_gallery_selection', {
        p_slug: gallery.client_slug || client_slug,
        p_selected_ids: selectedIds,
      });

      if (rpcErr) {
        // If it's an application or database validation error (e.g. deadline expired, quota exceeded), throw directly
        const isFunctionMissing = rpcErr.code === 'PGRST202' || rpcErr.message?.toLowerCase().includes('function');
        if (!isFunctionMissing) {
          throw new Error(rpcErr.message);
        }

        // Fallback: direct table updates for databases before RPC migration
        const nowIso = new Date().toISOString();

        // Sync photo selections
        await supabase.from('photo_selections').delete().eq('gallery_id', gallery.id);

        if (selectedIds.length > 0) {
          const rowsToInsert = selectedIds.map((id, index) => ({
            gallery_id: gallery.id,
            gallery_photo_id: id,
            selection_order: index + 1,
            selected_at: nowIso,
          }));
          await supabase.from('photo_selections').insert(rowsToInsert);
        }

        // Update gallery status
        const { error: updateErr } = await supabase
          .from('galleries')
          .update({
            status: 'completed',
            submitted_at: nowIso,
          })
          .eq('id', gallery.id);

        if (updateErr) throw updateErr;
      }

      // Success
      const submissionTime = (rpcRes && rpcRes.submitted_at) ? rpcRes.submitted_at : new Date().toISOString();
      setSubmittedAtTime(submissionTime);
      setGallery((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'completed',
          submitted_at: submissionTime,
          studio_name: (rpcRes && rpcRes.studio_name) || prev.studio_name,
          photographer_phone: (rpcRes && rpcRes.photographer_phone) || prev.photographer_phone,
        };
      });
      setSubmitSuccess(true);
      setSubmitResultState('success');
    } catch (err: any) {
      let friendlyMsg = 'Tidak dapat menghubungi server studio. Foto pilihanmu tetap tersimpan aman di perangkat ini; kamu bisa kirim langsung lewat WhatsApp.';
      const rawMsg = (err?.message || '').toLowerCase();

      if (!navigator.onLine || rawMsg.includes('failed to fetch') || rawMsg.includes('network') || rawMsg.includes('connection')) {
        friendlyMsg = 'Koneksi terputus. Pilihanmu tersimpan di HP/laptop ini. Hubungkan internet lalu coba lagi, atau kirim lewat WhatsApp.';
      } else if (rawMsg.includes('deadline') || rawMsg.includes('tenggat')) {
        friendlyMsg = 'Batas waktu pemilihan foto sudah berakhir. Hubungi fotografer untuk memperpanjang.';
      } else if (rawMsg.includes('quota') || rawMsg.includes('kuota') || rawMsg.includes('melebihi')) {
        friendlyMsg = 'Jumlah foto melebihi batas kuota. Kurangi pilihan terlebih dahulu.';
      } else if (rawMsg.includes('empty') || rawMsg.includes('kosong') || rawMsg.includes('minimal')) {
        friendlyMsg = 'Pilih minimal 1 foto sebelum mengirimkan pilihan.';
      }

      setSubmitErrorMessage(friendlyMsg);
      setSubmitResultState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${theme === 'dark' ? 'bg-[#141416] text-white' : 'bg-[#f8f8f9] text-tinta'}`}>
        <div className="w-10 h-10 border-4 border-merah/25 border-t-merah rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider opacity-70 animate-pulse">
          Menyiapkan galeri foto klien...
        </p>
      </div>
    );
  }

  // Error / Not Found Screen (strictly for initial load failure)
  if (initialLoadError || !gallery) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans p-6 text-center ${theme === 'dark' ? 'bg-[#141416] text-white' : 'bg-[#f8f8f9] text-tinta'}`}>
        <div className="w-16 h-16 bg-merah/10 border border-merah/30 text-merah rounded-[2px] flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-normal mb-2">Galeri Tidak Dapat Ditemukan</h1>
        <p className="text-xs font-mono opacity-70 mb-8 max-w-md">{initialLoadError || 'Tautan galeri tidak valid atau telah dihapus.'}</p>
      </div>
    );
  }

  const maxSelectable = gallery.max_photos_selectable || 50;
  const progressPercent = Math.min((totalSelected / maxSelectable) * 100, 100);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#141416] text-[#e8e8ea]' : 'bg-[#f8f8f9] text-tinta'
      }`}
      style={{ paddingBottom: '110px' }}
    >
      {/* ─────── TOP BRAND BAR ─────── */}
      <header
        className={`sticky top-0 z-40 border-b transition-colors ${
          theme === 'dark'
            ? 'bg-[#161618]/90 border-white/10 backdrop-blur-md'
            : 'bg-white/90 border-garis backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg tracking-tight text-merah font-normal">
              by.<span className={theme === 'dark' ? 'text-white' : 'text-tinta'}>marryland</span>
            </span>
            <span className="hidden sm:inline-block w-px h-4 bg-garis opacity-60" />
            <span className="text-[11px] font-mono uppercase tracking-widest opacity-60 hidden sm:inline-block">
              {gallery.client_name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync status indicator */}
            <div className="text-[11px] font-mono hidden sm:flex items-center gap-1.5 opacity-60">
              {syncStatus === 'saving' && (
                <span className="text-amber-600 animate-pulse">Menyimpan...</span>
              )}
              {syncStatus === 'saved' && (
                <span className="text-green-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tersimpan
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="text-merah flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-btn border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-garis bg-white hover:bg-kertas text-tinta'
              }`}
              title={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              aria-label="Ubah tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─────── HERO HEADER ─────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8 text-center animate-fade-in">
        <span className="text-[11px] font-mono uppercase tracking-widest text-merah block mb-2 font-semibold">
          KURASI FOTO KLIEN
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal mb-3 leading-tight">
          {gallery.client_name}
        </h1>

        {/* Details row: date, deadline, status */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono opacity-70 mb-5">
          {gallery.event_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(gallery.event_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}

          {gallery.deadline_date && (
            <>
              <span className="opacity-40">•</span>
              <span className={`flex items-center gap-1 ${isExpired ? 'text-merah font-bold' : ''}`}>
                <Clock className="w-3.5 h-3.5" />
                Batas kurasi: {new Date(gallery.deadline_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </>
          )}

          <span className="opacity-40">•</span>
          <span>Batas: {maxSelectable} Foto</span>
        </div>

        {gallery.highlight_description && (
          <p className="max-w-xl mx-auto text-sm sm:text-base font-serif italic opacity-80 leading-relaxed mb-6 border-y border-garis/50 py-3">
            &ldquo;{gallery.highlight_description}&rdquo;
          </p>
        )}

        {/* Status: Pilihan Terkirim */}
        {hasBeenSubmitted && (
          <div className="max-w-xl mx-auto p-3.5 mb-3 rounded-[2px] border transition-colors bg-green-950/5 border-green-800/25 dark:bg-green-950/20 dark:border-green-800/40 text-left flex items-start gap-3 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-green-900/15 dark:bg-green-800/30 text-green-800 dark:text-green-300 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-green-900 dark:text-green-300">
                  Pilihan Terkirim
                </span>
                <span className="text-garis dark:text-white/20">•</span>
                <span className="font-mono text-xs text-tinta-lembut dark:text-gray-300">
                  {totalSelected} foto terpilih
                </span>
                {(submittedAtTime || gallery.submitted_at) && (
                  <>
                    <span className="text-garis dark:text-white/20">•</span>
                    <span className="font-mono text-xs text-tinta-lembut dark:text-gray-400">
                      {new Date(submittedAtTime || gallery.submitted_at!).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}, pukul {new Date(submittedAtTime || gallery.submitted_at!).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} WIB
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-tinta-lembut dark:text-gray-400 font-sans mt-1 leading-relaxed">
                Pilihan foto telah berhasil dikirim ke fotografer. Kamu tetap dapat melihat, menambah, atau mengubah foto pilihan dan mengirimkan pembaruan kapan saja.
              </p>
            </div>
          </div>
        )}

        {/* Mode Terkunci: Batas Waktu Berakhir */}
        {isExpired && !isCompleted && !submitSuccess && (
          <div className="max-w-xl mx-auto p-3.5 mb-3 rounded-[2px] border transition-colors bg-merah/5 border-merah/30 text-left flex items-start gap-3 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-merah/15 text-merah flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-merah block">
                Batas Waktu Kurasi Telah Berakhir
              </span>
              <p className="text-xs text-tinta-lembut dark:text-gray-400 font-sans mt-1 leading-relaxed">
                Tenggat waktu pemilihan foto telah berakhir. Silakan hubungi fotografer jika Anda memerlukan perpanjangan waktu.
              </p>
            </div>
          </div>
        )}

        {/* Aria-live announcement for screen readers */}
        <div aria-live="polite" className="sr-only">
          Terpilih {totalSelected} dari {maxSelectable} foto.
        </div>
      </section>

      {/* ─────── NAVIGATION TABS & CONTROLS ─────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-garis/70 pb-2">
          {/* Underline Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative whitespace-nowrap min-h-[44px] flex items-center ${
                activeTab === 'semua'
                  ? 'text-merah font-bold'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              Semua ({photos.length})
              {activeTab === 'semua' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />
              )}
            </button>

            {hasHighlights && (
              <button
                type="button"
                onClick={() => setActiveTab('highlight')}
                className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative whitespace-nowrap min-h-[44px] flex items-center ${
                  activeTab === 'highlight'
                    ? 'text-merah font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                Highlight
                {activeTab === 'highlight' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('terpilih')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative whitespace-nowrap min-h-[44px] flex items-center ${
                activeTab === 'terpilih'
                  ? 'text-merah font-bold'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              Terpilih ({totalSelected})
              {activeTab === 'terpilih' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('swipe')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative whitespace-nowrap min-h-[44px] flex items-center ${
                activeTab === 'swipe'
                  ? 'text-merah font-bold'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Mode Geser
              {activeTab === 'swipe' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah" />
              )}
            </button>
          </div>

          {/* Quick Stats on Right */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <span className="opacity-60">Status:</span>
            <span className={totalSelected >= maxSelectable ? 'text-merah font-bold' : 'font-semibold'}>
              {totalSelected} / {maxSelectable} Foto
            </span>
          </div>
        </div>

        {/* Search, Sort, & Orientation Controls (Hidden in Swipe Mode) */}
        {activeTab !== 'swipe' && (
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama file foto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 text-sm font-sans rounded-input border transition-colors focus:outline-none focus:border-merah ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30'
                    : 'bg-white border-garis text-tinta placeholder-tinta-lembut/50'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 p-1 rounded-btn"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Orientation Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Thumbnail Size Selector (Kecil, Sedang, Besar) */}
              <div
                className={`inline-flex p-0.5 border rounded-chip text-xs font-sans font-medium ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-garis'
                }`}
                role="group"
                aria-label="Ukuran tampilan foto"
              >
                <button
                  type="button"
                  onClick={() => handleThumbnailSizeChange('small')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    thumbnailSize === 'small'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Ukuran thumbnail kecil"
                >
                  Kecil
                </button>
                <button
                  type="button"
                  onClick={() => handleThumbnailSizeChange('medium')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    thumbnailSize === 'medium'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Ukuran thumbnail sedang"
                >
                  Sedang
                </button>
                <button
                  type="button"
                  onClick={() => handleThumbnailSizeChange('large')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    thumbnailSize === 'large'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Ukuran thumbnail besar"
                >
                  Besar
                </button>
              </div>

              {/* Orientation Buttons */}
              <div
                className={`inline-flex p-0.5 border rounded-chip text-xs font-sans font-medium ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-garis'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOrientationFilter('all')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    orientationFilter === 'all'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationFilter('portrait')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    orientationFilter === 'portrait'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Potret
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationFilter('landscape')}
                  className={`px-3 py-1.5 rounded-chip transition-colors duration-150 min-h-[36px] ${
                    orientationFilter === 'landscape'
                      ? 'bg-merah text-white font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Lanskap
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 text-xs font-sans rounded-input border transition-colors focus:outline-none focus:border-merah cursor-pointer min-h-[36px] ${
                    theme === 'dark'
                      ? 'bg-[#1a1a1c] border-white/10 text-white'
                      : 'bg-white border-garis text-tinta'
                  }`}
                >
                  <option value="order">Urutan Asli</option>
                  <option value="name-asc">Nama A-Z</option>
                  <option value="name-desc">Nama Z-A</option>
                  <option value="selected">Urutan Dipilih</option>
                </select>
              </div>

              {/* Subfolder Chips (if available) */}
              {subfolders.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className={`px-3 py-2 text-xs font-sans rounded-input border transition-colors focus:outline-none focus:border-merah cursor-pointer min-h-[36px] ${
                      theme === 'dark'
                        ? 'bg-[#1a1a1c] border-white/10 text-white'
                        : 'bg-white border-garis text-tinta'
                    }`}
                  >
                    <option value="all">Semua Subfolder</option>
                    {subfolders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─────── MAIN CONTENT: SWIPE MODE VS JUSTIFIED GRID ─────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6" ref={gridContainerRef}>
        {activeTab === 'swipe' ? (
          <SwipeSelector
            photos={photos}
            onToggleSelection={toggleSelection}
            isPhotoSelected={isPhotoSelected}
            onOpenViewer={(idx) => setViewerIndex(idx)}
            maxSelectable={maxSelectable}
            totalSelected={totalSelected}
            onViewSelections={() => setShowSelectedPanel(true)}
          />
        ) : filteredPhotos.length === 0 ? (
          <div
            className={`p-12 text-center border border-dashed rounded-[2px] font-mono text-xs ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 opacity-70'
                : 'bg-white border-garis opacity-70'
            }`}
          >
            Tidak ada foto yang cocok dengan filter atau pencarian saat ini.
          </div>
        ) : (
          /* Justified Row Layout Container with Virtualization */
          <div
            className="relative w-full"
            style={{ minHeight: `${totalHeight}px` }}
          >
            {/* Top spacer for virtualization */}
            {topSpacerHeight > 0 && <div style={{ height: `${topSpacerHeight}px` }} />}

            {/* Rendered visible rows with overscan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
              {visibleRows.map((row) => (
                <div
                  key={row.top}
                  className="flex items-center"
                  style={{
                    height: `${row.height}px`,
                    gap: `${gap}px`,
                  }}
                >
                  {row.items.map(({ item: photo, width, height, isExtremeRatio }) => {
                    const isSelected = isPhotoSelected(photo.id);
                    const selectionOrder = getSelectionOrder(photo.id);
                    const globalIndex = photos.findIndex((p) => p.id === photo.id);

                    return (
                      <div
                        key={photo.id}
                        onClick={() => setViewerIndex(globalIndex >= 0 ? globalIndex : 0)}
                        className={`group relative overflow-hidden rounded-[2px] cursor-pointer transition-all duration-150 shrink-0 ${
                          theme === 'dark' ? 'bg-[#1e1e22]' : 'bg-[#f0ece1]'
                        } ${
                          isSelected
                            ? 'ring-[3px] ring-merah-tanda ring-inset'
                            : 'hover:opacity-95'
                        }`}
                        style={{ width: `${width}px`, height: `${height}px` }}
                      >
                        {/* Image Thumbnail with dynamic DPR sizing and extreme-ratio containment */}
                        <ImageWithFallback
                          src={photo.thumbnail_url}
                          alt={`Foto ${gallery?.client_name ? `${gallery.client_name} - ` : ''}${photo.filename}`}
                          loading="lazy"
                          renderWidth={width}
                          priority={globalIndex < 6 ? 'high' : 'normal'}
                          onDimensionDetected={(nw, nh) => handleDimensionDetected(photo.id, nw, nh)}
                          className={`w-full h-full select-none pointer-events-none transition-transform duration-300 group-hover:scale-[1.015] ${
                            isExtremeRatio ? 'object-contain' : 'object-cover'
                          }`}
                          fallbackClassName="w-full h-full"
                          isMissing={photo.is_missing}
                        />

                        {/* Top-Right Selection Touch Target (Minimal 44x44px for accessibility) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(photo.id, e);
                          }}
                          aria-label={isSelected ? `Batalkan pilihan foto ${photo.filename}` : `Pilih foto ${photo.filename}`}
                          aria-pressed={isSelected}
                          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center z-20 cursor-pointer"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-merah-tanda text-white border-2 border-white shadow-md scale-105'
                                : 'bg-black/40 hover:bg-black/60 border border-white/60 text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </button>

                        {/* Selection Order Badge (Top Left) */}
                        {isSelected && selectionOrder !== null && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-merah-tanda text-white text-[10px] font-mono font-bold rounded-[2px] shadow-md z-10 pointer-events-none">
                            #{selectionOrder}
                          </div>
                        )}

                        {/* Desktop Hover Actions Overlay */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end p-2.5">
                          <span className="text-[10px] font-mono text-white/90 truncate drop-shadow-md">
                            {photo.filename}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom spacer for virtualization */}
            {bottomSpacerHeight > 0 && <div style={{ height: `${bottomSpacerHeight}px` }} />}
          </div>
        )}
      </main>

      {/* ─────── STICKY BOTTOM ACTION BAR (Respects safe-area) ─────── */}
      <div
        className={`fixed bottom-0 inset-x-0 z-30 border-t transition-colors shadow-2xl ${
          theme === 'dark'
            ? 'bg-[#161618]/95 border-white/10 text-white backdrop-blur-md'
            : 'bg-white/95 border-garis text-tinta backdrop-blur-md'
        }`}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Progress info & bar */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                Pilihan Kurasi
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-merah">
                {totalSelected} <span className="opacity-60 text-xs font-normal">/ {maxSelectable} foto</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="hidden sm:block w-32 h-2 bg-black/10 dark:bg-white/10 rounded-chip overflow-hidden">
              <div
                className="h-full bg-merah rounded-chip transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSelectedPanel(true)}
              className={`px-4 py-2.5 rounded-btn text-sm font-sans font-medium transition-colors duration-150 min-h-[44px] flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2 ${
                theme === 'dark'
                  ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-garis bg-kertas hover:bg-kertas-tua text-tinta'
              }`}
            >
              <span>Lihat pilihan</span>
              <span className="px-1.5 py-0.5 rounded-chip bg-merah/10 text-merah font-semibold text-xs">
                {totalSelected}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={totalSelected === 0}
              className="px-6 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-sm font-sans font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 focus-visible:ring-offset-kertas"
            >
              <Send className="w-4 h-4" />
              <span>{hasBeenSubmitted ? 'Perbarui pilihan' : 'Kirim pilihan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────── UNIFIED FULLSCREEN PHOTO VIEWER ─────── */}
      <PhotoViewer
        photos={photos}
        initialIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        isPhotoSelected={isPhotoSelected}
        onToggleSelection={toggleSelection}
        getSelectionOrder={getSelectionOrder}
        selectionCount={totalSelected}
        maxSelectable={maxSelectable}
        allowDownload={Boolean(gallery.allow_download)}
      />

      {/* ─────── SELECTED PHOTOS PANEL (DRAWER) ─────── */}
      <SelectedPhotosPanel
        isOpen={showSelectedPanel}
        onClose={() => setShowSelectedPanel(false)}
        photos={photos}
        selectedPhotoIds={selectedIds}
        onRemoveSelection={removeSelection}
        onOpenViewer={(idx) => {
          setShowSelectedPanel(false);
          setViewerIndex(idx);
        }}
        onSubmit={() => {
          setShowSelectedPanel(false);
          setShowConfirmSubmit(true);
        }}
        maxSelectable={maxSelectable}
      />

      {/* ─────── SUBMIT CONFIRMATION DIALOG ─────── */}
      <SubmitConfirmDialog
        open={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleFinalSubmit}
        totalSelected={totalSelected}
        maxSelectable={maxSelectable}
        remainingQuota={remainingQuota}
        isSubmitting={isSubmitting}
      />

      {/* ─────── SUBMIT RESULT MODAL (SUBMITTING, SUCCESS, ERROR) ─────── */}
      <SubmitResultDialog
        open={showResultModal}
        state={submitResultState}
        onClose={() => setShowResultModal(false)}
        onRetry={handleFinalSubmit}
        totalSelected={totalSelected}
        selectedPhotos={selectedPhotosList}
        studioName={gallery.studio_name || 'Studio'}
        photographerPhone={gallery.photographer_phone || gallery.client_whatsapp}
        galleryName={gallery.client_name || 'Galeri'}
        submittedAt={submittedAtTime || gallery.submitted_at}
        errorMessage={submitErrorMessage}
        isRetrying={isSubmitting}
      />
    </div>
  );
}
