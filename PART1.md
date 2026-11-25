# PART 1: Reading STILLFRAME (`index.html`)

All line numbers refer to the unmodified `index.html` in commit `953aa7c`.

---

## 1. What kind of game is this?

**STILLFRAME** is a single-player **first-person action shooter** that runs in the browser on **WebGPU**. The whole game is one 7,421-line HTML file: CSS, DOM UI, WGSL shaders and a module script. Its only runtime dependency is `wgpu-matrix`, loaded from jsDelivr (line 505). Without WebGPU, the game shows a "WebGPU required" screen (`showUnsupported`, line 623).

The look is stylized: dark rooms, lit by key and fill lights with shadow maps, with ink outlines (a depth/normal edge pass), bloom and ACES tonemapping. Enemies are glowing, translucent purple **glass figures** that **shatter** when they die (`FxSystem.shatter`, line 6300).

### Content
- **15 levels in 3 acts** (`LEVELS`, line 3388). Act 1 is a transit system (platform, carriage, turnstiles, escalator, last train), Act 2 is an office tower (lobby, elevator, cubicles, server room, boardroom), and Act 3 is the rooftops (ledge, skylight, crane, helipad, spire).
- Each level is declared as data: a player spawn, props on the floor, a list of enemy **waves** with trigger conditions, an optional **exit** rectangle, an RNG seed, and the title-card words. Geometry is built as boxes with the `LevelBuilder` DSL (line 2509).
- Clearing a level unlocks the next one. Progress, best real-time scores and settings are saved to `localStorage` under `stillframe.save` (line 3735).

### What the player is trying to do
- **Kill every enemy in every wave** (`World.checkWin`, line 5775). Some levels instead ask you to **reach the exit**, either freely or only once the level is cleared (`exit.requiresClear`).
- **One hit kills you.** Any enemy bullet or melee strike calls `killPlayer` (lines 5194, 6007). Falling off the map below y = -6 also kills you. You restart the level instantly ("AGAIN.").
- The score is the **real (wall-clock) time** the clear took (`runRealTime`; the results screen compares it with `best`). Simulated time is shown next to it.
- After a clear, you can watch a **replay** of the run in real time (`ReplayRecorder` and `ReplayPlayer`, line 6571).

### Enemies (`ENEMY_PARAMS`, line 4826)
| Kind | Behaviour |
|---|---|
| walker | Slow, keeps about 6 m away, inaccurate pistol fire |
| rusher | Fast, unarmed, closes in for a telegraphed melee strike |
| marksman | Slow, keeps its distance, fires a carbine after a visible **laser telegraph** |

Enemies have 2 HP. A bullet kills them outright. A punch or a thrown prop that doesn't hit the head **disarms** them first, and the dropped gun becomes a prop you can pick up. Unarmed enemies look for guns on the floor (`findGunPropFor`, line 5643).

### Weapons and props (`WEAPONS`, line 4795)
- **Pistol** (6 rounds), **scatter** (3 shells, 5 pellets each), **carbine** (12 rounds, 3-round bursts), **blade** (melee, and it can **slice bullets** out of the air).
- Bottles, bricks and mugs are things to throw. Bottles and mugs break on impact.
- **There is no reloading.** When a gun is empty, clicking throws it ("EMPTY — CLICK TO THROW").
- Bullets are real projectiles moving at 25 m/s, not instant hitscan. Two bullets can collide and cancel out (the `bulletClash` event).

### Controls (`DEFAULT_BINDINGS`, line 1876 and `GAMEPAD_BUTTONS`, line 1896)
| Action | Keyboard/mouse | Gamepad (standard mapping) |
|---|---|---|
| Move | WASD / arrow keys | Left stick |
| Look | Mouse (pointer lock, raw input requested) | Right stick |
| Fire / punch / grab item in reach | Left mouse button | Right trigger |
| Throw held item | Right mouse button | Left trigger |
| Pick up / swap item | E | X / Square |
| Jump | Space | A / Cross |
| Restart level | R | Y / Triangle |
| Pause | Esc (and losing pointer lock pauses too) | Start |
| Debug tools | F1 camera, F2 freeze time, F3 real-time, F4 overlay | none |

