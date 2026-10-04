import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Section } from './Section';
import { HomePhoto, ResponsiveImage } from '../ResponsiveImage';
import { ArrowUpRight } from 'lucide-react';

interface LiveDemoSectionProps {
  photo?: HomePhoto;
  data?: any;
}

export function LiveDemoSection({ photo, data }: LiveDemoSectionProps) {
  const navigate = useNavigate();

  const heading = data?.heading || 'Rasakan Pengalaman Klien';
  const description =
    data?.description ||
    'Coba sendiri kemudahan memilih foto dari sisi klien melalui galeri interaktif kami.';
  const demoSlug = data?.demo_slug;
  const ctaText = data?.cta_text || 'Buka Galeri Demo';

  return (
    <Section id="demo" bg="kertas" doubleBorderTop doubleBorderBottom>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Heading and CTA */}
        <div className="lg:col-span-5 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-merah font-semibold">№ 06</span>
            <span className="w-4 h-[1px] bg-garis" />
            <span className="label-caps text-tinta-lembut">
              SIMULASI INTERAKTIF
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight mb-6">
            {heading}
          </h2>

          <p className="font-body text-base text-tinta-lembut leading-relaxed mb-8">
            {description}
          </p>

          <button
            onClick={() => navigate(`/${demoSlug || 'demo'}`)}
            className="inline-flex items-center gap-2 bg-merah hover:bg-marun text-kertas px-7 py-3.5 text-sm font-medium rounded-sm transition-colors min-h-[44px]"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Browser Frame Mockup */}
        <div className="lg:col-span-7 w-full">
          <div className="bg-kertas border border-garis rounded-sm shadow-none overflow-hidden">
            
            {/* Browser Header Bar */}
            <div className="bg-kertas-tua border-b border-garis px-4 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-tinta/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-tinta/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-tinta/20" />
              </div>

              {/* URL address bar */}
              <div className="flex-1 bg-kertas border border-garis rounded-sm px-3 py-1 text-xs text-tinta-lembut font-mono truncate">
                by.marryland/{demoSlug || 'demo'}
              </div>
            </div>

            {/* Browser Content */}
            <div className="aspect-[16/10] w-full bg-kertas-tua relative overflow-hidden">
              {photo ? (
                <ResponsiveImage
                  photo={photo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
                  alt="Tampilan demo galeri klien"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              
              {/* Overlay preview label */}
              <div className="absolute bottom-4 right-4 bg-tinta/85 text-kertas text-[11px] font-mono px-3 py-1.5 rounded-sm">
                Mode Klien Aktif
              </div>
            </div>

          </div>
        </div>

      </div>
    </Section>
  );
}
