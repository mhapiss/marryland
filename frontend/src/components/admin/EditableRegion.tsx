// src/components/admin/EditableRegion.tsx
import React, { useState } from 'react';
import { Edit2, Plus, Image as ImageIcon } from 'lucide-react';

export interface EditableRegionProps {
  id: string;
  label: string;
  isPreview?: boolean;
  isActive?: boolean;
  isHovered?: boolean;
  isEmpty?: boolean;
  emptyPlaceholder?: string;
  slotType?: 'section' | 'field' | 'photo_slot';
  suggestedAspect?: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  children?: React.ReactNode;
  className?: string;
}

export function EditableRegion({
  id,
  label,
  isPreview = false,
  isActive = false,
  isHovered = false,
  isEmpty = false,
  emptyPlaceholder,
  slotType = 'section',
  suggestedAspect,
  onSelect,
  onHover,
  children,
  className = '',
}: EditableRegionProps) {
  const [internalHover, setInternalHover] = useState(false);

  // In production public view, render clean children with zero admin overhead
  if (!isPreview) {
    if (isEmpty) return null;
    return <>{children}</>;
  }

  const showHighlight = isActive || isHovered || internalHover;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id);
    }
    // Also dispatch postMessage if inside an iframe to notify parent editor
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'MARRYLAND_REGION_SELECT',
            editKey: id,
          },
          window.location.origin
        );
      } catch {
        // ignore cross-origin restrictions if any
      }
    }
  };

  const handleMouseEnter = () => {
    setInternalHover(true);
    onHover?.(id);
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'MARRYLAND_REGION_HOVER',
            editKey: id,
          },
          window.location.origin
        );
      } catch {
        // ignore
      }
    }
  };

  const handleMouseLeave = () => {
    setInternalHover(false);
    onHover?.(null);
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'MARRYLAND_REGION_HOVER',
            editKey: null,
          },
          window.location.origin
        );
      } catch {
        // ignore
      }
    }
  };

  // If empty slot in preview mode, render stylish dashed box with instructions
  if (isEmpty) {
    return (
      <div
        id={`editable-${id}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer border-2 border-dashed transition-all duration-200 rounded-[2px] p-6 flex flex-col items-center justify-center text-center select-none ${
          showHighlight
            ? 'border-merah bg-merah/10 ring-2 ring-merah/40'
            : 'border-garis hover:border-merah/60 bg-kertas-tua/40 hover:bg-merah/5'
        } ${suggestedAspect ? `aspect-[${suggestedAspect.replace(':', '/')}]` : 'min-h-[160px]'} ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-white border border-garis flex items-center justify-center mb-2 shadow-xs text-merah">
          {slotType === 'photo_slot' ? <ImageIcon className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
        <span className="text-xs font-serif font-medium text-tinta block mb-1">
          {label}
        </span>
        <span className="text-[11px] font-mono text-tinta-lembut max-w-xs leading-tight">
          {emptyPlaceholder || (suggestedAspect ? `Slot foto kosong (${suggestedAspect}) - Klik untuk mengisi` : 'Klik untuk mengubah isian ini di formulir')}
        </span>

        {/* Small floating tag */}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-merah text-white font-mono text-[9px] uppercase tracking-wider rounded-[2px] flex items-center gap-1 shadow-xs">
          <Edit2 className="w-2.5 h-2.5" />
          <span>Isi Slot</span>
        </span>
      </div>
    );
  }

  return (
    <div
      id={`editable-${id}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group/editable cursor-pointer transition-all duration-200 ${
        showHighlight
          ? 'outline-2 outline-dashed outline-merah ring-4 ring-merah/20 bg-merah/[0.02]'
          : 'hover:outline-1 hover:outline-dashed hover:outline-merah/60'
      } ${className}`}
    >
      {/* Floating Badge on Hover / Active */}
      <div
        className={`absolute top-2 right-2 z-30 transition-all duration-200 pointer-events-none ${
          showHighlight ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 group-hover/editable:opacity-100 group-hover/editable:translate-y-0 group-hover/editable:scale-100'
        }`}
      >
        <div className="bg-merah text-white px-2.5 py-1 rounded-[2px] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-white/20">
          <Edit2 className="w-3 h-3 text-kertas" />
          <span>{label}</span>
        </div>
      </div>

      {children}
    </div>
  );
}

export default EditableRegion;
