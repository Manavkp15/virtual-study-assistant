/**
 * Synthesizes gentle audio chimes using the Web Audio API.
 * 100% offline, zero external audio asset dependencies.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Pleasant ascending chime when a 25-minute focus study session completes.
   */
  public playSessionCompleteChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

        gain.gain.setValueAtTime(0, startTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, startTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.12);
        osc.stop(startTime + idx * 0.12 + 0.85);
      });
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Invigorating chime when the 5-minute break ends and it's time to study again.
   */
  public playBreakCompleteChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [392.0, 523.25, 659.25]; // G4, C5, E5
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.14);

        gain.gain.setValueAtTime(0, startTime + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.28, startTime + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.14 + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.14);
        osc.stop(startTime + idx * 0.14 + 0.95);
      });
    } catch (e) {}
  }

  /**
   * Subtle button click feedback.
   */
  public playClickFeedback() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffects();
