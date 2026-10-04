// src/pages/PrivacyPage.tsx
import React from 'react';
import LegalLayout from '../components/LegalLayout';
import { usePageContent, useSiteSettings } from '../hooks/useContent';

export default function PrivacyPage() {
  const { content } = usePageContent('privacy');
  const { settings } = useSiteSettings();

  const title = content?.general?.title || 'Kebijakan Privasi';
  const lastUpdated = content?.general?.last_updated || 'Oktober 2026';
  const email = settings.email || 'halo@marryland.id';

  const clauses = content?.clauses?.items || [
    {
      title: '1. Data yang Dikumpulkan',
      content:
        'Kami mengumpulkan beberapa informasi dasar saat kamu mendaftar dan menggunakan layanan kami, termasuk email fotografer, nama studio, nomor WhatsApp kontak, metadata folder Google Drive, serta data aktivitas kurasi foto oleh pihak klien.',
    },
    {
      title: '2. Penyimpanan dan Keamanan Data',
      content:
        'Data pengguna disimpan dengan aman menggunakan infrastruktur Supabase berstandar industri dengan enkripsi pada transmisi data (SSL/TLS) dan penerapan kontrol akses setingkat baris (Row-Level Security / RLS).',
    },
    {
      title: '3. Privasi Akses Google Drive',
      content:
        'Platform kami hanya membaca dan memproses daftar nama foto serta thumbnail dari tautan folder Google Drive yang kamu tentukan. Kami tidak menyalin, menyimpan arsip permanen foto resolusi tinggi, atau membagikan kredensial kamu ke pihak luar.',
    },
    {
      title: '4. Privasi Tautan Album Keluarga dan Proteksi PIN',
      content:
        'Ketika fotografer mengaktifkan fitur Tautan Album Keluarga dengan proteksi PIN, kode PIN tidak disimpan dalam bentuk teks biasa (plain text), melainkan di-hash menggunakan algoritma SHA-256 yang aman. Sistem menerapkan pembatasan percobaan maksimal 5 kali berturut-turut untuk mencegah brute-force.',
    },
    {
      title: '5. Hak Pengguna dan Pembatalan Tautan',
      content:
        `Kamu memiliki kendali penuh atas data dan galeri. Fotografer dapat memperbarui tautan token akses seketika, mengubah pengaturan album, atau menghapus seluruh riwayat kurasi. Untuk permohonan penutupan akun, hubungi kami di ${email}.`,
    },
  ];

  return (
    <LegalLayout>
      <div className="max-w-none">
        <div className="border-b border-garis pb-6 mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-merah mb-2">Dokumen Resmi</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal text-tinta mb-2">{title}</h1>
          <p className="text-tinta-lembut text-xs font-mono">Terakhir diperbarui: {lastUpdated}</p>
        </div>

        {clauses.map((clause: any, idx: number) => (
          <section key={idx} className="mb-8 border-b border-garis/40 pb-6 last:border-b-0">
            <h2 className="text-lg font-serif font-normal mb-3 text-tinta">{clause.title}</h2>
            <p className="text-tinta-lembut leading-relaxed text-sm whitespace-pre-line font-sans">
              {clause.content}
            </p>
          </section>
        ))}
      </div>
    </LegalLayout>
  );
}
