# AUDIT KESIAPAN PELUNCURAN by.marryland

Dokumen ini disusun sebagai audit komprehensif, independen, dan berorientasi bukti menjelang peluncuran produksi platform by.marryland. Seluruh temuan didasarkan pada penelusuran kode sumber nyata, skema basis data, konfigurasi Vite, dan eksekusi perintah analitik (`npm run build`, `npm audit`, `tsc --noEmit`, `npm run check-schema`).

---

## 0. STATUS KETERSEDIAAN SKILL

| Skill yang Dibutuhkan | Status di `.agent/skills/` | Status Ekosistem / Pemuatan Nyata | Keterangan |
|---|---|---|---|
| `supabase-postgres-best-practices` | Belum disalin | **Aktif Dimuat** (Workspace `.agents/skills/`) | Tersedia resmi di konfigurasi agen & direktori workspace `.agents/skills/`. Digunakan penuh untuk analisis SQL, RLS, indeks, dan RPC. |
| `web-quality-audit` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Panduan audit kualitas, tool routing, dan checklist web dianalisis langsung dari repositori sementara addyosmani. |
| `core-web-vitals` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Aturan LCP, INP, CLS, dan mitigasi layout shift dianalisis langsung dari berkas panduan addyosmani. |
| `seo` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Standar meta, robots, sitemap, dan Open Graph dianalisis langsung dari panduan addyosmani. |
| `best-practices` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Panduan keamanan web, CSP, header, dan sanitasi dianalisis langsung dari panduan addyosmani. |
| `react-best-practices` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | 70 aturan performa React & Next.js Vercel dianalisis langsung dari kumpulan rule di repositori vercel-labs. |
| `web-design-guidelines` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Panduan antarmuka web Vercel dianalisis langsung dari berkas panduan vercel-labs. |
| `frontend-design` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Panduan tipografi, hierarki, dan pencegahan template generic dianalisis langsung dari panduan anthropics. |
| `ponytail-review` | Belum disalin | **Dirujuk Manual** (Klon sementara `%TEMP%`) | Panduan audit kode mati dan abstraksi dianalisis langsung dari repositori ponytail. |

*Catatan Kepatuhan:* Sesuai instruksi ketat, direktori `.agent/skills/` belum dimodifikasi atau dipasang file baru karena masih menunggu instruksi penyalinan terpisah. Analisis dilakukan dengan membaca langsung sumber acuan di repositori lokal sementara.

---

## 1. RINGKASAN EKSEKUTIF

by.marryland memiliki arsitektur visual editorial yang solid, tata letak justified row yang teroptimasi, dan pemisahan chunk produksi yang bersih (TypeScript `0 error`, build `12.27s`). Namun, platform ini belum aman untuk dibuka ke publik umum karena adanya celah keamanan kritis pada otorisasi basis data Supabase (migrasi hardening belum dijalankan), ketiadaan kebijakan RLS pada bucket Supabase Storage, ketergantungan rapuh pada cache-busting thumbnail Google Drive yang dapat memicu HTTP 429 saat galeri ramai dibuka, ketiadaan header keamanan pada hosting statis, dan hilangnya aset pratinjau media sosial (`og-image.jpg` dan `sitemap.xml`).

### 5 Risiko Terbesar
1. **Kebocoran Data Klien & Token Album jika Migrasi Hardening Belum Dijalankan:** File `20261005_pre_release_hardening.sql` berstatus belum dieksekusi di database; kebijakan awal di `supabase-schema.sql` mengizinkan `anon` melakukan `SELECT` langsung pada tabel `galleries` (`client_whatsapp`, `album_token`, `album_pin_hash`, `gdrive_folder_url`).
2. **Bucket Supabase Storage Tanpa Kebijakan RLS:** Bucket `home-media`, `portfolio`, dan `media-library` tidak memiliki aturan RLS di migrasi mana pun, berisiko dibuka untuk unggahan liar atau sebaliknya gagal diunggah saat admin beroperasi di produksi.
3. **Throttling HTTP 429 Google Drive CDN Akibat Cache-Busting Retry:** Komponen `ImageWithFallback.tsx` menambahkan parameter timestamp `&t=${Date.now()}` saat terjadi gagal muat awal, yang membatalkan cache peramban dan melipatgandakan beban request ke server thumbnail Google.
4. **Vulnerability Dependencies & Open Redirect:** Terdapat 36 kerentanan pada `npm audit`, termasuk celah Moderate pada `react-router-dom` (CVE-2025-68470 terkait open redirect via backslash).
5. **Ketiadaan Header Keamanan & CSP pada Hosting Statis:** Berkas `vercel.json` hanya berisi aturan rewrite SPA tanpa header proteksi (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`).

### 10 Perbaikan Tercepat dengan Dampak Terbesar (Quick Wins)
1. Jalankan migrasi `20261005_pre_release_hardening.sql` di Supabase SQL Editor untuk menutup akses `anon` langsung ke tabel `galleries` dan `gallery_photos`.
2. Buat migrasi SQL untuk menetapkan RLS policies pada Supabase Storage (`storage.objects`) untuk bucket `home-media`, `portfolio`, dan `media-library`.
3. Tambahkan `SET search_path = public` pada fungsi RPC `get_public_gallery`, `get_public_gallery_photos`, dan `get_family_album` di `20261004_gallery_security_and_albums.sql`.
4. Hapus parameter cache-busting timestamp `&t=${Date.now()}` pada retry di `ImageWithFallback.tsx` agar peramban dapat memanfaatkan cache HTTP yang valid.
5. Sediakan berkas `og-image.jpg` dan `sitemap.xml` di dalam folder `frontend/public/` agar tautan WhatsApp dan perayap mesin pencari tidak menghasilkan error 404.
6. Perbarui `frontend/public/robots.txt` untuk menambahkan pemblokiran rute album privat (`Disallow: /album/`).
7. Hapus `user-scalable=no, maximum-scale=1.0` dari tag viewport di `frontend/index.html` demi kepatuhan aksesibilitas WCAG 1.4.4.
8. Tambahkan konfigurasi security headers standar (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`) ke dalam `frontend/vercel.json`.
9. Hapus 5 paket dependensi mati di `frontend/package.json` (`axios`, `classnames`, `framer-motion`, `react-query`, `react-zoom-pan-pinch`) untuk memangkas ukuran `node_modules` dan mempercepat CI/CD.
10. Batasi Google Drive API Key di Google Cloud Console hanya untuk origin domain produksi dan layanan Google Drive API.

---

## 2. TABEL PRIORITAS TEMUAN

