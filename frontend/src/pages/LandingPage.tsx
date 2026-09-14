import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ),
    title: 'Galeri Seleksi Foto',
    desc: 'Klien bisa langsung pilih foto favorit dari browser — tanpa download, tanpa install aplikasi.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    ),
    title: 'Album Kenangan Digital',
    desc: 'Tampilan ala majalah yang bisa dibagikan ke keluarga. Dibagi per chapter, bisa dikunci PIN.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
    ),
    title: 'Integrasi Google Drive',
    desc: 'Langsung ambil foto dari folder Google Drive. Tanpa upload ulang, langsung siap pilih.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
    ),
    title: 'Share via WhatsApp',
    desc: 'Kirim link galeri langsung ke klien via WhatsApp. Satu klik, pesan otomatis siap dikirim.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
    ),
    title: 'White-Label Branding',
    desc: 'Nama studio, logo, dan warna aksen tampil di halaman klien. Kesan profesional tanpa biaya ekstra.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    ),
    title: 'Privasi Terjaga',
    desc: 'Album bisa dikunci dengan PIN. Hanya orang yang punya link dan PIN yang bisa mengakses.',
  },
];

const STEPS = [
  { num: '01', title: 'Buat Galeri', desc: 'Paste link folder Google Drive kamu. Foto langsung tampil sebagai galeri seleksi.' },
  { num: '02', title: 'Kirim ke Klien', desc: 'Bagikan link via WhatsApp. Klien buka langsung dari browser, tanpa perlu download.' },
  { num: '03', title: 'Klien Pilih Foto', desc: 'Klien browse, pilih foto favorit, dan kirim pilihan — semua tersimpan otomatis.' },
  { num: '04', title: 'Export & Selesai', desc: 'Lihat daftar foto pilihan klien, copy ke Lightroom, atau download langsung.' },
];

