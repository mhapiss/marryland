// src/components/admin/EditorWithPreview.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PageSectionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isComplete?: boolean;
  completeText?: string;
  visible?: boolean;
  onToggleVisible?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export interface EditorWithPreviewProps {
  title: string;
  subtitle?: string;
  previewUrl: string;
  draftData: any;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  pageSections: PageSectionItem[];
  activeSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  children: React.ReactNode;
  topActions?: React.ReactNode;
  quickStart?: React.ReactNode;
  localStorageKey?: string;
  onRestoreLocalDraft?: (draft: any) => void;
  highlightedSectionId?: string | null;
}

export function EditorWithPreview({
  title,
  subtitle,
  previewUrl,
  draftData,
  isDirty,
  isSaving,
  onSave,
  pageSections = [],
  activeSectionId,
  onSelectSection,
  children,
  topActions,
  quickStart,
  localStorageKey,
  onRestoreLocalDraft,
  highlightedSectionId,
}: EditorWithPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isPageMapCollapsed, setIsPageMapCollapsed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Local draft restore banner
  const [hasNewerLocalDraft, setHasNewerLocalDraft] = useState(false);
  const [localDraftTimestamp, setLocalDraftTimestamp] = useState<string | null>(null);

  // Check localStorage for newer draft on mount
  useEffect(() => {
    if (!localStorageKey) return;
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && parsed.data) {
          setHasNewerLocalDraft(true);
          setLocalDraftTimestamp(new Date(parsed.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      // ignore
    }
  }, [localStorageKey]);

  // Auto-save local draft whenever draftData changes
  useEffect(() => {
    if (!localStorageKey || !isDirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            data: draftData,
            timestamp: Date.now(),
          })
        );
      } catch {
        // quota exceeded or private mode
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [draftData, isDirty, localStorageKey]);

  // beforeunload warning if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Send draft data to iframe (debounced ~150ms)
  const sendDraftToIframe = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'MARRYLAND_DRAFT_UPDATE',
          ...draftData,
        },
        window.location.origin
      );
    } catch {
      // ignore
    }
  }, [draftData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sendDraftToIframe();
    }, 150);
    return () => clearTimeout(timer);
  }, [draftData, sendDraftToIframe]);

  // Handle incoming messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

      if (data.type === 'MARRYLAND_PREVIEW_READY') {
        setIframeLoaded(true);
        sendDraftToIframe();
      } else if (data.type === 'MARRYLAND_REGION_SELECT') {
        if (data.editKey && onSelectSection) {
          onSelectSection(data.editKey);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendDraftToIframe, onSelectSection]);

  // Send scroll command to iframe when active section changes in parent
  const handleScrollPreviewTo = (sectionId: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'MARRYLAND_SCROLL_TO_REGION',
          editKey: sectionId,
        },
        window.location.origin
      );
    } catch {
      // ignore
    }
  };

  const handleApplyLocalDraft = () => {
    if (!localStorageKey || !onRestoreLocalDraft) return;
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          onRestoreLocalDraft(parsed.data);
          toast.success('Draf lokal berhasil dipulihkan.');
        }
      }
    } catch {
      toast.error('Gagal membaca draf lokal');
    } finally {
      setHasNewerLocalDraft(false);
    }
  };

  const handleDismissLocalDraft = () => {
    if (localStorageKey) {
      localStorage.removeItem(localStorageKey);
    }
    setHasNewerLocalDraft(false);
  };

  // Preview container scale calculations
  // Desktop mode: 1280px width, scaled with CSS transform
  // Mobile mode: 390px width, scaled with CSS transform
  const desktopWidth = 1280;
  const mobileWidth = 390;

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-65px)] bg-kertas">
      {/* 1. TOP SAVE & STATUS BAR */}
      <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-garis px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-serif font-medium text-tinta leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-tinta-lembut font-sans line-clamp-1">{subtitle}</p>
            )}
          </div>

          {/* Dirty state indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-mono border">
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-[2px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                Ada perubahan belum disimpan
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-[2px]">
                <Check className="w-3 h-3 text-emerald-600" />
                Semua tersimpan
              </span>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5">
          {topActions}

          {/* Preview Toggle for Desktop */}
          <div className="hidden lg:flex items-center border border-garis rounded-[2px] bg-kertas-tua/40 p-0.5">
            <button
              type="button"
              onClick={() => {
                setShowPreview(true);
                setPreviewDevice('desktop');
              }}
              className={`p-1.5 rounded-[2px] text-xs transition-colors flex items-center gap-1 ${
                showPreview && previewDevice === 'desktop'
                  ? 'bg-white text-merah font-medium shadow-2xs'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
              title="Pratinjau Desktop (1280px)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">Desktop</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPreview(true);
                setPreviewDevice('mobile');
              }}
              className={`p-1.5 rounded-[2px] text-xs transition-colors flex items-center gap-1 ${
                showPreview && previewDevice === 'mobile'
                  ? 'bg-white text-merah font-medium shadow-2xs'
                  : 'text-tinta-lembut hover:text-tinta'
              }`}
              title="Pratinjau Mobile (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">HP</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`p-1.5 rounded-[2px] text-xs transition-colors ${
                !showPreview ? 'bg-white text-merah font-medium shadow-2xs' : 'text-tinta-lembut hover:text-tinta'
              }`}
              title={showPreview ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mobile Preview FAB Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden px-3 py-2 bg-kertas-tua hover:bg-white text-tinta border border-garis rounded-[2px] text-xs font-medium flex items-center gap-1.5 min-h-[40px] transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-merah" />
            <span>Pratinjau</span>
          </button>

          {/* Main Save Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 bg-merah hover:bg-merah-hover text-white text-xs font-medium rounded-[2px] flex items-center gap-2 transition-all min-h-[40px] shadow-sm disabled:opacity-50"
            title="Simpan Perubahan (Ctrl + S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            <span className="hidden xl:inline text-[10px] font-mono opacity-80 bg-black/20 px-1 py-0.5 rounded">
              Ctrl+S
            </span>
          </button>
        </div>
      </div>

      {/* Local Draft Restoration Banner */}
      {hasNewerLocalDraft && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Terdeteksi salinan draf lokal yang tersimpan otomatis pada {localDraftTimestamp}.
              Apakah ingin memulihkan perubahan ini?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleApplyLocalDraft}
              className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-[2px] font-medium text-xs transition-colors"
            >
              Pulihkan Draf
            </button>
            <button
              type="button"
              onClick={handleDismissLocalDraft}
              className="p-1 text-amber-700 hover:text-amber-900"
              title="Abaikan draf lokal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Start Guide if present */}
      {quickStart && <div className="p-4 sm:p-6 pb-0">{quickStart}</div>}

      {/* 2. MAIN 3-ZONE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* ZONE 1: PAGE MAP (LEFT NAVIGATION) */}
        {pageSections.length > 0 && (
          <aside
            className={`transition-all duration-200 bg-white border-r border-garis flex flex-col shrink-0 ${
              isPageMapCollapsed ? 'w-12' : 'w-64'
            }`}
          >
            {/* Header / Collapse Toggle */}
            <div className="p-3 border-b border-garis flex items-center justify-between">
              {!isPageMapCollapsed && (
                <div className="flex items-center gap-1.5 text-tinta">
                  <Layers className="w-3.5 h-3.5 text-merah" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                    Peta Halaman
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsPageMapCollapsed(!isPageMapCollapsed)}
                className="p-1 hover:bg-kertas-tua rounded-[2px] text-tinta-lembut hover:text-tinta transition-colors mx-auto"
                title={isPageMapCollapsed ? 'Buka Peta Halaman' : 'Lipat Peta Halaman'}
              >
                {isPageMapCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Section items list */}
            {!isPageMapCollapsed && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {pageSections.map((sec, idx) => {
                  const isSelected = activeSectionId === sec.id;
                  const isHighlighted = highlightedSectionId === sec.id;

                  return (
                    <div
                      key={sec.id}
                      onClick={() => {
                        onSelectSection?.(sec.id);
                        handleScrollPreviewTo(sec.id);
                      }}
                      className={`group/sec cursor-pointer p-2 rounded-[2px] text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-merah text-white font-medium shadow-2xs'
                          : isHighlighted
                          ? 'bg-merah/10 text-merah border border-merah/30 font-medium'
                          : 'text-tinta hover:bg-kertas-tua/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {/* Status completion dot / check */}
                        {sec.isComplete ? (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-white' : 'bg-emerald-600'
                            }`}
                            title="Lengkap terisi"
                          />
                        ) : (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-white/60' : 'bg-amber-500'
                            }`}
                            title="Belum lengkap"
                          />
                        )}

                        <span className="truncate text-xs">{sec.label}</span>
                      </div>

                      {/* Section actions (Reorder up/down) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                        {sec.onMoveUp && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sec.onMoveUp?.();
                            }}
                            className="p-1 hover:bg-black/10 rounded-[2px]"
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                        )}
                        {sec.onMoveDown && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sec.onMoveDown?.();
                            }}
                            className="p-1 hover:bg-black/10 rounded-[2px]"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* ZONE 2: FORM CONTENT EDITOR (MIDDLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </div>

        {/* ZONE 3: LIVE PREVIEW IFRAME (RIGHT STICKY PANEL) */}
        {showPreview && (
          <aside className="hidden lg:flex flex-col border-l border-garis bg-neutral-900/5 relative shrink-0 w-[420px] xl:w-[500px] 2xl:w-[580px] overflow-hidden">
            {/* Iframe Device Bar */}
            <div className="bg-white px-4 py-2 border-b border-garis flex items-center justify-between text-xs text-tinta-lembut">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-merah">
                  Pratinjau Langsung
                </span>
                <span className="text-[10px] font-mono text-tinta-lembut">
                  {previewDevice === 'desktop' ? '1280px (Skala)' : '390px (HP)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={sendDraftToIframe}
                  className="p-1 hover:bg-kertas-tua rounded-[2px] text-tinta-lembut hover:text-tinta transition-colors"
                  title="Segarkan data pratinjau"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Iframe Viewport Container */}
            <div className="flex-1 flex items-start justify-center p-4 overflow-y-auto overflow-x-hidden bg-[#e5e5e5]/40">
              <div
                className={`transition-all duration-300 shadow-xl border border-garis bg-white rounded-[4px] overflow-hidden ${
                  previewDevice === 'mobile'
                    ? 'w-[390px] h-[844px] max-h-[calc(100vh-160px)] shrink-0'
                    : 'w-[1280px] h-[900px] origin-top'
                }`}
                style={
                  previewDevice === 'desktop'
                    ? {
                        transform: `scale(${
                          // scale down to fit container width smoothly
                          420 / 1280
                        })`,
                        transformOrigin: 'top center',
                        marginBottom: '-500px', // compensate for scale overflow
                      }
                    : {}
                }
              >
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  title="Pratinjau Halaman"
                  className="w-full h-full border-0 select-none"
                  onLoad={() => {
                    setIframeLoaded(true);
                    sendDraftToIframe();
                  }}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MOBILE PREVIEW MODAL / DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col lg:hidden">
          <div className="bg-white px-4 py-3 border-b border-garis flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-merah">
              Pratinjau Mobile
            </span>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 rounded-[2px] bg-kertas-tua text-tinta hover:text-merah"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-2 flex items-center justify-center bg-neutral-900">
            <div className="w-[375px] h-[667px] max-h-[85vh] bg-white rounded-[8px] overflow-hidden shadow-2xl">
              <iframe
                src={previewUrl}
                title="Mobile Preview Frame"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorWithPreview;
