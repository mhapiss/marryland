import React from 'react';
import { Link } from 'react-router-dom';

interface HowItWorksProps {
  textSub: string;
}

const STEPS = [
  { num: '01', title: 'Buat Galeri', desc: 'Paste link folder Google Drive kamu. Foto langsung tampil sebagai galeri seleksi.' },
  { num: '02', title: 'Kirim ke Klien', desc: 'Bagikan link galeri. Klien buka langsung dari browser, tanpa perlu download.' },
  { num: '03', title: 'Klien Memilih', desc: 'Klien bebas memilih foto favorit dan mengirimkan laporannya secara real-time.' },
  { num: '04', title: 'Salin ke Lightroom', desc: 'Lihat daftar foto pilihan klien di dashboard, lalu salin daftar namanya langsung ke Lightroom.' },
];

export function HowItWorks({ textSub }: HowItWorksProps) {
  return (
    <>
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
    </>
  );
}
