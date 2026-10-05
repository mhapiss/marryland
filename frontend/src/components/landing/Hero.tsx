import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Check, ArrowRight } from 'lucide-react';
import { prefetchRoute } from '../../lib/routeLoaders';

interface HeroProps {
  data?: any;
  demoSlug?: string;
}

// Markdown parser helper for *accent word*
const parseHeadline = (text: string) => {
  if (!text) return text;
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={index} className="italic font-normal text-merah">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
};

export function Hero({ data, demoSlug }: HeroProps) {
  const navigate = useNavigate();

  const eyebrow = data?.eyebrow || 'PILIHAN CERDAS FOTOGRAFER';
  const promise = data?.promise || 'Klien Pilih Foto *Tanpa Ribet*';
  const subheadline =
    data?.subheadline ||
    'Bagikan galeri foto langsung dari Google Drive. Klien memilih foto favorit tanpa perlu login, dan kamu cukup menyalin nama file langsung ke Lightroom.';
  const ctaPrimary = data?.cta_primary || 'Mulai Sekarang';
  const ctaDemo = data?.cta_demo || 'Lihat Contoh Galeri';
  const ctaLogin = data?.cta_login || 'Masuk Dashboard';

  const facts = data?.facts || [
    { text: 'Tanpa simpan file asli di server' },
    { text: 'Klien pilih tanpa perlu akun' },
    { text: 'Salin daftar nama ke Lightroom' },
  ];

  // Contact sheet film frames with red marker selections (5 out of 6 marked)
  const contactSheetFrames = [
    { id: 1, frameNo: '12A', selected: true, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80' },
    { id: 2, frameNo: '13', selected: true, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80' },
    { id: 3, frameNo: '13A', selected: false, url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80' },
    { id: 4, frameNo: '14', selected: true, url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=400&q=80' },
    { id: 5, frameNo: '14A', selected: true, url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80' },
    { id: 6, frameNo: '15', selected: true, url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <section className="pt-28 md:pt-36 pb-16 md:pb-24 bg-kertas border-b border-garis relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        
        {/* Left Column: Editorial Copy */}
        <div className="lg:col-span-7 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-merah font-semibold">№ 01</span>
            <span className="w-4 h-[1px] bg-garis" />
            <span className="label-caps text-tinta-lembut">{eyebrow}</span>
          </div>

          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02] tracking-tight text-tinta mb-6">
            {parseHeadline(promise)}
          </h1>

          <p className="font-body text-base md:text-lg text-tinta-lembut leading-relaxed max-w-xl mb-8">
            {subheadline}
          </p>

          {/* 3 Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-9 w-full sm:w-auto">
            <Link
              to="/register"
              onMouseEnter={() => prefetchRoute('/register')}
              onFocus={() => prefetchRoute('/register')}
              className="inline-flex items-center justify-center bg-merah hover:bg-merah-hover active:bg-marun text-kertas px-7 py-3 text-[15px] font-sans font-medium rounded-btn transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 focus-visible:ring-offset-kertas"
            >
              {ctaPrimary}
            </Link>

            <button
              onClick={() => navigate(`/${demoSlug || 'demo'}`)}
              onMouseEnter={() => prefetchRoute(`/${demoSlug || 'demo'}`)}
              onFocus={() => prefetchRoute(`/${demoSlug || 'demo'}`)}
              className="inline-flex items-center justify-center border border-tinta/35 text-tinta hover:bg-kertas-tua hover:border-tinta active:bg-kertas-tua/80 px-6 py-3 text-[15px] font-sans font-medium rounded-btn transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-kertas"
            >
              {ctaDemo}
            </button>

            <Link
              to="/login"
              onMouseEnter={() => prefetchRoute('/login')}
              onFocus={() => prefetchRoute('/login')}
              className="text-sm font-sans font-medium normal-case tracking-normal text-tinta hover:text-merah px-3 py-2 min-h-[44px] flex items-center transition-colors duration-150 link-vintage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 focus-visible:ring-offset-kertas rounded-btn"
            >
              {ctaLogin}
            </Link>
          </div>

          {/* 3 Verified Facts Chips */}
          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-garis w-full max-w-lg">
            {facts.map((fact: any, index: number) => (
              <span
                key={index}
                className="inline-flex items-center text-xs text-tinta bg-kertas-tua/60 px-3 py-1.5 rounded-chip border border-garis"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-merah mr-2 shrink-0" />
                {fact.text}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Authentic Contact Sheet Panel */}
        <div className="lg:col-span-5 relative w-full flex justify-center" aria-hidden="true">
          <div className="w-full max-w-md bg-tinta text-kertas rounded-sm p-4 sm:p-5 border border-tinta shadow-none">
            
            {/* Contact Sheet Header / Edge Film */}
            <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-kertas/20 text-[10px] font-mono text-kertas/70">
              <span className="tracking-widest">KODAK TRI-X &bull; 400TX</span>
              <span className="text-merah-tanda font-bold">5 PILIHAN TERPILIH</span>
              <span className="tracking-widest">EXP 36</span>
            </div>

            {/* 3-Column Photo Contact Sheet Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {contactSheetFrames.map((frame) => (
                <div
                  key={frame.id}
                  className="aspect-[3/4] relative bg-tinta border border-kertas/25 overflow-hidden group"
                >
                  <img
                    src={frame.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Frame number on edge */}
                  <span className="absolute bottom-0.5 left-1 font-mono text-[8px] text-kertas/80 bg-tinta/70 px-1 rounded-[1px]">
                    {frame.frameNo}
                  </span>

                  {/* Red Marker Circle (Spidol Merah Khas Lembar Kontak) */}
                  {frame.selected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-14 h-14 text-merah-tanda opacity-95" viewBox="0 0 100 100" fill="none">
                        <ellipse
                          cx="50"
                          cy="50"
                          rx="40"
                          ry="38"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="4 2"
                          transform="rotate(-5 50 50)"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Sheet Bottom Status */}
            <div className="flex items-center justify-between pt-2.5 border-t border-kertas/20 text-[11px] font-mono">
              <div className="text-kertas/70">
                <p className="font-semibold text-kertas">24 / 50 FOTO TERPILIH</p>
                <p className="text-[10px] text-kertas/50">Tersimpan Otomatis</p>
              </div>

              <div className="bg-merah text-kertas text-[11px] font-sans px-3 py-1.5 rounded-btn flex items-center gap-1.5">
                <span>Kirim Pilihan</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}