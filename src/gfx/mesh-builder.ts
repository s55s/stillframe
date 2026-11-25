import { Mesh, VERTEX_FLOATS } from './mesh';

export function srgbHex(hex) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [toLinear(hex >> 16 & 255), toLinear(hex >> 8 & 255), toLinear(hex & 255)];
}
export const BOX_FACES = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]
];
export const CORNER_SIGNS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
];
export class MeshBuilder {
  vertices: number[] = [];
  indices: number[] = [];
  get vertexCount() {
    return this.vertices.length / VERTEX_FLOATS;
  }
  get isEmpty() {
    return this.indices.length === 0;
  }
  pushVertex(p, n, c, emissive) {
    this.vertices.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], emissive);
  }
  addTri(a, b, c, color, emissive = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    const n = [nx, ny, nz];
    const base = this.vertexCount;
    this.pushVertex(a, n, color, emissive);
    this.pushVertex(b, n, color, emissive);
    this.pushVertex(c, n, color, emissive);
    this.indices.push(base, base + 1, base + 2);
    return this;
  }
  addQuad(a, b, c, d, color, emissive = 0) {
    this.addTri(a, b, c, color, emissive);
    this.addTri(a, c, d, color, emissive);
    return this;
  }
  addBox(center, size, color, emissive = 0) {
    const half = [size[0] / 2, size[1] / 2, size[2] / 2];
    for (const [n, u, v] of BOX_FACES) {
      const base = this.vertexCount;
      for (const [su, sv] of CORNER_SIGNS) {
        const p = [
          center[0] + half[0] * (n[0] + su * u[0] + sv * v[0]),
          center[1] + half[1] * (n[1] + su * u[1] + sv * v[1]),
          center[2] + half[2] * (n[2] + su * u[2] + sv * v[2])
        ];
        this.pushVertex(p, n, color, emissive);
      }
      this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return this;
  }
  addBoxMinMax(min, max, color, emissive = 0) {
    return this.addBox([(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], [max[0] - min[0], max[1] - min[1], max[2] - min[2]], color, emissive);
  }
  addTaperedBox(cx, cz, y0, y1, bw, bd, tw, td, color, emissive = 0) {
    const b = [
      [cx - bw / 2, y0, cz + bd / 2],
      [cx + bw / 2, y0, cz + bd / 2],
      [cx + bw / 2, y0, cz - bd / 2],
      [cx - bw / 2, y0, cz - bd / 2]
    ];
    const t = [
      [cx - tw / 2, y1, cz + td / 2],
      [cx + tw / 2, y1, cz + td / 2],
      [cx + tw / 2, y1, cz - td / 2],
      [cx - tw / 2, y1, cz - td / 2]
    ];
    const flip = y1 < y0;
    const quad = (p0, p1, p2, p3) => {
      if (flip)
        this.addQuad(p3, p2, p1, p0, color, emissive);
      else
        this.addQuad(p0, p1, p2, p3, color, emissive);
    };
    quad(t[0], t[1], t[2], t[3]);
    quad(b[3], b[2], b[1], b[0]);
    quad(b[0], b[1], t[1], t[0]);
    quad(b[1], b[2], t[2], t[1]);
    quad(b[2], b[3], t[3], t[2]);
    quad(b[3], b[0], t[0], t[3]);
    return this;
  }
  build(device, label) {
    return new Mesh(device, new Float32Array(this.vertices), new Uint32Array(this.indices), label);
  }
};