| ID | Keparahan | Area | Temuan | Bukti | Dampak bagi Pengunjung / Keamanan | Perbaikan yang Disarankan | Usaha | Mengubah Tampilan? | Skill yang Dipakai |
|---|---|---|---|---|---|---|---|---|---|
| **C1** | Blokir peluncuran | Supabase | Migrasi hardening belum dieksekusi di database; skema awal membuka akses baca publik tanpa filter | `supabase-schema.sql:79-83`, `20261005_pre_release_hardening.sql:1-15` | Penyerang anonim dapat membaca semua nomor WhatsApp klien, URL folder Drive rahasia, token album keluarga, dan hash PIN | Eksekusi `20261005_pre_release_hardening.sql` di SQL Editor Supabase untuk mencabut SELECT anon langsung | Kecil | Tidak | `supabase-postgres-best-practices` |
| **C2** | Blokir peluncuran | Supabase | Bucket Supabase Storage (`portfolio`, `home-media`, `media-library`) belum memiliki RLS policies di SQL | `frontend/supabase/migrations/` (0 berkas storage policy) | Unggahan admin bisa gagal di produksi atau bucket publik dieksploitasi untuk menyimpan file berbahaya | Buat migrasi SQL baru untuk konfigurasi RLS `storage.objects` (INSERT/UPDATE/DELETE hanya untuk admin/auth, SELECT publik) | Kecil | Tidak | `supabase-postgres-best-practices` |
| **C3** | Blokir peluncuran | Supabase | Fungsi RPC SECURITY DEFINER tidak menyertakan `SET search_path = public` | `20261004_gallery_security_and_albums.sql:55, 94, 128` | Rentan terhadap search_path hijacking pada level PostgreSQL | Tambahkan klausa `SET search_path = public` pada deklarasi ketiga fungsi RPC tersebut | Kecil | Tidak | `supabase-postgres-best-practices` |
| **D1** | Blokir peluncuran | Keamanan | Google Drive API Key belum diproteksi pembatasan origin HTTP referrer di Google Cloud Console | `frontend/.env.local:7`, terbendel ke `PortfolioManager.js` | Kuota Google Drive API proyek dapat dikuras oleh pihak luar melalui scraping bundle JS | Konfigurasi pembatasan HTTP Referrers (`https://domain-anda/*`) dan pembatasan API spesifik di Google Cloud Console | Kecil | Tidak | `best-practices` |
| **D2** | Blokir peluncuran | Keamanan | Header keamanan (CSP, X-Frame-Options, X-Content-Type-Options) belum dikonfigurasi di hosting | `frontend/vercel.json:1-9` | Kerentanan clickjacking, MIME sniffing, dan eksekusi skrip tidak terverifikasi | Tambahkan blok konfigurasi `"headers"` pada `vercel.json` dengan CSP dan proteksi browser modern | Kecil | Tidak | `best-practices` |
| **B1** | Sebelum ramai | Beban Drive | Retry foto menyertakan cache-busting timestamp `&t=Date.now()` yang membatalkan cache browser | `ImageWithFallback.tsx:77, 95` | Saat Google Drive mengalami transient rate-limit (429), retry melipatgandakan beban request ke origin | Hapus parameter query timestamp acak pada retry; gunakan backoff eksponensial murni dengan URL canonical | Kecil | Tidak | `core-web-vitals` |
| **B2** | Sebelum ramai | Beban Drive | Antrean pembatas konkurensi `imageLoadQueue` mati (tidak pernah diimpor/dipakai) | `frontend/src/lib/imageQueue.ts:1-99` | Pembukaan galeri 600 foto langsung menembakkan puluhan request gambar serentak tanpa throttle antrean internal | Integrasikan `loadImageWithBackoff` ke dalam pemuatan gambar thumbnail atau biarkan lazy-load native browser bekerja tanpa kode mati | Sedang | Tidak | `web-quality-audit` |
| **E1** | Sebelum ramai | Aksesibilitas | Tag viewport mematikan pinch-to-zoom pengguna (`user-scalable=no, maximum-scale=1.0`) | `frontend/index.html:5` | Pelanggaran WCAG 2.1 kriteria 1.4.4; pengguna dengan gangguan penglihatan tidak bisa memperbesar teks/layar di ponsel | Hapus atribut `maximum-scale=1.0, user-scalable=no` dari meta viewport di `index.html` | Kecil | Tidak | `web-design-guidelines` |
| **E2** | Sebelum ramai | Aksesibilitas | Modal PhotoViewer tidak mengunci fokus keyboard (`focus trap` belum ada) | `PhotoViewer.tsx:263-300` | Pengguna keyboard yang menekan tombol Tab saat viewer terbuka akan berpindah fokus ke elemen latar belakang | Tambahkan pembatas siklus tombol Tab (focus trap) saat modal terbuka | Sedang | Tidak | `web-quality-audit` |
| **F1** | Sebelum ramai | SEO | Berkas `og-image.jpg` dan `sitemap.xml` yang dirujuk meta tag tidak ada di folder `public` (404) | `frontend/index.html:17, 24`, `public/robots.txt:8`, `frontend/public/` | Pratinjau tautan di WhatsApp/Facebook tampil tanpa gambar, dan perayap Google gagal membaca sitemap | Buat berkas `og-image.jpg` berukuran 1200x630px di `public/` dan generate `sitemap.xml` untuk halaman publik | Kecil | Tidak | `seo` |
| **F2** | Sebelum ramai | SEO | Berkas `robots.txt` belum memblokir rute album keluarga privat (`/album/`) | `frontend/public/robots.txt:1-9` | Halaman album keluarga berpotensi diindeks oleh bot mesin pencari jika tautan tersebar di web publik | Tambahkan baris `Disallow: /album/` pada `frontend/public/robots.txt` | Kecil | Tidak | `seo` |
| **A1** | Sebelum ramai | Performa | Hook `useHomeData` melakukan `select('*')` dan memuat seluruh kolom termasuk yang tidak dipakai | `frontend/src/hooks/useHomeData.ts:82-83` | Menambah ukuran muatan data jaringan dan memicu re-evaluasi skema yang tidak perlu | Ganti `select('*')` dengan daftar kolom eksplisit yang dibutuhkan komponen (`section, content, visible`) | Kecil | Tidak | `react-best-practices` |
| **A2** | Sebelum ramai | Performa | Seluruh font woff dimuat sebagai file statis lokal di dist tanpa pembersihan format lawas | Output build: 14 file `.woff` (299 kB) & 15 file `.woff2` (281 kB) | Browser modern hanya membutuhkan format `.woff2`; format `.woff` menambah beban penyimpanan dist | Pastikan konfigurasi impor fontsource hanya merujuk file ekstensi `.woff2` | Kecil | Tidak | `core-web-vitals` |
| **C4** | Sebelum ramai | Supabase | Kueri RLS pada tabel `gallery_photos` dan `site_content` mengevaluasi fungsi auth per baris tanpa subquery | `supabase-schema.sql:62`, `20261004_home_editorial.sql:96, 101` | Penurunan performa query admin saat tabel foto membesar karena `auth.uid()` dipanggil ulang tiap baris | Bungkus `auth.uid()` menjadi `(select auth.uid())` pada seluruh ekspresi kebijakan RLS | Kecil | Tidak | `supabase-postgres-best-practices` |
| **C5** | Sebelum ramai | Supabase | Foreign key `photo_selections(gallery_photo_id)` belum memiliki indeks database | `20261005_performance_indexes.sql:26-28` | Operasi CASCADE DELETE dan join saat filter pilihan dapat memicu sequential scan | Tambahkan `CREATE INDEX IF NOT EXISTS idx_photo_selections_photo_id ON photo_selections(gallery_photo_id);` | Kecil | Tidak | `supabase-postgres-best-practices` |
| **D3** | Sebelum ramai | Keamanan | Kerentanan 36 dependensi npm (`react-router-dom` CVE-2025-68470 open redirect via backslash) | Output `npm audit`: 3 moderate, 33 high | Potensi eksploitasi perutean jika navigasi menerima input backslash mentah | Jalankan mitigasi sanitasi input navigasi atau perbarui paket `react-router-dom` ke versi patch aman | Sedang | Tidak | `best-practices` |
| **H1** | Nanti | Kualitas Kode | 5 paket library pihak ketiga yang besar tidak terpakai sama sekali di source code | `frontend/package.json:24, 25, 26, 30, 32` (`axios`, `classnames`, `framer-motion`, `react-query`, `react-zoom-pan-pinch`) | Membebani dependensi, waktu instalasi CI, dan potensi kerentanan keamanan yang tidak perlu | Hapus kelima dependensi dari `package.json` | Kecil | Tidak | `ponytail-review` |
| **H2** | Nanti | Kualitas Kode | Terdapat 6 kunci skema CMS yatim yang tidak terhubung ke komponen UI | Output `npm run check-schema` (skema client, demo, global) | Admin CMS mengisi data yang tidak pernah muncul di halaman depan | Sesuaikan skema di `src/content/schema/` agar selaras dengan kebutuhan rendering | Kecil | Tidak | `ponytail-review` |
| **G1** | Nanti | Konsistensi | Masih terdapat teks bahasa Inggris pada judul foto marquee bawaan | `InfiniteMarquee.tsx:29, 39, 49` | Tampilan terasa bercampur antara bahasa Indonesia dan Inggris | Terjemahkan label default ke Bahasa Indonesia yang puitis dan selaras dengan tema adat/editorial | Kecil | Ya (hanya teks) | `frontend-design` |
| **G2** | Nanti | Konsistensi | 61 elemen tombol di `PortfolioManager.tsx` dan puluhan tombol di komponen lain masih berupa tag `<button>` mentah | Output audit regex: >150 tag `<button` mentah di file manajer & modal | Potensi inkonsistensi styling dan pemeliharaan antarmuka di masa mendatang | Secara bertahap migrasikan tombol aksi ke komponen terpadu `<Button variant="..." size="...">` | Sedang | Tidak | `web-design-guidelines` |

