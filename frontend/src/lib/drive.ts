// src/lib/drive.ts
import { toast } from 'sonner';

export function parseDriveFolder(url: string): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    
    // Format 1: https://drive.google.com/drive/folders/ID
    // Format 2: https://drive.google.com/drive/u/0/folders/ID
    if (parsedUrl.pathname.includes('/folders/')) {
      const parts = parsedUrl.pathname.split('/');
      const index = parts.indexOf('folders');
      if (index !== -1 && parts[index + 1]) {
        return parts[index + 1];
      }
    }
    
    // Format 3: https://drive.google.com/open?id=ID or ?id=ID on any path
    const idParam = parsedUrl.searchParams.get('id');
    if (idParam) {
      return idParam;
    }
    
    toast.error('URL Google Drive tidak valid. Pastikan kamu menyalin link dari folder.');
    return null;
  } catch {
    toast.error('Format URL tidak valid.');
    return null;
  }
}
