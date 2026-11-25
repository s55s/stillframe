# Bug log

Bugs found in STILLFRAME (`index.html`). Line numbers refer to `index.html` as of the commit noted on each entry.

**Status values:** Open · Fixed (with commit) · Won't fix (with reason)

| # | Summary | Severity | Status |
|---|---|---|---|
| [BUG-001](#bug-001-time-never-slows-down) | Time never slows down: swapped arguments to `TimeScaleDriver.update` | Critical | Open |
| [BUG-002](#bug-002-replay-hand-bob-uses-distance-from-the-origin) | Replay hand bob uses distance from the world origin instead of distance walked | Minor | Open |
| [BUG-003](#bug-003-every-level-is-locked-on-a-fresh-save) | Every level is locked on a fresh save, so the game can't be started | Critical | Fixed |

> Since the move to Vite (PART 2), the code lives in `src/`. Each entry gives the original `index.html` line (commit `953aa7c`) and, where known, the new file and line.

---

## BUG-001: Time never slows down

- **Severity:** Critical. It disables the game's core mechanic.
- **Status:** Open
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

---

## BUG-002: Replay hand bob uses distance from the origin

- **Severity:** Minor (visual, replay only)
- **Status:** Open
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