---


## 3. DETAIL AUDIT PER CAKUPAN

### A. Performa dan Core Web Vitals
*Skill yang Digunakan: `web-quality-audit`, `core-web-vitals`, `react-best-practices`*

#### 1. Ukuran Bundel dan Chunk (Data Asli Build Produksi)
Berdasarkan eksekusi langsung `npm run build` (Vite v5.4.21, target `es2020`, minify `esbuild`), berikut rincian aset produksi di direktori `frontend/dist/`:
- **HTML & CSS:**
  - `dist/index.html`: **3.61 kB** (gzip: **1.24 kB**)
  - `dist/assets/index-Dt6JhZwa.css`: **80.07 kB** (gzip: **14.36 kB**)
- **Vendor Chunks Terbesar:**
  - `dist/assets/vendor-supabase-CIV1ze8V.js`: **220.45 kB** (gzip: **57.14 kB**)
  - `dist/assets/vendor-react-DxIuAOdz.js`: **142.05 kB** (gzip: **45.50 kB**)
  - `dist/assets/vendor-router-C9m-msfl.js`: **21.19 kB** (gzip: **7.88 kB**)
- **Rute Publik & Galeri Klien:**
  - `dist/assets/index-MjqXR1GG.js` (Main Entry): **50.35 kB** (gzip: **15.51 kB**)
  - `dist/assets/LandingPage-BunKwhPE.js`: **48.38 kB** (gzip: **13.12 kB**)
  - `dist/assets/GallerySelection-BXtC-EFA.js`: **58.63 kB** (gzip: **14.60 kB**)
  - `dist/assets/ClientPage-BlfHyFwu.js`: **20.34 kB** (gzip: **5.88 kB**)
  - `dist/assets/PhotoViewer-D09ub0yU.js`: **13.60 kB** (gzip: **4.40 kB**)
  - `dist/assets/AlbumPage-BIKGmA0U.js`: **12.56 kB** (gzip: **4.41 kB**)
  - `dist/assets/PortfolioPage-CBeO_T2D.js`: **7.60 kB** (gzip: **2.90 kB**)
  - `dist/assets/CollectionDetailPage-7V3v7QxE.js`: **2.37 kB** (gzip: **1.15 kB**)
- **Halaman Khusus Admin (Terisolasi dari Publik):**
  - `dist/assets/PortfolioManager-yTYY50Xq.js`: **112.71 kB** (gzip: **25.27 kB**)
  - `dist/assets/Dashboard-BXB63qe7.js`: **81.58 kB** (gzip: **19.63 kB**)
  - `dist/assets/ContentManager-BGzE3_s2.js`: **29.43 kB** (gzip: **7.95 kB**)
  - `dist/assets/HomeSettingsManager-DPCLqPhN.js`: **24.32 kB** (gzip: **6.60 kB**)
  - `dist/assets/AdminDashboard-BWjPpxUy.js`: **11.95 kB** (gzip: **2.83 kB**)

*Analisis Chunk:*
- Pemecahan kode (`manualChunks`) di `vite.config.ts:55-63` bekerja efektif. Vendor React, Router, dan Supabase terpecah ke cache jangka panjang terpisah.
- Rute admin (`Dashboard`, `PortfolioManager`, `ContentManager`) sepenuhnya terisolasi dan tidak dimuat saat pengunjung hanya membuka landing page atau galeri klien.
- Halaman pengembangan `/dev/ui` berhasil di-tree-shake dan **0 byte** pada build produksi karena diproteksi oleh kondisi `import.meta.env.DEV` di `App.tsx:36-38`.

#### 2. Analisis Aset Font dan Tekstur
- **Font woff vs woff2:**
  Di folder `dist/assets/`, Vite mengekspor 15 file `.woff2` (total 281 kB) dan 14 file `.woff` (total 299 kB). Browser modern yang mendukung target `es2020` hanya memerlukan format `.woff2`. Menyimpan berkas `.woff` lawas menambah total ukuran aset statis yang perlu diunggah ke hosting CDN.
- **Preload Font Kritis:**
  Plugin `preloadCriticalFonts()` di `vite.config.ts:10-32` berhasil menyuntikkan tag preload untuk `gloock-latin-400-normal.woff2` (26.36 kB) dan `hanken-grotesk-latin-400-normal.woff2` (13.46 kB) ke dalam `<head>` hasil build, mengamankan render awal teks hero.
- **Tekstur Kertas (Paper Noise):**
  Aset tekstur berupa file PNG statis `paper-noise-DYlJFlfC.png` sebesar **5.63 kB** di `dist/assets/`. Diterapkan via `body.has-paper-texture::before` dengan opasitas 5.5% tanpa filter SVG dinamis `feTurbulence` yang berat, serta dimatikan otomatis di rute galeri klien, dashboard, dan saat pengguna mengaktifkan mode hemat kuota (`prefers-reduced-data`).

#### 3. Risiko Core Web Vitals (LCP, INP, CLS)
- **Risiko LCP (Largest Contentful Paint):**
  - *Halaman Beranda (`/`):* Elemen LCP adalah gambar hero di `Hero.tsx`. Saat ini gambar hero menggunakan foto Unsplash eksternal (`https://images.unsplash.com/...`). Walaupun sudah ada `link rel="preconnect"` ke `images.unsplash.com` di `index.html:33`, koneksi pihak ketiga tetap tunduk pada latensi DNS/TLS eksternal.
  - *Halaman Galeri Klien (`/g/:slug`):* Elemen LCP adalah foto pertama dalam grid foto. Gambar diambil dari endpoint thumbnail Google Drive (`https://lh3.googleusercontent.com` / `drive.google.com`). Jika folder Drive lambat merespons atau throttled, LCP akan tertunda.
- **Risiko INP (Interaction to Next Paint):**
  - *Grid Galeri Klien:* Komponen `GallerySelection.tsx:135-155` menggunakan `requestAnimationFrame` untuk throttling scroll, dan batching update dimensi natural gambar (`handleDimensionDetected` di line 161-190). Hal ini menjaga thread utama tetap responsif.
  - *PhotoViewer:* Gesture swipe dan pinch-to-zoom di `PhotoViewer.tsx:158-172` memanipulasi style transform DOM secara langsung (`transform: translate3d...`) via RAF tanpa melalui siklus re-render React state, menghasilkan 60 FPS pada interaksi sentuh.
