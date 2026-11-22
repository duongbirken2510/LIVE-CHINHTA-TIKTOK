/**
 * Âm thanh ngũ cung Việt Nam tự tổng hợp bằng Web Audio (0% rủi ro bản quyền):
 * - Trống hội mở vòng, đàn tranh rải mở câu, chuông ngọc chọn đúng, tiếng khóa chọn sai, mõ 5 giây cuối, chiêng công bố, pháo hoa đăng quang
 * - Tự động hạ 95% nhạc nền + tắt tiếng gảy nhỏ khi MC nói để giọng MC (khuếch đại 1.55x) nổi rõ tuyệt đối
 */
class SfxEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;

  masterEnabled = true;
  musicEnabled = true;
  sfxVolume = 0.45;
  musicVolume = 0.16;
  private ducking = false;
  private canOutput = false;

  setCanOutput(ok: boolean) {
    this.canOutput = ok;
    if (!ok) {
      this.stopMusic();
    } else if (this.masterEnabled) {
      this.resume();
    }
  }

  applyConfig(cfg: { masterEnabled?: boolean; musicEnabled?: boolean; musicVolume?: number; sfxVolume?: number }) {
    const clamp = (v: unknown, fb: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fb;
    };
    if (cfg.masterEnabled !== undefined) this.masterEnabled = Boolean(cfg.masterEnabled);
    if (cfg.musicEnabled !== undefined) this.musicEnabled = Boolean(cfg.musicEnabled);
    if (cfg.musicVolume !== undefined) this.musicVolume = clamp(cfg.musicVolume, 0.16);
    if (cfg.sfxVolume !== undefined) this.sfxVolume = clamp(cfg.sfxVolume, 0.45);

    this.syncGains();
    if (!this.masterEnabled || !this.musicEnabled || !this.canOutput) {
      this.stopMusic();
    } else if (this.ctx && this.ctx.state === 'running') {
      this.startMusic();
    }
  }

  setDucking(speaking: boolean) {
    this.ducking = speaking;
    this.syncGains(speaking ? 0.04 : 0.25);
  }

  private syncGains(tau = 0.04) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const targetSfx = this.masterEnabled && this.canOutput ? this.sfxVolume * (this.ducking ? 0.15 : 1) : 0;
    const targetMusic = this.masterEnabled && this.musicEnabled && this.canOutput ? this.musicVolume * (this.ducking ? 0.05 : 1) : 0;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(targetSfx, t, tau);
    }
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setTargetAtTime(targetMusic, t, tau);
    }
  }

  resume() {
    if (!this.canOutput || !this.masterEnabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.sfxVolume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.syncGains();
      if (this.musicEnabled) this.startMusic();
    } catch {}
  }

  boostVoiceElement(audioEl: HTMLAudioElement, vol: number) {
    this.resume();
    if (!this.ctx || this.ctx.state === 'suspended') return null;
    try {
      const src = this.ctx.createMediaElementSource(audioEl);
      const g = this.ctx.createGain();
      const calc = (v: number) => Math.max(0, Math.min(2, (Number.isFinite(v) ? v : 1) * 1.55));
      g.gain.value = calc(vol);
      src.connect(g).connect(this.ctx.destination);
      return {
        setVolume: (v: number) => {
          if (!this.ctx) return;
          g.gain.cancelScheduledValues(this.ctx.currentTime);
          g.gain.setTargetAtTime(calc(v), this.ctx.currentTime, 0.02);
        },
        disconnect: () => {
          try {
            src.disconnect();
            g.disconnect();
          } catch {}
        },
      };
    } catch {
      return null;
    }
  }

  private startMusic() {
    if (!this.ctx || !this.musicGain || this.musicSource || !this.musicEnabled || !this.masterEnabled || !this.canOutput) return;
    if (!this.musicBuffer) this.musicBuffer = this.composePentatonicLoop(this.ctx);
    const src = this.ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = true;
    src.connect(this.musicGain);
    src.start();
    this.musicSource = src;
  }

  private stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch {}
      this.musicSource.disconnect();
      this.musicSource = null;
    }
  }

  private tone(freq: number, delay: number, dur: number, level: number, type: OscillatorType = 'triangle', endFreq = freq) {
    if (!this.ctx || !this.masterGain || !this.masterEnabled || !this.canOutput || this.sfxVolume <= 0) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  play(kind: 'drum' | 'reveal' | 'solve' | 'wrong' | 'tick' | 'gong' | 'fanfare' | 'boost') {
    if (!this.canOutput || !this.masterEnabled) return;
    this.resume();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    if (this.ducking && (kind === 'tick' || kind === 'solve' || kind === 'wrong')) return;

    switch (kind) {
      case 'drum':
        this.tone(135, 0, 0.24, 0.22, 'sine', 58);
        this.tone(145, 0.16, 0.28, 0.25, 'sine', 55);
        break;
      case 'reveal':
        [587, 659, 784, 880, 1175].forEach((f, i) => this.tone(f, i * 0.055, 0.26, 0.075, 'triangle'));
        break;
      case 'solve':
        this.tone(880, 0, 0.14, 0.07, 'triangle');
        this.tone(1175, 0.06, 0.18, 0.07, 'triangle');
        break;
      case 'wrong':
        this.tone(240, 0, 0.14, 0.05, 'sawtooth', 170);
        break;
      case 'tick':
        this.tone(740, 0, 0.06, 0.05, 'sine', 520);
        break;
      case 'gong':
        this.tone(220, 0, 0.85, 0.18, 'sine', 216);
        this.tone(440, 0, 0.55, 0.08, 'triangle', 436);
        break;
      case 'boost':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, i * 0.06, 0.22, 0.09, 'sine'));
        break;
      case 'fanfare':
        [587, 784, 880, 1175, 1318, 1568].forEach((f, i) => this.tone(f, i * 0.09, 0.42, 0.1, 'triangle'));
        break;
    }
  }

  private composePentatonicLoop(ctx: AudioContext): AudioBuffer {
    const rate = 22050;
    const beat = 60 / 88;
    const bars = 16;
    const length = Math.round(bars * 4 * beat * rate);
    const buf = ctx.createBuffer(2, length, rate);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    const freq = (m: number) => 440 * 2 ** ((m - 69) / 12);

    const pluck = (midi: number, start: number, dur: number, amp: number, pan = 0) => {
      const f = freq(midi);
      const off = Math.round(start * rate);
      const n = Math.round(dur * rate);
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const p = t * f * Math.PI * 2;
        const env = Math.min(1, t / 0.008) * Math.exp(-t * 4.2) * Math.min(1, (dur - t) / 0.06);
        const w = (Math.sin(p) * 0.76 + Math.sin(p * 2) * Math.exp(-t * 9) * 0.2 + Math.sin(p * 3) * 0.06) * env * amp;
        const idx = (off + i) % length;
        L[idx] += w * (1 - pan * 0.45);
        R[idx] += w * (1 + pan * 0.45);
      }
    };

    // Ngũ cung Việt Nam (D - F - G - A - C) êm dịu kiểu Đàn Tranh thư phòng
    const roots = [50, 45, 48, 43];
    const phrases = [
      [74, 77, 0, 79, 81, 0, 79, 77],
      [74, 0, 72, 69, 72, 74, 0, 0],
      [77, 79, 81, 0, 84, 81, 79, 0],
      [77, 74, 0, 72, 69, 72, 74, 0],
    ];
    for (let bar = 0; bar < bars; bar++) {
      const s = bar * 4 * beat;
      const root = roots[bar % 4];
      pluck(root, s, beat * 1.8, 0.09, -0.1);
      pluck(root + 7, s + 2 * beat, beat * 1.6, 0.07, 0.1);
      const mel = phrases[bar % 4];
      for (let step = 0; step < 8; step++) {
        const m = mel[step];
        if (m) pluck(m, s + step * 0.5 * beat, beat * 0.95, 0.085, Math.sin(step) * 0.35);
      }
    }
    return buf;
  }
}

export const sfx = new SfxEngine();
