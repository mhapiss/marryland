// scripts/check-content-schema.cjs
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const schemaDir = path.join(srcDir, 'content', 'schema');

console.log('--------------------------------------------------');
console.log('AUDIT SINKRONISASI SKEMA KONTEN VS PEMAKAIAN KODE');
console.log('--------------------------------------------------');

// 1. Read all component and page files
function getFiles(dir, extensions = ['.tsx', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('schema')) {
        results = results.concat(getFiles(fullPath, extensions));
      }
    } else {
      if (extensions.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const componentFiles = getFiles(path.join(srcDir, 'components'));
const pageFiles = getFiles(path.join(srcDir, 'pages'));
const hookFiles = getFiles(path.join(srcDir, 'hooks'));
const allCodeFiles = [...componentFiles, ...pageFiles, ...hookFiles];

// Combine all code content
let codeCorpus = '';
allCodeFiles.forEach((f) => {
  codeCorpus += fs.readFileSync(f, 'utf8') + '\n';
});

// 2. Read schema files
const schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.ts') && f !== 'types.ts' && f !== 'index.ts');

let totalKeysChecked = 0;
let matchedKeysCount = 0;
let unmatchedKeys = [];

schemaFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(schemaDir, file), 'utf8');
  console.log(`\nMemeriksa Skema: ${file}`);

  // Find key: 'xxx'
  const keyMatches = [...content.matchAll(/key:\s*['"]([a-zA-Z0-9_-]+)['"]/g)];
  const keys = [...new Set(keyMatches.map((m) => m[1]))];

  keys.forEach((k) => {
    totalKeysChecked++;
    // Regex to test if key appears in code corpus
    const keyRegex = new RegExp(`['".\\[]${k}['"\\]]?`, 'i');
    if (keyRegex.test(codeCorpus)) {
      matchedKeysCount++;
      console.log(`  ✓ [TERPAKAI] ${k}`);
    } else {
      unmatchedKeys.push({ schema: file, key: k });
      console.log(`  ⚠ [YATIM / BELUM TERPAKAI] ${k}`);
    }
  });
});

console.log('\n--------------------------------------------------');
console.log(`HASIL PEMERIKSAAN SKEMA:`);
console.log(`Total Kunci Skema: ${totalKeysChecked}`);
console.log(`Kunci Terpakai di Komponen: ${matchedKeysCount} (${Math.round((matchedKeysCount / totalKeysChecked) * 100)}%)`);
console.log(`Kunci Yatim/Cadangan: ${unmatchedKeys.length}`);
console.log('--------------------------------------------------');

if (unmatchedKeys.length > 0) {
  console.log('Daftar Kunci yang Perlu Diperhatikan:');
  unmatchedKeys.forEach((u) => {
    console.log(` - ${u.schema}: "${u.key}"`);
  });
} else {
  console.log('Seluruh kunci skema berhasil terpetakan ke pemakaian kode!');
}
console.log('--------------------------------------------------\n');
process.exit(0);
