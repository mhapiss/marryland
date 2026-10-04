import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';
import { usePageMeta } from '../hooks/usePageMeta';
import { usePageContent } from '../hooks/useContent';
import {
  ArrowLeft,
  Check,
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Info,
} from 'lucide-react';

interface DemoPhoto {
  id: string;
  filename: string;
  url: string;
}

const SAMPLE_DEMO_PHOTOS: DemoPhoto[] = [
  { id: 'dp1', filename: 'IMG_0101_Akad_Nikah.JPG', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp2', filename: 'IMG_0102_Tukar_Cincin.JPG', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp3', filename: 'IMG_0103_Resepsi_Senja.JPG', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp4', filename: 'IMG_0104_Keluarga_Besar.JPG', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp5', filename: 'IMG_0105_Tawa_Bahagia.JPG', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp6', filename: 'IMG_0106_Detail_Gaun.JPG', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp7', filename: 'IMG_0107_Dekorasi_Bunga.JPG', url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dp8', filename: 'IMG_0108_Pelukan_Haru.JPG', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80' },
];

const MAX_SELECTABLE = 5;

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderParam = searchParams.get('folder');

  usePageMeta({
    title: 'Simulasi Galeri Klien (Demo) | by.marryland',
    description: 'Coba langsung kemudahan pengalaman klien memilih foto dari galeri simulasi by.marryland.',
  });

  const { content } = usePageContent('demo');
  const notice_text =
    content?.banner?.notice_text ||
    'Mode Simulasi Klien: Kamu sedang mencoba tampilan galeri pemilih foto. Tidak ada yang disimpan ke database. Tutup halaman, semuanya hilang.';
  const gallery_title = content?.gallery_info?.gallery_title || 'Galeri: Radit & Amanda (Demo)';
  const gallery_instruction =
    content?.gallery_info?.gallery_instruction ||
    'Ketuk foto untuk memperbesar, lalu tandai foto favoritmu hingga kuota terpenuhi.';
  const max_selection = content?.gallery_info?.max_selection || MAX_SELECTABLE;

  const [photos] = useState<DemoPhoto[]>(SAMPLE_DEMO_PHOTOS);
  const [selectedIds, setSelectedIds] = useState<string[]>(['dp1', 'dp3']);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleSelect = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSubmitted) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length >= max_selection) {
        toast.warning(`Batas maksimal pilihan demo adalah ${max_selection} foto.`);
        return prev;
      }
      return [...prev, id];
    });
  }, [isSubmitted]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      }
    };
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, photos.length]);

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta flex flex-col pb-28 selection:bg-merah selection:text-kertas">
      {/* Top Demo Simulation Banner */}
      <div className="bg-marun text-kertas px-4 py-2.5 text-xs flex items-center justify-between border-b border-garis">
        <div className="flex items-center gap-2 max-w-2xl mx-auto text-center sm:text-left">
          <Info className="w-4 h-4 text-merah-tanda shrink-0 hidden sm:block" />
          <span>
            <strong>Mode Simulasi Klien:</strong> {notice_text}
          </span>
        </div>
        <Link
          to="/untuk-klien"
          className="text-kertas hover:underline text-xs shrink-0 flex items-center gap-1 font-medium ml-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
      </div>

      {/* Header Info */}
      <header className="max-w-[1200px] mx-auto px-6 pt-10 pb-8 text-center">
        <span className="label-caps text-merah block mb-2">
          CONTOH GALERI SELEKSI KLIEN
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-tinta mb-3">
          {gallery_title}
        </h1>
        <p className="font-body text-sm text-tinta-lembut max-w-lg mx-auto">
          {folderParam ? `Memuat simulasi dengan folder: ${folderParam}` : gallery_instruction}
        </p>
      </header>

      {/* Photo Grid */}
      <main className="max-w-[1200px] mx-auto px-6 flex-1 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {photos.map((photo, index) => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className={`group relative aspect-[3/4] bg-[#f7f5f0] rounded-[2px] overflow-hidden border cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-merah-tanda border-merah-tanda shadow-sm'
                    : 'border-garis hover:border-tinta/40'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Permanent Selected Badge: Spidol Merah */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-merah-tanda text-kertas rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Select/Deselect Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                  <div className="text-right">
                    <button
                      onClick={(e) => toggleSelect(photo.id, e)}
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-colors shadow-sm ${
                        isSelected
                          ? 'bg-merah-tanda text-kertas hover:bg-merah'
                          : 'bg-merah text-kertas hover:bg-merah-hover'
                      }`}
                    >
                      {isSelected ? 'Batal Pilih' : 'Pilih Foto'}
                    </button>
                  </div>

                  <div className="text-white text-[11px] font-mono truncate">
                    {photo.filename}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-kertas/95 backdrop-blur-md border-t border-garis z-30 p-4">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-xs text-tinta-lembut block">Progress Pilihan Foto:</span>
              <span className="font-serif text-xl font-normal text-tinta">
                {selectedIds.length}{' '}
                <span className="text-sm font-sans font-normal text-tinta-lembut">
                  / {MAX_SELECTABLE} foto
                </span>
              </span>
            </div>

            <div className="w-32 bg-kertas-tua border border-garis rounded-[2px] h-2.5 overflow-hidden">
              <div
                className="bg-merah-tanda h-full transition-all duration-300"
                style={{ width: `${(selectedIds.length / MAX_SELECTABLE) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowReview(true)}
              className="flex-1 sm:flex-none border border-tinta/40 text-tinta hover:bg-kertas-tua px-5 py-2.5 text-xs font-semibold rounded-[2px] transition-colors min-h-[44px]"
            >
              Tinjau Pilihan ({selectedIds.length})
            </button>

            <button
              onClick={() => {
                if (selectedIds.length === 0) {
                  toast.warning('Pilih minimal 1 foto sebelum mengirim.');
                  return;
                }
                setIsSubmitted(true);
                toast.success('Simulasi selesai! Pilihan foto sukses terkirim.');
              }}
              className="flex-1 sm:flex-none bg-merah hover:bg-merah-hover text-kertas px-6 py-2.5 text-xs font-semibold rounded-[2px] transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              <span>{isSubmitted ? 'Terkirim (Simulasi Selesai)' : 'Kirim Pilihan'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white px-4 py-2">
            <span className="text-xs font-mono text-white/70">
              {lightboxIndex + 1} / {photos.length} - {photos[lightboxIndex].filename}
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 text-white/80 hover:text-white rounded min-h-[44px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <TransformWrapper initialScale={1} minScale={0.8} maxScale={4}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="w-full h-full flex items-center justify-center relative">
                  <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                    <img
                      src={photos[lightboxIndex].url}
                      alt={photos[lightboxIndex].filename}
                      className="max-h-[75vh] max-w-full object-contain select-none"
                    />
                  </TransformComponent>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-3 text-white">
                    <button onClick={() => zoomOut()} className="p-1 hover:text-merah-tanda">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => resetTransform()} className="text-[11px] font-mono hover:text-merah-tanda">
                      Reset
                    </button>
                    <button onClick={() => zoomIn()} className="p-1 hover:text-merah-tanda">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </TransformWrapper>
          </div>

          {/* Navigation Controls */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/40 rounded-full min-h-[44px]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/40 rounded-full min-h-[44px]"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom toggle button */}
          <div className="text-center pb-2">
            <button
              onClick={() => toggleSelect(photos[lightboxIndex].id)}
              className={`px-6 py-2.5 rounded-[2px] text-xs font-semibold transition-colors ${
                selectedIds.includes(photos[lightboxIndex].id)
                  ? 'bg-merah-tanda text-kertas hover:bg-merah'
                  : 'bg-merah text-kertas hover:bg-merah-hover'
              }`}
            >
              {selectedIds.includes(photos[lightboxIndex].id) ? 'Batal Pilih Foto Ini' : 'Pilih Foto Ini'}
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-kertas border border-garis rounded-[2px] w-full max-w-xl p-6 shadow-elevated">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-garis">
              <div>
                <h3 className="font-serif text-xl font-normal text-tinta">Ringkasan Foto Terpilih</h3>
                <p className="text-xs text-tinta-lembut">Total: {selectedIds.length} dari {MAX_SELECTABLE} foto</p>
              </div>
              <button onClick={() => setShowReview(false)} className="p-2 min-h-[44px]">
                <X className="w-5 h-5 text-tinta-lembut" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto mb-6">
              {selectedIds.map((id) => {
                const photo = photos.find((p) => p.id === id);
                if (!photo) return null;
                return (
                  <div key={id} className="aspect-square relative rounded-[2px] overflow-hidden bg-[#f7f5f0] border border-garis">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => toggleSelect(id)}
                      className="absolute top-1 right-1 bg-merah-tanda text-kertas w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1 border border-tinta/40 text-tinta hover:bg-kertas-tua py-2.5 text-xs font-medium rounded-[2px] transition-colors min-h-[44px]"
              >
                Tutup Ringkasan
              </button>
              <button
                onClick={() => {
                  setShowReview(false);
                  setIsSubmitted(true);
                  toast.success('Pilihan foto berhasil disimulasikan!');
                }}
                className="flex-1 bg-merah hover:bg-merah-hover text-kertas py-2.5 text-xs font-semibold rounded-[2px] transition-colors min-h-[44px]"
              >
                Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
