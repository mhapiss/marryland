import React, { useState, useEffect } from 'react';
import { copyToClipboard } from '../lib/clipboard';
import { toast } from 'sonner';
import {
  formatClientMessage,
  DEFAULT_MAIN_TEMPLATE,
  DEFAULT_ALBUM_SECTION,
  MessageVariables,
} from '../lib/messageTemplate';
import { X, Send, Copy, Check, Link as LinkIcon, Sparkles } from 'lucide-react';
import type { Gallery } from '../pages/Dashboard';

interface Props {
  gallery: Gallery | null;
  onClose: () => void;
  photographerName?: string;
  studioName?: string;
  studioSlug?: string;
  mainTemplate?: string;
  albumTemplate?: string;
}

export default function SendClientMessageModal({
  gallery,
  onClose,
  photographerName = 'Fotografer',
  studioName = 'by.marryland',
  studioSlug = 'studio',
  mainTemplate = DEFAULT_MAIN_TEMPLATE,
  albumTemplate = DEFAULT_ALBUM_SECTION,
}: Props) {
  const [messageText, setMessageText] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    if (!gallery) return;

    const origin = window.location.origin;
    const linkPilih = `${origin}/g/${gallery.client_slug}`;
    const linkAlbum = gallery.album_token
      ? `${origin}/album/${gallery.client_slug}?t=${gallery.album_token}`
      : `${origin}/album/${gallery.client_slug}`;

    const batasWaktu = gallery.deadline_date
      ? new Date(gallery.deadline_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'tanpa batas tenggat';

    const vars: MessageVariables = {
      nama_klien: gallery.client_name,
      nama_galeri: gallery.client_name,
      nama_fotografer: photographerName,
      nama_studio: studioName,
      link_pilih: linkPilih,
      link_album: linkAlbum,
      batas_pilihan: `${gallery.max_photos_selectable} foto`,
      batas_waktu: batasWaktu,
    };

    const formatted = formatClientMessage(
      mainTemplate,
      albumTemplate,
      vars,
      Boolean(gallery.album_enabled)
    );

    setMessageText(formatted);
  }, [gallery, photographerName, studioName, studioSlug, mainTemplate, albumTemplate]);

  if (!gallery) return null;

  const origin = window.location.origin;
  const linkPilih = `${origin}/g/${gallery.client_slug}`;
  const linkAlbum = gallery.album_token
    ? `${origin}/album/${gallery.client_slug}?t=${gallery.album_token}`
    : `${origin}/album/${gallery.client_slug}`;

  // WhatsApp clean number
  const cleanPhone = (gallery.client_whatsapp || '').replace(/[^0-9]/g, '');

  const handleSendWhatsApp = () => {
    if (!cleanPhone) {
      toast.error('Nomor WhatsApp klien belum diisi.');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleCopy = async (text: string, type: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Kirim Pesan ke Klien"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-garis rounded-[2px] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col font-sans text-tinta"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-garis flex items-start justify-between bg-kertas-tua/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-merah bg-merah/10 border border-merah/25 px-2 py-0.5 rounded-[2px]">
                Siap Kirim
              </span>
              <span className="text-xs font-mono text-tinta-lembut">
                Klien: {gallery.client_name} ({gallery.client_whatsapp})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-tinta">
              Pesan Kurasi Galeri Klien
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-tinta-lembut">
                Pratinjau Pesan (Bisa diedit sebelum dikirim)
              </label>
              <span className="text-[11px] font-mono text-tinta-lembut/70">
                {messageText.length} karakter
              </span>
            </div>

            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-4 bg-kertas border border-garis rounded-[2px] text-xs sm:text-sm text-tinta focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah font-mono leading-relaxed resize-y"
              placeholder="Tulis pesan untuk klien..."
            />
          </div>

          {/* Quick link copy actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-garis">
            <button
              type="button"
              onClick={() => handleCopy(linkPilih, 'link_pilih')}
              className="flex items-center justify-between px-3.5 py-2.5 bg-kertas hover:bg-white border border-garis rounded-[2px] text-xs font-mono text-tinta hover:text-merah transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2 truncate">
                <LinkIcon className="w-3.5 h-3.5 text-merah shrink-0" />
                <span className="truncate">Salin Tautan Pilih Foto</span>
              </div>
              {copiedType === 'link_pilih' ? (
                <Check className="w-4 h-4 text-sukses shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-tinta-lembut shrink-0" />
              )}
            </button>

            {gallery.album_enabled ? (
              <button
                type="button"
                onClick={() => handleCopy(linkAlbum, 'link_album')}
                className="flex items-center justify-between px-3.5 py-2.5 bg-kertas hover:bg-white border border-garis rounded-[2px] text-xs font-mono text-tinta hover:text-merah transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-merah shrink-0" />
                  <span className="truncate">Salin Tautan Album Keluarga</span>
                </div>
                {copiedType === 'link_album' ? (
                  <Check className="w-4 h-4 text-sukses shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-tinta-lembut shrink-0" />
                )}
              </button>
            ) : (
              <div className="flex items-center px-3.5 py-2.5 bg-kertas/50 border border-garis/60 rounded-[2px] text-[11px] font-mono text-tinta-lembut">
                Album keluarga belum diaktifkan di galeri ini
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-garis bg-kertas flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleCopy(messageText, 'pesan')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-garis hover:border-merah text-tinta hover:text-merah text-xs font-medium rounded-[2px] transition-colors min-h-[44px]"
          >
            {copiedType === 'pesan' ? (
              <>
                <Check className="w-4 h-4 text-sukses" />
                <span>Pesan Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Seluruh Pesan</span>
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border border-garis rounded-[2px] text-xs font-medium text-tinta-lembut hover:text-tinta transition-colors min-h-[44px]"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-merah hover:bg-merah-hover text-white text-xs font-medium rounded-[2px] transition-colors shadow-sm min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>Kirim lewat WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
