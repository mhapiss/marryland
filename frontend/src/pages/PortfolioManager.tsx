import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRealtime } from '../hooks/useRealtime';

interface PortfolioPhoto {
  id: string;
  image_url: string;
  storage_path: string;
  caption: string | null;
  category: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'pernikahan', label: 'Pernikahan' },
  { value: 'wisuda', label: 'Wisuda' },
  { value: 'keluarga', label: 'Keluarga' },
];

const PortfolioManager: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('pernikahan');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_photos')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      setPhotos(data);
    }
    setLoading(false);
  }, []);

  // ─── Realtime: sync portfolio changes across admin tabs/devices ───
  useRealtime({
    table: 'portfolio_photos',
    onAny: () => {
      // Re-fetch all photos when any change happens from another tab
      fetchPhotos();
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress('Mengupload foto...');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const storagePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, selectedFile, { cacheControl: '31536000', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName);

      setUploadProgress('Menyimpan ke database...');

      const maxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.order_index)) : 0;

      const { data, error: insertError } = await supabase
        .from('portfolio_photos')
        .insert({
          image_url: publicUrl,
          storage_path: storagePath,
          caption: caption || null,
          category,
          order_index: maxOrder + 1,
          is_published: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPhotos(prev => [...prev, data]);
      resetUploadForm();
    } catch (err: any) {
      alert('Gagal upload: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const resetUploadForm = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setCategory('pernikahan');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePublish = async (photo: PortfolioPhoto) => {
    const { error } = await supabase
      .from('portfolio_photos')
      .update({ is_published: !photo.is_published })
      .eq('id', photo.id);

    if (!error) {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_published: !p.is_published } : p));
    }
  };

  const moveOrder = async (photo: PortfolioPhoto, direction: 'up' | 'down') => {
    const currentIndex = photos.findIndex(p => p.id === photo.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= photos.length) return;

    const swapPhoto = photos[swapIndex];
    
    await Promise.all([
      supabase.from('portfolio_photos').update({ order_index: swapPhoto.order_index }).eq('id', photo.id),
      supabase.from('portfolio_photos').update({ order_index: photo.order_index }).eq('id', swapPhoto.id),
    ]);

    const newPhotos = [...photos];
    const tempOrder = newPhotos[currentIndex].order_index;
    newPhotos[currentIndex].order_index = newPhotos[swapIndex].order_index;
    newPhotos[swapIndex].order_index = tempOrder;
    [newPhotos[currentIndex], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[currentIndex]];
    setPhotos(newPhotos);
  };

  const handleDelete = async (photo: PortfolioPhoto) => {
    if (!confirm(`Hapus foto "${photo.caption || 'tanpa caption'}"?`)) return;

    // Delete from storage
    const fileName = photo.storage_path.replace('portfolio/', '');
    await supabase.storage.from('portfolio').remove([fileName]);

    // Delete from DB
    const { error } = await supabase.from('portfolio_photos').delete().eq('id', photo.id);
    if (!error) {
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    }
  };

  const saveEdit = async (photo: PortfolioPhoto) => {
    const { error } = await supabase
      .from('portfolio_photos')
      .update({ caption: editCaption || null, category: editCategory })
      .eq('id', photo.id);

    if (!error) {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: editCaption || null, category: editCategory } : p));
      setEditingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const categoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  const categoryBadge = (cat: string) => {
    const styles: Record<string, string> = {
      pernikahan: 'bg-pink-50 text-pink-700 border-pink-200',
      wisuda: 'bg-purple-50 text-purple-700 border-purple-200',
      keluarga: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[cat] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
        {categoryLabel(cat)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans text-text ambient-bg">
      {/* ─────── Decorative Elements ─────── */}
      <div className="deco-float w-64 h-64 bg-primary-100 top-20 -left-20 blur-3xl"></div>
      <div className="deco-float-reverse w-96 h-96 bg-primary-200/50 top-1/2 -right-32 blur-[100px]"></div>
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-primary-100/40 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif font-bold tracking-tight">by.<span className="text-primary">marryland</span></h1>
          <span className="border border-red-200 text-red-600 bg-red-50 text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/admin" className="text-sm text-muted hover:text-primary transition-colors">
            ← Kembali ke Admin
          </Link>
          <button onClick={handleSignOut} className="text-muted hover:text-red-500 transition-colors" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-bold">Portofolio Showcase</h2>
            <p className="text-sm text-muted mt-1">Kelola foto yang tampil di hero section dan Karya Kami di landing page</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Upload Foto
            </button>
          </div>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetUploadForm} />
            <div className="relative card w-full max-w-lg p-8 animate-slide-up">
              <h3 className="font-serif text-xl font-bold mb-6">Upload Foto Portofolio</h3>

              {previewUrl && (
                <div className="mb-6 rounded-xl overflow-hidden bg-primary-50">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="input"
                    placeholder="Deskripsi singkat foto (opsional)"
                  />
                </div>

                <div>
                  <label className="label">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={resetUploadForm} className="flex-1 btn-outline" disabled={uploading}>
                  Batal
                </button>
                <button onClick={handleUpload} className="flex-1 btn-primary" disabled={uploading}>
                  {uploading ? uploadProgress : 'Upload Sekarang'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted">Memuat portofolio...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="card p-16 text-center border-dashed border-2 border-primary-200">
            <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p className="text-muted text-lg">Belum ada foto portofolio</p>
            <p className="text-sm text-muted mt-2">Upload foto pertama untuk ditampilkan di landing page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {photos.map((photo, idx) => (
              <div key={photo.id} className={`card overflow-hidden flex flex-col sm:flex-row items-stretch ${!photo.is_published ? 'opacity-60' : ''}`}>
                {/* Thumbnail */}
                <div className="sm:w-48 h-32 sm:h-auto bg-primary-50 flex-shrink-0">
                  <img src={photo.image_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  {editingId === photo.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="input text-sm"
                        placeholder="Caption..."
                      />
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="input text-sm"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(photo)} className="btn-primary text-xs px-4 py-1.5">Simpan</button>
                        <button onClick={() => setEditingId(null)} className="btn-outline text-xs px-4 py-1.5">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {categoryBadge(photo.category)}
                        {!photo.is_published && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-gray-50 text-gray-500 border-gray-200">
                            Unpublished
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{photo.caption || <span className="text-muted italic">Tanpa caption</span>}</p>
                      <p className="text-xs text-muted mt-1">
                        Urutan #{photo.order_index} · {new Date(photo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId !== photo.id && (
                  <div className="flex sm:flex-col items-center gap-1 p-3 border-t sm:border-t-0 sm:border-l border-primary-50 bg-primary-50/30">
                    {/* Move Up */}
                    <button
                      onClick={() => moveOrder(photo, 'up')}
                      disabled={idx === 0}
                      className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Naikkan urutan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
                    </button>
                    {/* Move Down */}
                    <button
                      onClick={() => moveOrder(photo, 'down')}
                      disabled={idx === photos.length - 1}
                      className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Turunkan urutan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => { setEditingId(photo.id); setEditCaption(photo.caption || ''); setEditCategory(photo.category); }}
                      className="p-2 rounded-lg hover:bg-white transition-colors text-muted hover:text-primary"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    {/* Publish Toggle */}
                    <button
                      onClick={() => togglePublish(photo)}
                      className={`p-2 rounded-lg hover:bg-white transition-colors ${photo.is_published ? 'text-green-600' : 'text-muted'}`}
                      title={photo.is_published ? 'Unpublish' : 'Publish'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {photo.is_published ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        )}
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(photo)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-500"
                      title="Hapus"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Landing Page Preview Info */}
        {photos.filter(p => p.is_published).length > 0 && (
          <div className="mt-8 card p-6 bg-primary-50/50 border-primary-100">
            <h4 className="font-serif font-bold text-sm mb-2">Preview di Landing Page</h4>
            <p className="text-xs text-muted mb-4">
              {photos.filter(p => p.is_published).length} foto yang dipublish akan ditampilkan di hero section landing page. 
              Foto dengan urutan terkecil akan tampil paling depan.
            </p>
            <Link to="/" target="_blank" className="text-primary text-sm font-semibold hover:underline">
              Lihat Landing Page →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default PortfolioManager;
