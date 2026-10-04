// src/components/portfolio/CollectionDetailView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PORTFOLIO_PALETTES,
  PortfolioCollection,
  EventType,
  PortfolioPhotoItem,
  ThemePaletteKey,
} from '../../config/portfolioThemes';
import { Navbar } from '../landing/Navbar';
import { EditableRegion } from '../admin/EditableRegion';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
} from 'lucide-react';

export interface CollectionDetailViewProps {
  collection: PortfolioCollection;
  photos: PortfolioPhotoItem[];
  eventTypes: EventType[];
  whatsappNumber?: string;
  isPreview?: boolean;
  activeEditKey?: string | null;
  hoverEditKey?: string | null;
  onSelectRegion?: (id: string) => void;
  onHoverRegion?: (id: string | null) => void;
}

export function CollectionDetailView({
  collection,
  photos = [],
  eventTypes = [],
  whatsappNumber = '6281234567890',
  isPreview = false,
  activeEditKey = null,
  hoverEditKey = null,
  onSelectRegion,
  onHoverRegion,
}: CollectionDetailViewProps) {
  const [activeEventSlug, setActiveEventSlug] = useState<string>('semua');
  const [displayLimit, setDisplayLimit] = useState(24);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Palette & CSS variables
  const currentPaletteKey: ThemePaletteKey = collection?.theme_palette || 'merah-vintage';
  const palette = PORTFOLIO_PALETTES[currentPaletteKey] || PORTFOLIO_PALETTES['merah-vintage'];

  // Font class
  const fontPairingClass =
    collection?.theme_font === 'editorial'
      ? 'font-serif italic-accent'
      : collection?.theme_font === 'classic'
      ? 'font-serif'
      : 'font-serif';

  // Layout preferences
  const heroSide = collection?.layout?.hero_side || 'left';
  const collageVariant = collection?.layout?.collage_variant || 'A';
  const isStaggered = collection?.layout?.event_cards_staggered ?? true;

  // Photo slots
  const heroPhoto = photos.find((p) => p.slot === 'hero') || photos[0];
  const aboutPhotos = photos.filter((p) => p.slot?.startsWith('about_'));
  const highlightPhotos = photos.filter((p) => p.slot === 'highlight');

  // Gallery items filtering
  const galleryPhotos = useMemo(() => {
    const list = photos.filter((p) => p.slot === 'gallery' || !p.slot);
    // If empty, use all photos except hero
    const candidateList = list.length > 0 ? list : photos.slice(1);

    if (activeEventSlug === 'semua') return candidateList;
    return candidateList.filter((p) => {
      if (p.event_type_slug) {
        return p.event_type_slug.toLowerCase() === activeEventSlug.toLowerCase();
      }
      return false;
    });
  }, [photos, activeEventSlug]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % galleryPhotos.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + galleryPhotos.length) % galleryPhotos.length : 0
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryPhotos.length]);

  const cleanWaNumber = (whatsappNumber || '6281234567890').replace(/\D/g, '');
  const waTemplate =
    collection?.content?.wa_message_template ||
    `Halo by.marryland, saya tertarik dengan dokumentasi adat ${collection?.name || ''}. Boleh info jadwal dan paket yang tersedia?`;
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waTemplate)}`;

  // CSS variables object for dynamic palette injection
  const containerStyle = {
    '--collection-paper': palette.paper,
    '--collection-muted-paper': palette.mutedPaper,
    '--collection-ink': palette.ink,
    '--collection-ink-muted': palette.inkMuted,
    '--collection-dark': palette.dark,
    '--collection-dark-text': palette.darkText,
    '--collection-accent': palette.accent,
    '--collection-border': palette.border,
    backgroundColor: palette.paper,
    color: palette.ink,
  } as React.CSSProperties;

  const handleLinkClick = (e: React.MouseEvent, targetHash?: string) => {
    if (isPreview) {
      if (targetHash) {
        e.preventDefault();
        const el = document.getElementById(targetHash.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      style={containerStyle}
      className={`min-h-screen selection:bg-[var(--collection-dark)] selection:text-[var(--collection-dark-text)] overflow-x-hidden font-sans ${fontPairingClass}`}
    >
      {/* Top Navbar */}
      <Navbar />

      {/* 1. HERO SECTION (Split Layout) */}
      <EditableRegion
        id="hero_section"
        label="Bagian Hero (Judul & Foto Sampul)"
        isPreview={isPreview}
        isActive={activeEditKey === 'hero_section' || activeEditKey === 'hero_text' || activeEditKey === 'hero_photo'}
        isHovered={hoverEditKey === 'hero_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 border-b border-[var(--collection-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--collection-ink-muted)]">
              {isPreview ? (
                <span className="cursor-default">Portofolio</span>
              ) : (
                <Link to="/portofolio" className="hover:text-[var(--collection-ink)] transition-colors">
                  Portofolio
                </Link>
              )}
              <span>/</span>
              <span className="font-semibold text-[var(--collection-ink)]">{collection.name}</span>
            </nav>

            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${
                heroSide === 'right' ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Hero Text Column */}
              <div
                className={`lg:col-span-7 flex flex-col justify-center ${
                  heroSide === 'right' ? 'lg:order-1' : 'lg:order-1'
                }`}
              >
                <span className="inline-block text-xs uppercase tracking-[0.25em] font-semibold text-[var(--collection-accent)] mb-4">
                  {collection.content?.hero_eyebrow || 'KOLEKSI DOKUMENTASI'}
                </span>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[var(--collection-ink)] font-normal leading-[1.12] tracking-tight mb-6">
                  {collection.content?.hero_heading || `Dokumentasi Adat ${collection.name}`}
                </h1>

                <p className="text-base sm:text-lg text-[var(--collection-ink-muted)] leading-relaxed max-w-2xl mb-10">
                  {collection.content?.hero_subheading || collection.short_description}
                </p>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <a
                    href="#galeri"
                    onClick={(e) => handleLinkClick(e, 'galeri')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--collection-dark)] text-[var(--collection-dark-text)] rounded-[2px] font-medium text-sm hover:opacity-90 transition-all min-h-[44px]"
                  >
                    <span>Lihat Galeri Foto</span>
                    <ArrowDown className="w-4 h-4" />
                  </a>

                  <a
                    href={isPreview ? '#' : waUrl}
                    target={isPreview ? undefined : '_blank'}
                    rel={isPreview ? undefined : 'noopener noreferrer'}
                    onClick={(e) => {
                      if (isPreview) {
                        e.preventDefault();
                        onSelectRegion?.('cta_section');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 border border-[var(--collection-border)] text-[var(--collection-ink)] bg-white/60 hover:bg-white rounded-[2px] font-medium text-sm transition-all min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4 text-[var(--collection-accent)]" />
                    <span>Konsultasi Liputan</span>
                  </a>
                </div>
              </div>

              {/* Hero Image Column */}
              <div
                className={`lg:col-span-5 ${
                  heroSide === 'right' ? 'lg:order-2' : 'lg:order-2'
                }`}
              >
                <div className="relative group">
                  <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-[var(--collection-muted-paper)] relative">
                    {heroPhoto ? (
                      <img
                        src={heroPhoto.image_url}
                        alt={heroPhoto.alt || heroPhoto.caption || collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ objectPosition: heroPhoto.focal || 'center' }}
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-garis">
                        <span className="font-serif text-lg text-[var(--collection-ink)] mb-1">
                          Foto Sampul Hero
                        </span>
                        <span className="text-xs text-[var(--collection-ink-muted)] font-mono">
                          Format potret rasio 3:4 disarankan
                        </span>
                      </div>
                    )}

                    {/* Editorial Brand Stamp */}
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white/90 text-[10px] uppercase tracking-widest font-mono rounded-[2px]">
                      by.marryland
                    </div>
                  </div>

                  {heroPhoto?.caption && (
                    <p className="mt-3 text-xs text-[var(--collection-ink-muted)] italic font-serif">
                      {heroPhoto.caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </EditableRegion>

      {/* 2. TENTANG KOLEKSI / KURATORIAL (Paper Muted + Asymmetric Collage) */}
      <EditableRegion
        id="about_section"
        label="Bagian Pembuka (Tentang & Kolase)"
        isPreview={isPreview}
        isActive={activeEditKey === 'about_section' || activeEditKey === 'about_text' || activeEditKey === 'about_photos'}
        isHovered={hoverEditKey === 'about_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section className="py-20 md:py-28 bg-[var(--collection-muted-paper)] border-b border-[var(--collection-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Collage Section */}
              <div className="lg:col-span-6">
                {collageVariant === 'A' ? (
                  // Variant A: 1 large vertical + 2 smaller offset
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7">
                      <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-white">
                        {aboutPhotos[0]?.image_url || heroPhoto?.image_url ? (
                          <img
                            src={aboutPhotos[0]?.image_url || heroPhoto?.image_url}
                            alt="Tentang koleksi 1"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[var(--collection-ink-muted)]">
                            Foto Kolase 1
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-5 space-y-4">
                      <div className="aspect-[4/5] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-white translate-y-3">
                        {aboutPhotos[1]?.image_url || photos[1]?.image_url || heroPhoto?.image_url ? (
                          <img
                            src={aboutPhotos[1]?.image_url || photos[1]?.image_url || heroPhoto?.image_url}
                            alt="Tentang koleksi 2"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[var(--collection-ink-muted)]">
                            Foto Kolase 2
                          </div>
                        )}
                      </div>
                      <div className="aspect-[1/1] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-white -translate-y-2">
                        {aboutPhotos[2]?.image_url || photos[2]?.image_url || heroPhoto?.image_url ? (
                          <img
                            src={aboutPhotos[2]?.image_url || photos[2]?.image_url || heroPhoto?.image_url}
                            alt="Tentang koleksi 3"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[var(--collection-ink-muted)]">
                            Foto Kolase 3
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Variant B: 2 staggered equal columns
                  <div className="grid grid-cols-2 gap-5 items-start">
                    <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-white">
                      {aboutPhotos[0]?.image_url || heroPhoto?.image_url ? (
                        <img
                          src={aboutPhotos[0]?.image_url || heroPhoto?.image_url}
                          alt="Tentang koleksi B1"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[var(--collection-ink-muted)]">
                          Foto Kolase B1
                        </div>
                      )}
                    </div>
                    <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-white translate-y-10">
                      {aboutPhotos[1]?.image_url || photos[1]?.image_url || heroPhoto?.image_url ? (
                        <img
                          src={aboutPhotos[1]?.image_url || photos[1]?.image_url || heroPhoto?.image_url}
                          alt="Tentang koleksi B2"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-xs font-mono text-[var(--collection-ink-muted)]">
                          Foto Kolase B2
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Curatorial Text */}
              <div className="lg:col-span-6 lg:pl-6">
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--collection-accent)] block mb-3">
                  {collection.content?.about_eyebrow || 'TENTANG KOLEKSI'}
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[var(--collection-ink)] font-normal leading-tight mb-6">
                  {collection.content?.about_heading || 'Kehangatan Tradisi dalam Bingkai Editorial'}
                </h2>
                <div className="space-y-4 text-base text-[var(--collection-ink-muted)] leading-relaxed">
                  <p>
                    {collection.content?.about_description ||
                      'Setiap tahapan adat membawa makna yang mendalam bagi kedua keluarga. Pendekatan kami menitikberatkan pada keaslian ekspresi, kemewahan detail ornamen, dan ketenangan komposisi.'}
                  </p>
                  <p>
                    Tanpa mengarahkan secara kaku, kami membiarkan setiap momen sakral mengalir apa adanya agar memori yang tertangkap tetap terasa hangat puluhan tahun mendatang.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--collection-border)] flex items-center gap-6">
                  <div>
                    <span className="block font-serif text-2xl font-bold text-[var(--collection-ink)]">
                      {photos.length}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[var(--collection-ink-muted)]">
                      Karya Terkurasi
                    </span>
                  </div>
                  <div className="w-px h-8 bg-[var(--collection-border)]" />
                  <div>
                    <span className="block font-serif text-2xl font-bold text-[var(--collection-ink)]">
                      {eventTypes.length}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[var(--collection-ink-muted)]">
                      Rangkaian Acara
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </EditableRegion>

      {/* 3. KARTU JENIS ACARA (Lamaran, Akad, Resepsi, dll) */}
      <EditableRegion
        id="events_section"
        label="Rangkaian Prosesi Acara"
        isPreview={isPreview}
        isActive={activeEditKey === 'events_section'}
        isHovered={hoverEditKey === 'events_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section className="py-20 md:py-24 border-b border-[var(--collection-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--collection-accent)] block mb-3">
                RANGKAIAN PROSESI
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[var(--collection-ink)] font-normal mb-4">
                Jelajahi Berdasarkan Jenis Acara
              </h2>
              <p className="text-sm sm:text-base text-[var(--collection-ink-muted)]">
                Pilih prosesi di bawah ini untuk melihat dokumentasi spesifik pada galeri kami.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventTypes.slice(0, 4).map((evt, idx) => {
                const samplePhoto =
                  photos.find((p) => p.event_type_slug === evt.slug) || photos[idx % (photos.length || 1)];
                const isSelected = activeEventSlug === evt.slug;
                const staggerClass = isStaggered && idx % 2 === 1 ? 'sm:translate-y-6' : '';

                return (
                  <div
                    key={evt.id || idx}
                    onClick={() => {
                      setActiveEventSlug(evt.slug);
                      const el = document.getElementById('galeri');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`group cursor-pointer rounded-[2px] border overflow-hidden bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated ${
                      isSelected
                        ? 'border-[var(--collection-accent)] ring-1 ring-[var(--collection-accent)]'
                        : 'border-[var(--collection-border)]'
                    } ${staggerClass}`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--collection-muted-paper)] relative">
                      {samplePhoto ? (
                        <img
                          src={samplePhoto.image_url}
                          alt={evt.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          {evt.name}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <span className="absolute bottom-3 left-4 text-xs uppercase tracking-widest text-white/90 font-medium">
                        Acara {idx + 1}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-serif text-xl font-bold text-[var(--collection-ink)] group-hover:text-[var(--collection-accent)] transition-colors">
                          {evt.name}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-[var(--collection-ink-muted)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-[var(--collection-ink-muted)] line-clamp-2 leading-relaxed">
                        {evt.description || `Dokumentasi prosesi ${evt.name} penuh kekhidmatan.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </EditableRegion>

      {/* 4. DARK SECTION (Momen Sorotan) */}
      <EditableRegion
        id="highlight_section"
        label="Momen Sorotan"
        isPreview={isPreview}
        isActive={activeEditKey === 'highlight_section' || activeEditKey === 'highlight_text'}
        isHovered={hoverEditKey === 'highlight_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section className="py-20 md:py-28 bg-[var(--collection-dark)] text-[var(--collection-dark-text)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.25em] text-[var(--collection-accent)] font-semibold block mb-3">
                {collection.content?.highlight_eyebrow || 'MOMEN SOROTAN'}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[var(--collection-dark-text)] font-normal mb-4">
                {collection.content?.highlight_heading || 'Detail dan Emosi yang Terpatri'}
              </h2>
              <div className="w-12 h-px bg-[var(--collection-accent)] mx-auto opacity-70" />
            </div>

            {/* Staggered Showcase Row: Center photo largest */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Left Photo */}
              <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-white/10 shadow-elevated bg-white/5">
                {highlightPhotos[0]?.image_url || photos[0]?.image_url ? (
                  <img
                    src={highlightPhotos[0]?.image_url || photos[0]?.image_url}
                    alt="Sorotan 1"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-white/50 p-4 text-center">
                    Foto Sorotan 1
                  </div>
                )}
              </div>

              {/* Center Photo (Largest) */}
              <div className="aspect-[3/4] md:scale-105 rounded-[2px] overflow-hidden border border-white/20 shadow-elevated z-10 bg-white/5">
                {highlightPhotos[1]?.image_url || photos[1]?.image_url || photos[0]?.image_url ? (
                  <img
                    src={highlightPhotos[1]?.image_url || photos[1]?.image_url || photos[0]?.image_url}
                    alt="Sorotan 2 (Pusat)"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-white/50 p-4 text-center">
                    Foto Sorotan 2 (Pusat)
                  </div>
                )}
              </div>

              {/* Right Photo */}
              <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-white/10 shadow-elevated bg-white/5">
                {highlightPhotos[2]?.image_url || photos[2]?.image_url || photos[0]?.image_url ? (
                  <img
                    src={highlightPhotos[2]?.image_url || photos[2]?.image_url || photos[0]?.image_url}
                    alt="Sorotan 3"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-white/50 p-4 text-center">
                    Foto Sorotan 3
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </EditableRegion>

      {/* 5. TESTIMONIAL / KUTIPAN PENGANTIN */}
      {collection.content?.testimonials && collection.content.testimonials.length > 0 && (
        <EditableRegion
          id="testimonials_section"
          label="Kutipan Pengantin"
          isPreview={isPreview}
          isActive={activeEditKey === 'testimonials_section'}
          isHovered={hoverEditKey === 'testimonials_section'}
          onSelect={onSelectRegion}
          onHover={onHoverRegion}
        >
          <section className="py-20 md:py-24 bg-white border-b border-[var(--collection-border)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {collection.content.testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center"
                >
                  {t.image_url && (
                    <div className="md:col-span-4">
                      <div className="aspect-[3/4] rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft">
                        <img
                          src={t.image_url}
                          alt={t.couple_names}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                  <div className={t.image_url ? 'md:col-span-8' : 'md:col-span-12'}>
                    <span className="font-serif text-5xl text-[var(--collection-accent)] leading-none select-none">
                      &ldquo;
                    </span>
                    <blockquote className="font-serif text-2xl sm:text-3xl text-[var(--collection-ink)] font-normal leading-snug mb-6">
                      {t.quote}
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-px bg-[var(--collection-border)]" />
                      <span className="text-sm font-semibold uppercase tracking-wider text-[var(--collection-ink)]">
                        {t.couple_names}
                      </span>
                      {t.event_date && (
                        <span className="text-xs text-[var(--collection-ink-muted)]">
                          — {t.event_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </EditableRegion>
      )}

      {/* 6. GALERI PENUH (Full Gallery with Event Filter & Lightbox) */}
      <EditableRegion
        id="gallery_section"
        label="Galeri Arsip Lengkap"
        isPreview={isPreview}
        isActive={activeEditKey === 'gallery_section'}
        isHovered={hoverEditKey === 'gallery_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section id="galeri" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header & Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-[var(--collection-border)]">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--collection-accent)] block mb-2">
                  GALERI ARSIP
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[var(--collection-ink)] font-normal">
                  Dokumentasi Lengkap
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveEventSlug('semua');
                    setDisplayLimit(24);
                  }}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-[2px] whitespace-nowrap transition-colors min-h-[44px] ${
                    activeEventSlug === 'semua'
                      ? 'bg-[var(--collection-dark)] text-[var(--collection-dark-text)]'
                      : 'bg-white border border-[var(--collection-border)] text-[var(--collection-ink-muted)] hover:text-[var(--collection-ink)]'
                  }`}
                >
                  Semua ({photos.length})
                </button>

                {eventTypes.map((evt) => {
                  const count = photos.filter((p) => p.event_type_slug === evt.slug).length;
                  if (count === 0 && activeEventSlug !== evt.slug) return null;

                  const isSelected = activeEventSlug === evt.slug;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setActiveEventSlug(evt.slug);
                        setDisplayLimit(24);
                      }}
                      className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-[2px] whitespace-nowrap transition-colors min-h-[44px] ${
                        isSelected
                          ? 'bg-[var(--collection-dark)] text-[var(--collection-dark-text)]'
                          : 'bg-white border border-[var(--collection-border)] text-[var(--collection-ink-muted)] hover:text-[var(--collection-ink)]'
                      }`}
                    >
                      {evt.name} {count > 0 ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Responsive Grid */}
            {galleryPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[var(--collection-border)] rounded-[2px]">
                <p className="text-sm text-[var(--collection-ink-muted)] mb-3">
                  Belum ada foto yang diunggah untuk kategori acara ini.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveEventSlug('semua')}
                  className="text-xs uppercase tracking-wider font-semibold text-[var(--collection-dark)] underline min-h-[44px]"
                >
                  Tampilkan Semua Foto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryPhotos.slice(0, displayLimit).map((item, idx) => {
                  const aspect =
                    item.width && item.height
                      ? item.width / item.height > 1.2
                        ? 'aspect-[4/3]'
                        : 'aspect-[3/4]'
                      : idx % 3 === 0
                      ? 'aspect-[3/4]'
                      : 'aspect-[4/3]';

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={`group cursor-pointer rounded-[2px] overflow-hidden border border-[var(--collection-border)] shadow-soft bg-[var(--collection-muted-paper)] relative ${aspect}`}
                    >
                      <img
                        src={item.image_url}
                        alt={item.alt || item.caption || `Koleksi ${collection.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <p className="text-xs text-white/95 line-clamp-2 font-serif">
                          {item.caption || collection.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {galleryPhotos.length > displayLimit && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 24)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[var(--collection-border)] text-[var(--collection-ink)] hover:bg-[var(--collection-muted-paper)] rounded-[2px] font-medium text-sm transition-all min-h-[44px]"
                >
                  <span>Muat Lebih Banyak ({galleryPhotos.length - displayLimit} tersisa)</span>
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </EditableRegion>

      {/* 7. GIANT CTA (WhatsApp Booking) */}
      <EditableRegion
        id="cta_section"
        label="Konsultasi WhatsApp"
        isPreview={isPreview}
        isActive={activeEditKey === 'cta_section'}
        isHovered={hoverEditKey === 'cta_section'}
        onSelect={onSelectRegion}
        onHover={onHoverRegion}
      >
        <section className="py-20 md:py-28 bg-[var(--collection-muted-paper)] border-t border-[var(--collection-border)] text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--collection-accent)] block mb-3">
              KONSULTASI & JADWAL
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[var(--collection-ink)] font-normal mb-6">
              {collection.content?.cta_heading || 'Rencanakan Dokumentasi Hari Bahagiamu'}
            </h2>
            <p className="text-base sm:text-lg text-[var(--collection-ink-muted)] mb-10 max-w-xl mx-auto">
              {collection.content?.cta_subheading ||
                'Hubungi kami untuk memastikan ketersediaan tanggal dan berdiskusi seputar rangkaian prosesi impianmu.'}
            </p>

            <a
              href={isPreview ? '#' : waUrl}
              target={isPreview ? undefined : '_blank'}
              rel={isPreview ? undefined : 'noopener noreferrer'}
              onClick={(e) => {
                if (isPreview) {
                  e.preventDefault();
                  onSelectRegion?.('cta_section');
                }
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--collection-dark)] text-[var(--collection-dark-text)] rounded-[2px] font-medium text-base hover:opacity-90 shadow-elevated transition-all min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5 text-[var(--collection-accent)]" />
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>
        </section>
      </EditableRegion>

      {/* 8. DARK FOOTER */}
      <footer className="bg-[var(--collection-dark)] text-[var(--collection-dark-text)] pt-16 pb-8 border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
            <div className="md:col-span-5">
              <span className="font-serif text-2xl font-bold tracking-tight block mb-3">
                by.<span className="text-[var(--collection-accent)]">marryland</span>
              </span>
              <p className="text-sm text-white/70 leading-relaxed max-w-sm">
                Studio kurasi dokumentasi pernikahan dan perhelatan keluarga dengan pendekatan editorial dan penghormatan tulus pada tradisi.
              </p>
            </div>

            <div className="md:col-span-3">
              <span className="text-xs uppercase tracking-widest text-[var(--collection-accent)] font-semibold block mb-4">
                Jelajahi
              </span>
              <ul className="space-y-2.5 text-sm text-white/80">
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Beranda</span>
                  ) : (
                    <Link to="/" className="hover:text-white transition-colors">
                      Beranda
                    </Link>
                  )}
                </li>
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Semua Koleksi Adat</span>
                  ) : (
                    <Link to="/portofolio" className="hover:text-white transition-colors">
                      Semua Koleksi Adat
                    </Link>
                  )}
                </li>
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Untuk Klien</span>
                  ) : (
                    <Link to="/untuk-klien" className="hover:text-white transition-colors">
                      Untuk Klien
                    </Link>
                  )}
                </li>
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Tanya Jawab</span>
                  ) : (
                    <Link to="/faq" className="hover:text-white transition-colors">
                      Tanya Jawab
                    </Link>
                  )}
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <span className="text-xs uppercase tracking-widest text-[var(--collection-accent)] font-semibold block mb-4">
                Bantuan & Legal
              </span>
              <ul className="space-y-2.5 text-sm text-white/80">
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Hubungi Studio</span>
                  ) : (
                    <Link to="/kontak" className="hover:text-white transition-colors">
                      Hubungi Studio
                    </Link>
                  )}
                </li>
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Syarat & Ketentuan</span>
                  ) : (
                    <Link to="/syarat-ketentuan" className="hover:text-white transition-colors">
                      Syarat & Ketentuan
                    </Link>
                  )}
                </li>
                <li>
                  {isPreview ? (
                    <span className="opacity-75">Kebijakan Privasi</span>
                  ) : (
                    <Link to="/kebijakan-privasi" className="hover:text-white transition-colors">
                      Kebijakan Privasi
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
            <p>&copy; {new Date().getFullYear()} by.marryland. Seluruh hak cipta dilindungi.</p>
            <p>Dokumentasi Adat {collection.name}</p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="select-none pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 text-[14vw] font-serif font-black text-white/[0.03] tracking-tighter whitespace-nowrap leading-none z-0"
        >
          by.marryland
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-xs font-mono text-white/70">
              {lightboxIndex + 1} / {galleryPhotos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup pratinjau foto"
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null ? (prev - 1 + galleryPhotos.length) % galleryPhotos.length : 0
              )
            }
            aria-label="Foto sebelumnya"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={galleryPhotos[lightboxIndex].image_url}
              alt={galleryPhotos[lightboxIndex].alt || galleryPhotos[lightboxIndex].caption || 'Foto portofolio'}
              className="max-w-full max-h-[75vh] object-contain rounded-[2px]"
            />
            {galleryPhotos[lightboxIndex].caption && (
              <p className="mt-4 text-sm text-white/90 text-center font-serif italic max-w-xl">
                {galleryPhotos[lightboxIndex].caption}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null ? (prev + 1) % galleryPhotos.length : 0
              )
            }
            aria-label="Foto berikutnya"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

export default CollectionDetailView;
