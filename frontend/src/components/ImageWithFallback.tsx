import { useState, useCallback } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export default function ImageWithFallback({ src, alt, className, fallbackClassName, ...props }: Props) {
  const [hasError, setHasError] = useState(false);
  const [retried, setRetried] = useState(false);

  const handleError = useCallback(() => {
    if (!retried && src) {
      setRetried(true);
      // Force retry by appending cache-buster
      const img = new Image();
      img.src = src + (src.includes('?') ? '&' : '?') + '_retry=1';
      img.onload = () => setHasError(false);
      img.onerror = () => setHasError(true);
    } else {
      setHasError(true);
    }
  }, [retried, src]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-primary-50 ${fallbackClassName || className || ''}`}>
        <svg className="w-8 h-8 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
