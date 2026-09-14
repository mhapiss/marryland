import React from 'react';
import type { Gallery } from '../pages/Dashboard';

interface Props {
  gallery: Gallery;
  onViewSelections: (gallery: Gallery) => void;
  onDelete: (galleryId: string) => void;
  onShareWhatsApp: () => void;
  onCopyLink: () => void;
}

const GalleryCard: React.FC<Props> = ({ gallery, onViewSelections, onDelete, onShareWhatsApp, onCopyLink }) => {
  const selectedCount = gallery.selected_count || 0;
  const maxPhotos = gallery.max_photos_selectable;
  const progressPercent = Math.min((selectedCount / maxPhotos) * 100, 100);

  const daysLeft = gallery.deadline_date
    ? Math.max(0, Math.ceil((new Date(gallery.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const statusBadge = () => {
    switch (gallery.status) {
      case 'completed':
        return <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Selesai</span>;
      case 'active':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Aktif</span>;
      default:
        return <span className="bg-gray-50 text-gray-500 border border-gray-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Draft</span>;
    }
  };

  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-6 flex flex-col">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-serif font-bold text-text text-xl mb-1">{gallery.client_name}</h4>
          <div className="flex items-center text-xs text-muted font-medium gap-2">
            <span>
              {gallery.event_date
                ? new Date(gallery.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Tanggal belum diatur'}
            </span>
            <span className="text-primary-200">•</span>
            <span>Maks {maxPhotos} foto</span>
            {daysLeft !== null && (
              <>
                <span className="text-primary-200">•</span>
                <span className={daysLeft <= 3 ? 'text-red-500 font-bold' : ''}>Sisa {daysLeft} hari</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 bg-background rounded-xl p-4 border border-primary-100/50">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
          <span>Foto Terpilih</span>
          <span className="text-primary">{selectedCount} / {maxPhotos}</span>
        </div>
        <div className="w-full bg-primary-100/50 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main action button */}
      <button
        onClick={() => onViewSelections(gallery)}
        className="btn-primary w-full py-2.5 text-sm mb-4"
      >
        Lihat Foto Pilihan Klien
      </button>

      {/* Secondary & Icon Actions */}
      <div className="flex items-center gap-3">
        {/* Icon actions group */}
        <div className="flex items-center bg-background rounded-xl border border-primary-100/50 p-1">
          <button
            onClick={onShareWhatsApp}
            className="p-2 rounded-lg hover:bg-green-50 text-muted hover:text-green-600 transition-colors"
            title="Share ke WhatsApp"
          >
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg hover:bg-primary-50 text-muted hover:text-primary transition-colors"
            title={copied ? 'Tersalin!' : 'Salin link'}
          >
            {copied ? (
              <svg className="w-[18px] h-[18px] text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            )}
          </button>
          <button className="p-2 rounded-lg hover:bg-primary-50 text-muted hover:text-primary transition-colors" title="Settings">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <div className="w-px h-5 bg-primary-100 mx-1"></div>
          <button
            onClick={() => onDelete(gallery.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
            title="Hapus"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>

        {/* Action buttons group */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <button className="h-full flex items-center justify-center gap-2 bg-background border border-primary-100/50 hover:bg-primary-50 text-text hover:text-primary rounded-xl text-xs font-semibold transition-colors px-2 py-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span className="truncate">Lightroom</span>
            <span className="shrink-0 bg-primary-100 text-primary-700 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">1 Kr</span>
          </button>
          <button className="h-full flex items-center justify-center gap-2 bg-background border border-primary-100/50 hover:bg-primary-50 text-text hover:text-primary rounded-xl text-xs font-semibold transition-colors px-2 py-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span className="truncate">Download JPG</span>
            <span className="shrink-0 bg-primary-100 text-primary-700 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">1 Kr</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryCard;
