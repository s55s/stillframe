import type { PlayerFrame } from '../sim/types';
import { FIXED_STEP } from '../core/loop';
import { World } from '../sim/world';

export class ReplayRecorder {
  frames: PlayerFrame[] = [];
  reset() {
    this.frames = [];
  }
  push(f) {
    this.frames.push({ ...f, pos: [...f.pos], vel: [...f.vel] });
  }
  setLastSteps(steps) {
    const last = this.frames[this.frames.length - 1];
    if (last)
      last.steps += steps;
  }
};
export class ReplayPlayer {
  frames;
  world;
  index = 0;
  simPlayed = 0;
  clock = 0;
  speed = 1;
  constructor(def, frames, shared) {
    this.frames = frames;
    this.world = new World(def, shared);
  }
  get done() {
    return this.index >= this.frames.length;
  }
  get progress() {
    return this.frames.length === 0 ? 1 : this.index / this.frames.length;
  }
  current: PlayerFrame | null = null;
  update(realDt) {
    this.clock += realDt * this.speed;
    let steps = 0;
    let applied = 0;
    while (this.index < this.frames.length && (this.simPlayed < this.clock || applied === 0)) {
      const f = this.frames[this.index++];
      this.world.applyPlayerFrame({ ...f, pos: [...f.pos], vel: [...f.vel] });
      for (let i = 0; i < f.steps; i++)
        this.world.step(FIXED_STEP);
      this.simPlayed += f.steps * FIXED_STEP;
      steps += f.steps;
      this.current = f;
      applied++;
      if (applied > 2e3)
        break;
    }
    return steps;
  }
};
