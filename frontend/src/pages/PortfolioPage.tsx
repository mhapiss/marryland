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

                // Dapatkan 3 foto pratinjau dengan ukuran sama persis
                const previewList =
                  col.preview_photos && col.preview_photos.length >= 3
                    ? col.preview_photos.slice(0, 3)
                    : [
                        col.cover_url ||
                          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
                      ];

                // Tag prosesi adat yang relevan
                const getProcessTags = (slug: string) => {
                  if (slug === 'batak') return ['Martumpol', 'Pemberkatan', 'Mangulosi', 'Pesta Unjuk'];
                  if (slug === 'minang') return ['Manjapuik', 'Akad Nikah', 'Baralek Gadang', 'Batandang'];
                  if (slug === 'melayu') return ['Tepak Sirih', 'Malam Berinai', 'Akad Nikah', 'Resepsi'];
                  return ['Lamaran', 'Akad / Ijab', 'Resepsi Adat'];
                };

                return (
                  <article
                    key={col.id || col.slug}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center pt-8 border-t border-garis"
                  >
                    {/* Visual Kolase 3 Foto Potret (Triptych Sejajar - Ukuran Sama Semua) */}
                    <div
                      className={`lg:col-span-7 ${
                        isEven ? 'lg:order-1' : 'lg:order-2'
                      }`}
                    >
                      <Link
                        to={`/portofolio/${col.slug}`}
                        className="group block p-2 sm:p-2.5 bg-white/95 rounded-[2px] border border-garis shadow-sm hover:shadow-elevated hover:border-merah/50 transition-all duration-300"
                        title={`Buka Dokumentasi Pernikahan Adat ${col.name}`}
                      >
                        {/* Grid 3 Foto Potret (Rasio Aspek 3:4 Presisi Identik) */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {previewList.map((photoUrl, photoIdx) => (
                            <div
                              key={photoIdx}
                              className="relative aspect-[3/4] w-full overflow-hidden rounded-[2px] bg-kertas-tua border border-garis/60"
                            >
                              <img
                                src={photoUrl}
                                alt={`Dokumentasi Adat ${col.name} ${photoIdx + 1}`}
                                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                              />

                              {/* Vignette Halus */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />

                              {/* Label Nomor Foto Kecil */}
                              <div className="absolute top-1.5 left-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-mono px-1 py-0.5 bg-black/60 text-white rounded-[1px] backdrop-blur-xs">
                                  0{photoIdx + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Stempel Metadata Editorial Bawah */}
                        <div className="mt-2.5 pt-2 border-t border-garis/60 flex items-center justify-between text-xs text-tinta-lembut font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-kertas-tua text-tinta font-semibold rounded-[2px] border border-garis/70 text-[10px]">
                              № 0{idx + 1}
                            </span>
                            <span className="font-sans font-medium text-tinta text-xs">
                              Koleksi Adat {col.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-merah font-sans text-xs font-medium group-hover:translate-x-0.5 transition-transform">
                            <span>{col.total_photos || 12}+ Foto • Buka Galeri</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
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
                        {getProcessTags(col.slug).map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 bg-kertas border border-garis rounded-chip text-xs text-tinta-lembut font-body"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div>
                        <Link
                          to={`/portofolio/${col.slug}`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn font-sans font-medium text-sm transition-colors duration-150 group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
                        >
                          <span>Buka koleksi {col.name}</span>
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
              className="inline-flex items-center gap-2 px-7 py-3 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn font-sans font-medium text-sm whitespace-nowrap transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
            >
              <span>Diskusikan rencanamu</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
