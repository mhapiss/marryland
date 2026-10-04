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
      content: 'Kami mengumpulkan beberapa informasi dasar saat kamu mendaftar dan menggunakan layanan kami, termasuk email fotografer, nama studio, nomor WhatsApp, serta data aktivitas pemilihan foto klien.',
    },
    {
      title: '2. Penyimpanan Data',
      content: 'Data pengguna disimpan dengan aman menggunakan infrastruktur Supabase berstandar industri dengan enkripsi pada transmisi data.',
    },
    {
      title: '3. Akses Google Drive',
      content: 'Platform kami hanya membaca dan memproses thumbnail dari tautan folder Google Drive yang kamu berikan tanpa mengunduh atau menyalin file asli secara permanen.',
    },
    {
      title: '4. Hak Pengguna',
      content: `Kamu memiliki hak penuh atas datamu. Kamu dapat meminta akses, koreksi, atau penghapusan data dengan menghubungi kami di ${email}.`,
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
