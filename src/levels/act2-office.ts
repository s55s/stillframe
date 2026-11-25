import { level } from './level-builder';

export const lobby = level({
  id: "2-1",
  name: "LOBBY",
  act: 2,
  theme: "office",
  words: ["WELCOME."],
  seed: 201,
  player: { pos: [0, 0, 8], yaw: 0 },
  props: [
    { kind: "mug", pos: [1.5, 1.3, -3.6] },
    { kind: "brick", pos: [-3, 0.1, 6] },
    { kind: "bottle", pos: [6.8, 0.8, 7] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "walker", pos: [0, -6] }, { kind: "walker", pos: [-7, -9], weapon: "scatter" }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.6,
      spawns: [
        { kind: "rusher", pos: [-3, -11] },
        { kind: "rusher", pos: [3, -11] },
        { kind: "walker", pos: [0, -11] }
      ]
    }
  ]
}, (b) => {
  b.room(-10, -12, 10, 10, 6, { ceiling: true, doors: [{ side: "s", at: 0, width: 3, height: 3 }] });
  b.box(-1.5, 0, 10.2, 1.5, 3, 10.6, "window");
  b.crate(0, -4, 6, 1.1, 1.2, 0, "light");
  b.crate(-3.4, -4.9, 0.8, 1.1, 3, 0, "light");
  for (const x of [-6, 6])
    for (const z of [-6, 4])
      b.pillar(x, z, 0.9, 6);
  b.crate(6.8, 7, 1.2, 0.7, 1.2, 0, "dark");
  b.crate(-6.8, 7, 1.2, 0.7, 1.2, 0, "dark");
  for (const x of [-3, 3])
    b.strip(x - 0.9, 0, -11.95, x + 0.9, 2.6, -11.9, "glow");
  b.lights(-6, -9, 6, 7, 5.95, 4);
});
export const elevator = level({
  id: "2-2",
  name: "ELEVATOR",
  act: 2,
  theme: "office",
  words: ["DOORS", "OPEN."],
  seed: 202,
  player: { pos: [0, 0, 1.4], yaw: 0, item: "scatter" },
  props: [
    { kind: "mug", pos: [-4.5, 0.85, -6] },
    { kind: "bottle", pos: [4.5, 0.85, -12] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "walker", pos: [0, -18] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.3,
      spawns: [
        { kind: "rusher", pos: [-5, -8] },
        { kind: "walker", pos: [5, -14] }
      ]
    },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.4,
      spawns: [
        { kind: "walker", pos: [-4, -6], weapon: "scatter" },
        { kind: "rusher", pos: [4, -12] },
        { kind: "rusher", pos: [0, -19] }
      ]
    }
  ]
}, (b) => {
  b.floor(-7.4, -20.4, 7.4, 2.8);
  b.wallZ(-0.1, 2.6, -1.3, 2.6, 0.2, "metal");
  b.wallZ(-0.1, 2.6, 1.3, 2.6, 0.2, "metal");
  b.wallX(-1.4, 1.4, 2.7, 2.6, 0.2, "metal");
  b.ceiling(-1.4, -0.1, 1.4, 2.8, 2.6, "metal");
  b.strip(-0.8, 2.55, 0.8, 0.8, 2.58, 2, "glow");
  b.wallWithDoorsZ(-20, -0.1, -1.75, 3, [{ side: "w", at: -8, width: 1.2, height: 2.2 }], 0.3);
  b.wallWithDoorsZ(-20, -0.1, 1.75, 3, [{ side: "e", at: -14, width: 1.2, height: 2.2 }], 0.3);
  b.wallX(-1.9, 1.9, -20.15, 3, 0.3);
  b.ceiling(-1.9, -20.3, 1.9, 0, 3);
  b.lights(0, -18, 0, -2, 2.95, 4);
  b.wallX(-7.4, -1.6, -12.2, 3, 0.4);
  b.wallX(-7.4, -1.6, -3.8, 3, 0.4);
  b.wallZ(-12.4, -3.6, -7.2, 3, 0.4);
  b.ceiling(-7.4, -12.4, -1.6, -3.6, 3);
  b.crate(-4.5, -6, 2, 0.75, 0.9, 0, "light");
  b.crate(-5, -10, 1.2, 1.4, 0.6, 0, "dark");
  b.wallX(1.6, 7.4, -18.2, 3, 0.4);
  b.wallX(1.6, 7.4, -9.8, 3, 0.4);
  b.wallZ(-18.4, -9.6, 7.2, 3, 0.4);
  b.ceiling(1.6, -18.4, 7.4, -9.6, 3);
  b.crate(4.5, -12, 2, 0.75, 0.9, 0, "light");
  b.crate(5, -16.5, 1.2, 1.4, 0.6, 0, "dark");
});
export const cubicles = level({
  id: "2-3",
  name: "CUBICLES",
  act: 2,
  theme: "office",
  words: ["NINE", "TO", "FIVE."],
  seed: 203,
  player: { pos: [0, 0, 8.5], yaw: 0 },
  props: [
    { kind: "pistol", pos: [1.6, 0.85, 4.8] },
    { kind: "mug", pos: [-6.4, 0.85, 4.6] },
    { kind: "mug", pos: [6.4, 0.85, -1.6] },
    { kind: "bottle", pos: [-1.6, 0.85, -1.4] },
    { kind: "brick", pos: [-3, 0.1, 8] }
  ],
  maxActive: 6,
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "marksman", pos: [-10, -12.5] },
        { kind: "walker", pos: [6, -11] },
        { kind: "walker", pos: [-6, -6] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.5, spawns: [{ kind: "rusher", pos: [10, -13] }, { kind: "rusher", pos: [-10, -13] }] },
    { when: { type: "remaining", count: 0 }, delay: 0.5, spawns: [{ kind: "marksman", pos: [10, -12.5] }, { kind: "walker", pos: [0, -12.5], weapon: "scatter" }] }
  ]
}, (b) => {
  b.room(-12, -14, 12, 10, 3.6, { ceiling: true });
  for (const gx of [-6, 0, 6]) {
    for (const gz of [-7, -1, 5]) {
      b.wallX(gx - 2.3, gx + 2.3, gz, 1.25, 0.1, "trim");
      b.wallZ(gz - 2.3, gz + 2.3, gx, 1.25, 0.1, "trim");
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        b.crate(gx + sx * 1.4, gz + sz * 0.8, 1.4, 0.75, 0.7, 0, "light");
      }
    }
  }
  b.crate(0, -12.8, 6, 1, 0.8, 0, "dark");
  b.box(-12.05, 1, -14, -11.95, 3, 10, "window", false);
  b.lights(-9, -12, 9, 9, 3.55, 3);
});
export const serverRoom = level({
  id: "2-4",
  name: "SERVER ROOM",
  act: 2,
  theme: "office",
  words: ["REACH", "THE", "EXIT."],
  seed: 204,
  player: { pos: [0, 0, 4], yaw: 0, item: "pistol" },
  props: [
    { kind: "pistol", pos: [-4, 0.1, 3] },
    { kind: "brick", pos: [4, 0.1, 3.5] }
  ],
  exit: { rect: [-1.5, -16, 1.5, -14.6], requiresClear: false },
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "rusher", pos: [-4, -14] }, { kind: "rusher", pos: [4, -14] }] },
    {
      when: { type: "zone", rect: [-9, -6, 9, -4] },
      spawns: [
        { kind: "walker", pos: [-8, -14] },
        { kind: "walker", pos: [8, -14] },
        { kind: "rusher", pos: [0, -13] }
      ]
    },
    { when: { type: "time", seconds: 5 }, spawns: [{ kind: "rusher", pos: [-8, 4] }, { kind: "rusher", pos: [8, 4] }] },
    { when: { type: "zone", rect: [-9, -12, 9, -10] }, spawns: [{ kind: "walker", pos: [-8, -15], weapon: "carbine" }] }
  ]
}, (b) => {
  b.room(-9, -16, 9, 6, 3.2, { ceiling: true, floorMat: "dark" });
  for (const x of [-6, -2, 2, 6]) {
    for (const [z0, z1] of [[-13, -8], [-6, -1]]) {
      b.box(x - 0.45, 0, z0, x + 0.45, 2.4, z1, "metal");
      b.strip(x - 0.47, 0.4, z0 + 0.2, x - 0.45, 2.2, z1 - 0.2, "glow");
      b.strip(x + 0.45, 0.4, z0 + 0.2, x + 0.47, 2.2, z1 - 0.2, "glow");
    }
  }
  b.strip(-1.2, 0, -15.98, 1.2, 2.4, -15.9, "accent");
  b.strip(-1.5, 4e-3, -16, 1.5, 0.012, -14.6, "accent");
  b.lights(-4, -14, 4, 4, 3.15, 4, "glow");
});
export const boardroom = level({
  id: "2-5",
  name: "BOARDROOM",
  act: 2,
  theme: "office",
  words: ["ANY", "OTHER", "BUSINESS?"],
  seed: 205,
  player: { pos: [0, 0, 4.5], yaw: 0 },
  props: [
    { kind: "blade", pos: [0, 0.9, 2] },
    { kind: "mug", pos: [-0.6, 0.9, -4] },
    { kind: "mug", pos: [0.6, 0.9, -1] },
    { kind: "bottle", pos: [0.5, 0.9, -6] }
  ],
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-4, -8] },
        { kind: "walker", pos: [0, -9] },
        { kind: "walker", pos: [4, -8] }
      ]
    },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.4,
      spawns: [
        { kind: "rusher", pos: [-6.2, 3] },
        { kind: "rusher", pos: [-6.2, -5] },
        { kind: "walker", pos: [4, -9], weapon: "scatter" }
      ]
    }
  ]
}, (b) => {
  b.room(-7, -10, 7, 6, 3.4, { ceiling: true });
  b.crate(0, -2.5, 2.4, 0.8, 9, 0, "dark");
  for (const z of [-6, -4, -2, 0, 2]) {
    b.crate(-1.7, z, 0.5, 0.5, 0.5, 0, "trim");
    b.crate(1.7, z, 0.5, 0.5, 0.5, 0, "trim");
  }
  b.box(6.95, 0.6, -10, 7.05, 3, 6, "window", false);
  b.crate(-5.5, -9.2, 2, 1.1, 0.6, 0, "light");
  b.crate(5.5, 5.2, 2, 1.1, 0.6, 0, "light");
  b.lights(0, -8, 0, 4, 3.35, 3);
});
export const ACT2 = [lobby, elevator, cubicles, serverRoom, boardroom];
