// src/lib/drive.ts
import { supabase } from './supabaseClient';

// Character set for high-entropy URL-safe identifiers (excluding ambiguous characters 0, O, 1, l, I)
const SAFE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generate a cryptographically strong, URL-safe random string
 */
export function generateSafeRandomString(length: number = 8): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }
  return result;
}

/**
 * Generate a 128-bit URL-safe token for Family Album access
 */
export function generateAlbumToken(): string {
  const bytes = new Uint8Array(16); // 128-bit
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate clean, unpredictable slug: {name-cleaned}-{random8}
 */
export function generateUniqueSlug(name: string): string {
  const base = (name || 'galeri')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const suffix = generateSafeRandomString(8);
  return `${base || 'galeri'}-${suffix}`;
}

/**
 * Normalize Indonesian WhatsApp phone numbers to international standard (628xxx)
 */
export function normalizeWhatsApp(phone: string): { isValid: boolean; normalized: string; message?: string } {
  if (!phone) return { isValid: false, normalized: '', message: 'Nomor WhatsApp wajib diisi.' };

  // Remove non-digit characters
  let digits = phone.replace(/[^0-9]/g, '');

  // Convert 08xx to 628xx
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }

  // Validate length (standard Indonesian numbers are 10 to 14 digits)
  if (digits.length < 10 || digits.length > 15) {
    return {
      isValid: false,
      normalized: digits,
      message: 'Nomor WhatsApp tidak valid (harus 10 - 15 digit).',
    };
  }

  if (!digits.startsWith('628')) {
    return {
      isValid: false,
      normalized: digits,
      message: 'Nomor WhatsApp harus berawalan 08 atau +628.',
    };
  }

  return { isValid: true, normalized: digits };
}

/**
 * Extract folder ID from various Google Drive URL formats
 */
export function parseDriveFolder(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const trimmed = url.trim();
    // Direct ID check (Google Drive folder IDs are typically 28-33 alphanumeric/underscore characters)
    if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
      return trimmed;
    }

    const parsedUrl = new URL(trimmed);

    // Format 1: https://drive.google.com/drive/folders/ID or /drive/u/0/folders/ID
    if (parsedUrl.pathname.includes('/folders/')) {
      const parts = parsedUrl.pathname.split('/');
      const index = parts.indexOf('folders');
      if (index !== -1 && parts[index + 1]) {
        return parts[index + 1].split('?')[0];
      }
    }

    // Format 2: https://drive.google.com/open?id=ID
    const idParam = parsedUrl.searchParams.get('id');
    if (idParam) {
      return idParam;
    }

    return null;
  } catch {
    return null;
  }
}

export type DriveVerifyError =
  | 'OFFLINE'
  | 'INVALID_URL'
  | 'PRIVATE_OR_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'EMPTY_FOLDER'
  | 'UNKNOWN';

export interface VerifyFolderResult {
  ok: boolean;
  folderId?: string;
  folderName?: string;
  errorType?: DriveVerifyError;
  message?: string;
}

/**
 * Pre-flight verification for Google Drive folder access
 */
export async function verifyDriveFolder(url: string, apiKey: string): Promise<VerifyFolderResult> {
  if (!navigator.onLine) {
    return {
      ok: false,
      errorType: 'OFFLINE',
      message: 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.',
    };
  }

  const folderId = parseDriveFolder(url);
  if (!folderId) {
    return {
      ok: false,
      errorType: 'INVALID_URL',
      message: 'Format tautan Google Drive tidak valid. Pastikan Anda menyalin link dari folder Drive.',
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      errorType: 'UNKNOWN',
      message: 'API Key Google Drive belum dikonfigurasi pada sistem.',
    };
  }

  try {
    const folderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=id,name,mimeType,trashed`
    );

    if (!folderRes.ok) {
      if (folderRes.status === 403 || folderRes.status === 404) {
        return {
          ok: false,
          errorType: 'PRIVATE_OR_NOT_FOUND',
          message:
            'Folder belum bisa diakses. Pastikan izin berbagi di Google Drive sudah diatur ke "Siapa saja yang memiliki link" (Anyone with the link).',
        };
      }
      if (folderRes.status === 429) {
        return {
          ok: false,
          errorType: 'RATE_LIMITED',
          message: 'Batas kuota akses Google Drive tercapai sementara. Tunggu beberapa saat lalu coba lagi.',
        };
      }
      return {
        ok: false,
        errorType: 'UNKNOWN',
        message: `Google Drive merespons dengan status ${folderRes.status}. Coba beberapa saat lagi.`,
      };
    }

    const folderData = await folderRes.json();
    if (folderData.trashed) {
      return {
        ok: false,
        errorType: 'PRIVATE_OR_NOT_FOUND',
        message: 'Folder ini berada di dalam Sampah (Trash) Google Drive.',
      };
    }

    if (folderData.mimeType !== 'application/vnd.google-apps.folder') {
      return {
        ok: false,
        errorType: 'INVALID_URL',
        message: 'Tautan yang dimasukkan adalah file tunggal, bukan folder Google Drive.',
      };
    }

    return {
      ok: true,
      folderId,
      folderName: folderData.name || 'Folder Klien',
    };
  } catch (err: any) {
    return {
      ok: false,
      errorType: 'UNKNOWN',
      message: err.message || 'Gagal menghubungi server Google Drive. Periksa koneksi Anda.',
    };
  }
}

/**
 * Natural filename sorting (e.g. IMG_2 before IMG_10)
 */
export function naturalSortFiles<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export interface DriveFetchResult {
  files: any[];
  skippedCount: number;
  totalFound: number;
}

/**
 * Fetch all image files from a Google Drive folder following pagination
 */
export async function fetchAllDriveImages(
  folderId: string,
  apiKey: string,
  onProgress?: (count: number) => void
): Promise<DriveFetchResult> {
  let allFiles: any[] = [];
  let pageToken = '';
  let skippedCount = 0;

  do {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime,imageMediaMetadata)&pageSize=1000${
      pageToken ? `&pageToken=${pageToken}` : ''
    }`;

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Batas kuota akses Google Drive tercapai sementara. Tunggu sebentar lalu coba lagi.');
      }
      throw new Error(`Gagal mengambil daftar foto dari Google Drive (Status ${res.status}).`);
    }

    const data = await res.json();
    if (data.files && Array.isArray(data.files)) {
      for (const f of data.files) {
        // Filter: only image files, skip subfolders and non-images
        if (f.mimeType && f.mimeType.startsWith('image/')) {
          allFiles.push(f);
        } else {
          skippedCount++;
        }
      }
    }

    if (onProgress) {
      onProgress(allFiles.length);
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  // Apply natural sort on filename
  const sortedFiles = naturalSortFiles(allFiles);

  return {
    files: sortedFiles,
    skippedCount,
    totalFound: allFiles.length,
  };
}

