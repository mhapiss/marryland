// src/content/schema/clientSchema.ts
import { PageSchema } from './types';
import { HOME_DEFAULTS } from '../../config/homeDefaults';

const defaultClient = (HOME_DEFAULTS as any).clientPage || {};

export const CLIENT_PAGE_SCHEMA: PageSchema = {
  pageKey: 'client',
  title: 'Halaman Untuk Klien',
  path: '/untuk-klien',
  description: 'Halaman panduan dan penjelasan alur pemilihan foto untuk pengantin, wisudawan, dan keluarga.',
  sections: [
    {
      id: 'hero',
      label: '1. Hero & Form Buka Galeri',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'hero_eyebrow',
          label: 'Label Kecil (Eyebrow)',
          type: 'text',
          charLimit: 50,
          default: defaultClient.hero_eyebrow || 'PENGALAMAN MEMILIH FOTO',
        },
        {
          key: 'hero_heading',
          label: 'Judul Hero',
          type: 'text',
          charLimit: 120,
          default: defaultClient.hero_heading || 'Pilih Momen Berhargamu dengan Nyaman dan *Tenang*',
        },
        {
          key: 'hero_sub',
          label: 'Subjudul Hero',
          type: 'textarea',
          charLimit: 250,
          default: defaultClient.hero_sub || 'Buka link dari fotografermu, beri tanda suka pada foto favorit, dan kirim kembali tanpa repot mengetik nama file satu per satu.',
        },
        {
          key: 'cta_demo',
          label: 'Teks Tombol Coba Demo',
          type: 'text',
          charLimit: 30,
          default: defaultClient.cta_demo || 'Coba Demo Pemilihan',
        },
        {
          key: 'link_box_title',
          label: 'Judul Kotak Link Galeri',
          type: 'text',
          charLimit: 60,
          default: defaultClient.link_box_title || 'Sudah punya link galeri dari fotografermu?',
        },
        {
          key: 'link_box_placeholder',
          label: 'Placeholder Input Link',
          type: 'text',
          charLimit: 60,
          default: defaultClient.link_box_placeholder || 'Tempel tautan atau masukkan kode galeri...',
        },
        {
          key: 'link_box_btn',
          label: 'Teks Tombol Buka Galeri',
          type: 'text',
          charLimit: 30,
          default: defaultClient.link_box_btn || 'Buka Galeri',
        },
      ],
      photoSlots: [
        {
          key: 'hero_photos',
          label: 'Foto Kolase Hero Klien (3 Foto)',
          description: 'Satu foto portrait utama dan dua foto pelengkap bergeser.',
          suggestedAspect: '3:4',
          minCount: 1,
          maxCount: 3,
        },
      ],
    },
    {
      id: 'problem',
      label: '2. Ilustrasi Masalah Memilih Foto Manual',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'problem_heading',
          label: 'Judul Masalah',
          type: 'text',
          charLimit: 80,
          default: defaultClient.problem_heading || 'Tak Perlu Lagi Mencatat Puluhan Nama File yang Rumit',
        },
        {
          key: 'problem_desc',
          label: 'Deskripsi Masalah',
          type: 'textarea',
          charLimit: 300,
          default: defaultClient.problem_desc || 'Mengetik ulang kode seperti DSC_0492.JPG di chat WhatsApp sangat melelahkan dan rawan salah. Bersama by.marryland, kamu cukup mengetuk foto yang kamu sukai.',
        },
      ],
    },
    {
      id: 'benefits',
      label: '3. Manfaat Untuk Klien',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'benefits_heading',
          label: 'Judul Manfaat',
          type: 'text',
          charLimit: 80,
          default: defaultClient.benefits_heading || 'Dirancang Agar Kamu Menikmati Setiap Momen',
        },
        {
          key: 'benefits',
          label: 'Daftar 6 Manfaat Klien',
          type: 'list',
          itemFields: [
            { key: 'num', label: 'Nomor (01, 02..)', type: 'text', default: '' },
            { key: 'title', label: 'Judul Manfaat', type: 'text', default: '' },
            { key: 'description', label: 'Uraian Manfaat', type: 'textarea', default: '' },
          ],
          default: defaultClient.benefits || [],
        },
      ],
    },
    {
      id: 'situations',
      label: '4. Situasi Penggunaan',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'situations_heading',
          label: 'Judul Situasi',
          type: 'text',
          charLimit: 80,
          default: defaultClient.situations_heading || 'Cocok untuk Segala Momen Berharga',
        },
        {
          key: 'situations',
          label: 'Daftar Situasi',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Nama Situasi (Wedding, Wisuda, dll)', type: 'text', default: '' },
            { key: 'caption', label: 'Keterangan Penggunaan', type: 'textarea', default: '' },
          ],
          default: defaultClient.situations || [],
        },
      ],
      photoSlots: [
        {
          key: 'situation_photos',
          label: 'Foto Situasi (3 Foto)',
          suggestedAspect: '3:4',
          minCount: 3,
          maxCount: 3,
        },
      ],
    },
    {
      id: 'steps',
      label: '5. Cara Memilih Foto',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'steps_heading',
          label: 'Judul Langkah',
          type: 'text',
          charLimit: 80,
          default: defaultClient.steps_heading || 'Tiga Langkah Sederhana Memilih Foto',
        },
        {
          key: 'steps',
          label: 'Langkah Memilih',
          type: 'list',
          itemFields: [
            { key: 'num', label: 'Nomor Langkah', type: 'text', default: '' },
            { key: 'title', label: 'Judul Langkah', type: 'text', default: '' },
            { key: 'description', label: 'Deskripsi Langkah', type: 'textarea', default: '' },
          ],
          default: defaultClient.steps || [],
        },
      ],
    },
    {
      id: 'cta',
      label: '6. CTA Akhir Klien',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'cta_heading',
          label: 'Judul Ajakan',
          type: 'text',
          charLimit: 80,
          default: defaultClient.cta_heading || 'Ingin Mencoba Sensasi Memilih Foto yang Mudah?',
        },
        {
          key: 'cta_bottom_demo',
          label: 'Teks Tombol Coba Demo',
          type: 'text',
          charLimit: 40,
          default: defaultClient.cta_bottom_demo || 'Buka Galeri Simulasi Demo',
        },
      ],
    },
  ],
};
