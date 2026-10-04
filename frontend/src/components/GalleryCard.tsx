import React, { useState, useRef, useEffect } from 'react';
import type { Gallery } from '../pages/Dashboard';
import { isDeadlinePassed, daysUntilDeadline } from '../lib/deadline';
import {
  Send,
  Copy,
  Check,
  Settings,
  Trash2,
  Images,
  BookOpen,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Props {
  gallery: Gallery;
  onViewSelections: (gallery: Gallery) => void;
  onDelete: (gallery: Gallery) => void;
  onSendClientMessage: (gallery: Gallery) => void;
  onOpenSettings: (gallery: Gallery) => void;
  onCopySelectLink: (gallery: Gallery) => void;
  onCopyAlbumLink: (gallery: Gallery) => void;
}

export default function GalleryCard({
  gallery,
  onViewSelections,
  onDelete,
  onSendClientMessage,
  onOpenSettings,
  onCopySelectLink,
  onCopyAlbumLink,
}: Props) {
  const [copiedSelect, setCopiedSelect] = useState(false);
  const [copiedAlbum, setCopiedAlbum] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  const selectedCount = gallery.selected_count || 0;
  const maxPhotos = gallery.max_photos_selectable || 50;
  const progressPercent = Math.min((selectedCount / maxPhotos) * 100, 100);

  // Check deadline status
  const deadlineDate = gallery.deadline_date ? new Date(gallery.deadline_date) : null;
  const isExpired = isDeadlinePassed(gallery.deadline_date);
  const daysLeft = daysUntilDeadline(gallery.deadline_date);

  // Determine gallery status chip
  const renderStatusChip = () => {
    if (isExpired && gallery.status !== 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-merah/10 text-merah border border-merah/30">
          <Clock className="w-3 h-3" />
          Kedaluwarsa
        </span>
      );
    }
    if (gallery.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-green-900/10 text-green-800 border border-green-800/30">
          <Check className="w-3 h-3" />
          Pilihan Terkirim ({selectedCount} Foto)
        </span>
      );
    }
    if (selectedCount >= maxPhotos) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-green-900/10 text-green-800 border border-green-800/30">
          <Check className="w-3 h-3" />
          Kuota Penuh ({selectedCount}/{maxPhotos})
        </span>
      );
    }
    if (selectedCount > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-kertas-tua text-tinta border border-garis">
          <span className="w-1.5 h-1.5 rounded-full bg-merah animate-pulse" />
          Sedang Memilih ({selectedCount}/{maxPhotos})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-kertas text-tinta-lembut border border-garis">
        Menunggu
      </span>
    );
  };

  const handleCopySelect = () => {
    onCopySelectLink(gallery);
    setCopiedSelect(true);
    setTimeout(() => setCopiedSelect(false), 2000);
  };

  const handleCopyAlbum = () => {
    onCopyAlbumLink(gallery);
    if (gallery.album_enabled) {
      setCopiedAlbum(true);
      setTimeout(() => setCopiedAlbum(false), 2000);
    }
  };

  return (
    <div
      className={`bg-white border rounded-[2px] p-5 sm:p-6 flex flex-col font-sans text-tinta transition-all ${
        isExpired ? 'border-merah/40 bg-kertas/30' : 'border-garis hover:border-garis/80'
      }`}
    >
      {/* Top row: Client Name & Status Chip */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-serif font-normal text-tinta text-xl sm:text-2xl leading-tight">
              {gallery.client_name}
            </h3>
            {gallery.album_enabled && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-merah/5 text-merah border border-merah/20 rounded-[2px]">
                Album Keluarga Aktif
              </span>
            )}
          </div>

          {/* Subtitle / Details */}
          <div className="flex items-center text-xs text-tinta-lembut font-mono gap-2 flex-wrap">
            <span>
              {gallery.event_date
                ? new Date(gallery.event_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Tanggal belum diatur'}
            </span>
            <span className="text-garis">•</span>
            <span>Maks {maxPhotos} foto</span>
            {deadlineDate && (
              <>
                <span className="text-garis">•</span>
                <span
                  className={
                    isExpired
                      ? 'text-merah font-bold'
                      : daysLeft !== null && daysLeft <= 3
                      ? 'text-amber-800 font-bold'
                      : ''
                  }
                >
                  {isExpired
                    ? 'Lewat tenggat'
                    : daysLeft === 0
                    ? 'Tenggat hari ini'
                    : `Sisa ${daysLeft} hari`}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0">{renderStatusChip()}</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 bg-kertas rounded-[2px] p-3.5 border border-garis">
        <div className="flex items-center justify-between text-[11px] font-mono text-tinta-lembut uppercase tracking-wider mb-2">
          <span>Progres Pemilihan</span>
          <span className="text-merah font-bold">
            {selectedCount} dari {maxPhotos} foto ({Math.round(progressPercent)}%)
          </span>
        </div>
        <div className="w-full bg-kertas-tua rounded-[2px] h-2 overflow-hidden">
          <div
            className={`h-full rounded-[2px] transition-all duration-700 ease-out ${
              isExpired ? 'bg-tinta-lembut' : 'bg-merah'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => onViewSelections(gallery)}
          className="w-full py-2.5 px-4 text-xs sm:text-sm bg-white border border-garis hover:border-merah text-tinta hover:text-merah rounded-[2px] font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Images className="w-4 h-4 text-merah" />
          <span>Lihat Foto Pilihan ({selectedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onSendClientMessage(gallery)}
          className="w-full py-2.5 px-4 text-xs sm:text-sm bg-merah hover:bg-merah-hover text-white rounded-[2px] font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Send className="w-4 h-4" />
          <span>Kirim ke Klien</span>
        </button>
      </div>

      {/* Action Row & Secondary Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-garis">
        {/* Desktop Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Salin link pilih foto */}
          <button
            type="button"
            onClick={handleCopySelect}
            className="p-2 sm:px-3 sm:py-1.5 bg-kertas hover:bg-kertas-tua text-tinta text-xs font-mono rounded-[2px] border border-garis transition-colors flex items-center gap-1.5"
            title="Salin tautan kurasi foto untuk klien"
            aria-label="Salin tautan kurasi foto"
          >
            {copiedSelect ? (
              <>
                <Check className="w-3.5 h-3.5 text-merah" />
                <span className="hidden sm:inline text-merah">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-tinta-lembut" />
                <span className="hidden sm:inline">Link Pilih</span>
              </>
            )}
          </button>

          {/* Salin link album keluarga */}
          <button
            type="button"
            onClick={handleCopyAlbum}
            className={`p-2 sm:px-3 sm:py-1.5 text-xs font-mono rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              gallery.album_enabled
                ? 'bg-kertas hover:bg-kertas-tua text-tinta border-garis'
                : 'bg-kertas/50 hover:bg-kertas text-tinta-lembut/70 border-dashed border-garis'
            }`}
            title={
              gallery.album_enabled
                ? 'Salin tautan album keluarga'
                : 'Album keluarga belum aktif. Klik untuk mengatur dan mengaktifkan.'
            }
            aria-label="Tautan album keluarga"
          >
            {copiedAlbum ? (
              <>
                <Check className="w-3.5 h-3.5 text-merah" />
                <span className="hidden sm:inline text-merah">Tersalin!</span>
              </>
            ) : (
              <>
                <BookOpen
                  className={`w-3.5 h-3.5 ${
                    gallery.album_enabled ? 'text-merah' : 'text-tinta-lembut/50'
                  }`}
                />
                <span className="hidden sm:inline">
                  {gallery.album_enabled ? 'Link Album' : 'Aktifkan Album'}
                </span>
              </>
            )}
          </button>

          {/* Pengaturan Galeri */}
          <button
            type="button"
            onClick={() => onOpenSettings(gallery)}
            className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-kertas text-tinta text-xs font-mono rounded-[2px] border border-garis transition-colors flex items-center gap-1.5"
            title="Pengaturan galeri, album, dan pindai ulang Google Drive"
            aria-label="Pengaturan galeri"
          >
            <Settings className="w-3.5 h-3.5 text-tinta-lembut" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>

        {/* Right side: Delete & Mobile Dropdown */}
        <div className="flex items-center gap-2">
          {/* Desktop Delete button */}
          <button
            type="button"
            onClick={() => onDelete(gallery)}
            className="hidden sm:flex items-center gap-1 p-2 text-tinta-lembut hover:text-merah transition-colors rounded-[2px]"
            title="Hapus galeri"
            aria-label="Hapus galeri"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Mobile Overflow Menu */}
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-tinta-lembut hover:text-tinta border border-garis rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Menu opsi lainnya"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-garis rounded-[2px] shadow-lg py-1.5 z-20 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenSettings(gallery);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-kertas flex items-center gap-2 text-tinta"
                >
                  <Settings className="w-4 h-4 text-tinta-lembut" />
                  <span>Pengaturan & Rescan Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleCopyAlbum();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-kertas flex items-center gap-2 text-tinta"
                >
                  <BookOpen className="w-4 h-4 text-tinta-lembut" />
                  <span>
                    {gallery.album_enabled ? 'Salin Link Album' : 'Aktifkan Album Keluarga'}
                  </span>
                </button>

                <div className="border-t border-garis my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onDelete(gallery);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-merah/10 flex items-center gap-2 text-merah"
                >
                  <Trash2 className="w-4 h-4 text-merah" />
                  <span>Hapus Galeri</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
