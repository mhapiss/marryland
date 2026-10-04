// src/config/portfolioThemes.ts

export type ThemePaletteKey = 'merah-vintage' | 'marun-tua' | 'hijau-botol' | 'arang' | 'biru-malam' | 'marun' | 'kunyit';
export type ThemeFontKey = 'gloock' | 'instrument' | 'bodoni' | 'newsreader' | 'fraunces' | 'default' | 'editorial' | 'classic';

export interface ThemePalette {
  name: string;
  paper: string;
  mutedPaper: string;
  ink: string;
  inkMuted: string;
  dark: string;
  darkText: string;
  accent: string;
  accentHover?: string;
  marker?: string;
  border: string;
}

export const PORTFOLIO_PALETTES: Record<ThemePaletteKey, ThemePalette> = {
  'merah-vintage': {
    name: 'Merah Vintage (Khas by.marryland)',
    paper: '#F3EADB',
    mutedPaper: '#E8DCC8',
    ink: '#2B1815',
    inkMuted: '#5A433D',
    dark: '#3A0F0D',
    darkText: '#F3EADB',
    accent: '#9B2C24',
    accentHover: '#7E211B',
    marker: '#C93A2E',
    border: 'rgba(43, 24, 21, 0.18)',
  },
  'marun-tua': {
    name: 'Marun Tua',
    paper: '#FAF7F5',
    mutedPaper: '#F3ECE8',
    ink: '#201515',
    inkMuted: '#614F4F',
    dark: '#4A151B',
    darkText: '#FAF7F5',
    accent: '#9B2C24',
    accentHover: '#7E211B',
    marker: '#C93A2E',
    border: 'rgba(74, 21, 27, 0.18)',
  },
  marun: {
    name: 'Marun Tua (Legacy)',
    paper: '#FAF7F5',
    mutedPaper: '#F3ECE8',
    ink: '#201515',
    inkMuted: '#614F4F',
    dark: '#4A151B',
    darkText: '#FAF7F5',
    accent: '#9B2C24',
    accentHover: '#7E211B',
    marker: '#C93A2E',
    border: 'rgba(74, 21, 27, 0.18)',
  },
  'hijau-botol': {
    name: 'Hijau Botol',
    paper: '#F9F8F4',
    mutedPaper: '#F1EFE9',
    ink: '#1A1D1A',
    inkMuted: '#555B54',
    dark: '#1A3620',
    darkText: '#F9F8F4',
    accent: '#2D5A37',
    marker: '#C93A2E',
    border: 'rgba(26, 54, 32, 0.18)',
  },
  arang: {
    name: 'Arang Monokrom',
    paper: '#F8F8F8',
    mutedPaper: '#EFEFEF',
    ink: '#181818',
    inkMuted: '#555555',
    dark: '#222222',
    darkText: '#F8F8F8',
    accent: '#555555',
    marker: '#C93A2E',
    border: 'rgba(34, 34, 34, 0.18)',
  },
  'biru-malam': {
    name: 'Biru Malam',
    paper: '#F6F8FA',
    mutedPaper: '#EBF0F5',
    ink: '#111622',
    inkMuted: '#4B5565',
    dark: '#14213D',
    darkText: '#F6F8FA',
    accent: '#1D3557',
    marker: '#C93A2E',
    border: 'rgba(20, 33, 61, 0.18)',
  },
  kunyit: {
    name: 'Kunyit & Rempah',
    paper: '#FDFBF7',
    mutedPaper: '#F7F2E7',
    ink: '#261E14',
    inkMuted: '#655745',
    dark: '#3E2F1C',
    darkText: '#FDFBF7',
    accent: '#9B2C24',
    marker: '#C93A2E',
    border: 'rgba(62, 47, 28, 0.18)',
  },
};

export interface PortfolioCollection {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  status: 'draft' | 'published';
  theme_palette: ThemePaletteKey;
  theme_font: ThemeFontKey;
  layout: {
    hero_side?: 'left' | 'right';
    collage_variant?: 'A' | 'B';
    event_cards_staggered?: boolean;
    section_order?: string[];
  };
  content: {
    hero_eyebrow?: string;
    hero_heading?: string;
    hero_subheading?: string;
    about_eyebrow?: string;
    about_heading?: string;
    about_description?: string;
    highlight_eyebrow?: string;
    highlight_heading?: string;
    testimonials?: Array<{
      quote: string;
      couple_names: string;
      event_date?: string;
      image_url?: string;
    }>;
    cta_heading?: string;
    cta_subheading?: string;
    wa_message_template?: string;
  };
  cover_url?: string;
  position?: number;
  created_at?: string;
}

export interface EventType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  position?: number;
}

export interface PortfolioPhotoItem {
  id: string;
  image_url: string;
  storage_path?: string;
  caption?: string | null;
  alt?: string | null;
  category?: string;
  collection_id?: string | null;
  event_type_id?: string | null;
  event_type_slug?: string;
  slot?: 'hero' | 'about_1' | 'about_2' | 'about_3' | 'highlight' | 'gallery' | 'event_cover';
  order_index?: number;
  is_published?: boolean;
  width?: number;
  height?: number;
  focal?: string;
  blur_data?: string;
  created_at?: string;
}

