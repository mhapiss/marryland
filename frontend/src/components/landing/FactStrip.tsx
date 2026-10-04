import React from 'react';
import { Section } from './Section';
import { HardDrive, Link as LinkIcon, ShieldCheck, Sparkles } from 'lucide-react';

interface FactStripProps {
  data?: any;
}

export function FactStrip({ data }: FactStripProps) {
  const heading = data?.heading || 'Dirancang Khusus untuk Alur Kerja Fotografer';
  const items = data?.items || [
    {
      title: 'Koneksi Google Drive',
      description: 'Cukup masukkan tautan folder, sistem membaca thumbnail otomatis tanpa perlu unggah ulang.',
    },
    {
      title: 'Satu Tautan Unik',
      description: 'Klien langsung membuka galeri di ponsel atau laptop tanpa perlu unduh atau instal aplikasi.',
    },
    {
      title: 'Penyimpanan Realtime',
      description: 'Setiap foto yang dipilih tersimpan otomatis, aman walau browser klien tertutup.',
    },
    {
      title: 'Salin Format Lightroom',
      description: 'Daftar nama file siap dipaste ke filter pencarian teks Lightroom dalam satu klik.',
    },
  ];

  const icons = [HardDrive, LinkIcon, ShieldCheck, Sparkles];

  return (
    <Section bg="kertas-tua" className="!py-16 md:!py-20">
      <div className="mb-10 text-center">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-merah">
          ALUR KERJA TERVERIFIKASI
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-tinta mt-2 font-normal">
          {heading}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map((item: any, idx: number) => {
          const Icon = icons[idx % icons.length];
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-[2px] border border-garis flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-kertas-tua rounded-[2px] flex items-center justify-center text-merah mb-4 border border-garis">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-normal text-tinta mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-tinta-lembut leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-garis/50 text-[11px] font-mono text-tinta-lembut uppercase tracking-wider">
                Fakta 0{idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
