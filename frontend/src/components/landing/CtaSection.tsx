import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Section } from './Section';
import { ArrowRight, Eye } from 'lucide-react';
import { prefetchRoute } from '../../lib/routeLoaders';

interface CtaSectionProps {
  data?: any;
  demoSlug?: string;
}

export function CtaSection({ data, demoSlug }: CtaSectionProps) {
  const navigate = useNavigate();

  const heading =
    data?.heading || 'Siap Menyederhanakan Seleksi Foto Klien?';
  const subheading =
    data?.subheading ||
    'Tinggalkan format chat WhatsApp yang berantakan. Berikan pengalaman kurasi foto yang cepat dan profesional bagi klien Anda hari ini.';
  const ctaPrimary = data?.cta_primary || 'Mulai Sekarang';
  const ctaSecondary = data?.cta_secondary || 'Coba Galeri Demo';

  return (
    <Section bg="kertas" className="!py-24 md:!py-32" belowFold>
      <div className="bg-marun text-kertas rounded-[2px] p-8 md:p-16 text-center max-w-4xl mx-auto shadow-elevated relative overflow-hidden border border-garis/30">
        
        {/* Subtle background ambient line */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-merah/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <span className="label-caps text-merah-tanda block mb-4">
          MULAI HARI INI
        </span>

        <h2 className="font-serif text-3xl md:text-5xl font-normal tracking-tight text-kertas mb-6 max-w-2xl mx-auto leading-tight">
          {heading}
        </h2>

        <p className="font-body text-base md:text-lg text-kertas/85 max-w-xl mx-auto mb-10 leading-relaxed">
          {subheading}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/register"
            onMouseEnter={() => prefetchRoute('/register')}
            onFocus={() => prefetchRoute('/register')}
            className="inline-flex items-center gap-2 bg-kertas text-marun hover:bg-white px-7 py-3 text-[15px] font-sans font-medium normal-case tracking-normal rounded-btn transition-colors duration-150 min-h-[44px] shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kertas focus-visible:ring-offset-2 focus-visible:ring-offset-marun"
          >
            <span>{ctaPrimary}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => navigate(`/${demoSlug || 'demo'}`)}
            onMouseEnter={() => prefetchRoute(`/${demoSlug || 'demo'}`)}
            onFocus={() => prefetchRoute(`/${demoSlug || 'demo'}`)}
            className="inline-flex items-center gap-2 border border-kertas/40 text-kertas hover:bg-kertas/15 px-6 py-3 text-[15px] font-sans font-medium normal-case tracking-normal rounded-btn transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kertas focus-visible:ring-offset-2 focus-visible:ring-offset-marun"
          >
            <Eye className="w-4 h-4" />
            <span>{ctaSecondary}</span>
          </button>
        </div>
      </div>
    </Section>
  );
}