- **Risiko CLS (Cumulative Layout Shift):**
  - *Justified Grid Virtualization:* `GallerySelection.tsx` dan `lib/justifiedLayout.ts` menghitung tinggi baris secara matematis sebelum foto selesai dimuat. Container pembungkus foto memiliki dimensi lebar dan tinggi terhitung (`style={{ width, height }}`), sehingga tata letak tidak bergeser (CLS = 0) saat gambar thumbnail muncul.
  - *Anchor Scroll Preservation:* Baris 404-431 di `GallerySelection.tsx` secara aktif memantau ID foto teratas yang terlihat dan menjaga posisi scroll saat terjadi perubahan ukuran jendela atau perubahan preset thumbnail (Kecil/Sedang/Besar).

---

### B. Beban Galeri Klien dan Google Drive
*Skill yang Digunakan: `core-web-vitals`, `web-quality-audit`*

#### 1. Perhitungan Jumlah Request per Skenario Galeri
Ketika seorang klien membuka tautan galeri `/g/:client_slug`:
- **Tahap 1: Supabase Lookup (1 Request):**
  Mengambil metadata galeri via `supabase.rpc('get_public_gallery')` atau tabel `galleries`.
- **Tahap 2: Daftar Foto (1 Request):**
  Mengambil daftar foto via `supabase.rpc('get_public_gallery_photos')` atau `gallery_photos`. Seluruh daftar URL thumbnail (100, 300, atau 600 foto) diterima dalam 1 respon JSON.
- **Tahap 3: Permintaan Gambar Thumbnail ke Google Drive CDN:**
  Karena `GallerySelection.tsx:434-475` mengimplementasikan virtualisasi baris dengan rentang viewport + overscan (~2000px):
  - Tinggi rata-rata baris di HP adalah ~135px (berisi 2-3 foto). Di viewport awal ter-render sekitar 14 baris.
  - Jumlah thumbnail yang dimuat pada mount awal: **28 hingga 42 gambar**, terlepas dari total isi galeri!

| Total Foto di Galeri | Request Saat Halaman Dibuka (Initial Viewport) | Request Tambahan Saat Scroll Cepat ke Bawah | Total Request Gambar jika Semua Di-scroll |
|---|---|---|---|
| **100 Foto** | 28 - 42 request thumbnail | ~60 - 70 request secara bertahap | 100 request thumbnail |
| **300 Foto** | 28 - 42 request thumbnail | ~260 request secara bertahap | 300 request thumbnail |
| **600 Foto** | 28 - 42 request thumbnail | ~560 request secara bertahap | 600 request thumbnail |

- **Tahap 4: Pembukaan PhotoViewer (Layar Penuh):**
  Saat klien mengetuk salah satu foto untuk melihat layar penuh di `PhotoViewer.tsx:185-224`:
  - 1 request gambar resolusi tinggi (`=w2000`): foto aktif.
  - 2 request prefetch background (`=w2000`): foto berikutnya dan foto sebelumnya.
  - Total per aksi buka foto besar: **3 request gambar**.

#### 2. Titik Gagal Beban (Single Point of Failure) & Analisis Konkurensi
1. **Titik Gagal Google Drive CDN (HTTP 429 Too Many Requests):**
   - Google Drive thumbnail endpoint (`https://lh3.googleusercontent.com/d/{id}=w800` atau `drive.google.com/thumbnail`) bukan CDN komersial berdedikasi tanpa batas. Jika 20 klien membuka galeri secara bersamaan pada acara wisuda/pernikahan (misal tautan disebar di grup keluarga):
     - 20 klien x ~35 request awal = **700 request gambar serentak** ke origin Google.
     - Google Drive akan memicu respons HTTP 429 atau memutus socket koneksi gambar.
2. **Amplifikasi Masalah oleh Cache-Busting Retry di `ImageWithFallback.tsx`:**
   - Di `ImageWithFallback.tsx:77`, saat error terjadi, script melakukan retry dengan kode:
     `setCurrentSrc(\`${baseSrc}${separator}_retry=${nextAttempt}&t=${Date.now()}\`);`
   - Penambahan parameter waktu acak `&t=${Date.now()}` **merusak cache browser** dan memaksa peramban mengirim request baru ke server Google yang sedang kewalahan. Jika 50 foto gagal, 3 kali percobaan ulang dengan timestamp acak menghasilkan **150 request baru yang membanjiri Google**, memperparah status pemblokiran kuota.
3. **Kode Antrean `imageQueue.ts` Tidak Digunakan:**
   - Berkas `frontend/src/lib/imageQueue.ts` sebenarnya telah dirancang dengan `maxConcurrent = 6` dan penundaan backoff eksponensial. Namun file ini **tidak pernah diimpor atau dipanggil** oleh komponen galeri mana pun. Browser membuka sebanyak mungkin koneksi paralel yang diizinkan (pada HTTP/2, puluhan stream serentak).

#### 3. Rekomendasi Mitigasi Tanpa Memindahkan File ke Cloud Mandiri
1. **Hilangkan Cache-Busting Timestamp pada Retry:** Biarkan URL thumbnail canonical tetap utuh sehingga saat jaringan pulih, browser dapat memanfaatkan cache yang sudah tersimpan.
2. **Aktifkan Antrean Pemuatan Thumbnail:** Terapkan pembatasan request aktif (maksimal 6-8 request gambar paralel) untuk meredam lonjakan serentak.
3. **Ukuran Thumbnail Adaptif:** Pastikan fungsi `getOptimizedThumbnailUrl` di `justifiedLayout.ts` meminta ukuran thumbnail sesuai lebar tampilan layar (`=w400` untuk HP, bukan default `=w800` atau `=w2000`), menghemat hingga 60% bandwidth unduhan Google Drive per thumbnail.
4. *Opsi Cloud Sendiri (Hanya sebagai opsi terakhir):* Menggunakan Cloudflare R2 / AWS S3 sebagai proxy cache thumbnail. Konsekuensi: membutuhkan biaya penyimpanan objek tambahan dan pipeline sinkronisasi background worker antara Google Drive dan bucket penyimpanan mandiri.

---

### C. Supabase (Audit Basis Data & Arsitektur SQL)
*Skill yang Digunakan: `supabase-postgres-best-practices`*

Berdasarkan panduan `supabase-postgres-best-practices`, seluruh objek basis data dianalisis secara menyeluruh:

