import React from 'react';
import { Image, BookOpen, Link as LinkIcon, Share2, LayoutDashboard, Copy } from 'lucide-react';

interface FeaturesProps {
  isDarkMode: boolean;
  textSub: string;
  cardBg: string;
  borderC: string;
}

const FEATURES = [
  {
    icon: <Image className="w-6 h-6" />,
    title: 'Galeri Seleksi Foto Klien',
    desc: 'Klien bisa langsung memilih foto favorit dari browser — tanpa download, tanpa instal aplikasi apa pun.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Showcase Portofolio (BETA)',
    desc: 'Tampilkan karya terbaikmu dalam grid masonry yang interaktif dan estetik langsung di halaman utama.',
  },
  {
    icon: <LinkIcon className="w-6 h-6" />,
    title: 'Ambil dari Google Drive',
    desc: 'Tarik ribuan foto langsung dari link folder Google Drive kamu. Tanpa perlu proses upload ulang ke server kami.',
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: 'Live Sinkronisasi Multi-Layar',
    desc: 'Pantau proses seleksi klien secara real-time. Jika klien klik "Pilih", progress di dashboardmu langsung bertambah.',
  },
  {
    icon: <LayoutDashboard className="w-6 h-6" />,
    title: 'Manajemen Portofolio Terpusat',
    desc: 'Semua foto unggulanmu terorganisir di satu tempat, siap memukau calon klien kapan saja.',
  },
  {
    icon: <Copy className="w-6 h-6" />,
    title: 'Salin Langsung ke Lightroom',
    desc: 'Setelah klien selesai memilih, salin nama-nama file fotonya dengan sekali klik untuk dicari di Lightroom.',
  },
];

export function Features({ isDarkMode, textSub, cardBg, borderC }: FeaturesProps) {
  return (
    <section id="fotografer" className={`py-24 ${isDarkMode ? 'bg-[#1A261C]' : 'bg-white'}`}>
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
  );
}
