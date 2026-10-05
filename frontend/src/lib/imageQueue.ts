// src/lib/imageQueue.ts
/**
 * Concurrency queue for Google Drive image thumbnails.
 * Enforces a strict limit of max 4 simultaneous parallel image requests
 * to avoid browser socket exhaustion and Google Drive CDN 429 throttling.
 *
 * Core capabilities:
 * 1. Concurrency limit (default 4, within 4-6 range)
 * 2. Viewport priority scheduling (high priority for visible items)
 * 3. Exponential backoff with ±30% jitter for network/429 errors
 * 4. Zero cache-busting timestamps (&t=Date.now()) to maximize browser HTTP cache
 * 5. In-memory session cache of loaded URLs for instant re-renders
 * 6. Clean task cancellation upon unmount / scroll-away
 */

export type QueuePriority = 'high' | 'normal';

export interface EnqueueOptions {
  priority?: QueuePriority;
}

interface QueuedTask {
  id: string;
  priority: QueuePriority;
  execute: () => Promise<void>;
  cancel: () => void;
  isCancelled: boolean;
}

export class ImageLoadQueue {
  private maxConcurrent = 4;
  private currentActive = 0;
  private queue: QueuedTask[] = [];
  private loadedUrls = new Set<string>();

  /**
   * Set concurrency limit (clamped between 2 and 6)
   */
  setMaxConcurrent(limit: number) {
    this.maxConcurrent = Math.max(2, Math.min(6, limit));
  }

  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  getActiveCount(): number {
    return this.currentActive;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isLoaded(url: string): boolean {
    return this.loadedUrls.has(url);
  }

  markLoaded(url: string) {
    this.loadedUrls.add(url);
  }

  clearLoadedCache() {
    this.loadedUrls.clear();
  }

  clearQueue() {
    for (const task of this.queue) {
      task.cancel();
    }
    this.queue = [];
  }

  /**
   * Enqueue an async task with optional priority.
   * Returns a cancellation function.
   */
  enqueue(
    execute: () => Promise<void>,
    options?: EnqueueOptions
  ): () => void {
    const priority = options?.priority || 'normal';
    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const queuedTask: QueuedTask = {
      id: taskId,
      priority,
      execute,
      cancel: () => {
        queuedTask.isCancelled = true;
      },
      isCancelled: false,
    };

    if (priority === 'high') {
      // Insert ahead of first normal priority task
      const firstNormalIndex = this.queue.findIndex((t) => t.priority === 'normal');
      if (firstNormalIndex === -1) {
        this.queue.push(queuedTask);
      } else {
        this.queue.splice(firstNormalIndex, 0, queuedTask);
      }
    } else {
      this.queue.push(queuedTask);
    }

    this.processNext();

    return () => {
      queuedTask.cancel();
      const idx = this.queue.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
    };
  }

  private processNext() {
    if (this.currentActive >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) return;

    if (nextTask.isCancelled) {
      // Skip task if cancelled before starting
      this.processNext();
      return;
    }

    this.currentActive++;
    nextTask
      .execute()
      .finally(() => {
        this.currentActive--;
        this.processNext();
      });
  }
}

export const imageLoadQueue = new ImageLoadQueue();

export interface LoadImageOptions {
  priority?: QueuePriority;
  maxRetries?: number;
  baseDelayMs?: number;
  onDimensionDetected?: (width: number, height: number) => void;
}

/**
 * Calculate exponential backoff delay with ±30% jitter.
 * Formula: delay = base * (2 ** attempt) * (0.7 + Math.random() * 0.6)
 *
 * Example (base = 1000ms):
 * attempt 0: ~1s (700ms - 1300ms)
 * attempt 1: ~2s (1400ms - 2600ms)
 * attempt 2: ~4s (2800ms - 5200ms)
 * attempt 3: ~8s (5600ms - 10400ms)
 */
export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs: number = 1000
): number {
  const exponential = Math.pow(2, attempt);
  const jitterFactor = 0.7 + Math.random() * 0.6; // range: 0.7 to 1.3 (±30%)
  return Math.round(baseDelayMs * exponential * jitterFactor);
}

/**
 * Load an image through the concurrency queue with exponential backoff and jitter.
 * Canonical URL is strictly preserved (ZERO &t=Date.now() cache busting) to maximize
 * browser HTTP cache hits and prevent CDN 429 throttling.
 *
 * Returns a cancellation function.
 */
export function loadImageWithBackoff(
  src: string,
  onSuccess: (loadedSrc: string, naturalWidth?: number, naturalHeight?: number) => void,
  onError: (error: Error) => void,
  options?: LoadImageOptions
): () => void {
  let isCancelled = false;
  let cancelQueue: (() => void) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const priority = options?.priority ?? 'normal';

  // Fast path: if already marked loaded in session cache, return immediately
  if (imageLoadQueue.isLoaded(src)) {
    Promise.resolve().then(() => {
      if (!isCancelled) {
        onSuccess(src);
      }
    });
    return () => {
      isCancelled = true;
    };
  }

  const tryLoad = () => {
    if (isCancelled) return;

    cancelQueue = imageLoadQueue.enqueue(
      async () => {
        if (isCancelled) return;

        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';

            img.onload = () => {
              if (!isCancelled) {
                imageLoadQueue.markLoaded(src);
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                if (options?.onDimensionDetected && nw > 0 && nh > 0) {
                  options.onDimensionDetected(nw, nh);
                }
                onSuccess(src, nw, nh);
              }
              resolve();
            };

            img.onerror = () => {
              reject(new Error(`Failed to load image from Drive (attempt ${attempt + 1})`));
            };

            // Canonical URL preserved without any timestamp or cache busting parameter
            img.src = src;
          });
        } catch (err: any) {
          if (isCancelled) return;

          attempt++;
          if (attempt <= maxRetries) {
            const delay = calculateBackoffWithJitter(attempt - 1, baseDelayMs);
            timeoutId = setTimeout(() => {
              if (!isCancelled) {
                tryLoad();
              }
            }, delay);
          } else {
            onError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      },
      { priority }
    );
  };

  tryLoad();

  return () => {
    isCancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (cancelQueue) {
      cancelQueue();
      cancelQueue = null;
    }
  };
}
