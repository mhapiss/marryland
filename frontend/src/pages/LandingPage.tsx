import React from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { usePageMeta } from '../hooks/usePageMeta';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { InfiniteMarquee } from '../components/landing/InfiniteMarquee';
import { FactStrip } from '../components/landing/FactStrip';
import { PortfolioSection } from '../components/landing/PortfolioSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { FeaturedSection } from '../components/landing/FeaturedSection';
import { LiveDemoSection } from '../components/landing/LiveDemoSection';
import { StepsSection } from '../components/landing/StepsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaSection } from '../components/landing/CtaSection';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  const { data, loading } = useHomeData();

  const content = data?.content || {};
  const photosArray = data?.photosArray || [];

  // Extract photos for specific slots
  const marqueePhotos = photosArray.filter((p) => p.slot === 'marquee');
  const featuredPhotos = photosArray.filter((p) => p.slot === 'featured');
  const demoPhoto = photosArray.find(
    (p) => p.slot === 'demo_mockup' || p.slot === 'steps_mockup'
  );

  // Extract section data
  const metaData = content['meta']?.content || {};
  const heroData = content['hero']?.content || {};
  const marqueeData = content['marquee']?.content || {};
  const factsData = content['facts']?.content || {};
  const portfolioData = content['portfolio']?.content || {};
  const problemData = content['problem']?.content || {};
  const benefitsData = content['benefits']?.content || {};
  const featuredData = content['featured']?.content || {};
  const demoData = content['demo']?.content || {};
  const stepsData = content['steps']?.content || {};
  const pricingData = content['pricing']?.content || {};
  const faqData = content['faq']?.content || {};
  const ctaData = content['cta']?.content || {};
  const contactData = content['contact']?.content || {};
  const footerData = content['footer']?.content || {};

  // SEO Page Meta
  usePageMeta({
    title: metaData.title || 'by.marryland | Galeri Seleksi Foto Klien untuk Fotografer',
    description:
      metaData.description ||
      'Platform kurasi dan seleksi foto klien yang cepat, elegan, dan terintegrasi langsung dengan Google Drive untuk fotografer pernikahan dan wisuda.',
  });

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans overflow-x-hidden selection:bg-merah/20 selection:text-merah">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        {content['hero']?.visible !== false && (
          <Hero data={heroData} demoSlug={demoData.demo_slug} />
        )}

        {/* 3. Kolase Foto Infinite (Marquee) */}
        {content['marquee']?.visible !== false && (
          <InfiniteMarquee photos={marqueePhotos} data={marqueeData} />
        )}

        {/* 4. Strip Fakta Desain */}
        {content['facts']?.visible !== false && (
          <FactStrip data={factsData} />
        )}

        {/* 5. Portofolio Bertingkat */}
        {content['portfolio']?.visible !== false && (
          <PortfolioSection data={portfolioData} />
        )}

        {/* 6. Masalah WhatsApp */}
        {content['problem']?.visible !== false && (
          <ProblemSection data={problemData} />
        )}

        {/* 7. Manfaat Fitur Nyata */}
        {content['benefits']?.visible !== false && (
          <BenefitsSection data={benefitsData} />
        )}

        {/* 8. Section Gelap Hijau Tua (Sorotan) */}
        {content['featured']?.visible !== false && (
          <FeaturedSection photos={featuredPhotos} data={featuredData} />
        )}

        {/* 9. Contoh Langsung (Demo Browser) */}
        {content['demo']?.visible !== false && (
          <LiveDemoSection photo={demoPhoto} data={demoData} />
        )}

        {/* 10. Cara Kerja 3 Langkah */}
        {content['steps']?.visible !== false && (
          <StepsSection data={stepsData} />
        )}

        {/* 11. Harga (Default Tersembunyi) */}
        {content['pricing']?.visible !== false && (
          <PricingSection data={pricingData} />
        )}

        {/* 12. FAQ Ringkas */}
        {content['faq']?.visible !== false && (
          <FaqSection data={faqData} />
        )}

        {/* 13. CTA Akhir */}
        {content['cta']?.visible !== false && (
          <CtaSection data={ctaData} demoSlug={demoData.demo_slug} />
        )}
      </main>

      {/* 14. Footer */}
      <Footer contactData={contactData} footerData={footerData} />
    </div>
  );
}