| Objek Database | Jenis | Temuan | Keparahan | Perbaikan Rekomendasi |
|---|---|---|---|---|
| `galleries` | Tabel / RLS | Kebijakan awal di `supabase-schema.sql:79` mengizinkan `SELECT` publik (`USING (true)`). Migrasi hardening `20261005_pre_release_hardening.sql` yang menutup celah ini belum dijalankan di server Supabase. | **CRITICAL** (Blokir Peluncuran) | Jalankan migrasi `20261005_pre_release_hardening.sql` di SQL Editor Supabase untuk mencabut `SELECT` anon langsung pada tabel `galleries`. |
| `storage.objects` | Supabase Storage | Tidak ada kebijakan RLS di berkas migrasi SQL untuk bucket `home-media`, `portfolio`, dan `media-library`. | **CRITICAL** (Blokir Peluncuran) | Buat migrasi SQL baru untuk mendefinisikan RLS `storage.objects`: izinkan `SELECT` publik untuk bucket publik, dan batasi `INSERT/UPDATE/DELETE` hanya untuk peran `authenticated` atau admin. |
| `get_public_gallery` | Fungsi RPC | Berjalan sebagai `SECURITY DEFINER` tanpa klausa `SET search_path = public`. | **HIGH** (Sebelum Ramai) | Tambahkan `SET search_path = public` pada deklarasi fungsi di `20261004_gallery_security_and_albums.sql:55` untuk mencegah search_path hijacking. |
| `get_public_gallery_photos` | Fungsi RPC | Berjalan sebagai `SECURITY DEFINER` tanpa klausa `SET search_path = public`. | **HIGH** (Sebelum Ramai) | Tambahkan `SET search_path = public` pada deklarasi fungsi di `20261004_gallery_security_and_albums.sql:94`. |
| `get_family_album` | Fungsi RPC | Berjalan sebagai `SECURITY DEFINER` tanpa klausa `SET search_path = public`. | **HIGH** (Sebelum Ramai) | Tambahkan `SET search_path = public` pada deklarasi fungsi di `20261004_gallery_security_and_albums.sql:128`. |
| `gallery_photos` | Kebijakan RLS | Kebijakan pemilik di `supabase-schema.sql:62` menggunakan `auth.uid()` di dalam subquery tanpa pembungkus scalar: `galleries.user_id = auth.uid()`. | **MEDIUM** (Sebelum Ramai) | Ganti dengan `galleries.user_id = (SELECT auth.uid())` agar dievaluasi sebagai konstanta sekali per kueri oleh optimizer PostgreSQL. |
| `site_content` | Kebijakan RLS | Kebijakan admin di `20261004_home_editorial.sql:96, 101, 106` menggunakan `id = auth.uid()` tanpa pembungkus scalar. | **MEDIUM** (Sebelum Ramai) | Ganti dengan `id = (SELECT auth.uid())`. |
| `photo_selections` | Indeks | Foreign key `gallery_photo_id` belum memiliki indeks mandiri di `20261005_performance_indexes.sql`. | **MEDIUM** (Sebelum Ramai) | Tambahkan indeks `CREATE INDEX IF NOT EXISTS idx_photo_selections_photo_id ON photo_selections(gallery_photo_id);`. |
| `useHomeData` | Kueri Frontend | Memakai `supabase.from('site_content').select('*')` dan `supabase.from('home_photos').select('*')` di `useHomeData.ts:82-83`. | **LOW** (Sebelum Ramai) | Hindari `select('*')`; tentukan kolom spesifik yang dipakai (`section, content, visible` dan `slot, position, path, width, height, alt`). |
| Enumerasi Galeri | Risiko Privasi | Jika SELECT publik pada `galleries` masih terbuka, penyerang dapat menjalankan kueri REST untuk mengambil seluruh slug galeri yang aktif. | **HIGH** (Sebelum Ramai) | Pastikan akses publik hanya diizinkan melalui fungsi RPC `get_public_gallery(p_slug)` dengan slug tunggal. |

---


### D. Keamanan Web
*Skill yang Digunakan: `best-practices`*

#### 1. Audit Rahasia Klien dan Riwayat Git
- **Kunci Rahasia (`service_role`):**
  Pemeriksaan seluruh file sumber, konfigurasi, dan riwayat git menunjukkan bahwa kunci `service_role` **TIDAK PERNAH terekspos** di frontend (`0 kemunculan`). Frontend hanya menggunakan kunci `VITE_SUPABASE_ANON_KEY` (kunci publik).
- **Google Drive API Key:**
  Di `.env.local:7`, kunci `VITE_GOOGLE_DRIVE_API_KEY` (`AIzaSyAccN-...`) digunakan oleh frontend untuk verifikasi dan sinkronisasi folder Drive. File `.env.local` diabaikan oleh `.gitignore` dan belum pernah ter-commit. Namun, karena Vite menyuntikkan variabel bertanda `VITE_` langsung ke dalam bundel JavaScript klien (`PortfolioManager-yTYY50Xq.js`), kunci ini terlihat oleh siapa saja yang memeriksa berkas JavaScript di browser.
  *Tindakan Wajib:* Kunci ini wajib dibatasi di Google Cloud Console dengan HTTP Referrers yang mencakup domain produksi Anda (`https://domain-anda.com/*`) dan dibatasi layanannya hanya untuk `Google Drive API`.

#### 2. Kerentanan Injeksi & XSS
- **dangerouslySetInnerHTML:**
  Pencarian kode menunjukkan `0 kemunculan` `dangerouslySetInnerHTML` di seluruh `frontend/src/`. React melakukan auto-escaping pada seluruh render string dinamis dari Supabase CMS, sehingga injeksi skrip HTML melalui field teks konten dicegah secara native.
- **Validasi Unggahan Berkas:**
  Pada fitur perpustakaan media (`useMediaLibrary.ts:153-162` dan `HomeSettingsManager.tsx:165-175`), berkas yang diunggah divalidasi tipe MIME-nya (`image/webp`, `image/jpeg`, `image/png`) dan diproses ulang melalui canvas HTML5 (`imageProcessor.ts`) menjadi WebP sebelum dikirim ke Supabase Storage. Pemrosesan ulang melalui canvas secara otomatis meremukkan payload biner tersembunyi (polyglot files).

