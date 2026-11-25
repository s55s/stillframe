import { approach, clamp } from '../core/math';

/** What the player is doing this frame. Named fields, so values can't be passed in the wrong order (BUG-001). */
export interface PlayerActivity {
  /** Real (wall-clock) seconds since the last frame. */
  realDt: number;
  /** The player's current horizontal speed, m/s. */
  planarSpeed: number;
  /** The speed that counts as "fully moving" (walking speed), m/s. */
  maxSpeed: number;
  /** How fast the view is turning, in mouse pixels per second. */
  lookSpeed: number;
  airborne: boolean;
  /** True while an action is still running (for example a carbine burst). */
  busy: boolean;
}

/**
 * The game's core mechanic: time moves when you move.
 * Turns the player's activity into the world's time scale, from MIN (standing still) to 1 (full speed).
 */
export class TimeScaleDriver {
  static MIN = 0.015;
  static LOOK_WEIGHT = 0.35;
  static LOOK_FULL = 900;
  static KICK_TIME = 0.12;
  static RISE = 0.05;
  static FALL = 0.1;
  value = TimeScaleDriver.MIN;
  kick = 0;
  reset() {
    this.value = TimeScaleDriver.MIN;
    this.kick = 0;
  }
  actionKick() {
    this.kick = TimeScaleDriver.KICK_TIME;
  }
  update({ realDt, planarSpeed, maxSpeed, lookSpeed, airborne, busy }: PlayerActivity) {
    this.kick = Math.max(0, this.kick - realDt);
    const moveInput = maxSpeed > 0 ? clamp(planarSpeed / maxSpeed, 0, 1) : 0;
    const lookInput = clamp(lookSpeed / TimeScaleDriver.LOOK_FULL, 0, 1) * TimeScaleDriver.LOOK_WEIGHT;
    const kickInput = this.kick > 0 || busy ? 1 : 0;
    let target = Math.max(moveInput, lookInput, kickInput);
    if (airborne)
      target = Math.max(target, 0.8);
    target = Math.max(target, TimeScaleDriver.MIN);
    const tau = target > this.value ? TimeScaleDriver.RISE : TimeScaleDriver.FALL;
    this.value = clamp(approach(this.value, target, tau, realDt), TimeScaleDriver.MIN, 1);
    return this.value;
  }
}
