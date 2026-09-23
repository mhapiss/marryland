import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const ACCENT_COLORS = [
  { name: 'Sage Green', value: '#6B8F71' },
  { name: 'Emerald Soft', value: '#486B4E' },
  { name: 'Dusty Rose', value: '#C08497' },
  { name: 'Champagne Gold', value: '#BFA06A' },
  { name: 'Dusty Blue', value: '#6B8CAE' },
  { name: 'Terracotta', value: '#C06B52' },
];

const StudioSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    studio_name: '',
    studio_slug: '',
    whatsapp_number: '',
    accent_color: '#6B8F71',
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setForm({
        studio_name: user.user_metadata.studio_name || '',
        studio_slug: user.user_metadata.studio_slug || '',
        whatsapp_number: user.user_metadata.whatsapp_number || '',
        accent_color: user.user_metadata.accent_color || '#BFA06A',
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
      setMessage('File terlalu besar. Maksimal 2MB.');
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
    setMessage('');

    let logoUrlToSave = user.user_metadata?.studio_logo || '';

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logos/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) {
        setIsLoading(false);
        setMessage('Gagal mengupload logo: ' + uploadError.message);
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
      setMessage('Gagal menyimpan: ' + error.message);
    } else {
      setMessage('Identitas studio berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);

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
    <div className="card p-8">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold text-text">Identitas Studio</h2>
        <p className="text-muted text-sm mt-1">Branding ini akan ditampilkan di halaman seleksi klien kamu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-3 ${message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message.includes('berhasil') ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Nama Studio */}
        <div>
          <label className="label">Nama Studio</label>
          <input
            name="studio_name"
            type="text"
            placeholder="by.marryland photography"
            value={form.studio_name}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* Nama Studio di Link */}
        <div>
          <label className="label">Nama Studio di Link</label>
          <div className="flex items-center">
            <span className="bg-background border border-primary-100 border-r-0 px-4 py-3 rounded-l-xl text-muted text-sm shrink-0 font-mono">
              by-marryland.app/
            </span>
            <input
              name="studio_slug"
              type="text"
              placeholder="slug-studio"
              value={form.studio_slug}
              onChange={handleChange}
              className="input rounded-l-none"
            />
          </div>
        </div>

        {/* Logo Studio */}
        <div>
          <label className="label mb-2">Logo Studio</label>
          <div className="flex items-center gap-5">
            {logoPreview ? (
              <div className="w-20 h-20 bg-background rounded-2xl border border-primary-100/50 p-2 shadow-sm">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center text-muted border border-dashed border-primary-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            )}
            <div>
              <label className="inline-flex items-center justify-center bg-white border border-primary-100 text-text text-sm px-5 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary transition-colors font-medium cursor-pointer">
                Upload Logo
                <input type="file" accept="image/png" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[11px] text-muted mt-2">Format PNG transparan, maksimal 2MB.</p>
            </div>
          </div>
        </div>

        {/* Nomor WhatsApp */}
        <div>
          <label className="label">Nomor WhatsApp</label>
          <input
            name="whatsapp_number"
            type="text"
            placeholder="08123456789 atau 628123456789"
            value={form.whatsapp_number}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* Warna Aksen */}
        <div>
          <label className="label mb-3">Warna Aksen Galeri</label>
          <div className="flex gap-4 flex-wrap bg-background p-4 rounded-xl border border-primary-100/30">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, accent_color: color.value }))}
                className="group flex flex-col items-center gap-2"
                title={color.name}
              >
                <div 
                  className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
                    form.accent_color === color.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-md'
                      : 'hover:scale-110 hover:shadow-sm'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {form.accent_color === color.value && (
                    <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-primary-100/30">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full sm:w-auto px-10"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Identitas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudioSettings;
