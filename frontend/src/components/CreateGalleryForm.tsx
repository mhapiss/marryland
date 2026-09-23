import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import type { Gallery } from '../pages/Dashboard';

interface Props {
  onGalleryCreated: (gallery: Gallery) => void;
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
  const [syncStatus, setSyncStatus] = useState('');

  const [form, setForm] = useState({
    gdrive_url: '',
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

  const extractFolderId = (url: string) => {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) return match[1];
    const idParam = new URL(url).searchParams.get('id');
    return idParam;
  };

  const isValid =
    form.client_whatsapp.trim() !== '' &&
    form.gdrive_url.trim() !== '' &&
    form.max_photos_selectable > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;

    setIsLoading(true);
    setError('');
    
    try {
      const folderId = extractFolderId(form.gdrive_url);
      if (!folderId) {
        throw new Error('Link Google Drive tidak valid. Pastikan format link benar.');
      }

      setSyncStatus('Menghubungkan ke Google Drive...');
      const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
      if (!apiKey) {
        throw new Error('API Key Google Drive belum dikonfigurasi.');
      }

      // 1. Fetch folder name
      const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=name`);
      if (!folderRes.ok) {
        if (folderRes.status === 403 || folderRes.status === 404) {
          throw new Error('Folder belum bisa diakses, pastikan sudah di-share ke "Anyone with the link".');
        }
        throw new Error('Gagal mengambil detail folder dari Google Drive.');
      }
      const folderData = await folderRes.json();
      const clientName = folderData.name || 'Client Folder';

      // 2. Fetch files from Google Drive (dengan pagination agar bisa lebih dari 1000)
      let files: any[] = [];
      let pageToken = '';
      
      do {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=${apiKey}&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime,imageMediaMetadata)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Gagal mengambil isi folder dari Google Drive.');
        }

        const data = await response.json();
        if (data.files) {
          files = [...files, ...data.files];
        }
        pageToken = data.nextPageToken || '';
      } while (pageToken);

      if (files.length === 0) {
        throw new Error('Tidak ada file gambar di dalam folder tersebut.');
      }

      // Sort files by EXIF time taken, or fallback to upload time (oldest first)
      files.sort((a: any, b: any) => {
        const timeA = a.imageMediaMetadata?.time || a.createdTime || '';
        const timeB = b.imageMediaMetadata?.time || b.createdTime || '';
        return new Date(timeA).getTime() - new Date(timeB).getTime();
      });

      // 3. Buat Galeri Baru di DB
      setSyncStatus('Menyimpan informasi galeri...');
      const clientSlug = slugify(clientName) + '-' + Date.now().toString(36).slice(-4);
      const cleanWa = form.client_whatsapp.replace(/[\s\-\(\)]/g, '');

      const { data: gallery, error: insertError } = await supabase
        .from('galleries')
        .insert({
          user_id: user.id,
          client_name: clientName,
          client_slug: clientSlug,
          gdrive_folder_url: form.gdrive_url,
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

      // 4. Insert ke database
      setSyncStatus(`Menyimpan ${files.length} foto ke database...`);
      const photosToInsert = files.map((file: any, index: number) => {
        // Gunakan parameter sz=w800 agar thumbnail ukurannya konsisten
        const thumbUrl = file.thumbnailLink 
          ? file.thumbnailLink.replace(/=s\d+/, '=w800') 
          : `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`;

        return {
          gallery_id: gallery.id,
          gdrive_file_id: file.id,
          filename: file.name,
          thumbnail_url: thumbUrl,
          order_index: index + 1,
        };
      });

      const { error: photosError } = await supabase
        .from('gallery_photos')
        .insert(photosToInsert);

      if (photosError) throw photosError;

      // Sukses!
      onGalleryCreated(gallery);
      setForm({
        gdrive_url: '',
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

      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 border-t border-primary-100/30 pt-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* GDrive URL */}
          <div>
            <label className="label">
              Link Folder Google Drive{' '}
              <span className="badge-required">WAJIB</span>
            </label>
            <input
              name="gdrive_url"
              type="text"
              placeholder="https://drive.google.com/drive/folders/..."
              value={form.gdrive_url}
              onChange={handleChange}
              className="input"
            />
            <p className="text-[11px] text-muted mt-2">
              Nama klien otomatis diambil dari nama folder. Folder harus di-share "Anyone with the link".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">
                Batas Maksimal Pilih{' '}
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
