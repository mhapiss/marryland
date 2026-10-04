// src/pages/CollectionPreviewPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { CollectionDetailView } from '../components/portfolio/CollectionDetailView';
import {
  DEFAULT_COLLECTIONS,
  DEFAULT_EVENT_TYPES,
  PortfolioCollection,
  PortfolioPhotoItem,
  EventType,
} from '../config/portfolioThemes';

export default function CollectionPreviewPage() {
  // Disallow search engine indexing on preview route
  usePageMeta({
    title: 'Pratinjau Koleksi Adat | Admin by.marryland',
    description: 'Pratinjau langsung draf kurasi koleksi portofolio.',
  });

  const [collection, setCollection] = useState<PortfolioCollection>(DEFAULT_COLLECTIONS[0]);
  const [photos, setPhotos] = useState<PortfolioPhotoItem[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [activeEditKey, setActiveEditKey] = useState<string | null>(null);
  const [hoverEditKey, setHoverEditKey] = useState<string | null>(null);

  // Scroll to region helper
  const scrollToRegion = useCallback((editKey: string) => {
    setActiveEditKey(editKey);
    const targetId = `editable-${editKey}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary highlight pulse
      el.classList.add('animate-pulse');
      setTimeout(() => {
        el.classList.remove('animate-pulse');
      }, 1500);
    }
  }, []);

  // PostMessage listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: only accept same-origin messages
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'MARRYLAND_DRAFT_UPDATE':
          if (data.collection) {
            setCollection(data.collection);
          }
          if (Array.isArray(data.photos)) {
            setPhotos(data.photos);
          }
          if (Array.isArray(data.eventTypes)) {
            setEventTypes(data.eventTypes);
          }
          break;

        case 'MARRYLAND_HIGHLIGHT_REGION':
          setActiveEditKey(data.editKey || null);
          break;

        case 'MARRYLAND_SCROLL_TO_REGION':
          if (data.editKey) {
            scrollToRegion(data.editKey);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent window that preview frame is ready
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: 'MARRYLAND_PREVIEW_READY' },
        window.location.origin
      );
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [scrollToRegion]);

  const handleSelectRegion = (id: string) => {
    setActiveEditKey(id);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'MARRYLAND_REGION_SELECT',
          editKey: id,
        },
        window.location.origin
      );
    }
  };

  const handleHoverRegion = (id: string | null) => {
    setHoverEditKey(id);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'MARRYLAND_REGION_HOVER',
          editKey: id,
        },
        window.location.origin
      );
    }
  };

  return (
    <div className="relative">
      {/* Top Banner indicating Preview Mode */}
      <div className="bg-merah text-white text-[11px] font-mono uppercase tracking-wider py-1 px-4 text-center sticky top-0 z-50 shadow-xs flex items-center justify-between">
        <span className="opacity-90">Mode Pratinjau Interaktif</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-[2px]">Klik bagian untuk mengubah formulir</span>
      </div>

      <CollectionDetailView
        collection={collection}
        photos={photos}
        eventTypes={eventTypes}
        isPreview={true}
        activeEditKey={activeEditKey}
        hoverEditKey={hoverEditKey}
        onSelectRegion={handleSelectRegion}
        onHoverRegion={handleHoverRegion}
      />
    </div>
  );
}
