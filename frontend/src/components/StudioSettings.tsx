import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import {
  DEFAULT_MAIN_TEMPLATE,
  DEFAULT_ALBUM_SECTION,
  TEMPLATE_VARIABLES,
  validateTemplate,
  formatClientMessage,
} from '../lib/messageTemplate';
import { AlertCircle, RotateCcw, Eye, MessageSquare, Check, Sparkles } from 'lucide-react';

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

  // Message Template States
  const [mainTemplate, setMainTemplate] = useState(DEFAULT_MAIN_TEMPLATE);
  const [albumTemplate, setAlbumTemplate] = useState(DEFAULT_ALBUM_SECTION);
  const [activeFocus, setActiveFocus] = useState<'main' | 'album'>('main');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setForm({
        studio_name: user.user_metadata.studio_name || '',
        studio_slug: user.user_metadata.studio_slug || '',
        whatsapp_number: user.user_metadata.whatsapp_number || '',
        accent_color: user.user_metadata.accent_color || '#9B2C24',
      });
      if (user.user_metadata.message_template_main) {
        setMainTemplate(user.user_metadata.message_template_main);
      }
      if (user.user_metadata.message_template_album) {
        setAlbumTemplate(user.user_metadata.message_template_album);
      }
    }
  }, [user]);

  // Multi-tab sync
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('studio-settings-sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STUDIO_SETTINGS_UPDATED') {
          const {
            studio_name,
            studio_slug,
            whatsapp_number,
            accent_color,
            message_template_main,
            message_template_album,
          } = event.data.data;
          setForm({ studio_name, studio_slug, whatsapp_number, accent_color });
          if (message_template_main) setMainTemplate(message_template_main);
          if (message_template_album) setAlbumTemplate(message_template_album);
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

  // Insert variable into the focused template
  const insertVariable = (variableKey: string) => {
    if (activeFocus === 'main') {
      setMainTemplate((prev) => prev + ' ' + variableKey);
    } else {
      setAlbumTemplate((prev) => prev + ' ' + variableKey);
    }
  };

  // Reset templates to default
  const handleResetTemplates = () => {
    setMainTemplate(DEFAULT_MAIN_TEMPLATE);
    setAlbumTemplate(DEFAULT_ALBUM_SECTION);
    toast.info('Template pesan dikembalikan ke teks awal bawaan.');
  };

  // Validation
  const mainValidation = validateTemplate(mainTemplate, false);
  const albumValidation = validateTemplate(albumTemplate, true);
  const hasTemplateWarnings =
    mainValidation.warnings.length > 0 || albumValidation.warnings.length > 0;

  // Sample data for preview
  const sampleVars = {
    nama_klien: 'Aditya & Ratna',
    nama_galeri: 'Pernikahan Aditya & Ratna',
    nama_fotografer: user?.user_metadata?.full_name || 'Tim Fotografi',
    nama_studio: form.studio_name || 'by.marryland',
    link_pilih: `${window.location.origin}/g/aditya-ratna-8k9q2m7p`,
    link_album: `${window.location.origin}/album/aditya-ratna-8k9q2m7p?t=a8f09bc12de88f01`,
    batas_pilihan: '50 foto',
    batas_waktu: '24 Oktober 2026',
  };

  const previewText = formatClientMessage(mainTemplate, albumTemplate, sampleVars, true);

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

      const {
        data: { publicUrl },
      } = supabase.storage.from('portfolio').getPublicUrl(fileName);

      logoUrlToSave = publicUrl;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        studio_name: form.studio_name,
        studio_slug: form.studio_slug,
        whatsapp_number: form.whatsapp_number,
        accent_color: form.accent_color,
        studio_logo: logoUrlToSave,
        message_template_main: mainTemplate,
        message_template_album: albumTemplate,
      },
    });

    setIsLoading(false);
    if (error) {
      toast.error(TOAST.settingsSaveFail + (error.message ? `: ${error.message}` : ''));
    } else {
      toast.success(TOAST.settingsSaveSuccess);

      // Broadcast to other tabs
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
            message_template_main: mainTemplate,
            message_template_album: albumTemplate,
          },
        });
        bc.close();
      } catch (_) {
        // BroadcastChannel not supported
      }
    }
  };

  return (
    <div className="bg-white border border-garis rounded-panel p-6 sm:p-8 font-sans text-tinta">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-normal text-tinta">Identitas Studio</h2>
        <p className="text-tinta-lembut text-xs mt-1">
          Branding dan template pesan ini akan dipakai saat mengirim galeri ke klien.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Row 1: Nama Studio */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
            Nama Studio
          </label>
          <input
            name="studio_name"
            type="text"
            placeholder="Contoh: Sanggar Foto Marryland"
            value={form.studio_name}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
          />
        </div>

        {/* Row 2: Nama Studio di Link */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
            Nama Studio di Link
          </label>
          <div className="flex items-center">
            <span className="bg-kertas border border-garis border-r-0 px-3.5 py-2.5 rounded-l-input text-tinta-lembut text-xs shrink-0 font-mono">
              by-marryland.app/
            </span>
            <input
              name="studio_slug"
              type="text"
              placeholder="slug-studio"
              value={form.studio_slug}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-r-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
            />
          </div>
        </div>

        {/* Row 3: Logo Studio */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-2">
            Logo Studio
          </label>
          <div className="flex items-center gap-5">
            {logoPreview ? (
              <div className="w-20 h-20 bg-kertas rounded-input border border-garis p-2">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-kertas rounded-input flex items-center justify-center text-tinta-lembut border border-dashed border-garis">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            <div>
              <label className="inline-flex items-center justify-center bg-white border border-garis text-tinta text-xs px-4 py-2.5 rounded-btn hover:border-merah hover:text-merah transition-colors font-medium cursor-pointer min-h-[44px]">
                Unggah Logo
                <input type="file" accept="image/png" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[11px] text-tinta-lembut mt-1.5 font-mono">
                Format PNG transparan, maksimal 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Row 4: Nomor WhatsApp */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
            Nomor WhatsApp Studio
          </label>
          <input
            name="whatsapp_number"
            type="text"
            placeholder="08123456789 atau 628123456789"
            value={form.whatsapp_number}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
          />
        </div>

        {/* Row 5: Warna Aksen */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-2">
            Warna Aksen Galeri Klien
          </label>
          <div className="flex gap-4 flex-wrap bg-kertas p-4 rounded-input border border-garis">
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
                    <svg
                      className="w-3.5 h-3.5 text-white drop-shadow-sm"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-mono text-tinta-lembut">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-garis pt-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-serif text-xl font-normal text-tinta flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-merah" />
                Template Pesan WhatsApp Klien
              </h3>
              <p className="text-tinta-lembut text-xs mt-1">
                Pesan ini otomatis dirakit saat Anda menekan tombol "Kirim ke Klien".
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs px-3.5 py-2 bg-kertas hover:bg-kertas-tua border border-garis text-tinta rounded-btn font-sans font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Eye className="w-3.5 h-3.5 text-merah" />
                {showPreview ? 'Sembunyikan Pratinjau' : 'Pratinjau Contoh'}
              </button>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="text-xs px-3.5 py-2 bg-white hover:bg-kertas border border-garis text-tinta-lembut hover:text-merah rounded-btn font-sans font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Bawaan
              </button>
            </div>
          </div>

          {/* Variable Chips */}
          <div className="bg-kertas-tua/40 p-4 border border-garis rounded-panel mb-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-tinta-lembut block mb-2 font-semibold">
              Sisipkan Variabel (Klik untuk menambahkan ke bagian aktif):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1.5 bg-white hover:bg-merah/10 hover:border-merah/30 border border-garis text-tinta text-xs font-mono rounded-chip transition-colors flex items-center gap-1 group"
                  title={v.desc}
                >
                  <span className="text-merah font-bold">+</span>
                  <span>{v.key}</span>
                  <span className="text-[10px] text-tinta-lembut group-hover:text-tinta hidden sm:inline">
                    ({v.label})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation Warnings */}
          {hasTemplateWarnings && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-input mb-4 space-y-1">
              {mainValidation.warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
              {albumValidation.warnings.map((w, idx) => (
                <div key={`a-${idx}`} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Live Preview Box */}
          {showPreview && (
            <div className="mb-6 p-4 bg-kertas rounded-panel border border-garis space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-merah font-bold block">
                Pratinjau Pesan yang Akan Diterima Klien:
              </span>
              <pre className="whitespace-pre-wrap font-sans text-xs text-tinta bg-white p-3.5 border border-garis rounded-input leading-relaxed max-h-56 overflow-y-auto">
                {previewText}
              </pre>
            </div>
          )}

          {/* Two-part template editor */}
          <div className="space-y-4">
            {/* Bagian 1: Pesan Utama */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-widest text-tinta font-bold">
                  Bagian 1: Pesan Utama (Wajib memuat {'{link_pilih}'})
                </label>
                <span className="text-[11px] font-mono text-tinta-lembut">
                  {mainTemplate.length} / 1500 karakter
                </span>
              </div>
              <textarea
                value={mainTemplate}
                onFocus={() => setActiveFocus('main')}
                onChange={(e) => setMainTemplate(e.target.value.slice(0, 1500))}
                rows={5}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-xs font-mono rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors leading-relaxed"
                placeholder="Tulis pesan utama kurasi..."
              />
            </div>

            {/* Bagian 2: Bagian Album Keluarga */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-widest text-tinta font-bold">
                  Bagian 2: Bagian Album Keluarga (Ditambahkan jika album aktif, memuat {'{link_album}'})
                </label>
                <span className="text-[11px] font-mono text-tinta-lembut">
                  {albumTemplate.length} / 600 karakter
                </span>
              </div>
              <textarea
                value={albumTemplate}
                onFocus={() => setActiveFocus('album')}
                onChange={(e) => setAlbumTemplate(e.target.value.slice(0, 600))}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-xs font-mono rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors leading-relaxed"
                placeholder="Tulis paragraf album keluarga..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-garis flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading || hasTemplateWarnings}
            className="w-full sm:w-auto px-8 py-2.5 bg-merah hover:bg-merah-hover text-white text-sm font-sans font-medium rounded-btn min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudioSettings;