export const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: 'ev-1', slug: 'lamaran', name: 'Lamaran', description: 'Pertemuan dua keluarga dan sematan ikatan pertunangan.', position: 1 },
  { id: 'ev-2', slug: 'akad', name: 'Akad Nikah', description: 'Janji suci dan ijab kabul penuh khidmat di hadapan saksi.', position: 2 },
  { id: 'ev-3', slug: 'pemberkatan', name: 'Pemberkatan', description: 'Upacara sakral dan doa restu di hadapan keluarga terdekat.', position: 3 },
  { id: 'ev-4', slug: 'resepsi', name: 'Resepsi', description: 'Perayaan kebahagiaan bersama sanak saudara dan handai tolan.', position: 4 },
  { id: 'ev-5', slug: 'siraman', name: 'Siraman / Adat', description: 'Prosesi ritual adat pembersihan diri sebelum hari bahagia.', position: 5 },
  { id: 'ev-6', slug: 'wisuda', name: 'Wisuda', description: 'Perayaan kelulusan dan dedikasi membanggakan bagi keluarga.', position: 6 },
];

export const DEFAULT_COLLECTIONS: PortfolioCollection[] = [
  {
    id: 'col-melayu',
    slug: 'melayu',
    name: 'Melayu',
    short_description: 'Rangkaian dokumentasi pernikahan dan perhelatan bernuansa Melayu yang terekam secara elegan.',
    status: 'published',
    theme_palette: 'hijau-botol',
    theme_font: 'editorial',
    position: 1,
    cover_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    layout: {
      hero_side: 'left',
      collage_variant: 'A',
      event_cards_staggered: true,
    },
    content: {
      hero_eyebrow: 'Koleksi Dokumentasi',
      hero_heading: 'Dokumentasi Pernikahan Adat Melayu',
      hero_subheading: 'Tangkapan visual otentik yang mengabadikan setiap tata rias, busana, dan jalinan kasih keluarga.',
      about_eyebrow: 'Tentang Koleksi',
      about_heading: 'Kemegahan Halus dalam Sentuhan Tenun & Adat',
      about_description: 'Setiap prosesi diperlakukan dengan penghormatan mendalam pada ritme acara. Dari persiapan busana hingga perhelatan bersama keluarga besar, seluruh memori terekam dengan pendekatan editorial yang tenang.',
      highlight_eyebrow: 'Momen Sorotan',
      highlight_heading: 'Detail Ornamen dan Emosi Murni',
      cta_heading: 'Rencanakan Dokumentasi Hari Bahagiamu',
      cta_subheading: 'Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.',
      wa_message_template: 'Halo by.marryland, saya tertarik dengan dokumentasi adat Melayu. Boleh info jadwal dan paket yang tersedia?',
    },
  },
  {
    id: 'col-batak',
    slug: 'batak',
    name: 'Batak',
    short_description: 'Dokumentasi prosesi adat Batak yang penuh wibawa, kehangatan ulos, dan sukacita keluarga.',
    status: 'published',
    theme_palette: 'marun',
    theme_font: 'default',
    position: 2,
    cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    layout: {
      hero_side: 'right',
      collage_variant: 'B',
      event_cards_staggered: true,
    },
    content: {
      hero_eyebrow: 'Koleksi Dokumentasi',
      hero_heading: 'Dokumentasi Pernikahan Adat Batak',
      hero_subheading: 'Mengabadikan energi sakral mangulosi, tatap bangga orang tua, serta tawa riang sanak keluarga.',
      about_eyebrow: 'Tentang Koleksi',
      about_heading: 'Kehangatan Ulos & Sukacita Persaudaraan',
      about_description: 'Rangkaian pesta adat Batak berlangsung dinamis dan kaya simbol persaudaraan. Kami hadir mengabadikan setiap gerak tortor dan petuah tetua adat tanpa menginterupsi jalannya ritual.',
      highlight_eyebrow: 'Momen Sorotan',
      highlight_heading: 'Ketegasan Wajah dan Gelak Tawa Keluarga',
      cta_heading: 'Rencanakan Dokumentasi Hari Bahagiamu',
      cta_subheading: 'Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.',
      wa_message_template: 'Halo by.marryland, saya tertarik dengan dokumentasi adat Batak. Boleh info jadwal dan paket yang tersedia?',
    },
  },
  {
    id: 'col-minang',
    slug: 'minang',
    name: 'Minang',
    short_description: 'Keanggunan busana suntiang dan baralek gadang dalam bingkai visual sinematik nan abadi.',
    status: 'published',
    theme_palette: 'kunyit',
    theme_font: 'editorial',
    position: 3,
    cover_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    layout: {
      hero_side: 'left',
      collage_variant: 'A',
      event_cards_staggered: true,
    },
    content: {
      hero_eyebrow: 'Koleksi Dokumentasi',
      hero_heading: 'Dokumentasi Pernikahan Adat Minang',
      hero_subheading: 'Semarak baralek gadang dengan kilau suntiang megah dan doa restu para bundo kanduang.',
      about_eyebrow: 'Tentang Koleksi',
      about_heading: 'Kemilau Emas Suntiang & Semarak Baralek',
      about_description: 'Kilau mahkota suntiang dan balutan beludru merah keemasan menghadirkan nuansa visual yang sangat megah. Kami memadukan komposisi klasik dengan sudut pandang candid untuk menghidupkan kenangan.',
      highlight_eyebrow: 'Momen Sorotan',
      highlight_heading: 'Dua Insan dalam Kemegahan Tradisi Luhur',
      cta_heading: 'Rencanakan Dokumentasi Hari Bahagiamu',
      cta_subheading: 'Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.',
      wa_message_template: 'Halo by.marryland, saya tertarik dengan dokumentasi adat Minang. Boleh info jadwal dan paket yang tersedia?',
    },
  },
];