const FAQS = [
  { q: 'Apakah by.marryland gratis?', a: 'Ya! Kamu bisa membuat hingga 2 album pertama secara gratis. Tidak perlu kartu kredit untuk mendaftar.' },
  { q: 'Apakah klien saya perlu buat akun?', a: 'Tidak. Klien cukup klik link yang kamu bagikan dan langsung bisa memilih foto. Tanpa download, tanpa registrasi.' },
  { q: 'Bagaimana cara integrasi Google Drive?', a: 'Cukup share folder Google Drive kamu dengan setting "Anyone with the link", lalu paste link-nya di dashboard. Foto langsung muncul di galeri.' },
  { q: 'Apakah foto saya aman?', a: 'Foto tetap tersimpan di Google Drive kamu. Kami hanya menampilkan thumbnail untuk keperluan seleksi. Tidak ada foto yang di-upload ke server kami.' },
  { q: 'Bisa custom branding studio saya?', a: 'Tentu! Kamu bisa memasang nama studio, logo, dan warna aksen di halaman seleksi klien melalui menu Pengaturan di dashboard.' },
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const bg = isDarkMode ? 'bg-[#1a1714]' : 'bg-ivory';
  const textMain = isDarkMode ? 'text-[#EDE8DF]' : 'text-text';
  const textSub = isDarkMode ? 'text-[#9C9487]' : 'text-muted';
  const cardBg = isDarkMode ? 'bg-[#241f1b]' : 'bg-white';
  const borderC = isDarkMode ? 'border-[#3a332d]' : 'border-primary-100/50';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${bg} ${textMain}`}>
      {/* ─────── Navbar ─────── */}
      <nav className={`sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-xl transition-colors duration-500 ${isDarkMode ? 'bg-[#1a1714]/80 border-[#3a332d]' : 'bg-white/80 border-primary-100/40'}`}>
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
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full transition-colors duration-200 ${isDarkMode ? 'hover:bg-[#3a332d]' : 'hover:bg-primary-50'}`} aria-label="Toggle dark mode">
            {isDarkMode
              ? <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            }
          </button>
          <Link to="/register" className="hidden md:inline-flex btn-primary text-sm px-6 py-2.5">
            Buat Album Gratis
          </Link>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
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
              <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              Buat Album Gratis
            </Link>
            <a href="#cara-kerja" className="btn-outline w-full sm:w-auto text-base px-10 py-4">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Coba Demo
            </a>
          </div>
          <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${textSub}`}>
            {['Gratis untuk 2 album pertama', 'Tanpa kartu kredit', 'Tanpa aplikasi'].map((t, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="flex-1 relative w-full max-w-lg mt-8 lg:mt-0 animate-slide-up">
          <div className="relative h-[420px] md:h-[520px] w-full">
            <div className={`absolute inset-0 ${cardBg} p-3 rounded-3xl shadow-elevated border ${borderC} transform -rotate-3 transition-transform duration-500 hover:-rotate-5 origin-bottom-left z-10`}>
              <div className="w-full h-full rounded-2xl bg-primary-100/30 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop" alt="Wedding" className="w-full h-full object-cover opacity-80" loading="lazy" />
              </div>
            </div>
            <div className={`absolute inset-0 ${cardBg} p-3 rounded-3xl shadow-elevated border ${borderC} transform rotate-2 transition-transform duration-500 hover:rotate-4 origin-bottom-right z-20`}>
              <div className="w-full h-full rounded-2xl bg-primary-100/30 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop" alt="Wedding" className="w-full h-full object-cover opacity-90" loading="lazy" />
              </div>
            </div>
            <div className={`absolute inset-0 ${cardBg} p-3 rounded-3xl shadow-elevated border ${borderC} transform rotate-[5deg] transition-transform duration-500 hover:rotate-[7deg] origin-bottom z-30`}>
              <div className="w-full h-full rounded-2xl bg-primary-100/30 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop" alt="Wedding" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="absolute -left-4 md:-left-10 bottom-14 z-40 animate-float">
              <div className={`${cardBg} py-3 px-5 rounded-full shadow-card border ${borderC} flex items-center space-x-3`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <span className="font-semibold text-sm">Momen yang dikenang</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Features ─────── */}
      <section id="fotografer" className={`py-24 ${isDarkMode ? 'bg-[#1f1b17]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 text-primary font-semibold text-[11px] tracking-[0.2em] uppercase mb-4">
              <span className="w-6 h-px bg-primary" />
              <span>Fitur Unggulan</span>
              <span className="w-6 h-px bg-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Semua yang kamu butuhkan,<br className="hidden md:block" /> dalam satu platform.
            </h2>
            <p className={`max-w-2xl mx-auto ${textSub}`}>
              Dari seleksi foto klien hingga album kenangan keluarga — semuanya dirancang khusus untuk fotografer Indonesia.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className={`${cardBg} rounded-2xl border ${borderC} p-7 transition-all duration-300 hover:shadow-card hover:-translate-y-1 group`}>
                <div className="w-12 h-12 rounded-xl bg-primary-100/60 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${textSub}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── How It Works ─────── */}
      <section id="cara-kerja" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 text-primary font-semibold text-[11px] tracking-[0.2em] uppercase mb-4">
              <span className="w-6 h-px bg-primary" />
              <span>Cara Kerja</span>
              <span className="w-6 h-px bg-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              4 langkah, galeri siap dibagikan.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl font-serif font-bold text-primary/20 group-hover:text-primary/40 transition-colors duration-300 mb-3">
                  {s.num}
                </div>
                <h4 className="font-bold text-base mb-2">{s.title}</h4>
                <p className={`text-sm leading-relaxed ${textSub}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── CTA Banner ─────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-primary-800 to-primary-900 rounded-3xl px-10 py-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                Siap menyimpan kenangan?
              </h2>
              <p className="text-primary-200 mb-8 max-w-lg mx-auto">
                Daftar gratis sekarang dan buat album pertamamu dalam 5 menit.
              </p>
              <Link to="/register" className="inline-flex items-center justify-center bg-white text-primary-900 px-10 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:shadow-elevated hover:scale-105">
                Mulai Gratis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── FAQ ─────── */}
      <section id="faq" className={`py-24 ${isDarkMode ? 'bg-[#1f1b17]' : 'bg-white'}`}>
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
                  <svg className={`w-5 h-5 text-primary shrink-0 ml-4 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                  <p className={`px-6 pb-6 text-sm leading-relaxed ${textSub}`}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className={`border-t py-12 ${isDarkMode ? 'border-[#3a332d]' : 'border-primary-100/40'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight">by.<span className="text-primary">marryland</span></span>
            <span className={`text-xs ${textSub}`}>· Album Kenangan Digital</span>
          </div>
          <div className={`flex items-center space-x-6 text-sm ${textSub}`}>
            <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-primary transition-colors">Kontak</a>
          </div>
          <p className={`text-xs ${textSub}`}>© {new Date().getFullYear()} by.marryland. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
