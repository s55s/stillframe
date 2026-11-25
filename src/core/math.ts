export const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
export function set(o, x, y, z) {
  o[0] = x;
  o[1] = y;
  o[2] = z;
  return o;
}
export function copy(o, a) {
  o[0] = a[0];
  o[1] = a[1];
  o[2] = a[2];
  return o;
}
export function scale(o, a, s) {
  o[0] = a[0] * s;
  o[1] = a[1] * s;
  o[2] = a[2] * s;
  return o;
}
export function lerp(o, a, b, t) {
  o[0] = a[0] + (b[0] - a[0]) * t;
  o[1] = a[1] + (b[1] - a[1]) * t;
  o[2] = a[2] + (b[2] - a[2]) * t;
  return o;
}
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const lenSq = (a) => a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
export const len = (a) => Math.sqrt(lenSq(a));
export function distSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
export function distXZ(a, b) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}
export function normalize(o, a) {
  const l = len(a);
  if (l < 1e-9)
    return set(o, 0, 0, 0);
  return scale(o, a, 1 / l);
}
export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;
export const lerpN = (a, b, t) => a + (b - a) * t;
export function approach(current, target, tau, dt) {
  if (tau <= 0)
    return target;
  return target + (current - target) * Math.exp(-dt / tau);
}
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI)
    d -= Math.PI * 2;
  if (d < -Math.PI)
    d += Math.PI * 2;
  return d;
}
export function lerpAngle(a, b, t) {
  return a + angleDiff(b, a) * t;
}
export function turnToward(a, b, maxStep) {
  const d = angleDiff(b, a);
  if (Math.abs(d) <= maxStep)
    return b;
  return a + Math.sign(d) * maxStep;
}
export function yawOf(dx, dz) {
  return Math.atan2(-dx, -dz);
}
export function dirFromYawPitch(o, yaw, pitch) {
  const cp = Math.cos(pitch);
  return set(o, -Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}
