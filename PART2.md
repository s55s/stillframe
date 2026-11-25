# PART 2: From one HTML file to a Vite + TypeScript project

## What changed

| Before | After |
|---|---|
| One 7,421-line `index.html` (CSS, WGSL, game code) | `index.html` (18 lines) + `src/` with 35 TypeScript modules, 9 `.wgsl` shaders, 1 stylesheet |
| `wgpu-matrix` loaded from jsDelivr at runtime | `wgpu-matrix@3.4.2` as an npm dependency, pinned to the exact version the CDN served |
| An injected antivirus `<script>` (Kaspersky) on line 8 | Removed. It wasn't part of the game (see PART1, design problem 5) |
| No type checking | `tsc --noEmit` passes with `strict` on (with two exceptions, see below) |
| No tooling | `npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`, plus F5 in VS Code |

**Behaviour is intentionally unchanged.** This was a move, not a fix: the three bugs in [BUGS.md](BUGS.md), including the one that locks every level on a fresh save, are still there. Each one should be fixed in its own small commit that can be reviewed, instead of being buried in a 7,000-line move.

## How to run it

```powershell
npm install
```

In VS Code, open **Run and Debug**, pick a configuration and press **F5**:

| Configuration | What it does |
|---|---|
| **Dev server (Vite, hot reload)** | Runs `npm run dev` (port 5173), waits until Vite is ready, then opens Chrome with the debugger attached |
| **Production build (vite build + preview)** | Runs `npm run build` (type check + bundle), then `npm run preview` (port 4173), then opens Chrome with the debugger attached |

Breakpoints set in any `src/**/*.ts` file bind in both modes. Vite serves source maps in dev, and `vite.config.ts` turns on `build.sourcemap` so the minified production bundle maps back to the same `.ts` files. Stopping the debug session stops the server (the `stop servers` post-debug task). `node_modules` is in `skipFiles`, so stepping doesn't wander into the matrix library.

The config files are [.vscode/launch.json](.vscode/launch.json) and [.vscode/tasks.json](.vscode/tasks.json). The server tasks are background tasks whose problem matcher waits for Vite's `Local:` line before the browser opens. `NO_COLOR=1` keeps colour codes from splitting that line.

## The layout

```
index.html                 page shell: canvas, overlay, WebGPU-missing message, <script src="/src/main.ts">
src/
  main.ts                  boot: create Gfx, create Game, start; WebGPU errors → message
  core/                    engine basics; no game knowledge, no GPU
    loop.ts                Time (real dt, time scale, fixed 120 Hz step) + Loop (requestAnimationFrame)
    input.ts               keyboard/mouse/gamepad → named actions, per-frame edges, pointer lock
    math.ts                v3 helpers, clamp/lerp/approach, angles
    rng.ts                 seeded Rng + visualRng (cosmetic randomness only)
    save.ts                localStorage save/load, default settings
  gfx/                     WebGPU rendering; knows meshes and passes, not enemies or levels
    gfx.ts                 device, canvas, resize, UnsupportedError
    renderer.ts            pipelines, instance buckets, the frame's render passes
    camera.ts              view/projection matrices
    mesh.ts                GPU vertex/index buffers
    mesh-builder.ts        CPU geometry builder (boxes, tapered boxes), srgbHex
    shaders/*.wgsl         common, scene, shadow, glass, fx, post, outline, bloom, final
  audio/
    audio-engine.ts        WebAudio graph, positional playback, time-scale pitch/filter
    synths.ts              procedural sound effects and music (no audio files)
  levels/                  content: data, not code paths
    level-builder.ts       LevelDef/Wave/EnemySpawn types + the box-building DSL
    act1-transit.ts        5 levels
    act2-office.ts         5 levels
    act3-rooftops.ts       5 levels + rooftop helpers
    themes.ts              materials and lighting per theme
    index.ts               LEVELS (the play order), ACT_NAMES
  sim/                     the deterministic game simulation; no DOM, no GPU, no audio
    types.ts               Enemy, Prop, Projectile, PlayerState, PlayerFrame, GameEvent
    world.ts               World: authoritative state, step(dt), combat, waves, win/lose, events
    enemy.ts               enemy creation and AI state machine
    items.ts               weapons and throwables
    static-world.ts        level collision: grid, raycasts, character movement
    nav-grid.ts            walkability grid + A* for enemy pathing
    player-controller.ts   first-person movement and look
  view/                    turns simulation state into draw calls (game-specific visuals)
    mesh-library.ts        enemy body parts, items, shards, hands
    level-mesh.ts          merges a level's boxes into one mesh; builds shared collision/nav data
    pose.ts                procedural enemy skeleton pose
    fx-system.ts           particles and glass shards (cosmetic, uses visualRng)
    viewmodel.ts           first-person hands and weapon
  ui/
    ui.ts                  DOM screens, HUD, title cards
    debug-overlay.ts       FPS/statistics corner
    styles.css
  game/                    the glue: the only place that knows about everything
    game.ts                state machine, level loading, frame/fixedStep/render, event routing
    time-scale-driver.ts   THE mechanic: player activity → world time scale
    replay.ts              record player frames, play them back into a fresh World
```

