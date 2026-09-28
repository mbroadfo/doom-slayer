# Doom-Slayer

A local-first Doom decision dashboard prototype inspired by TypeSafe's operations view and Sean Goedecke's System One Doom experiment.

## Current prototype status

The React/Vite dashboard is currently a UI prototype. It does not yet launch ViZDoom, install game dependencies, or run a local decision model. The Screen preview uses the standalone ViZDoom demo GIF; the alternate sensor views and decision feed are explicitly simulated examples.

The intended controller uses a slower strategic LLM to choose a goal and target, then a fast categorical-choice provider for tactical inputs. Demo, local-model, and optional hosted Jev providers should remain distinct. Hosted Jev credentials must stay on the backend and rapid hosted calls should be an explicit opt-in.

## Observation viewport

The left viewport shows the four panes from ViZDoom's reference feed in a 2x2 mosaic: rendered gameplay, object-label/segmentation view, depth view, and automap. Strategy and tactical decisions remain in the right column; the full-width decision graph sits below and the page scrolls to it. The panes are reference footage, not a live game connection.

For live capture, ViZDoom exposes `screen_buffer`, `labels_buffer` and label metadata, `depth_buffer`, and `automap_buffer` through `GameState`. Enable `set_labels_buffer_enabled(True)`, `set_depth_buffer_enabled(True)`, and `set_automap_buffer_enabled(True)` before `DoomGame.init()`. The live panes should all come from the same frame so they stay synchronized with decisions.

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
