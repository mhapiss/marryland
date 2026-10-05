// scripts/generate-sitemap.cjs
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://by-marryland.app';
const TODAY = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/portofolio', priority: '0.9', changefreq: 'weekly' },
  { path: '/portofolio/melayu', priority: '0.8', changefreq: 'weekly' },
  { path: '/portofolio/batak', priority: '0.8', changefreq: 'weekly' },
  { path: '/portofolio/minang', priority: '0.8', changefreq: 'weekly' },
  { path: '/untuk-klien', priority: '0.8', changefreq: 'monthly' },
  { path: '/demo', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/kontak', priority: '0.7', changefreq: 'monthly' },
  { path: '/syarat-ketentuan', priority: '0.3', changefreq: 'yearly' },
  { path: '/kebijakan-privasi', priority: '0.3', changefreq: 'yearly' },
];

async function generateSitemap() {
  const urls = [...staticRoutes];

  // Build XML string
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${DOMAIN}${item.path}</loc>
    <lastmod>${item.lastmod || TODAY}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const targetPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(targetPath, xml, 'utf8');
  console.log(`Generated sitemap with ${urls.length} URLs at ${targetPath}`);
}

generateSitemap().catch((err) => {
  console.error('Failed to generate sitemap:', err);
  process.exit(1);
});
