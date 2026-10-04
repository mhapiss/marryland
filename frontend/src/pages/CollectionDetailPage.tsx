// src/pages/CollectionDetailPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useCollectionDetail } from '../hooks/usePortfolioData';
import { useSiteSettings } from '../hooks/useContent';
import { CollectionDetailView } from '../components/portfolio/CollectionDetailView';
import { ArrowUpRight } from 'lucide-react';

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { collection, photos, eventTypes, loading, notFound } = useCollectionDetail(slug);
  const { settings } = useSiteSettings();

  // SEO Page Meta
  usePageMeta({
    title: collection
      ? `Dokumentasi Adat ${collection.name} | by.marryland`
      : 'Koleksi Portofolio | by.marryland',
    description:
      collection?.short_description ||
      'Dokumentasi visual penuh rasa dan kehangatan tradisi dalam sentuhan editorial berstandar tinggi.',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kertas">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-merah border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-sans text-tinta-lembut">Memuat koleksi...</p>
        </div>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kertas px-6 text-center">
        <span className="label-caps text-merah mb-3">
          404 - Tidak Ditemukan
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-tinta font-normal mb-4">
          Koleksi Tidak Ditemukan
        </h1>
        <p className="text-tinta-lembut max-w-md mb-8 font-body text-sm">
          Koleksi adat yang kamu cari mungkin telah dipindahkan atau belum dipublikasikan.
        </p>
        <Link
          to="/portofolio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-merah text-kertas rounded-[2px] font-medium text-sm hover:bg-merah-hover transition-colors min-h-[44px]"
        >
          <span>Kembali ke Semua Koleksi</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <CollectionDetailView
      collection={collection}
      photos={photos}
      eventTypes={eventTypes}
      whatsappNumber={settings.whatsapp_number}
      isPreview={false}
    />
  );
}
