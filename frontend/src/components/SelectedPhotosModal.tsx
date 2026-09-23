// src/components/SelectedPhotosModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Gallery } from '../pages/Dashboard';

interface PhotoSelection {
  id: string;
  gallery_photo_id: string;
  selection_order: number;
  selected_at: string;
  filename: string;
}

interface Props {
  gallery: Gallery;
  onClose: () => void;
}

const SelectedPhotosModal: React.FC<Props> = ({ gallery, onClose }) => {
  const [photos, setPhotos] = useState<PhotoSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<false | 'newline' | 'comma'>(false);

  useEffect(() => {
    fetchSelectedPhotos();
  }, [gallery.id]);

  const fetchSelectedPhotos = async () => {
    setLoading(true);
    // Join photo_selections with gallery_photos to get filenames
    const { data, error } = await supabase
      .from('photo_selections')
      .select(`
        id,
        gallery_photo_id,
        selection_order,
        selected_at,
        gallery_photos (filename)
      `)
      .eq('gallery_id', gallery.id)
      .order('selection_order', { ascending: true });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        gallery_photo_id: item.gallery_photo_id,
        selection_order: item.selection_order,
        selected_at: item.selected_at,
        filename: item.gallery_photos?.filename || 'Unknown',
      }));
      setPhotos(mapped);
    }
    setLoading(false);
  };

  const fileListNewline = photos.map((p) => p.filename).join('\n');
  const fileListComma = photos.map((p) => p.filename.replace(/\.[^/.]+$/, '')).join(', ');

  const handleCopy = (type: 'newline' | 'comma') => {
    const textToCopy = type === 'comma' ? fileListComma : fileListNewline;
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([fileListNewline], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gallery.client_name.replace(/\s+/g, '_')}_foto_pilihan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-text">Daftar Foto Terpilih</h3>
          <p className="text-sm text-gray-500 mt-1">
            {photos.length} foto dipilih klien — urut sesuai urutan mereka memilih
          </p>
        </div>

        {/* Photo list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Memuat daftar foto...</div>
          ) : photos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Belum ada foto yang dipilih klien.</div>
          ) : (
            <div className="space-y-1.5">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary text-xs font-bold rounded-full shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-text font-mono">
                    {photo.filename.replace(/\.[^/.]+$/, '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={() => handleCopy('comma')}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            {copied === 'comma' ? '✓ Tersalin' : 'Copy utk Lightroom'}
          </button>
          <button
            onClick={handleDownloadTxt}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Download .txt
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedPhotosModal;
