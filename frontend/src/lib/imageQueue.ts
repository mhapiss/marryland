// src/lib/imageQueue.ts
/**
 * Concurrency queue for Google Drive image thumbnails.
 * Enforces a strict limit of max 6 simultaneous parallel image requests
 * to avoid browser socket exhaustion and Google Drive CDN 429 throttling.
 */

type QueueTask = () => Promise<void>;

class ImageLoadQueue {
  private maxConcurrent = 6;
  private currentActive = 0;
  private queue: QueueTask[] = [];

  enqueue(task: QueueTask) {
    this.queue.push(task);
    this.processNext();
  }

  private processNext() {
    if (this.currentActive >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) return;

    this.currentActive++;
    nextTask().finally(() => {
      this.currentActive--;
      this.processNext();
    });
  }
}

export const imageLoadQueue = new ImageLoadQueue();

/**
 * Load an image with retry & exponential backoff (max 3 retries)
 * Retry delays: 500ms, 1500ms, 3000ms
 */
export function loadImageWithBackoff(
  src: string,
  onSuccess: (loadedSrc: string) => void,
  onError: () => void,
  maxRetries: number = 3
): () => void {
  let isCancelled = false;
  let attempt = 0;

  const tryLoad = () => {
    if (isCancelled) return;

    imageLoadQueue.enqueue(async () => {
      if (isCancelled) return;

      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          const cleanSrc = attempt > 0
            ? src + (src.includes('?') ? '&' : '?') + `_retry=${attempt}&t=${Date.now()}`
            : src;

          img.onload = () => {
            if (!isCancelled) {
              onSuccess(cleanSrc);
            }
            resolve();
          };

          img.onerror = () => {
            reject(new Error(`Failed loading image attempt ${attempt + 1}`));
          };

          img.src = cleanSrc;
        });
      } catch {
        if (isCancelled) return;

        attempt++;
        if (attempt < maxRetries) {
          // Exponential backoff: 500ms, 1500ms, 3000ms
          const delay = attempt === 1 ? 500 : attempt === 2 ? 1500 : 3000;
          setTimeout(tryLoad, delay);
        } else {
          onError();
        }
      }
    });
  };

  tryLoad();

  // Return cancel function
  return () => {
    isCancelled = true;
  };
}
