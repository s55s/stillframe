import type { EnemyKind, ItemKind, Vec3 } from '../sim/types';

/** One axis-aligned box of level geometry. `mat` is a key into the level theme's materials. */
export interface LevelBox {
  min: Vec3;
  max: Vec3;
  mat: string;
  collide: boolean;
}

/** An [x0, z0, x1, z1] rectangle on the ground plane. */
export type Rect = [number, number, number, number];

export type WaveTrigger =
  | { type: 'start' }
  | { type: 'remaining'; count: number }
  | { type: 'zone'; rect: Rect }
  | { type: 'time'; seconds: number };

export interface EnemySpawn {
  kind: EnemyKind;
  /** [x, z] on the floor, or [x, y, z]. */
  pos: number[];
  yaw?: number;
  /** Overrides the kind's default weapon; null means unarmed. */
  weapon?: ItemKind | null;
  idle?: boolean;
}

export interface Wave {
  when: WaveTrigger;
  delay?: number;
  spawns: EnemySpawn[];
}

export interface LevelMeta {
  id: string;
  name: string;
  act: number;
  theme: string;
  /** Words flashed on the title card before the level starts. */
  words: string[];
  /** Seeds the simulation's random numbers, so runs (and replays) are deterministic. */
  seed: number;
  player: { pos: Vec3; yaw: number; item?: ItemKind };
  props: { kind: ItemKind; pos: Vec3 }[];
  waves: Wave[];
  maxActive?: number;
  exit?: { rect: Rect; requiresClear?: boolean };
}

export interface LevelDef extends LevelMeta {
  boxes: LevelBox[];
}


export interface RoomOptions {
  /** Wall thickness. */
  t?: number;
  mat?: string;
  doors?: { side: 'n' | 's' | 'e' | 'w'; [key: string]: unknown }[];
  floor?: boolean;
  floorMat?: string;
  ceiling?: boolean;
}

export class LevelBuilder {
  boxes: LevelBox[] = [];
  box(x0, y0, z0, x1, y1, z1, mat = "wall", collide = true) {
    const min = [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)];
    const max = [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)];
    this.boxes.push({ min, max, mat, collide });
    return this;
  }
  floor(x0, z0, x1, z1, y = 0, mat = "floor") {
    return this.box(x0, y - 0.4, z0, x1, y, z1, mat);
  }
  ceiling(x0, z0, x1, z1, y, mat = "dark") {
    return this.box(x0, y, z0, x1, y + 0.3, z1, mat);
  }
  wallX(x0, x1, z, h, t = 0.3, mat = "wall", y0 = 0) {
    return this.box(x0, y0, z - t / 2, x1, y0 + h, z + t / 2, mat);
  }
  wallZ(z0, z1, x, h, t = 0.3, mat = "wall", y0 = 0) {
    return this.box(x - t / 2, y0, z0, x + t / 2, y0 + h, z1, mat);
  }
  wallWithDoorsX(x0, x1, z, h, doors, t = 0.3, mat = "wall", y0 = 0) {
    this.segmented(x0, x1, doors, h, (a, b) => this.wallX(a, b, z, h, t, mat, y0), (a, b, dh) => this.box(a, y0 + dh, z - t / 2, b, y0 + h, z + t / 2, mat));
    return this;
  }
  wallWithDoorsZ(z0, z1, x, h, doors, t = 0.3, mat = "wall", y0 = 0) {
    this.segmented(z0, z1, doors, h, (a, b) => this.wallZ(a, b, x, h, t, mat, y0), (a, b, dh) => this.box(x - t / 2, y0 + dh, a, x + t / 2, y0 + h, b, mat));
    return this;
  }
  segmented(a0, a1, doors, h, solid, lintel) {
    const gaps = doors.map((d) => [d.at - d.width / 2, d.at + d.width / 2, d.height ?? h]).sort((p, q) => p[0] - q[0]);
    let cur = a0;
    for (const [g0, g1, gh] of gaps) {
      if (g0 > cur)
        solid(cur, g0);
      if (gh < h)
        lintel(g0, g1, gh);
      cur = Math.max(cur, g1);
    }
    if (cur < a1)
      solid(cur, a1);
  }
  room(x0, z0, x1, z1, h, opts: RoomOptions = {}) {
    const t = opts.t ?? 0.4;
    const mat = opts.mat ?? "wall";
    const doors = opts.doors ?? [];
    const on = (s) => doors.filter((d) => d.side === s);
    if (opts.floor !== false)
      this.floor(x0 - t, z0 - t, x1 + t, z1 + t, 0, opts.floorMat ?? "floor");
    if (opts.ceiling)
      this.ceiling(x0 - t, z0 - t, x1 + t, z1 + t, h);
    this.wallWithDoorsX(x0 - t, x1 + t, z0 - t / 2, h, on("n"), t, mat);
    this.wallWithDoorsX(x0 - t, x1 + t, z1 + t / 2, h, on("s"), t, mat);
    this.wallWithDoorsZ(z0, z1, x0 - t / 2, h, on("w"), t, mat);
    this.wallWithDoorsZ(z0, z1, x1 + t / 2, h, on("e"), t, mat);
    return this;
  }
  pillar(x, z, size, h, mat = "dark") {
    return this.box(x - size / 2, 0, z - size / 2, x + size / 2, h, z + size / 2, mat);
  }
  crate(x, z, w, h, d, y = 0, mat = "light") {
    return this.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, mat);
  }
  strip(x0, y0, z0, x1, y1, z1, mat = "accent") {
    return this.box(x0, y0, z0, x1, y1, z1, mat, false);
  }
  stairsZ(x0, x1, zStart, steps, rise, run, dir = 1, baseY = 0, mat = "trim") {
    for (let i = 0; i < steps; i++) {
      const za = zStart + dir * i * run;
      const zb = za + dir * run;
      this.box(x0, baseY - 0.4, za, x1, baseY + (i + 1) * rise, zb, mat);
    }
    return this;
  }
  stairsX(z0, z1, xStart, steps, rise, run, dir = 1, baseY = 0, mat = "trim") {
    for (let i = 0; i < steps; i++) {
      const xa = xStart + dir * i * run;
      const xb = xa + dir * run;
      this.box(xa, baseY - 0.4, z0, xb, baseY + (i + 1) * rise, z1, mat);
    }
    return this;
  }
  platform(x0, z0, x1, z1, y, mat = "floor") {
    return this.box(x0, y - 0.4, z0, x1, y, z1, mat);
  }
  rail(x0, z0, x1, z1, y = 0, h = 1, mat = "metal") {
    return this.box(x0, y, z0, x1, y + h, z1, mat);
  }
  lights(x0, z0, x1, z1, y, spacing, mat = "accent") {
    for (let x = x0; x <= x1 + 1e-6; x += spacing) {
      for (let z = z0; z <= z1 + 1e-6; z += spacing) {
        this.strip(x - 0.6, y - 0.06, z - 0.08, x + 0.6, y, z + 0.08, mat);
      }
    }
    return this;
  }
};

export function level(meta: LevelMeta, build: (b: LevelBuilder) => void): LevelDef {
  const b = new LevelBuilder();
  build(b);
  return { ...meta, boxes: b.boxes };
}