You click the canvas to capture the mouse. The settings screen covers FOV, sensitivity, invert-Y, volumes, resolution scale and auto-resolution, post quality, FPS overlay, reduce-motion and crosshair size.

---

## 2. The mechanic that sets it apart: time moves when you move

The first level's title card says it outright: `["TIME", "MOVES", "WHEN", "YOU", "MOVE."]` (line 2617).

The **world's clock is driven by the player's input**. While you stand still, enemies, bullets, props and particles run at **1.5% speed** (`TimeScaleDriver.MIN = 0.015`). When you move, time speeds up to full rate. The player's own body and view always run in **real time**, so you can stop, look around a frozen room, read the bullet trails and plan a path through them.

How it works (`TimeScaleDriver.update`, line 6177):

```
target = max( walking speed / max speed,            // moving → up to 1.0
              look speed / 900 px/s × 0.35,         // turning the camera → up to 0.35
              1 if an action just happened (0.12 s kick) or a burst is firing,
              0.8 if airborne )                     // jumping commits you
value  = smooth approach toward target              // rises with τ = 0.05 s, falls with τ = 0.10 s
```

The game then feeds `value` into `Time.timeScale`. Every frame, `simDt = realDt × timeScale` goes into a fixed 120 Hz simulation (`Time.advanceSim` and `consumeStep`).

