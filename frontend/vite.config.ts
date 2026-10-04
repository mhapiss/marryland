// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Menyisipkan <link rel="preload" as="font"> untuk woff2 font di atas lipatan
 * (Gloock 400 untuk judul, Hanken Grotesk 400 untuk isi) ke index.html hasil build.
 * Nama file font di-hash oleh Vite, jadi tautan dibuat dari daftar aset bundel.
 */
function preloadCriticalFonts(): Plugin {
  const critical = [/gloock-latin-400-normal[^/]*\.woff2$/, /hanken-grotesk-latin-400-normal[^/]*\.woff2$/];
  return {
    name: 'preload-critical-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return [];
        const files = Object.keys(bundle);
        return critical
          .map((re) => files.find((f) => re.test(f)))
          .filter((f): f is string => Boolean(f))
          .map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' },
            injectTo: 'head' as const,
          }));
      },
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), preloadCriticalFonts()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
  },
  esbuild: {
    // Buang console dan debugger hanya pada build produksi
    drop: command === 'build' ? (['console', 'debugger'] as ('console' | 'debugger')[]) : [],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'vendor-router';
          if (/node_modules[\\/]@supabase[\\/]/.test(id)) return 'vendor-supabase';
          return undefined;
        },
      },
    },
  },
}));
