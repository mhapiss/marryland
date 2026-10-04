const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(tsx|ts|css|html)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('src');
const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const twColorRegex = /\b(?:bg|text|border|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(?:\/[0-9]+)?\b/g;

let hexMatches = {};
let twMatches = {};
let fileMatchCounts = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative('.', f).replace(/\\/g, '/');
  
  const h = content.match(hexRegex) || [];
  const tw = content.match(twColorRegex) || [];
  
  if (h.length > 0 || tw.length > 0) {
    fileMatchCounts[rel] = { hex: h.length, tw: tw.length, total: h.length + tw.length };
    h.forEach(x => { hexMatches[x.toLowerCase()] = (hexMatches[x.toLowerCase()] || 0) + 1; });
    tw.forEach(x => { twMatches[x] = (twMatches[x] || 0) + 1; });
  }
});

console.log('--- AUDIT WARNA SEBELUM ---');
console.log('Total file dengan warna hardcoded/tailwind:', Object.keys(fileMatchCounts).length);
let totalHardcoded = 0;
for (const [f, counts] of Object.entries(fileMatchCounts)) {
  totalHardcoded += counts.total;
  console.log(`  ${f}: ${counts.hex} hex, ${counts.tw} tw classes (total: ${counts.total})`);
}
console.log('TOTAL MATCHES:', totalHardcoded);
console.log('\nTop Hex colors:', Object.entries(hexMatches).sort((a,b)=>b[1]-a[1]).slice(0, 15));
console.log('\nTop Tailwind classes:', Object.entries(twMatches).sort((a,b)=>b[1]-a[1]).slice(0, 20));