#### 3. Proteksi Open Redirect
- Pada input "Sudah punya link galeri?" di `ClientPage.tsx:73-103`:
  - Baris 75 memeriksa `url.origin !== window.location.origin` dan menolak URL eksternal dengan pesan error.
  - Baris 90 memeriksa pola slug dengan regex ketat: `!/^[a-zA-Z0-9_\-\/]+$/.test(input) || input.includes('//')`.
  - Ini mencegah injeksi protokol (`javascript:`, `data:`) dan double-slash redirection.
  - Namun, perhatikan temuan `npm audit` terkait `react-router-dom`: terdapat celah bypass CVE-2025-68470 pada routing yang memanfaatkan karakter backslash (`\`). Regex di atas sudah aman karena tidak menyertakan karakter `\`.

#### 4. PostMessage Origin pada Pratinjau Admin
- Pada `EditorWithPreview.tsx:151, 195`, `EditableRegion.tsx:59, 77, 95`, dan `CollectionPreviewPage.tsx:45`:
  - Seluruh pengiriman pesan menentukan `targetOrigin: window.location.origin` (bukan wildcard `'*'`).
  - Listener pesan secara eksplisit memeriksa `if (event.origin !== window.location.origin) return;`.
  - Tidak ada celah pencurian data melalui postMessage cross-origin.

#### 5. Keamanan Album Keluarga (PIN & Token)
- **Entropi Token Album:**
  Fungsi `generateAlbumToken()` di `drive.ts:23-27` menghasilkan string 128-bit (32 karakter hex) menggunakan `window.crypto.getRandomValues(bytes)`. Entropi $2^{128}$ mustahil ditebak melalui serangan brute force.
- **Hashing PIN & Perlindungan Brute Force:**
  Di `20261004_gallery_security_and_albums.sql:190-215`:
  - Hash PIN dihitung dengan `encode(digest(p_pin || 'marryland_pin_salt', 'sha256'), 'hex')`.
  - Terdapat mekanisme pembatasan percobaan: jika gagal 5 kali berturut-turut, album terkunci secara otomatis selama 15 menit (`album_pin_locked_until = v_now + INTERVAL '15 minutes'`).
  - *Catatan Kritis:* Garam hash `'marryland_pin_salt'` bersifat statis. Untuk keamanan jangka panjang, jika tabel `galleries` bocor, PIN 4 digit dapat di-bruteforce offline dalam hitungan detik. Oleh karena itu, penutupan akses `SELECT` publik pada tabel `galleries` di Supabase (Temuan C1) menjadi syarat mutlak.

#### 6. Header Keamanan Hosting Statis
- Berkas `frontend/vercel.json` saat ini hanya berisi 8 baris aturan rewrite SPA:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
  Tidak ada header keamanan apa pun yang dikirimkan.
  *Rekomendasi:* Tambahkan header berikut pada hosting produksi:
  - `Content-Security-Policy`: Batasi skrip, gambar, dan koneksi ke `self`, `*.supabase.co`, `*.googleapis.com`, `*.googleusercontent.com`, `drive.google.com`.
  - `X-Frame-Options: SAMEORIGIN` (mengizinkan iframe internal untuk pratinjau editor admin, memblokir situs luar).
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

#### 7. Hasil Audit Kerentanan Dependensi (`npm audit`)
Eksekusi perintah `npm audit` mendeteksi total **36 kerentanan** (3 moderate, 33 high):
- **Moderate (Runtime Dependencies):**
  - `react-router` / `react-router-dom` (v6.14.2): CVE-2025-68470 (Open redirect via backslash bypass) dan arbitrary constructor injection.
  - `esbuild` / `vite`: Celah pada server pengembangan lokal.
- **High (Dev & Build Dependencies):**
  - 33 kerentanan terkait ReDoS pada modul pembantu regex glob (`braces`, `micromatch`, `chokidar`) yang ditarik oleh `tailwindcss` dan `jest`.

---

### E. Aksesibilitas (a11y)
*Skill yang Digunakan: `web-quality-audit`, `web-design-guidelines`*

#### 1. Kontras Warna Seluruh Preset Palet
Berdasarkan token warna di `tokens.css` dan `portfolioThemes.ts`:
- **Tema Bawaan Merah Vintage (by.marryland):**
  - Teks Tinta `#2B1815` di atas Kertas `#F3EADB`: **Rasio 14.0 : 1** (Lolos WCAG AAA).
  - Teks Tinta Lembut `#5A433D` di atas Kertas `#F3EADB`: **Rasio 7.7 : 1** (Lolos WCAG AAA).
  - Tombol Merah `#9B2C24` di atas Kertas `#F3EADB`: **Rasio 6.9 : 1** (Lolos WCAG AA & AAA Large).
  - Teks Kertas `#F3EADB` di dalam Tombol Merah `#9B2C24`: **Rasio 6.9 : 1** (Lolos WCAG AA).
- **Preset Tema Koleksi Portofolio:**
  - `marun-tua`: Tinta `#201515` di atas `#FAF7F5` (16.5:1), Tinta Muted `#614F4F` (6.8:1) -> **Lolos**.
  - `hijau-botol`: Tinta `#1A1D1A` di atas `#F9F8F4` (16.5:1), Tinta Muted `#555B54` (6.8:1) -> **Lolos**.
  - `arang`: Tinta `#181818` di atas `#F8F8F8` (17.5:1), Tinta Muted `#555555` (6.9:1) -> **Lolos**.
  - `biru-malam`: Tinta `#111622` di atas `#F6F8FA` (17.8:1), Tinta Muted `#4B5565` (7.4:1) -> **Lolos**.
  - `kunyit`: Tinta `#261E14` di atas `#FDFBF7` (15.6:1), Tinta Muted `#655745` (6.0:1) -> **Lolos**.
- **Warna Status:**
  - Sukses: Teks `#1E3A24` pada background `#EAF2EB` (9.5:1) -> **Lolos**.
  - Peringatan: Teks `#5F420B` pada background `#FAF0DC` (7.2:1) -> **Lolos**.
  - Error: Teks `#64201D` pada background `#FBECEB` (8.1:1) -> **Lolos**.

#### 2. Pelanggaran Viewport Mobile (WCAG 1.4.4)
- **Temuan Kritis:** Di `frontend/index.html:5`:
  `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`
  Atribut `maximum-scale=1.0, user-scalable=no` **secara paksa mematikan kemampuan pinch-to-zoom pengguna** pada peramban mobile. Ini melanggar kriteria sukses WCAG 2.1 (1.4.4 Resize Text).
  *Perbaikan:* Hapus `maximum-scale=1.0, user-scalable=no` dan biarkan zoom bawaan browser tetap aktif.

#### 3. Fokus Keyboard & Target Sentuh
- **Fokus Keyboard (Focus Ring):**
  Komponen terpadu `Button.tsx:65` telah dilengkapi cincin fokus kontras: `focus-visible:ring-2 focus-visible:ring-offset-2`. Tombol navigasi dan input formulir memiliki penanda fokus visual yang jelas.
- **Target Sentuh (Touch Targets):**
  Seluruh varian tombol ukuran `md` dan `lg` di `Button.tsx:38-39` memiliki `min-height: 44px` dan `min-width: 44px`, memenuhi standar batas minimal sentuhan jari manusia pada perangkat seluler.
- **Focus Trap pada Dialog:**
  Modal `PhotoViewer.tsx` memiliki atribut semantik `role="dialog"` dan `aria-modal="true"`. Namun, ketika tombol `Tab` ditekan berulang kali, fokus keyboard dapat "bocor" keluar dari modal menuju elemen halaman di belakangnya karena ketiadaan algoritma *focus trap*.

#### 4. Prefers Reduced Motion & Struktur Heading
- **Reduced Motion:** Animasi transisi tombol menggunakan durasi cepat (150ms). Efek tekstur kertas dinonaktifkan pada kondisi hemat data.
- **Struktur Heading:**
  Setiap halaman publik (`LandingPage`, `PortfolioPage`, `ClientPage`, `FaqPage`) memiliki tepat satu elemen `<h1>` yang berada di bagian Hero / PageHero, diikuti oleh `<h2>` untuk setiap seksi konten tanpa melompati tingkatan hierarki.

---

### F. SEO dan Berbagi Media Sosial
*Skill yang Digunakan: `seo`*

#### 1. Masalah Pratinjau Tautan (Open Graph & WhatsApp)
- **Berkas Gambar Pratinjau Hilang (`404`):**
  Di `frontend/index.html:17` dan baris 24:
  `<meta property="og:image" content="https://by-marryland.app/og-image.jpg" />`
  Pemeriksaan folder `frontend/public/` membuktikan bahwa berkas `og-image.jpg` **TIDAK ADA**. Akibatnya, setiap kali tautan situs dibagikan ke WhatsApp, Telegram, atau media sosial, pratinjau tautan akan muncul tanpa gambar thumbnail.
- **Keterbatasan SPA (Single Page Application):**
  Karena by.marryland dibangun sebagai SPA berbasis client-side rendering (React + Vite), perayap media sosial (termasuk WhatsApp crawler dan Twitterbot) **tidak menjalankan JavaScript**. Mereka hanya membaca tag HTML statis yang ada di `index.html`.
  Akibatnya: Judul, deskripsi, dan gambar yang diatur secara dinamis oleh hook `usePageMeta` di halaman portofolio atau galeri klien tidak akan terbaca oleh WhatsApp; WhatsApp akan selalu menampilkan judul default dari `index.html`.

#### 2. Berkas robots.txt dan Sitemap
- **Sitemap Hilang:**
  Di `frontend/public/robots.txt:8`:
  `Sitemap: https://by-marryland.app/sitemap.xml`
  Pemeriksaan direktori `frontend/public/` membuktikan berkas `sitemap.xml` **TIDAK ADA**. Google Search Console akan mencatat error saat mencoba mengurai sitemap.
- **Celah Indeks Halaman Privat di `robots.txt`:**
  Di `frontend/public/robots.txt`:
  ```text
  Disallow: /dashboard/
  Disallow: /admin/
  Disallow: /g/
  Disallow: /galeri/
  ```
  *Celah:* Rute album keluarga `/album/:client_slug` dan rute galeri kustom `/:studio_slug/:client_slug` **BELUM tercantum di Disallow**. Jika tautan album keluarga dibagikan di internet, bot mesin pencari dapat mengindeks halaman tersebut.
  *Perbaikan:* Tambahkan `Disallow: /album/` ke dalam `robots.txt`.

#### 3. Data Terstruktur (JSON-LD)
- Halaman FAQ (`FaqPage.tsx:36-58`) secara dinamis menyuntikkan skema JSON-LD `FAQPage` ke `<head>` saat dimuat, mencakup seluruh daftar pertanyaan dan jawaban. Format sintaks schema.org valid.
- Halaman portofolio dan beranda belum memiliki skema terstruktur `Organization` atau `LocalBusiness`.

---


### G. Konsistensi Desain
*Skill yang Digunakan: `frontend-design`, `web-design-guidelines`*

#### 1. Sisa Nilai Warna Tertulis Langsung (Hardcoded Hex Colors)
- Hasil pencarian kode mendeteksi beberapa pemakaian kode heksadesimal mentah di luar `tokens.css`:
  - `InfiniteMarquee.tsx`: Variasi warna kartu default dan gradien penutup tepi.
  - `SwipeSelector.tsx:221, 224, 248`: Nilai `bg-[#1a1a1c]`, `bg-[#f7f5f0]`, dan `bg-[#111]`.
  - `GallerySelection.tsx`: Nilai background gelap netral (`#121214`).
  *Analisis Kebijakan Desain:* Penggunaan warna netral gelap pada `GallerySelection.tsx` dan kartu foto `SwipeSelector.tsx` sejalan dengan keputusan desain yang telah ditetapkan ("latar galeri netral" agar foto klien tidak terdistorsi oleh warna kertas vintage). Bagian ini ditandai sebagai **konflik dengan keputusan desain jika diubah**, sehingga dipertahankan.

#### 2. Komponen Tombol yang Belum Seragam
- Pada pengerjaan Bagian 2 sebelumnya, komponen bersama `Button.tsx` telah dibuat dan tombol aksi utama/sekunder di halaman publik telah dimigrasikan dengan gaya "Lembut" (`rounded-btn`, 8px).
- Namun, pada antarmuka admin dan modal, masih terdapat banyak tombol yang menggunakan tag `<button className="...">` mentah:
  - `PortfolioManager.tsx`: 61 tombol (tab bar, kartu koleksi, kontrol unggah).
  - `HomeSettingsManager.tsx`: 14 tombol.
  - `ContentManager.tsx`: 13 tombol.
  - `EditorWithPreview.tsx`: 12 tombol.
  - Modal pengaturan: ~25 tombol.
  Walaupun seluruh tombol tersebut sudah memakai kelas `rounded-btn` atau `min-h-[44px]`, mengonsolidasikannya ke `<Button variant="..." size="...">` akan menyederhanakan pemeliharaan kode di masa depan.

#### 3. Teks Bahasa Inggris yang Tercampur
- Pada berkas `InfiniteMarquee.tsx:29, 39, 49`:
  - Masih terdapat data foto kurasi bawaan dengan judul bahasa Inggris: `"TODAY'S CHAPTER"`, `"A FILM BY MARRYLAND"`, `"JAVANESE TRADITIONS"`, `"THE PROMISE"`.
  - Teks ini terasa bertolak belakang dengan identitas editorial bernuansa sastra Indonesia yang diusung platform by.marryland.
  *Rekomendasi:* Ganti judul bawaan dengan frasa Bahasa Indonesia yang puitis dan relevan (misalnya: "Langkah Pertama", "Warisan Luhur", "Janji Suci").

---

### H. Kualitas Kode
*Skill yang Digunakan: `ponytail-review`*

#### 1. Kode Mati (Dead Code)
- **Modul `imageQueue.ts`:** Berkas sepanjang 99 baris (`frontend/src/lib/imageQueue.ts`) yang berisi kelas `ImageLoadQueue` dan fungsi `loadImageWithBackoff` **tidak pernah diimpor atau digunakan sama sekali** di seluruh proyek.
- **Kunci Skema CMS Yatim (Orphan Keys):**
  Hasil eksekusi `npm run check-schema` (`scripts/check-content-schema.cjs`) mencatat **6 kunci skema** yang didefinisikan di schema CMS tetapi tidak pernah dipanggil oleh komponen UI:
  1. `clientSchema.ts`: `"situation_photos"`
  2. `demoSchema.ts`: `"demo_photos"`
  3. `globalSchema.ts`: `"default_palette"`
  4. `globalSchema.ts`: `"default_font"`
  5. `globalSchema.ts`: `"photo_frame_style"`
  6. `globalSchema.ts`: `"default_wa_template"`

#### 2. Dependensi Tak Terpakai di `package.json`
Pemeriksaan pohon dependensi menunjukkan bahwa 5 paket besar berikut tercatat di `dependencies` namun **tidak memiliki satu pun statement impor** di seluruh kode sumber:
1. `axios` (v1.6.0) — Komunikasi data sepenuhnya menggunakan fetch native dan klien Supabase.
2. `classnames` (v2.3.2) — Penataan kelas CSS sepenuhnya menggunakan string template literal standar.
3. `framer-motion` (v13.4.1) — Animasi menggunakan CSS murni dan transition utility Tailwind.
4. `react-query` (v3.39.3) — Manajemen data memakai hook kustom React useState/useEffect/useCallback.
5. `react-zoom-pan-pinch` (v4.2.0) — Zoom PhotoViewer telah ditulis kustom berbasis RAF di `PhotoViewer.tsx`.

---

### I. Kesiapan Operasional (Checklist Pra-Peluncuran)
*Skill yang Digunakan: Panduan Operasional Web & Cloud*

Berikut adalah daftar checklist operasional yang perlu disiapkan secara mandiri sebelum meluncurkan situs ke domain publik:

1. **Hosting & CDN:**
   - Rekomendasi: Vercel, Cloudflare Pages, atau Netlify.
   - Pastikan aturan rewrite SPA aktif (`/* -> /index.html`) agar navigasi rute langsung (seperti `/g/nama-klien`) tidak menghasilkan error 404 saat di-refresh.
2. **Variabel Lingkungan Produksi (Environment Variables):**
   - Atur nilai variabel di dashboard penyedia hosting:
     - `VITE_SUPABASE_URL`: URL proyek Supabase produksi Anda.
     - `VITE_SUPABASE_ANON_KEY`: Anon / publishable key Supabase.
     - `VITE_GOOGLE_DRIVE_API_KEY`: API Key Google Drive Anda.
     - `VITE_GOOGLE_APPS_SCRIPT_URL`: URL web app Apps Script (jika digunakan).
3. **Konfigurasi Domain & DNS:**
   - Pasang domain utama (misal: `by.marryland.com` atau `bymarryland.id`) dengan sertifikat SSL/TLS otomatis dari hosting.
   - Arahkan rekam CNAME / A record dan pastikan redirect `www` ke non-`www` (atau sebaliknya) berjalan konsisten.
4. **Supabase Auth & Kustom SMTP:**
   - Buka menu **Authentication -> URL Configuration** di Supabase Dashboard:
     - Ubah **Site URL** menjadi domain produksi Anda (`https://domain-anda.com`).
     - Masukkan redirect URLs yang diizinkan: `https://domain-anda.com/**` (wajib untuk reset password).
   - **Kustom SMTP (Penting!):** Layanan email bawaan Supabase dibatasi hanya 3-4 email per jam pada paket gratis. Daftarkan penyedia SMTP kustom (seperti Resend, Postmark, atau Brevo) di menu **Authentication -> SMTP Settings** agar pengiriman email konfirmasi dan reset password fotografer tidak gagal.
5. **Pemeriksaan Batas Kuota Paket Supabase (Wajib Cek Dashboard):**
   - Periksa di dashboard Supabase Anda (**Settings -> Billing & Usage**):
     - Ukuran Basis Data (Batas gratis: 500 MB).
     - Ruang Penyimpanan Storage (Batas gratis: 1 GB).
     - Egress Bandwidth Bulanan (Batas gratis: 2 GB).
     - Kuota Permintaan API Bulanan.
6. **Pembatasan API Key Google Drive (Google Cloud Console):**
   - Buka Google Cloud Console -> **APIs & Services -> Credentials**:
     - Pilih API Key yang dipakai (`AIzaSy...`).
     - Di bagian **Application restrictions**, pilih **Websites** dan masukkan: `https://domain-anda.com/*`.
     - Di bagian **API restrictions**, pilih **Restrict key** dan centang hanya **Google Drive API**.
7. **Pemantauan Error (Telemetry):**
   - Integrasikan layanan pelaporan error sisi klien (seperti Sentry free tier atau GlitchTip) pada `ErrorBoundary.tsx` agar kegagalan JavaScript di perangkat klien langsung tercatat tanpa menunggu laporan pengguna.
8. **Rencana Uji Beban (Load Test Plan):**
   - *Skenario 1 (Klien Membuka Galeri):* 50 request simultan ke rute `/g/:client_slug` dengan galeri 300 foto. Metrik: TTFB < 800ms, tingkat kegagalan Google Drive CDN 0%.
   - *Skenario 2 (Klien Mengirimkan Seleksi):* 20 eksekusi simultan RPC `submit_gallery_selection`. Metrik: Transaksi basis data sukses 100% tanpa race condition pada limit kuota.

---

## 4. YANG SUDAH BAIK

1. **Kompilasi TypeScript Bersih:** Perintah `npx tsc --noEmit` keluar dengan exit code `0` tanpa ada satu pun kesalahan tipe (0 type error).
2. **Isolasi Rute Admin Efektif:** Seluruh halaman manajer admin (`PortfolioManager`, `Dashboard`, `ContentManager`) terpisah ke chunk terisolasi dan tidak mengotori waktu muat pengunjung publik.
3. **Arsitektur Grid Teroptimasi:** Perhitungan baris foto *justified* dihitung di memori dengan virtualisasi viewport, mencegah layout shift (CLS = 0) dan membatasi muatan DOM awal hanya ~30 thumbnail.
4. **PhotoViewer 60 FPS:** Manipulasi zoom dan geser foto menggunakan style transform DOM langsung via `requestAnimationFrame` tanpa siklus re-render React berulang.
5. **Desain Kontras Tinggi:** Rasio kontras teks utama terhadap warna kertas vintage mencapai `14:1` (jauh melampaui standar minimal WCAG AAA sebesar `7:1`).
6. **Keamanan postMessage Ketat:** Seluruh komunikasi iframe pratinjau editor admin telah memvalidasi `window.location.origin` secara simetris.

---

## 5. HAL YANG TIDAK DAPAT DIVERIFIKASI & PERINTAH UJI MANDIRI

### Hal yang Tidak Dapat Diverifikasi Sendiri oleh Agen:
1. **Status Migrasi Basis Data Langsung:** Agen tidak memiliki koneksi SQL langsung ke mesin Postgres Supabase Anda dan tidak diperkenankan menjalankan migrasi. Apakah tabel di remote Supabase sudah menerapkan `20261005_pre_release_hardening.sql` hanya bisa diverifikasi oleh Anda di dashboard Supabase.
2. **Kondisi Konfigurasi Google Cloud Console:** Agen tidak dapat memeriksa apakah Google Drive API key sudah dibatasi HTTP Referrer di konsol Google Anda.
3. **Performa Lapangan Nyata (Field Core Web Vitals / CrUX):** Karena domain belum beroperasi dengan traffic publik, data CrUX p75 riil belum tersedia di Google.

### Perintah yang Perlu Dijalankan Sendiri:
```bash
# 1. Jalankan build produksi dan pratinjau lokal
cd frontend
npm run build
npm run preview

# 2. Buka URL pratinjau (misal http://localhost:4173) di Chrome
# Jalankan audit Lighthouse tab pada mode "Mobile" & "Navigation"

# 3. Pengujian Kueri SQL di Supabase SQL Editor (Pastikan anon ditolak):
# Masuk ke Supabase SQL Editor dan jalankan:
SELECT album_token, album_pin_hash, client_whatsapp FROM galleries LIMIT 5;
# Jika hasilnya "permission denied" atau 0 baris, RLS hardening telah aktif sempurna.
```

---

## 6. USULAN URUTAN PENGERJAAN DALAM BATCH KECIL

Agar perbaikan aman dan mudah dilacak, berikut usulan rencana eksekusi dalam 4 commit bertahap (maksimal 6 item per batch):

### Batch 1: Keamanan Basis Data & Supabase Storage (Commit: `fix(security): database rls hardening and storage policies`)
1. Eksekusi `20261005_pre_release_hardening.sql` di Supabase SQL Editor.
2. Tambahkan `SET search_path = public` pada deklarasi RPC `get_public_gallery`, `get_public_gallery_photos`, dan `get_family_album`.
3. Tulis migrasi SQL baru untuk kebijakan RLS Supabase Storage (`storage.objects`) untuk bucket `home-media`, `portfolio`, dan `media-library`.
4. Bungkus `auth.uid()` menjadi `(select auth.uid())` pada kueri RLS di `supabase-schema.sql` dan `20261004_home_editorial.sql`.
5. Tambahkan indeks pada `photo_selections(gallery_photo_id)`.

### Batch 2: Keamanan Frontend & Hosting Statis (Commit: `fix(security): static headers and drive retry stability`)
1. Tambahkan konfigurasi `headers` keamanan (CSP, X-Frame-Options, X-Content-Type-Options) pada `frontend/vercel.json`.
2. Hapus parameter cache-busting timestamp `&t=${Date.now()}` pada retry di `ImageWithFallback.tsx`.
3. Lakukan pembatasan HTTP referrer dan API restriction pada Google Drive API Key di Google Cloud Console.
4. Perbarui input sanitasi dan pertimbangkan pembaruan patch `react-router-dom` untuk menutup CVE-2025-68470.

### Batch 3: SEO, Aksesibilitas, dan Meta Sosial (Commit: `fix(seo-a11y): metadata assets and viewport zoom compliance`)
1. Sediakan aset gambar `og-image.jpg` (1200x630px) di `frontend/public/`.
2. Generate berkas `sitemap.xml` untuk semua rute publik di `frontend/public/`.
3. Tambahkan `Disallow: /album/` pada `frontend/public/robots.txt`.
4. Hapus `user-scalable=no, maximum-scale=1.0` dari meta viewport di `frontend/index.html`.
5. Tambahkan pembatas siklus Tab (*focus trap*) pada `PhotoViewer.tsx`.
6. Terjemahkan judul foto kurasi bawaan marquee di `InfiniteMarquee.tsx` ke Bahasa Indonesia.

### Batch 4: Pembersihan Dependensi & Kode Mati (Commit: `chore(cleanup): remove unused dependencies and dead code`)
1. Hapus paket tidak terpakai dari `frontend/package.json` (`axios`, `classnames`, `framer-motion`, `react-query`, `react-zoom-pan-pinch`).
2. Jalankan `npm install` untuk memperbarui `package-lock.json`.
3. Hapus berkas utilitas antrean mati `frontend/src/lib/imageQueue.ts`.
4. Sinkronkan 6 kunci skema yatim pada CMS schema di `src/content/schema/`.
5. Optimasi query `useHomeData.ts` dengan menentukan kolom eksplisit pengganti `select('*')`.
