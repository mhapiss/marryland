// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-kertas text-tinta flex flex-col justify-between p-6 sm:p-12 md:p-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-garis pb-6 max-w-[1200px] w-full mx-auto">
        <Link to="/" className="font-serif text-2xl text-tinta font-normal tracking-tight">
          by.marryland
        </Link>
        <span className="label-caps text-tinta-lembut">LEMBAR KONTAK / 404</span>
      </div>

      {/* Main Content */}
      <div className="max-w-[720px] w-full mx-auto my-auto py-12 text-center flex flex-col items-center">
        {/* Contact Sheet Frame Illustration */}
        <div className="w-64 sm:w-80 bg-tinta text-kertas p-4 sm:p-6 rounded-sm mb-8 shadow-sm">
          {/* Film Edge / Sprockets */}
          <div className="flex justify-between items-center text-[10px] font-mono text-kertas/60 mb-3 border-b border-kertas/20 pb-2">
            <span>KODAK SAFETY FILM</span>
            <span>№ 404 &bull; 36 EXP</span>
          </div>

          {/* Empty Frame with Red Marker 'X' */}
          <div className="aspect-[4/3] bg-kertas-tua border border-tinta/40 relative flex items-center justify-center overflow-hidden">
            {/* Red Marker Cross */}
            <svg
              className="w-24 h-24 text-merah-tanda stroke-[2.5] opacity-90"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
            >
              <line x1="20" y1="20" x2="80" y2="80" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" strokeLinecap="round" />
            </svg>
            <span className="absolute bottom-2 right-2 font-mono text-[9px] text-tinta-lembut uppercase tracking-wider">
              [ FRAME KOSONG ]
            </span>
          </div>

          {/* Bottom Film Numbers */}
          <div className="flex justify-between items-center text-[10px] font-mono text-kertas/60 mt-3 border-t border-kertas/20 pt-2">
            <span>&bull; &bull; &bull;</span>
            <span>FRAME 404A</span>
            <span>&bull; &bull; &bull;</span>
          </div>
        </div>

        {/* Text */}
        <span className="font-mono text-xs text-merah font-semibold mb-2">№ 404 &mdash; TIDAK DITEMUKAN</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-tinta font-normal tracking-tight mb-4">
          Frame Ini Tidak Terekam
        </h1>
        <p className="font-body text-base text-tinta-lembut max-w-md mx-auto mb-8">
          Halaman yang kamu cari mungkin telah dipindahkan, tautan tidak lengkap, atau dokumen visual ini belum dipublikasikan.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-merah text-kertas px-6 py-3 rounded-sm font-medium text-sm hover:bg-marun transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            to="/portofolio"
            className="inline-flex items-center gap-2 border border-tinta/30 text-tinta px-6 py-3 rounded-sm font-medium text-sm hover:bg-tinta hover:text-kertas transition-colors"
          >
            <span>Buka Portofolio</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-garis pt-6 max-w-[1200px] w-full mx-auto flex items-center justify-between text-xs text-tinta-lembut">
        <span>by.marryland &bull; Studio Kurasi Visual Editorial</span>
        <span className="font-mono text-[11px]">Koleksi &bull; Seleksi &bull; Cetak</span>
      </div>
    </div>
  );
}
