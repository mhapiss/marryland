// src/pages/ContentManager.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import {
  ALL_PAGE_SCHEMAS,
  PageSchema,
  SectionSchema,
  FieldSchema,
  PhotoSlotSchema,
  MediaRef,
  getDefaultPageContent,
} from '../content/schema';
import { MediaPickerModal } from '../components/admin/MediaPickerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';
import {
  Save,
  RotateCcw,
  History,
  Eye,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function ContentManager() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPageKey = searchParams.get('page') || 'home';
  const activeSchema: PageSchema =
    ALL_PAGE_SCHEMAS.find((s) => s.pageKey === currentPageKey) || ALL_PAGE_SCHEMAS[1];

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [serverVersion, setServerVersion] = useState<number>(1);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Photo Picker Modal State
  const [activeSlot, setActiveSlot] = useState<{
    sectionId: string;
    slot: PhotoSlotSchema;
    currentMedia?: MediaRef;
  } | null>(null);

  // Version History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Conflict Dialog
  const [hasConflict, setHasConflict] = useState(false);

  // Load Page Content from Supabase or localStorage draft
  const loadPageContent = useCallback(async () => {
    setLoading(true);
    setHasConflict(false);

    try {
      const defaultContent = getDefaultPageContent(currentPageKey);

      // Check server
      if (currentPageKey === 'global') {
        const { data: row } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        const base = row?.data || defaultContent;
        setFormData(base);
        setOriginalData(base);
        setServerVersion(row?.version || 1);
      } else {
        const { data: row } = await supabase
          .from('page_content')
          .select('*')
          .eq('page_key', currentPageKey)
          .single();

        const base = row?.content ? { ...defaultContent, ...row.content } : defaultContent;
        setFormData(base);
        setOriginalData(base);
        setServerVersion(row?.version || 1);
      }

      // Check localStorage draft
      const draft = localStorage.getItem(`draft_${currentPageKey}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          toast.info('Draf belum tersimpan terdeteksi dari sesi sebelumnya.', {
            action: {
              label: 'Pulihkan Draf',
              onClick: () => {
                setFormData(parsed);
                setIsDirty(true);
              },
            },
          });
        } catch {
          // ignore
        }
      }

      // Open first 2 sections by default
      const initialOpen: Record<string, boolean> = {};
      activeSchema.sections.forEach((sec, idx) => {
        initialOpen[sec.id] = idx < 2;
      });
      setOpenSections(initialOpen);
    } catch {
      setFormData(getDefaultPageContent(currentPageKey));
    } finally {
      setLoading(false);
      setIsDirty(false);
    }
  }, [currentPageKey, activeSchema]);

  useEffect(() => {
    loadPageContent();
  }, [loadPageContent]);

  // Warn before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Update Field Value
  const handleFieldChange = (sectionId: string, fieldKey: string, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldKey]: value,
        },
      };

      // Auto-save draft to localStorage
      try {
        localStorage.setItem(`draft_${currentPageKey}`, JSON.stringify(updated));
      } catch {
        // ignore
      }

      return updated;
    });
    setIsDirty(true);
  };

  // Toggle Section Visibility
  const handleToggleVisibility = (sectionId: string) => {
    setFormData((prev) => {
      const current = prev[sectionId]?.visible ?? true;
      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          visible: !current,
        },
      };
    });
    setIsDirty(true);
  };

  // Reset to schema default
  const handleResetSection = (section: SectionSchema) => {
    const defaultData: Record<string, any> = {
      visible: section.defaultVisible ?? true,
    };
    section.fields.forEach((f) => {
      defaultData[f.key] = f.default;
    });
    if (section.photoSlots) {
      section.photoSlots.forEach((ps) => {
        defaultData[ps.key] = ps.defaultPhotos || [];
      });
    }

    setFormData((prev) => ({
      ...prev,
      [section.id]: defaultData,
    }));
    setIsDirty(true);
    toast.success(`Section "${section.label}" dikembalikan ke teks awal.`);
  };

  // Save changes to Supabase with optimistic concurrency check
  const handleSave = async (forceOverwrite: boolean = false) => {
    setSaving(true);
    try {
      if (currentPageKey === 'global') {
        // Check version
        const { data: latest } = await supabase
          .from('site_settings')
          .select('version')
          .eq('id', 1)
          .single();

        if (!forceOverwrite && latest && latest.version > serverVersion) {
          setHasConflict(true);
          setSaving(false);
          return;
        }

        const newVersion = (latest?.version || serverVersion) + 1;
        const { error } = await supabase
          .from('site_settings')
          .update({
            data: formData,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('id', 1);

        if (error) throw error;
        setServerVersion(newVersion);
      } else {
        // Page content
        const { data: latest } = await supabase
          .from('page_content')
          .select('version')
          .eq('page_key', currentPageKey)
          .single();

        if (!forceOverwrite && latest && latest.version > serverVersion) {
          setHasConflict(true);
          setSaving(false);
          return;
        }

        const newVersion = (latest?.version || serverVersion) + 1;

        // 1. Save to page_content
        const { error: pageErr } = await supabase.from('page_content').upsert({
          page_key: currentPageKey,
          content: formData,
          version: newVersion,
          updated_at: new Date().toISOString(),
        });
        if (pageErr) throw pageErr;

        // 2. Add revision record
        await supabase.from('content_revisions').insert({
          page_key: currentPageKey,
          content: formData,
          version: newVersion,
        });

        setServerVersion(newVersion);
      }

      setOriginalData(formData);
      setIsDirty(false);
      localStorage.removeItem(`draft_${currentPageKey}`);
      toast.success('Perubahan konten berhasil disimpan.');
    } catch (err: any) {
      toast.error('Gagal menyimpan konten: ' + (err.message || 'Coba lagi'));
    } finally {
      setSaving(false);
    }
  };

  // Fetch Version History
  const fetchRevisions = async () => {
    setLoadingRevisions(true);
    setShowHistoryModal(true);
    try {
      const { data } = await supabase
        .from('content_revisions')
        .select('*')
        .eq('page_key', currentPageKey)
        .order('created_at', { ascending: false })
        .limit(20);

      setRevisions(data || []);
    } catch {
      setRevisions([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Restore Revision
  const handleRestoreRevision = (rev: any) => {
    setFormData(rev.content);
    setIsDirty(true);
    setShowHistoryModal(false);
    toast.success(`Versi #${rev.version} dipulihkan. Klik "Simpan" untuk menerapkan secara permanen.`);
  };

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta flex flex-col">
      {/* Top Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif font-normal tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="border border-garis text-merah bg-kertas-tua text-[10px] px-2.5 py-0.5 rounded-chip font-sans font-medium uppercase">
            PUSAT KONTEN TERSINKRON
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/admin/media"
            className="text-xs font-sans font-medium text-merah hover:underline px-3 py-1.5 border border-garis rounded-btn min-h-[44px] flex items-center"
          >
            Pustaka Media
          </Link>
          <Link to="/admin" className="text-xs font-sans font-medium text-tinta-lembut hover:text-tinta">
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Main Workspace (Tree on Left, Editor + Live Preview on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDEBAR: Page Tree */}
        <aside className="w-full lg:w-64 bg-white border-r border-garis p-4 shrink-0 overflow-y-auto">
          <span className="text-[10px] uppercase font-mono tracking-widest text-tinta-lembut block mb-3 px-2">
            DAFTAR HALAMAN SITUS
          </span>

          <nav className="space-y-1">
            {ALL_PAGE_SCHEMAS.map((sch) => {
              const isSelected = sch.pageKey === currentPageKey;

              return (
                <button
                  key={sch.pageKey}
                  type="button"
                  onClick={() => setSearchParams({ page: sch.pageKey })}
                  className={`w-full text-left px-3 py-2.5 rounded-[2px] text-xs font-medium transition-colors flex items-center justify-between min-h-[44px] ${
                    isSelected
                      ? 'bg-merah text-white font-medium shadow-sm'
                      : 'text-tinta hover:bg-kertas-tua/50'
                  }`}
                >
                  <span>{sch.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">{sch.path}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-garis px-2 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-tinta-lembut block mb-2">
              PORTOFOLIO ADAT
            </span>
            <Link
              to="/admin/portfolio"
              className="text-xs text-merah font-medium hover:underline block py-1.5"
            >
              Kelola Koleksi Per Adat →
            </Link>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Form Editor */}
        <div className="w-full lg:w-[480px] xl:w-[540px] bg-kertas/40 border-r border-garis p-6 overflow-y-auto space-y-6 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-normal text-tinta">{activeSchema.title}</h2>
              <p className="text-xs text-tinta-lembut mt-1">{activeSchema.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchRevisions}
                className="p-2 border border-garis bg-white hover:bg-kertas-tua rounded-[2px] text-xs font-medium text-tinta-lembut hover:text-tinta transition-colors flex items-center gap-1.5 min-h-[44px]"
                title="Lihat Riwayat Versi"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Riwayat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(true)}
                className="lg:hidden p-2 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium flex items-center gap-1.5 min-h-[44px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
            </div>
          </div>

          {/* Sections Accordions */}
          <div className="space-y-4">
            {activeSchema.sections.map((section) => {
              const isOpen = openSections[section.id];
              const isVisible = formData[section.id]?.visible ?? true;

              return (
                <div
                  key={section.id}
                  className={`bg-white rounded-[2px] border transition-all ${
                    isOpen ? 'border-merah/40' : 'border-garis'
                  }`}
                >
                  {/* Section Title Bar */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                    onClick={() =>
                      setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-normal text-sm text-tinta">
                        {section.label}
                      </span>
                      {section.allowToggleVisibility && (
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-[2px] border ${
                            isVisible ? 'bg-merah/10 text-merah border-merah/25' : 'bg-kertas-tua text-tinta-lembut border-garis'
                          }`}
                        >
                          {isVisible ? 'Tampil' : 'Sembunyi'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-tinta-lembut" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-tinta-lembut" />
                      )}
                    </div>
                  </div>

                  {/* Section Body */}
                  {isOpen && (
                    <div className="p-4 pt-0 border-t border-garis space-y-4">
                      {/* Toggle switch if allowToggleVisibility */}
                      {section.allowToggleVisibility && (
                        <div className="flex items-center justify-between py-2 border-b border-garis">
                          <span className="text-xs font-medium text-tinta">
                            Tampilkan Section Ini di Publik?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(section.id)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${
                              isVisible ? 'bg-merah' : 'bg-garis'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                                isVisible ? 'right-1' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      )}

                      {/* Fields */}
                      {section.fields.map((field) => {
                        const val = formData[section.id]?.[field.key] ?? field.default ?? '';

                        return (
                          <div key={field.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-mono uppercase tracking-wider text-tinta-lembut">
                                {field.label}
                              </label>
                              {field.charLimit && (
                                <span className="text-[10px] text-tinta-lembut font-mono">
                                  {typeof val === 'string' ? val.length : 0}/{field.charLimit}
                                </span>
                              )}
                            </div>

                            {field.type === 'textarea' ? (
                              <textarea
                                rows={3}
                                value={val}
                                onChange={(e) =>
                                  handleFieldChange(section.id, field.key, e.target.value)
                                }
                                className="w-full border border-garis rounded-[2px] p-2.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={val}
                                onChange={(e) =>
                                  handleFieldChange(section.id, field.key, e.target.value)
                                }
                                className="w-full border border-garis rounded-[2px] p-2.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              >
                                {field.options?.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'list' ? (
                              <div className="space-y-2 border border-garis p-2.5 rounded-[2px] bg-kertas/40">
                                <span className="text-[10px] font-mono text-tinta-lembut block">
                                  Daftar Elemen ({Array.isArray(val) ? val.length : 0} item)
                                </span>
                                {Array.isArray(val) &&
                                  val.map((item: any, itemIdx: number) => (
                                    <div
                                      key={itemIdx}
                                      className="p-2 bg-white border border-garis rounded-[2px] text-xs space-y-1.5"
                                    >
                                      {field.itemFields?.map((f) => (
                                        <div key={f.key}>
                                          <span className="text-[10px] text-tinta-lembut font-mono block">{f.label}</span>
                                          <input
                                            type="text"
                                            value={item[f.key] || ''}
                                            onChange={(e) => {
                                              const updatedList = [...val];
                                              updatedList[itemIdx] = {
                                                ...updatedList[itemIdx],
                                                [f.key]: e.target.value,
                                              };
                                              handleFieldChange(section.id, field.key, updatedList);
                                            }}
                                            className="w-full border border-garis rounded-[2px] px-2 py-1 text-xs text-tinta bg-white focus:outline-none focus:border-merah"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={val}
                                onChange={(e) =>
                                  handleFieldChange(
                                    section.id,
                                    field.key,
                                    field.type === 'number' ? Number(e.target.value) : e.target.value
                                  )
                                }
                                className="w-full border border-garis rounded-[2px] px-3 py-2 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              />
                            )}

                            {field.description && (
                              <p className="text-[10px] text-tinta-lembut">{field.description}</p>
                            )}
                          </div>
                        );
                      })}

                      {/* Photo Slots */}
                      {section.photoSlots && section.photoSlots.length > 0 && (
                        <div className="pt-3 border-t border-garis space-y-3">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-merah block">
                            Slot Foto Section
                          </span>

                          {section.photoSlots.map((slot) => {
                            const slotPhotos = formData[section.id]?.[slot.key] || [];

                            return (
                              <div
                                key={slot.key}
                                className="p-3 bg-kertas-tua/40 border border-garis rounded-[2px] space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-serif font-normal text-xs text-tinta block">
                                      {slot.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-tinta-lembut">
                                      Rasio: {slot.suggestedAspect} (Maks: {slot.maxCount})
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveSlot({
                                        sectionId: section.id,
                                        slot,
                                        currentMedia: slotPhotos[0],
                                      })
                                    }
                                    className="px-3 py-1 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-[10px] font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Pilih dari Pustaka</span>
                                  </button>
                                </div>

                                {/* Preview assigned photos in slot */}
                                {slotPhotos.length > 0 ? (
                                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    {slotPhotos.map((p: any, pIdx: number) => (
                                      <div
                                        key={pIdx}
                                        className="relative group w-16 h-20 shrink-0 rounded-[2px] overflow-hidden border border-garis"
                                      >
                                        <img
                                          src={p.url || p.image_url}
                                          alt={p.alt || 'Foto slot'}
                                          className="w-full h-full object-cover"
                                          style={{ objectPosition: p.focal || 'center' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = slotPhotos.filter(
                                              (_: any, i: number) => i !== pIdx
                                            );
                                            handleFieldChange(section.id, slot.key, updated);
                                          }}
                                          className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Lepas foto"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-2 border border-dashed border-garis text-center text-[10px] text-tinta-lembut font-mono rounded-[2px]">
                                    Belum ada foto yang dipilih untuk slot ini.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reset section button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleResetSection(section)}
                          className="text-[10px] text-tinta-lembut hover:text-merah transition-colors flex items-center gap-1 font-mono"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Kembalikan ke teks awal</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Realtime Live Preview (Identical to Public Components) */}
        <div className="hidden lg:flex flex-1 flex-col bg-kertas-tua/30 overflow-hidden">
          {/* Preview Device Controls */}
          <div className="bg-white border-b border-garis px-6 py-2.5 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-tinta-lembut">
              Pratinjau Langsung (Sama Persis dengan Tampilan Pengunjung)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-[2px] transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-merah text-white'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
                title="Tampilan Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-[2px] transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-merah text-white'
                    : 'text-tinta-lembut hover:text-tinta'
                }`}
                title="Tampilan Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div
              className={`bg-kertas text-tinta transition-all duration-300 border border-garis rounded-[2px] overflow-hidden flex flex-col ${
                previewDevice === 'mobile' ? 'w-[375px] min-h-[667px]' : 'w-full max-w-5xl'
              }`}
            >
              {/* Live Rendered Content */}
              <div className="p-8 space-y-12">
                {/* Header Info */}
                <div className="border-b border-garis pb-6">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-merah block mb-1">
                    Pratinjau: {activeSchema.title}
                  </span>
                  <h1 className="font-serif text-3xl font-normal text-tinta">
                    {formData.hero?.promise ||
                      formData.hero?.hero_heading ||
                      formData.header?.heading ||
                      formData.brand?.brand_name ||
                      activeSchema.title}
                  </h1>
                  <p className="text-sm text-tinta-lembut mt-2">
                    {formData.hero?.subheadline ||
                      formData.hero?.hero_sub ||
                      formData.header?.subheading ||
                      formData.brand?.tagline}
                  </p>
                </div>

                {/* Sections Preview Blocks */}
                {activeSchema.sections.map((sec) => {
                  const secData = formData[sec.id] || {};
                  if (sec.allowToggleVisibility && secData.visible === false) {
                    return null; // Hidden section
                  }

                  return (
                    <div key={sec.id} className="p-6 bg-white border border-garis rounded-[2px]">
                      <span className="text-[10px] uppercase font-mono text-tinta-lembut tracking-wider block mb-2">
                        SECTION: {sec.label}
                      </span>
                      <h3 className="font-serif text-xl font-normal text-tinta mb-2">
                        {secData.heading || secData.title || sec.label}
                      </h3>
                      <p className="text-xs text-tinta-lembut leading-relaxed">
                        {secData.description || secData.subheading || secData.sub || ''}
                      </p>

                      {/* Photo slots rendering */}
                      {sec.photoSlots?.map((slot) => {
                        const photos = secData[slot.key] || [];
                        if (photos.length === 0) return null;

                        return (
                          <div key={slot.key} className="mt-4 flex gap-3 overflow-x-auto">
                            {photos.map((p: any, idx: number) => (
                              <div
                                key={idx}
                                className="w-24 h-32 rounded-[2px] overflow-hidden border border-garis shrink-0 bg-[#f7f5f0]"
                              >
                                <img
                                  src={p.url || p.image_url}
                                  alt={p.alt || 'Foto'}
                                  className="w-full h-full object-cover"
                                  style={{ objectPosition: p.focal || 'center' }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM SAVE BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-garis px-6 py-3.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {isDirty ? (
            <span className="flex items-center gap-1.5 text-xs text-merah font-sans font-medium bg-merah/10 px-2.5 py-1 rounded-chip border border-merah/25">
              <span className="w-2 h-2 rounded-full bg-merah animate-pulse" />
              Ada perubahan yang belum disimpan
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-tinta font-sans font-medium bg-kertas-tua px-2.5 py-1 rounded-chip border border-garis">
              <Check className="w-3.5 h-3.5 text-merah" />
              Semua perubahan tersimpan (Versi #{serverVersion})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadPageContent}
            disabled={!isDirty || saving}
            className="px-4 py-2 border border-garis text-xs font-sans font-medium text-tinta-lembut hover:text-tinta rounded-btn disabled:opacity-40 min-h-[44px]"
          >
            Batalkan
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={!isDirty || saving}
            className="px-6 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium flex items-center gap-2 disabled:opacity-40 min-h-[44px] transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* MEDIA PICKER MODAL */}
      {activeSlot && (
        <MediaPickerModal
          isOpen={true}
          onClose={() => setActiveSlot(null)}
          slotSchema={activeSlot.slot}
          currentMediaRef={activeSlot.currentMedia}
          onSelect={(mediaRef) => {
            const currentList = formData[activeSlot.sectionId]?.[activeSlot.slot.key] || [];
            let updatedList: any[];

            if (activeSlot.slot.maxCount === 1) {
              updatedList = [mediaRef];
            } else {
              updatedList = [...currentList, mediaRef].slice(0, activeSlot.slot.maxCount);
            }

            handleFieldChange(activeSlot.sectionId, activeSlot.slot.key, updatedList);
          }}
        />
      )}

      {/* CONFLICT RESOLUTION DIALOG */}
      <ConfirmDialog
        open={hasConflict}
        title="Konflik Penyimpanan Terdeteksi"
        message="Konten halaman ini telah diubah dari perangkat atau sesi lain sejak terakhir kali dimuat. Apakah kamu ingin memuat ulang versi terbaru atau menimpa secara sadar?"
        confirmLabel="Timpa Perubahan Server"
        cancelLabel="Muat Ulang Konten Server"
        destructive={true}
        loading={saving}
        onConfirm={() => {
          setHasConflict(false);
          handleSave(true);
        }}
        onCancel={() => {
          setHasConflict(false);
          loadPageContent();
        }}
      />

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2px] border border-garis w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-garis flex items-center justify-between bg-kertas-tua/50">
              <h3 className="font-serif text-lg font-normal text-tinta">Riwayat 20 Versi Terakhir</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-tinta-lembut hover:text-tinta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-garis/50">
              {loadingRevisions ? (
                <div className="py-8 text-center text-xs font-mono text-tinta-lembut">Memuat riwayat...</div>
              ) : revisions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-tinta-lembut">Belum ada riwayat revisi.</div>
              ) : (
                revisions.map((rev) => (
                  <div key={rev.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium text-xs text-merah">
                        Versi #{rev.version}
                      </span>
                      <span className="text-[10px] font-mono text-tinta-lembut block mt-0.5">
                        {new Date(rev.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev)}
                      className="px-3 py-1.5 border border-garis text-xs font-medium text-merah hover:bg-kertas-tua rounded-[2px]"
                    >
                      Pulihkan Versi Ini
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
