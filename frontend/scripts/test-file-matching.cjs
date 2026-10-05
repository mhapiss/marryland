// scripts/test-file-matching.cjs
const assert = require('assert');

// Mock module logic in CommonJS for test runner
const RAW_EXTENSIONS = ['raf', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'pef', 'srw'];
const JPG_EXTENSIONS = ['jpg', 'jpeg'];
const SIDECAR_EXTENSIONS = ['xmp'];

function sanitizeFilename(input) {
  if (!input || typeof input !== 'string') return '';
  const segments = input.split(/[/\\]/);
  const leaf = segments[segments.length - 1] || '';
  return leaf.trim();
}

function getExtension(filename) {
  const clean = sanitizeFilename(filename);
  const dotIndex = clean.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === clean.length - 1) return '';
  return clean.slice(dotIndex + 1).toLowerCase();
}

function getBaseName(filename) {
  const clean = sanitizeFilename(filename);
  if (!clean) return '';
  let name = clean;
  if (name.toLowerCase().endsWith('.xmp')) {
    name = name.slice(0, -4);
  }
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex > 0) {
    name = name.slice(0, dotIndex);
  }
  return name.trim().toLowerCase();
}

function categorizeExtension(ext) {
  const normalized = (ext || '').toLowerCase();
  if (RAW_EXTENSIONS.includes(normalized)) return 'raw';
  if (JPG_EXTENSIONS.includes(normalized)) return 'jpg';
  if (SIDECAR_EXTENSIONS.includes(normalized)) return 'sidecar';
  return 'other';
}

function isExtensionAllowed(ext, options) {
  const category = categorizeExtension(ext);
  if (category === 'raw') return options.includeRaw;
  if (category === 'jpg') return options.includeJpg;
  if (category === 'sidecar') return options.includeSidecar;
  return false;
}