/**
 * Rescan an existing Google Drive folder:
 * - Adds newly discovered photos
 * - Preserves existing selections
 * - Marks deleted Drive photos as `is_missing: true`
 */
export async function rescanDriveFolder(
  galleryId: string,
  folderId: string,
  apiKey: string
): Promise<{ addedCount: number; missingCount: number; totalCount: number }> {
  // 1. Fetch latest photos from Drive
  const driveResult = await fetchAllDriveImages(folderId, apiKey);
  const driveFiles = driveResult.files;
  const driveFileIds = new Set(driveFiles.map((f) => f.id));

  // 2. Fetch existing photos from DB
  const { data: existingPhotos, error: fetchErr } = await supabase
    .from('gallery_photos')
    .select('id, gdrive_file_id, is_missing')
    .eq('gallery_id', galleryId);

  if (fetchErr) throw fetchErr;

  const existingMap = new Map((existingPhotos || []).map((p) => [p.gdrive_file_id, p]));

  // 3. Identify new photos to insert
  const photosToInsert: any[] = [];
  let nextOrder = (existingPhotos || []).length + 1;

  for (const df of driveFiles) {
    if (!existingMap.has(df.id)) {
      const thumbUrl = df.thumbnailLink
        ? df.thumbnailLink.replace(/=s\d+/, '=w800')
        : `https://drive.google.com/thumbnail?id=${df.id}&sz=w800`;

      photosToInsert.push({
        gallery_id: galleryId,
        gdrive_file_id: df.id,
        filename: df.name,
        thumbnail_url: thumbUrl,
        order_index: nextOrder++,
        is_missing: false,
        width: df.imageMediaMetadata?.width ? parseInt(df.imageMediaMetadata.width, 10) : null,
        height: df.imageMediaMetadata?.height ? parseInt(df.imageMediaMetadata.height, 10) : null,
        rotation: df.imageMediaMetadata?.rotation ? parseInt(df.imageMediaMetadata.rotation, 10) : 0,
      });
    }
  }

  // 4. Batch insert new photos
  if (photosToInsert.length > 0) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < photosToInsert.length; i += BATCH_SIZE) {
      const chunk = photosToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertErr } = await supabase.from('gallery_photos').insert(chunk);
      if (insertErr) throw insertErr;
    }
  }

  // 5. Mark missing photos (in DB but no longer in Drive)
  const missingIds: string[] = [];
  const recoveredIds: string[] = [];

  for (const ep of existingPhotos || []) {
    const isNowInDrive = driveFileIds.has(ep.gdrive_file_id);
    if (!isNowInDrive && !ep.is_missing) {
      missingIds.push(ep.id);
    } else if (isNowInDrive && ep.is_missing) {
      recoveredIds.push(ep.id);
    }
  }

  if (missingIds.length > 0) {
    await supabase.from('gallery_photos').update({ is_missing: true }).in('id', missingIds);
  }

  if (recoveredIds.length > 0) {
    await supabase.from('gallery_photos').update({ is_missing: false }).in('id', recoveredIds);
  }

  return {
    addedCount: photosToInsert.length,
    missingCount: missingIds.length,
    totalCount: (existingPhotos || []).length + photosToInsert.length,
  };
}
