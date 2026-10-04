// src/pages/PortfolioPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { usePortfolioCollections } from '../hooks/usePortfolioData';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { PORTFOLIO_PALETTES } from '../config/portfolioThemes';
import { PageHero } from '../components/common/PageHero';

export default function PortfolioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { collections, loading } = usePortfolioCollections();

  // Redirect legacy /portofolio?kategori=slug
  useEffect(() => {
    const legacyCategory = searchParams.get('kategori');
    if (legacyCategory) {
      const match = collections.find(
        (c) => c.slug.toLowerCase() === legacyCategory.toLowerCase()
      );
      if (match) {
        navigate(`/portofolio/${match.slug}`, { replace: true });
      } else if (legacyCategory.toLowerCase() === 'wedding' && collections.length > 0) {
        // Redirect legacy 'wedding' to first available collection
        navigate(`/portofolio/${collections[0].slug}`, { replace: true });
      }
    }
  }, [searchParams, collections, navigate]);

  usePageMeta({
    title: 'Koleksi Portofolio Dokumentasi | by.marryland',
    description:
      'Arsip dokumentasi pernikahan adat dan perhelatan budaya dengan kurasi visual berstandar editorial tinggi.',
  });

  return (
    <div className="min-h-screen bg-kertas text-tinta flex flex-col font-sans overflow-x-hidden selection:bg-merah selection:text-kertas">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Editorial Header */}
          <PageHero
            number="№ 05"
            category="ARSIP DOKUMENTASI ADAT & BUDAYA"
            title="Koleksi Dokumentasi Per Adat"
            description="Setiap budaya membawa ritme, busana, dan kehangatan yang unik. Kami menyusun dokumentasi ini per koleksi adat agar kamu dapat merasakan nuansa sakral dan kebahagiaan setiap prosesi secara utuh."
            className="mb-16 md:mb-24"
          />

          {/* Alternating Editorial Showcase of Collections */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-2 border-merah border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-tinta-lembut font-body">Memuat koleksi portofolio...</p>
            </div>
          ) : (
            <div className="space-y-24 md:space-y-36">
              {collections.map((col, idx) => {
                const isEven = idx % 2 === 0;
                const palette = PORTFOLIO_PALETTES[col.theme_palette] || PORTFOLIO_PALETTES['merah-vintage'];

                return (
                  <article
                    key={col.id || col.slug}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center pt-8 border-t border-garis"
                  >
                    {/* Visual Photo (Alternates order) with frame-cetakan */}
                    <div
                      className={`lg:col-span-7 ${
                        isEven ? 'lg:order-1' : 'lg:order-2'
                      }`}
                    >
                      <Link
                        to={`/portofolio/${col.slug}`}
                        className="group block relative overflow-hidden rounded-[2px] frame-cetakan bg-kertas-tua/50"
                      >
                        <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
                          <img
                            src={
                              col.cover_url ||
                              'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
                            }
                            alt={`Koleksi ${col.name}`}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        {/* Subtle Editorial Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />

                        {/* Stamp */}
                        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white">
                          <span className="text-[10px] font-mono uppercase tracking-widest bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-[2px] block w-fit mb-1.5">
                            Koleksi 0{idx + 1}
                          </span>
                          <span className="font-serif text-xl sm:text-2xl font-normal">
                            Adat {col.name}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Text Editorial Info */}
                    <div
                      className={`lg:col-span-5 flex flex-col justify-center ${
                        isEven ? 'lg:order-2' : 'lg:order-1'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: palette.dark }}
                        />
                        <span className="label-caps text-merah">
                          {col.name}
                        </span>
                      </div>

                      <h2 className="font-serif text-3xl sm:text-4xl text-tinta font-normal leading-tight mb-4">
                        <Link
                          to={`/portofolio/${col.slug}`}
                          className="hover:text-merah transition-colors"
                        >
                          Dokumentasi Pernikahan Adat {col.name}
                        </Link>
                      </h2>

                      <p className="font-body text-sm sm:text-base text-tinta-lembut leading-relaxed mb-6">
                        {col.short_description ||
                          `Rangkaian dokumentasi pernikahan dan perhelatan bernuansa ${col.name} yang terekam secara elegan.`}
                      </p>

                      {/* Process Tags */}
                      <div className="flex flex-wrap gap-2 mb-8">
                        {['Lamaran', 'Akad / Ijab', 'Resepsi'].map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 bg-kertas border border-garis rounded-[2px] text-xs text-tinta-lembut font-body"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div>
                        <Link
                          to={`/portofolio/${col.slug}`}
                          className="inline-flex items-center gap-2 px-6 py-3.5 bg-merah text-kertas rounded-[2px] font-medium text-sm hover:bg-merah-hover transition-all group min-h-[44px]"
                        >
                          <span>Buka Koleksi {col.name}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Quick Consultation Banner */}
          <div className="mt-28 md:mt-36 p-8 md:p-14 bg-kertas-tua/40 border border-garis rounded-[2px] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="label-caps text-merah block mb-2">
                ADAT ATAU BUDAYA LAIN?
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-tinta mb-3">
                Punya Konsep Tradisi yang Berbeda?
              </h3>
              <p className="font-body text-sm text-tinta-lembut leading-relaxed">
                Kami siap mendokumentasikan adat daerah lainnya dengan riset dan penghormatan penuh pada setiap detail ritual keluarga.
              </p>
            </div>

            <Link
              to="/kontak"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-merah text-kertas hover:bg-merah-hover rounded-[2px] font-medium text-sm whitespace-nowrap transition-all min-h-[44px]"
            >
              <span>Diskusikan Rencanamu</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