// Fallback sample photos per collection
export const DEFAULT_COLLECTION_PHOTOS: Record<string, PortfolioPhotoItem[]> = {
  melayu: [
    {
      id: 'm-hero',
      image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      caption: 'Busana tenun berpadu selaras dalam prosesi akad',
      slot: 'hero',
      event_type_slug: 'akad',
      width: 800,
      height: 1100,
    },
    {
      id: 'm-ab1',
      image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
      caption: 'Persiapan tata rias mempelai wanita',
      slot: 'about_1',
      event_type_slug: 'akad',
      width: 800,
      height: 1200,
    },
    {
      id: 'm-ab2',
      image_url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
      caption: 'Detail cincin dan tepak sirih',
      slot: 'about_2',
      event_type_slug: 'lamaran',
      width: 900,
      height: 1200,
    },
    {
      id: 'm-ab3',
      image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80',
      caption: 'Penyambutan tamu perhelatan malam',
      slot: 'about_3',
      event_type_slug: 'resepsi',
      width: 1200,
      height: 800,
    },
    {
      id: 'm-hl1',
      image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
      caption: 'Pancaran cahaya pagi menjelang ijab kabul',
      slot: 'highlight',
      event_type_slug: 'akad',
      width: 800,
      height: 1200,
    },
    {
      id: 'm-hl2',
      image_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
      caption: 'Pelukan haru ayah melepaskan putrinya',
      slot: 'highlight',
      event_type_slug: 'akad',
      width: 800,
      height: 1200,
    },
    {
      id: 'm-hl3',
      image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      caption: 'Potret berdua di selasar pelaminan',
      slot: 'highlight',
      event_type_slug: 'resepsi',
      width: 800,
      height: 1200,
    },
    {
      id: 'm-g1',
      image_url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80',
      caption: 'Canda tawa di sela jamuan keluarga',
      slot: 'gallery',
      event_type_slug: 'resepsi',
      width: 1200,
      height: 800,
    },
  ],
  batak: [
    {
      id: 'b-hero',
      image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      caption: 'Langkah mantap memasuki gedung adat',
      slot: 'hero',
      event_type_slug: 'resepsi',
      width: 800,
      height: 1200,
    },
    {
      id: 'b-ab1',
      image_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80',
      caption: 'Ulos ragi hotang disematkan dengan doa restu',
      slot: 'about_1',
      event_type_slug: 'resepsi',
      width: 800,
      height: 1200,
    },
    {
      id: 'b-ab2',
      image_url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
      caption: 'Detail tenun ulos dan perhiasan adat',
      slot: 'about_2',
      event_type_slug: 'resepsi',
      width: 900,
      height: 1200,
    },
    {
      id: 'b-ab3',
      image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80',
      caption: 'Semangat tortor bersama para raja adat',
      slot: 'about_3',
      event_type_slug: 'resepsi',
      width: 1200,
      height: 800,
    },
    {
      id: 'b-hl1',
      image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      caption: 'Pemberkatan suci di gereja',
      slot: 'highlight',
      event_type_slug: 'pemberkatan',
      width: 1000,
      height: 1000,
    },
  ],
  minang: [
    {
      id: 'min-hero',
      image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kemegahan busana beludru dan suntiang bertingkat',
      slot: 'hero',
      event_type_slug: 'resepsi',
      width: 1000,
      height: 1000,
    },
    {
      id: 'min-ab1',
      image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80',
      caption: 'Pemasangan suntiang dengan ketelitian tinggi',
      slot: 'about_1',
      event_type_slug: 'resepsi',
      width: 800,
      height: 1100,
    },
    {
      id: 'min-ab2',
      image_url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
      caption: 'Sirih carano dan perhiasan dukuh panyaram',
      slot: 'about_2',
      event_type_slug: 'lamaran',
      width: 900,
      height: 1200,
    },
    {
      id: 'min-ab3',
      image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80',
      caption: 'Arak-arakan marapulai dan anak daro',
      slot: 'about_3',
      event_type_slug: 'resepsi',
      width: 1200,
      height: 800,
    },
  ],
};
