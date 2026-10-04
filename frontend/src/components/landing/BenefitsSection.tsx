import React from 'react';
import { Section } from './Section';
import {
  Link as LinkIcon,
  MousePointerClick,
  Timer,
  Save,
  Copy,
  UserMinus,
  Sparkles,
} from 'lucide-react';

interface BenefitsSectionProps {
  data?: any;
}

const ICON_MAP: Record<string, any> = {
  Link: LinkIcon,
  MousePointerClick: MousePointerClick,
  Timer: Timer,
  Save: Save,
  Copy: Copy,
  UserMinus: UserMinus,
};

export function BenefitsSection({ data }: BenefitsSectionProps) {
  const heading = data?.heading || 'Solusi Cerdas Seleksi Foto Klien';
  const items = data?.items || [
    {
      icon: 'Link',
      title: 'Tautkan Google Drive',
      description: 'Cukup masukkan tautan folder Google Drive, thumbnail foto langsung tampil rapi tanpa unggah manual.',
    },
    {
      icon: 'MousePointerClick',
      title: 'Klien Tinggal Ketuk',
      description: 'Tampilan galeri responsif dengan mode zoom detail, klien memilih hanya dengan satu ketukan.',
    },
    {
      icon: 'Timer',
      title: 'Batas Waktu & Kuota',
      description: 'Tentukan batas maksimal foto yang boleh dipilih dan tanggal tenggat waktu otomatis.',
    },
    {
      icon: 'Save',
      title: 'Tersimpan Otomatis',
      description: 'Pilihan klien langsung tersimpan secara realtime ke database tanpa risiko hilang jika browser tertutup.',
    },
    {
      icon: 'Copy',
      title: 'Salin ke Lightroom',
      description: 'Fotografer menyalin nama file terpilih dalam format koma langsung ke filter teks Lightroom.',
    },
    {
      icon: 'UserMinus',
      title: 'Tanpa Registrasi Klien',
      description: 'Klien langsung memilih tanpa perlu daftar akun atau mengingat kata sandi baru.',
    },
  ];

  return (
    <Section id="manfaat" bg="kertas" doubleBorderTop doubleBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-14 md:mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-merah font-semibold">№ 03</span>
          <span className="w-4 h-[1px] bg-garis" />
          <span className="label-caps text-tinta-lembut">FITUR TERVERIFIKASI</span>
        </div>
        <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
          {heading}
        </h2>
        <p className="font-body text-base text-tinta-lembut mt-4 max-w-xl">
          Dirancang untuk alur kerja riil fotografer profesional tanpa fitur karangan.
        </p>
      </div>

      {/* Numbered List with Double Borders */}
      <div className="border-double-t border-double-b divide-y divide-garis">
        {items.map((item: any, idx: number) => {
          const itemNo = `№ 0${idx + 1}`;
          return (
            <div
              key={idx}
              className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline group"
            >
              <div className="md:col-span-1">
                <span className="font-mono text-xs text-merah font-semibold">
                  {itemNo}
                </span>
              </div>

              <div className="md:col-span-4">
                <h3 className="font-serif text-xl sm:text-2xl text-tinta font-normal group-hover:text-merah transition-colors">
                  {item.title}
                </h3>
              </div>

              <div className="md:col-span-7">
                <p className="font-body text-base text-tinta-lembut leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
