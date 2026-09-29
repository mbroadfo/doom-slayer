# Doom-Slayer: Direction

Status as of 2026-09-28. This is a checkpoint before a quota reset — read this first when resuming.

## Where we are

The dashboard is a UI prototype only. `ReferenceObservation` in `src/App.tsx` plays a single
static ViZDoom demo GIF; the map trail and decision feed are hardcoded/simulated data. No
ViZDoom process runs underneath, no real game state, no model calls.

The demo's playback-speed control (0.5x/1x/2x/4x) is over-engineered for what it is — a looping
GIF viewer. It should be stripped down; it does not need to survive into the real integration.

## Key architectural decision: sync vs async ViZDoom mode

Wall-clock playback speed is not the mechanism for letting a local Jev model keep pace with the
game. ViZDoom's own mode setting is:

- **Sync mode** (`set_sync(True)` / synchronous `make_action`): the engine blocks until the model
  returns a decision. No wall clock to race against, so a slow local model isn't penalized versus
  a fast hosted one. This is a **dev/eval harness**, not a shipped user-facing mode — use it for
  building and iterating on the strategic LLM and the fast categorical-choice provider, and for
  generating clean, deterministic training/eval data without latency noise.
- **Async mode**: the game advances in real time (35 ticks/sec) regardless of model latency. This
  is the **actual production target** — it's what a live, human-watched dashboard looks like, and
  the real test of whether local Jev is fast enough to be viable versus needing the hosted
  fallback.

Open question to resolve before implementation: whether sync mode ever needs to be exposed in the
UI (e.g. an "unhurried" play mode) or stays purely internal tooling. Leaning toward internal-only
unless a concrete use case shows up.

## Provider separation (from README, still holds)

Demo, local-model, and optional hosted Jev providers must remain architecturally distinct. Hosted
Jev credentials stay backend-only; rapid hosted calls are an explicit opt-in, not a default.

## Next steps (not yet started)

1. Strip the demo's playback-speed UI down to whatever the GIF-preview actually needs (or remove
   it if the preview becomes unnecessary once live capture exists).
2. Stand up local ViZDoom (`pip install vizdoom`) and confirm the current Windows wheel works
   before pinning a project Python version. Sean Goedecke's reference pins 3.12; ViZDoom lists
   3.10+ wheels — verify on this machine.
3. Wire live capture: `screen_buffer`, `labels_buffer` + label metadata, `depth_buffer`,
   `automap_buffer` via `GameState`, enabling `set_labels_buffer_enabled`,
   `set_depth_buffer_enabled`, `set_automap_buffer_enabled` before `DoomGame.init()`. Composite
   gameplay/labels/depth from the same frame; automap gets world-coordinate player/enemy/item
   markers and the traveled route.
4. Build the sync-mode harness first (dev/training/eval), then the async production loop.
5. Implement the two-stage controller: slower strategic LLM picks goal/target, faster categorical
   provider handles tactical inputs.

## Non-goals / constraints (still holds)

No committing game engines, WADs, model weights, or run captures to this repo. Default to
Freedoom data bundled with ViZDoom; a user's own commercial WAD is optional and local-only.
