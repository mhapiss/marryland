import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { rescanDriveFolder, generateAlbumToken } from '../lib/drive';
import { copyToClipboard } from '../lib/clipboard';
import { toast } from 'sonner';
import {
  X,
  RefreshCw,
  Lock,
  Calendar,
  Share2,
  Check,
  Copy,
  AlertTriangle,
  Download,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import type { Gallery } from '../pages/Dashboard';

interface Props {
  gallery: Gallery | null;
  onClose: () => void;
  onGalleryUpdated: (updated: Gallery) => void;
}

export default function GallerySettingsModal({ gallery, onClose, onGalleryUpdated }: Props) {
  if (!gallery) return null;

  const [isLoading, setIsLoading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Form State
  const [maxPhotos, setMaxPhotos] = useState(gallery.max_photos_selectable || 50);
  const [deadlineDate, setDeadlineDate] = useState(gallery.deadline_date || '');
  const [allowDownload, setAllowDownload] = useState(gallery.allow_download ?? false);

  // Album State
  const [albumEnabled, setAlbumEnabled] = useState(Boolean(gallery.album_enabled));
  const [albumToken, setAlbumToken] = useState(gallery.album_token || '');
  const [albumPin, setAlbumPin] = useState('');
  const [albumExpiresAt, setAlbumExpiresAt] = useState(
    gallery.album_expires_at ? gallery.album_expires_at.slice(0, 10) : ''
  );
  const [albumAllowDownload, setAlbumAllowDownload] = useState(
    Boolean(gallery.album_allow_download)
  );
  const [albumScope, setAlbumScope] = useState<'all' | 'selected_only'>(
    gallery.album_scope || 'all'
  );

  const origin = window.location.origin;
  const albumLink = albumToken
    ? `${origin}/album/${gallery.client_slug}?t=${albumToken}`
    : `${origin}/album/${gallery.client_slug}`;

  // Handle Save Gallery & Album Settings
  const handleSave = async () => {
    setIsLoading(true);
    try {
      let pinHash = gallery.album_pin_hash;
      if (albumPin.trim()) {
        // Hash PIN on client side with salt before sending to match SQL RPC verification
        const encoder = new TextEncoder();
        const data = encoder.encode(albumPin.trim() + 'marryland_pin_salt');
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        pinHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } else if (albumPin === '__CLEAR__') {
        pinHash = null;
      }

      // Ensure token exists if album enabled
      let finalToken = albumToken;
      if (albumEnabled && !finalToken) {
        finalToken = generateAlbumToken();
        setAlbumToken(finalToken);
      }

      const updates: any = {
        max_photos_selectable: Number(maxPhotos),
        deadline_date: deadlineDate || null,
        allow_download: Boolean(allowDownload),
        album_enabled: Boolean(albumEnabled),
        album_token: finalToken || null,
        album_pin_hash: pinHash,
        album_expires_at: albumExpiresAt ? new Date(albumExpiresAt).toISOString() : null,
        album_allow_download: Boolean(albumAllowDownload),
        album_scope: albumScope,
      };

      const { data: updated, error } = await supabase
        .from('galleries')
        .update(updates)
        .eq('id', gallery.id)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('album_enabled') || error.message?.includes('column')) {
          throw new Error(
            'Kolom album belum terpasang di database Supabase. Jalankan berkas migrasi 20261004_gallery_security_and_albums.sql di Supabase SQL Editor untuk mengaktifkan fitur ini.'
          );
        }
        throw error;
      }

      toast.success('Pengaturan galeri dan album berhasil diperbarui.');
      onGalleryUpdated(updated || { ...gallery, ...updates });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Rescan Drive Folder
  const handleRescan = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      toast.error('API Key Google Drive belum dikonfigurasi.');
      return;
    }

    setIsRescanning(true);
    try {
      const result = await rescanDriveFolder(gallery.id, gallery.gdrive_folder_id, apiKey);
      toast.success(
        `Pemindaian selesai: ${result.addedCount} foto baru ditambahkan. Pilihan klien tetap utuh.`
      );
      if (result.missingCount > 0) {
        toast.info(`${result.missingCount} foto yang dihapus dari Drive telah ditandai.`);
      }
    } catch (err: any) {
      toast.error('Gagal memindai ulang folder: ' + err.message);
    } finally {
      setIsRescanning(false);
    }
  };

  // Handle Regenerate Token
  const handleRegenerateTokenConfirm = async () => {
    setShowRegenerateConfirm(false);
    const newToken = generateAlbumToken();
    setAlbumToken(newToken);
    toast.info('Tautan album baru dibuat. Klik "Simpan Perubahan" untuk memberlakukannya.');
  };

  const handleCopyAlbumLink = async () => {
    const ok = await copyToClipboard(albumLink);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Galeri & Album"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-garis rounded-[2px] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col font-sans text-tinta"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-garis flex items-center justify-between bg-kertas-tua/40">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-merah bg-merah/10 border border-merah/25 px-2 py-0.5 rounded-[2px]">
              Pengaturan Galeri
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-tinta mt-1">
              {gallery.client_name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-tinta-lembut hover:text-merah transition-colors rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* SECTION 1: DASAR GALERI & RESCAN */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-tinta pb-2 border-b border-garis flex items-center justify-between">
              <span>Kurasi & Tenggat Waktu</span>
              <button
                type="button"
                onClick={handleRescan}
                disabled={isRescanning}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-kertas hover:bg-white border border-garis rounded-[2px] text-xs font-mono text-tinta hover:text-merah transition-colors disabled:opacity-50 min-h-[36px]"
                title="Pindai file baru di Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin text-merah' : ''}`} />
                <span>{isRescanning ? 'Memindai...' : 'Pindai Ulang Drive'}</span>
              </button>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-1.5">
                  Batas Maksimal Foto Dipilih
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxPhotos}
                  onChange={(e) => setMaxPhotos(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-1.5">
                  Tenggat Waktu Klien
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="w-4 h-4 accent-merah rounded-[2px]"
              />
              <span className="text-xs text-tinta-lembut group-hover:text-tinta transition-colors">
                Izinkan klien mengunduh foto pilihan dari halaman seleksi
              </span>
            </label>
          </div>

          {/* SECTION 2: ALBUM KELUARGA (LINK KEDUA) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-garis">
              <div>
                <h3 className="font-serif text-lg text-tinta">Album Keluarga (Tautan Kedua)</h3>
                <p className="text-xs text-tinta-lembut font-mono mt-0.5">
                  Tautan terpisah tanpa tombol pilih untuk dibagikan ke sanak keluarga.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={albumEnabled}
                  onChange={(e) => {
                    setAlbumEnabled(e.target.checked);
                    if (e.target.checked && !albumToken) {
                      setAlbumToken(generateAlbumToken());
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-garis peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-garis after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-merah"></div>
              </label>
            </div>

            {albumEnabled && (
              <div className="space-y-5 bg-kertas/60 p-4 border border-garis rounded-[2px] animate-in fade-in duration-200">
                {/* Tautan Album & Buat Ulang Token */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-tinta-lembut">
                      Tautan Publik Album Keluarga
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRegenerateConfirm(true)}
                      className="text-[11px] font-mono text-merah hover:underline"
                    >
                      Buat Ulang Tautan
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={albumLink}
                      className="w-full px-3 py-2 bg-white border border-garis text-tinta text-xs font-mono rounded-[2px] select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyAlbumLink}
                      className="px-3 py-2 bg-white hover:bg-kertas border border-garis text-tinta text-xs font-mono rounded-[2px] transition-colors shrink-0 flex items-center gap-1.5 min-h-[38px]"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-sukses" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* PIN Pengaman & Batas Kedaluwarsa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-1.5">
                      Kunci PIN (Opsional, 4–6 digit)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder={gallery.album_pin_hash ? '•••••• (Sudah aktif)' : 'Contoh: 1234'}
                      value={albumPin}
                      onChange={(e) => setAlbumPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah font-mono tracking-widest"
                    />
                    {gallery.album_pin_hash && (
                      <button
                        type="button"
                        onClick={() => {
                          setAlbumPin('__CLEAR__');
                          toast.info('PIN akan dihapus saat disimpan.');
                        }}
                        className="text-[10px] font-mono text-merah hover:underline mt-1 block"
                      >
                        Hapus Kunci PIN
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-1.5">
                      Kedaluwarsa Album
                    </label>
                    <input
                      type="date"
                      value={albumExpiresAt}
                      onChange={(e) => setAlbumExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah font-mono"
                    />
                  </div>
                </div>

                {/* Cakupan Foto */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-tinta-lembut mb-1.5">
                    Cakupan Foto yang Ditampilkan di Album
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-white border border-garis rounded-[2px] cursor-pointer">
                      <input
                        type="radio"
                        name="album_scope"
                        checked={albumScope === 'all'}
                        onChange={() => setAlbumScope('all')}
                        className="accent-merah"
                      />
                      <span className="text-xs text-tinta">Semua Foto di Google Drive</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-white border border-garis rounded-[2px] cursor-pointer">
                      <input
                        type="radio"
                        name="album_scope"
                        checked={albumScope === 'selected_only'}
                        onChange={() => setAlbumScope('selected_only')}
                        className="accent-merah"
                      />
                      <span className="text-xs text-tinta">Hanya Foto Pilihan Klien</span>
                    </label>
                  </div>
                </div>

                {/* Saklar Unduh Album */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={albumAllowDownload}
                    onChange={(e) => setAlbumAllowDownload(e.target.checked)}
                    className="w-4 h-4 accent-merah rounded-[2px]"
                  />
                  <span className="text-xs text-tinta-lembut group-hover:text-tinta transition-colors">
                    Tampilkan tombol unduh foto di album keluarga
                  </span>
                </label>

                {/* KETERBATASAN JUJUR (Sesuai Aturan Transparansi Teknis) */}
                <div className="p-3.5 bg-kertas-tua/50 border border-garis rounded-[2px] text-xs text-tinta-lembut space-y-1 font-mono leading-relaxed">
                  <div className="flex items-center gap-1.5 text-merah font-semibold uppercase tracking-wider text-[11px]">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Transparansi Teknis & Keamanan</span>
                  </div>
                  <p>
                    PIN mengamankan halaman album by.marryland, bukan folder Google Drive aslinya. Orang yang memiliki tautan langsung ke Google Drive tetap dapat membukanya. Saklar unduh hanya menyembunyikan tombol unduh di website.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-garis bg-kertas flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-garis rounded-[2px] text-xs font-medium text-tinta-lembut hover:text-tinta transition-colors min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-7 py-2.5 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-xs font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      {/* Confirm Regenerate Token */}
      <ConfirmDialog
        open={showRegenerateConfirm}
        title="Buat Ulang Tautan Album?"
        message="Tautan album keluarga yang lama akan langsung mati dan tidak dapat diakses lagi oleh siapa pun. Tautan baru harus Anda bagikan ulang."
        confirmLabel="Ya, Buat Tautan Baru"
        cancelLabel="Batal"
        onConfirm={handleRegenerateTokenConfirm}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </div>
  );
}
