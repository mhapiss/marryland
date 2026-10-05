import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { HOME_DEFAULTS } from '../config/homeDefaults';
import { HOME_ADMIN_SCHEMA, SectionConfig, FieldConfig } from '../config/homeAdminSchema';
import { processHomeImage } from '../lib/imageProcessor';

// Markdown parser helper for *italic*
const parseMarkdown = (text: string) => {
  if (!text) return text;
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const PHOTO_SLOTS = [
  'hero_main',
  'marquee',
  'featured',
  'demo_mockup',
  'steps_mockup',
  'problem_chat',
  'client_hero',
  'contact',
];

export default function HomeSettingsManager() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<string>(HOME_ADMIN_SCHEMA[0].id);
  const [contentData, setContentData] = useState<Record<string, any>>({});
  const [originalContentData, setOriginalContentData] = useState<Record<string, any>>({});
  
  const [photosData, setPhotosData] = useState<any[]>([]);
  const [originalPhotosData, setOriginalPhotosData] = useState<any[]>([]);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [portfolioOptions, setPortfolioOptions] = useState<any[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const resolvePhotoUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.replace(/^\/+/, '');
    return supabase.storage.from('home-media').getPublicUrl(clean).data.publicUrl;
  };

  const openPortfolioPicker = async () => {
    setIsPickerOpen(true);
    if (portfolioOptions.length === 0) {
      try {
        setLoadingPicker(true);
        const { data, error } = await supabase
          .from('portfolio_photos')
          .select('id, image_url, caption, alt, category, slot')
          .eq('is_published', true)
          .order('order_index', { ascending: true });
        if (!error && data) {
          setPortfolioOptions(data);
        }
      } catch (err) {
        console.error('Error loading portfolio photos:', err);
      } finally {
        setLoadingPicker(false);
      }
    }
  };

  const selectPhotoFromPortfolio = (photoItem: any) => {
    const baseId = crypto.randomUUID();
    const newPhoto = {
      id: baseId,
      slot: activeSection,
      position: photosData.filter(p => p.slot === activeSection).length,
      path: photoItem.image_url,
      width: 1200,
      height: 1600,
      blur_data: '',
      focal: 'top',
      alt: photoItem.alt || photoItem.category || 'Momen Pilihan',
      title: photoItem.caption || (activeSection === 'marquee' ? "TODAY'S CHAPTER" : ''),
      description: photoItem.caption || '',
    };
    setPhotosData(prev => [...prev, newPhoto]);
    setIsDirty(true);
    toast.success('Foto dari portofolio ditambahkan');
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load content
      const { data: content, error: contentError } = await supabase.from('site_content').select('*');
      if (contentError) throw contentError;
      
      const loadedContent: Record<string, any> = {};
      HOME_ADMIN_SCHEMA.forEach(schema => {
        const found = content.find(c => c.section === schema.id);
        loadedContent[schema.id] = found ? found.content : HOME_DEFAULTS[schema.id as keyof typeof HOME_DEFAULTS];
      });
      
      setContentData(JSON.parse(JSON.stringify(loadedContent)));
      setOriginalContentData(JSON.parse(JSON.stringify(loadedContent)));

      // Load photos
      const { data: photos, error: photosError } = await supabase.from('home_photos').select('*').order('position');
      if (photosError) throw photosError;
      
      setPhotosData(photos || []);
      setOriginalPhotosData(photos || []);
      
    } catch (err: any) {
      toast.error('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (sectionId: string, path: string[], value: any) => {
    setContentData(prev => {
      const next = { ...prev };
      let current = next[sectionId];
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return next;
    });
    setIsDirty(true);
  };

  const resetToDefault = (sectionId: string, path: string[]) => {
    const defaultSection = HOME_DEFAULTS[sectionId as keyof typeof HOME_DEFAULTS] as any;
    let defaultValue = defaultSection;
    for (const key of path) {
      defaultValue = defaultValue?.[key];
    }
    handleContentChange(sectionId, path, defaultValue);
  };

  const handlePhotoUpload = async (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Memproses gambar...', { id: 'upload' });
      
      const processed = await processHomeImage(file);
      const baseId = crypto.randomUUID();
      
      // Upload variants
      const uploadPromises = [];
      const paths = { w480: '', w960: '', w1600: '' };
      
      if (processed.variants.w480) {
        paths.w480 = `${slot}/${baseId}_480.webp`;
        uploadPromises.push(supabase.storage.from('home-media').upload(paths.w480, processed.variants.w480, { contentType: 'image/webp' }));
      }
      if (processed.variants.w960) {
        paths.w960 = `${slot}/${baseId}_960.webp`;
        uploadPromises.push(supabase.storage.from('home-media').upload(paths.w960, processed.variants.w960, { contentType: 'image/webp' }));
      }
      if (processed.variants.w1600) {
        paths.w1600 = `${slot}/${baseId}_1600.webp`;
        uploadPromises.push(supabase.storage.from('home-media').upload(paths.w1600, processed.variants.w1600, { contentType: 'image/webp' }));
      }
      
      await Promise.all(uploadPromises);
      
      const newPhoto = {
        id: baseId,
        slot,
        position: photosData.filter(p => p.slot === slot).length,
        path: paths.w1600 || paths.w960 || paths.w480, // store highest res path for reference
        width: processed.width,
        height: processed.height,
        blur_data: processed.blurData,
        focal: 'center',
        alt: '',
        title: '',
        description: ''
      };
      
      setPhotosData(prev => [...prev, newPhoto]);
      setIsDirty(true);
      toast.success('Gambar berhasil diunggah', { id: 'upload' });
      
    } catch (err: any) {
      toast.error('Gagal mengunggah gambar: ' + err.message, { id: 'upload' });
    }
  };

  const handlePhotoUpdate = (id: string, updates: any) => {
    setPhotosData(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setIsDirty(true);
  };

  const handlePhotoDelete = (id: string) => {
    setPhotosData(prev => prev.filter(p => p.id !== id));
    setIsDirty(true);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      toast.loading('Menyimpan perubahan...', { id: 'save' });

      // Save content
      const contentUpserts = Object.entries(contentData).map(([section, content]) => ({
        section,
        content,
        visible: true,
        updated_by: user?.id
      }));

      const { error: contentError } = await supabase
        .from('site_content')
        .upsert(contentUpserts);

      if (contentError) throw contentError;

      // Save photos
      // For photos, we just delete all and re-insert for simplicity, 
      // or we can sync. Let's delete all and insert.
      const { error: deletePhotosError } = await supabase
        .from('home_photos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      
      if (deletePhotosError) throw deletePhotosError;

      if (photosData.length > 0) {
        const { error: insertPhotosError } = await supabase
          .from('home_photos')
          .insert(photosData.map(({ id, slot, position, path, width, height, alt, title, description, focal, blur_data }) => ({
            id, slot, position, path, width, height, alt, title, description, focal, blur_data
          })));
        if (insertPhotosError) throw insertPhotosError;
      }

      setOriginalContentData(JSON.parse(JSON.stringify(contentData)));
      setOriginalPhotosData([...photosData]);
      setIsDirty(false);
      toast.success('Perubahan berhasil disimpan', { id: 'save' });

    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message, { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FieldConfig, sectionId: string, basePath: string[], value: any) => {
    const id = `${sectionId}-${basePath.join('-')}`;
    return (
      <div key={id} className="mb-6">
        <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-2">{field.label}</label>
        
        {field.type === 'text' && (
          <div>
            <input 
              type="text" 
              className="w-full p-2.5 border border-garis rounded-[2px] text-sm bg-white text-tinta focus:outline-none focus:border-merah"
              value={value || ''}
              onChange={e => handleContentChange(sectionId, basePath, e.target.value)}
            />
            <div className="flex justify-between text-xs text-tinta-lembut font-mono mt-1">
              <span>{value?.length || 0} karakter</span>
              <button type="button" onClick={() => resetToDefault(sectionId, basePath)} className="text-merah hover:underline">Kembalikan ke teks awal</button>
            </div>
            <div className="mt-2 p-3 bg-kertas-tua/40 border border-garis rounded-[2px] text-sm text-tinta italic font-serif">Pratinjau: {parseMarkdown(value || '')}</div>
          </div>
        )}

        {field.type === 'textarea' && (
          <div>
            <textarea 
              className="w-full p-2.5 border border-garis rounded-[2px] text-sm bg-white text-tinta min-h-[100px] focus:outline-none focus:border-merah"
              value={value || ''}
              onChange={e => handleContentChange(sectionId, basePath, e.target.value)}
            />
            <div className="flex justify-between text-xs text-tinta-lembut font-mono mt-1">
              <span>{value?.length || 0} karakter</span>
              <button type="button" onClick={() => resetToDefault(sectionId, basePath)} className="text-merah hover:underline">Kembalikan ke teks awal</button>
            </div>
            <div className="mt-2 p-3 bg-kertas-tua/40 border border-garis rounded-[2px] text-sm text-tinta italic font-serif">Pratinjau: {parseMarkdown(value || '')}</div>
          </div>
        )}

        {field.type === 'list' && (
          <div className="border border-garis rounded-[2px] p-4 space-y-4">
            {(value || []).map((item: any, index: number) => (
              <div key={index} className="p-4 bg-kertas/40 border border-garis rounded-[2px] relative">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-garis">
                  <div className="font-mono text-xs uppercase tracking-wider text-tinta">Item {index + 1}</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      if (index === 0) return;
                      const arr = [...value];
                      [arr[index-1], arr[index]] = [arr[index], arr[index-1]];
                      handleContentChange(sectionId, basePath, arr);
                    }} className="text-xs font-mono px-2 py-1 bg-white border border-garis rounded-[2px] hover:bg-kertas-tua disabled:opacity-40 text-tinta" disabled={index === 0}>Naik</button>
                    <button type="button" onClick={() => {
                      if (index === value.length - 1) return;
                      const arr = [...value];
                      [arr[index+1], arr[index]] = [arr[index], arr[index+1]];
                      handleContentChange(sectionId, basePath, arr);
                    }} className="text-xs font-mono px-2 py-1 bg-white border border-garis rounded-[2px] hover:bg-kertas-tua disabled:opacity-40 text-tinta" disabled={index === value.length - 1}>Turun</button>
                    <button type="button" onClick={() => {
                      const arr = [...value];
                      arr.splice(index, 1);
                      handleContentChange(sectionId, basePath, arr);
                    }} className="text-xs font-mono px-2 py-1 bg-white text-merah border border-garis rounded-[2px] hover:bg-kertas-tua">Hapus</button>
                  </div>
                </div>
                {field.fields?.map(subField => {
                  if (subField.name === 'icon') {
                    const ICONS = ['Link', 'MousePointerClick', 'Timer', 'Save', 'Copy', 'UserMinus', 'CheckCircle', 'Image', 'Camera', 'Heart', 'Star', 'MessageSquare', 'Phone', 'Mail', 'MapPin', 'Clock', 'FileText', 'Settings', 'Share2', 'Shield'];
                    return (
                      <div key={`${index}-${subField.name}`} className="mb-4">
                        <label className="block text-xs font-mono uppercase text-tinta-lembut mb-2">{subField.label}</label>
                        <select
                          className="w-full p-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                          value={item[subField.name] || ''}
                          onChange={e => handleContentChange(sectionId, [...basePath, index.toString(), subField.name], e.target.value)}
                        >
                          <option value="">-- Pilih Ikon --</option>
                          {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return renderField(subField, sectionId, [...basePath, index.toString(), subField.name], item[subField.name]);
                })}
              </div>
            ))}
            <button type="button" onClick={() => {
              const arr = [...(value || [])];
              const newItem: any = {};
              field.fields?.forEach(f => newItem[f.name] = '');
              arr.push(newItem);
              handleContentChange(sectionId, basePath, arr);
            }} className="w-full py-2.5 border-2 border-dashed border-garis text-merah font-medium rounded-[2px] hover:bg-kertas-tua/50 text-xs font-mono">
              + Tambah Item
            </button>
          </div>
        )}
      </div>
    );
  };

  const currentSchema = HOME_ADMIN_SCHEMA.find(s => s.id === activeSection);
  const currentContent = contentData[activeSection];
  const sectionPhotos = photosData.filter(p => p.slot === activeSection);

  if (loading) return <div className="p-10 text-center font-mono text-xs text-tinta-lembut">Memuat pengaturan...</div>;

  return (
    <div className="min-h-screen bg-kertas text-tinta flex flex-col font-sans">
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis">
        <h1 className="text-xl font-serif font-normal text-tinta">Pengaturan Beranda</h1>
        <button onClick={() => navigate('/admin')} className="text-xs font-mono text-tinta-lembut hover:text-merah transition-colors">← Kembali ke Dashboard</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-garis overflow-y-auto">
          <ul className="p-4 space-y-1">
            {HOME_ADMIN_SCHEMA.map(schema => (
              <li key={schema.id}>
                <button
                  className={`w-full text-left px-4 py-2.5 rounded-[2px] text-xs font-medium transition-colors ${activeSection === schema.id ? 'bg-kertas-tua text-merah border-l-2 border-merah font-medium' : 'text-tinta hover:bg-kertas-tua/40'}`}
                  onClick={() => setActiveSection(schema.id)}
                >
                  {schema.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content Form */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          {currentSchema && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-serif font-normal text-tinta mb-6">{currentSchema.label}</h2>
              
              {/* Text Fields */}
              <div className="space-y-6">
                {currentSchema.fields.map(field => 
                  renderField(field, currentSchema.id, [field.name], currentContent?.[field.name])
                )}
              </div>

              {/* Photo Slots (if applicable) */}
              {PHOTO_SLOTS.includes(activeSection) && (
                <div className="mt-12">
                  <h3 className="text-lg font-serif font-normal text-tinta mb-4">Foto Bagian Ini</h3>
                  
                  <div className="space-y-6">
                    {sectionPhotos.map((photo) => (
                      <div key={photo.id} className="flex flex-col sm:flex-row gap-6 p-4 border border-garis rounded-[2px] bg-white">
                        <div className="w-full sm:w-48 flex flex-col gap-2">
                          <img 
                            src={resolvePhotoUrl(photo.path)} 
                            alt={photo.alt || 'Pratinjau'} 
                            className="w-full h-auto rounded-[2px] object-cover aspect-[3/4] bg-[#f7f5f0] border border-garis"
                            style={{ objectPosition: photo.focal || 'center' }}
                          />
                          <button onClick={() => handlePhotoDelete(photo.id)} className="text-xs text-merah font-mono hover:underline text-left">Hapus Foto</button>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">
                              {activeSection === 'marquee' ? 'Kategori / Tag (misal: Wisuda, Tradisi)' : 'Alt Text (Aksesibilitas)'}
                            </label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              value={photo.alt || ''}
                              placeholder={activeSection === 'marquee' ? 'Contoh: Wisuda / Tradisi / Janji Suci' : ''}
                              onChange={e => handlePhotoUpdate(photo.id, { alt: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">
                                {activeSection === 'marquee' ? "Judul Poster (misal: TODAY'S CHAPTER)" : 'Judul (Opsional)'}
                              </label>
                              <input 
                                type="text" 
                                className="w-full p-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                                value={photo.title || ''}
                                placeholder={activeSection === 'marquee' ? "Contoh: TODAY'S CHAPTER / JAVANESE TRADITIONS" : ''}
                                onChange={e => handlePhotoUpdate(photo.id, { title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Fokus (Object Position)</label>
                              <select 
                                className="w-full p-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                                value={photo.focal || 'center'}
                                onChange={e => handlePhotoUpdate(photo.id, { focal: e.target.value })}
                              >
                                <option value="top left">Top Left</option>
                                <option value="top">Top</option>
                                <option value="top right">Top Right</option>
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                                <option value="bottom left">Bottom Left</option>
                                <option value="bottom">Bottom</option>
                                <option value="bottom right">Bottom Right</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-mono uppercase text-tinta-lembut mb-1">Takarir / Subjudul (Opsional)</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                              value={photo.description || ''}
                              placeholder="Keterangan singkat momen"
                              onChange={e => handlePhotoUpdate(photo.id, { description: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center justify-center px-5 py-2.5 bg-merah text-white rounded-btn text-xs font-sans font-medium cursor-pointer hover:bg-merah-hover transition-colors min-h-[44px]">
                      Unggah Foto Baru
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handlePhotoUpload(activeSection, e)} />
                    </label>

                    <button
                      type="button"
                      onClick={openPortfolioPicker}
                      className="px-5 py-2.5 bg-white border border-garis text-tinta rounded-btn text-xs font-sans font-medium hover:bg-kertas-tua/60 transition-colors min-h-[44px]"
                    >
                      Pilih dari Foto Portofolio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog: Pilih dari Portofolio */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-panel border border-garis shadow-2xl flex flex-col font-sans">
            <div className="p-4 sm:p-5 border-b border-garis flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-tinta">Pilih Foto dari Portofolio</h3>
                <p className="text-xs text-tinta-lembut font-mono mt-0.5">
                  Pilih foto yang ingin dimasukkan khusus ke bagian {currentSchema?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-2 text-tinta-lembut hover:text-merah text-sm font-sans font-medium rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {loadingPicker ? (
                <div className="py-12 text-center text-xs text-tinta-lembut font-mono">
                  Memuat arsip foto portofolio...
                </div>
              ) : portfolioOptions.length === 0 ? (
                <div className="py-12 text-center text-xs text-tinta-lembut font-mono">
                  Belum ada foto portofolio yang tersimpan.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {portfolioOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="group relative border border-garis rounded-[2px] overflow-hidden bg-kertas-tua flex flex-col hover:border-merah transition-all"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-black/10">
                        <img
                          src={opt.image_url}
                          alt={opt.alt || opt.caption || 'Foto Portofolio'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 bg-white flex flex-col justify-between flex-1">
                        <div>
                          <span className="text-[10px] font-sans font-medium uppercase bg-kertas-tua px-1.5 py-0.5 rounded-chip text-tinta-lembut block w-fit mb-1">
                            {opt.category || 'Portofolio'}
                          </span>
                          <p className="text-[11px] font-serif line-clamp-1 text-tinta">
                            {opt.caption || opt.alt || 'Tanpa Takarir'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectPhotoFromPortfolio(opt)}
                          className="mt-2 w-full py-1.5 bg-merah text-white text-[11px] font-sans font-medium rounded-btn hover:bg-merah-hover transition-colors min-h-[36px]"
                        >
                          + Pilih Foto Ini
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-garis flex justify-end">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-5 py-2.5 bg-kertas-tua border border-garis text-tinta text-xs font-sans font-medium rounded-btn hover:bg-garis transition-colors min-h-[44px]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-garis p-4 flex justify-between items-center z-50">
        <div className="text-xs font-mono text-tinta-lembut">
          {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan telah disimpan.'}
        </div>
        <button 
          onClick={saveChanges} 
          disabled={!isDirty || saving}
          className={`px-6 py-2.5 rounded-btn text-xs font-sans font-medium text-white transition-colors min-h-[44px] ${!isDirty || saving ? 'bg-garis text-tinta-lembut cursor-not-allowed' : 'bg-merah hover:bg-merah-hover'}`}
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}
