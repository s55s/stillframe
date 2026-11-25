import { describe, expect, it } from 'vitest';
import { type PlayerActivity, TimeScaleDriver } from './time-scale-driver';

const WALK = 4;
const FRAME = 1 / 60;

const idle: PlayerActivity = { realDt: FRAME, planarSpeed: 0, maxSpeed: WALK, lookSpeed: 0, airborne: false, busy: false };

/** Runs the driver for `seconds` of 60 Hz frames with the same activity, and returns the final time scale. */
function settle(driver: TimeScaleDriver, activity: Partial<PlayerActivity>, seconds = 2) {
  let value = driver.value;
  for (let i = 0; i < seconds * 60; i++)
    value = driver.update({ ...idle, ...activity });
  return value;
}

describe('TimeScaleDriver', () => {
  it('nearly freezes time while the player stands still (BUG-001)', () => {
    expect(settle(new TimeScaleDriver(), {})).toBeCloseTo(TimeScaleDriver.MIN, 6);
  });

  it('runs time at full speed while walking at full speed', () => {
    expect(settle(new TimeScaleDriver(), { planarSpeed: WALK })).toBeCloseTo(1, 3);
  });

  it('scales time with walking speed', () => {
    expect(settle(new TimeScaleDriver(), { planarSpeed: WALK / 2 })).toBeCloseTo(0.5, 3);
  });

  it('slows time down again after the player stops', () => {
    const driver = new TimeScaleDriver();
    settle(driver, { planarSpeed: WALK });
    expect(settle(driver, {})).toBeCloseTo(TimeScaleDriver.MIN, 3);
  });

  it('lets turning the view speed time up only partly', () => {
    expect(settle(new TimeScaleDriver(), { lookSpeed: 10_000 })).toBeCloseTo(TimeScaleDriver.LOOK_WEIGHT, 3);
  });

  it('keeps time at 80% or more while airborne', () => {
    expect(settle(new TimeScaleDriver(), { airborne: true })).toBeCloseTo(0.8, 3);
  });

  it('runs time at full speed briefly after an action', () => {
    const driver = new TimeScaleDriver();
    driver.actionKick();
    const value = settle(driver, {}, TimeScaleDriver.KICK_TIME * 0.9);
    expect(value).toBeGreaterThan(0.8);
  });
});
