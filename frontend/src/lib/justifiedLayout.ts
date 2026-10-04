// src/lib/justifiedLayout.ts

export interface LayoutPhotoItem {
  id: string;
  width?: number | null;
  height?: number | null;
  rotation?: number;
  thumbnail_url?: string;
  [key: string]: any;
}

export interface JustifiedRowItem<T extends LayoutPhotoItem> {
  item: T;
  width: number;
  height: number;
  aspectRatio: number; // clamped ratio (0.5 to 3.0) used for row spacing
  rawAspectRatio: number; // real ratio before clamping
  isExtremeRatio: boolean; // true if raw ratio < 0.5 or > 3.0 (requires object-fit: contain)
}

export interface JustifiedRow<T extends LayoutPhotoItem> {
  top: number;
  height: number;
  items: JustifiedRowItem<T>[];
}

export interface JustifiedLayoutResult<T extends LayoutPhotoItem> {
  rows: JustifiedRow<T>[];
  totalHeight: number;
  gap: number;
}

export type ThumbnailSizePreset = 'small' | 'medium' | 'large';

/**
 * Calculate natural aspect ratio from dimensions and EXIF rotation.
 * If rotation is 90 or 270 degrees, width and height are swapped.
 * If dimensions are missing, falls back to standard 3:2 (1.5).
 */
export function getPhotoRawAspectRatio(item: LayoutPhotoItem): number {
  const w = item.width;
  const h = item.height;
  const rot = item.rotation || 0;

  if (w && h && w > 0 && h > 0) {
    if (rot === 90 || rot === 270) {
      return h / w;
    }
    return w / h;
  }

  // Fallback to standard 3:2 landscape aspect ratio if dimensions not yet available
  return 1.5;
}

/**
 * Clamp aspect ratio for layout calculation to [0.5, 3.0]
 * Photos outside this range will be displayed with object-fit: contain
 * on a neutral background to prevent excessive row stretching or distortion.
 */
export function getPhotoLayoutAspectRatio(item: LayoutPhotoItem): {
  clampedRatio: number;
  rawRatio: number;
  isExtreme: boolean;
} {
  const rawRatio = getPhotoRawAspectRatio(item);
  const clampedRatio = Math.max(0.5, Math.min(3.0, rawRatio));
  const isExtreme = rawRatio < 0.5 || rawRatio > 3.0;

  return { clampedRatio, rawRatio, isExtreme };
}

/**
 * Determine target row height based on container width and size preset:
 * - HP (< 640px): 110px (Kecil), 135px (Sedang), 160px (Besar) [120 - 150px range]
 * - Tablet (640px - 1023px): 140px (Kecil), 180px (Sedang), 220px (Besar) [~180px]
 * - Desktop (>= 1024px): 180px (Kecil), 230px (Sedang), 290px (Besar) [220 - 240px range]
 */
export function getTargetRowHeight(
  containerWidth: number,
  preset: ThumbnailSizePreset = 'medium'
): number {
  if (containerWidth < 640) {
    if (preset === 'small') return 110;
    if (preset === 'large') return 160;
    return 135; // medium default for mobile
  }

  if (containerWidth < 1024) {
    if (preset === 'small') return 140;
    if (preset === 'large') return 220;
    return 180; // medium default for tablet
  }

  // Desktop
  if (preset === 'small') return 180;
  if (preset === 'large') return 290;
  return 230; // medium default for desktop
}

export interface JustifiedLayoutOptions {
  containerWidth: number;
  targetRowHeight?: number;
  thumbnailSize?: ThumbnailSizePreset;
  gap?: number;
  maxRowStretch?: number; // default 1.5x targetRowHeight
  minItemsPerRowOnMobile?: number; // default 2
}

/**
 * Compute justified rows of photos based on their natural aspect ratios.
 * 
 * Rules:
 * 1. Preserves original photo order strictly from left to right.
 * 2. Gathers photos into a row until (sum(clampedRatio) * targetHeight) + totalGaps >= containerWidth.
 * 3. Scales row height to fit container width exactly, capped at maxRowStretch (1.5x targetHeight).
 * 4. Last row remains at targetHeight if it doesn't fill the container width (does not stretch).
 * 5. Gaps: 6px on mobile (<640px), 8px on desktop (>=640px).
 * 6. Minimum 2 items per row on mobile, unless a photo is extremely wide (ratio >= 2.2).
 * 7. Computes cumulative top offsets for fast viewport virtualization.
 */
