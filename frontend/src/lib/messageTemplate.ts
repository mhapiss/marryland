// src/lib/messageTemplate.ts

export interface MessageVariables {
  nama_klien: string;
  nama_galeri: string;
  nama_fotografer: string;
  nama_studio: string;
  link_pilih: string;
  link_album: string;
  batas_pilihan: string;
  batas_waktu: string;
}

export const TEMPLATE_VARIABLES = [
  { key: '{nama_klien}', label: 'Nama Klien', desc: 'Nama pengantin / klien' },
  { key: '{nama_galeri}', label: 'Nama Galeri', desc: 'Judul album / galeri' },
  { key: '{nama_fotografer}', label: 'Nama Fotografer', desc: 'Nama lengkap fotografer' },
  { key: '{nama_studio}', label: 'Nama Studio', desc: 'Nama usaha fotografi' },
  { key: '{link_pilih}', label: 'Tautan Pilih', desc: 'Tautan pemilihan foto klien' },
  { key: '{link_album}', label: 'Tautan Album', desc: 'Tautan album keluarga' },
  { key: '{batas_pilihan}', label: 'Batas Pilihan', desc: 'Jumlah maksimal foto' },
  { key: '{batas_waktu}', label: 'Batas Waktu', desc: 'Tanggal tenggat kurasi' },
];

export const DEFAULT_MAIN_TEMPLATE =
  'Halo {nama_klien}, selamat atas momen bahagianya! Galeri foto dokumentasi dari {nama_studio} sudah siap untuk kamu lihat.\n\nSilakan pilih maksimal {batas_pilihan} foto terbaik yang ingin diproses edit melalui tautan kurasi berikut:\n{link_pilih}\n\nTenggat waktu pemilihan: {batas_waktu}.\nSetiap foto yang kamu pilih langsung tersimpan otomatis secara realtime.';

export const DEFAULT_ALBUM_SECTION =
  'Bagi keluarga dan kerabat terdekat yang ingin melihat seluruh dokumentasi kenangan hari bahagia, silakan buka album keluarga di tautan berikut:\n{link_album}';

/**
 * Replace placeholders in template text with actual variables
 */
export function formatClientMessage(
  mainTemplate: string,
  albumTemplate: string,
  vars: MessageVariables,
  isAlbumEnabled: boolean
): string {
  let message = mainTemplate || DEFAULT_MAIN_TEMPLATE;

  if (isAlbumEnabled && albumTemplate) {
    message = `${message.trim()}\n\n${albumTemplate.trim()}`;
  }

  // Replace each supported variable
  Object.entries(vars).forEach(([key, val]) => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(placeholder, val || '');
  });

  return message.trim();
}

/**
 * Validate template text for unknown variables or missing required placeholders
 */
export function validateTemplate(text: string, isAlbumPart: boolean = false): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const allowedKeys = new Set(TEMPLATE_VARIABLES.map((v) => v.key));

  // Find all {variables} in text
  const found = text.match(/\{[a-zA-Z0-9_]+\}/g) || [];
  for (const f of found) {
    if (!allowedKeys.has(f)) {
      warnings.push(`Variabel tidak dikenal: ${f}`);
    }
  }

  if (!isAlbumPart && !text.includes('{link_pilih}')) {
    warnings.push('Pesan utama wajib memuat variabel {link_pilih}.');
  }

  if (isAlbumPart && text.trim() && !text.includes('{link_album}')) {
    warnings.push('Bagian album wajib memuat variabel {link_album}.');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
