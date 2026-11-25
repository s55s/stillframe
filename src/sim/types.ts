// Shared data types for the simulation: what lives in a World and what it reports.
// Everything here is plain data; the behaviour lives in world.ts and enemy.ts.

/** A 3-component vector stored as a plain array: [x, y, z]. */
export type Vec3 = number[];

export type WeaponKind = 'pistol' | 'scatter' | 'carbine' | 'blade';
export type ItemKind = WeaponKind | 'bottle' | 'brick' | 'mug';
export type EnemyKind = 'walker' | 'rusher' | 'marksman';
export type EnemyState = 'idle' | 'alert' | 'stunned' | (string & {});

/** Something that can be held: a weapon (with ammo) or a throwable. */
export interface Item {
  kind: ItemKind;
  ammo: number;
}

/** An item lying in or flying through the world. */
export interface Prop {
  id: number;
  item: Item;
  pos: Vec3;
  prevPos: Vec3;
  vel: Vec3;
  rot: Vec3;
  prevRot: Vec3;
  angVel: Vec3;
  thrown: boolean;
  sleeping: boolean;
  restTimer: number;
  alive: boolean;
  /** Id of the enemy walking over to pick this up, or -1. */
  claimedBy: number;
}

export interface Projectile {
  pos: Vec3;
  prevPos: Vec3;
  vel: Vec3;
  spawnPos: Vec3;
  /** 0 for the player, otherwise the shooting enemy's id. */
  ownerId: number;
  shotId: number;
  age: number;
  alive: boolean;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  alive: boolean;
  pos: Vec3;
  prevPos: Vec3;
  vel: Vec3;
  yaw: number;
  prevYaw: number;
  grounded: boolean;
  state: EnemyState;
  stateTime: number;
  hp: number;
  weapon: Item | null;
  fireCooldown: number;
  burstLeft: number;
  burstTimer: number;
  aimTimer: number;
  telegraph: number;
  lockedDir: Vec3;
  meleeT: number;
  prevMeleeT: number;
  meleeCooldown: number;
  stunTimer: number;
  path: Vec3[] | null;
  pathIndex: number;
  repathTimer: number;
  seesPlayer: boolean;
  walkPhase: number;
  prevWalkPhase: number;
  moveBlend: number;
  prevMoveBlend: number;
  aimBlend: number;
  prevAimBlend: number;
  aimPitch: number;
  hitFlash: number;
  spawnT: number;
  prevSpawnT: number;
  strafeSeed: number;
  targetPropId: number;
  lastShotId: number;
}

/** The simulation's copy of the player: pose (copied in each frame) plus combat state. */
export interface PlayerState {
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  grounded: boolean;
  alive: boolean;
  invulnerable: boolean;
  held: Item | null;
  fireCooldown: number;
  burstLeft: number;
  burstTimer: number;
  punchCooldown: number;
  punchSide: number;
  punchAge: number;
  recoilAge: number;
  throwAge: number;
  slashAge: number;
  pickupAge: number;
}

/** One rendered frame of player input and pose. Recorded for replays. */
export interface PlayerFrame {
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  grounded: boolean;
  fire: boolean;
  throwItem: boolean;
  interact: boolean;
  /** Number of fixed simulation steps that ran after this frame. */
  steps: number;
}

/**
 * Everything the simulation reports to the presentation layer (audio, particles).
 * A discriminated union, so a mistyped `type` is a compile error.
 */
export type GameEvent =
  | { type: 'shot'; pos: Vec3; dir: Vec3; weapon: ItemKind; byPlayer: boolean }
  | { type: 'impact'; pos: Vec3; normal: Vec3 }
  | { type: 'enemyDeath'; enemy: Enemy; dir: Vec3; point: Vec3; silent: boolean }
  | { type: 'enemyHit'; pos: Vec3; dir: Vec3 }
  | { type: 'playerDeath'; dir: Vec3 }
  | { type: 'bulletClash'; pos: Vec3 }
  | { type: 'slice'; pos: Vec3; dir: Vec3 }
  | { type: 'punch'; hit: boolean; pos: Vec3 }
  | { type: 'slash'; hit: boolean }
  | { type: 'throw' }
  | { type: 'pickup'; kind: ItemKind }
  | { type: 'dryFire' }
  | { type: 'itemBreak'; pos: Vec3; kind: ItemKind }
  | { type: 'propImpact'; pos: Vec3; speed: number }
  | { type: 'spawn'; pos: Vec3 }
  | { type: 'melee'; pos: Vec3 }
  | { type: 'telegraph' };
