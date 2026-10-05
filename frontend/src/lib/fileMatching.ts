// src/lib/fileMatching.ts

/**
 * Ekstensi file kamera RAW yang didukung
 */
export const RAW_EXTENSIONS = [
  'raf',
  'cr2',
  'cr3',
  'nef',
  'arw',
  'dng',
  'orf',
  'rw2',
  'pef',
  'srw',
] as const;

/**
 * Ekstensi file JPEG
 */
export const JPG_EXTENSIONS = ['jpg', 'jpeg'] as const;

/**
 * Ekstensi metadata sidecar
 */
export const SIDECAR_EXTENSIONS = ['xmp'] as const;

export type FileCategory = 'raw' | 'jpg' | 'sidecar' | 'other';

export interface MatchFilterOptions {
  includeRaw: boolean;
  includeJpg: boolean;
  includeSidecar: boolean;
}

export const DEFAULT_FILTER_OPTIONS: MatchFilterOptions = {
  includeRaw: true,
  includeJpg: false,
  includeSidecar: true,
};

const STORAGE_KEY = 'marryland_file_copier_filters';

/**
 * Membaca preferensi filter dari localStorage dengan aman
 */
export function loadFilterOptions(): MatchFilterOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTER_OPTIONS;
    const parsed = JSON.parse(raw);
    return {
      includeRaw: typeof parsed.includeRaw === 'boolean' ? parsed.includeRaw : true,
      includeJpg: typeof parsed.includeJpg === 'boolean' ? parsed.includeJpg : false,
      includeSidecar: typeof parsed.includeSidecar === 'boolean' ? parsed.includeSidecar : true,
    };
  } catch {
    return DEFAULT_FILTER_OPTIONS;
  }
}

/**
 * Menyimpan preferensi filter ke localStorage dengan aman
 */
export function saveFilterOptions(options: MatchFilterOptions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    // Abaikan kegagalan localStorage di mode private
  }
}

/**
 * Sanitasi nama file dari daftar tidak tepercaya:
 * Membuang seluruh pemisah direktori (path traversal seperti / atau \)
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Split berdasarkan pemisah path POSIX dan Windows
  const segments = input.split(/[/\\]/);
  const leaf = segments[segments.length - 1] || '';
  return leaf.trim();
}

/**
 * Mengambil ekstensi file terakhir (huruf kecil, tanpa tanda titik)
 */
export function getExtension(filename: string): string {
  const clean = sanitizeFilename(filename);
  const dotIndex = clean.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === clean.length - 1) return '';
  return clean.slice(dotIndex + 1).toLowerCase();
}

/**
 * Mengambil nama dasar (base name) tanpa ekstensi terakhir.
 * Khusus file sidecar bertingkat (misal DSC_001.ARW.xmp), ekstensi sidecar
 * dan ekstensi raw keduanya dipotong sehingga kembali ke nama dasar foto.
 */
export function getBaseName(filename: string): string {
  const clean = sanitizeFilename(filename);
  if (!clean) return '';

  let name = clean;
  // Cek jika berakhiran .xmp
  if (name.toLowerCase().endsWith('.xmp')) {
    name = name.slice(0, -4);
  }

  // Potong ekstensi file terakhir
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex > 0) {
    name = name.slice(0, dotIndex);
  }

  return name.trim().toLowerCase();
}

/**
 * Mengkategorikan jenis file berdasarkan ekstensinya
 */
export function categorizeExtension(ext: string): FileCategory {
  const normalized = (ext || '').toLowerCase();
  if (RAW_EXTENSIONS.includes(normalized as any)) return 'raw';
  if (JPG_EXTENSIONS.includes(normalized as any)) return 'jpg';
  if (SIDECAR_EXTENSIONS.includes(normalized as any)) return 'sidecar';
  return 'other';
}

/**
 * Memeriksa apakah ekstensi file lolos filter yang dipilih
 */