The rest of the game is built around this mechanic:
- **Scoring uses real time.** Standing still is safe but costs you, so the game rewards decisive movement over camping.
- **Rendering shows the freeze.** `updatePost` (line 7216) sets `freeze = 1 - timeScale`. Freeze drives desaturation (enemies stay saturated through a mask in the normal buffer's alpha channel), chromatic aberration, vignette and grain. Bullet trails get longer as time slows (`trailLen = 0.6 + 5 * (1 - ts)`, line 7148), so you can read where each shot is going.
- **Audio slows down too.** The playback rate of each sound is scaled by the time scale, and music is low-pass filtered as time slows (`AudioEngine.setTimeScale`, line 2278). A drone fades in when time is nearly frozen.
- **The world is deterministic, so replays work.** Simulation randomness all comes from a seeded per-level `Rng`. Cosmetic effects use a separate `visualRng`. Because of that, `ReplayPlayer` can rebuild a run from the recorded player frames plus the number of fixed steps taken in each frame.

> ⚠️ **In this build the mechanic is broken.** See design problem #1: two arguments are passed in the wrong order, so time never slows down.

---

## 3. Code map: subsystems, what they own, and how they depend on each other

The script is a **bundler's output** (`var X = class`, renamed duplicates such as `GRAVITY2` and `GRAVITY3`, `WHITE2` and `WHITE3`, `scale2`, `m2`). The original modules are still easy to tell apart. They are listed below in file order.

| # | Subsystem | Lines | What it's responsible for |
|---|---|---|---|
| 1 | **Gfx** | 507–630 | Requesting the WebGPU adapter and device, configuring the canvas context, DPR- and resolution-scale-aware resizing (`ResizeObserver`), device-loss callback, `UnsupportedError` and `showUnsupported` |
| 2 | **Mesh** | 632–665 | Vertex layout (10 floats: pos, normal, color, emissive) and GPU vertex/index buffers |
| 3 | **Shaders (WGSL)** | 666–1134 | `common`, `scene` (lit and shadowed, with fog and rim light), `shadow`, `glass` (refractive enemy material that samples a copy of the HDR target), `fx` (camera-facing segments and sparks), `outline` (depth/normal edges), `bloom` (prefilter, down and up passes), `final` (ACES, chromatic aberration, selective desaturation, vignette, threat pulse, grain, gamma) |
| 4 | **Renderer** | 1135–1833 | Builds the pipelines, keeps per-mesh **instance buckets** in 3 layers (opaque, glass, viewmodel), queues segments, and encodes the whole frame's passes |
| 5 | **Camera** | 1834–1874 | Yaw and pitch, conversion from horizontal FOV, view, projection and view-projection matrices |
| 6 | **Input** | 1876–2054 | Keyboard, mouse and gamepad, mapping physical codes to actions through bindings, latching edges per frame (`wasPressed` and `wasReleased`), pointer lock, mouse-delta accumulation |
| 7 | **Time and Loop** | 2056–2156 | `requestAnimationFrame` driver, clamped real dt, **time scale** and debug time locks, a fixed-step accumulator at 120 Hz (at most 8 steps per frame), an interpolation alpha |
| 8 | **Math utils** | 2158–2232 | Small array-based `v3` helpers and angle helpers |
| 9 | **AudioEngine and SYNTHS** | 2233–2508 | WebAudio graph, procedurally **synthesized** sound effects and music (no audio files), panning by position, pitch and filter tied to the time scale |
| 10 | **Level data** | 2509–3394 | `LevelBuilder` box DSL, 15 level definitions (meta plus build function), `ACT_NAMES` |
| 11 | **Ui** | 3395–3734 | DOM screens (title, level select, settings, pause, results, replay bar), title cards, HUD (ammo, item, hint, level info), lock hint. It talks back to the game only through a `handlers` callback object |
| 12 | **Save** | 3735–3777 | Versioned `localStorage` save with settings merged over defaults |
| 13 | **DebugOverlay** | 3779–3815 | FPS and statistics text in a corner |
| 14 | **MeshBuilder and THEMES** | 3816–3996 | CPU geometry builder (boxes, tapered boxes), materials and lighting per theme |
| 15 | **StaticWorld** (physics) | 3997–4304 | Uniform 2 m XZ grid over the level's AABBs, raycast, character movement with step-up, sphere resolution for props, segment-vs-sphere and segment-vs-capsule tests |
| 16 | **NavGrid** (AI pathing) | 4305–4582 | A 0.5 m walkability grid baked from `StaticWorld`, A* with a binary heap, path smoothing |
| 17 | **Level mesh and mesh library** | 4583–4791 | Merges a level's boxes into one static mesh, and builds the meshes for enemy body parts, items, shards and the viewmodel. Also `Rng` and `visualRng` |
| 18 | **Gameplay constants and enemy AI** | 4792–5197 | Weapons, items, enemy parameters, `createEnemy` and the `updateEnemy` state machine (seek, keep distance, aim, telegraph, shoot or melee, stun, pick up guns) |
| 19 | **World** (simulation) | 5198–6063 | **The authoritative game state**: player combat state, enemies, props, projectiles, waves and spawning, hits and deaths, win and fail flags, and an **`events` queue** that the presentation layer consumes |
| 20 | **PlayerController** | 6064–6159 | Real-time first-person movement and look, collision through `StaticWorld`, pushing apart from enemies, packing a player **frame** (`toFrame`) |
| 21 | **TimeScaleDriver** | 6161–6190 | **The signature mechanic**: turns movement, look and action intensity into a world time scale |
| 22 | **FxSystem** | 6192–6454 | Cosmetic particles and rigid-body glass **shards** that collide with `StaticWorld` |
| 23 | **Viewmodel** | 6455–6570 | First-person hands and weapon, sway and bob, punch, throw and recoil animation |
| 24 | **Replay** | 6571–6621 | Records per-frame player frames and step counts, and plays them back into a **new `World`** |
| 25 | **Pose** | 6623–6695 | Procedural skeletal pose for enemies (walk, aim, melee, stun, spawn) as matrices per body part |
| 26 | **Game** | 6696–7387 | The **orchestrator**: owns everything above, runs the state machine (`title`, `intro`, `playing`, `paused`, `dead`, `cleared`, `results`, `replay`), loads levels, routes events to audio and effects, chooses the camera, sets post-processing parameters, feeds the HUD, adjusts resolution automatically |
| 27 | **boot** | 7394–7421 | Creates `Gfx`, then creates `Game` and starts it, with error and device-loss handling |

### Dependency graph

```
                                 boot
                                  │
                       ┌──────────┴───────────┐
                       ▼                      ▼
                      Gfx ◄──────────────── Game  (owns everything below; the only "glue")
                       ▲                      │
          ┌────────────┤   ┌──────┬───────┬───┴───┬─────────┬──────────┬──────────┬────────┐
          │            │   ▼      ▼       ▼       ▼         ▼          ▼          ▼        ▼
       Renderer ◄──────┘ Input  Loop/   Ui     Audio    PlayerCtrl  TimeScale   Replay*  Save
        │  ▲  ▲                 Time  (DOM)   Engine        │        Driver       │
        │  │  │                        ▲                    │                     │
  shaders  │  │      callbacks ────────┘                    ▼                     ▼
  Mesh     │  │                                ┌───────► World ◄──────────────────┘
  Camera   │  │                                │       │   │   │
           │  │                                │       ▼   ▼   ▼
           │  │                                │  StaticWorld NavGrid  Rng
           │  │                                │       ▲   (built from StaticWorld)
           │  │                                │       │
           │  └── FxSystem ─────── reads ──────┼───────┘ (shards collide with level)
           │      Viewmodel                    │
           └──── MeshBuilder / mesh library    └── level data (LEVELS, THEMES)
                 Pose (computePose)
```

The important points:
- **The simulation and the presentation are mostly separate.** `World` never touches the renderer, audio or DOM. It pushes plain-object **events** (`shot`, `impact`, `enemyDeath`, `bulletClash` and so on). `Game.handleEvent` (line 7281) turns them into sounds and particles. That's why a replay can run a second `World` with no side effects.
- **`Renderer` knows nothing about gameplay.** It only takes `drawMesh(mesh, matrix, tint, …, layer)` and `drawSegment(p0, p1, …)` calls, then `render(camera, vmCamera, post, time)`.
- **`Ui` is decoupled through callbacks** (`onPlayLevel`, `onResume` and so on). It reads `save` and `LEVELS`.
- **`World` depends on `StaticWorld` and `NavGrid`.** Both are expensive to build, so the game builds them once per level and passes them into later `World`s (restarts, replays) through `staticData` and `sceneCache`.
- **`Game` is the hub.** Every other subsystem is a leaf it calls. Almost all the coupling sits in this one ~680-line class (see design problem #2).

---

## 4. One frame, from a key press to pixels on screen

Scenario: you're **playing**, standing still (in a working build time is at 1.5%), and you press **W**.

### 0. Between frames: the browser event
1. `keydown` fires on `window` and goes to `Input.onKeyDown` (line 1996). Function keys, Space and Tab have their browser defaults prevented. `press("KeyW")` adds the code to `down` and to `pressedRaw` (line 1984).
   The capture-phase listener in `Game`'s constructor also calls `audio.unlock()` (line 6784).
   Nothing else happens yet. Input is **latched**, not acted on.

### 1. `requestAnimationFrame` calls `Loop.tick(now)` (line 2143)
2. `Time.beginFrame(now)`: `realDt = clamp((now - lastNow)/1000, 0, 0.1)`. A long stall (tab switch, GC pause) can't produce a huge step. `frame` goes up by one and `stepsThisFrame` resets to 0.

### 2. `Game.frame(t)`: per-frame, real-time logic (line 6957)
3. `input.update(realDt)` moves `pressedRaw` into `pressedFrame` (the edges for this frame), copies the accumulated mouse delta into `mouseDx` and `mouseDy`, and polls the gamepad.
4. `ui.update(dt)` advances title-card timers. Debug keys F2, F3 and F4 are checked.
5. The `switch (state)` reaches `"playing"`, the pointer is locked and R wasn't pressed, so the game calls:
   - **`player.update(input, realDt, world, look, true)`** (line 6101):
     - `look()` applies the mouse delta × sensitivity to yaw and pitch, and computes `lookSpeed`.
     - `input.moveAxes()` sees `isDown("moveForward")`, because `KeyW` is in `down`, so `axes.y = 1`.
     - The wish velocity is forward × 4 m/s. Velocity accelerates toward it at 30 m/s² (on the ground), and gravity applies.
     - `world.static.moveCharacter(...)` resolves collisions axis by axis against the AABB grid, with step-up. The player is then pushed apart from any overlapping enemy.
     - All of this runs in **real time, outside the fixed step**. Your own body is never slowed down.
   - `player.toFrame(fire, throw, interact)` packs position, velocity, yaw, pitch, grounded and this frame's action edges into a **player frame**.
   - **`world.applyPlayerFrame(f)`** (line 5302) copies that pose into the simulation's `world.player`, raycasts for the prop under the crosshair (`aimProp`), and runs actions immediately (fire, throw, pick up). Those can spawn projectiles and push events. It returns `acted`.
   - `recorder.push(f)` stores the frame for the replay.
   - `driver.actionKick()` runs if the player acted. Then **`driver.update(...)`** works out the new time scale. In a working build, the walking speed rising from 0 toward 4 m/s pushes `target` toward 1. The player reaches walking speed in about 0.13 s (acceleration 30 m/s²), and the time scale follows with the rise constant τ = 0.05 s, so the world is close to full speed about 0.2 s after you press W.
   - The result is written to `t.timeScale`. `runRealTime += realDt` (this is the score).

### 3. Fixed-step simulation (back in `Loop.tick`)
6. `Time.advanceSim()`: `simDt = realDt × effectiveScale()` (debug F2 and F3 locks override the scale), and `accumulator += simDt`.
7. `while (consumeStep())` hands out 1/120 s steps, at most 8 per frame, dropping any backlog. At a 1.5% scale this means one step every ~55 frames. At full scale it's 2 steps per 60 Hz frame.
   Each step calls **`Game.fixedStep()`**, which calls **`World.step(1/120)`** (line 5676):
   - `savePrev` on enemies and props (for interpolation), then cooldowns and player burst fire
   - `updateWaves` and `flushSpawnQueue` (spawn conditions)
   - `updateEnemy` for each enemy: perception, NavGrid A* pathing, aiming, telegraph, firing (`fireVolley`), melee
   - `stepProps`: thrown items, gravity, bouncing, head hits, breaking
   - `stepProjectiles`: moves bullets, tests them against walls, capsules and spheres, kills the player or enemies, handles bullet clashes and blade slices
   - `removeDead`, then `checkWin` sets `cleared` or `failed`
8. `Time.endSteps()`: `alpha = accumulator / FIXED_STEP`, the interpolation factor between the last two simulation states.

### 4. `Game.render(t)`: presentation (line 7038)
9. The step count is recorded on the last replay frame (`setLastSteps`). The game also changes state here: if `world.failed` it calls `enterDead`, and if `world.cleared` it calls `enterCleared`.
10. **`handleEvents(world)`** drains `world.events`. Each event becomes `audio.play(...)`, which is pitched and pitch-scaled by the time scale and panned by position, plus `fx.*` particle spawns (sparks, muzzle flashes, shatter). A rising telegraph edge plays the "charge" sound.
11. `fx.update(simDt, world.static)` moves particles and shards in **simulated** time, so the frozen world also freezes the debris. `updateAutoResolution` averages frame time over 2 s and adjusts `gfx` resolution scale between 0.5 and 1.
12. **Camera**: the eye is the player's position plus 1.6 m (in a replay it's the recorded frame, on the title screen an orbit). `camera.update()` rebuilds the view, projection and view-projection matrices. A second `vmCamera` with a fixed 54° FOV is used for the hands. The audio listener and audio time scale are updated.
13. **Building the draw lists. Nothing touches the GPU yet.**
    - `drawWorld(world, alpha, ts, realTime)`: the static level mesh, every prop (position and rotation **interpolated** with `alpha`), every enemy (`computePose` gives about a dozen body-part matrices, queued on the **glass** layer), every projectile as two `drawSegment`s (the trail grows as `ts` falls, plus a bright core), and marksman lasers (a raycast for their length).
    - `fx.draw(...)`: particles become segments and shards become instanced meshes.
    - `viewmodel.update(realDt, ...)` and `.draw(...)`: hands and weapon on the **viewmodel** layer, swaying with the mouse delta and bobbing with stride.
    - `Renderer.drawMesh` appends 24 floats (model matrix, tint, emissive, flash, extra, highlight) to that mesh's **bucket** in its layer, growing the bucket if needed.
14. `updatePost(world, ts, realDt)`: `freeze = 1 - ts` drives desaturation, aberration, grain and vignette. The flash fades out. `incomingThreat` (enemy bullets near you, active telegraphs) is smoothed into `post.threat`.
15. **`renderer.render(cam, vm, post, realTime)`** (line 1476):
    - `getCurrentTexture()` gets the swap-chain image. `ensureTargets` (re)creates the HDR, normal, depth, HDR-copy, composite and bloom-mip textures when the size changes.
    - `packInstances()` concatenates all buckets into one staging array, records a `{mesh, first, count}` batch for each, and does one `writeBuffer`. `writeFrame` writes two frame uniform blocks (world and viewmodel, including light view-projection and fog). `writeFxFrame`, `writePost` and the segment buffer upload follow.
    - **One command encoder, in this pass order:**
      1. **shadow**: depth-only 2048² map of opaque and glass instances (skipped on low quality)
      2. **opaque**: fills the HDR `rgba16float` and normal targets plus `depth32float`. Normal alpha marks enemies and glass for later passes
      3. `copyTextureToTexture` HDR → `hdrCopy`, then **glass**: the enemies, refracting the copy (fresnel, specular, pulse)
      4. **fx**: every segment and particle in **one instanced draw** (`draw(6, segmentCount)`)
      5. **viewmodel**: depth is cleared and the hands drawn with the vmCamera uniforms, so they never clip into walls
      6. **outline**: full-screen triangle, depth and normal edge detection, composited into `comp`
      7. **bloom**: prefilter, then 4 downsamples and 4 upsamples with additive load (or a clear on low quality)
      8. **final**: chromatic aberration, desaturation of everything **except enemies**, ACES tonemap, flash, vignette, threat pulse, grain and sRGB gamma, written into the **swap-chain texture**
    - `device.queue.submit([encoder.finish()])`. The instance buckets and segment count reset for the next frame.
16. `updateHud(world, ts)` writes the DOM HUD (ammo pips, item name, interaction hint, enemies left) through `ui.updateHud`. The debug overlay updates if it's visible.

### 5. Back in `Loop.tick`
17. `requestAnimationFrame(this.tick)` schedules the next frame. After this callback returns, the browser composites the canvas's swap-chain texture together with the DOM overlay (HUD, crosshair) and presents it at the next vsync. **That is when the pixels from pressing W appear.** The latency is one rAF frame plus the compositor, because input is sampled at the start of the same frame that renders it.

---

## 5. Design problems I'd fix

### 1. The core mechanic is broken by arguments passed in the wrong order
**Where:** `Game.frame`, line 6998, calling `TimeScaleDriver.update` at line 6177.

```js
// signature
update(realDt, planarSpeed, maxSpeed, lookSpeed, airborne, busy)
// call site
this.driver.update(dt, WALK_SPEED, this.player.planarSpeed, this.player.lookSpeed, !this.player.grounded, busy);
//                     ^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^  swapped
```

Inside the driver, `moveInput = clamp(planarSpeed / maxSpeed, 0, 1)` becomes `clamp(4 / actualSpeed, 0, 1)`. Standing still gives `4 / 0 = Infinity`, which clamps to **1**. Walking slowly gives a value above 1, which also clamps to **1**. The target time scale is therefore **always 1**. The world runs in real time no matter what you do. The bullet-dodging, desaturating, slow-motion game the title card promises doesn't exist in this build. You only see the freeze with the F2 debug lock or on the pause and title screens.

**Why it hurts:**
- It silently disables **the one feature that sets the game apart**. There's no crash and no warning. The game just plays like an ordinary, very hard shooter.
- The root cause is structural, not a typo. The function has a **six-parameter positional signature** with four numbers of similar meaning next to each other, and JavaScript has no types to catch a swap. The same kind of bug will happen again elsewhere.

**Fix:** pass a named object (`driver.update({ realDt, speed, maxSpeed, lookSpeed, airborne, busy })`) or let the driver read the `PlayerController` directly. Add a unit test that standing still gives `MIN` and walking at full speed gives about 1. With a test, this bug would have been caught right away.

### 2. `Game` is a god object, and the state machine is spread out as string checks
**Where:** `Game` (lines 6704–7387), about 680 lines with more than 30 fields.

`Game` handles the state machine, level loading and caching, settings and saving, pointer-lock and visibility policy, choosing the camera for each mode, HUD formatting, post-processing parameters, event-to-audio and effects routing, enemy pose drawing, auto-resolution, and replay control. The state is a **plain string**, and each method decides on it separately:
- `frame()` has its own `switch (this.state)`.
- `render()` checks `state === "playing"` to **change state** (`enterDead` and `enterCleared` run from inside **render**), and checks `"title" || "results" && !this.lastResults` (an `&&`/`||` precedence trap) to choose the camera.
- `showViewmodel`, `audio.setTimeScale`, `updatePost`, `updateHud` and `incomingThreat` each have their own list of states that matter.

**Why it hurts:**
- Adding a state (for example a "checkpoint" or "photo mode") means finding and editing about 8 scattered conditions. Missing one produces subtle bugs: hands showing in the wrong mode, wrong audio filtering, the HUD showing over a menu.
- Changing game state from inside the **render** path breaks the update and render separation. Rendering can't be skipped or throttled (in a background tab, a headless test, or a second view) without changing gameplay.
- The class can't be tested without a GPU device, a DOM and `localStorage`, because everything is constructed in `Game`'s constructor.

**Fix:** use explicit state objects (`PlayingState`, `ReplayState` and so on, each with `enter`, `exit`, `frame` and `view`). Move transitions out of `render`. Pull out a `PresentationDirector` (camera, post and HUD) and an `EventRouter` (events to audio and effects). Inject dependencies instead of constructing them inside.

### 3. The player has two sources of truth, and the player runs outside the fixed timestep
**Where:** `PlayerController` (line 6071) runs in `Game.frame()` at variable `realDt`. `World.player` (line 5256) is overwritten every frame by `applyPlayerFrame` (line 5302).

The player's position, velocity, yaw, pitch and grounded flag exist **twice**: once in `PlayerController`, which owns movement and collision, and once in `world.player`, which the simulation's enemy AI, bullet hits and win check read. A one-way copy keeps them in sync once per rendered frame. Player movement also uses **variable real dt** and **different constants** from the rest of the simulation: player gravity `GRAVITY3 = 16`, enemy gravity `GRAVITY = 18`, prop gravity `GRAVITY2 = 16`.

**Why it hurts:**
- **Frame-rate-dependent gameplay.** The player moves and resolves collisions once per display frame, while enemies and bullets move in 1/120 s steps. Above 120 Hz you get several player moves per step, and below 120 Hz several steps happen between player moves, so for those steps the AI aims at and bullets test against a stale player position. The player-vs-enemy push-apart is resolved only from the player's side, at frame rate. Results differ between a 60 Hz and a 144 Hz monitor.
- **Fragile replays.** Replays only reproduce a run because the recorder stores the step count and the copied player pose for each frame. Any new player field that the simulation reads but `toFrame` and `applyPlayerFrame` don't copy will **desync replays without any error**.
- **The data can contradict itself.** Two copies of "where the player is" can disagree. `Game.render` reads `this.player`, while the HUD and threat checks read `world.player`, and the code never states which one is authoritative.

**Fix:** give `World` sole ownership of player state. Turn input into an **intent** per fixed step (a move vector, look delta and action edges) and run player movement inside `World.step`. A replay then only has to record those intents. Keep mouse look in real time for responsiveness if needed, but have the simulation read it as input, not as a pose it overwrites. Put shared physics constants in one place.

### 4. A 7,400-line bundled file is the source of truth, with name collisions and magic numbers
**Where:** the whole file. Examples: `GRAVITY` and `GRAVITY2` and `GRAVITY3`, `MAX_PITCH` and `MAX_PITCH2`, `WHITE`, `WHITE2` (an sRGB hex color) and `WHITE3` (`[1,1,1]`), `lerp` and `lerp2`, `scale2`, `m2`, `tmp2`. Magic thresholds sit inline everywhere (`1 / 52`, `1 / 75`, `2.2 * 2.2`, `-6`, `1.4`, `0.35`).

**Why it hurts:**
- Bundler-renamed duplicates mean **concepts that look the same have drifted apart**. Player gravity (16) and enemy gravity (18) differ, possibly on purpose, possibly not, and nobody reading the file can tell. There are two different pitch clamps.
- There are no module boundaries, no types and no tests. Every change is a search-and-pray. Problem #1 is exactly the kind of bug TypeScript, a named-parameter API or a five-line test would catch.
- Changes are very hard to review in git: one file and huge diffs. Shaders live in template strings with no syntax checking until runtime (`getCompilationInfo` only logs errors).

**Fix:** treat the original sources as the source of truth again: separate ES modules (`gfx/`, `sim/`, `ai/`, `ui/`, `levels/`), `.wgsl` files, TypeScript with `strict`, and one constants module. Build the single-file HTML as an output artifact.

### 5. A third-party injected script and an unpinned CDN import (security and hygiene)
**Where:** line 8 and line 505.

Line 8 is a `<script src="https://gc.kis.v2.scr.kaspersky-labs.com/.../main.js?attr=…">`. This is **antivirus web-protection injection** that got saved into the file, probably when the page was saved from a browser running Kaspersky. It carries a per-machine identifier, loads code from a third-party host for **every player**, and has nothing to do with the game. Separately, `wgpu-matrix` loads from jsDelivr at runtime with **no Subresource Integrity hash** and no local fallback.

**Why it hurts:**
- Any player's browser runs code from a third party the project doesn't control, and it leaks a user-specific token. In a shipped game that's a privacy and supply-chain liability, and it would break any Content Security Policy.
- The game won't start offline or if the CDN fails, and a compromised CDN copy of the math library would run with full page privileges.

**Fix:** remove the injected tag, vendor or bundle `wgpu-matrix` (or at least add `integrity` and `crossorigin`), and add a CSP that only allows the page's own origin.

### Smaller issues worth noting
- **Allocations in the hot path.** `render()` and `drawWorld()` allocate `v3()` arrays, a fresh pose-parameter object for each enemy, `{ ...f }` copies for each replay frame, and a `new Set()` per frame for telegraphs. That's minor, but it means steady GC pressure in a game that relies on smooth frame pacing.
- **`MAX_STEPS_PER_FRAME` silently drops time.** When the simulation falls behind, `consumeStep` zeroes the accumulator with no log or counter, so a slow machine quietly plays a different (slower) game.
- **Event routing is a 70-line `switch` on string types.** Nothing checks the types, so a typo in `type: "bulletClsh"` in `World` simply plays no sound and shows no effect.