## Why this split

### 1. Folders follow the dependency layers, so the direction of imports *is* the architecture

This is the actual import graph between folders, checked with `grep` over the `import` lines:

```
core   → (nothing)
gfx    → (nothing)          audio → (nothing)
sim    → core
levels → sim (types only), gfx (srgbHex for theme colours)
view   → core, gfx, levels, sim
ui     → levels
game   → everything
main   → game, gfx
```

It has **no cycles**, and every arrow points "down". This is the main argument for the layout. A newcomer can find a file by asking *"what layer is this?"*, and a reviewer can catch a design mistake just from an import line. For example, `sim/` importing from `gfx/` or `ui/` would be one.

### 2. `sim/` is kept pure on purpose

`World` already reported what happened through an `events` queue instead of calling audio or effects directly (PART1, section 3). The folder makes that boundary visible and easy to keep. Nothing in `sim/` touches the DOM, WebGPU or WebAudio, so:
- **Replays work.** `ReplayPlayer` creates a second `World` and runs it with no side effects.
- **It's the easiest part to test.** A Node test can build a `World` from a level definition, step it, and assert on its state. That's exactly the test BUG-001 needs: "standing still gives a 1.5% time scale".
- `sim/types.ts` lists every piece of data the simulation owns in one place. `GameEvent` is now a **discriminated union**: a mistyped `type: "bulletClsh"` is a compile error, not a silently missing sound (one of the smaller issues in PART1).

### 3. `gfx/` and `view/` are separate: engine versus game visuals

`gfx/` knows about meshes, instances, segments and render passes. It could draw a different game. `view/` knows what a walker looks like, how glass shatters, and where the hands go. That keeps the 730-line renderer free of gameplay, and means changing an enemy's look never requires opening WebGPU code. `fx-system.ts` sits in `view/` because its particles are purely cosmetic: they use `visualRng`, so they can never affect the deterministic simulation.

### 4. Levels are content, split by act

Fifteen level definitions are about 800 lines of data. Splitting them by act matches how the game presents them (TRANSIT, OFFICE TOWER, ROOFTOPS) and how a designer would think about them. `level-builder.ts` now declares `LevelDef`, `Wave`, `WaveTrigger` and `EnemySpawn`, so the compiler checks all 15 levels. A wave with `when: { type: "zone" }` but no `rect`, or an enemy `kind: "sniper"`, no longer compiles.

### 5. `game/` is the only place that knows about everything

`Game` is still the hub, and it should be: someone has to connect input, simulation, view, audio and UI. `time-scale-driver.ts` and `replay.ts` live next to it because they're about *how the game is played*, not about the world's rules. The driver gets its own small file on purpose, because it is the game's signature mechanic and the first thing a newcomer should be able to find.

