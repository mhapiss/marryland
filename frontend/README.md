# by.marryland

Platform seleksi foto eksklusif untuk klien fotografer.

## Stack Teknologi
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Database & Auth: Supabase

---

## Development Lokal

Panduan ini ditujukan untuk menjalankan proyek secara lokal menggunakan Supabase CLI tanpa menyentuh data produksi.

### 1. Prasyarat
- [Node.js](https://nodejs.org/en/) (rekomendasi v18+)
- [Docker](https://www.docker.com/) (wajib untuk menjalankan Supabase secara lokal)
- Supabase CLI (Dapat dijalankan melalui npx)

### 2. Menjalankan Supabase Lokal
Supabase CLI membutuhkan Docker yang sedang berjalan. Buka terminal di folder `frontend` lalu jalankan:

```bash
npx supabase start
```

Perintah di atas akan mengunduh image Docker Supabase dan menjalankan semua layanannya (Database, Auth, Studio, Storage, dll) di lokal komputer kamu.
Saat pertama kali dijalankan, Supabase CLI akan otomatis menerapkan skema database (dari folder `supabase/migrations/`) dan mengisi data awal (dari `supabase/seed.sql`).

Setelah berhasil berjalan, terminal akan menampilkan informasi URL dan *Key* lokal kamu, contoh:
- **API URL:** `http://127.0.0.1:54321`
- **anon key:** `eyJhbGci...`
- **Supabase Studio (Dashboard Lokal):** `http://127.0.0.1:54323`
- **Inbucket (Email Lokal):** `http://127.0.0.1:54324`

### 3. Konfigurasi Environment Variables
Gandakan file `.env.example` dan ubah namanya menjadi `.env.local` (file ini otomatis masuk `.gitignore` agar tidak bocor):

```bash
cp .env.example .env.local
```

Buka `.env.local` dan isi dengan nilai yang didapat dari perintah `supabase start` tadi:
- `VITE_SUPABASE_URL`: isi dengan **API URL** lokal (biasanya `http://127.0.0.1:54321`)
- `VITE_SUPABASE_ANON_KEY`: isi dengan **anon key** lokal
- `VITE_GOOGLE_DRIVE_API_KEY`: (Opsional) isi dengan API Key Google Drive kamu jika ingin mengetes integrasi sinkronisasi foto.

### 4. Menjalankan Frontend Server
Instal dependensi dan jalankan server Vite:

```bash
npm install
npm run dev
```

Aplikasi sekarang dapat diakses di `http://localhost:5173`.

### 5. Akun Pengujian Lokal (Seed Data)
Data uji (`seed.sql`) telah otomatis menyertakan akun admin, galeri, dan portofolio dummy:
- **Email:** `admin@marryland.com`
- **Password:** `password123`
- **Role:** `admin` (Dapat mengakses halaman admin di `/admin`)

Jika kamu membuat akun baru melalui halaman Register (`/register`):
1. Pendaftaran membutuhkan konfirmasi email jika `auth.enable_confirmations` menyala. Namun, di `config.toml` lokal kita sudah set `false` agar lebih cepat.
2. Jika butuh mengecek email (misal untuk fitur reset password), buka **Inbucket** di `http://127.0.0.1:54324`. Semua email yang dikirim sistem lokal akan ditangkap di sana.
3. Akun yang baru didaftarkan akan masuk dengan *role* otomatis sebagai `photographer`.
4. Untuk **mengubah role akun menjadi admin**: 
   - Buka Supabase Studio Lokal di `http://127.0.0.1:54323`
   - Buka Table Editor -> tabel `profiles`
   - Edit *row* akun kamu dan ubah nilai `role` dari `photographer` menjadi `admin`.

### 6. Reset Database Lokal
Jika kamu ingin mengulang data dari awal (menghapus semua perubahan yang kamu buat dan menjalankan ulang seed):
```bash
npx supabase db reset
```

Jika sudah selesai bekerja dan ingin mematikan Supabase lokal:
```bash
npx supabase stop
```
