// src/components/gallery/LocalFileCopyDialog.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { copyToClipboard } from '../../lib/clipboard';
import { toast } from 'sonner';
import {
  FolderOpen,
  FolderCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileQuestion,
  ChevronRight,
  HardDrive,
  Info,
} from 'lucide-react';
import {
  MatchFilterOptions,
  LocalCandidateFile,
  MatchAnalysisResult,
  DuplicateGroup,
  analyzeAndMatchFiles,
  formatFileSize,
  loadFilterOptions,
  saveFilterOptions,
  sanitizeFilename,
} from '../../lib/fileMatching';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedFilenames: string[];
  galleryName: string;
  gallerySlug: string;
  onFallbackCopyLightroom?: () => void;
  onFallbackCopyList?: () => void;
  onFallbackDownloadTxt?: () => void;
}

type CopyStep = 'source' | 'preview' | 'destination' | 'copying' | 'result';

interface CopyResultLog {
  copied: { name: string; size: number }[];
  skipped: { name: string; reason: string }[];
  conflicts: { name: string; reason: string }[];
  failed: { name: string; error: string }[];
  unmatched: string[];
}

export default function LocalFileCopyDialog({
  isOpen,
  onClose,
  selectedFilenames,
  galleryName,
  gallerySlug,
  onFallbackCopyLightroom,
  onFallbackCopyList,
  onFallbackDownloadTxt,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, dialogRef, { onEscape: onClose });

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const [step, setStep] = useState<CopyStep>('source');
  const [filterOptions, setFilterOptions] = useState<MatchFilterOptions>(loadFilterOptions);

  // Sumber
  const [sourceDirHandle, setSourceDirHandle] = useState<any>(null);
  const [sourceDirName, setSourceDirName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<LocalCandidateFile[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const abortScanRef = useRef(false);

  // Pratinjau
  const [analysis, setAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [includeDuplicatesAcrossFolders, setIncludeDuplicatesAcrossFolders] = useState(false);

  // Tujuan
  const [destDirHandle, setDestDirHandle] = useState<any>(null);
  const [destDirName, setDestDirName] = useState('');
  const [autoSubfolder, setAutoSubfolder] = useState(true);

  // Proses Salin
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState({ current: 0, total: 0, currentFilename: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const abortCopyRef = useRef(false);

  // Hasil
  const [copyResult, setCopyResult] = useState<CopyResultLog | null>(null);

  // Peringatan jika pengguna menutup tab saat proses salin berjalan
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCopying) {
        e.preventDefault();
        e.returnValue = 'Proses penyalinan file sedang berlangsung. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCopying]);

  // Update analisis saat file atau filter berubah
  useEffect(() => {
    if (scannedFiles.length > 0) {
      const res = analyzeAndMatchFiles(selectedFilenames, scannedFiles, filterOptions);
      setAnalysis(res);
    }
  }, [scannedFiles, filterOptions, selectedFilenames]);

  if (!isOpen) return null;

  // Tampilan jika browser tidak mendukung File System Access API
  if (!isSupported) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsupported-dialog-title"
      >
        <div
          ref={dialogRef}
          className="bg-white rounded-panel border border-garis shadow-2xl max-w-lg w-full p-6 text-tinta font-sans"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-chip bg-amber-50 border border-amber-200 text-amber-900 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 id="unsupported-dialog-title" className="text-lg font-serif font-normal text-tinta">
                Fitur Salin Lokal Memerlukan Chromium Desktop
              </h3>
              <p className="text-xs text-tinta-lembut font-mono mt-1">
                Google Chrome atau Microsoft Edge di Komputer (PC/Mac)
              </p>
            </div>
          </div>

          <p className="text-sm text-tinta-lembut leading-relaxed mb-6">
            Penyalinan file otomatis langsung ke folder penyimpanan komputer memerlukan{' '}
            <span className="font-mono text-xs text-tinta">File System Access API</span>. Browser Anda saat ini
            (seperti Safari, Firefox, atau peramban perangkat seluler) belum mendukung izin akses folder lokal ini.
          </p>

          <div className="bg-kertas border border-garis rounded-chip p-4 mb-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-tinta font-bold mb-2">
              Solusi Tingkat 1 yang Tersedia:
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onFallbackCopyLightroom?.();
                  onClose();
                }}
                className="w-full text-left py-2 px-3 bg-white border border-garis hover:border-tinta rounded-btn text-xs font-medium text-tinta flex items-center justify-between min-h-[44px]"
              >
                <span>Salin teks untuk filter Lightroom</span>
                <Copy className="w-3.5 h-3.5 text-merah" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onFallbackCopyList?.();
                  onClose();
                }}
                className="w-full text-left py-2 px-3 bg-white border border-garis hover:border-tinta rounded-btn text-xs font-medium text-tinta flex items-center justify-between min-h-[44px]"
              >
                <span>Salin daftar nama file pilihan (satu per baris)</span>
                <Copy className="w-3.5 h-3.5 text-tinta-lembut" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onFallbackDownloadTxt?.();
                  onClose();
                }}
                className="w-full text-left py-2 px-3 bg-white border border-garis hover:border-tinta rounded-btn text-xs font-medium text-tinta flex items-center justify-between min-h-[44px]"
              >
                <span>Unduh berkas teks (.txt)</span>
                <Download className="w-3.5 h-3.5 text-tinta-lembut" />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-kertas hover:bg-kertas-tua border border-garis text-tinta rounded-btn text-sm font-medium min-h-[44px]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LANGKAH A: PILIH FOLDER SUMBER & SCAN REKURSIF ---
  const handleSelectSource = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        id: 'marryland_source_dir',
        mode: 'read',
      });
      setSourceDirHandle(dirHandle);
      setSourceDirName(dirHandle.name);
      await scanFolder(dirHandle);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User membatalkan picker
      if (err.name === 'NotAllowedError') {
        toast.error('Izin akses membaca folder ditolak.');
        return;
      }
      if (err.name === 'SecurityError') {
        toast.error('Folder diblokir oleh browser demi keamanan sistem. Pilih subfolder kerja.');
        return;
      }
      toast.error('Gagal mengakses folder: ' + err.message);
    }
  };

  const scanFolder = async (dirHandle: any) => {
    setIsScanning(true);
    abortScanRef.current = false;
    setScanCount(0);
    const collected: LocalCandidateFile[] = [];

    async function walk(handle: any, currentPath: string) {
      if (abortScanRef.current) return;
      for await (const entry of handle.values()) {
        if (abortScanRef.current) break;
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        if (entry.kind === 'file') {
          try {
            const f = await entry.getFile();
            collected.push({
              name: entry.name,
              relativePath: entryPath,
              size: f.size,
              handle: entry,
            });
            setScanCount((prev) => prev + 1);
          } catch {
            // Lewati file yang terkunci/tidak terbaca selama scan awal
          }
        } else if (entry.kind === 'directory') {
          await walk(entry, entryPath);
        }
      }
    }

    try {
      await walk(dirHandle, '');
      if (!abortScanRef.current) {
        setScannedFiles(collected);
        setStep('preview');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat memindai folder: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelScan = () => {
    abortScanRef.current = true;
    setIsScanning(false);
    toast.info('Pemindaian folder dibatalkan.');
  };

  // --- LANGKAH B: FILTER & PRATINJAU ---
  const handleFilterChange = (key: keyof MatchFilterOptions) => {
    const updated = { ...filterOptions, [key]: !filterOptions[key] };
    setFilterOptions(updated);
    saveFilterOptions(updated);
  };

  // --- LANGKAH C: PILIH FOLDER TUJUAN ---
  const handleSelectDestination = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        id: 'marryland_dest_dir',
        mode: 'readwrite',
      });

      // Cek apakah folder tujuan sama dengan folder sumber
      if (sourceDirHandle && typeof sourceDirHandle.isSameEntry === 'function') {
        const isSame = await sourceDirHandle.isSameEntry(dirHandle);
        if (isSame) {
          toast.error('Folder tujuan tidak boleh sama dengan folder sumber.');
          return;
        }
      }

      setDestDirHandle(dirHandle);
      setDestDirName(dirHandle.name);
      setStep('destination');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (err.name === 'NotAllowedError') {
        toast.error('Izin tulis folder tujuan ditolak.');
        return;
      }
      if (err.name === 'SecurityError') {
        toast.error('Folder tujuan diblokir oleh browser. Pilih subfolder lain.');
        return;
      }
      toast.error('Gagal memilih folder tujuan: ' + err.message);
    }
  };

  // --- LANGKAH D: PENYALINAN STREAMING ---
  const handleStartCopying = async () => {
    if (!destDirHandle || !analysis) return;

    setIsCopying(true);
    setStep('copying');
    abortCopyRef.current = false;

    const log: CopyResultLog = {
      copied: [],
      skipped: [],
      conflicts: [],
      failed: [],
      unmatched: [...analysis.unmatchedSelections],
    };

    try {
      // 1. Tentukan direktori akhir (buat subfolder galeri jika dicentang)
      let targetDir = destDirHandle;
      if (autoSubfolder) {
        const subfolderName = (gallerySlug || 'galeri')
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        try {
          targetDir = await destDirHandle.getDirectoryHandle(subfolderName, { create: true });
        } catch (subErr: any) {
          toast.error('Gagal membuat subfolder galeri di folder tujuan: ' + subErr.message);
          setIsCopying(false);
          setStep('destination');
          return;
        }
      }

      // 2. Kumpulkan file yang akan disalin (memperhatikan penanganan duplikat)
      let filesToProcess = [...analysis.matchedFiles];
      if (!includeDuplicatesAcrossFolders && analysis.duplicatesAcrossFolders.length > 0) {
        const dupBaseSet = new Set(analysis.duplicatesAcrossFolders.map((d) => d.baseName));
        filesToProcess = filesToProcess.filter((p) => !dupBaseSet.has(p.selectedBaseName));
      }

      setCopyProgress({ current: 0, total: filesToProcess.length, currentFilename: '' });

      // 3. Salin berurutan (konkurensi 1 untuk keamanan stream dan I/O disk)
      for (let i = 0; i < filesToProcess.length; i++) {
        if (abortCopyRef.current) {
          log.skipped.push({
            name: filesToProcess[i].sourceFile.name,
            reason: 'Dibatalkan oleh pengguna sebelum disalin',
          });
          continue;
        }

        const item = filesToProcess[i];
        const srcCandidate = item.sourceFile;
        setCopyProgress({
          current: i + 1,
          total: filesToProcess.length,
          currentFilename: srcCandidate.name,
        });
        setStatusMessage(`Menyalin ${srcCandidate.name}...`);

        try {
          const srcFile = await srcCandidate.handle.getFile();

          // Cek apakah file sudah ada di tujuan
          let exists = false;
          let destExistingSize = -1;
          try {
            const existingHandle = await targetDir.getFileHandle(srcFile.name, { create: false });
            exists = true;
            const existingFile = await existingHandle.getFile();
            destExistingSize = existingFile.size;
          } catch {
            exists = false;
          }

          if (exists) {
            if (destExistingSize === srcFile.size) {
              // Ukuran sama: lewati
              log.skipped.push({
                name: srcFile.name,
                reason: 'Sudah ada di folder tujuan dengan ukuran identik',
              });
              continue;
            } else {
              // Ukuran berbeda: catat konflik dan lewati tanpa menimpa
              log.conflicts.push({
                name: srcFile.name,
                reason: `Sudah ada di tujuan dengan ukuran berbeda (tujuan: ${destExistingSize} B, sumber: ${srcFile.size} B)`,
              });
              continue;
            }
          }

          // Buat file dan salin via stream (pipeTo) tanpa memuat seluruh file ke RAM
          const destFileHandle = await targetDir.getFileHandle(srcFile.name, { create: true });
          const writable = await destFileHandle.createWritable();

          try {
            await srcFile.stream().pipeTo(writable);
          } catch (streamErr) {
            try {
              await writable.abort();
            } catch (_) {}
            throw streamErr;
          }

          // Verifikasi ukuran hasil salinan
          const writtenFile = await destFileHandle.getFile();
          if (writtenFile.size !== srcFile.size) {
            // Coba ulangi sekali
            const retryWritable = await destFileHandle.createWritable();
            try {
              await srcFile.stream().pipeTo(retryWritable);
            } catch (retryErr) {
              try {
                await retryWritable.abort();
              } catch (_) {}
              throw retryErr;
            }
            const retryWritten = await destFileHandle.getFile();
            if (retryWritten.size !== srcFile.size) {
              throw new Error(
                `Ukuran hasil salinan (${retryWritten.size} B) tidak cocok dengan sumber (${srcFile.size} B)`
              );
            }
          }

          log.copied.push({ name: srcFile.name, size: srcFile.size });
        } catch (copyErr: any) {
          log.failed.push({
            name: srcCandidate.name,
            error: copyErr.message || 'Kesalahan saat streaming data',
          });
        }
      }

      setCopyResult(log);
      setStep('result');
      toast.success(
        `Penyalinan selesai: ${log.copied.length} disalin, ${log.skipped.length} dilewati, ${log.failed.length} gagal.`
      );
    } catch (fatalErr: any) {
      toast.error('Gagal menjalankan penyalinan: ' + fatalErr.message);
      setStep('preview');
    } finally {
      setIsCopying(false);
      setStatusMessage('');
    }
  };

  const handleCancelCopying = () => {
    abortCopyRef.current = true;
    setStatusMessage('Membatalkan proses penyalinan...');
  };

  // --- UNDUH LOG & SALIN DATA ---
  const handleDownloadLog = () => {
    if (!copyResult) return;
    const lines = [
      `LOG PENYALINAN FOTO by.marryland`,
      `Galeri: ${galleryName} (${gallerySlug})`,
      `Tanggal: ${new Date().toLocaleString('id-ID')}`,
      `Folder Sumber: ${sourceDirName}`,
      `Folder Tujuan: ${destDirName}${autoSubfolder ? `/${gallerySlug}` : ''}`,
      ``,
      `--- RINGKASAN ---`,
      `Berhasil Disalin : ${copyResult.copied.length}`,
      `Dilewati (Sama)  : ${copyResult.skipped.length}`,
      `Konflik Ukuran   : ${copyResult.conflicts.length}`,
      `Gagal Ditulis    : ${copyResult.failed.length}`,
      `Tidak Ditemukan  : ${copyResult.unmatched.length}`,
      ``,
      `--- DETAIL FILE DISALIN ---`,
      ...copyResult.copied.map((c) => `[OK] ${c.name} (${formatFileSize(c.size)})`),
      ``,
      `--- DETAIL DILEWATI ---`,
      ...copyResult.skipped.map((s) => `[LEWATI] ${s.name} - ${s.reason}`),
      ``,
      `--- DETAIL KONFLIK ---`,
      ...copyResult.conflicts.map((k) => `[KONFLIK] ${k.name} - ${k.reason}`),
      ``,
      `--- DETAIL GAGAL ---`,
      ...copyResult.failed.map((f) => `[GAGAL] ${f.name} - ${f.error}`),
      ``,
      `--- DETAIL FOTO TANPA PASANGAN ---`,
      ...copyResult.unmatched.map((u) => `[TIDAK DITEMUKAN] ${u}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gallerySlug}_log_salin_foto.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Log penyalinan berhasil diunduh.');
  };

  const handleCopyUnmatched = async () => {
    if (!copyResult || copyResult.unmatched.length === 0) return;
    const text = copyResult.unmatched.join('\n');
    await copyToClipboard(text);
    toast.success('Daftar foto tidak ditemukan berhasil disalin.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="local-copy-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-panel border border-garis shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-tinta font-sans overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-garis flex items-center justify-between shrink-0 bg-kertas/50">
          <div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-merah" />
              <h2 id="local-copy-title" className="text-xl font-serif font-normal text-tinta">
                Siapkan File untuk Edit (Salin Lokal)
              </h2>
            </div>
            <p className="text-xs font-mono text-tinta-lembut mt-1">
              {galleryName} — {selectedFilenames.length} foto dipilih klien
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCopying}
            className="p-2 text-tinta-lembut hover:text-tinta hover:bg-kertas-tua rounded-btn transition-colors disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Pilih Sumber & Pindai */}
          {step === 'source' && (
            <div className="space-y-4">
              <div className="bg-kertas border border-garis rounded-chip p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-merah shrink-0 mt-0.5" />
                <div className="text-xs text-tinta-lembut leading-relaxed">
                  <p className="font-semibold text-tinta mb-1">Cara Kerja Penyalinan Lokal:</p>
                  Browser akan meminta izin membaca folder tempat Anda menyimpan foto asli kamera (RAW / JPG). File yang cocok akan disaring dan disalin secara langsung di komputer Anda tanpa diunggah ke internet.
                </div>
              </div>

              {isScanning ? (
                <div className="text-center py-10 space-y-3 bg-kertas rounded-chip border border-garis">
                  <RefreshCw className="w-6 h-6 text-merah animate-spin mx-auto" />
                  <p className="text-sm font-medium text-tinta">Memindai isi folder...</p>
                  <p className="text-xs font-mono text-tinta-lembut">
                    Ditemukan: <span className="text-merah font-bold">{scanCount}</span> file
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelScan}
                    className="mt-3 px-4 py-2 border border-garis hover:border-tinta text-xs font-medium text-tinta rounded-btn min-h-[44px]"
                  >
                    Batal Pindai
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-garis rounded-chip bg-kertas/30 space-y-4">
                  <FolderOpen className="w-10 h-10 text-tinta-lembut mx-auto" />
                  <div>
                    <h4 className="text-sm font-medium text-tinta">Pilih Folder Sumber Foto Asli</h4>
                    <p className="text-xs text-tinta-lembut mt-1">
                      Pilih folder harddisk / kartu memori tempat file RAW atau JPG disimpan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectSource}
                    className="px-6 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-sm font-medium transition-colors inline-flex items-center gap-2 min-h-[44px]"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Pilih Folder Sumber</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Filter & Pratinjau (Dry-run) */}
          {step === 'preview' && analysis && (
            <div className="space-y-5">
              {/* Info Sumber Terpilih */}
              <div className="flex items-center justify-between text-xs font-mono bg-kertas p-3 rounded-chip border border-garis">
                <span className="text-tinta-lembut">Folder Sumber:</span>
                <span className="font-semibold text-tinta truncate max-w-[280px]">{sourceDirName}</span>
              </div>

              {/* Filter Jenis File */}
              <div className="border border-garis rounded-chip p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-tinta font-bold">
                  <Sliders className="w-4 h-4 text-merah" />
                  <span>Jenis File yang Dicari</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2.5 text-xs text-tinta p-2.5 rounded-chip hover:bg-kertas border border-garis cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={filterOptions.includeRaw}
                      onChange={() => handleFilterChange('includeRaw')}
                      className="accent-merah w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block">RAW</span>
                      <span className="text-[10px] text-tinta-lembut font-mono">CR2, CR3, RAF, NEF, ARW, dll</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-tinta p-2.5 rounded-chip hover:bg-kertas border border-garis cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={filterOptions.includeSidecar}
                      onChange={() => handleFilterChange('includeSidecar')}
                      className="accent-merah w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block">Sidecar XMP</span>
                      <span className="text-[10px] text-tinta-lembut font-mono">Metadata edit .xmp</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-tinta p-2.5 rounded-chip hover:bg-kertas border border-garis cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={filterOptions.includeJpg}
                      onChange={() => handleFilterChange('includeJpg')}
                      className="accent-merah w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block">JPEG / JPG</span>
                      <span className="text-[10px] text-tinta-lembut font-mono">File gambar jpg/jpeg</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ringkasan Pratinjau (Dry-run WAJIB) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="bg-kertas p-3 rounded-chip border border-garis">
                  <div className="text-xs text-tinta-lembut font-mono">Pilihan Klien</div>
                  <div className="text-lg font-serif font-bold text-tinta mt-0.5">{analysis.totalSelected}</div>
                </div>
                <div className="bg-kertas p-3 rounded-chip border border-garis">
                  <div className="text-xs text-tinta-lembut font-mono">File Cocok</div>
                  <div className="text-lg font-serif font-bold text-merah mt-0.5">{analysis.matchedFiles.length}</div>
                </div>
                <div className="bg-kertas p-3 rounded-chip border border-garis">
                  <div className="text-xs text-tinta-lembut font-mono">Total Ukuran</div>
                  <div className="text-lg font-serif font-bold text-tinta mt-0.5">
                    {formatFileSize(analysis.totalSizeToCopy)}
                  </div>
                </div>
                <div className="bg-kertas p-3 rounded-chip border border-garis">
                  <div className="text-xs text-tinta-lembut font-mono">Tidak Ada</div>
                  <div className="text-lg font-serif font-bold text-amber-800 mt-0.5">
                    {analysis.unmatchedSelections.length}
                  </div>
                </div>
              </div>

              {/* Peringatan jika ada nama dasar ganda di lebih dari satu folder */}
              {analysis.duplicatesAcrossFolders.length > 0 && (
                <div className="border border-amber-300 bg-amber-50 rounded-chip p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">
                        Ditemukan {analysis.duplicatesAcrossFolders.length} nama file yang ada di beberapa folder berbeda:
                      </p>
                      <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto font-mono text-[11px] bg-white/70 p-2 rounded-chip border border-amber-200">
                        {analysis.duplicatesAcrossFolders.map((dup) => (
                          <div key={dup.baseName} className="text-tinta">
                            <span className="font-semibold text-merah">{dup.baseName}:</span>{' '}
                            {dup.files.map((f) => f.relativePath).join(' | ')}
                          </div>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer font-sans text-xs">
                        <input
                          type="checkbox"
                          checked={includeDuplicatesAcrossFolders}
                          onChange={(e) => setIncludeDuplicatesAcrossFolders(e.target.checked)}
                          className="accent-merah w-4 h-4"
                        />
                        <span>Salin semua file duplikat (jika tidak dicentang, file duplikat dilewati demi keamanan)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Peringatan jika banyak foto tidak ditemukan */}
              {analysis.unmatchedSelections.length > 0 && (
                <div className="border border-garis bg-kertas rounded-chip p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-tinta">
                      {analysis.unmatchedSelections.length} foto tidak ditemukan di folder sumber:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(analysis.unmatchedSelections.join('\n'));
                        toast.success('Daftar foto tidak ditemukan disalin ke clipboard.');
                      }}
                      className="text-merah hover:underline text-xs inline-flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      Salin daftar
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto font-mono text-[11px] text-tinta-lembut bg-white p-2 rounded-chip border border-garis space-y-0.5">
                    {analysis.unmatchedSelections.map((name) => (
                      <div key={name}>{name}</div>
                    ))}
                  </div>
                  {analysis.unmatchedSelections.length > 5 && (
                    <p className="text-[11px] text-tinta-lembut italic">
                      Petunjuk: Jika banyak foto tidak ditemukan, periksa apakah nama file di Google Drive sempat diganti atau diekspor ulang sebelum diunggah.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Konfirmasi Folder Tujuan */}
          {step === 'destination' && destDirHandle && analysis && (
            <div className="space-y-4">
              <div className="bg-kertas border border-garis rounded-chip p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-tinta-lembut">Folder Sumber:</span>
                  <span className="font-semibold text-tinta truncate max-w-[260px]">{sourceDirName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-tinta-lembut">Folder Tujuan:</span>
                  <span className="font-semibold text-merah truncate max-w-[260px]">{destDirName}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 border border-garis rounded-chip hover:bg-kertas cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={autoSubfolder}
                  onChange={(e) => setAutoSubfolder(e.target.checked)}
                  className="accent-merah w-4 h-4 mt-0.5"
                />
                <div className="text-xs text-tinta">
                  <span className="font-semibold block">Buat subfolder otomatis bernama galeri</span>
                  <span className="text-tinta-lembut font-mono text-[11px]">
                    Subfolder: <span className="text-merah">{gallerySlug}</span> di dalam {destDirName}
                  </span>
                </div>
              </label>

              <div className="bg-amber-50 border border-amber-200 rounded-chip p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Aturan Penyalinan Aman:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>File asli di folder sumber TIDAK AKAN diubah, dipindah, atau dihapus.</li>
                  <li>Jika file di tujuan sudah ada dengan ukuran sama, file akan otomatis dilewati.</li>
                  <li>Jika file di tujuan ada dengan ukuran berbeda, file dicatat sebagai konflik dan tidak ditimpa diam-diam.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 4: Proses Salin Sedang Berjalan */}
          {step === 'copying' && (
            <div className="py-8 space-y-5 text-center">
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-normal text-tinta">Menyalin File Pilihan...</h3>
                <p className="text-xs font-mono text-tinta-lembut" aria-live="polite">
                  {statusMessage || 'Mempersiapkan penyalinan...'}
                </p>
              </div>

              {/* Progress Bar Total */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-tinta-lembut">
                  <span>Progres Total</span>
                  <span className="font-bold text-merah">
                    {copyProgress.current} dari {copyProgress.total} file (
                    {copyProgress.total > 0 ? Math.round((copyProgress.current / copyProgress.total) * 100) : 0}%)
                  </span>
                </div>
                <div
                  className="w-full bg-kertas-tua rounded-chip h-3 overflow-hidden border border-garis"
                  role="progressbar"
                  aria-valuenow={copyProgress.current}
                  aria-valuemin={0}
                  aria-valuemax={copyProgress.total}
                >
                  <div
                    className="h-full bg-merah transition-all duration-300"
                    style={{
                      width: `${
                        copyProgress.total > 0 ? (copyProgress.current / copyProgress.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCancelCopying}
                  className="px-5 py-2.5 border border-garis hover:border-tinta text-xs font-medium text-tinta rounded-btn min-h-[44px]"
                >
                  Hentikan Proses Salin
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Hasil Akhir */}
          {step === 'result' && copyResult && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-chip text-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-700 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Penyalinan Selesai</h4>
                  <p className="text-xs text-green-800 mt-0.5">
                    File pilihan telah disiapkan di folder tujuan komputer Anda.
                  </p>
                </div>
              </div>

              {/* Statistik Hasil */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-kertas p-2.5 rounded-chip border border-garis">
                  <span className="text-tinta-lembut block font-mono text-[10px]">Disalin</span>
                  <span className="text-base font-bold text-green-800">{copyResult.copied.length}</span>
                </div>
                <div className="bg-kertas p-2.5 rounded-chip border border-garis">
                  <span className="text-tinta-lembut block font-mono text-[10px]">Dilewati</span>
                  <span className="text-base font-bold text-tinta">{copyResult.skipped.length}</span>
                </div>
                <div className="bg-kertas p-2.5 rounded-chip border border-garis">
                  <span className="text-tinta-lembut block font-mono text-[10px]">Konflik</span>
                  <span className="text-base font-bold text-amber-800">{copyResult.conflicts.length}</span>
                </div>
                <div className="bg-kertas p-2.5 rounded-chip border border-garis">
                  <span className="text-tinta-lembut block font-mono text-[10px]">Gagal</span>
                  <span className="text-base font-bold text-merah">{copyResult.failed.length}</span>
                </div>
                <div className="bg-kertas p-2.5 rounded-chip border border-garis">
                  <span className="text-tinta-lembut block font-mono text-[10px]">Tidak Ada</span>
                  <span className="text-base font-bold text-tinta-lembut">{copyResult.unmatched.length}</span>
                </div>
              </div>

              {/* Catatan Privasi & Tindakan */}
              <div className="bg-kertas border border-garis rounded-chip p-3.5 flex items-center gap-2 text-xs text-tinta-lembut font-mono">
                <ShieldCheck className="w-4 h-4 text-green-700 shrink-0" />
                <span>Foto tidak diunggah; hanya dibaca dan ditulis di komputer ini.</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadLog}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-white border border-garis hover:border-tinta text-tinta rounded-btn text-xs font-medium flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Download className="w-3.5 h-3.5 text-tinta-lembut" />
                  <span>Unduh Log Penyalinan (.txt)</span>
                </button>

                {copyResult.unmatched.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyUnmatched}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-white border border-garis hover:border-tinta text-tinta rounded-btn text-xs font-medium flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Copy className="w-3.5 h-3.5 text-merah" />
                    <span>Salin Foto Tidak Ditemukan</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 border-t border-garis bg-kertas/50 flex items-center justify-between shrink-0">
          {step === 'source' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-tinta-lembut hover:text-tinta rounded-btn min-h-[44px]"
            >
              Tutup
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('source')}
                className="px-4 py-2 border border-garis hover:border-tinta text-xs font-medium text-tinta rounded-btn min-h-[44px]"
              >
                Ganti Folder Sumber
              </button>
              <button
                type="button"
                onClick={handleSelectDestination}
                disabled={!analysis || analysis.matchedFiles.length === 0}
                className="px-5 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun disabled:opacity-40 text-kertas rounded-btn text-xs font-medium inline-flex items-center gap-1.5 min-h-[44px]"
              >
                <span>Pilih Folder Tujuan & Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'destination' && (
            <>
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="px-4 py-2 border border-garis hover:border-tinta text-xs font-medium text-tinta rounded-btn min-h-[44px]"
              >
                Kembali ke Pratinjau
              </button>
              <button
                type="button"
                onClick={handleStartCopying}
                className="px-6 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-xs font-medium inline-flex items-center gap-2 min-h-[44px]"
              >
                <HardDrive className="w-4 h-4" />
                <span>Mulai Salin File Sekarang</span>
              </button>
            </>
          )}

          {step === 'copying' && (
            <div className="w-full text-center text-xs text-tinta-lembut font-mono">
              Mohon jangan tutup jendela browser ini hingga proses selesai.
            </div>
          )}

          {step === 'result' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-xs font-medium min-h-[44px]"
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
