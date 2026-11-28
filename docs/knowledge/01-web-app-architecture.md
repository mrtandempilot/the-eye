# The web dashboard: architecture

Repository: `mrtandempilot/the-eye`. It uses Next.js 15 (App Router),
TypeScript and Tailwind 4. Run it locally with `npm install && npm run dev`,
then open http://localhost:3100.

## Principle

The UI never draws pixels, and the visual engine never reads UI state.

1. Each frame, a **runtime** (`src/state/runtime.ts`) builds a serialisable
   `EngineFrame`. That frame holds scene A, scene B, the crossfade mix, the
   transition type, the master level, blackout, freeze, the kick impact
   state, and the modulated parameters.
2. The same frame goes to three places:
   - the local WebGL2 engine (the preview);
   - the `/output` pop-out window, through a `BroadcastChannel`;
   - TouchDesigner, through WebSocket as JSON at about 30 Hz.

## Folders

```
src/engine/     WebGL2 engine (no React)
  params.ts       parameter list. ORDER = shader uniform layout; append only
  shaders.ts      GLSL: scene generator, 7 transitions, post (glow/feedback/glitch), output (tone map + kick impact)
  particles.ts    3D GPU particle cloud (float-texture ping-pong, curl noise, 1-px additive streaks)
  VisualEngine.ts render passes, A/B monitors, thumbnails, image/video textures
  presets.ts      scene presets incl. COSMIC EYE template
  types.ts        EngineFrame, Scene, SceneImage (image or video), transitions
src/state/      store, actions (scene CRUD, A/B transition machine, persistence), controls (MIDI/OSC targets), runtime
src/io/         midi.ts (Web MIDI + clock), audio.ts (demo / interface FFT / bridge levels), bridge.ts (TD WebSocket), protocol.ts
src/components/ panels: TopBar, ScenePanel, PreviewStage, TransitionPanel, EffectsPanel, ImageControls, AudioPanel, PerformancePanel
src/app/api/analyze/route.ts   AI scene tuning (OpenRouter or Anthropic)
bridge/eye-bridge.mjs          WebSocket ⇄ OSC bridge (Node)
touchdesigner/                 TD scripts (builder + callbacks)
```

## Render pipeline (per frame)

1. Scene A, then scene B if mixing. A full-screen fragment shader draws each
   scene: background generator, starfield, fractal, superformula rings,
   particles, tentacles, eye or image layer, colour grade. When enabled, the
   3D particle cloud is drawn additively on top.
2. **Transition** shader: morph, liquid, dissolve, feedback, glitch, tunnel or
   particle explosion.
3. **Post**: glitch, glow (from a mip chain) and feedback (zoom and rotate the
   previous frame).
4. **Output**: kick impact (shake, shockwave, glass cracks, flash), master,
   ACES tone map, vignette, grain, blackout. The impact is drawn here so it
   stays out of the feedback loop.

## Parameter groups (all MIDI-mappable and audio-modulatable)

- **Eye** geometry: size, aperture, veins, gaze motion.
- **Iris**: morph, fiber detail, pupil, spin.
- **Organic**: tentacles, length, curl, fractal.
- **Superformula**: amount, m, n1, n2, n3.
- **Particles** (2D): density, speed, size.
- **Distortion**: liquid, warp scale, flow speed.
- **Feedback**: amount, zoom, rotate, glitch.
- **Color**: hue, saturation, contrast, cycle.
- **Glow**: glow, threshold.
- **Rotation**: speed, twist.
- **Scale**: zoom, beat pulse.
- **Image layer**: mix, zoom, warp, edge morph, edge softness, spin.
- **Video**: speed, cue point.
- **Layer opacity**: background, eye, tentacles, geometry, particles.
- **Kick impact**: shake, shockwave, glass cracks, flash.
- **Stars**: brightness, density, size, twinkle, drift, shooting-star rate,
  speed, trail, nebula.
- **Cosmic particles 3D**: brightness, density, flow speed, turbulence,
  radius, swirl, trail, kick burst, warm embers, camera orbit, tilt.

## Scenes and media

- A scene is `{id, name, kind, params, image?}`.
- `kind` is one of: eye, bloom, tunnel, liquid, geometric, particles,
  abstract, cosmos.
- `image` can be an image or a video:
  - mode: center or background;
  - video play mode: loop, kick or beat.
- Media is stored in IndexedDB. Bundled templates use `asset:/path` ids.

## AI scene tuning

`POST /api/analyze` takes `{image: dataURL, hint?}`. The model returns
structured JSON: name, kind, imageMode, every parameter, and a short note in
Turkish.

- If `OPENROUTER_API_KEY` is set, it calls OpenRouter
  (`OPENROUTER_MODEL`, default `anthropic/claude-haiku-5.5`, about 0.1 cent
  per image).
- Otherwise it calls the Anthropic API (`ANTHROPIC_MODEL`, default
  `claude-opus-5-5`).
