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
      content: 'by.marryland adalah platform seleksi foto digital yang dirancang untuk memudahkan fotografer dalam membagikan galeri foto kepada klien mereka.',
    },
    {
      title: '2. Akun Fotografer dan Tanggung Jawabnya',
      content: 'Sebagai fotografer yang menggunakan layanan kami, kamu bertanggung jawab atas keamanan akunmu dan seluruh aktivitas di bawahnya.',
    },
    {
      title: '3. Penggunaan Google Drive',
      content: 'Layanan kami terintegrasi dengan tautan folder Google Drive yang kamu sediakan. Platform hanya mengakses thumbnail tanpa memodifikasi file asli.',
    },
    {
      title: '4. Batas Tanggung Jawab',
      content: 'by.marryland tidak menyimpan file foto resolusi tinggi di server publik. Kami hanya memproses seleksi dan thumbnail.',
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
            <p className="text-tinta-lembut leading-relaxed text-sm whitespace-pre-line font-sans">{clause.content}</p>
          </section>
        ))}
      </div>
    </LegalLayout>
  );
}
