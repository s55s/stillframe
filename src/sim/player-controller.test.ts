import { describe, expect, it } from 'vitest';
import { dirFromYawPitch, dot, v3 } from '../core/math';
import { PlayerController } from './player-controller';

const settings = { sensitivity: 0.0022, invertY: false };

/** Applies one frame of mouse movement and returns how far the view turned toward the starting "right" direction. */
function turnTowardRight(mouseDx: number) {
  const player = new PlayerController();
  player.reset([0, 0, 0], 0);
  const right = [Math.cos(player.yaw), 0, -Math.sin(player.yaw)];
  player.look({ mouseDx, mouseDy: 0 }, 1 / 60, settings);
  return dot(dirFromYawPitch(v3(), player.yaw, 0), right);
}

describe('PlayerController.look', () => {
  it('turns the view right when the mouse moves right (BUG-004)', () => {
    expect(turnTowardRight(100)).toBeGreaterThan(0);
  });

  it('turns the view left when the mouse moves left (BUG-004)', () => {
    expect(turnTowardRight(-100)).toBeLessThan(0);
  });

  it('looks up when the mouse moves up, unless Y is inverted', () => {
    const player = new PlayerController();
    player.look({ mouseDx: 0, mouseDy: -100 }, 1 / 60, settings);
    expect(player.pitch).toBeGreaterThan(0);
    player.reset([0, 0, 0], 0);
    player.look({ mouseDx: 0, mouseDy: -100 }, 1 / 60, { ...settings, invertY: true });
    expect(player.pitch).toBeLessThan(0);
  });
});
