export interface ProcessedHomeImage {
  variants: {
    w480: Blob | null;
    w960: Blob | null;
    w1600: Blob | null;
  };
  blurData: string;
  width: number;
  height: number;
}

export const processHomeImage = async (file: File): Promise<ProcessedHomeImage> => {
  // Check file size (15MB)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 15MB");
  }

  // Check format
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error("Format gambar harus JPEG, PNG, atau WebP");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  const processVariant = async (targetWidth: number, maxSizeKB: number): Promise<Blob | null> => {
    if (originalWidth < targetWidth) return null; // No upscaling

    const targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);
    
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Gagal membuat canvas");
    
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    let quality = 0.8;
    let blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
    
    // Reduce quality iteratively if size is too big
    while (blob && blob.size > maxSizeKB * 1024 && quality > 0.3) {
      quality -= 0.1;
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
    }
    
    return blob;
  };

  const w480 = await processVariant(480, 60);
  const w960 = await processVariant(960, 150);
  const w1600 = await processVariant(1600, 350);

  // Fallback if original is smaller than 480
  let defaultVariant = w480 || w960 || w1600;
  if (!defaultVariant) {
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
      defaultVariant = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.8));
    }
  }

  // Generate 24px blur placeholder
  const blurCanvas = document.createElement('canvas');
  const blurWidth = 24;
  const blurHeight = Math.round((24 / originalWidth) * originalHeight);
  blurCanvas.width = blurWidth;
  blurCanvas.height = blurHeight;
  const blurCtx = blurCanvas.getContext('2d');
  if (blurCtx) {
    blurCtx.drawImage(bitmap, 0, 0, blurWidth, blurHeight);
  }
  const blurData = blurCanvas.toDataURL('image/jpeg', 0.5);

  return {
    variants: {
      w480: w480 || defaultVariant,
      w960: w960 || defaultVariant,
      w1600: w1600 || defaultVariant,
    },
    blurData,
    width: originalWidth,
    height: originalHeight
  };
};
