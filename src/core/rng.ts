export class Rng {
  s;
  constructor(seed) {
    this.s = seed >>> 0 || 2654435769;
  }
  next() {
    let t = this.s = this.s + 1831565813 >>> 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(lo, hi) {
    return lo + (hi - lo) * this.next();
  }
  sym(m2) {
    return (this.next() * 2 - 1) * m2;
  }
  int(lo, hiInclusive) {
    return lo + Math.floor(this.next() * (hiInclusive - lo + 1));
  }
  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }
};
export const visualRng = new Rng(12648430);
