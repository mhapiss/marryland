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
  // Kita menggunakan Google Apps Script Web App untuk membypass batasan OAuth2 Google
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  
  if (!scriptUrl) {
    throw new Error("URL Google Apps Script belum dikonfigurasi di .env.local (VITE_GOOGLE_APPS_SCRIPT_URL).");
  }

  try {
    const url = `${scriptUrl}?id=${folderId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Gagal menghubungi server Apps Script.");
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

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
