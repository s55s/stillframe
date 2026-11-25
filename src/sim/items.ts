export const BULLET_SPEED = 25;
export const BULLET_RADIUS = 0.03;
export const BULLET_LIFE = 5;
export const WEAPONS = {
  pistol: { kind: "pistol", ammo: 6, cooldown: 0.4, pellets: 1, spread: 0, burst: 1, burstInterval: 0, melee: false, muzzle: [0, 0.03, -0.14] },
  scatter: { kind: "scatter", ammo: 3, cooldown: 0.9, pellets: 5, spread: 5, burst: 1, burstInterval: 0, melee: false, muzzle: [0, 0.02, -0.5] },
  carbine: { kind: "carbine", ammo: 12, cooldown: 0.55, pellets: 1, spread: 0.6, burst: 3, burstInterval: 0.09, melee: false, muzzle: [0, 0.03, -0.42] },
  blade: { kind: "blade", ammo: 0, cooldown: 0.45, pellets: 0, spread: 0, burst: 0, burstInterval: 0, melee: true, muzzle: [0, 0, -0.6] }
};
export const isWeapon = (k) => k in WEAPONS;
export const isGun = (k) => isWeapon(k) && !WEAPONS[k].melee;
export function newItem(kind) {
  return { kind, ammo: isWeapon(kind) ? WEAPONS[kind].ammo : 0 };
}
export const ITEM_NAMES = {
  pistol: "PISTOL",
  scatter: "SCATTER",
  carbine: "CARBINE",
  blade: "BLADE",
  bottle: "BOTTLE",
  brick: "BRICK",
  mug: "MUG"
};
export const ITEM_RADIUS = {
  pistol: 0.1,
  scatter: 0.14,
  carbine: 0.13,
  blade: 0.12,
  bottle: 0.1,
  brick: 0.09,
  mug: 0.08
};
export const FRAGILE = { bottle: true, mug: true };
