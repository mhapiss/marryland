// src/pages/MemoryAlbum.tsx
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const MemoryAlbum: React.FC = () => {
  const { client_slug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif text-text font-bold mb-2">Album Kenangan</h1>
        <p className="text-gray-500 text-sm mb-6">
          Album: <span className="font-medium text-text">{client_slug}</span>
          {token && <span className="text-xs text-gray-400 ml-2">(token terverifikasi)</span>}
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-primary font-medium">🚧 Halaman ini sedang dibangun</p>
          <p className="text-xs text-gray-500 mt-1">Album digital bergaya majalah dengan cover, chapters, dan PIN akan segera hadir.</p>
        </div>
      </div>
    </div>
  );
};

export default MemoryAlbum;
