import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/constants';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-merah hover:text-merah-hover font-medium mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke beranda
        </Link>
        {children}
        <div className="mt-16 pt-8 border-t border-garis text-center text-xs text-tinta-lembut font-sans">
          &copy; {new Date().getFullYear()} {APP_NAME}. Dokumen hukum dan ketentuan layanan.
        </div>
      </div>
    </div>
  );
}
