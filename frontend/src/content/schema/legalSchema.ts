// src/content/schema/legalSchema.ts
import { PageSchema } from './types';

export const TERMS_PAGE_SCHEMA: PageSchema = {
  pageKey: 'terms',
  title: 'Syarat & Ketentuan',
  path: '/syarat-ketentuan',
  description: 'Halaman hukum ketentuan penggunaan layanan by.marryland.',
  sections: [
    {
      id: 'general',
      label: 'Judul & Pembaruan',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'title',
          label: 'Judul Halaman',
          type: 'text',
          charLimit: 80,
          default: 'Syarat dan Ketentuan',
        },
        {
          key: 'last_updated',
          label: 'Tanggal Terakhir Diperbarui',
          type: 'text',
          charLimit: 40,
          default: 'Oktober 2026',
        },
      ],
    },
    {
      id: 'clauses',
      label: 'Daftar Pasal',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'items',
          label: 'Pasal-pasal',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Judul Pasal', type: 'text', default: '' },
            { key: 'content', label: 'Isi Pasal', type: 'textarea', default: '' },
          ],
          default: [
            {
              title: '1. Definisi Layanan',
              content: 'by.marryland adalah platform seleksi foto digital yang dirancang untuk memudahkan fotografer dalam membagikan galeri foto kepada klien mereka.',
            },
            {
              title: '2. Akun Fotografer dan Tanggung Jawabnya',
              content: 'Sebagai fotografer yang menggunakan layanan kami, kamu bertanggung jawab atas keamanan akunmu dan seluruh aktivitas di bawahnya.',
            },
            {
              title: '3. Penggunaan Google Drive',
              content: 'Layanan kami terintegrasi dengan tautan folder Google Drive yang kamu sediakan. Platform hanya mengakses thumbnail tanpa memodifikasi file asli.',
            },
            {
              title: '4. Batas Tanggung Jawab',
              content: 'by.marryland tidak menyimpan file foto resolusi tinggi di server publik. Kami hanya memproses seleksi dan thumbnail.',
            },
          ],
        },
      ],
    },
  ],
};

export const PRIVACY_PAGE_SCHEMA: PageSchema = {
  pageKey: 'privacy',
  title: 'Kebijakan Privasi',
  path: '/kebijakan-privasi',
  description: 'Halaman hukum privasi data pengguna dan perlindungan informasi.',
  sections: [
    {
      id: 'general',
      label: 'Judul & Pembaruan',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'title',
          label: 'Judul Halaman',
          type: 'text',
          charLimit: 80,
          default: 'Kebijakan Privasi',
        },
        {
          key: 'last_updated',
          label: 'Tanggal Terakhir Diperbarui',
          type: 'text',
          charLimit: 40,
          default: 'Oktober 2026',
        },
      ],
    },
    {
      id: 'clauses',
      label: 'Daftar Klausul Privasi',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'items',
          label: 'Klausul-klausul Privasi',
          type: 'list',
          itemFields: [
            { key: 'title', label: 'Judul Klausul', type: 'text', default: '' },
            { key: 'content', label: 'Isi Klausul', type: 'textarea', default: '' },
          ],
          default: [
            {
              title: '1. Informasi yang Kami Kumpulkan',
              content: 'Kami mengumpulkan data akun saat registrasi (nama studio, email) serta metadata galeri yang kamu buat.',
            },
            {
              title: '2. Penggunaan Informasi',
              content: 'Informasi digunakan semata-mata untuk mengoperasikan sistem seleksi foto, menghubungkan klien dengan fotografer, dan menjaga keamanan sistem.',
            },
            {
              title: '3. Keamanan Data',
              content: 'Kami menerapkan standar keamanan enkripsi SSL dan otentikasi berbasis token untuk melindungi data akun fotografer.',
            },
          ],
        },
      ],
    },
  ],
};
