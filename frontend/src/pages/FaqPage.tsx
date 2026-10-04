import React, { useState, useEffect } from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { PageHero } from '../components/common/PageHero';
import { FaqAccordion } from '../components/common/FaqAccordion';

export default function FaqPage() {
  const { data, loading } = useHomeData();
  const [activeTab, setActiveTab] = useState<'Untuk Fotografer' | 'Untuk Klien'>('Untuk Fotografer');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kertas">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-merah border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const { content = {} } = data || {};
  const faqData = content['faq']?.content || content['faq']?.data || {};
  const allItems = faqData.items || [];
  
  const groups = ['Untuk Fotografer', 'Untuk Klien'] as const;
  const currentItems = allItems.filter((i: any) => i.group === activeTab);

  const accordionItems = currentItems.map((item: any, i: number) => ({
    number: `№ 0${i + 1}`,
    question: item.question,
    answer: item.answer,
  }));

  // Generate JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allItems.map((item: any) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  useEffect(() => {
    document.title = "FAQ - by.marryland";
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    const jsonStr = JSON.stringify(jsonLd);
    script.text = jsonStr;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(jsonLd)]);

  return (
    <div className="min-h-screen font-sans bg-kertas text-tinta overflow-x-hidden flex flex-col selection:bg-merah selection:text-kertas">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 w-full pt-32 pb-24 md:pt-40 md:pb-32">
        <PageHero
          number="№ 03"
          category="PUSAT BANTUAN"
          title={faqData.heading || "Pertanyaan Umum"}
          description={
            faqData.subheading ||
            "Temukan jawaban untuk pertanyaan yang sering diajukan seputar penggunaan by.marryland bagi fotografer maupun klien."
          }
          className="mb-12"
        />

        {/* Tabs */}
        <div className="flex justify-center border-b border-garis mb-12" role="tablist">
          {groups.map((group) => (
            <button
              key={group}
              role="tab"
              aria-selected={activeTab === group}
              onClick={() => { setActiveTab(group); }}
              className={`px-8 py-4 text-xs uppercase tracking-[0.14em] font-bold border-b-2 transition-colors min-h-[44px] ${
                activeTab === group 
                  ? 'border-merah text-merah' 
                  : 'border-transparent text-tinta-lembut hover:text-tinta'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Accordions */}
        {accordionItems.length > 0 ? (
          <FaqAccordion items={accordionItems} />
        ) : (
          <div className="text-center text-tinta-lembut py-12 font-body text-sm border border-garis rounded-[2px] bg-kertas-tua/30">
            Belum ada pertanyaan terdaftar di kategori ini.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
