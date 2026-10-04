import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import { parseDriveFolder } from '../lib/drive';
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

  const isValid =
    form.client_whatsapp.trim() !== '' &&
    form.gdrive_url.trim() !== '' &&
    form.max_photos_selectable > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;

    setIsLoading(true);
    
    try {
      const folderId = parseDriveFolder(form.gdrive_url);
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

      const BATCH_SIZE = 500;
      for (let i = 0; i < photosToInsert.length; i += BATCH_SIZE) {
        const chunk = photosToInsert.slice(i, i + BATCH_SIZE);
        const { error: photosError } = await supabase
          .from('gallery_photos')
          .insert(chunk);

        if (photosError) throw photosError;
      }

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
      toast.success(TOAST.galleryCreateSuccess);

    } catch (err: any) {
      toast.error(err.message || TOAST.galleryCreateFail);
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="bg-white border border-garis rounded-[2px] overflow-hidden font-sans text-tinta">
      <button
        className="w-full flex items-center justify-between p-6 text-left hover:bg-kertas transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-kertas-tua text-merah border border-garis flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-serif text-lg font-normal text-tinta">Buat Galeri Baru</span>
        </div>
        <svg
          className={`w-4 h-4 text-tinta-lembut transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 border-t border-garis pt-5">

          {/* GDrive URL */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
              Tautan Folder Google Drive{' '}
              <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5">WAJIB</span>
            </label>
            <input
              name="gdrive_url"
              type="text"
              placeholder="https://drive.google.com/drive/folders/..."
              value={form.gdrive_url}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
            />
            <p className="text-[11px] text-tinta-lembut mt-1.5 font-mono">
              Nama klien diambil otomatis dari nama folder. Pastikan izin berbagi folder: "Siapa saja yang memiliki link".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
                Batas Maksimal Pilih{' '}
                <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5">WAJIB</span>
              </label>
              <input
                name="max_photos_selectable"
                type="number"
                min={1}
                value={form.max_photos_selectable}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Tenggat Waktu Klien</label>
              <input
                name="deadline_date"
                type="date"
                value={form.deadline_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Deskripsi / Catatan Pembuka</label>
            <textarea
              name="highlight_description"
              placeholder="Tambahkan pesan hangat atau petunjuk seleksi untuk klien (opsional)"
              value={form.highlight_description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Email Klien</label>
              <input
                name="client_email"
                type="email"
                placeholder="klien@email.com (opsional)"
                value={form.client_email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
                WhatsApp Klien{' '}
                <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5">WAJIB</span>
              </label>
              <input
                name="client_whatsapp"
                type="text"
                placeholder="08123456789"
                value={form.client_whatsapp}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group w-max">
            <input
              name="allow_download"
              type="checkbox"
              checked={form.allow_download}
              onChange={handleChange}
              className="w-4 h-4 accent-merah rounded-[2px] cursor-pointer"
            />
            <span className="text-xs text-tinta-lembut group-hover:text-tinta transition-colors">Izinkan klien mengunduh foto pilihan</span>
          </label>

          <div className="flex justify-end pt-4 border-t border-garis">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="px-8 py-2.5 bg-merah hover:bg-merah-hover text-white text-sm font-medium rounded-[2px] transition-colors disabled:opacity-50"
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
