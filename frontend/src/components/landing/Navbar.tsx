// src/components/landing/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useContent';
import { prefetchRoute } from '../../lib/routeLoaders';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = settings.nav_items && settings.nav_items.length > 0
    ? settings.nav_items.filter((item) => item.visible !== false)
    : [
        { href: '/', label: 'Beranda' },
        { href: '/portofolio', label: 'Portofolio' },
        { href: '/untuk-klien', label: 'Untuk Klien' },
        { href: '/faq', label: 'FAQ' },
        { href: '/kontak', label: 'Kontak' },
      ];

  return (
    <nav
      className={`fixed top-0 w-full z-40 transition-all duration-300 border-double-b ${
        scrolled ? 'bg-kertas/95 backdrop-blur-md py-3.5 shadow-sm' : 'bg-kertas/90 py-5'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 flex justify-between items-center">
        <Link
          to="/"
          className="font-serif text-2xl md:text-3xl font-normal text-tinta tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah rounded-sm px-1 py-0.5 -ml-1 flex items-center gap-2"
        >
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.brand_name} className="h-7 w-auto object-contain" />
          ) : (
            <span>{settings.brand_name || 'by.marryland'}</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => prefetchRoute(link.href)}
                onFocus={() => prefetchRoute(link.href)}
                className={`transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah rounded-sm px-1.5 py-1 ${
                  isActive
                    ? 'text-merah font-bold border-b border-merah'
                    : 'text-tinta hover:text-merah link-vintage'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/login"
            onMouseEnter={() => prefetchRoute('/login')}
            onFocus={() => prefetchRoute('/login')}
            className="border border-tinta/35 text-tinta hover:bg-kertas-tua hover:border-tinta px-5 py-2 rounded-btn font-sans font-medium text-sm normal-case tracking-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-kertas min-h-[44px] flex items-center"
          >
            Masuk
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-tinta p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2 transition-colors duration-150"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-6 h-6 stroke-[1.5]" />
        </button>
      </div>

      {/* Full-Screen Mobile Menu (Latar Marun, Tautan Display Besar) */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-marun text-kertas flex flex-col justify-between p-6 sm:p-10 animate-fade-in"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between border-b border-kertas/15 pb-6">
            <span className="font-serif text-2xl font-normal text-kertas">
              {settings.brand_name || 'by.marryland'}
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-kertas hover:text-merah transition-colors duration-150 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kertas"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-7 h-7 stroke-[1.5]" />
            </button>
          </div>

          {/* Links Display */}
          <div className="flex flex-col gap-5 my-auto">
            {navLinks.map((link, idx) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-serif text-3xl sm:text-4xl transition-colors py-2 flex items-baseline gap-4 ${
                    isActive ? 'text-kertas italic font-bold' : 'text-kertas/80 hover:text-kertas'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="font-mono text-xs text-kertas/50">№ 0{idx + 1}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              to="/login"
              className="font-serif text-3xl sm:text-4xl text-kertas/60 hover:text-kertas transition-colors py-2 flex items-baseline gap-4 mt-2 pt-4 border-t border-kertas/15"
              onClick={() => setMobileOpen(false)}
            >
              <span className="font-mono text-xs text-kertas/40">№ 0{navLinks.length + 1}</span>
              <span>Masuk Fotografer</span>
            </Link>
          </div>

          {/* Footer Modal */}
          <div className="border-t border-kertas/15 pt-6 text-xs text-kertas/60 flex items-center justify-between">
            <span className="label-caps tracking-[0.14em]">Kurasi Dokumentasi Editorial</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      )}
    </nav>
  );
}