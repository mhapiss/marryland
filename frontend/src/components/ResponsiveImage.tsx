import React, { useState, useEffect } from 'react';

export interface HomePhoto {
  id?: string;
  slot: string;
  base_path: string;
  blur_data: string | null;
  focal: string | null;
  alt_text: string | null;
}

interface ResponsiveImageProps {
  photo: HomePhoto;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
  frame?: 'print' | 'none';
}

export function ResponsiveImage({
  photo,
  priority = false,
  className = '',
  imgClassName = '',
  alt,
  frame = 'none',
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (!photo || !photo.base_path) {
    return <div className={`bg-kertas-tua/40 border border-garis ${className}`} />;
  }

  const { base_path, blur_data, focal, alt_text } = photo;
  const objectPosition = focal || 'center';
  const finalAlt = alt || alt_text || '';

  const srcSet = `${base_path}_480.webp 480w, ${base_path}_960.webp 960w, ${base_path}_1600.webp 1600w`;
  const defaultSrc = `${base_path}_960.webp`;

  const imageElement = (
    <div
      className={`relative overflow-hidden ${frame === 'print' ? 'w-full h-full' : className}`}
      style={{
        backgroundImage: blur_data && !loaded ? `url(${blur_data})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: objectPosition,
      }}
    >
      <img
        src={defaultSrc}
        srcSet={srcSet}
        sizes="(max-width: 480px) 480px, (max-width: 960px) 960px, 100vw"
        alt={finalAlt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        style={{ objectPosition }}
        loading={priority ? undefined : 'lazy'}
        decoding="async"
        {...(priority ? ({ fetchPriority: 'high' } as any) : {})}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );

  if (frame === 'print') {
    return (
      <div className={`frame-cetakan ${className}`}>
        {imageElement}
      </div>
    );
  }

  return imageElement;
}
