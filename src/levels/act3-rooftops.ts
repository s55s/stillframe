import { LevelBuilder, level } from './level-builder';

export function roof(b: LevelBuilder, x0: number, z0: number, x1: number, z1: number, gaps: [side: string, a0: number, a1: number][] = []) {
  b.floor(x0, z0, x1, z1, 0, "floor");
  b.box(x0, -6, z0, x1, -0.4, z1, "wall");
  const h = 1;
  const t = 0.3;
  const along = (side, a0, a1) => {
    const g = gaps.filter((q) => q[0] === side).map((q) => [q[1], q[2]]).sort((p, q) => p[0] - q[0]);
    let cur = a0;
    const seg = (a, c) => {
      if (c - a < 0.05)
        return;
      if (side === "n")
        b.rail(a, z0, c, z0 + t, 0, h, "trim");
      if (side === "s")
        b.rail(a, z1 - t, c, z1, 0, h, "trim");
      if (side === "w")
        b.rail(x0, a, x0 + t, c, 0, h, "trim");
      if (side === "e")
        b.rail(x1 - t, a, x1, c, 0, h, "trim");
    };
    for (const [g0, g1] of g) {
      seg(cur, g0);
      cur = Math.max(cur, g1);
    }
    seg(cur, a1);
  };
  along("n", x0, x1);
  along("s", x0, x1);
  along("w", z0 + t, z1 - t);
  along("e", z0 + t, z1 - t);
}
export function acUnit(b, x, z, w = 2, d = 1.4) {
  b.crate(x, z, w, 1.5, d, 0, "metal");
  b.crate(x, z, w * 0.6, 0.12, d * 0.6, 1.5, "dark");
}
export function skyline(b, cx, cz, r) {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.3;
    const d = r + i % 3 * 9;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    const h = 12 + i * 7 % 5 * 6;
    b.box(x - 4, -40, z - 4, x + 4, h, z + 4, "dark", false);
    for (let y = -10; y < h - 2; y += 5)
      b.box(x - 4.05, y, z - 2, x + 4.05, y + 1.2, z + 2, i % 2 ? "accent" : "window", false);
  }
}
export const ledge = level({
  id: "3-1",
  name: "LEDGE",
  act: 3,
  theme: "rooftop",
  words: ["MIND", "THE", "EDGE."],
  seed: 301,
  player: { pos: [0, 0, 10], yaw: 0, item: "pistol" },
  props: [
    { kind: "brick", pos: [-2, 0.1, 9] },
    { kind: "bottle", pos: [3, 0.1, 8] }
  ],
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "marksman", pos: [0, 2.2, -10] },
        { kind: "walker", pos: [-8, -6] },
        { kind: "walker", pos: [8, -6] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.5, spawns: [{ kind: "rusher", pos: [-10, -10] }, { kind: "rusher", pos: [10, -10] }] },
    { when: { type: "remaining", count: 0 }, delay: 0.5, spawns: [{ kind: "marksman", pos: [-2.5, 2.2, -10.5] }, { kind: "walker", pos: [9, -10], weapon: "scatter" }] }
  ]
}, (b) => {
  roof(b, -12, -12, 12, 12);
  b.box(-4, 0, -12, 4, 2.2, -8, "wall");
  b.stairsX(-11, -9, 8, 8, 0.275, 0.5, -1);
  b.rail(-4, -8.15, 4, -7.95, 2.2, 0.9, "metal");
  acUnit(b, -6, 2);
  acUnit(b, 6, 0);
  acUnit(b, -2, -4, 1.4, 2);
  acUnit(b, 7, 7, 1.4, 1.4);
  b.pillar(-9, 7, 0.4, 3.5, "metal");
  b.strip(-9.3, 3.5, 6.7, -8.7, 3.6, 7.3, "accent");
  skyline(b, 0, 0, 45);
});
export const skylight = level({
  id: "3-2",
  name: "SKYLIGHT",
  act: 3,
  theme: "rooftop",
  words: ["LOOK", "UP."],
  seed: 302,
  player: { pos: [0, 0, 12], yaw: 0 },
  props: [
    { kind: "pistol", pos: [2, 0.1, 10] },
    { kind: "brick", pos: [-2, 0.1, 11] },
    { kind: "bottle", pos: [-5, 0.1, 7] }
  ],
  maxActive: 6,
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-6, -6] },
        { kind: "walker", pos: [6, -6], weapon: "carbine" },
        { kind: "marksman", pos: [-9, 3, -9] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.5, spawns: [{ kind: "rusher", pos: [12, -12] }, { kind: "rusher", pos: [-12, 12] }] },
    { when: { type: "remaining", count: 0 }, delay: 0.5, spawns: [{ kind: "walker", pos: [0, -12], weapon: "scatter" }, { kind: "marksman", pos: [9, 3, 9] }] }
  ]
}, (b) => {
  roof(b, -14, -14, 14, 14);
  for (let gx = -4.5; gx <= 4.5; gx += 3) {
    for (let gz = -4.5; gz <= 4.5; gz += 3) {
      b.box(gx - 1.3, 0, gz - 1.3, gx + 1.3, 0.35, gz + 1.3, "window");
      b.box(gx - 1.4, 0, gz - 1.4, gx + 1.4, 0.55, gz - 1.25, "metal");
      b.box(gx - 1.4, 0, gz + 1.25, gx + 1.4, 0.55, gz + 1.4, "metal");
    }
  }
  b.box(-11, 0, -11, -7, 3, -7, "wall");
  b.box(7, 0, 7, 11, 3, 11, "wall");
  b.strip(-9.6, 1, -6.95, -8.4, 2.6, -6.9, "accent");
  b.strip(8.4, 1, 6.9, 9.6, 2.6, 6.95, "accent");
  acUnit(b, 8, -8);
  acUnit(b, -8, 8);
  skyline(b, 0, 0, 48);
});
export const crane = level({
  id: "3-3",
  name: "CROSSING",
  act: 3,
  theme: "rooftop",
  words: ["CROSS", "OVER."],
  seed: 303,
  player: { pos: [0, 0, 14], yaw: 0, item: "pistol" },
  props: [
    { kind: "bottle", pos: [-3, 0.1, 12] },
    { kind: "brick", pos: [3, 0.1, 12] },
    { kind: "bottle", pos: [5, 0.1, 9] }
  ],
  exit: { rect: [-3, -20, 3, -18.4], requiresClear: false },
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-4, -12] },
        { kind: "walker", pos: [4, -12] },
        { kind: "marksman", pos: [0, -17] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.4, spawns: [{ kind: "rusher", pos: [-6, -18] }, { kind: "rusher", pos: [6, -18] }] },
    { when: { type: "zone", rect: [-1, -8, 1, 4] }, spawns: [{ kind: "walker", pos: [-5, -16], weapon: "carbine" }, { kind: "walker", pos: [5, -16], weapon: "scatter" }] }
  ]
}, (b) => {
  roof(b, -8, 4, 8, 16, [["n", -0.6, 0.6]]);
  roof(b, -8, -20, 8, -8, [["s", -0.6, 0.6]]);
  b.box(-0.6, -0.5, -8, 0.6, 0, 4, "metal");
  b.box(-0.65, -1.2, -8, 0.65, -0.5, 4, "dark");
  acUnit(b, -4, 9);
  acUnit(b, 4, 7);
  acUnit(b, -4, -12, 2, 1.4);
  acUnit(b, 4, -13, 1.4, 2);
  b.crate(0, -14, 3, 1.1, 0.6, 0, "light");
  b.strip(-3, 4e-3, -20, 3, 0.012, -18.4, "accent");
  b.strip(-0.1, 5e-3, -8, 0.1, 0.012, 4, "accent");
  skyline(b, 0, -2, 46);
});
export const helipad = level({
  id: "3-4",
  name: "HELIPAD",
  act: 3,
  theme: "rooftop",
  words: ["HOLD", "THE", "LINE."],
  seed: 304,
  player: { pos: [0, 1.2, 0], yaw: 0, item: "carbine" },
  props: [
    { kind: "pistol", pos: [3, 1.3, 3] },
    { kind: "brick", pos: [-3, 1.3, -3] },
    { kind: "brick", pos: [-3, 1.3, 3] }
  ],
  maxActive: 6,
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-11, -11] },
        { kind: "walker", pos: [11, -11] },
        { kind: "walker", pos: [-11, 11] },
        { kind: "walker", pos: [11, 11] }
      ]
    },
    {
      when: { type: "remaining", count: 1 },
      delay: 0.5,
      spawns: [
        { kind: "rusher", pos: [0, -12] },
        { kind: "rusher", pos: [12, 0] },
        { kind: "rusher", pos: [0, 12] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.5, spawns: [{ kind: "marksman", pos: [-12, 3, -12] }, { kind: "marksman", pos: [12, 3, 12] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.5,
      spawns: [
        { kind: "walker", pos: [-12, 0], weapon: "scatter" },
        { kind: "walker", pos: [12, 0], weapon: "scatter" },
        { kind: "rusher", pos: [0, -12] },
        { kind: "rusher", pos: [0, 12] }
      ]
    }
  ]
}, (b) => {
  roof(b, -14, -14, 14, 14);
  b.box(-6, 0, -6, 6, 1.2, 6, "trim");
  b.strip(-4, 1.204, -0.25, 4, 1.212, 0.25, "accent");
  b.strip(-0.25, 1.204, -4, 0.25, 1.212, 4, "accent");
  b.stairsZ(-1.5, 1.5, 10, 4, 0.3, 1, -1);
  b.stairsZ(-1.5, 1.5, -10, 4, 0.3, 1, 1);
  b.stairsX(-1.5, 1.5, 10, 4, 0.3, 1, -1);
  b.stairsX(-1.5, 1.5, -10, 4, 0.3, 1, 1);
  for (const [x, z] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    b.box(x - 1.5, 0, z - 1.5, x + 1.5, 3, z + 1.5, "wall");
  }
  acUnit(b, -9, 0, 1.4, 2);
  acUnit(b, 9, 0, 1.4, 2);
  acUnit(b, 0, -9, 2, 1.4);
  acUnit(b, 0, 9, 2, 1.4);
  skyline(b, 0, 0, 46);
});
export const spire = level({
  id: "3-5",
  name: "SPIRE",
  act: 3,
  theme: "rooftop",
  words: ["STILL.", "FRAME."],
  seed: 305,
  player: { pos: [0, 0, 13], yaw: 0 },
  props: [
    { kind: "pistol", pos: [2, 0.1, 11] },
    { kind: "scatter", pos: [-12, 0.1, 6] },
    { kind: "blade", pos: [12, 0.1, 6] },
    { kind: "brick", pos: [-2, 0.1, 11] },
    { kind: "bottle", pos: [5, 0.1, 9] },
    { kind: "bottle", pos: [-5, 0.1, 9] }
  ],
  maxActive: 7,
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-8, -8] },
        { kind: "walker", pos: [8, -8] },
        { kind: "rusher", pos: [0, -13] }
      ]
    },
    {
      when: { type: "remaining", count: 1 },
      delay: 0.5,
      spawns: [
        { kind: "marksman", pos: [-12, 2.4, -1] },
        { kind: "marksman", pos: [12, 2.4, -1] },
        { kind: "rusher", pos: [-13, -13] }
      ]
    },
    {
      when: { type: "remaining", count: 1 },
      delay: 0.5,
      spawns: [
        { kind: "walker", pos: [-13, 13], weapon: "carbine" },
        { kind: "walker", pos: [13, 13], weapon: "scatter" },
        { kind: "rusher", pos: [13, -13] },
        { kind: "rusher", pos: [0, -14] }
      ]
    },
    {
      when: { type: "remaining", count: 1 },
      delay: 0.5,
      spawns: [
        { kind: "rusher", pos: [-14, 0] },
        { kind: "rusher", pos: [14, 0] },
        { kind: "walker", pos: [-6, -14], weapon: "carbine" },
        { kind: "walker", pos: [6, -14], weapon: "carbine" }
      ]
    },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.8,
      spawns: [
        { kind: "marksman", pos: [0, -14] },
        { kind: "walker", pos: [-10, -14], weapon: "scatter" },
        { kind: "walker", pos: [10, -14], weapon: "scatter" },
        { kind: "rusher", pos: [-14, -6] },
        { kind: "rusher", pos: [14, -6] }
      ]
    }
  ]
}, (b) => {
  roof(b, -16, -16, 16, 16);
  b.box(-2, 0, -2, 2, 14, 2, "dark");
  b.box(-1.2, 14, -1.2, 1.2, 22, 1.2, "metal");
  b.strip(-2.05, 2, -0.2, -2, 13, 0.2, "accent");
  b.strip(2, 2, -0.2, 2.05, 13, 0.2, "accent");
  b.strip(-0.2, 2, 2, 0.2, 13, 2.05, "accent");
  b.strip(-0.2, 2, -2.05, 0.2, 13, -2, "accent");
  b.box(-15.7, 0, -4, -10, 2.4, 2, "wall");
  b.box(10, 0, -4, 15.7, 2.4, 2, "wall");
  b.stairsX(2.5, 4.5, -6, 8, 0.3, 0.5, -1);
  b.stairsX(2.5, 4.5, 6, 8, 0.3, 0.5, 1);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * 7;
    const z = Math.sin(a) * 7;
    b.crate(x, z, 1.6, 1.15, 1.6, 0, i % 2 ? "light" : "metal");
  }
  acUnit(b, -10, 10);
  acUnit(b, 10, 10);
  acUnit(b, -9, -11, 1.4, 2);
  acUnit(b, 9, -11, 1.4, 2);
  skyline(b, 0, 0, 52);
});
export const ACT3 = [ledge, skylight, crane, helipad, spire];
