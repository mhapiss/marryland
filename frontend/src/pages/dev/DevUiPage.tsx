// src/pages/dev/DevUiPage.tsx
// Halaman khusus pengembangan (hanya aktif saat import.meta.env.DEV)
// Tidak akan disertakan dalam bundel build produksi.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { toast } from 'sonner';
import {
  Sparkles,
  Search,
  Trash2,
  Send,
  Plus,
  ArrowRight,
  Info,
  Check,
  X,
  Eye,
  Settings,
} from 'lucide-react';

type RadiusPreset = 'tajam' | 'lembut' | 'bulat';

const PRESET_VALUES: Record<
  RadiusPreset,
  { label: string; btn: string; chip: string; input: string; panel: string }
> = {
  tajam: {
    label: 'Tajam (2px)',
    btn: '2px',
    chip: '2px',
    input: '2px',
    panel: '2px',
  },
  lembut: {
    label: 'Lembut (Default 8px / 12px)',
    btn: '8px',
    chip: '8px',
    input: '8px',
    panel: '12px',
  },
  bulat: {
    label: 'Bulat (Pil Penuh 9999px)',
    btn: '9999px',
    chip: '9999px',
    input: '8px',
    panel: '16px',
  },
};

export default function DevUiPage() {
  const [preset, setPreset] = useState<RadiusPreset>('lembut');
  const [activeChip, setActiveChip] = useState<'semua' | 'potret' | 'lanskap'>('semua');
  const [showDialog, setShowDialog] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Terapkan preset radius langsung ke root element
  useEffect(() => {
    const root = document.documentElement;
    const config = PRESET_VALUES[preset];
    root.setAttribute('data-radius-preset', preset);
    root.style.setProperty('--radius-btn', config.btn);
    root.style.setProperty('--radius-chip', config.chip);
    root.style.setProperty('--radius-input', config.input);
    root.style.setProperty('--radius-panel', config.panel);

    return () => {
      // Kembalikan ke bawaan lembut saat meninggalkan halaman
      root.removeAttribute('data-radius-preset');
      root.style.removeProperty('--radius-btn');
      root.style.removeProperty('--radius-chip');
      root.style.removeProperty('--radius-input');
      root.style.removeProperty('--radius-panel');
    };
  }, [preset]);

  return (
    <div className="min-h-screen bg-kertas text-tinta font-sans p-6 sm:p-12 max-w-6xl mx-auto selection:bg-merah selection:text-kertas">
      {/* Header & Saklar Preset */}
      <header className="border-b border-garis pb-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-merah uppercase tracking-wider mb-2">
              <Settings className="w-4 h-4" />
              <span>Halaman Pengujian Desain &bull; Mode Pengembangan</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-tinta">
              Gaya Tombol & Token Sudut
            </h1>
            <p className="text-tinta-lembut text-sm mt-1 max-w-xl">
              Uji perbandingan seluruh varian tombol, chip filter, input, dialog, dan toast secara langsung.
            </p>
          </div>

          {/* Saklar Preset Sudut */}
          <div className="bg-kertas-tua/70 p-1.5 rounded-panel border border-garis self-start md:self-auto">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-tinta-lembut px-3 py-1">
              Bentuk sudut:
            </span>
            <div className="flex gap-1.5">
              {(['tajam', 'lembut', 'bulat'] as RadiusPreset[]).map((p) => {
                const isSelected = preset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-chip transition-colors min-h-[36px] ${
                      isSelected
                        ? 'bg-merah text-kertas shadow-none'
                        : 'text-tinta hover:bg-kertas/80'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Token Values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-garis/60 text-xs font-mono">
          <div className="bg-kertas-tua/40 p-2.5 rounded-input border border-garis">
            <span className="text-tinta-lembut block text-[10px]">--radius-btn</span>
            <span className="text-merah font-bold">{PRESET_VALUES[preset].btn}</span>
          </div>
          <div className="bg-kertas-tua/40 p-2.5 rounded-input border border-garis">
            <span className="text-tinta-lembut block text-[10px]">--radius-chip</span>
            <span className="text-merah font-bold">{PRESET_VALUES[preset].chip}</span>
          </div>
          <div className="bg-kertas-tua/40 p-2.5 rounded-input border border-garis">
            <span className="text-tinta-lembut block text-[10px]">--radius-input</span>
            <span className="text-merah font-bold">{PRESET_VALUES[preset].input}</span>
          </div>
          <div className="bg-kertas-tua/40 p-2.5 rounded-input border border-garis">
            <span className="text-tinta-lembut block text-[10px]">--radius-panel</span>
            <span className="text-merah font-bold">{PRESET_VALUES[preset].panel}</span>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        {/* Section 1: Varian Tombol */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">1. Varian Tombol</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Tipografi: huruf biasa (sentence case), sans bobot 500, transisi warna 150ms, tanpa gradien atau bayangan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Utama */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Utama (primary)</span>
              <Button variant="primary">
                <span>Simpan pilihan</span>
                <Check className="w-4 h-4" />
              </Button>
            </div>

            {/* Sekunder */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Sekunder (secondary/outline)</span>
              <Button variant="secondary">
                <span>Lihat contoh galeri</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Tersier */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Tersier (text link vintage)</span>
              <Button variant="tertiary">
                Masuk dashboard
              </Button>
            </div>

            {/* Berbahaya */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Berbahaya (danger)</span>
              <Button variant="danger">
                <Trash2 className="w-4 h-4" />
                <span>Hapus galeri</span>
              </Button>
            </div>

            {/* Ghost */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Ghost (tanpa border)</span>
              <Button variant="ghost">
                Batal
              </Button>
            </div>

            {/* Tombol Ikon */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Tombol Ikon (icon)</span>
              <div className="flex gap-2">
                <Button variant="icon" aria-label="Cari">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="icon" aria-label="Kirim">
                  <Send className="w-4 h-4" />
                </Button>
                <Button variant="icon" aria-label="Tutup">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Ukuran Tombol & Target Sentuh */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">2. Ukuran Tombol</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Ukuran sm (36px), md (44px standar sentuh mobile), lg (48px cta utama).
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" variant="primary">Kecil (sm)</Button>
            <Button size="md" variant="primary">Sedang (md 44px)</Button>
            <Button size="lg" variant="primary">Besar (lg 48px)</Button>
          </div>
        </section>

        {/* Section 3: Keadaan Interaksi (Default, Disabled, Loading) */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">3. Keadaan Interaksi</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Default, Nonaktif (opasitas 50%, tetap terbaca, kursor dinonaktifkan), dan Loading (spinner subtle).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Default Aktif</span>
              <Button variant="primary">Kirim foto</Button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Nonaktif (Disabled)</span>
              <Button variant="primary" disabled>Kirim foto</Button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-tinta-lembut block">Memuat (Loading)</span>
              <Button variant="primary" loading>Menyimpan...</Button>
            </div>
          </div>
        </section>

        {/* Section 4: Chip & Kontrol Segmented */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">4. Chip & Kontrol Segmented</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Menggunakan token --radius-chip untuk kontrol pemilihan kategori foto.
          </p>

          <div className="inline-flex p-1 bg-kertas rounded-chip border border-garis gap-1">
            {(['semua', 'potret', 'lanskap'] as const).map((chip) => {
              const active = activeChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveChip(chip)}
                  className={`px-4 py-2 text-xs font-medium rounded-chip transition-colors min-h-[36px] ${
                    active
                      ? 'bg-merah text-kertas'
                      : 'text-tinta hover:bg-kertas-tua/60'
                  }`}
                >
                  {chip.charAt(0).toUpperCase() + chip.slice(1)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 5: Input & Form Field */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">5. Sudut Input Form</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Input teks serasi dengan token --radius-input.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="label">Nama Klien</label>
              <input
                type="text"
                placeholder="Contoh: Putri & Dimas"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Pencarian Foto</label>
              <div className="relative">
                <Search className="w-4 h-4 text-tinta-lembut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari file..."
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Dialog / Popup & Toast */}
        <section className="bg-kertas-tua/30 p-6 sm:p-8 rounded-panel border border-garis">
          <h2 className="font-serif text-2xl text-tinta mb-2">6. Dialog / Popup & Notifikasi Toast</h2>
          <p className="text-xs text-tinta-lembut mb-6">
            Bentuk sudut popup/dialog memakai --radius-panel (12px bawaan lembut).
          </p>

          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" onClick={() => setShowDialog(true)}>
              Buka Pratinjau Dialog
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.success('Pilihan foto berhasil disimpan!')}
            >
              Uji Toast Sukses
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.error('Gagal menyinkronkan data.')}
            >
              Uji Toast Error
            </Button>
          </div>

          {/* Modal Preview */}
          {showDialog && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                className="bg-kertas border border-garis rounded-panel p-6 sm:p-8 max-w-md w-full shadow-elevated"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="label-caps text-merah block mb-1">KONFIRMASI SELEKSI</span>
                    <h3 className="font-serif text-2xl text-tinta">Kirim Pilihan Foto?</h3>
                  </div>
                  <button
                    onClick={() => setShowDialog(false)}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-tinta-lembut hover:text-tinta rounded-btn"
                    aria-label="Tutup dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-tinta-lembut font-body mb-6 leading-relaxed">
                  Kamu telah memilih 24 foto. Setelah dikirim, fotografer akan menerima daftar file ini untuk proses editing.
                </p>

                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setShowDialog(false)}>
                    Kembali
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowDialog(false);
                      toast.success('Pilihan foto sukses dikirim!');
                    }}
                  >
                    Kirim Sekarang
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
