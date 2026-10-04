// src/content/schema/portfolioSchema.ts
import { PageSchema } from './types';

export const PORTFOLIO_INDEX_SCHEMA: PageSchema = {
  pageKey: 'portfolio_index',
  title: 'Indeks Portofolio',
  path: '/portofolio',
  description: 'Halaman indeks kurasi visual yang menampilkan seluruh koleksi adat dan budaya.',
  sections: [
    {
      id: 'header',
      label: '1. Header Editorial',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'eyebrow',
          label: 'Label Kecil (Eyebrow)',
          type: 'text',
          charLimit: 50,
          default: 'ARSIP DOKUMENTASI ADAT & BUDAYA',
        },
        {
          key: 'heading',
          label: 'Judul Utama',
          type: 'text',
          charLimit: 80,
          default: 'Koleksi Dokumentasi Per Adat',
        },
        {
          key: 'subheading',
          label: 'Deskripsi Kuratorial',
          type: 'textarea',
          charLimit: 250,
          default: 'Setiap budaya membawa ritme, busana, dan kehangatan yang unik. Kami menyusun dokumentasi ini per koleksi adat agar kamu dapat merasakan nuansa sakral dan kebahagiaan setiap prosesi secara utuh.',
        },
      ],
    },
    {
      id: 'custom_inquiry',
      label: '2. Banner Permintaan Adat Lain',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'eyebrow',
          label: 'Label Kecil',
          type: 'text',
          charLimit: 40,
          default: 'ADAT ATAU BUDAYA LAIN?',
        },
        {
          key: 'title',
          label: 'Judul Pertanyaan',
          type: 'text',
          charLimit: 60,
          default: 'Punya Konsep Tradisi yang Berbeda?',
        },
        {
          key: 'description',
          label: 'Penjelasan Singkat',
          type: 'textarea',
          charLimit: 200,
          default: 'Kami siap mendokumentasikan adat daerah lainnya dengan riset dan penghormatan penuh pada setiap detail ritual keluarga.',
        },
        {
          key: 'cta_text',
          label: 'Teks Tombol Diskusi',
          type: 'text',
          charLimit: 30,
          default: 'Diskusikan Rencanamu',
        },
      ],
    },
  ],
};
