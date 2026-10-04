// src/content/schema/faqSchema.ts
import { PageSchema } from './types';
import { HOME_DEFAULTS } from '../../config/homeDefaults';

export const FAQ_PAGE_SCHEMA: PageSchema = {
  pageKey: 'faq',
  title: 'Halaman FAQ',
  path: '/faq',
  description: 'Halaman tanya jawab terperinci untuk fotografer dan klien.',
  sections: [
    {
      id: 'header',
      label: '1. Header Halaman',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'heading',
          label: 'Judul Utama',
          type: 'text',
          charLimit: 60,
          default: 'Pertanyaan Umum',
        },
        {
          key: 'subheading',
          label: 'Subjudul Pengantar',
          type: 'textarea',
          charLimit: 200,
          default: 'Temukan jawaban untuk pertanyaan yang sering diajukan seputar penggunaan by.marryland.',
        },
      ],
    },
    {
      id: 'faq_list',
      label: '2. Daftar Tanya Jawab',
      allowToggleVisibility: false,
      fields: [
        {
          key: 'items',
          label: 'Daftar FAQ',
          type: 'list',
          itemFields: [
            { key: 'group', label: 'Grup (Untuk Fotografer / Untuk Klien)', type: 'text', default: 'Untuk Fotografer' },
            { key: 'question', label: 'Pertanyaan', type: 'text', default: '' },
            { key: 'answer', label: 'Jawaban', type: 'textarea', default: '' },
          ],
          default: HOME_DEFAULTS.faq.items,
        },
      ],
    },
  ],
};
