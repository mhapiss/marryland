import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-40 text-center text-sm font-medium py-2 px-4 transition-all duration-300 ${
        isOnline
          ? 'bg-green-50 text-green-700 border-b border-green-200'
          : 'bg-amber-50 text-amber-700 border-b border-amber-200'
      }`}
    >
      {isOnline
        ? 'Koneksi kembali tersambung.'
        : 'Koneksi internet terputus. Beberapa fitur mungkin tidak tersedia.'}
    </div>
  );
}
