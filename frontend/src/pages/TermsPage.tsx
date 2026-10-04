// src/pages/TermsPage.tsx
import React from 'react';
import LegalLayout from '../components/LegalLayout';
import { usePageContent } from '../hooks/useContent';

export default function TermsPage() {
  const { content } = usePageContent('terms');

  const title = content?.general?.title || 'Syarat dan Ketentuan';
  const lastUpdated = content?.general?.last_updated || 'Oktober 2026';
  const clauses = content?.clauses?.items || [
    {
      title: '1. Definisi Layanan',
      content:
        'by.marryland adalah platform kurasi dan album foto digital yang dirancang untuk memudahkan fotografer dalam membagikan galeri foto kepada klien dan keluarga mereka tanpa memerlukan akun atau instalasi aplikasi tambahan bagi pihak klien.',
    },
    {
      title: '2. Akun Fotografer dan Tanggung Jawabnya',
      content:
        'Sebagai fotografer yang menggunakan layanan kami, kamu bertanggung jawab atas kerahasiaan kredensial akunmu dan seluruh aktivitas di bawahnya, termasuk pengelolaan tautan galeri dan album yang dibagikan kepada pihak ketiga.',
    },
    {
      title: '3. Penggunaan dan Batasan Teknis Google Drive',
      content:
        'Layanan kami terintegrasi dengan tautan folder Google Drive publik ("Siapa saja yang memiliki link") yang kamu sediakan. Platform hanya membaca metadata nama file dan memuat thumbnail foto melalui CDN Google Drive tanpa memodifikasi atau menghapus file asli di Drive kamu. Ketersediaan pemuatan foto bergantung pada server dan kuota API Google Drive.',
    },
    {
      title: '4. Batas Tanggung Jawab Penyimpanan',
      content:
        'by.marryland tidak menyimpan file foto resolusi tinggi di server publik kami. Kami hanya menyimpan relasi seleksi, catatan kurasi, dan token akses.',
    },
    {
      title: '5. Tautan Album Keluarga dan Proteksi PIN',
      content:
        'Fitur Tautan Album Keluarga menyediakan tautan sekunder ber-token acak 128-bit yang dapat dilengkapi opsi PIN proteksi (4-6 angka) dan batas waktu kedaluwarsa. Perlindungan PIN ini merupakan lapisan pengamanan tingkat aplikasi (application-level protection). Karena folder Google Drive asal berstatus "Siapa saja yang memiliki link", siapa pun yang memegang tautan folder Google Drive asli tetap dapat mengakses file secara mandiri di luar platform kami.',
    },
    {
      title: '6. Pembatalan Tautan dan Hak Akses',
      content:
        'Fotografer dapat kapan saja memperbarui token tautan album, mengubah kode PIN, menonaktifkan album keluarga, atau menghapus galeri secara permanen melalui Dashboard Fotografer.',
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
