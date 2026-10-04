import React from 'react';
import { Section } from './Section';
import { UploadCloud, Share2, CopyCheck } from 'lucide-react';

interface StepsSectionProps {
  data?: any;
}

export function StepsSection({ data }: StepsSectionProps) {
  const heading = data?.heading || '3 Langkah Alur Kerja';
  const items = data?.items || [
    {
      title: 'Buat Galeri',
      description: 'Atur batas foto, tanggal tenggat, dan masukkan tautan folder Google Drive.',
    },
    {
      title: 'Bagikan ke Klien',
      description: 'Kirim satu tautan unik. Klien bebas memilih foto favorit dari HP atau komputer.',
    },
    {
      title: 'Salin ke Lightroom',
      description: 'Buka dashboard saat klien selesai, salin daftar nama file untuk langsung mulai edit.',
    },
  ];

  const icons = [UploadCloud, Share2, CopyCheck];

  return (
    <Section id="cara-kerja" bg="kertas-tua" doubleBorderTop doubleBorderBottom>
      {/* Header */}
      <div className="max-w-2xl mb-14 md:mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-merah font-semibold">№ 05</span>
          <span className="w-4 h-[1px] bg-garis" />
          <span className="label-caps text-tinta-lembut">ALUR PRAKTIS</span>
        </div>
        <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
          {heading}
        </h2>
        <p className="font-body text-base text-tinta-lembut mt-3">
          Tiga langkah langsung selesai tanpa perlu instalasi aplikasi rumit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {items.map((item: any, idx: number) => {
          const stepNumber = `0${idx + 1}`;
          return (
            <div
              key={idx}
              className="border-t-2 border-garis pt-6 flex flex-col justify-between group hover:border-merah transition-colors"
            >
              <div>
                <span className="font-serif text-5xl md:text-6xl text-merah/30 group-hover:text-merah transition-colors block mb-4 select-none font-normal">
                  {stepNumber}
                </span>

                <h3 className="font-serif text-xl md:text-2xl text-tinta font-normal mb-3">
                  {item.title}
                </h3>

                <p className="font-body text-sm md:text-base text-tinta-lembut leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-3 border-t border-garis/60 flex items-center justify-between text-xs font-mono text-tinta-lembut/70">
                <span>TAHAP {stepNumber}</span>
                <span className="text-merah font-semibold">&bull; SELESAI</span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
