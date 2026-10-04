// src/content/schema/types.ts

export type FieldInputType = 'text' | 'textarea' | 'number' | 'boolean' | 'list' | 'select';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldInputType;
  charLimit?: number;
  description?: string;
  default: any;
  options?: Array<{ label: string; value: string }>; // for select
  itemFields?: FieldSchema[]; // for list
}

export interface PhotoSlotSchema {
  key: string;
  label: string;
  description?: string;
  suggestedAspect: '3:4' | '4:3' | '1:1' | '16:9' | 'free';
  suggestedDimensions?: string;
  minCount: number;
  maxCount: number;
  defaultPhotos?: Array<{
    url: string;
    alt?: string;
    caption?: string;
    focal?: string;
  }>;
}

export interface SectionSchema {
  id: string;
  label: string;
  description?: string;
  allowToggleVisibility?: boolean;
  defaultVisible?: boolean;
  fields: FieldSchema[];
  photoSlots?: PhotoSlotSchema[];
}

export interface PageSchema {
  pageKey: string;
  title: string;
  path: string;
  description: string;
  sections: SectionSchema[];
}

export interface MediaRef {
  media_id?: string;
  url?: string;
  base_path?: string;
  alt?: string;
  caption?: string;
  focal?: 'top left' | 'top center' | 'top right' | 'center left' | 'center' | 'center right' | 'bottom left' | 'bottom center' | 'bottom right' | string;
  position?: number;
  width?: number;
  height?: number;
}

export interface MediaAsset {
  id: string;
  base_path: string;
  widths: number[];
  width: number;
  height: number;
  blur_data?: string | null;
  default_alt?: string | null;
  default_focal?: string;
  size_bytes: number;
  created_at?: string;
  uploaded_by?: string | null;
  usage_count?: number;
  usages?: Array<{
    page_key: string;
    section_id: string;
    slot_key: string;
  }>;
}

export interface SiteSettingsData {
  brand_name: string;
  tagline: string;
  whatsapp_number: string;
  email: string;
  instagram: string;
  default_wa_template: string;
  seo_default_title: string;
  seo_default_description: string;
  footer_statement: string;
  default_palette: string;
  default_font: string;
  photo_frame_style?: 'none' | 'print';
  logo_url?: string;
  nav_items: Array<{
    label: string;
    href: string;
    visible?: boolean;
  }>;
}
