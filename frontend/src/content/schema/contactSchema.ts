// src/content/schema/contactSchema.ts
import { PageSchema } from './types';
import { HOME_DEFAULTS } from '../../config/homeDefaults';

export const CONTACT_PAGE_SCHEMA: PageSchema = {
  pageKey: 'contact',
  title: 'Halaman Kontak',
  path: '/kontak',
  description: 'Halaman informasi saluran komunikasi, alamat, jam operasional, dan formulir kirim pesan cepat.',
  sections: [
    {
      id: 'header',
      label: '1. Header Kontak',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'heading',
          label: 'Judul Halaman',
          type: 'text',
          charLimit: 60,
          default: HOME_DEFAULTS.contact.heading || 'Hubungi Kami',
        },
        {
          key: 'description',
          label: 'Deskripsi Singkat',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.contact.description || 'Punya pertanyaan, kendala, atau ingin mendiskusikan dokumentasi acara? Kami siap membantu.',
        },
      ],
    },
    {
      id: 'location',
      label: '2. Lokasi & Jam Operasional (Opsional)',
      allowToggleVisibility: true,
      defaultVisible: true,
      fields: [
        {
          key: 'address',
          label: 'Alamat Studio',
          type: 'textarea',
          charLimit: 200,
          default: HOME_DEFAULTS.contact.address || '',
        },
        {
          key: 'hours',
          label: 'Jam Operasional',
          type: 'text',
          charLimit: 80,
          default: HOME_DEFAULTS.contact.hours || 'Senin - Sabtu: 09.00 - 18.00 WIB',
        },
      ],
    },
  ],
};
