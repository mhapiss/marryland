// scripts/calc-contrast.cjs

function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PALETTES = {
  'merah-vintage': {
    name: 'Merah Vintage (Default by.marryland)',
    paper: '#F3EADB',
    mutedPaper: '#E8DCC8',
    ink: '#2B1815',
    inkMuted: '#5A433D',
    dark: '#3A0F0D',
    darkText: '#F3EADB',
    accent: '#9B2C24',
    accentHover: '#7E211B',
    marker: '#C93A2E'
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
    marker: '#C93A2E'
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
    marker: '#C93A2E'
  },
  'arang': {
    name: 'Arang Monokrom',
    paper: '#F8F8F8',
    mutedPaper: '#EFEFEF',
    ink: '#181818',
    inkMuted: '#555555',
    dark: '#222222',
    darkText: '#F8F8F8',
    accent: '#555555',
    marker: '#C93A2E'
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
    marker: '#C93A2E'
  }
};

console.log('=== TABEL RASIO KONTRAS PRESET PALET ===\n');

for (const [key, p] of Object.entries(PALETTES)) {
  console.log(`Preset: ${p.name} (${key})`);
  
  const pairs = [
    { label: 'Teks Utama (ink) / Latar (paper)', fg: p.ink, bg: p.paper, min: 4.5, type: 'Body' },
    { label: 'Teks Utama (ink) / Latar Panel (mutedPaper)', fg: p.ink, bg: p.mutedPaper, min: 4.5, type: 'Body' },
    { label: 'Teks Sekunder (inkMuted) / Latar (paper)', fg: p.inkMuted, bg: p.paper, min: 4.5, type: 'Body' },
    { label: 'Teks Sekunder (inkMuted) / Latar Panel (mutedPaper)', fg: p.inkMuted, bg: p.mutedPaper, min: 4.5, type: 'Body' },
    { label: 'Teks Terang (darkText) / Section Gelap (dark)', fg: p.darkText, bg: p.dark, min: 4.5, type: 'Body' },
    { label: 'Aksen Tombol (accent) / Teks Tombol (paper)', fg: p.paper, bg: p.accent, min: 4.5, type: 'UI/Button' },
    { label: 'Teks Aksen (accent) / Latar (paper)', fg: p.accent, bg: p.paper, min: 3.0, type: 'Heading/UI' },
  ];
  
  pairs.forEach(pair => {
    const ratio = getContrast(pair.fg, pair.bg);
    const pass = ratio >= pair.min;
    console.log(`  ${pass ? '✓ [LOLOS]' : '✗ [GAGAL]'} ${pair.label}: ${ratio.toFixed(2)}:1 (Min ${pair.min}:1, ${pair.type})`);
  });
  console.log('');
}
