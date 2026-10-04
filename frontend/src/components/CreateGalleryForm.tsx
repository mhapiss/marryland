import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import {
  parseDriveFolder,
  verifyDriveFolder,
  fetchAllDriveImages,
  generateUniqueSlug,
  normalizeWhatsApp,
  generateAlbumToken,
  DriveVerifyError,
} from '../lib/drive';
import type { Gallery } from '../pages/Dashboard';
import { CheckCircle2, AlertCircle, RefreshCw, FolderSearch, Calendar, Phone, Sparkles } from 'lucide-react';

interface Props {
  onGalleryCreated: (gallery: Gallery) => void;
}

const DEADLINE_OPTIONS = [
  { label: '7 Hari', days: 7 },
  { label: '14 Hari (Rekomendasi)', days: 14 },
  { label: '30 Hari', days: 30 },
  { label: '60 Hari', days: 60 },
  { label: '90 Hari', days: 90 },
  { label: 'Tanpa Batas', days: 0 },
  { label: 'Kustom Tanggal', days: -1 },
];

const CreateGalleryForm: React.FC<Props> = ({ onGalleryCreated }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Form Fields
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxPhotos, setMaxPhotos] = useState<number>(50);
  const [deadlinePreset, setDeadlinePreset] = useState<number>(14);
  const [customDeadline, setCustomDeadline] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [highlightDescription, setHighlightDescription] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);

  // Folder Verification State
  const [isCheckingFolder, setIsCheckingFolder] = useState(false);
  const [folderCheckResult, setFolderCheckResult] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    folderId?: string;
    folderName?: string;
    errorType?: DriveVerifyError;
    message?: string;
  }>({ status: 'idle' });

  // Calculate deadline date string
  const getComputedDeadline = (): string | null => {
    if (deadlinePreset === 0) return null;
    if (deadlinePreset === -1) return customDeadline || null;
    const target = new Date();
    target.setDate(target.getDate() + deadlinePreset);
    return target.toISOString().split('T')[0];
  };

  // Pre-flight Drive folder check
  const handleCheckFolder = async (urlToCheck?: string) => {
    const url = (urlToCheck !== undefined ? urlToCheck : gdriveUrl).trim();
    if (!url) {
      setFolderCheckResult({
        status: 'invalid',
        errorType: 'INVALID_URL',
        message: 'Masukkan tautan folder Google Drive terlebih dahulu.',
      });
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      setFolderCheckResult({
        status: 'invalid',
        errorType: 'UNKNOWN',
        message: 'Kunci API Google Drive belum terkonfigurasi pada sistem.',
      });
      return;
    }

    setIsCheckingFolder(true);
    setFolderCheckResult({ status: 'checking' });

    try {
      const res = await verifyDriveFolder(url, apiKey);
      if (res.ok && res.folderId) {
        setFolderCheckResult({
          status: 'valid',
          folderId: res.folderId,
          folderName: res.folderName,
        });

        // Auto-fill client name if currently empty or untouched
        if (!clientName.trim() && res.folderName) {
          setClientName(res.folderName);
        }
      } else {
        setFolderCheckResult({
          status: 'invalid',
          errorType: res.errorType,
          message: res.message || 'Folder tidak dapat diakses.',
        });
      }
    } catch (err: any) {
      setFolderCheckResult({
        status: 'invalid',
        errorType: 'UNKNOWN',
        message: err.message || 'Gagal menghubungi server Google Drive.',
      });
    } finally {
      setIsCheckingFolder(false);
    }
  };

  // WhatsApp validation
  const waValidation = normalizeWhatsApp(clientWhatsapp);

  // Form validity check with reason
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    if (!gdriveUrl.trim()) {
      errors.push('Tautan Google Drive wajib diisi.');
    } else if (folderCheckResult.status !== 'valid') {
      errors.push('Folder Google Drive harus diverifikasi terlebih dahulu.');
    }

    if (!clientWhatsapp.trim()) {
      errors.push('Nomor WhatsApp klien wajib diisi.');
    } else if (!waValidation.isValid) {
      errors.push(waValidation.message || 'Nomor WhatsApp klien tidak valid.');
    }

    if (maxPhotos <= 0) {
      errors.push('Batas pilihan foto minimal 1 foto.');
    }

    if (deadlinePreset === -1 && !customDeadline) {
      errors.push('Tanggal tenggat kustom belum dipilih.');
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const isFormValid = validationErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid || !folderCheckResult.folderId) return;

    setIsLoading(true);

    try {
      const folderId = folderCheckResult.folderId;
      const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

      // 1. Fetch all photos from Google Drive following pagination & natural sort
      setSyncStatus('Memindai seluruh foto dari Google Drive...');
      const fetchResult = await fetchAllDriveImages(folderId, apiKey, (count) => {
        setSyncStatus(`Mengambil daftar foto dari Google Drive (${count} foto ditemukan)...`);
      });

      const files = fetchResult.files;
      if (files.length === 0) {
        throw new Error(
          'Tidak ditemukan file foto/gambar di dalam folder ini. Pastikan folder berisi file format JPG, PNG, atau WebP.'
        );
      }

      // 2. Generate unique slug with 8-character safe random suffix
      setSyncStatus('Membuat galeri aman...');
      const finalClientName = clientName.trim() || folderCheckResult.folderName || 'Klien';
      const clientSlug = generateUniqueSlug(finalClientName);
      const computedDeadline = getComputedDeadline();
      const defaultAlbumToken = generateAlbumToken();

      // 3. Insert Gallery into Supabase (with fallback if SQL migration hasn't been run yet)
      const insertPayload: any = {
        user_id: user.id,
        client_name: finalClientName,
        client_slug: clientSlug,
        gdrive_folder_url: gdriveUrl.trim(),
        gdrive_folder_id: folderId,
        event_date: eventDate || null,
        max_photos_selectable: Number(maxPhotos),
        deadline_date: computedDeadline,
        highlight_description: highlightDescription.trim() || null,
        client_email: clientEmail.trim() || null,
        client_whatsapp: waValidation.normalized,
        allow_download: Boolean(allowDownload),
        status: 'active',
      };

      let gallery: any = null;
      let insertError: any = null;

      const resWithAlbum = await supabase
        .from('galleries')
        .insert({
          ...insertPayload,
          album_enabled: false,
          album_token: defaultAlbumToken,
        })
        .select()
        .single();

      if (resWithAlbum.error && resWithAlbum.error.message?.includes('album_enabled')) {
        // Fallback: column album_enabled not yet added in Supabase
        const resFallback = await supabase
          .from('galleries')
          .insert(insertPayload)
          .select()
          .single();

        gallery = resFallback.data;
        insertError = resFallback.error;
      } else {
        gallery = resWithAlbum.data;
        insertError = resWithAlbum.error;
      }

      if (insertError) throw insertError;
      if (!gallery) throw new Error('Gagal menyimpan galeri baru.');

      // 4. Batch insert photos into gallery_photos
      setSyncStatus(`Menyimpan ${files.length} foto ke database...`);
      let includeMissing = true;

      const BATCH_SIZE = 400;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const chunkFiles = files.slice(i, i + BATCH_SIZE);
        const mapChunk = (withMissing: boolean) =>
          chunkFiles.map((file: any, idx: number) => {
            const thumbUrl = file.thumbnailLink
              ? file.thumbnailLink.replace(/=s\d+/, '=w800')
              : `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`;

            const row: any = {
              gallery_id: gallery.id,
              gdrive_file_id: file.id,
              filename: file.name,
              thumbnail_url: thumbUrl,
              order_index: i + idx + 1,
              width: file.imageMediaMetadata?.width ? parseInt(file.imageMediaMetadata.width, 10) : null,
              height: file.imageMediaMetadata?.height ? parseInt(file.imageMediaMetadata.height, 10) : null,
              rotation: file.imageMediaMetadata?.rotation ? parseInt(file.imageMediaMetadata.rotation, 10) : 0,
            };
            if (withMissing) row.is_missing = false;
            return row;
          });

        let chunkPayload = mapChunk(includeMissing);
        let { error: photosError } = await supabase.from('gallery_photos').insert(chunkPayload);

        if (photosError && photosError.message?.includes('is_missing')) {
          includeMissing = false;
          chunkPayload = mapChunk(false);
          const retryRes = await supabase.from('gallery_photos').insert(chunkPayload);
          photosError = retryRes.error;
        }

        if (photosError) throw photosError;
      }

      // Reset form on success
      setGdriveUrl('');
      setClientWhatsapp('');
      setClientName('');
      setEventDate('');
      setMaxPhotos(50);
      setDeadlinePreset(14);
      setCustomDeadline('');
      setClientEmail('');
      setHighlightDescription('');
      setAllowDownload(false);
      setFolderCheckResult({ status: 'idle' });

      toast.success(
        `Galeri berhasil dibuat dengan ${files.length} foto.${
          fetchResult.skippedCount > 0 ? ` (${fetchResult.skippedCount} file non-foto dilewati)` : ''
        }`
      );

      // Trigger callback (this triggers SendClientMessageModal in parent Dashboard)
      onGalleryCreated(gallery);
    } catch (err: any) {
      toast.error(err.message || TOAST.galleryCreateFail);
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="bg-white border border-garis rounded-[2px] overflow-hidden font-sans text-tinta">
      {/* Toggle Accordion Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-6 text-left hover:bg-kertas transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-kertas-tua text-merah border border-garis flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <span className="font-serif text-lg font-normal text-tinta block">Buat Galeri Baru</span>
            <span className="text-[11px] font-mono text-tinta-lembut">
              Hubungkan folder Google Drive dan atur batas kurasi untuk klien
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-tinta-lembut transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accordion Form Content */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 border-t border-garis pt-6">
          {/* Section 1: Google Drive Folder */}
          <div className="bg-kertas-tua/40 p-4 border border-garis rounded-[2px] space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-widest text-tinta font-bold">
                  Tautan Folder Google Drive{' '}
                  <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5 font-normal">
                    WAJIB
                  </span>
                </label>
                <span className="text-[10px] font-mono text-tinta-lembut">
                  Akses: "Siapa saja yang memiliki link"
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/1ABC..."
                  value={gdriveUrl}
                  onChange={(e) => {
                    setGdriveUrl(e.target.value);
                    if (folderCheckResult.status !== 'idle') {
                      setFolderCheckResult({ status: 'idle' });
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCheckFolder()}
                  disabled={isCheckingFolder || !gdriveUrl.trim()}
                  className="px-4 py-2.5 bg-white hover:bg-kertas border border-garis text-tinta text-xs font-mono font-medium rounded-[2px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
                >
                  {isCheckingFolder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-merah" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <FolderSearch className="w-3.5 h-3.5 text-merah" />
                      Cek Akses Folder
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Folder Check Status Feedback */}
            {folderCheckResult.status === 'valid' && (
              <div className="flex items-start gap-2.5 p-3 bg-white border border-green-700/30 text-xs rounded-[2px]">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                <div className="text-tinta">
                  <span className="font-semibold text-green-800">Folder berhasil diverifikasi!</span>
                  <div className="text-tinta-lembut font-mono text-[11px] mt-0.5">
                    Nama folder: <strong className="text-tinta">{folderCheckResult.folderName}</strong> • Akses publik aktif
                  </div>
                </div>
              </div>
            )}

            {folderCheckResult.status === 'invalid' && (
              <div className="flex items-start justify-between gap-3 p-3 bg-white border border-merah/40 text-xs rounded-[2px]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-merah shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-merah">Pemeriksaan folder gagal</span>
                    <p className="text-tinta-lembut text-[11px] mt-0.5">
                      {folderCheckResult.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckFolder()}
                  className="text-[11px] font-mono underline text-merah hover:text-merah-hover shrink-0"
                >
                  Coba lagi
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Informasi Klien & Acara */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Klien (Wajib) */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta mb-1.5 font-bold">
                Nomor WhatsApp Klien{' '}
                <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5 font-normal">
                  WAJIB
                </span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="08123456789 atau 628123456789"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border text-tinta text-sm rounded-[2px] focus:outline-none transition-colors font-mono ${
                    clientWhatsapp && !waValidation.isValid
                      ? 'border-merah focus:border-merah focus:ring-1 focus:ring-merah'
                      : 'border-garis focus:border-merah focus:ring-1 focus:ring-merah'
                  }`}
                />
              </div>
              <p className="text-[11px] text-tinta-lembut mt-1 font-mono">
                {clientWhatsapp && waValidation.isValid ? (
                  <span className="text-green-800">
                    Format tersimpan: +{waValidation.normalized}
                  </span>
                ) : clientWhatsapp && !waValidation.isValid ? (
                  <span className="text-merah">{waValidation.message}</span>
                ) : (
                  'Diawali 08 atau 628, nomor dipakai untuk kirim tautan kurasi.'
                )}
              </p>
            </div>

            {/* Nama Klien (Opsional, bawaan nama folder) */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
                Nama Klien / Acara
              </label>
              <input
                type="text"
                placeholder={folderCheckResult.folderName || 'Contoh: Dimas & Arini Wedding'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              />
              <p className="text-[11px] text-tinta-lembut mt-1 font-mono">
                Otomatis diisi dari nama folder Drive jika dikosongkan.
              </p>
            </div>
          </div>

          {/* Section 3: Batas Pilihan & Tenggat Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batas Maksimal Foto */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta mb-1.5 font-bold">
                Batas Jumlah Pilihan Foto{' '}
                <span className="text-[10px] text-merah bg-merah/10 border border-merah/25 px-1.5 py-0.5 rounded-[2px] ml-1.5 font-normal">
                  WAJIB
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={maxPhotos}
                  onChange={(e) => setMaxPhotos(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
                />
                <span className="text-xs font-mono text-tinta-lembut shrink-0">Foto</span>
              </div>
              <p className="text-[11px] text-tinta-lembut mt-1 font-mono">
                Klien tidak bisa memilih melebihi kuota ini.
              </p>
            </div>

            {/* Batas Waktu Memilih (Tenggat Preset) */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta mb-1.5 font-bold">
                Batas Waktu Memilih (Tenggat)
              </label>
              <select
                value={deadlinePreset}
                onChange={(e) => setDeadlinePreset(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono cursor-pointer"
              >
                {DEADLINE_OPTIONS.map((opt) => (
                  <option key={opt.days} value={opt.days}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {deadlinePreset === -1 && (
                <div className="mt-2">
                  <input
                    type="date"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2 bg-white border border-garis text-tinta text-xs rounded-[2px] focus:outline-none focus:border-merah transition-colors font-mono"
                  />
                </div>
              )}

              <p className="text-[11px] text-tinta-lembut mt-1 font-mono">
                {getComputedDeadline() ? (
                  <span>
                    Batas akhir kurasi:{' '}
                    <strong className="text-tinta">
                      {new Date(getComputedDeadline()!).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                ) : (
                  'Klien dapat memilih kapan saja tanpa batas hari.'
                )}
              </p>
            </div>
          </div>

          {/* Section 4: Tanggal Acara & Email Klien (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
                Tanggal Acara / Sesi Foto (Opsional)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
                Email Klien (Opsional)
              </label>
              <input
                type="email"
                placeholder="klien@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              />
            </div>
          </div>

          {/* Section 5: Catatan Pembuka & Izin Unduh */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
              Deskripsi / Pesan Pembuka untuk Klien (Opsional)
            </label>
            <textarea
              placeholder="Contoh: Terima kasih sudah mempercayakan momen indah ini kepada kami. Silakan pilih foto favorit kalian."
              value={highlightDescription}
              onChange={(e) => setHighlightDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-[2px] focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors resize-none"
            />
          </div>

          {/* Izin Unduh Saklar */}
          <div className="flex items-center gap-3 p-3 bg-kertas rounded-[2px] border border-garis">
            <input
              id="allow_download"
              type="checkbox"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              className="w-4 h-4 accent-merah rounded-[2px] cursor-pointer"
            />
            <label htmlFor="allow_download" className="text-xs text-tinta cursor-pointer select-none">
              <span className="font-semibold block text-tinta">Izinkan klien mengunduh foto pilihan</span>
              <span className="text-[11px] text-tinta-lembut">
                Klien dapat mengunduh foto yang telah mereka pilih langsung dari galeri kurasi.
              </span>
            </label>
          </div>

          {/* Submit Action Bar & Reason when disabled */}
          <div className="pt-4 border-t border-garis flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Disabled reason directly adjacent to button */}
            <div className="text-xs font-mono">
              {!isFormValid ? (
                <div className="flex items-center gap-1.5 text-merah">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors[0]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Semua isian formulir siap diproses.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="px-8 py-3 bg-merah hover:bg-merah-hover text-white text-sm font-medium rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{syncStatus || 'Memproses Galeri...'}</span>
                </>
              ) : (
                'Buat Galeri Sekarang'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGalleryForm;
