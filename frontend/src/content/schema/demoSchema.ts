// src/content/schema/demoSchema.ts
import { PageSchema } from './types';

export const DEMO_PAGE_SCHEMA: PageSchema = {
  pageKey: 'demo',
  title: 'Halaman Demo Simulasi',
  path: '/demo',
  description: 'Halaman simulasi interaktif galeri pemilihan foto untuk dicoba langsung oleh fotografer maupun klien.',
  sections: [
    {
      id: 'banner',
      label: '1. Banner Informasi Demo',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'notice_text',
          label: 'Teks Pengingat Simulasi',
          type: 'text',
          charLimit: 150,
          default: 'Mode Simulasi Klien: Kamu sedang mencoba tampilan galeri pemilih foto. Tidak ada yang disimpan ke database.',
        },
      ],
    },
    {
      id: 'gallery_info',
      label: '2. Info Galeri Demo',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'gallery_title',
          label: 'Nama Galeri Contoh',
          type: 'text',
          charLimit: 80,
          default: 'Galeri Simulasi Pengantin (Demo)',
        },
        {
          key: 'gallery_instruction',
          label: 'Instruksi Pemilihan',
          type: 'textarea',
          charLimit: 200,
          default: 'Pilih foto favoritmu untuk masuk tahap editing. Klik foto untuk memperbesar atau gunakan tanda centang untuk memilih.',
        },
        {
          key: 'max_selection',
          label: 'Batas Maksimal Pilihan (Angka)',
          type: 'number',
          default: 5,
        },
      ],
      photoSlots: [
        {
          key: 'demo_photos',
          label: 'Foto Contoh Galeri Demo (6-12 Foto)',
          description: 'Foto-foto yang bisa dicoba langsung oleh pengunjung di mode demo.',
          suggestedAspect: '3:4',
          minCount: 4,
          maxCount: 16,
        },
      ],
    },
  ],
};
