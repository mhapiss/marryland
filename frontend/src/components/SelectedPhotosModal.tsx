// src/components/SelectedPhotosModal.tsx
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '../lib/supabaseClient';
import { copyToClipboard } from '../lib/clipboard';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { getBaseName } from '../lib/fileMatching';
import { toast } from 'sonner';
import {
  Copy,
  Download,
  Check,
  HardDrive,
  Images,
  Sliders,
  HelpCircle,
  X,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { Gallery } from '../pages/Dashboard';

// Modul Tingkat 2 dimuat malas (dynamic import) hanya saat dialog dibuka
const LocalFileCopyDialog = React.lazy(
  () => import('./gallery/LocalFileCopyDialog')
);

interface PhotoItem {
  id: string;
  selection_order: number;
  filename: string;
}

interface Props {
  gallery: Gallery;
  onClose: () => void;
  initialTab?: 'daftar' | 'siapkan';
}

const SelectedPhotosModal: React.FC<Props> = ({
  gallery,
  onClose,
  initialTab = 'siapkan',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, modalRef, { onEscape: onClose });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daftar' | 'siapkan'>(initialTab);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showLocalCopyModal, setShowLocalCopyModal] = useState(false);

  useEffect(() => {
    fetchSelectedPhotos();
  }, [gallery.id]);

  const fetchSelectedPhotos = async () => {
    setLoading(true);

    try {
      // 1. Coba panggil fungsi RPC get_selected_filenames (Bagian A)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_selected_filenames',
        { p_gallery_id: gallery.id }
      );

      if (!rpcError && Array.isArray(rpcData)) {
        const mapped = rpcData.map((item: any, idx: number) => ({
          id: `rpc-${idx}`,
          selection_order: item.selection_order ?? idx + 1,
          filename: item.filename || 'Unknown',
        }));
        setPhotos(mapped);
        setLoading(false);
        return;
      }

      // 2. Fallback ke kueri relasi langsung jika RPC belum dieksekusi di database
      const { data, error } = await supabase
        .from('photo_selections')
        .select(`
          id,
          selection_order,
          gallery_photos (filename)
        `)
        .eq('gallery_id', gallery.id)
        .order('selection_order', { ascending: true });

      if (!error && data) {
        const mapped = data.map((item: any, idx: number) => ({
          id: item.id || `sel-${idx}`,
          selection_order: item.selection_order ?? idx + 1,
          filename: item.gallery_photos?.filename || 'Unknown',
        }));
        setPhotos(mapped);
      } else if (error) {
        toast.error('Gagal memuat daftar foto pilihan: ' + error.message);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data pilihan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nilai aman (tangani null pada client_name atau event_date)
  const clientName = gallery.client_name || 'Klien';
  const clientSlug = gallery.client_slug || 'galeri';
  const eventDateFormatted = gallery.event_date
    ? new Date(gallery.event_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Daftar nama file satu per baris (LF)
  const fileListNewline = photos.map((p) => p.filename).join('\n');

  // Daftar untuk Lightroom: nama dasar tanpa ekstensi, unik, dipisah spasi
  const lightroomQueryString = Array.from(
    new Set(photos.map((p) => getBaseName(p.filename)).filter(Boolean))
  ).join(' ');

  // A. Salin daftar nama file satu per baris
  const handleCopyNewline = async () => {
    if (photos.length === 0) return;
    const ok = await copyToClipboard(fileListNewline);
    if (ok) {
      setCopiedType('newline');
      toast.success('Daftar nama file berhasil disalin ke clipboard.');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // B. Salin untuk filter Lightroom
  const handleCopyLightroom = async () => {
    if (photos.length === 0) return;
    const ok = await copyToClipboard(lightroomQueryString);
    if (ok) {
      setCopiedType('lightroom');
      toast.success('Teks filter Lightroom berhasil disalin ke clipboard.');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // C. Unduh berkas .txt (UTF-8, akhir baris LF, nama file aman)
  const handleDownloadTxt = () => {
    if (photos.length === 0) return;
    const safeBaseName = (clientSlug || clientName)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${safeBaseName || 'foto'}_pilihan.txt`;

    const blob = new Blob([fileListNewline + '\n'], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Berkas ${filename} berhasil diunduh.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="selected-photos-modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-panel border border-garis shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col font-sans text-tinta overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-garis flex items-start justify-between bg-kertas/40 shrink-0">
          <div>
            <h3
              id="selected-photos-modal-title"
              className="text-xl sm:text-2xl font-serif font-normal text-tinta"
            >
              Foto Pilihan: {clientName}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-tinta-lembut flex-wrap">
              <span>{photos.length} foto dipilih klien</span>
              {eventDateFormatted && (
                <>
                  <span className="text-garis">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-tinta-lembut" />
                    {eventDateFormatted}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-tinta-lembut hover:text-tinta hover:bg-kertas-tua rounded-btn transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-garis bg-kertas/20 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('siapkan')}
            className={`py-3 px-4 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 min-h-[44px] ${
              activeTab === 'siapkan'
                ? 'border-merah text-merah'
                : 'border-transparent text-tinta-lembut hover:text-tinta'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Siapkan File untuk Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daftar')}
            className={`py-3 px-4 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 min-h-[44px] ${
              activeTab === 'daftar'
                ? 'border-merah text-merah'
                : 'border-transparent text-tinta-lembut hover:text-tinta'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Daftar Urutan ({photos.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="text-center text-tinta-lembut py-12 text-xs font-mono">
              Memuat data foto pilihan...
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center text-tinta-lembut py-12 border border-dashed border-garis rounded-chip p-6 bg-kertas/20 text-xs font-mono space-y-2">
              <AlertCircle className="w-8 h-8 text-tinta-lembut mx-auto" />
              <p className="text-sm font-sans font-medium text-tinta">
                Belum Ada Foto yang Dipilih
              </p>
              <p className="text-tinta-lembut">
                Klien belum mengirimkan seleksi foto untuk galeri ini.
              </p>
            </div>
          ) : activeTab === 'siapkan' ? (
            /* PANEL SIAPKAN FILE UNTUK EDIT */
            <div className="space-y-6">
              {/* OPSI TINGKAT 1: Ekspor Teks & Lightroom */}
              <div className="border border-garis rounded-chip p-4 sm:p-5 bg-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-garis pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-merah" />
                    <h4 className="text-sm font-sans font-bold text-tinta">
                      Tingkat 1: Format Teks & Lightroom (Bebas Peramban)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-kertas text-tinta-lembut border border-garis rounded-chip">
                    Cepat
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tombol Salin untuk Lightroom */}
                  <button
                    type="button"
                    onClick={handleCopyLightroom}
                    className="p-3 text-left bg-kertas hover:bg-kertas-tua border border-garis hover:border-tinta rounded-btn transition-colors flex flex-col justify-between min-h-[44px]"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-tinta">
                        Salin untuk Lightroom
                      </span>
                      {copiedType === 'lightroom' ? (
                        <Check className="w-4 h-4 text-merah" />
                      ) : (
                        <Copy className="w-4 h-4 text-tinta-lembut" />
                      )}
                    </div>
                    <span className="text-[11px] text-tinta-lembut font-mono truncate">
                      {lightroomQueryString || 'Nama dasar dipisah spasi'}
                    </span>
                  </button>

                  {/* Tombol Salin Nama File Satu Per Baris */}
                  <button
                    type="button"
                    onClick={handleCopyNewline}
                    className="p-3 text-left bg-kertas hover:bg-kertas-tua border border-garis hover:border-tinta rounded-btn transition-colors flex flex-col justify-between min-h-[44px]"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-tinta">
                        Salin Daftar Nama File
                      </span>
                      {copiedType === 'newline' ? (
                        <Check className="w-4 h-4 text-merah" />
                      ) : (
                        <Copy className="w-4 h-4 text-tinta-lembut" />
                      )}
                    </div>
                    <span className="text-[11px] text-tinta-lembut font-mono">
                      Satu file per baris (urut pilihan)
                    </span>
                  </button>
                </div>

                {/* Tombol Unduh .txt */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="w-full py-2.5 px-4 bg-white border border-garis hover:border-tinta hover:bg-kertas-tua text-tinta rounded-btn text-xs font-medium font-sans transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Download className="w-3.5 h-3.5 text-tinta-lembut" />
                    <span>Unduh Daftar File Pilihan (.txt UTF-8)</span>
                  </button>
                </div>

                {/* Petunjuk Penggunaan Lightroom */}
                <div className="bg-kertas/60 border border-garis rounded-chip p-3.5 text-xs space-y-1.5 text-tinta-lembut">
                  <div className="flex items-center gap-1.5 font-bold text-tinta font-mono text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 text-merah" />
                    <span>Petunjuk Tempel di Lightroom Classic / CC:</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    1. Masuk ke modul <strong>Library</strong> lalu tekan tombol{' '}
                    <kbd className="px-1 py-0.5 bg-white border border-garis rounded font-mono text-[10px]">
                      \
                    </kbd>{' '}
                    untuk membuka Filter Bar.
                    <br />
                    2. Pilih tab <strong>Text</strong>, atur kolom pencarian ke{' '}
                    <strong>Filename</strong> dan <strong>Contains Any</strong>{' '}
                    (Berisi Salah Satu).
                    <br />
                    3. Tempelkan (Paste) hasil salin di kolom teks.
                  </p>
                  <p className="text-[10px] text-tinta-lembut/80 italic">
                    Catatan: Fitur filter teks dapat sedikit berbeda tergantung versi
                    Lightroom Classic atau Lightroom CC yang Anda gunakan.
                  </p>
                </div>
              </div>

              {/* OPSI TINGKAT 2: Salin File Langsung ke Folder Komputer */}
              <div className="border border-garis rounded-chip p-4 sm:p-5 bg-kertas/30 space-y-3">
                <div className="flex items-center justify-between border-b border-garis pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-merah" />
                    <h4 className="text-sm font-sans font-bold text-tinta">
                      Tingkat 2: Salin File Langsung ke Folder (Otomatis)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-merah/10 text-merah border border-merah/20 rounded-chip">
                    Desktop
                  </span>
                </div>

                <p className="text-xs text-tinta-lembut leading-relaxed">
                  Pindai folder harddisk / kartu memori Anda secara lokal, cocokkan
                  dengan foto pilihan klien (RAW / XMP / JPG), dan salin ke folder
                  tujuan kerja tanpa mengunggah file ke internet.
                </p>

                <button
                  type="button"
                  onClick={() => setShowLocalCopyModal(true)}
                  className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Buka Dialog Salin ke Folder Lokal...</span>
                </button>
              </div>
            </div>
          ) : (
            /* TAB DAFTAR FOTO TERPILIH */
            <div className="space-y-1.5">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-chip hover:bg-kertas border border-transparent hover:border-garis transition-colors"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-kertas-tua text-merah border border-garis text-xs font-mono rounded-chip shrink-0">
                    {photo.selection_order}
                  </span>
                  <span className="text-sm text-tinta font-mono truncate">
                    {photo.filename}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-garis bg-kertas/30 flex items-center justify-between shrink-0">
          <div className="text-xs font-mono text-tinta-lembut">
            Total {photos.length} file terdaftar
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-garis hover:border-tinta hover:bg-kertas-tua text-tinta rounded-btn text-xs font-medium font-sans min-h-[44px]"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Dialog Tingkat 2 (Lazy Loaded) */}
      {showLocalCopyModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-white font-mono text-xs">
              Memuat modul penyalin lokal...
            </div>
          }
        >
          <LocalFileCopyDialog
            isOpen={showLocalCopyModal}
            onClose={() => setShowLocalCopyModal(false)}
            selectedFilenames={photos.map((p) => p.filename)}
            galleryName={clientName}
            gallerySlug={clientSlug}
            onFallbackCopyLightroom={handleCopyLightroom}
            onFallbackCopyList={handleCopyNewline}
            onFallbackDownloadTxt={handleDownloadTxt}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SelectedPhotosModal;