function analyzeAndMatchFiles(selectedFilenames, scannedFiles, filterOptions) {
  const selectedMap = new Map();
  for (const rawName of selectedFilenames) {
    const clean = sanitizeFilename(rawName);
    if (!clean) continue;
    const base = getBaseName(clean);
    if (base && !selectedMap.has(base)) {
      selectedMap.set(base, clean);
    }
  }

  const eligibleFiles = [];
  for (const f of scannedFiles) {
    const ext = getExtension(f.name);
    if (isExtensionAllowed(ext, filterOptions)) {
      eligibleFiles.push(f);
    }
  }

  const localByBase = new Map();
  for (const f of eligibleFiles) {
    const base = getBaseName(f.name);
    if (!base) continue;
    const group = localByBase.get(base) || [];
    group.push(f);
    localByBase.set(base, group);
  }

  const duplicatesAcrossFolders = [];
  for (const [base, files] of localByBase.entries()) {
    if (selectedMap.has(base) && files.length > 1) {
      const dirSet = new Set(
        files.map((file) => {
          const parts = file.relativePath.split(/[/\\]/);
          parts.pop();
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

  const matchedFiles = [];
  const unmatchedSelections = [];
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

console.log('--- MENJALANKAN PENGUJIAN LOGIKA PENCOCOKAN FILE ---');

// Test 1: Sanitasi nama file tidak tepercaya (path traversal)
console.log('Uji 1: Sanitasi pemisah path...');
assert.strictEqual(sanitizeFilename('../../etc/passwd.jpg'), 'passwd.jpg');
assert.strictEqual(sanitizeFilename('C:\\Windows\\System32\\IMG_001.JPG'), 'IMG_001.JPG');
assert.strictEqual(getBaseName('../../etc/passwd.jpg'), 'passwd');
assert.strictEqual(getBaseName('folder/sub/DSC_999.RAF'), 'dsc_999');
console.log('PASS: Sanitasi path traversal berhasil');

// Test 2: Nama dengan spasi
console.log('Uji 2: Nama file dengan spasi...');
assert.strictEqual(getBaseName('Wedding Budi 001.JPG'), 'wedding budi 001');
assert.strictEqual(getBaseName('Wedding Budi 001.CR3'), 'wedding budi 001');
console.log('PASS: Nama dengan spasi cocok');

// Test 3: Huruf besar-kecil berbeda (case-insensitivity)
console.log('Uji 3: Case-insensitive matching...');
assert.strictEqual(getBaseName('IMG_0042.jpg'), 'img_0042');
assert.strictEqual(getBaseName('img_0042.CR2'), 'img_0042');
assert.strictEqual(getBaseName('Img_0042.RAW'), 'img_0042');
console.log('PASS: Case-insensitivity cocok');

// Test 4: Sidecar files (.xmp dan .ARW.xmp)
console.log('Uji 4: Sidecar file resolution...');
assert.strictEqual(getBaseName('DSC_0100.xmp'), 'dsc_0100');
assert.strictEqual(getBaseName('DSC_0100.ARW.xmp'), 'dsc_0100');
assert.strictEqual(getBaseName('DSC_0100.NEF.XMP'), 'dsc_0100');
console.log('PASS: Ekstensi sidecar ganda terselesaikan ke base name yang sama');

// Test 5: Nama non-ASCII (karakter khusus, aksen, ampersand)
console.log('Uji 5: Nama non-ASCII dan karakter khusus...');
assert.strictEqual(getBaseName('Momen_Hafidz_&_Sarah_01.jpg'), 'momen_hafidz_&_sarah_01');
assert.strictEqual(getBaseName('Renée_&_François_05.RAF'), 'renée_&_françois_05');
console.log('PASS: Nama non-ASCII konsisten');

// Test 6: Simulasi skenario lengkap
console.log('Uji 6: Skenario analisis dan pencocokan lengkap...');
const selectedFromClient = [
  'IMG 001.JPG',
  'IMG_002.jpg',
  '../../hack/IMG_003.JPG',
  'Momen_Indah_04.JPG',
  'DUPLIKAT_05.JPG',
  'FOTO_HILANG_99.JPG',
];

const scannedLocalFiles = [
  { name: 'IMG 001.CR3', relativePath: 'Roll1/IMG 001.CR3', size: 30000000 },
  { name: 'IMG 001.xmp', relativePath: 'Roll1/IMG 001.xmp', size: 5000 },
  { name: 'img_002.nef', relativePath: 'Roll1/img_002.nef', size: 45000000 },
  { name: 'IMG_003.ARW', relativePath: 'Roll2/IMG_003.ARW', size: 40000000 },
  { name: 'Momen_Indah_04.dng', relativePath: 'Roll2/Momen_Indah_04.dng', size: 35000000 },
  // Duplikat di dua folder
  { name: 'DUPLIKAT_05.CR2', relativePath: 'KartuA/DUPLIKAT_05.CR2', size: 25000000 },
  { name: 'DUPLIKAT_05.CR2', relativePath: 'KartuB/DUPLIKAT_05.CR2', size: 25000000 },
  // File yang tidak dipilih
  { name: 'UNSELECTED_10.CR3', relativePath: 'Roll1/UNSELECTED_10.CR3', size: 30000000 },
];

const defaultOptions = {
  includeRaw: true,
  includeJpg: false,
  includeSidecar: true,
};

const result = analyzeAndMatchFiles(selectedFromClient, scannedLocalFiles, defaultOptions);

assert.strictEqual(result.totalSelected, 6, 'Total pilihan harus 6');
assert.strictEqual(result.unmatchedSelections.length, 1, 'Foto hilang harus 1');
assert.strictEqual(result.unmatchedSelections[0], 'FOTO_HILANG_99.JPG');
assert.strictEqual(result.duplicatesAcrossFolders.length, 1, 'Harus mendeteksi 1 duplikat lintas folder');
assert.strictEqual(result.duplicatesAcrossFolders[0].baseName, 'duplikat_05');

// Matched files should contain:
// IMG 001.CR3, IMG 001.xmp, img_002.nef, IMG_003.ARW, Momen_Indah_04.dng, plus 2 duplikat files = 7 files
assert.strictEqual(result.matchedFiles.length, 7, 'Harus mencocokkan 7 file (termasuk sidecar dan duplikat)');
console.log('PASS: Analisis dan pencocokan skenario lengkap sukses');

console.log('SEMUA 6 UJI PENCCOCOKAN FILE BERHASIL 100%');
