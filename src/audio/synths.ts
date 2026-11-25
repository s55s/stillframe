export function make(sr, seconds, fn) {
  const n = Math.max(1, Math.floor(sr * seconds));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++)
    out[i] = fn(i / sr, i);
  return out;
}
export function noise() {
  return Math.random() * 2 - 1;
}
export function lowpass(buf, sr, cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / sr);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y = (1 - a) * buf[i] + a * y;
    buf[i] = y;
  }
  return buf;
}
export function highpass(buf, sr, cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / sr);
  let lp = 0;
  for (let i = 0; i < buf.length; i++) {
    lp = (1 - a) * buf[i] + a * lp;
    buf[i] = buf[i] - lp;
  }
  return buf;
}
export function normalizeBuf(buf, peak = 0.9) {
  let m2 = 0;
  for (let i = 0; i < buf.length; i++)
    m2 = Math.max(m2, Math.abs(buf[i]));
  if (m2 > 0)
    for (let i = 0; i < buf.length; i++)
      buf[i] = buf[i] / m2 * peak;
  return buf;
}
export function mix(...bufs) {
  const n = Math.max(...bufs.map((b) => b.length));
  const out = new Float32Array(n);
  for (const b of bufs)
    for (let i = 0; i < b.length; i++)
      out[i] += b[i];
  return out;
}
export function gunshot(sr, body, decay, cutoff, peak) {
  const crack = make(sr, 0.5, (t) => noise() * Math.exp(-t * decay));
  lowpass(crack, sr, cutoff);
  const thump = make(sr, 0.4, (t) => Math.sin(2 * Math.PI * (body + 120 * Math.exp(-t * 40)) * t) * Math.exp(-t * 18) * 0.8);
  return normalizeBuf(mix(crack, thump), peak);
}
export const SYNTHS = {
  pistol: (sr) => gunshot(sr, 70, 22, 3500, 0.9),
  scatter: (sr) => gunshot(sr, 50, 12, 2200, 1),
  carbine: (sr) => gunshot(sr, 80, 30, 4500, 0.8),
  enemyShot: (sr) => gunshot(sr, 60, 20, 2600, 0.7),
  shatter: (sr) => {
    const crash = highpass(make(sr, 1, (t) => noise() * Math.exp(-t * 6)), sr, 1800);
    const tinkles = make(sr, 1.2, (t) => {
      let v = 0;
      for (let k = 0; k < 7; k++) {
        const start = k * 0.07 + k * 37 % 11 * 0.01;
        if (t < start)
          continue;
        const tt = t - start;
        v += Math.sin(2 * Math.PI * (2400 + k * 530) * tt) * Math.exp(-tt * 18) * 0.4;
      }
      return v;
    });
    return normalizeBuf(mix(crash, tinkles), 0.95);
  },
  glassBreak: (sr) => {
    const crash = highpass(make(sr, 0.5, (t) => noise() * Math.exp(-t * 12)), sr, 2500);
    const ping = make(sr, 0.5, (t) => Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t * 20) * 0.5);
    return normalizeBuf(mix(crash, ping), 0.7);
  },
  punch: (sr) => {
    const body = make(sr, 0.25, (t) => Math.sin(2 * Math.PI * (60 + 140 * Math.exp(-t * 35)) * t) * Math.exp(-t * 20));
    const slap = lowpass(make(sr, 0.1, (t) => noise() * Math.exp(-t * 60)), sr, 2500);
    return normalizeBuf(mix(body, slap), 0.9);
  },
  punchMiss: (sr) => normalizeBuf(lowpass(make(sr, 0.25, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.25)) * 0.6), sr, 900), 0.35),
  whoosh: (sr) => normalizeBuf(lowpass(make(sr, 0.35, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.35))), sr, 1400), 0.5),
  impact: (sr) => {
    const click = lowpass(make(sr, 0.12, (t) => noise() * Math.exp(-t * 50)), sr, 5e3);
    const ring = make(sr, 0.2, (t) => Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 35) * 0.3);
    return normalizeBuf(mix(click, ring), 0.6);
  },
  propImpact: (sr) => normalizeBuf(lowpass(make(sr, 0.15, (t) => noise() * Math.exp(-t * 40)), sr, 1200), 0.5),
  pickup: (sr) => normalizeBuf(make(sr, 0.12, (t) => Math.sin(2 * Math.PI * (900 + t * 3e3) * t) * Math.exp(-t * 30) + noise() * 0.1 * Math.exp(-t * 80)), 0.4),
  dryFire: (sr) => normalizeBuf(highpass(make(sr, 0.05, (t) => noise() * Math.exp(-t * 120)), sr, 3e3), 0.4),
  clash: (sr) => {
    const ping = make(sr, 0.6, (t) => (Math.sin(2 * Math.PI * 2600 * t) + Math.sin(2 * Math.PI * 3900 * t) * 0.5) * Math.exp(-t * 9));
    return normalizeBuf(ping, 0.6);
  },
  slice: (sr) => normalizeBuf(highpass(make(sr, 0.3, (t) => noise() * Math.exp(-t * 14) + Math.sin(2 * Math.PI * 4200 * t) * Math.exp(-t * 25) * 0.6), sr, 2e3), 0.6),
  death: (sr) => {
    const low = make(sr, 1.4, (t) => Math.sin(2 * Math.PI * (90 * Math.exp(-t * 2)) * t) * Math.exp(-t * 2.5));
    const crash = highpass(make(sr, 1, (t) => noise() * Math.exp(-t * 5)), sr, 1200);
    return normalizeBuf(mix(low, crash), 0.9);
  },
  spawn: (sr) => normalizeBuf(make(sr, 0.7, (t) => Math.sin(2 * Math.PI * (300 + 900 * t) * t) * Math.sin(Math.PI * Math.min(1, t / 0.7)) * 0.5 + noise() * 0.05 * Math.exp(-t * 4)), 0.4),
  ui: (sr) => normalizeBuf(make(sr, 0.06, (t) => Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 60)), 0.3),
  clear: (sr) => normalizeBuf(make(sr, 1.2, (t) => [220, 277.18, 329.63, 440].reduce((a, f, k) => a + Math.sin(2 * Math.PI * f * t) * Math.exp(-Math.max(0, t - k * 0.06) * 3) * (t > k * 0.06 ? 1 : 0), 0)), 0.5),
  charge: (sr) => normalizeBuf(make(sr, 0.6, (t) => Math.sin(2 * Math.PI * (600 + 1600 * t) * t) * (t / 0.6) * 0.5), 0.3),
  melee: (sr) => normalizeBuf(lowpass(make(sr, 0.3, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.3))), sr, 700), 0.5)
};
