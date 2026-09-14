// src/services/driveApi.ts

// Tipe balikan dari fungsi fetch
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
}

/**
 * Mengambil daftar file gambar dari sebuah folder Google Drive publik.
 * Membutuhkan Google API Key (diset di VITE_GOOGLE_API_KEY).
 * Folder di Google Drive HARUS diatur ke "Anyone with the link can view".
 */
export async function fetchDriveFolderContents(folderId: string): Promise<DriveFile[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google API Key belum dikonfigurasi di .env.local (VITE_GOOGLE_API_KEY).");
  }

  try {
    // 1. Fetch file list dari Google Drive v3 API
    // Kita filter hanya tipe gambar (image/)
    const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    const fields = 'files(id, name, mimeType)';
    
    // Pagination (max 1000 file sekali ambil)
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=1000&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errData = await response.json();
      console.error("Drive API Error:", errData);
      throw new Error(errData.error?.message || "Gagal mengambil data dari Google Drive. Pastikan folder publik.");
    }
    
    const data = await response.json();
    
    if (!data.files || data.files.length === 0) {
      return [];
    }

    // 2. Format balikan dan generate on-the-fly thumbnail URL
    // Format on-the-fly: https://drive.google.com/thumbnail?id={fileId}&sz=w800
    // sz=w800 untuk lebar maksimal 800px agar ringan diload di grid
    const files: DriveFile[] = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`
    }));

    // Sort berdasarkan nama file agar urut sesuai kamera
    return files.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error: any) {
    console.error("Error in fetchDriveFolderContents:", error);
    throw error;
  }
}
