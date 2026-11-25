import { level } from './level-builder';

export const platform = level({
  id: "1-1",
  name: "PLATFORM",
  act: 1,
  theme: "transit",
  words: ["TIME", "MOVES", "WHEN", "YOU", "MOVE."],
  seed: 101,
  player: { pos: [0, 0, 4], yaw: 0 },
  props: [
    { kind: "bottle", pos: [1.5, 0.6, 2] },
    { kind: "brick", pos: [-1.5, 0.1, 1] },
    { kind: "mug", pos: [-4.5, 0.6, -4.6] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "walker", pos: [0, -9], weapon: null }] },
    { when: { type: "remaining", count: 0 }, delay: 0.4, spawns: [{ kind: "walker", pos: [-4, -10] }] },
    { when: { type: "remaining", count: 0 }, delay: 0.4, spawns: [{ kind: "walker", pos: [4, -10] }, { kind: "walker", pos: [-4, -10] }] }
  ]
}, (b) => {
  b.room(-6, -12, 6, 6, 5, { ceiling: true });
  for (const z of [-3, -8])
    for (const x of [-3, 3])
      b.pillar(x, z, 0.7, 5);
  b.crate(1.5, 2, 1.6, 0.45, 0.5, 0, "trim");
  b.crate(-4.5, -5, 0.5, 0.45, 2.2, 0, "trim");
  b.crate(4.6, -1, 0.8, 1.2, 0.8, 0, "light");
  b.strip(-6, 4e-3, -0.6, 6, 0.012, -0.4, "accent");
  b.lights(-3, -10, 3, 4, 4.95, 4.5);
  b.strip(-5.95, 2.6, -11, -5.9, 3.4, 5, "window");
});
export const car = level({
  id: "1-2",
  name: "CARRIAGE",
  act: 1,
  theme: "transit",
  words: ["NOWHERE", "TO", "RUN."],
  seed: 102,
  player: { pos: [0, 0, 0], yaw: 0, item: "pistol" },
  props: [
    { kind: "mug", pos: [-1.2, 0.6, 3] },
    { kind: "bottle", pos: [-1.2, 0.6, -3] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "walker", pos: [0, -12] }, { kind: "walker", pos: [0, 12] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.3,
      spawns: [
        { kind: "rusher", pos: [5, -12] },
        { kind: "rusher", pos: [5, 12] },
        { kind: "walker", pos: [5.5, 0] }
      ]
    }
  ]
}, (b) => {
  b.floor(-2.2, -16, 7.6, 16);
  b.wallZ(-15, 15, -1.65, 2.6, 0.3, "light");
  b.wallWithDoorsZ(-15, 15, 1.65, 2.6, [
    { side: "e", at: -5, width: 1.4, height: 2.1 },
    { side: "e", at: 5, width: 1.4, height: 2.1 }
  ], 0.3, "light");
  b.wallX(-1.8, 1.8, -15.15, 2.6, 0.3, "light");
  b.wallX(-1.8, 1.8, 15.15, 2.6, 0.3, "light");
  b.ceiling(-1.8, -15.3, 1.8, 15.3, 2.6, "trim");
  for (const [z0, z1] of [[-14.5, -6], [-4, 4], [6, 14.5]]) {
    b.box(-1.5, 0, z0, -1, 0.45, z1, "dark");
    b.box(1, 0, z0, 1.5, 0.45, z1, "dark");
  }
  for (let z = -12; z <= 12; z += 4)
    b.pillar(0, z, 0.08, 2.6, "metal");
  b.lights(0, -13, 0, 13, 2.58, 3.25, "glow");
  b.wallZ(-16, 16, 7.4, 5, 0.4);
  b.wallX(1.8, 7.6, -16.2, 5, 0.4);
  b.wallX(1.8, 7.6, 16.2, 5, 0.4);
  b.ceiling(1.8, -16.4, 7.6, 16.4, 5);
  b.pillar(4.8, -8, 0.6, 5);
  b.pillar(4.8, 8, 0.6, 5);
  b.crate(5.5, 0, 1.4, 1, 0.6, 0, "trim");
  b.lights(4.8, -12, 4.8, 12, 4.95, 6);
});
export const turnstiles = level({
  id: "1-3",
  name: "TURNSTILES",
  act: 1,
  theme: "transit",
  words: ["THEY", "RUN.", "YOU", "DON'T."],
  seed: 103,
  player: { pos: [0, 0, 5.5], yaw: 0 },
  props: [
    { kind: "pistol", pos: [0.6, 0.1, 3.2] },
    { kind: "bottle", pos: [-2.5, 0.1, 4] },
    { kind: "brick", pos: [3, 0.1, 2] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "rusher", pos: [-6, -10] }, { kind: "rusher", pos: [6, -10] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.5,
      spawns: [
        { kind: "walker", pos: [-8, -12] },
        { kind: "walker", pos: [8, -12] },
        { kind: "rusher", pos: [0, -13] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 1, spawns: [{ kind: "rusher", pos: [-8, 6.5] }, { kind: "rusher", pos: [8, 6.5] }] }
  ]
}, (b) => {
  b.room(-10, -14, 10, 8, 5, { ceiling: true });
  for (let x = -8.4; x <= 8.4; x += 1.6)
    b.crate(x, -3, 0.3, 1, 0.9, 0, "metal");
  b.crate(-7, -9, 3, 2.4, 2, 0, "light");
  b.crate(7, -9, 3, 2.4, 2, 0, "light");
  for (const x of [-5, 5])
    for (const z of [-11, 2])
      b.pillar(x, z, 0.8, 5);
  b.crate(0, 2.5, 2.4, 0.45, 0.5, 0, "trim");
  b.lights(-6, -12, 6, 6, 4.95, 4);
  b.strip(-10, 2.2, -13.95, 10, 2.5, -13.9, "glow");
});
export const escalator = level({
  id: "1-4",
  name: "ESCALATOR",
  act: 1,
  theme: "transit",
  words: ["UP."],
  seed: 104,
  player: { pos: [0, 0, 8], yaw: 0 },
  props: [
    { kind: "pistol", pos: [2, 0.1, 6] },
    { kind: "brick", pos: [-2, 0.1, 6.5] },
    { kind: "bottle", pos: [4.5, 0.1, 1] }
  ],
  waves: [
    { when: { type: "start" }, spawns: [{ kind: "walker", pos: [-3, 3, -12] }, { kind: "walker", pos: [3, 3, -12] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.4,
      spawns: [
        { kind: "rusher", pos: [-2, 3, -16] },
        { kind: "rusher", pos: [2, 3, -16] },
        { kind: "walker", pos: [-5, 0, 9] }
      ]
    }
  ]
}, (b) => {
  b.floor(-6.4, -18.4, 6.4, 10.4);
  b.wallZ(-18.4, 10.4, -6.2, 7.5, 0.4);
  b.wallZ(-18.4, 10.4, 6.2, 7.5, 0.4);
  b.wallX(-6.4, 6.4, -18.2, 7.5, 0.4);
  b.wallX(-6.4, 6.4, 10.2, 7.5, 0.4);
  b.ceiling(-6.4, -18.4, 6.4, 10.4, 7.5);
  b.box(-6, -0.4, -18, 6, 3, -8, "dark");
  b.stairsZ(-1.5, 1.5, -2, 12, 0.25, 0.5, -1);
  b.rail(-6, -8.1, -1.5, -7.9, 3, 1);
  b.rail(1.5, -8.1, 6, -7.9, 3, 1);
  b.box(-1.7, 0, -8, -1.5, 3.9, -2, "metal");
  b.box(1.5, 0, -8, 1.7, 3.9, -2, "metal");
  b.crate(-4, -13, 1.2, 1.1, 1.2, 3, "light");
  b.crate(4, -14, 1.2, 1.1, 1.2, 3, "light");
  b.pillar(-4, 3, 0.7, 7.5);
  b.pillar(4, 3, 0.7, 7.5);
  b.lights(-3, -16, 3, 8, 7.45, 4);
});
export const lastTrain = level({
  id: "1-5",
  name: "LAST TRAIN",
  act: 1,
  theme: "transit",
  words: ["LAST", "TRAIN."],
  seed: 105,
  player: { pos: [1, 0, 16], yaw: 0, item: "pistol" },
  props: [
    { kind: "bottle", pos: [3, 0.6, 12] },
    { kind: "brick", pos: [-1, 0.1, 14] },
    { kind: "mug", pos: [3, 0.6, -2] }
  ],
  maxActive: 6,
  waves: [
    {
      when: { type: "start" },
      spawns: [
        { kind: "walker", pos: [-1, -14] },
        { kind: "walker", pos: [3, -14] },
        { kind: "rusher", pos: [1, -18] }
      ]
    },
    { when: { type: "remaining", count: 1 }, delay: 0.5, spawns: [{ kind: "walker", pos: [-6.2, -5] }, { kind: "walker", pos: [-6.2, 6] }] },
    {
      when: { type: "remaining", count: 0 },
      delay: 0.5,
      spawns: [
        { kind: "rusher", pos: [-6.2, -12] },
        { kind: "rusher", pos: [3, -19] },
        { kind: "rusher", pos: [-6.2, 12] },
        { kind: "walker", pos: [1, -19], weapon: "scatter" }
      ]
    }
  ]
}, (b) => {
  b.floor(-8.4, -20.4, 4.4, 20.4);
  b.wallZ(-20.4, 20.4, 4.2, 5.5, 0.4);
  b.wallX(-8.4, 4.4, -20.2, 5.5, 0.4);
  b.wallX(-8.4, 4.4, 20.2, 5.5, 0.4);
  b.wallZ(-20.4, 20.4, -8.2, 5.5, 0.4);
  b.ceiling(-8.4, -20.4, 4.4, 20.4, 5.5);
  b.wallWithDoorsZ(-18, 18, -4.5, 2.6, [
    { side: "e", at: -12, width: 1.4, height: 2.1 },
    { side: "e", at: -5, width: 1.4, height: 2.1 },
    { side: "e", at: 5, width: 1.4, height: 2.1 },
    { side: "e", at: 12, width: 1.4, height: 2.1 }
  ], 0.3, "light");
  b.wallX(-8, -4.35, -18, 2.6, 0.3, "light");
  b.wallX(-8, -4.35, 18, 2.6, 0.3, "light");
  b.ceiling(-8, -18.15, -4.35, 18.15, 2.6, "trim");
  for (const z of [-15, -8.5, 0, 8.5, 15])
    b.box(-7.9, 0, z - 2, -7.4, 0.45, z + 2, "dark");
  b.lights(-6.2, -16, -6.2, 16, 2.58, 4, "glow");
  for (const z of [-10, 0, 10])
    b.pillar(1, z, 0.7, 5.5);
  b.crate(3, -2, 1.6, 0.45, 0.5, 0, "trim");
  b.crate(3, 12, 1.6, 0.45, 0.5, 0, "trim");
  b.crate(1, -6, 1.2, 1.1, 0.6, 0, "light");
  b.crate(-1.5, 6, 0.8, 1.3, 0.8, 0, "light");
  b.strip(-3.6, 4e-3, -20, -3.4, 0.012, 20, "accent");
  b.lights(1, -18, 1, 18, 5.45, 6);
});
export const ACT1 = [platform, car, turnstiles, escalator, lastTrain];
