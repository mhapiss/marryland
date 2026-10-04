// src/components/admin/MediaPickerModal.tsx
import React, { useState } from 'react';
import { useMediaLibrary } from '../../hooks/useMediaLibrary';
import { MediaAsset, MediaRef, PhotoSlotSchema } from '../../content/schema';
import { Search, Upload, Check, X, Crop, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaRef: MediaRef, replaceEverywhere?: boolean) => void;
  slotSchema: PhotoSlotSchema;
  currentMediaRef?: MediaRef;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  slotSchema,
  currentMediaRef,
}: MediaPickerModalProps) {
  const { assets, loading, searchQuery, setSearchQuery, uploadSingleMedia } = useMediaLibrary();

  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Form details for chosen photo
  const [altText, setAltText] = useState(currentMediaRef?.alt || '');
  const [caption, setCaption] = useState(currentMediaRef?.caption || '');
  const [focal, setFocal] = useState(currentMediaRef?.focal || 'center');
  const [replaceEverywhere, setReplaceEverywhere] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const focalPositions = [
    { label: 'Top Left', value: 'top left' },
    { label: 'Top Center', value: 'top center' },
    { label: 'Top Right', value: 'top right' },
    { label: 'Center Left', value: 'center left' },
    { label: 'Center', value: 'center' },
    { label: 'Center Right', value: 'center right' },
    { label: 'Bottom Left', value: 'bottom left' },
    { label: 'Bottom Center', value: 'bottom center' },
    { label: 'Bottom Right', value: 'bottom right' },
  ];

  const aspectClass =
    slotSchema.suggestedAspect === '3:4'
      ? 'aspect-[3/4]'
      : slotSchema.suggestedAspect === '16:9'
      ? 'aspect-[16/9]'
      : slotSchema.suggestedAspect === '1:1'
      ? 'aspect-[1/1]'
      : 'aspect-[4/3]';

  const handleApply = () => {
    if (!selectedAsset) {
      toast.error('Pilih foto terlebih dahulu');
      return;
    }

    if (!altText.trim()) {
      toast.warning('Disarankan mengisi deskripsi teks alternatif (Alt) demi aksesibilitas.');
    }

    const publicUrl = `https://your-supabase-url/storage/v1/object/public/home-media/${selectedAsset.base_path}_960.webp`;

    onSelect(
      {
        media_id: selectedAsset.id,
        url: publicUrl,
        base_path: selectedAsset.base_path,
        alt: altText || selectedAsset.default_alt || '',
        caption,
        focal,
        width: selectedAsset.width,
        height: selectedAsset.height,
      },
      replaceEverywhere
    );
    onClose();
  };

  const handleUploadNew = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const created = await uploadSingleMedia(uploadFile, altText);
      setSelectedAsset(created);
      setActiveTab('library');
      toast.success('Foto berhasil diunggah ke pustaka');
    } catch (err: any) {
      toast.error('Gagal mengunggah foto: ' + (err.message || 'Coba lagi'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2px] border border-garis w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-garis flex items-center justify-between bg-kertas-tua/50">
          <div>
            <h3 className="font-serif text-lg font-normal text-tinta">Pilih Foto untuk {slotSchema.label}</h3>
            <p className="text-xs text-tinta-lembut">
              Rasio yang disarankan: <span className="font-mono text-merah">{slotSchema.suggestedAspect}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-tinta-lembut hover:text-tinta rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Pustaka / Unggah Baru */}
        <div className="flex border-b border-garis px-6 gap-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`py-3 text-xs font-mono uppercase tracking-wider transition-colors min-h-[44px] ${
              activeTab === 'library'
                ? 'text-merah border-b-2 border-merah'
                : 'text-tinta-lembut hover:text-tinta'
            }`}
          >
            Pustaka Media ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-xs font-mono uppercase tracking-wider transition-colors min-h-[44px] flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'text-merah border-b-2 border-merah'
                : 'text-tinta-lembut hover:text-tinta'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto Baru</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Asset Selection or Upload */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {activeTab === 'library' ? (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tinta-lembut" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari foto berdasarkan nama atau alt..."
                    className="w-full pl-9 pr-4 py-2 border border-garis rounded-[2px] text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                  />
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs font-mono text-tinta-lembut">Memuat aset media...</div>
                ) : assets.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-tinta-lembut">
                    Tidak ada foto yang cocok. Silakan unggah foto baru.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {assets.map((asset) => {
                      const isSelected = selectedAsset?.id === asset.id;
                      const thumbUrl = `https://your-supabase-url/storage/v1/object/public/home-media/${asset.base_path}_480.webp`;

                      return (
                        <div
                          key={asset.id}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setAltText(asset.default_alt || '');
                            setFocal(asset.default_focal || 'center');
                          }}
                          className={`group aspect-[3/4] rounded-[2px] border overflow-hidden relative cursor-pointer transition-all ${
                            isSelected
                              ? 'border-merah ring-2 ring-merah'
                              : 'border-garis hover:border-tinta'
                          }`}
                        >
                          <img
                            src={thumbUrl}
                            alt={asset.default_alt || 'Aset foto'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />

                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-merah text-white rounded-full p-1 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}

                          {(asset.usage_count || 0) > 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded-[2px]">
                              {asset.usage_count}x pakai
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-garis rounded-[2px] p-8 text-center flex flex-col items-center justify-center space-y-4">
                <Upload className="w-10 h-10 text-merah opacity-60" />
                <div>
                  <h4 className="font-medium text-sm text-tinta">Tarik foto ke sini atau telusuri</h4>
                  <p className="text-xs text-tinta-lembut mt-1">JPEG, PNG, atau WebP (maks. 15MB)</p>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="text-xs font-mono text-tinta"
                />

                {uploadFile && (
                  <button
                    type="button"
                    onClick={handleUploadNew}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-merah text-white rounded-[2px] text-xs font-medium hover:bg-merah-hover disabled:opacity-50 transition-colors"
                  >
                    {isUploading ? 'Memproses WebP 3 Varian...' : 'Mulai Unggah'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Crop Preview & Adjustment Form */}
          <div className="md:col-span-5 bg-kertas-tua/30 p-4 rounded-[2px] border border-garis flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-merah block mb-2">
                Pratinjau Potongan Sesuai Rasio ({slotSchema.suggestedAspect})
              </span>

              {/* Crop Preview Box */}
              <div className={`w-full ${aspectClass} bg-[#f7f5f0] rounded-[2px] overflow-hidden border border-garis relative`}>
                {selectedAsset ? (
                  <img
                    src={`https://your-supabase-url/storage/v1/object/public/home-media/${selectedAsset.base_path}_960.webp`}
                    alt="Pratinjau"
                    className="w-full h-full object-cover transition-all"
                    style={{ objectPosition: focal }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-tinta-lembut">
                    Pilih foto di sebelah kiri
                  </div>
                )}
              </div>

              {/* 3x3 Focal Point Grid */}
              <div className="mt-4">
                <label className="block text-[11px] font-mono text-tinta-lembut uppercase mb-1.5 flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5 text-merah" />
                  <span>Titik Fokus (Agar Wajah Tidak Terpotong)</span>
                </label>
                <div className="grid grid-cols-3 gap-1 max-w-[150px]">
                  {focalPositions.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setFocal(pos.value)}
                      title={pos.label}
                      className={`h-7 border text-[10px] rounded-[1px] font-mono transition-colors ${
                        focal === pos.value
                          ? 'bg-merah text-white border-merah'
                          : 'bg-white text-tinta-lembut border-garis hover:border-tinta'
                      }`}
                    >
                      •
                    </button>
                  ))}
                </div>
              </div>

              {/* Alt & Caption */}
              <div className="mt-4 space-y-2">
                <div>
                  <label className="block text-[11px] font-mono text-tinta-lembut uppercase mb-1">
                    Teks Alternatif (Alt)
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Deskripsi foto..."
                    className="w-full border border-garis rounded-[2px] px-3 py-1.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-tinta-lembut uppercase mb-1">
                    Keterangan (Caption / Opsional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption yang tampil di bawah foto..."
                    className="w-full border border-garis rounded-[2px] px-3 py-1.5 text-xs bg-white text-tinta focus:outline-none focus:border-merah"
                  />
                </div>
              </div>

              {/* Multiple Usage Option */}
              {selectedAsset && (selectedAsset.usage_count || 0) > 1 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-[2px] text-xs">
                  <div className="flex items-start gap-2 text-amber-800 font-semibold mb-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Foto ini dipakai di {selectedAsset.usage_count} tempat</span>
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceEverywhere}
                      onChange={(e) => setReplaceEverywhere(e.target.checked)}
                      className="text-merah focus:ring-merah"
                    />
                    <span className="text-[11px] text-tinta">Ganti file di semua tempat sekaligus</span>
                  </label>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-garis flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-garis rounded-[2px] text-xs font-medium text-tinta-lembut hover:text-tinta min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedAsset}
                className="px-5 py-2 bg-merah text-white rounded-[2px] text-xs font-medium hover:bg-merah-hover disabled:opacity-50 min-h-[44px] transition-colors"
              >
                Terapkan Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
