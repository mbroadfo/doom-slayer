# Doom-Slayer: Direction

Status as of 2026-09-28. This is a checkpoint before a quota reset — read this first when resuming.

## Where we are

The dashboard is a UI prototype only. `ReferenceObservation` in `src/App.tsx` plays a single
static ViZDoom demo GIF; the map trail and decision feed are hardcoded/simulated data. No
ViZDoom process runs underneath, no real game state, no model calls.

The demo's playback-speed control (0.5x/1x/2x/4x) is over-engineered for what it is — a looping
GIF viewer. It should be stripped down; it does not need to survive into the real integration.

## Key architectural decision: sync vs throttled sync vs async ViZDoom mode

Wall-clock playback speed is not the mechanism for letting a local Jev model keep pace with the
game. ViZDoom's own mode setting is the real lever, and there are three distinct modes, not two:

- **Sync mode** (`set_sync(True)` / synchronous `make_action`): the engine blocks indefinitely
  until the model returns a decision. No wall clock to race against, so a slow local model isn't
  penalized versus a fast hosted one. This is a **dev/eval harness**, not a shipped user-facing
  mode — use it for building and iterating on the strategic LLM and the fast categorical-choice
  provider, and for generating clean, deterministic training/eval data without latency noise.
- **Throttled sync — the desired gameplay mode**: still synchronous (the engine waits for a
  decision each step, same fairness guarantee as plain sync), but with a bounded/paced wait
  rather than an unbounded block, so the game reads as continuous slow motion instead of freezing
  on a hard stall. This is what a human watches during live play: Jev gets a genuinely wider
  decision window, without an indefinite pause and without racing a real-time clock it can't win.
  This is the mode the game-speed control (0.5x/1x/2x/4x-style dial) should actually drive once
  live capture exists — not a demo GIF's frame delay.
- **Async mode**: the game advances in real time (35 ticks/sec) regardless of model latency. Keep
  this as a **stress-test mode** — it's the true no-slack condition, useful for confirming whether
  local Jev could ever survive without any pacing help versus needing the hosted fallback. Not the
  primary gameplay target; throttled sync is.

Open question to resolve before implementation: whether plain (unbounded) sync mode ever needs to
be exposed in the UI, or stays purely internal dev/training tooling. Leaning toward internal-only.
Throttled sync, by contrast, should be user-facing — it's the gameplay mode.

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
4. Build the plain sync-mode harness first (dev/training/eval), then throttled sync (the real
   gameplay mode), then async as a stress-test harness.
5. Implement the two-stage controller: slower strategic LLM picks goal/target, faster categorical
   provider handles tactical inputs.

## Non-goals / constraints (still holds)

No committing game engines, WADs, model weights, or run captures to this repo. Default to
Freedoom data bundled with ViZDoom; a user's own commercial WAD is optional and local-only.
