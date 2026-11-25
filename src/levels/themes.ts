import { srgbHex } from '../gfx/mesh-builder';

export const m = (hex, emissive = 0) => ({ color: srgbHex(hex), emissive });
export const THEMES = {
  transit: {
    lighting: {
      keyDir: [0.35, 0.85, 0.4],
      keyColor: [1.7, 0.98, 0.52],
      fillDir: [-0.55, 0.35, -0.6],
      fillColor: [0.16, 0.3, 0.36],
      ambientSky: [0.15, 0.16, 0.19],
      ambientGround: [0.07, 0.06, 0.055],
      fogColor: [0.03, 0.035, 0.04],
      fogDensity: 0.025
    },
    materials: {
      floor: m(7104354),
      wall: m(9209730),
      dark: m(5130823),
      light: m(11840932),
      trim: m(7827819),
      metal: m(6120038),
      accent: m(16751164, 6),
      glow: m(6283480, 5),
      window: m(1911344, 1.2)
    }
  },
  office: {
    lighting: {
      keyDir: [-0.4, 0.8, 0.45],
      keyColor: [1.5, 1.05, 0.7],
      fillDir: [0.6, 0.3, -0.5],
      fillColor: [0.2, 0.3, 0.36],
      ambientSky: [0.18, 0.19, 0.21],
      ambientGround: [0.08, 0.075, 0.07],
      fogColor: [0.045, 0.05, 0.056],
      fogDensity: 0.02
    },
    materials: {
      floor: m(6052440),
      wall: m(10130830),
      dark: m(4605002),
      light: m(12762290),
      trim: m(8419954),
      metal: m(6449004),
      accent: m(16756835, 5),
      glow: m(7330047, 4),
      window: m(2306104, 1.5)
    }
  },
  rooftop: {
    lighting: {
      keyDir: [0.5, 0.65, -0.55],
      keyColor: [0.55, 0.75, 1],
      fillDir: [-0.5, 0.25, 0.6],
      fillColor: [0.7, 0.36, 0.14],
      ambientSky: [0.09, 0.11, 0.17],
      ambientGround: [0.06, 0.045, 0.04],
      fogColor: [0.025, 0.03, 0.055],
      fogDensity: 0.018
    },
    materials: {
      floor: m(5657679),
      wall: m(7696747),
      dark: m(3947325),
      light: m(10459535),
      trim: m(6775646),
      metal: m(5330524),
      accent: m(16747066, 7),
      glow: m(5822696, 5),
      window: m(2767434, 2)
    }
  }
};
