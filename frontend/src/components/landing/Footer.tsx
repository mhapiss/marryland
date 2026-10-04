// src/components/landing/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useContent';

interface FooterProps {
  contactData?: any;
  footerData?: any;
}

export function Footer({ contactData, footerData }: FooterProps) {
  const { settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  const brandName = settings.brand_name || 'by.marryland';
  const statement =
    settings.footer_statement ||
    'Studio kurasi dokumentasi pernikahan dan perhelatan keluarga dengan pendekatan editorial dan penghormatan tulus pada tradisi.';
  const copyrightText =
    footerData?.text || `© ${currentYear} ${brandName}. Seluruh hak cipta dilindungi.`;

  const email = settings.email || contactData?.email;
  const whatsapp = settings.whatsapp_number || contactData?.whatsapp;
  const instagram = settings.instagram || contactData?.instagram;

  return (
    <footer className="bg-marun text-kertas pt-16 md:pt-24 pb-8 px-5 sm:px-8 md:px-12 border-t border-marun relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Statement Section */}
        <div className="mb-14 pb-12 border-b border-kertas/15 grid grid-cols-1 lg:grid-cols-12 gap-8 items-baseline">
          <div className="lg:col-span-4">
            <span className="label-caps text-kertas/60 tracking-[0.14em]">FALSAFAH &amp; PENDEKATAN</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-serif text-xl sm:text-2xl md:text-3xl text-kertas leading-snug font-normal">
              &ldquo;{statement}&rdquo;
            </p>
          </div>
        </div>

        {/* 4 Kolom Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link
              to="/"
              className="text-2xl font-serif font-normal text-kertas tracking-tight inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kertas rounded-sm"
            >
              {brandName}
            </Link>
            <p className="font-body text-xs text-kertas/60 leading-relaxed max-w-xs">
              Kurasi visual berstandar editorial dan penghormatan tulus pada tradisi perhelatan keluarga.
            </p>
          </div>

          {/* Kolom 1: Halaman */}
          <div>
            <h4 className="label-caps text-kertas/80 mb-5 font-bold">
              Halaman
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/portofolio" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Portofolio Adat
                </Link>
              </li>
              <li>
                <Link to="/untuk-klien" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Untuk Klien
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Simulasi Galeri
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Tanya Jawab (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Legal & Akun */}
          <div>
            <h4 className="label-caps text-kertas/80 mb-5 font-bold">
              Informasi
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/kontak" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Hubungi Studio
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Syarat &amp; Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/kebijakan-privasi" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-kertas/70 hover:text-kertas transition-colors link-vintage">
                  Masuk Fotografer
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak Langsung */}
          <div>
            <h4 className="label-caps text-kertas/80 mb-5 font-bold">
              Kontak
            </h4>
            <ul className="space-y-2.5 text-sm">
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="text-kertas/70 hover:text-kertas transition-colors link-vintage truncate block"
                  >
                    {email}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kertas/70 hover:text-kertas transition-colors link-vintage block"
                  >
                    WhatsApp Studio
                  </a>
                </li>
              )}
              {instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kertas/70 hover:text-kertas transition-colors link-vintage block"
                  >
                    Instagram @{instagram.replace('@', '')}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 border-t border-kertas/15 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-kertas/50">
          <p>{copyrightText}</p>
          <p className="font-mono text-[11px] tracking-wider uppercase">Dokumentasi Visual Editorial</p>
        </div>
      </div>

      {/* Nama Merek Raksasa Terpotong di Tepi Bawah (Watermark Editorial) */}
      <div className="mt-12 overflow-hidden select-none pointer-events-none -mb-6 md:-mb-12">
        <p className="font-serif text-[18vw] leading-[0.72] text-kertas/[0.06] tracking-tight uppercase whitespace-nowrap text-center">
          {brandName}
        </p>
      </div>
    </footer>
  );
}