export function computeJustifiedLayout<T extends LayoutPhotoItem>(
  items: T[],
  options: JustifiedLayoutOptions
): JustifiedLayoutResult<T> {
  const {
    containerWidth,
    thumbnailSize = 'medium',
    targetRowHeight = getTargetRowHeight(containerWidth, thumbnailSize),
    gap = containerWidth < 640 ? 6 : 8,
    maxRowStretch = 1.5,
    minItemsPerRowOnMobile = 2,
  } = options;

  if (items.length === 0 || containerWidth <= 0) {
    return { rows: [], totalHeight: 0, gap };
  }

  const isMobile = containerWidth < 640;
  const maxAllowedRowHeight = Math.round(targetRowHeight * maxRowStretch);
  const rows: JustifiedRow<T>[] = [];

  let currentRowItems: {
    item: T;
    clampedRatio: number;
    rawRatio: number;
    isExtreme: boolean;
  }[] = [];
  let currentRatioSum = 0;
  let cumulativeTop = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { clampedRatio, rawRatio, isExtreme } = getPhotoLayoutAspectRatio(item);

    currentRowItems.push({ item, clampedRatio, rawRatio, isExtreme });
    currentRatioSum += clampedRatio;

    // Available width after accounting for gaps between items in this row
    const totalGaps = (currentRowItems.length - 1) * gap;
    const availableWidth = containerWidth - totalGaps;
    const calculatedHeight = availableWidth / currentRatioSum;

    // Minimum items check for mobile: require >= 2 items unless a single item is very wide (>= 2.2)
    const satisfiesMinItems =
      !isMobile ||
      currentRowItems.length >= minItemsPerRowOnMobile ||
      (currentRowItems.length === 1 && clampedRatio >= 2.2);

    // Break row when calculated height reaches or drops below targetRowHeight
    if (calculatedHeight <= targetRowHeight && satisfiesMinItems) {
      // Row is full. Scale row height to fit container width, capped at maxAllowedRowHeight
      const rowHeight = Math.min(Math.round(calculatedHeight), maxAllowedRowHeight);
      let consumedWidth = 0;

      const rowItems: JustifiedRowItem<T>[] = currentRowItems.map((entry, idx) => {
        const isLastInRow = idx === currentRowItems.length - 1;
        // Last item takes remaining pixels to avoid 1px rounding discrepancies
        const itemWidth = isLastInRow
          ? Math.max(20, availableWidth - consumedWidth)
          : Math.max(20, Math.round(rowHeight * entry.clampedRatio));

        consumedWidth += itemWidth;

        return {
          item: entry.item,
          width: itemWidth,
          height: rowHeight,
          aspectRatio: entry.clampedRatio,
          rawAspectRatio: entry.rawRatio,
          isExtremeRatio: entry.isExtreme,
        };
      });

      rows.push({
        top: cumulativeTop,
        height: rowHeight,
        items: rowItems,
      });

      cumulativeTop += rowHeight + gap;
      currentRowItems = [];
      currentRatioSum = 0;
    }
  }

  // Handle remaining items in the last row
  if (currentRowItems.length > 0) {
    const totalGaps = (currentRowItems.length - 1) * gap;
    const availableWidth = containerWidth - totalGaps;
    const calculatedHeight = availableWidth / currentRatioSum;

    // Rule: Baris terakhir tetap pada tinggi target jika tidak cukup mengisi lebar (jangan ditarik melebar).
    // If stretching would make it taller than 1.15x target height, cap at targetRowHeight without stretching
    if (calculatedHeight > targetRowHeight * 1.15) {
      const finalHeight = targetRowHeight;
      const rowItems: JustifiedRowItem<T>[] = currentRowItems.map((entry) => ({
        item: entry.item,
        width: Math.max(20, Math.round(finalHeight * entry.clampedRatio)),
        height: finalHeight,
        aspectRatio: entry.clampedRatio,
        rawAspectRatio: entry.rawRatio,
        isExtremeRatio: entry.isExtreme,
      }));

      rows.push({
        top: cumulativeTop,
        height: finalHeight,
        items: rowItems,
      });
      cumulativeTop += finalHeight + gap;
    } else {
      // Almost full row: scale neatly to fit flush
      const finalHeight = Math.min(Math.round(calculatedHeight), maxAllowedRowHeight);
      let consumedWidth = 0;

      const rowItems: JustifiedRowItem<T>[] = currentRowItems.map((entry, idx) => {
        const isLastInRow = idx === currentRowItems.length - 1;
        const itemWidth = isLastInRow
          ? Math.max(20, availableWidth - consumedWidth)
          : Math.max(20, Math.round(finalHeight * entry.clampedRatio));

        consumedWidth += itemWidth;

        return {
          item: entry.item,
          width: itemWidth,
          height: finalHeight,
          aspectRatio: entry.clampedRatio,
          rawAspectRatio: entry.rawRatio,
          isExtremeRatio: entry.isExtreme,
        };
      });

      rows.push({
        top: cumulativeTop,
        height: finalHeight,
        items: rowItems,
      });
      cumulativeTop += finalHeight + gap;
    }
  }

  // Total height of the grid content
  const totalHeight = rows.length > 0 ? cumulativeTop - gap : 0;

  return {
    rows,
    totalHeight,
    gap,
  };
}

/**
 * Standard thumbnail size ladder supported by Google Drive & image CDNs:
 * 240, 360, 480, 720, 1080, 1600, 2048
 */
const STANDARD_THUMBNAIL_SIZES = [240, 360, 480, 720, 1080, 1600, 2048];

/**
 * Request thumbnail size according to renderWidth * devicePixelRatio,
 * rounded to the closest standard bucket.
 */
export function getOptimizedThumbnailUrl(
  url: string,
  renderWidth: number,
  dpr: number = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
): string {
  if (!url || typeof url !== 'string') return url;

  // Calculate needed physical pixels, clamped to max 3x DPR
  const neededPixels = Math.round(renderWidth * Math.min(dpr, 3));

  // Find smallest standard size that is >= neededPixels
  let targetSize = STANDARD_THUMBNAIL_SIZES[STANDARD_THUMBNAIL_SIZES.length - 1];
  for (const s of STANDARD_THUMBNAIL_SIZES) {
    if (s >= neededPixels) {
      targetSize = s;
      break;
    }
  }

  // Google Drive format 1: =w800 or =s800
  if (/=[ws]\d+/.test(url)) {
    return url.replace(/=[ws]\d+/, `=w${targetSize}`);
  }

  // Google Drive format 2: sz=w800 or sz=s800
  if (/sz=[ws]\d+/.test(url)) {
    return url.replace(/sz=[ws]\d+/, `sz=w${targetSize}`);
  }

  return url;
}
