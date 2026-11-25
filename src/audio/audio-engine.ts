import { SYNTHS } from './synths';

export interface PlayOptions {
  /** Play at normal speed regardless of the world time scale (UI, death, clear stingers). */
  ignoreTime?: boolean;
  pitch?: number;
  volume?: number;
  /** World position for distance attenuation and panning; omit for non-positional sounds. */
  pos?: number[];
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfxBus: GainNode | null = null;
  musicBus: GainNode | null = null;
  musicFilter: BiquadFilterNode | null = null;
  droneGain: GainNode | null = null;
  buffers = new Map();
  timeScale = 1;
  listener = { x: 0, y: 0, z: 0, yaw: 0 };
  volumes = { master: 0.8, sfx: 1, music: 0.5 };
  musicStarted = false;
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (err) {
        console.warn("[audio] AudioContext unavailable:", err);
        return;
      }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = "lowpass";
      this.musicFilter.frequency.value = 2e3;
      this.musicBus = ctx.createGain();
      this.musicFilter.connect(this.musicBus);
      this.musicBus.connect(this.master);
      this.applyVolumes();
      this.synthesizeAll();
      this.startMusic();
    }
    if (this.ctx.state === "suspended")
      void this.ctx.resume();
  }
  setVolumes(master, sfx, music) {
    this.volumes = { master, sfx, music };
    this.applyVolumes();
  }
  setListener(l) {
    this.listener = l;
  }
  setTimeScale(ts) {
    this.timeScale = ts;
    const ctx = this.ctx;
    if (!ctx || !this.musicFilter || !this.droneGain)
      return;
    const now = ctx.currentTime;
    this.musicFilter.frequency.setTargetAtTime(180 + 3800 * ts * ts, now, 0.08);
    this.droneGain.gain.setTargetAtTime(ts < 0.1 ? 0.22 : 0, now, 0.25);
  }
  play(name: string, opts: PlayOptions = {}) {
    const ctx = this.ctx;
    const buf = this.buffers.get(name);
    if (!ctx || !buf || !this.sfxBus)
      return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const ts = opts.ignoreTime ? 1 : Math.max(0.25, Math.min(1, this.timeScale));
    src.playbackRate.value = ts * (opts.pitch ?? 1) * (0.94 + Math.random() * 0.12);
    const gain = ctx.createGain();
    let vol = opts.volume ?? 1;
    let pan = 0;
    if (opts.pos) {
      const l = this.listener;
      const dx = opts.pos[0] - l.x;
      const dy = opts.pos[1] - l.y;
      const dz = opts.pos[2] - l.z;
      const d = Math.hypot(dx, dy, dz);
      vol *= 1 / (1 + d * 0.12);
      const rx = Math.cos(l.yaw), rz = -Math.sin(l.yaw);
      pan = d > 0.01 ? Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d)) * 0.8 : 0;
    }
    gain.gain.value = vol;
    src.connect(gain);
    if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      gain.connect(p);
      p.connect(this.sfxBus);
    } else {
      gain.connect(this.sfxBus);
    }
    src.start();
  }
  applyVolumes() {
    if (!this.master || !this.sfxBus || !this.musicBus)
      return;
    this.master.gain.value = this.volumes.master;
    this.sfxBus.gain.value = this.volumes.sfx;
    this.musicBus.gain.value = this.volumes.music * 0.5;
  }
  startMusic() {
    const ctx = this.ctx;
    if (!ctx || !this.musicFilter || this.musicStarted)
      return;
    this.musicStarted = true;
    const now = ctx.currentTime;
    const notes = [55, 82.41, 110, 130.81, 164.81];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? "sawtooth" : "triangle";
      osc.frequency.value = notes[i];
      osc.detune.value = (i - 2) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.013;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      osc.connect(g);
      g.connect(this.musicFilter);
      osc.start(now);
      lfo.start(now);
    }
    const sr = ctx.sampleRate;
    const loopLen = Math.floor(sr * 1.5);
    const loop = ctx.createBuffer(1, loopLen, sr);
    const data = loop.getChannelData(0);
    for (const start of [0, 0.75]) {
      const s0 = Math.floor(start * sr);
      for (let i = 0; i < sr * 0.25 && s0 + i < loopLen; i++) {
        const t = i / sr;
        const f = 50 + 70 * Math.exp(-t * 30);
        data[s0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 14) * 0.5;
      }
    }
    const loopSrc = ctx.createBufferSource();
    loopSrc.buffer = loop;
    loopSrc.loop = true;
    const loopGain = ctx.createGain();
    loopGain.gain.value = 0.35;
    loopSrc.connect(loopGain);
    loopGain.connect(this.musicFilter);
    loopSrc.start(now);
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 41.2;
    const drone2 = ctx.createOscillator();
    drone2.type = "sine";
    drone2.frequency.value = 61.7;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    drone.connect(this.droneGain);
    drone2.connect(this.droneGain);
    if (this.musicBus)
      this.droneGain.connect(this.musicBus);
    drone.start(now);
    drone2.start(now);
  }
  synthesizeAll() {
    const ctx = this.ctx;
    if (!ctx)
      return;
    const sr = ctx.sampleRate;
    for (const [name, fn] of Object.entries(SYNTHS)) {
      const samples = fn(sr);
      const buf = ctx.createBuffer(1, samples.length, sr);
      buf.copyToChannel(samples, 0);
      this.buffers.set(name, buf);
    }
  }
};
