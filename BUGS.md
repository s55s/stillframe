# Bug log

Bugs found in STILLFRAME (`index.html`). Line numbers refer to `index.html` as of the commit noted on each entry.

**Status values:** Open · Fixed (with commit) · Won't fix (with reason)

| # | Summary | Severity | Status |
|---|---|---|---|
| [BUG-001](#bug-001-time-never-slows-down) | Time never slows down: swapped arguments to `TimeScaleDriver.update` | Critical | Fixed |
| [BUG-002](#bug-002-replay-hand-bob-uses-distance-from-the-origin) | Replay hand bob uses distance from the world origin instead of distance walked | Minor | Fixed |
| [BUG-003](#bug-003-every-level-is-locked-on-a-fresh-save) | Every level is locked on a fresh save, so the game can't be started | Critical | Fixed |
| [BUG-004](#bug-004-horizontal-mouse-look-is-reversed) | Horizontal mouse look is reversed: moving the mouse left turns right | Major | Fixed |
| [BUG-005](#bug-005-film-grain-grows-into-screen-covering-noise) | Film grain grows into screen-covering noise, worst while time is frozen | Major | Fixed |

> Since the move to Vite (PART 2), the code lives in `src/`. Each entry gives the original `index.html` line (commit `953aa7c`) and, where known, the new file and line.

---

## BUG-001: Time never slows down

- **Severity:** Critical. It disables the game's core mechanic.
- **Status:** Fixed in the commit "Fix BUG-001: time slows down again when standing still"
- **Found in:** `953aa7c`
- **Where:** `index.html:6998` (call site), `index.html:6177` (function). After the move: `src/game/game.ts:336`, `src/game/time-scale-driver.ts:19`

### What happens
The world always runs at full speed while you play. Standing still should slow it to 1.5% (`TimeScaleDriver.MIN`), but it doesn't. The slow-motion effects (desaturation, longer bullet trails, muffled audio) never appear during play. You only see them with the F2 debug freeze and on the pause, title and results screens.

### Cause
The second and third arguments are passed in the wrong order:

```js
// index.html:6177, the signature
update(realDt, planarSpeed, maxSpeed, lookSpeed, airborne, busy)

// index.html:6998, the call
this.driver.update(dt, WALK_SPEED, this.player.planarSpeed, this.player.lookSpeed, !this.player.grounded, busy);
```

Inside the function, `moveInput = clamp(planarSpeed / maxSpeed, 0, 1)` therefore becomes `clamp(4 / actualSpeed, 0, 1)`:
- Standing still: `4 / 0 = Infinity`, which clamps to **1**.
- Walking at any speed up to 4 m/s: the result is at least 1, which clamps to **1**.

The target time scale is always 1, so time always runs at full speed.

### How to reproduce
1. Start any level and stand still without moving the mouse.
2. Expected: enemies and bullets almost freeze, and the image loses colour.
3. Actual: enemies keep walking and shooting at normal speed.

You can also turn on the FPS overlay and watch the HUD time-scale value, which stays at 1.

### Fix
Swap the two arguments:

```js
this.driver.update(dt, this.player.planarSpeed, WALK_SPEED, this.player.lookSpeed, !this.player.grounded, busy);
```

Better: change the signature to take a named object so the two speeds can't be swapped again, and add a test that standing still gives `MIN` and walking at full speed gives about 1.

**Applied** (the "better" version):
- `TimeScaleDriver.update` now takes a `PlayerActivity` object with named fields (`src/game/time-scale-driver.ts`), and `Game.frame` passes `planarSpeed` and `maxSpeed` by name (`src/game/game.ts`). A zero `maxSpeed` now counts as no movement instead of dividing by zero.
- Added `src/game/time-scale-driver.test.ts` (Vitest), with 7 tests: standing still gives `MIN`, full walking speed gives 1, half speed gives 0.5, time slows down again after stopping, turning the view gives at most 0.35, being airborne gives 0.8, and an action briefly gives full speed. The tests run in `npm test`, and `npm run build` now runs them before bundling.
- **Not verified in-game:** the browser pane I test in can't capture the mouse, and the game pauses time without it. Check by playing: standing still should nearly freeze enemies and bullets and drain the colour.

---

## BUG-002: Replay hand bob uses distance from the origin

- **Severity:** Minor (visual, replay only)
- **Status:** Fixed in the commit "Fix BUG-002: replay hand bob follows distance walked"
- **Found in:** `953aa7c`
- **Where:** `index.html:7115`. After the move: `src/game/game.ts:453`

### What happens
During a replay, the first-person hands bob in a way that doesn't match the player's walking. When the recorded player walks in a circle around the level's centre, the hands barely bob. When they walk toward or away from the centre, the hands bob even though nothing else differs.

### Cause
The hand bob is driven by `stride`, the total distance walked (`PlayerController.stride`, accumulated at `index.html:6141`, used as a phase at `index.html:6474`). In a replay, the code instead passes the recorded player's **distance from the world origin**:

```js
const stride = inReplay ? this.replay?.current ? Math.hypot(this.replay.current.pos[0], this.replay.current.pos[2]) : 0 : this.player.stride;
```

### Fix
Accumulate distance walked during the replay: add the distance between consecutive replay frames' `pos`, the same way `PlayerController.update` does from velocity. Alternatively, record `stride` in each player frame (`toFrame`) and use the recorded value.

**Applied** (the second option, recording `stride`). This gives exactly the same bob as live play, and it's one number per frame:
- `PlayerFrame` has a new `stride` field (`src/sim/types.ts`), which `PlayerController.toFrame` fills in (`src/sim/player-controller.ts`).
- In a replay, `Game.render` passes the current frame's recorded `stride` to the viewmodel (`src/game/game.ts`).
- Added a test in `src/sim/player-controller.test.ts` that the frame carries the distance walked, not the distance from the origin.
- **Not checked in a real replay:** making one means clearing a level, which needs mouse capture that the browser pane I test in can't provide.

---

## BUG-003: Every level is locked on a fresh save

- **Severity:** Critical. The game can't be played at all from a new save.
- **Status:** Fixed in the commit "Fix BUG-003: first level is always unlocked"
- **Found in:** `953aa7c` (found while checking the Vite build in PART 2)
- **Where:** `index.html:3717` (`Ui.isUnlocked`). After the move: `src/ui/ui.ts:325`

### What happens
On a first visit (no `stillframe.save` in local storage), clicking PLAY does nothing, and the LEVELS screen shows all 15 levels as LOCKED, including 1-1. There's no way to start the first level, so no level can ever be cleared, and nothing ever unlocks.

### Cause
```js
isUnlocked(index) {
  if (index < 0)
    return true;
  const prev = this.levels[index - 1];
  return !!prev && !!this.save.levels[prev.id]?.cleared;
}
```

The first level has index 0. The `index < 0` check doesn't catch it, and `this.levels[-1]` is `undefined`, so the function returns false. `Game.startLevel` (`index.html:6838`) checks `isUnlocked` first and silently returns.

### How to reproduce
1. Clear the site's local storage (or use a private window) and open the game.
2. Click PLAY. Expected: the 1-1 title card starts. Actual: nothing happens, and nothing appears in the console.
3. Click LEVELS. All levels show LOCKED.

I checked this in the browser on both the original single file and the Vite build, with the same result. Marking `1-1` as cleared in the save unlocks 1-2, which then plays normally.

### Fix
Treat the first level as always unlocked:

```js
if (index <= 0)
  return true;
```

**Applied** in `src/ui/ui.ts` (`Ui.isUnlocked`). I checked it in the browser after clearing local storage: LEVELS shows 1-1 unlocked and 1-2 still locked, and PLAY starts 1-1 with its title card and no console errors.

---

## BUG-004: Horizontal mouse look is reversed

- **Severity:** Major. The game is playable, but aiming is reversed horizontally.
- **Status:** Fixed in the commit "Fix BUG-004: horizontal mouse look turned the wrong way"
- **Found in:** `953aa7c` (reported by the user while playing)
- **Where:** `index.html:6095` (`PlayerController.look`). After the move: `src/sim/player-controller.ts`

### What happens
While playing, moving the mouse left turns the camera right, and moving it right turns it left. The gamepad's right stick is reversed the same way, because it feeds into the same mouse-delta value. Looking up and down is correct.

### Cause
```js
this.yaw += input.mouseDx * s.sensitivity;
```

The game's yaw convention gives a forward direction of `[-sin yaw, 0, -cos yaw]` (`dirFromYawPitch`, `Camera.forward`), so a *larger* yaw turns the view *left*. Adding the mouse's X movement means that moving the mouse right (a positive `mouseDx`) turns left.

### How to reproduce
1. Start any level and capture the mouse.
2. Move the mouse to the right. Expected: the view turns right. Actual: it turns left.

### Fix
Subtract instead of add:

```js
this.yaw -= input.mouseDx * s.sensitivity;
```

**Applied** in `src/sim/player-controller.ts`, with a comment explaining the sign. The viewmodel's sway (`-mouseDx`) already assumed the correct direction, so the hands now lag the right way when you turn.

Added `src/sim/player-controller.test.ts`: moving the mouse right turns the view toward the starting right direction, moving it left turns away from it, and pitch follows the Y-invert setting. With the old `+=` line, the two direction tests fail; with the fix, they pass. Not checked by playing, because the browser pane I test in can't capture the mouse.

---

## BUG-005: Film grain grows into screen-covering noise

- **Severity:** Major. It's visual, but it can make the screen unreadable.
- **Status:** Fixed in the commit "Fix BUG-005: stable film grain, added after gamma"
- **Found in:** `953aa7c` (reported by the user while playing)
- **Where:** `index.html:1086` (`grainHash`) and `index.html:1127` (where grain is applied), in the `final` shader. After the move: `src/gfx/shaders/final.wgsl`

### Intended or not?
**Partly intended.** When time freezes, `Game.updatePost` deliberately strengthens a "still frame" look: `freeze = 1 - timeScale` raises grain (0.025 → 0.055), chromatic aberration (up to 0.6), colour loss and vignette. The Reduce Motion setting turns grain and aberration off, which shows they're a designed feature. These strengths are subtle. Noise that covers the screen isn't intended; it comes from the two defects below. The frozen-time audio drone is a low sine hum (41 and 62 Hz), not the "sizzle".

### What happens
When the player stops, dark areas fill with bright, fizzing speckle. After a few minutes of play, the noise turns into large flickering blotches that can cover the whole screen.

### Cause
1. **The hash loses precision over time.** The grain uses `fract(p * vec2f(123.34, 456.21))` on `pixel + time * (61, 17)`, in 32-bit floats. As real time grows, the inputs become too large for `fract` to keep any precision. Emulating the shader in 32-bit floats on a 64×64 patch:

   | Real time | Distinct noise values (of 4096 pixels) |
   |---|---|
   | 5 s | 958 |
   | 60 s | 403 |
   | 5 min | 10 (flat blotches) |
   | 20 min | 1 (a constant) |

2. **Grain is added before gamma encoding.** `mapped += g * grain` runs before `pow(…, 1/2.2)`. Near black, that pow amplifies small values hugely: in a pixel at 0.01 linear, the grain comes out about 6 times stronger than at mid-grey, and in pure black a +0.0275 grain value becomes 0.19 on screen. This game's image is mostly near-black, so the grain looks like sizzle instead of the subtle texture its strengths suggest. Freezing time doubles the grain strength, which is why it appears "when I stop".

### Fix
- Replaced the float hash with a PCG integer hash of the whole-pixel coordinate and a frame counter (`u32(time * 60)`). In the same emulation it stays uniform at every time tested (about 985 of 4096 distinct values, spread 0.289, which is ideal for uniform noise), including after 24 hours, and it changes every frame.
- Grain is now added after gamma encoding, so it's equally strong at every brightness.
- The grain and aberration strengths are unchanged, so the intended frozen look stays.

Checked in the browser: the shader compiles with no warnings, and the title screen (which uses the frozen look at 0.6 strength) shows fine, even grain in its dark areas. Not checked during a long play session, because playing needs mouse capture that the browser pane I test in can't provide.
