import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import type { Gallery } from '../pages/Dashboard';
import { fetchDriveFolderContents } from '../services/driveApi';

interface Props {
  onGalleryCreated: (gallery: Gallery) => void;
}

function extractFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CreateGalleryForm: React.FC<Props> = ({ onGalleryCreated }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(''); // Text indikator loading

  const [form, setForm] = useState({
    gdrive_folder_url: '',
    max_photos_selectable: 100,
    deadline_date: '',
    highlight_description: '',
    client_email: '',
    client_whatsapp: '',
    allow_download: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const isValid =
    form.gdrive_folder_url.trim() !== '' &&
    form.client_whatsapp.trim() !== '' &&
    form.max_photos_selectable > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;

    setIsLoading(true);
    setError('');
    setSyncStatus('Memvalidasi link folder...');

    const folderId = extractFolderId(form.gdrive_folder_url);
    if (!folderId) {
      setError('Link folder Google Drive tidak valid. Pastikan format URL URL /folders/...');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch file dari Google Drive
      setSyncStatus('Mengambil daftar foto dari Google Drive...');
      const driveFiles = await fetchDriveFolderContents(folderId);

      if (driveFiles.length === 0) {
        throw new Error('Tidak ada file gambar ditemukan di folder Drive tersebut, atau folder tidak publik.');
      }

      // 2. Buat Galeri Baru di DB
      setSyncStatus('Menyimpan informasi galeri...');
      const clientName = 'Klien Baru';
      const clientSlug = slugify(clientName) + '-' + Date.now().toString(36).slice(-4);
      const cleanWa = form.client_whatsapp.replace(/[\s\-\(\)]/g, '');

      const { data: gallery, error: insertError } = await supabase
        .from('galleries')
        .insert({
          user_id: user.id,
          client_name: clientName,
          client_slug: clientSlug,
          gdrive_folder_url: form.gdrive_folder_url.trim(),
          gdrive_folder_id: folderId,
          max_photos_selectable: form.max_photos_selectable,
          deadline_date: form.deadline_date || null,
          highlight_description: form.highlight_description || null,
          client_email: form.client_email || null,
          client_whatsapp: cleanWa,
          allow_download: form.allow_download,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!gallery) throw new Error("Gagal membuat galeri");

      // 3. Simpan foto-foto ke gallery_photos
      setSyncStatus(`Menyinkronkan ${driveFiles.length} foto ke database...`);
      
      const photosToInsert = driveFiles.map((file, index) => ({
        gallery_id: gallery.id,
        gdrive_file_id: file.id,
        filename: file.name,
        thumbnail_url: file.thumbnailUrl,
        order_index: index + 1,
      }));

      // Insert bulk
      const { error: photosError } = await supabase
        .from('gallery_photos')
        .insert(photosToInsert);

      if (photosError) throw photosError;

      // Sukses!
      onGalleryCreated(gallery);
      setForm({
        gdrive_folder_url: '',
        max_photos_selectable: 100,
        deadline_date: '',
        highlight_description: '',
        client_email: '',
        client_whatsapp: '',
        allow_download: false,
      });
      setIsExpanded(false);

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses galeri.");
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-6 text-left hover:bg-primary-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-serif text-lg font-bold text-text">Buat Galeri Baru</span>
        </div>
        <svg
          className={`w-5 h-5 text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Form Body */}
      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 border-t border-primary-100/30 pt-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Google Drive Link */}
          <div>
            <label className="label">
              Link Folder Google Drive{' '}
              <span className="badge-required">WAJIB</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                name="gdrive_folder_url"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={form.gdrive_folder_url}
                onChange={handleChange}
                className="input pl-10"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              Nama klien otomatis diambil dari nama folder. Pastikan folder di-share "Anyone with the link".
            </p>
          </div>

          {/* Two columns: max photos + deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">
                Batas Maksimal Foto{' '}
                <span className="badge-required">WAJIB</span>
              </label>
              <input
                name="max_photos_selectable"
                type="number"
                min={1}
                value={form.max_photos_selectable}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Batas Waktu Klien</label>
              <input
                name="deadline_date"
                type="date"
                value={form.deadline_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Highlight description */}
          <div>
            <label className="label">Deskripsi Highlight</label>
            <textarea
              name="highlight_description"
              placeholder="Tambahkan pesan hangat atau highlight untuk klien (opsional)"
              value={form.highlight_description}
              onChange={handleChange}
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Two columns: email + whatsapp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Email Klien</label>
              <input
                name="client_email"
                type="email"
                placeholder="klien@email.com (opsional)"
                value={form.client_email}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">
                WhatsApp Klien{' '}
                <span className="badge-required">WAJIB</span>
              </label>
              <input
                name="client_whatsapp"
                type="text"
                placeholder="08123456789"
                value={form.client_whatsapp}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Allow download checkbox */}
          <label className="flex items-center gap-3 cursor-pointer group w-max">
            <div className="relative flex items-center justify-center">
              <input
                name="allow_download"
                type="checkbox"
                checked={form.allow_download}
                onChange={handleChange}
                className="peer appearance-none w-5 h-5 border-2 border-primary-200 rounded-md checked:bg-primary checked:border-primary transition-colors cursor-pointer"
              />
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Izinkan klien mengunduh foto</span>
          </label>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`btn-primary px-8 py-2.5 text-sm ${
                !isValid || isLoading ? 'opacity-50 cursor-not-allowed hover:bg-primary hover:shadow-none hover:scale-100' : ''
              }`}
            >
              {isLoading ? (syncStatus || 'Membuat...') : 'Buat Galeri Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGalleryForm;
