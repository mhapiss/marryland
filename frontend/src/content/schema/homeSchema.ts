// src/content/schema/homeSchema.ts
import { PageSchema } from './types';
import { HOME_DEFAULTS } from '../../config/homeDefaults';

export const HOME_PAGE_SCHEMA: PageSchema = {
  pageKey: 'home',
  title: 'Beranda (Landing Page)',
  path: '/',
  description: 'Halaman utama untuk fotografer dan calon klien yang merangkum nilai dan alur kerja by.marryland.',
  sections: [
    {
      id: 'hero',
      label: '1. Hero Section',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'eyebrow',
          label: 'Label Kecil (Eyebrow)',
          type: 'text',
          charLimit: 50,
          default: HOME_DEFAULTS.hero.eyebrow,
        },
        {
          key: 'promise',
          label: 'Janji Utama (Gunakan *kata* untuk cetak miring)',
          type: 'text',
          charLimit: 120,
          default: HOME_DEFAULTS.hero.promise,
        },
        {
          key: 'subheadline',
          label: 'Subjudul Alur Kerja',
          type: 'textarea',
          charLimit: 250,
          default: HOME_DEFAULTS.hero.subheadline,
        },
        {
          key: 'cta_primary',
          label: 'Teks Tombol Utama',
          type: 'text',
          charLimit: 30,
          default: HOME_DEFAULTS.hero.cta_primary,
        },
        {
          key: 'cta_demo',
          label: 'Teks Tombol Demo',
          type: 'text',
          charLimit: 30,
          default: HOME_DEFAULTS.hero.cta_demo,
        },
      ],
      photoSlots: [
        {
          key: 'hero_main',
          label: 'Foto Hero Utama',
          description: 'Foto portrait vertikal yang tampil di kolom samping hero.',
          suggestedAspect: '3:4',
          minCount: 1,
          maxCount: 1,
          defaultPhotos: [
            {
              url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
              alt: 'Pengantin dalam momen sakral pernikahan',
            },
          ],
        },
      ],
    },
    {
      id: 'marquee',
      label: '2. Kolase Foto Infinite (Marquee)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Marquee',
          type: 'text',
          charLimit: 60,
          default: HOME_DEFAULTS.marquee.heading,
        },
      ],
      photoSlots: [
        {
          key: 'marquee',
          label: 'Arsip Foto Berjalan',
          description: 'Unggah 6 hingga 14 foto vertikal/horizontal dengan beragam rasio.',
          suggestedAspect: 'free',
          minCount: 6,
          maxCount: 16,
        },
      ],
    },
    {
      id: 'facts',
      label: '3. Strip Fakta Terverifikasi',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Strip Fakta',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.facts.heading,
        },
        {
          key: 'items',
          label: 'Daftar Fakta Desain',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Judul Fakta', type: 'text', default: '' },
            { key: 'description', label: 'Uraian Fakta', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.facts.items,
        },
      ],
    },
    {
      id: 'portfolio',
      label: '4. Bagian Portofolio Beranda',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Bagian Portofolio',
          type: 'text',
          charLimit: 60,
          default: HOME_DEFAULTS.portfolio.heading,
        },
        {
          key: 'subheading',
          label: 'Pengantar Portofolio',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.portfolio.subheading,
        },
        {
          key: 'cta_text',
          label: 'Teks Tombol Lihat Semua',
          type: 'text',
          charLimit: 40,
          default: HOME_DEFAULTS.portfolio.cta_text,
        },
      ],
    },
    {
      id: 'problem',
      label: '5. Bagian Masalah (Problem)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Masalah',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.problem.heading,
        },
        {
          key: 'description',
          label: 'Deskripsi Masalah',
          type: 'textarea',
          charLimit: 250,
          default: HOME_DEFAULTS.problem.description,
        },
        {
          key: 'note',
          label: 'Catatan Bawah',
          type: 'text',
          charLimit: 120,
          default: HOME_DEFAULTS.problem.note,
        },
        {
          key: 'chat_bubbles',
          label: 'Ilustrasi Percakapan WhatsApp',
          type: 'list',
          itemFields: [
            { key: 'sender', label: 'Pengirim (klien/fotografer)', type: 'text', default: 'klien' },
            { key: 'text', label: 'Isi Pesan', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.problem.chat_bubbles,
        },
      ],
    },
    {
      id: 'benefits',
      label: '6. Manfaat Fitur',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Manfaat',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.benefits.heading,
        },
        {
          key: 'items',
          label: 'Kartu Manfaat',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Judul', type: 'text', default: '' },
            { key: 'description', label: 'Penjelasan', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.benefits.items,
        },
      ],
    },
    {
      id: 'featured',
      label: '7. Sorotan Gelap (Featured Showcase)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Sorotan',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.featured.heading,
        },
        {
          key: 'subheading',
          label: 'Subjudul',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.featured.subheading,
        },
      ],
      photoSlots: [
        {
          key: 'featured',
          label: '3 Foto Sorotan (Tengah Terbesar)',
          description: 'Foto tengah akan ditampilkan paling besar secara otomatis.',
          suggestedAspect: '3:4',
          minCount: 3,
          maxCount: 3,
        },
      ],
    },
    {
      id: 'demo',
      label: '8. Contoh Langsung (Demo Frame)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Demo',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.demo.heading,
        },
        {
          key: 'description',
          label: 'Deskripsi Demo',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.demo.description,
        },
        {
          key: 'cta_text',
          label: 'Teks Tombol Demo',
          type: 'text',
          charLimit: 40,
          default: HOME_DEFAULTS.demo.cta_text,
        },
      ],
      photoSlots: [
        {
          key: 'demo_mockup',
          label: 'Screenshot / Mockup Antarmuka Demo',
          suggestedAspect: '16:9',
          minCount: 0,
          maxCount: 1,
        },
      ],
    },
    {
      id: 'steps',
      label: '9. Cara Kerja (3 Langkah)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Cara Kerja',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.steps.heading,
        },
        {
          key: 'items',
          label: 'Langkah-langkah',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Judul Langkah', type: 'text', default: '' },
            { key: 'description', label: 'Penjelasan Langkah', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.steps.items,
        },
      ],
    },
    {
      id: 'pricing',
      label: '10. Paket Harga (Default Tersembunyi)',
      allowToggleVisibility: true,
      defaultVisible: false,
      fields: [
        {
          key: 'heading',
          label: 'Judul Harga',
          type: 'text',
          charLimit: 60,
          default: HOME_DEFAULTS.pricing.heading,
        },
        {
          key: 'description',
          label: 'Keterangan Harga',
          type: 'textarea',
          charLimit: 150,
          default: HOME_DEFAULTS.pricing.description,
        },
        {
          key: 'packages',
          label: 'Daftar Paket',
          type: 'list',
          itemFields: [
            { key: 'name', label: 'Nama Paket', type: 'text', default: '' },
            { key: 'price', label: 'Harga', type: 'text', default: '[HARGA]' },
            { key: 'features', label: 'Fitur-fitur', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.pricing.packages,
        },
      ],
    },
    {
      id: 'faq',
      label: '11. FAQ Ringkas',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul FAQ',
          type: 'text',
          charLimit: 60,
          default: HOME_DEFAULTS.faq.heading,
        },
      ],
    },
    {
      id: 'cta',
      label: '12. Ajakan Akhir (CTA)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'heading',
          label: 'Judul Ajakan',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.cta.heading,
        },
        {
          key: 'subheading',
          label: 'Subjudul Ajakan',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.cta.subheading,
        },
        {
          key: 'cta_primary',
          label: 'Tombol Aksi Utama',
          type: 'text',
          charLimit: 30,
          default: HOME_DEFAULTS.cta.cta_primary,
        },
      ],
    },
  ],
};