### 6. Shaders are real `.wgsl` files

They're imported with Vite's `?raw` suffix (`import sceneWgsl from './shaders/scene.wgsl?raw'`). They keep the names the original build gave them (`scene.wgsl`, `common.wgsl` and so on). The renderer still concatenates `common` + `scene` the same way it did before. As separate files they get syntax highlighting and WGSL tooling (`.vscode/extensions.json` recommends a WGSL extension), and they show up as their own diffs.

## Alternatives I considered

- **Group by feature** (`enemy/`, `player/`, `weapons/`, each with its own sim, view and audio files). This is attractive in a large game, but here every feature would mix pure simulation code with WebGPU code inside one folder. That would erase the most valuable boundary in this codebase, the one that makes replays and testing possible. With about 35 modules, layers are easier to navigate than features.
- **A flat `src/` with 35 files.** This is simple, but it hides the layering, and nothing stops `world.ts` from importing the renderer.
- **Splitting `Game` and `World` further now** (state objects, an event router, player intents in the simulation, as in PART1's design problems 2 and 3). These are real improvements but they change behaviour and ordering, so they're follow-ups. Mixing them into the move would make it impossible to review.

## How the move was done (so it can be checked)

1. A script cut the original file into modules **by line range**, following the subsystem map in PART1. It turned top-level `var X = class` into `export class X`, and `var` into `const`, or `let` where the value is reassigned.
2. The script added imports for every name a module used from another module. Then `tsc --noUnusedLocals` reported which imports were false positives, and those were removed. Because the bundler had already given every top-level name in the file a unique name, the imports can't be ambiguous.
3. Shaders were extracted from their template strings unchanged.
4. Types were added where `strict` checking needed them. That mostly meant fields declared as `[]` or `null`, which TypeScript can't infer: `World` collections, `RenderTargets`, audio nodes, particles and shards, level definitions, events.
5. Names the bundler had renamed were given descriptive names now that each lives in its own module: `GRAVITY` / `GRAVITY2` / `GRAVITY3` became `ENEMY_GRAVITY` / `PROP_GRAVITY` / `PLAYER_GRAVITY`, `MAX_PITCH2` became `PLAYER_MAX_PITCH`, `WHITE2` became `PAINT_WHITE`, `GLOVE2` became `GLOVE_TINT`, and `CELL2` became `NAV_CELL`. The duplicates `WHITE3` and `lerp2` were merged into the existing `WHITE` and `lerpN`.

### Verified
- `npm run typecheck` and `npm run build` both pass.
- In the browser, both the dev server and the production preview boot: WebGPU starts, the title screen renders, and there are no console errors. After marking 1-1 as cleared (because of BUG-003), level 1-2 starts and renders the level, an enemy, the held pistol and the HUD.
- The production source map lists the original `src/**/*.ts` paths with embedded sources, which is what the VS Code debugger needs to bind breakpoints.

### Not verified
- I couldn't press F5 inside VS Code from here. The launch and task configs follow VS Code's documented format, and the ready patterns were checked against Vite's real output, but the first F5 on your machine is the real test.
- Full playthroughs with pointer lock and mouse look. The browser pane I tested in can't capture the mouse.

## TypeScript: what "strict" means here

`strict: true` is on, with two exceptions for now:
- **`noImplicitAny: false`.** Most function parameters (`update(world, e, dt)`) are still untyped. Typing about 600 parameters is mechanical but large. The plan is to work through it one folder at a time, starting with `sim/` (where `types.ts` already exists), then turn the flag on.
- **`strictPropertyInitialization: false`.** Several classes (`Renderer`, `Game`) set up their fields in helper methods called from the constructor, which this check can't see.

`noUnusedLocals`, `isolatedModules` and `verbatimModuleSyntax` are on, so unused imports and type-only imports are kept honest.
