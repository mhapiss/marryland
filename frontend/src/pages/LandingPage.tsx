import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Footer } from '../components/landing/Footer';

const FAQS = [
  { q: 'Apakah klien saya perlu membuat akun?', a: 'Sama sekali tidak. Klien cukup klik link galeri yang kamu bagikan, dan mereka bisa langsung memulai seleksi. Tidak butuh password atau instalasi aplikasi.' },
  { q: 'Bagaimana cara Google Drive terintegrasi?', a: 'Upload foto ke Google Drive, atur visibilitas link folder ke "Anyone with the link", lalu paste link folder tersebut saat membuat galeri. by.marryland akan menarik otomatis foto-foto tersebut.' },
  { q: 'Apakah foto asli klien aman?', a: 'Tentu. Sistem kami hanya mengambil akses gambar (thumbnail resolusi layar) tanpa mengubah, mendownload ke server kami, atau menghapus file aslimu di Google Drive.' },
  { q: 'Bagaimana cara mencari foto pilihan klien di Lightroom?', a: 'Di dashboard, buka menu "Review Pilihan", dan klik "Copy utk Lightroom". Daftar nama file akan tersalin dengan pemisah koma, tinggal di-paste di kolom pencarian Lightroom (Text > Contains).' },
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [portfolioPhotos, setPortfolioPhotos] = useState<{id: string; image_url: string; caption: string | null; category: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('semua');

  const fetchPortfolio = useCallback(async () => {
    const { data, error } = await supabase
      .from('portfolio_photos')
      .select('id, image_url, caption, category')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (!error && data && data.length > 0) {
      setPortfolioPhotos(data);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // ─── Realtime: portfolio photos update instantly when admin changes them ───
  useRealtime({
    table: 'portfolio_photos',
    onAny: () => {
      fetchPortfolio();
    },
  });

  const bg = isDarkMode ? 'bg-[#141E16]' : 'bg-ivory';
  const textMain = isDarkMode ? 'text-[#E0EDE2]' : 'text-text';
  const textSub = isDarkMode ? 'text-[#8FA893]' : 'text-muted';
  const cardBg = isDarkMode ? 'bg-[#1A261C]' : 'bg-white';
  const borderC = isDarkMode ? 'border-[#2A3D2D]' : 'border-primary-100/50';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${bg} ${textMain} ambient-bg`}>
      {/* ─────── Decorative Elements ─────── */}
      <div className="deco-float w-64 h-64 bg-primary-100 top-20 -left-20 blur-3xl"></div>
      <div className="deco-float-reverse w-96 h-96 bg-primary-200/50 top-1/3 -right-32 blur-[100px]"></div>
      <div className="deco-float w-72 h-72 bg-primary-50/80 bottom-40 left-1/4 blur-3xl"></div>

      {/* ─────── Navbar ─────── */}
      <nav className={`sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-xl transition-colors duration-500 ${isDarkMode ? 'bg-[#141E16]/80 border-[#2A3D2D]' : 'bg-white/80 border-primary-100/40'}`}>
        <Link to="/" className="text-xl font-bold tracking-tight">
          by.<span className="text-primary">marryland</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8 text-[11px] font-semibold uppercase tracking-[0.15em]">
          <a href="#memories" className={`${textSub} hover:text-primary transition-colors duration-200`}>Memories</a>
          <a href="#fotografer" className={`${textSub} hover:text-primary transition-colors duration-200`}>Fotografer</a>
          <a href="#kontak" className={`${textSub} hover:text-primary transition-colors duration-200`}>Kontak</a>
          <a href="#faq" className={`${textSub} hover:text-primary transition-colors duration-200`}>FAQ</a>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full transition-colors duration-200 ${isDarkMode ? 'hover:bg-[#2A3D2D]' : 'hover:bg-primary-50'}`} aria-label="Toggle dark mode">
            {isDarkMode ? <Sun className="w-[18px] h-[18px]" strokeWidth="2" /> : <Moon className="w-[18px] h-[18px]" strokeWidth="2" />}
          </button>
          <Link to="/register" className="hidden md:inline-flex btn-primary text-sm px-6 py-2.5">
            Buat Album Gratis
          </Link>
        </div>
      </nav>

      <Hero isDarkMode={isDarkMode} textSub={textSub} />
      
      <Features isDarkMode={isDarkMode} textSub={textSub} cardBg={cardBg} borderC={borderC} />

      {/* ─────── Portfolio / Karya Kami ─────── */}
      <section id="portfolio" className={`py-24 overflow-hidden ${bg}`}>
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <div className="inline-flex items-center space-x-2 text-primary font-semibold text-[11px] tracking-[0.2em] uppercase mb-4">
            <span className="w-6 h-px bg-primary" />
            <span>Karya Kami</span>
            <span className="w-6 h-px bg-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8">
            Lebih dari sekadar foto,<br className="hidden md:block" /> ini adalah cerita.
          </h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['semua', 'pernikahan', 'wisuda', 'keluarga'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-glow'
                    : `${cardBg} border ${borderC} ${textSub} hover:border-primary/50 hover:text-primary`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Auto-scrolling Portfolio (Infinite Marquee) */}
        <div className="relative w-full overflow-hidden py-4 group">
          {portfolioPhotos.length > 0 ? (
            <div className="flex w-max gap-4 px-4 animate-carousel-scroll group-hover:[animation-play-state:paused]">
              {/* Duplicate the list to create the seamless infinite scroll effect */}
              {[...portfolioPhotos.filter(p => activeCategory === 'semua' || p.category === activeCategory), 
                ...portfolioPhotos.filter(p => activeCategory === 'semua' || p.category === activeCategory)].map((photo, i) => (
                <div 
                  key={`${photo.id}-${i}`} 
                  className="flex-none h-[350px] md:h-[500px] rounded-2xl overflow-hidden relative group"
                >
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || `Portfolio ${i}`} 
                    className="w-auto h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white font-medium text-sm md:text-base transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {photo.caption || <span className="capitalize">{photo.category}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-12">
              <p>Belum ada karya yang dipublikasikan.</p>
            </div>
          )}
        </div>
      </section>

      <HowItWorks textSub={textSub} />

      {/* ─────── FAQ ─────── */}
      <section id="faq" className={`py-24 ${isDarkMode ? 'bg-[#1A261C]' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Pertanyaan Umum</h2>
            <p className={textSub}>Belum nemu jawabannya? Hubungi kami via WhatsApp.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className={`${cardBg} rounded-2xl border ${borderC} overflow-hidden transition-all duration-300`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-medium hover:bg-primary-50/30 transition-colors duration-200"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-primary shrink-0 ml-4 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                  <p className={`px-6 pb-6 text-sm leading-relaxed ${textSub}`}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer isDarkMode={isDarkMode} textSub={textSub} />
    </div>
  );
}
