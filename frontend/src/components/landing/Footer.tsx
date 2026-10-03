import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  isDarkMode: boolean;
  textSub: string;
}

export function Footer({ isDarkMode, textSub }: FooterProps) {
  return (
    <footer className={`border-t py-12 ${isDarkMode ? 'border-[#2A3D2D]' : 'border-primary-100/40'}`}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold tracking-tight">by.<span className="text-primary">marryland</span></span>
          <span className={`text-xs ${textSub}`}>· Album Kenangan Digital</span>
        </div>
        <div className={`flex items-center space-x-6 text-sm ${textSub}`}>
          <Link to="/syarat-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
          <Link to="/kebijakan-privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
          <Link to="/kontak" className="hover:text-primary transition-colors">Kontak</Link>
        </div>
        <p className={`text-xs ${textSub}`}>© {new Date().getFullYear()} by.marryland. All rights reserved.</p>
      </div>
    </footer>
  );
}
