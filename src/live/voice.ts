import { IS_STAGE, MUTE } from './page';

interface Line {
  text: string;
  at: number;
  done?: () => void;
}

const MAX_WAIT_MS = 55_000;
const MAX_QUEUE = 28;

class Voice {
  private normal: Line[] = [];
  private priority: Line[] = [];
  private playing = false;
  private fetchingActive = false;
  private abortCtrl: AbortController | null = null;
  private current: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private currentBooster: { setVolume: (v: number) => void; disconnect: () => void } | null = null;
  private lastSpokeAt = Date.now();
  rate = 1;
  volume = 1;
  masterEnabled = true;
  voiceEnabled = true;
  speaker = IS_STAGE && !MUTE;
  adminMonitor = false;

  onBlocked?: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  boostProvider?: (el: HTMLAudioElement, vol: number) => { setVolume: (v: number) => void; disconnect: () => void } | null;

  get canSpeak() {
    if (!this.masterEnabled || !this.voiceEnabled) return false;
    if (IS_STAGE) return !MUTE && this.speaker;
    return this.adminMonitor;
  }

  setSpeaker(mine: boolean) {
    if (!mine && this.speaker) this.stop();
    this.speaker = mine;
  }

  setAdminMonitor(on: boolean) {
    if (!on && this.adminMonitor) this.stop();
    this.adminMonitor = on;
  }

  applyConfig(cfg: { masterEnabled?: boolean; voiceEnabled?: boolean; voiceVolume?: number }) {
    if (cfg.masterEnabled !== undefined) this.masterEnabled = Boolean(cfg.masterEnabled);
    if (cfg.voiceEnabled !== undefined) this.voiceEnabled = Boolean(cfg.voiceEnabled);
    if (cfg.voiceVolume !== undefined) {
      const n = Number(cfg.voiceVolume);
      this.volume = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
      if (this.currentBooster) {
        this.currentBooster.setVolume(this.volume);
        if (this.current) this.current.volume = this.volume === 0 ? 0 : 1;
      } else if (this.current) {
        this.current.volume = this.volume;
      }
    }
    if (!this.canSpeak) this.stop();
  }

  say(text: string, priority = false, done?: () => void) {
    if (!this.canSpeak || !text.trim()) return done?.();
    const q = priority ? this.priority : this.normal;
    q.push({ text: text.trim(), at: Date.now(), done });
    if (q.length > MAX_QUEUE) q.shift()?.done?.();
    void this.next();
  }

  private daTao = new Set<string>();
  private prefetchQueue: string[] = [];
  private prefetching = false;
  prefetch(text: string) {
    const t = text.trim();
    if (!this.canSpeak || !t || this.daTao.has(t)) return;
    this.daTao.add(t);
    if (this.daTao.size > 300) this.daTao.clear();
    this.prefetchQueue.unshift(t);
    void this.runPrefetch();
  }

  private async runPrefetch() {
    if (this.prefetching || this.fetchingActive) return;
    this.prefetching = true;
    try {
      while (this.prefetchQueue.length > 0 && !this.fetchingActive) {
        const t = this.prefetchQueue.shift()!;
        try {
          const r = await fetch(`/api/tts?prefetch=1&rate=${this.rate}&text=${encodeURIComponent(t)}`);
          await r.arrayBuffer();
        } catch {
          this.daTao.delete(t);
        }
      }
    } finally {
      this.prefetching = false;
    }
  }

  clearPrefetch() {
    this.daTao.clear();
  }

  stop() {
    [...this.normal, ...this.priority].forEach((l) => l.done?.());
    this.normal = [];
    this.priority = [];
    try {
      this.abortCtrl?.abort();
      this.currentBooster?.disconnect();
      this.current?.pause();
      if (this.current) this.current.src = '';
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }
    } catch {}
    this.abortCtrl = null;
    this.fetchingActive = false;
    this.currentBooster = null;
    this.current = null;
    this.playing = false;
    this.onSpeakingChange?.(false);
  }

  get busy() {
    return this.playing || this.fetchingActive || this.normal.length + this.priority.length > 0;
  }

  quietForMs(now = Date.now()) {
    return this.busy ? 0 : now - this.lastSpokeAt;
  }

  private async next() {
    if (this.playing || !this.canSpeak) return;
    const now = Date.now();
    let line: Line | undefined;
    while ((line = this.priority.shift() ?? this.normal.shift())) {
      if (now - line.at < MAX_WAIT_MS) break;
      line.done?.();
    }
    if (!line) {
      this.onSpeakingChange?.(false);
      return;
    }
    this.playing = true;
    this.fetchingActive = true;
    const ctrl = new AbortController();
    this.abortCtrl = ctrl;
    this.onSpeakingChange?.(true); // Pre-duck nhạc nền 95% trước khi câu đầu tiên vang lên
    let blobUrl: string | null = null;
    try {
      // Tải trọn vẹn file âm thanh vào bộ nhớ Blob trước khi phát để:
      // 1) Gửi HTTP request ngay lập tức (không bị prefetch tranh worker)
      // 2) Triệt tiêu 100% lỗi hụt buffer giữa các vế câu làm ngắt tiếng nửa chừng
      const r = await fetch(`/api/tts?rate=${this.rate}&text=${encodeURIComponent(line.text)}`, {
        signal: ctrl.signal,
      });
      this.fetchingActive = false;
      void this.runPrefetch();
      if (!r.ok || ctrl.signal.aborted) return;
      const blob = await r.blob();
      if (ctrl.signal.aborted || blob.size === 0) return;

      blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;
      const audio = new Audio(blobUrl);
      const booster = this.boostProvider?.(audio, this.volume) ?? null;
      this.currentBooster = booster;
      audio.volume = booster ? (this.volume === 0 ? 0 : 1) : this.volume;
      this.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch((e) => {
          if (e?.name === 'NotAllowedError') this.onBlocked?.();
          resolve();
        });
      });
    } catch {
      // Request bị hủy bởi stop() hoặc lỗi mạng
    } finally {
      this.fetchingActive = false;
      if (this.abortCtrl === ctrl) this.abortCtrl = null;
      this.currentBooster?.disconnect();
      this.currentBooster = null;
      if (blobUrl) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {}
        if (this.currentBlobUrl === blobUrl) this.currentBlobUrl = null;
      }
      line.done?.();
      this.current = null;
      this.playing = false;
      this.lastSpokeAt = Date.now();
      if (this.priority.length + this.normal.length > 0 && this.canSpeak) {
        void this.next();
      } else {
        this.onSpeakingChange?.(false);
        void this.runPrefetch();
      }
    }
  }
}

export const voice = new Voice();
export { speakableName } from './names';
