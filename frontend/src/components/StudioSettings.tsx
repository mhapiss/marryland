import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';

const ACCENT_COLORS = [
  { name: 'Merah Vintage', value: '#9B2C24' },
  { name: 'Marun Tua', value: '#3A0F0D' },
  { name: 'Merah Spidol', value: '#C93A2E' },
  { name: 'Hijau Zaitun', value: '#2D4A27' },
  { name: 'Arang Klasik', value: '#201515' },
  { name: 'Emas Kuno', value: '#A8824B' },
];

const StudioSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    studio_name: '',
    studio_slug: '',
    whatsapp_number: '',
    accent_color: '#9B2C24',
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setForm({
        studio_name: user.user_metadata.studio_name || '',
        studio_slug: user.user_metadata.studio_slug || '',
        whatsapp_number: user.user_metadata.whatsapp_number || '',
        accent_color: user.user_metadata.accent_color || '#9B2C24',
      });
    }
  }, [user]);

  // ─── Multi-tab sync: listen for studio settings changes from other tabs ───
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('studio-settings-sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STUDIO_SETTINGS_UPDATED') {
          const { studio_name, studio_slug, whatsapp_number, accent_color } = event.data.data;
          setForm({ studio_name, studio_slug, whatsapp_number, accent_color });
        }
      };
      return () => bc.close();
    } catch (_) {
      // BroadcastChannel not supported
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'studio_slug') {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setForm((prev) => ({ ...prev, studio_slug: cleaned }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 2MB.');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    let logoUrlToSave = user.user_metadata?.studio_logo || '';

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logos/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) {
        setIsLoading(false);
        toast.error('Gagal mengupload logo: ' + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);
        
      logoUrlToSave = publicUrl;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        studio_name: form.studio_name,
        studio_slug: form.studio_slug,
        whatsapp_number: form.whatsapp_number,
        accent_color: form.accent_color,
        studio_logo: logoUrlToSave,
      },
    });

    setIsLoading(false);
    if (error) {
      toast.error(TOAST.settingsSaveFail + (error.message ? `: ${error.message}` : ''));
    } else {
      toast.success(TOAST.settingsSaveSuccess);

      // Broadcast studio settings change to other tabs for instant sync
      try {
        const bc = new BroadcastChannel('studio-settings-sync');
        bc.postMessage({
          type: 'STUDIO_SETTINGS_UPDATED',
          data: {
            studio_name: form.studio_name,
            studio_slug: form.studio_slug,
            whatsapp_number: form.whatsapp_number,
            accent_color: form.accent_color,
            studio_logo: logoUrlToSave,
          },
        });
        bc.close();
      } catch (_) {
        // BroadcastChannel not supported in some environments
      }
    }
  };

  return (
    <div className="bg-white border border-garis rounded-[2px] p-8 font-sans text-tinta">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-normal text-tinta">Identitas Studio</h2>
        <p className="text-tinta-lembut text-xs mt-1">Branding ini akan ditampilkan di galeri seleksi klien kamu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nama Studio */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Nama Studio</label>
          <input
            name="studio_name"
            type="text"
            placeholder="Contoh: Sanggar Foto Marryland"
            value={form.studio_name}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
          />
        </div>

        {/* Nama Studio di Link */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Nama Studio di Link</label>
          <div className="flex items-center">
            <span className="bg-kertas border border-garis border-r-0 px-3.5 py-2.5 rounded-l-[2px] text-tinta-lembut text-xs shrink-0 font-mono">
              by-marryland.app/
            </span>
            <input
              name="studio_slug"
              type="text"
              placeholder="slug-studio"
              value={form.studio_slug}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-r-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
            />
          </div>
        </div>

        {/* Logo Studio */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-2">Logo Studio</label>
          <div className="flex items-center gap-5">
            {logoPreview ? (
              <div className="w-20 h-20 bg-kertas rounded-[2px] border border-garis p-2">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-kertas rounded-[2px] flex items-center justify-center text-tinta-lembut border border-dashed border-garis">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            )}
            <div>
              <label className="inline-flex items-center justify-center bg-white border border-garis text-tinta text-xs px-4 py-2 rounded-[2px] hover:border-merah hover:text-merah transition-colors font-medium cursor-pointer">
                Unggah Logo
                <input type="file" accept="image/png" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[11px] text-tinta-lembut mt-1.5 font-mono">Format PNG transparan, maksimal 2MB.</p>
            </div>
          </div>
        </div>

        {/* Nomor WhatsApp */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Nomor WhatsApp</label>
          <input
            name="whatsapp_number"
            type="text"
            placeholder="08123456789 atau 628123456789"
            value={form.whatsapp_number}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
          />
        </div>

        {/* Warna Aksen */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-2">Warna Aksen Galeri Klien</label>
          <div className="flex gap-4 flex-wrap bg-kertas p-4 rounded-[2px] border border-garis">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, accent_color: color.value }))}
                className="group flex flex-col items-center gap-1.5"
                title={color.name}
              >
                <div 
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                    form.accent_color === color.value
                      ? 'ring-2 ring-offset-2 ring-merah scale-110 shadow-sm'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {form.accent_color === color.value && (
                    <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  )}
                </div>
                <span className="text-[10px] font-mono text-tinta-lembut">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-garis">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-2.5 bg-merah hover:bg-merah-hover text-white text-sm font-medium rounded-[2px] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Identitas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudioSettings;
