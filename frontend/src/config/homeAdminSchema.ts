export type FieldType = 'text' | 'textarea' | 'list' | 'object';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  fields?: FieldConfig[]; // for list or object
}

export interface SectionConfig {
  id: string;
  label: string;
  fields: FieldConfig[];
}

export const HOME_ADMIN_SCHEMA: SectionConfig[] = [
  {
    id: 'meta',
    label: 'SEO & Meta',
    fields: [
      { name: 'title', label: 'Judul Halaman (Title)', type: 'text' },
      { name: 'description', label: 'Deskripsi Singkat (Meta Description)', type: 'textarea' },
    ]
  },
  {
    id: 'nav',
    label: 'Navigasi',
    fields: [
      { name: 'logo_text', label: 'Teks Logo', type: 'text' },
      { name: 'cta_text', label: 'Teks Tombol Aksi', type: 'text' },
    ]
  },
  {
    id: 'hero',
    label: 'Hero (Bagian Atas)',
    fields: [
      { name: 'eyebrow', label: 'Label Kecil (Eyebrow)', type: 'text' },
      { name: 'promise', label: 'Janji Utama (Gunakan *kata* untuk aksen)', type: 'text' },
      { name: 'subheadline', label: 'Sub Judul (2 kalimat alur kerja)', type: 'textarea' },
      { name: 'cta_primary', label: 'Tombol Mulai', type: 'text' },
      { name: 'cta_demo', label: 'Tombol Contoh Galeri', type: 'text' },
      { name: 'cta_login', label: 'Tombol Masuk Dashboard', type: 'text' },
      {
        name: 'facts',
        label: 'Chip Fakta Terverifikasi',
        type: 'list',
        fields: [{ name: 'text', label: 'Teks Fakta', type: 'text' }]
      }
    ]
  },
  {
    id: 'marquee',
    label: 'Kolase Foto Infinite (Marquee)',
    fields: [
      { name: 'heading', label: 'Judul / Label Marquee', type: 'text' },
      { name: 'speed_row1', label: 'Kecepatan Baris 1 (detik, default 70)', type: 'text' },
      { name: 'speed_row2', label: 'Kecepatan Baris 2 (detik, default 90)', type: 'text' },
    ]
  },
  {
    id: 'facts',
    label: 'Strip Fakta Desain',
    fields: [
      { name: 'heading', label: 'Judul Strip Fakta', type: 'text' },
      {
        name: 'items',
        label: 'Daftar Fakta Desain',
        type: 'list',
        fields: [
          { name: 'title', label: 'Judul Fakta', type: 'text' },
          { name: 'description', label: 'Deskripsi Fakta', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'portfolio',
    label: 'Portofolio Beranda',
    fields: [
      { name: 'heading', label: 'Judul Bagian Portofolio', type: 'text' },
      { name: 'subheading', label: 'Pengantar / Subjudul', type: 'textarea' },
      { name: 'cta_text', label: 'Teks Tombol Semua Portofolio', type: 'text' },
      {
        name: 'categories',
        label: 'Kategori Portofolio',
        type: 'list',
        fields: [
          { name: 'name', label: 'Nama Kategori', type: 'text' },
          { name: 'slug', label: 'Slug URL (contoh: wedding)', type: 'text' },
          { name: 'description', label: 'Deskripsi Satu Baris', type: 'text' },
          { name: 'cover_url', label: 'URL Foto Sampul', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'problem',
    label: 'Masalah (Problem)',
    fields: [
      { name: 'heading', label: 'Judul Masalah', type: 'text' },
      { name: 'description', label: 'Deskripsi Singkat', type: 'textarea' },
      {
        name: 'chat_bubbles',
        label: 'Gelembung Chat WhatsApp',
        type: 'list',
        fields: [
          { name: 'sender', label: 'Pengirim (klien/fotografer)', type: 'text' },
          { name: 'text', label: 'Isi Pesan', type: 'textarea' }
        ]
      },
      { name: 'note', label: 'Catatan Status Bawah', type: 'text' }
    ]
  },
  {
    id: 'benefits',
    label: 'Manfaat Fitur (Benefits)',
    fields: [
      { name: 'heading', label: 'Judul Bagian', type: 'text' },
      {
        name: 'items',
        label: 'Daftar Manfaat',
        type: 'list',
        fields: [
          { name: 'icon', label: 'Ikon (Link, MousePointerClick, Timer, Save, Copy, UserMinus)', type: 'text' },
          { name: 'title', label: 'Judul Manfaat', type: 'text' },
          { name: 'description', label: 'Deskripsi', type: 'textarea' },
        ]
      },
    ]
  },
  {
    id: 'featured',
    label: 'Sorotan Foto (Featured)',
    fields: [
      { name: 'heading', label: 'Judul Sorotan', type: 'text' },
      { name: 'subheading', label: 'Subjudul Sorotan', type: 'textarea' },
      { name: 'cta_text', label: 'Teks Tombol Aksi', type: 'text' }
    ]
  },
  {
    id: 'demo',
    label: 'Contoh Langsung (Demo)',
    fields: [
      { name: 'heading', label: 'Judul Demo', type: 'text' },
      { name: 'description', label: 'Deskripsi Demo', type: 'textarea' },
      { name: 'demo_slug', label: 'Slug Demo (opsional)', type: 'text' },
      { name: 'cta_text', label: 'Teks Tombol Demo', type: 'text' }
    ]
  },
  {
    id: 'steps',
    label: 'Cara Kerja (Steps)',
    fields: [
      { name: 'heading', label: 'Judul Bagian', type: 'text' },
      { 
        name: 'items', 
        label: 'Langkah-langkah', 
        type: 'list',
        fields: [
          { name: 'title', label: 'Judul Langkah', type: 'text' },
          { name: 'description', label: 'Deskripsi', type: 'textarea' },
        ]
      },
    ]
  },
  {
    id: 'pricing',
    label: 'Harga (Pricing)',
    fields: [
      { name: 'heading', label: 'Judul Harga', type: 'text' },
      { name: 'description', label: 'Deskripsi Singkat', type: 'textarea' },
      {
        name: 'packages',
        label: 'Paket Harga',
        type: 'list',
        fields: [
          { name: 'name', label: 'Nama Paket', type: 'text' },
          { name: 'price', label: 'Harga', type: 'text' },
          { name: 'visible', label: 'Tampilkan Paket? (true/false)', type: 'text' },
          { name: 'features', label: 'Fitur (pisahkan dengan koma)', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'faq',
    label: 'FAQ',
    fields: [
      { name: 'heading', label: 'Judul Bagian', type: 'text' },
      { 
        name: 'items', 
        label: 'Daftar FAQ', 
        type: 'list',
        fields: [
          { name: 'group', label: 'Grup (Untuk Fotografer / Untuk Klien)', type: 'text' },
          { name: 'question', label: 'Pertanyaan', type: 'text' },
          { name: 'answer', label: 'Jawaban', type: 'textarea' },
        ]
      },
    ]
  },
  {
    id: 'cta',
    label: 'CTA Bawah (Ajakan Akhir)',
    fields: [
      { name: 'heading', label: 'Judul Ajakan', type: 'text' },
      { name: 'subheading', label: 'Subjudul Ajakan', type: 'textarea' },
      { name: 'cta_primary', label: 'Tombol Mulai', type: 'text' },
      { name: 'cta_secondary', label: 'Tombol Kedua', type: 'text' }
    ]
  },
  {
    id: 'clientPage',
    label: 'Halaman Klien (/untuk-klien)',
    fields: [
      { name: 'meta_title', label: 'Judul Halaman (SEO Title)', type: 'text' },
      { name: 'meta_description', label: 'Deskripsi Singkat (SEO Meta)', type: 'textarea' },
      { name: 'hero_eyebrow', label: 'Label Kecil (Eyebrow)', type: 'text' },
      { name: 'hero_heading', label: 'Judul Hero (Maks. 1 kata *aksen*)', type: 'text' },
      { name: 'hero_sub', label: 'Subjudul Hero (2 kalimat)', type: 'textarea' },
      { name: 'cta_demo', label: 'Teks Tombol Demo', type: 'text' },
      { name: 'cta_steps', label: 'Teks Tombol Alur', type: 'text' },
      { name: 'link_box_title', label: 'Judul Kotak Cek Link', type: 'text' },
      { name: 'link_box_placeholder', label: 'Placeholder Input Link', type: 'text' },
      { name: 'link_box_btn', label: 'Teks Tombol Buka Galeri', type: 'text' },
      { name: 'problem_heading', label: 'Judul Masalah', type: 'text' },
      { name: 'problem_desc', label: 'Deskripsi Masalah', type: 'textarea' },
      {
        name: 'problem_files',
        label: 'Contoh Daftar File (Ilustrasi)',
        type: 'list',
        fields: [
          { name: 'name', label: 'Nama File', type: 'text' },
          { name: 'size', label: 'Ukuran File', type: 'text' },
          { name: 'date', label: 'Keterangan Waktu', type: 'text' }
        ]
      },
      { name: 'benefits_heading', label: 'Judul Bagian Manfaat', type: 'text' },
      { 
        name: 'benefits', 
        label: 'Daftar Manfaat Klien (Maks. 6)', 
        type: 'list',
        fields: [
          { name: 'num', label: 'Nomor (01, 02..)', type: 'text' },
          { name: 'title', label: 'Judul Manfaat', type: 'text' },
          { name: 'description', label: 'Deskripsi', type: 'textarea' }
        ]
      },
      { name: 'demo_heading', label: 'Judul Coba Langsung', type: 'text' },
      { name: 'demo_desc', label: 'Deskripsi Demo', type: 'textarea' },
      { name: 'demo_sample_folder', label: 'URL Folder GDrive Contoh (Opsional)', type: 'text' },
      { name: 'demo_note', label: 'Catatan Privasi Demo', type: 'text' },
      { name: 'situations_heading', label: 'Judul Situasi Pemakaian', type: 'text' },
      {
        name: 'situations',
        label: 'Daftar Situasi Pemakaian (3 Foto)',
        type: 'list',
        fields: [
          { name: 'title', label: 'Judul Situasi', type: 'text' },
          { name: 'caption', label: 'Caption Fakta Terbukti', type: 'textarea' },
          { name: 'image_url', label: 'URL Foto', type: 'text' }
        ]
      },
      { name: 'steps_heading', label: 'Judul Cara Memilih', type: 'text' },
      {
        name: 'steps',
        label: 'Langkah Memilih Foto',
        type: 'list',
        fields: [
          { name: 'num', label: 'Nomor Langkah (01, 02..)', type: 'text' },
          { name: 'title', label: 'Judul Langkah', type: 'text' },
          { name: 'description', label: 'Deskripsi Langkah', type: 'textarea' },
          { name: 'image_url', label: 'URL Screenshot/Foto', type: 'text' }
        ]
      },
      { name: 'cta_heading', label: 'Judul CTA Akhir', type: 'text' },
      { name: 'cta_bottom_demo', label: 'Teks Tombol Demo CTA', type: 'text' },
      { name: 'cta_photographer_text', label: 'Teks Tautan Fotografer', type: 'text' }
    ]
  },
  {
    id: 'contact',
    label: 'Kontak',
    fields: [
      { name: 'heading', label: 'Judul Bagian', type: 'text' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'whatsapp', label: 'Nomor WhatsApp', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'instagram', label: 'Username Instagram', type: 'text' },
      { name: 'address', label: 'Alamat (Opsional)', type: 'textarea' },
      { name: 'hours', label: 'Jam Operasional (Opsional)', type: 'text' }
    ]
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: [
      { name: 'text', label: 'Teks Hak Cipta', type: 'text' },
    ]
  }
];
