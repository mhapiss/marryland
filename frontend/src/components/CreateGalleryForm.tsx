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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    client_name: '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const isValid =
    form.client_name.trim() !== '' &&
    form.client_whatsapp.trim() !== '' &&
    form.max_photos_selectable > 0 &&
    selectedFiles.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;

    setIsLoading(true);
    setError('');
    
    try {
      // 1. Buat Galeri Baru di DB
      setSyncStatus('Menyimpan informasi galeri...');
      const clientSlug = slugify(form.client_name) + '-' + Date.now().toString(36).slice(-4);
      const cleanWa = form.client_whatsapp.replace(/[\s\-\(\)]/g, '');

      const { data: gallery, error: insertError } = await supabase
        .from('galleries')
        .insert({
          user_id: user.id,
          client_name: form.client_name,
          client_slug: clientSlug,
          gdrive_folder_url: '-', // tidak dipakai lagi
          gdrive_folder_id: '-', // tidak dipakai lagi
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

      // 2. Upload File ke Supabase Storage & Simpan URL
      setSyncStatus(`Mengunggah ${selectedFiles.length} foto... Jangan tutup halaman ini.`);
      
      const photosToInsert = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${gallery.id}/${Date.now()}-${i}.${fileExt}`;
        
        // Upload
        const { error: uploadError } = await supabase.storage
          .from('galleries')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage.from('galleries').getPublicUrl(filePath);

        photosToInsert.push({
          gallery_id: gallery.id,
          gdrive_file_id: filePath, // kita simpan pathnya di sini
          filename: file.name,
          thumbnail_url: publicUrl,
          order_index: i + 1,
        });
      }

      // 3. Insert ke database
      setSyncStatus('Menyelesaikan galeri...');
      const { error: photosError } = await supabase
        .from('gallery_photos')
        .insert(photosToInsert);

      if (photosError) throw photosError;

      // Sukses!
      onGalleryCreated(gallery);
      setForm({
        client_name: '',
        max_photos_selectable: 100,
        deadline_date: '',
        highlight_description: '',
        client_email: '',
        client_whatsapp: '',
        allow_download: false,
      });
      setSelectedFiles([]);
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
          <span className="font-serif text-lg font-bold text-text">Buat Galeri Baru (Upload Langsung)</span>
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

          {/* Nama Klien */}
          <div>
            <label className="label">
              Nama Klien / Acara{' '}
              <span className="badge-required">WAJIB</span>
            </label>
            <input
              name="client_name"
              type="text"
              placeholder="Contoh: Budi & Ani Wedding"
              value={form.client_name}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="label">
              Pilih Foto Galeri{' '}
              <span className="badge-required">WAJIB</span>
            </label>
            <div className="border-2 border-dashed border-primary-200 rounded-xl p-6 text-center hover:bg-primary-50/50 transition-colors relative">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <svg className="w-8 h-8 text-primary/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <p className="text-sm font-medium text-text">Klik atau seret foto ke sini</p>
              <p className="text-xs text-muted mt-1">{selectedFiles.length > 0 ? `${selectedFiles.length} foto terpilih` : 'Mendukung format JPG, PNG (maksimal 5MB/foto untuk demo)'}</p>
            </div>
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
