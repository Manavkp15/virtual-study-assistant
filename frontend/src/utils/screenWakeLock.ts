/**
 * Screen Wake Lock Manager
 * Prevents laptop / mobile / desktop screens from dimming, turning off, or going to sleep
 * while Pomodoro study or break timers are actively running.
 *
 * Uses the official W3C Screen Wake Lock API (Chrome, Edge, Safari, Firefox),
 * with an automatic fallback mechanism for browsers without native support.
 */

class ScreenWakeLockManager {
  private sentinel: any = null;
  private fallbackVideo: HTMLVideoElement | null = null;
  private isRequested: boolean = false;
  private listeners: Set<(active: boolean) => void> = new Set();

  /**
   * Subscribe to wake lock status changes
   */
  public subscribe(listener: (active: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isActive());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const active = this.isActive();
    this.listeners.forEach(fn => {
      try {
        fn(active);
      } catch (e) {
        console.error('Error in wake lock listener:', e);
      }
    });
  }

  /**
   * Is wake lock actively preventing screen sleep
   */
  public isActive(): boolean {
    if (this.sentinel && !this.sentinel.released) {
      return true;
    }
    if (this.fallbackVideo && !this.fallbackVideo.paused) {
      return true;
    }
    return false;
  }

  /**
   * Acquire screen wake lock to keep screen awake
   */
  public async acquire(): Promise<boolean> {
    this.isRequested = true;

    // 1. Try native Screen Wake Lock API (Supported in Chrome 84+, Edge 84+, Safari 16.4+, Firefox 126+)
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        if (!this.sentinel || this.sentinel.released) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          this.sentinel = sentinel;

          sentinel.addEventListener('release', () => {
            this.sentinel = null;
            this.notify();
            // If released unexpectedly while we still want it (e.g. tab visibility loss),
            // it will be re-acquired when the tab becomes visible again
          });

          this.notify();
          return true;
        } else {
          return true;
        }
      } catch (err) {
        // Native wake lock request can fail if battery saver is active or permission blocked
        console.warn('Native Wake Lock request failed, trying fallback:', err);
      }
    }

    // 2. Fallback: Invisible muted video stream from canvas
    // Browsers keep screen awake while active media is playing
    try {
      if (!this.fallbackVideo && typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 1, 1);
        }

        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.muted = true;
        video.loop = true;
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';

        // Check if captureStream is available
        const captureStream = (canvas as any).captureStream || (canvas as any).webkitCaptureStream;
        if (captureStream) {
          video.srcObject = captureStream.call(canvas, 1); // 1 fps
        }

        document.body.appendChild(video);
        this.fallbackVideo = video;
      }

      if (this.fallbackVideo) {
        await this.fallbackVideo.play();
        this.notify();
        return true;
      }
    } catch (e) {
      // Fallback failed or blocked by browser autoplay policy
    }

    this.notify();
    return false;
  }

  /**
   * Release wake lock so device can sleep normally
   */
  public async release(): Promise<void> {
    this.isRequested = false;

    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (e) {
        // ignore
      }
      this.sentinel = null;
    }

    if (this.fallbackVideo) {
      try {
        this.fallbackVideo.pause();
        if (this.fallbackVideo.srcObject) {
          const stream = this.fallbackVideo.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          this.fallbackVideo.srcObject = null;
        }
        this.fallbackVideo.remove();
      } catch (e) {
        // ignore
      }
      this.fallbackVideo = null;
    }

    this.notify();
  }

  /**
   * Re-acquire if window becomes visible again and lock was requested
   */
  public handleVisibilityChange(): void {
    if (this.isRequested && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      if (!this.isActive()) {
        this.acquire().catch(() => {});
      }
    }
  }
}

export const screenWakeLockManager = new ScreenWakeLockManager();
