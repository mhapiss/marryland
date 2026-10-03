import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { DraggableHeroStack } from '../DraggableHeroStack';

interface HeroProps {
  isDarkMode: boolean;
  textSub: string;
}

export function Hero({ isDarkMode, textSub }: HeroProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-36 md:pb-44 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-28">
      <div className="flex-1 max-w-2xl animate-fade-in">
        <div className="inline-flex items-center space-x-2 text-primary font-semibold text-[11px] tracking-[0.2em] uppercase mb-7">
          <span className="w-8 h-px bg-primary" />
          <span>Album Kenangan Digital</span>
        </div>
        <h1 className="text-[2.75rem] md:text-[3.75rem] lg:text-[4.25rem] font-serif font-bold leading-[1.1] mb-7">
          Tempat menikmati<br className="hidden md:block" /> dan{' '}
          <em className="text-primary font-normal not-italic" style={{ fontStyle: 'italic' }}>merawat</em>{' '}
          kenangan.
        </h1>
        <p className={`text-lg md:text-xl mb-10 leading-relaxed max-w-xl ${textSub}`}>
          Pernikahan, wisuda, ulang tahun — nikmati kembali setiap momen berharga dalam album digital yang nyaman dibuka, mudah dibagikan, dan selalu siap dibuka kembali.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
          <Link to="/register" className="btn-primary w-full sm:w-auto text-base px-10 py-4">
            <Sparkles className="w-4 h-4 mr-2.5" />
            Buat Album Gratis
          </Link>
          <a href="#cara-kerja" className="btn-outline w-full sm:w-auto text-base px-10 py-4">
            <Play className="w-4 h-4 mr-2" fill="currentColor" />
            Coba Demo
          </a>
        </div>
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${textSub}`}>
          {['Gratis untuk 2 album pertama', 'Tanpa kartu kredit', 'Tanpa aplikasi'].map((t, i) => (
            <div key={i} className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero visual */}
      <div className="flex-1 relative w-full max-w-lg mt-8 lg:mt-0 animate-slide-up">
        <DraggableHeroStack isDarkMode={isDarkMode} />
      </div>
    </section>
  );
}
