// src/pages/MediaLibraryPage.tsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { MediaAsset } from '../content/schema';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';
import {
  Upload,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Check,
  X,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';

export default function MediaLibraryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const {
    assets,
    loading,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    page,
    setPage,
    totalCount,
    pageSize,
    uploadSingleMedia,
    replaceMediaBlob,
    deleteMedia,
  } = useMediaLibrary();

  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState(false);

  // Handle multi-upload
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadSingleMedia(files[i]);
        successCount++;
      } catch (err: any) {
        toast.error(`Gagal mengunggah ${files[i].name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} foto berhasil diunggah dan diproses ke format WebP 3 varian.`);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle replace blob
  const handleReplaceBlob = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;

    setIsUploading(true);
    try {
      await replaceMediaBlob(selectedAsset.id, file);
      toast.success(`File untuk aset ini berhasil diganti di seluruh (${selectedAsset.usage_count || 1}) tempat pemakaian.`);
    } catch (err: any) {
      toast.error('Gagal mengganti file: ' + err.message);
    } finally {
      setIsUploading(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if ((deleteTarget.usage_count || 0) > 0 && !forceDeleteConfirm) {
      toast.error(`Foto masih digunakan di ${deleteTarget.usage_count} tempat. Lepas pemakaian terlebih dahulu atau centang konfirmasi.`);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMedia(deleteTarget.id);
      toast.success('Foto berhasil dihapus dari pustaka dan penyimpanan.');
      if (selectedAsset?.id === deleteTarget.id) setSelectedAsset(null);
    } catch (err: any) {
      toast.error('Gagal menghapus foto: ' + err.message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setForceDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif font-normal tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="border border-garis text-merah bg-kertas-tua text-[10px] px-2.5 py-0.5 rounded-chip font-sans font-medium uppercase">
            PUSTAKA MEDIA TERSINKRON
          </span>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/admin" className="text-sm font-sans font-medium text-tinta-lembut hover:text-merah transition-colors">
            ← Dashboard Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Actions & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-normal text-tinta">Pustaka Media Terpusat</h2>
            <p className="text-sm text-tinta-lembut mt-1">
              Satu foto diunggah sekali, disimpan dalam 3 resolusi WebP, dan dapat dipakai di beragam halaman.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFilesUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-btn text-xs font-sans font-medium flex items-center gap-2 transition-colors min-h-[44px] shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Memproses WebP...' : 'Unggah Foto'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-panel border border-garis">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tinta-lembut" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari foto berdasarkan alt text atau nama..."
              className="w-full pl-9 pr-4 py-2 border border-garis rounded-input text-xs bg-white text-tinta focus:outline-none focus:border-merah"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 text-xs font-sans font-medium rounded-chip transition-colors min-h-[44px] ${
                filterMode === 'all'
                  ? 'bg-merah text-white font-medium'
                  : 'bg-kertas-tua border border-garis text-tinta-lembut hover:text-tinta'
              }`}
            >
              Semua Foto ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('used')}
              className={`px-4 py-2 text-xs font-sans font-medium rounded-chip transition-colors min-h-[44px] ${
                filterMode === 'used'
                  ? 'bg-merah text-white font-medium'
                  : 'bg-kertas-tua border border-garis text-tinta-lembut hover:text-tinta'
              }`}
            >
              Terpakai
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unused')}
              className={`px-4 py-2 text-xs font-sans font-medium rounded-chip transition-colors min-h-[44px] ${
                filterMode === 'unused'
                  ? 'bg-merah text-white font-medium'
                  : 'bg-kertas-tua border border-garis text-tinta-lembut hover:text-tinta'
              }`}
            >
              Tidak Terpakai
            </button>
          </div>
        </div>

        {/* Media Grid & Detail Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Photos Grid */}
          <div className={selectedAsset ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {loading ? (
              <div className="py-24 text-center text-sm font-mono text-tinta-lembut">Memuat pustaka foto...</div>
            ) : assets.length === 0 ? (
              <div className="py-24 text-center bg-white border border-garis rounded-[2px] p-8">
                <ImageIcon className="w-12 h-12 text-tinta-lembut mx-auto mb-3 opacity-40" />
                <h3 className="font-serif text-lg font-normal text-tinta">Pustaka Masih Kosong</h3>
                <p className="text-xs text-tinta-lembut mt-1 max-w-sm mx-auto">
                  Belum ada foto yang cocok dengan pencarian atau filter. Silakan unggah foto baru melalui tombol di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const thumb = `https://your-supabase-url/storage/v1/object/public/home-media/${asset.base_path}_480.webp`;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`group aspect-[3/4] rounded-[2px] border overflow-hidden relative cursor-pointer bg-[#f7f5f0] transition-all ${
                        isSelected
                          ? 'border-merah ring-2 ring-merah'
                          : 'border-garis hover:border-tinta'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={asset.default_alt || 'Foto'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Usage Badge */}
                      <div className="absolute top-2 left-2">
                        {(asset.usage_count || 0) > 0 ? (
                          <span className="px-2 py-0.5 bg-merah text-white text-[9px] font-mono rounded-[2px]">
                            {asset.usage_count}x pakai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-tinta/80 text-white text-[9px] font-mono rounded-[2px]">
                            Bebas
                          </span>
                        )}
                      </div>

                      {/* Hover Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                        <p className="font-serif italic line-clamp-1">{asset.default_alt || 'Tanpa teks'}</p>
                        <span className="text-[9px] opacity-75 font-mono">{asset.width}x{asset.height}px</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Asset Detail Drawer */}
          {selectedAsset && (
            <div className="lg:col-span-4 bg-white border border-garis rounded-[2px] p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-garis">
                <h3 className="font-serif text-lg font-normal text-tinta">Detail Aset Foto</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 text-tinta-lembut hover:text-tinta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="aspect-[4/3] rounded-[2px] overflow-hidden bg-[#f7f5f0] border border-garis">
                <img
                  src={`https://your-supabase-url/storage/v1/object/public/home-media/${selectedAsset.base_path}_960.webp`}
                  alt="Detail"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: selectedAsset.default_focal || 'center' }}
                />
              </div>

              {/* Meta Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-kertas-tua/40 p-3 rounded-[2px] border border-garis font-mono">
                <div>
                  <span className="text-tinta-lembut block text-[10px]">DIMENSI</span>
                  <span className="font-medium text-tinta">{selectedAsset.width} x {selectedAsset.height} px</span>
                </div>
                <div>
                  <span className="text-tinta-lembut block text-[10px]">UKURAN</span>
                  <span className="font-medium text-tinta">{(selectedAsset.size_bytes / 1024).toFixed(0)} KB</span>
                </div>
              </div>

              {/* Usage List */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-merah block mb-2">
                  Daftar Pemakaian ({selectedAsset.usage_count || 0})
                </span>

                {(selectedAsset.usage_count || 0) === 0 ? (
                  <p className="text-xs text-tinta-lembut italic font-serif">Foto ini belum dipakai di halaman mana pun.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedAsset.usages?.map((u, idx) => (
                      <div
                        key={idx}
                        className="p-2 border border-garis rounded-[2px] text-xs flex items-center justify-between bg-white"
                      >
                        <div>
                          <span className="font-medium text-tinta capitalize">{u.page_key}</span>
                          <span className="text-[10px] text-tinta-lembut block font-mono">
                            Section: {u.section_id} ({u.slot_key})
                          </span>
                        </div>
                        <Link
                          to={`/admin/konten?page=${u.page_key}`}
                          className="p-1 text-merah hover:text-merah-hover"
                          title="Buka Editor Halaman"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-garis space-y-3">
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleReplaceBlob}
                />

                <button
                  type="button"
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="w-full py-2.5 border border-merah text-merah hover:bg-merah/10 rounded-btn text-xs font-sans font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti File di Semua Tempat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedAsset)}
                  className="w-full py-2.5 border border-garis text-merah hover:bg-kertas-tua rounded-btn text-xs font-sans font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Aset Ini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Foto dari Pustaka"
        message={
          (deleteTarget?.usage_count || 0) > 0
            ? `PERINGATAN: Foto ini sedang digunakan di ${deleteTarget?.usage_count} halaman. Menghapusnya akan membuat slot foto tersebut kosong.`
            : 'Apakah kamu yakin ingin menghapus foto ini? File WebP di server akan dihapus permanen.'
        }
        confirmLabel="Ya, Hapus Foto"
        destructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null);
          setForceDeleteConfirm(false);
        }}
      />
    </div>
  );
}
