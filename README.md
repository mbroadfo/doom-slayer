# Doom-Slayer

A local-first Doom decision dashboard prototype inspired by TypeSafe's operations view and Sean Goedecke's System One Doom experiment.

## Current prototype status

The React/Vite dashboard is currently a UI prototype. It does not yet launch ViZDoom, install game dependencies, or run a local decision model. The Screen preview uses the standalone ViZDoom demo GIF; the alternate sensor views and decision feed are explicitly simulated examples.

The intended controller uses a slower strategic LLM to choose a goal and target, then a fast categorical-choice provider for tactical inputs. Demo, local-model, and optional hosted Jev providers should remain distinct. Hosted Jev credentials must stay on the backend and rapid hosted calls should be an explicit opt-in.

## Observation viewport

Playback speed buttons beside Labels and Depth in the gameplay header select 0.5×, 1×, 2×, or 4× for the decoded reference animation and simulated dashboard updates. At 1×, the episode clock advances one second per second. Pause/resume applies to both; Labels and Depth can still be toggled while paused.

The first-person gameplay view is on the left, with independent `Labels` and `Depth` controls. Those buffers share the gameplay image's pixel coordinates, so they are composited as overlays. Strategy and tactical decisions remain in the right column. A full-width top-down map row follows, with the decision graph below it. The current gameplay and overlays use the ViZDoom reference GIF; the map markers and trail are demo data, not a live game connection.

For live capture, ViZDoom exposes `screen_buffer`, `labels_buffer` and label metadata, `depth_buffer`, and `automap_buffer` through `GameState`. Enable `set_labels_buffer_enabled(True)`, `set_depth_buffer_enabled(True)`, and `set_automap_buffer_enabled(True)` before `DoomGame.init()`. Gameplay, labels, and depth should be composited from the same frame; the automap is a separate top-down coordinate view and should receive world-coordinate player/enemy/item markers and the traveled route.

## Engine and game data

Doom-Slayer will not commit game engines, WADs, model weights, or run captures to this repository. The intended open setup installs ViZDoom into the user's local Python environment with `pip install vizdoom`. ViZDoom provides the game runtime/API and includes Freedoom game data for running without a commercial Doom purchase. Its original code is MIT-licensed; it is based on ZDoom, which contains components with varying licenses. Freedoom data is under a BSD-style license, whose attribution and redistribution conditions must be preserved if we redistribute it.

Original Doom/Doom II WAD files are separate commercial game data, not the engine. Doom-Slayer will not download or redistribute them. Someone who owns a compatible game may optionally point ViZDoom at their own local WAD; the default should use the Freedoom data installed with ViZDoom.

This setup flow is planned, not implemented yet. Current ViZDoom documentation lists Windows x86-64 wheels for Python 3.10+, although Sean's particular demo pins Python 3.12 for its tested dependency set. We should test the current ViZDoom wheel on this Windows machine before fixing our project version.

References: [ViZDoom](https://github.com/Farama-Foundation/ViZDoom), [ViZDoom Python quick start](https://vizdoom.farama.org/introduction/python_quickstart/), [Freedoom license](https://github.com/freedoom/freedoom/blob/master/COPYING.adoc), [id Software Doom source release](https://raw.githubusercontent.com/id-Software/DOOM/master/README.TXT), [Sean Goedecke's System One repo](https://github.com/sgoedecke/system-one).

## Run the dashboard

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` validates the frontend production build.