export function isExtensionAllowed(ext: string, options: MatchFilterOptions): boolean {
  const category = categorizeExtension(ext);
  if (category === 'raw') return options.includeRaw;
  if (category === 'jpg') return options.includeJpg;
  if (category === 'sidecar') return options.includeSidecar;
  return false;
}

export interface LocalCandidateFile {
  name: string;
  relativePath: string;
  size: number;
  handle?: any; // FileSystemFileHandle
}

export interface MatchedFilePair {
  selectedBaseName: string;
  sourceFile: LocalCandidateFile;
  category: FileCategory;
}

export interface DuplicateGroup {
  baseName: string;
  files: LocalCandidateFile[];
}

export interface MatchAnalysisResult {
  totalSelected: number;
  matchedFiles: MatchedFilePair[];
  unmatchedSelections: string[]; // nama dasar yang tidak ditemukan
  duplicatesAcrossFolders: DuplicateGroup[];
  totalSizeToCopy: number;
}

/**
 * Melakukan pencocokan murni antara daftar foto pilihan dengan daftar file lokal yang dipindai
 */
export function analyzeAndMatchFiles(
  selectedFilenames: string[],
  scannedFiles: LocalCandidateFile[],
  filterOptions: MatchFilterOptions
): MatchAnalysisResult {
  // 1. Ekstrak nama dasar unik dari daftar pilihan (untrusted input sanitized)
  const selectedMap = new Map<string, string>(); // baseName -> original display name
  for (const rawName of selectedFilenames) {
    const clean = sanitizeFilename(rawName);
    if (!clean) continue;
    const base = getBaseName(clean);
    if (base && !selectedMap.has(base)) {
      selectedMap.set(base, clean);
    }
  }

  // 2. Filter file lokal sesuai ekstensi yang dipilih
  const eligibleFiles: LocalCandidateFile[] = [];
  for (const f of scannedFiles) {
    const ext = getExtension(f.name);
    if (isExtensionAllowed(ext, filterOptions)) {
      eligibleFiles.push(f);
    }
  }

  // 3. Kelompokkan file lokal berdasarkan baseName
  const localByBase = new Map<string, LocalCandidateFile[]>();
  for (const f of eligibleFiles) {
    const base = getBaseName(f.name);
    if (!base) continue;
    const group = localByBase.get(base) || [];
    group.push(f);
    localByBase.set(base, group);
  }

  // 4. Deteksi duplikat lintas folder (baseName sama muncul di folder berbeda)
  const duplicatesAcrossFolders: DuplicateGroup[] = [];
  for (const [base, files] of localByBase.entries()) {
    if (selectedMap.has(base) && files.length > 1) {
      // Periksa apakah ada file dengan path direktori yang berbeda
      const dirSet = new Set(
        files.map((file) => {
          const parts = file.relativePath.split(/[/\\]/);
          parts.pop(); // buang nama file
          return parts.join('/');
        })
      );
      if (dirSet.size > 1) {
        duplicatesAcrossFolders.push({
          baseName: base,
          files,
        });
      }
    }
  }

  // 5. Bangun daftar file yang cocok dan foto tanpa pasangan
  const matchedFiles: MatchedFilePair[] = [];
  const unmatchedSelections: string[] = [];
  let totalSizeToCopy = 0;

  for (const [base, originalName] of selectedMap.entries()) {
    const foundFiles = localByBase.get(base);
    if (!foundFiles || foundFiles.length === 0) {
      unmatchedSelections.push(originalName);
    } else {
      for (const src of foundFiles) {
        const ext = getExtension(src.name);
        matchedFiles.push({
          selectedBaseName: base,
          sourceFile: src,
          category: categorizeExtension(ext),
        });
        totalSizeToCopy += src.size;
      }
    }
  }

  return {
    totalSelected: selectedMap.size,
    matchedFiles,
    unmatchedSelections,
    duplicatesAcrossFolders,
    totalSizeToCopy,
  };
}

/**
 * Format ukuran byte ke format yang ramah manusia
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = bytes / Math.pow(k, i);
  return `${num.toFixed(num >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}
