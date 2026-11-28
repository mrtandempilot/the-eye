# THE EYE — Complete Knowledge Base (single file)

All sections in one document. Sections: README & instructions · Project brief · Web app architecture · Visual techniques · TouchDesigner guide · Scene recipes · Audio/MIDI/Ableton · References.


---

<!-- source: 00-README.md -->

## THE EYE: knowledge base

These files cover everything decided and learned so far on **THE EYE**, a
generative audiovisual performance project. They are written for a Claude
Desktop project that has the **TouchDesigner MCP** connected, so Claude can
build the visuals directly in TouchDesigner on the artist's computer.

### How to use (Claude Desktop)

1. Create a new Project in Claude Desktop, for example "THE EYE".
2. Add every `.md` file in this folder to the project's knowledge.
3. Paste the "Project instructions" block below into the project's custom
   instructions.
4. Make sure the TouchDesigner MCP is connected (in Claude Desktop settings
   under Connectors / MCP) and that TouchDesigner is running.
5. In chat, ask for example: "Build the COSMIC EYE network in TouchDesigner
   following 03-touchdesigner-guide.md."

#### Project instructions (paste into Claude Desktop)

```
You are helping a Turkish-speaking generative audiovisual artist build THE EYE,
a live visual performance system. Always answer in Turkish, simply and briefly.
The artist is not a programmer: explain what to click, never assume coding
knowledge. Use the TouchDesigner MCP tools to build and check networks
yourself, then take a screenshot of the output TOP before saying it works.
Read 00-project-brief.md first, then the guide that matches the task.
Never invent operator parameter names: check them with the TouchDesigner
documentation tools (td_doc_read / td_doc_search) before setting them.
Report honestly what you could and could not verify.
```

### Files

| File | Contents |
|---|---|
| `00-project-brief.md` | Vision, aesthetic, the artist's preferences, current status, open issues |
| `01-web-app-architecture.md` | The existing web dashboard (Next.js): structure, parameters, protocol |
| `02-visual-techniques.md` | Every visual technique, with how it works and the key formulas |
| `03-touchdesigner-guide.md` | TouchDesigner essentials, GLSL TOP rules, the COSMIC EYE network, next builds |
| `04-scene-recipes.md` | Concrete looks the artist wants, step by step |
| `05-audio-midi-ableton.md` | Kick detection, frequency bands, MIDI, Ableton, OSC/WebSocket protocol |
| `06-references.md` | Wikipedia articles, papers and YouTube examples |

The code lives in the GitHub repository `mrtandempilot/the-eye`. The newest
work is on branch `claude/image-ai-scenes`. The TouchDesigner builder script is
`touchdesigner/build_cosmic_eye.py`, and the main template image is
`public/templates/cosmic-eye.jpg`.


---

<!-- source: 00-project-brief.md -->

## Project brief: THE EYE

### The artist and the goal

- The artist is a Turkish-speaking generative audiovisual performer. They want
  answers in Turkish, short and practical. They are not a programmer, so give
  click-by-click steps.
- THE EYE is **a musical instrument for generative visuals**, not an admin
  dashboard. It is played live with music from Ableton Live, with MIDI
  controllers and projectors.
- Central motif: a **surreal, hyper-real eye** surrounded by living,
  procedural matter: tentacles, superformula geometry, fractals, liquid
  distortion, particles, feedback and glitch.

### Aesthetic

- Dark black and charcoal, with **purple, electric blue and subtle cyan**
  accents. Cinematic, minimal and futuristic, in the spirit of VJ software and
  TouchDesigner installations.
- **Extreme sharpness.** The artist said "çok net", meaning very crisp. They
  were blown away by a live visual that was:
  - **as thin as capillaries** ("kılcal damar kadar ince"): hair-thin
    filaments made of single-pixel lines;
  - **3D-looking**, with depth, wrap-around and parallax;
  - **like a living organism**: it grows, breathes and flows.
  The most likely techniques are a physarum simulation, curl-noise particle
  flow with trails, and additive blending at high resolution. See
  `02-visual-techniques.md`.
- Things they liked:
  - the **COSMIC EYE** image: a nebula or supernova shaped like an eye, orange
    core and violet-blue shell, on a starfield. This is the **main template**;
  - **stars** in the background, with **occasional shooting stars**, all
    adjustable;
  - **"Cosmic Particles"** (TouchDesigner tutorial TD Drop #27), the style
    they chose;
  - a visual where, on every **kick**, something **hits glass**;
  - a **dark mountain with light flowing down it like a waterfall of white
    stars**, going from rock to rock;
  - a **robot** character (dancing, or hitting glass) is fine instead of a real
    person.

### The main template: COSMIC EYE

- The image `public/templates/cosmic-eye.jpg` sits in the centre. It must stay
  pin-sharp, with no warp or feedback on the image itself, and a soft circular
  edge blends it into the starfield.
- Background: crisp point stars, some with four-point diffraction spikes,
  twinkling, slow drift, occasional shooting stars and a faint violet-blue
  nebula haze. Every part is adjustable.
- Around the image: thin flowing "cosmic threads" or a 3D particle cloud. Kick
  makes them burst outward. On the kick there is also a light shake and a
  shockwave, and optionally glass cracks and a flash.

### Current status (late November 2026)

- **Web dashboard** (Next.js, repository `mrtandempilot/the-eye`):
  - `main` is deployed on Vercel. It has the eye engine, 7 scenes, 7
    transitions, the effect panel, audio, MIDI, the TouchDesigner WebSocket
    link and the output window.
  - Branch `claude/image-ai-scenes` adds:
    - image and video scenes, with play modes loop / on-kick / on-beat;
    - AI scene tuning: the `/api/analyze` route sends the image to OpenRouter
      (default model `anthropic/claude-haiku-5.5`), or to the Anthropic API;
    - per-layer opacity;
    - the Kick Impact glass-hit effect;
    - the COSMIC EYE template with starfield and shooting stars;
    - the 3D GPU cosmic particle cloud.
  - The branch preview URL is
    `https://the-eye-git-claude-image-ai-scenes-mrtandempilots-projects.vercel.app`.
  - It is not merged to `main` yet.
- **TouchDesigner**:
  - `touchdesigner/build_cosmic_eye.py` builds the COSMIC EYE network (see
    `03-touchdesigner-guide.md`). Its GLSL was compile-checked but it has not
    been run inside TouchDesigner yet.
  - `touchdesigner/eye_webserver_callbacks.py` and `eye_osc_callbacks.py` link
    TouchDesigner with the web dashboard.

### Open issues

1. **AI key on Vercel:** `/api/analyze` returned "No AI key on the server" on
   the preview. Most likely `OPENROUTER_API_KEY` was set for Production only and
   not for Preview. The error message now also shows which environment it ran
   in and which key names the server can see.
2. **Testing:** nothing has been tested on real hardware yet: MIDI controller,
   a real GPU, Ableton, a projector.
3. **Missing:** export and import of scene sets to a file. This matters before
   a show, because scenes live only in browser storage.
4. **TouchDesigner:** run the builder script, fix any parameter-name warnings,
   then go further with physarum, 3D particles (POPs) and the star waterfall.

### Working rules learned so far

- Never fake an integration. If something is not connected, say
  DISCONNECTED and use a clearly labelled simulated or demo mode.
- Do not put API keys in code or in git. Use environment variables.
- Get the user's consent before spending credits (for example on AI video
  generation).
- When asked for something only partly possible, say so plainly and offer
  the realistic path.


---

<!-- source: 01-web-app-architecture.md -->

## The web dashboard: architecture

Repository: `mrtandempilot/the-eye`. It uses Next.js 15 (App Router),
TypeScript and Tailwind 4. Run it locally with `npm install && npm run dev`,
then open http://localhost:3100.

### Principle

The UI never draws pixels, and the visual engine never reads UI state.

1. Each frame, a **runtime** (`src/state/runtime.ts`) builds a serialisable
   `EngineFrame`. That frame holds scene A, scene B, the crossfade mix, the
   transition type, the master level, blackout, freeze, the kick impact
   state, and the modulated parameters.
2. The same frame goes to three places:
   - the local WebGL2 engine (the preview);
   - the `/output` pop-out window, through a `BroadcastChannel`;
   - TouchDesigner, through WebSocket as JSON at about 30 Hz.

### Folders

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

### Render pipeline (per frame)

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

### Parameter groups (all MIDI-mappable and audio-modulatable)

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

### Scenes and media

- A scene is `{id, name, kind, params, image?}`.
- `kind` is one of: eye, bloom, tunnel, liquid, geometric, particles,
  abstract, cosmos.
- `image` can be an image or a video:
  - mode: center or background;
  - video play mode: loop, kick or beat.
- Media is stored in IndexedDB. Bundled templates use `asset:/path` ids.

### AI scene tuning

`POST /api/analyze` takes `{image: dataURL, hint?}`. The model returns
structured JSON: name, kind, imageMode, every parameter, and a short note in
Turkish.

- If `OPENROUTER_API_KEY` is set, it calls OpenRouter
  (`OPENROUTER_MODEL`, default `anthropic/claude-haiku-5.5`, about 0.1 cent
  per image).
- Otherwise it calls the Anthropic API (`ANTHROPIC_MODEL`, default
  `claude-opus-5-5`).


---

<!-- source: 02-visual-techniques.md -->

## Visual techniques: what makes each look

Each section explains how a technique works and what it looks like. All of
them run in real time on a GPU, as GLSL shaders, which work in TouchDesigner
GLSL TOPs or WebGL.

---

### 1. Noise and fBm: the raw material of organic motion

- **Value / Perlin / Simplex noise**: a smooth random field. Sampling it with
  time gives motion that looks natural.
- **fBm (fractal Brownian motion)**: add several octaves of noise, each with
  double the frequency and half the amplitude. The result looks like clouds,
  nebulae or flesh.
- **Domain warping**: feed the output of noise into the coordinates of more
  noise, `f(p + f(p + f(p)))`. This gives liquid, marbled, alien-tissue
  textures.

### 2. Curl noise: silky, swirling flow

- Take a smooth noise field ψ and use its **curl** as a velocity field.
  - 2D: `v = (∂ψ/∂y, −∂ψ/∂x)`
  - 3D: curl of a 3-component noise field.
- Curl fields are **divergence-free**, so particles never bunch up or vanish.
  They swirl like smoke or ink in water.
- Compute it with finite differences:
  `v.x = (ψ(p+ey) − ψ(p−ey))/2e`, and so on.
- Classic reference: Bridson, "Curl-Noise for Procedural Fluid Flow" (2007).

### 3. Particles flowing with trails: "hair-thin threads"

- Move hundreds of thousands to millions of particles through a curl-noise
  field.
- Draw each one as a **1-pixel point or a short line** from its previous to
  its current position.
- Use **additive blending** (`ONE, ONE`). Each particle is faint, but where
  many overlap they build silky, glowing filaments.
- Keep a **feedback buffer** of the previous frame, multiplied by 0.95 to
  0.995. Paths then persist as long, thin trails.
- Alternative without particles: inject single-pixel sparks into a texture
  and **advect** the texture each frame along the flow (`sample prev at
  uv − v·dt`). This is cheap and gives the same thin-thread look. The
  TouchDesigner builder uses this.
- **GPU particles**: store position and velocity in float textures (RGBA32F).
  Update them with a fragment or compute shader, ping-ponging between two
  textures. Draw them by reading the texture in the vertex shader
  (`texelFetch` with `gl_VertexID`).

### 4. Physarum (slime mould): "a living organism of capillaries"

This is the best guess for the "capillary-thin, living" visual the artist saw.

- Many **agents** each have a position and a heading.
- Each step:
  1. **Sense**: sample a trail map at three points ahead (left, centre,
     right).
  2. **Rotate** toward the strongest trail.
  3. **Move** forward.
  4. **Deposit** trail where it lands.
- Then the trail map is **diffused** (a 3×3 blur) and **decayed** (×0.9 or
  so).
- Networks of veins emerge, then reroute, merge and pulse. Nobody draws them;
  that is why it looks alive.
- Parameters:
  - sensor angle (22–45°), sensor distance, rotation angle, step size,
    deposit amount, decay, diffusion;
  - agent count: 1 to 10 million on a good GPU.
- 3D versions run in TouchDesigner POPs or compute shaders.
- Reference: Jeff Jones (2010), "Characteristics of pattern formation and
  evolution in approximations of Physarum transport networks". Sage Jenson's
  "Physarum" article and artworks.

### 5. Reaction-diffusion (Gray-Scott): coral, brain, skin

- Two chemicals A and B:
  - `A' = A + (Da∇²A − AB² + f(1−A))·dt`
  - `B' = B + (Db∇²B + AB² − (k+f)B)·dt`
- Different feed and kill values (f, k) give spots, stripes, mazes or
  mitosis.
- It runs as a feedback GLSL loop: two channels in one texture.
- Reference: Karl Sims' tutorial.

### 6. Branching growth: veins, roots, lightning

- **DLA (diffusion-limited aggregation)**: random walkers stick to a growing
  cluster. The result is coral or frost branching.
- **Space colonization**: branches grow toward attractor points. This gives
  realistic leaf veins and blood-vessel trees.

### 7. Gielis superformula: organic geometry

- `r(φ) = ( |cos(mφ/4)/a|^n2 + |sin(mφ/4)/b|^n3 )^(−1/n1)`
- `m` sets the symmetry. `n1`, `n2` and `n3` move the shape between circles,
  stars, flowers, starfish and cells.
- Used for iris morph, petal blooms, ring patterns and lattices.

### 8. Raymarching / SDF: true 3D in a shader

- Describe the shape as a signed distance function. March a ray from the
  camera in steps equal to the distance until it hits the surface.
- Get normals from the distance gradient, then add lighting, soft shadows,
  ambient occlusion and **subsurface scattering** (light passing through, so
  surfaces look fleshy and translucent).
- Fractals such as the Mandelbulb or kaleidoscopic IFS make alien organisms.
- **Volumetric rendering** (marching through a density field and accumulating
  light) makes glowing nebulae and clouds.

### 9. Feedback: memory and trails

- Feed the previous frame back in, slightly zoomed, rotated or displaced, and
  multiplied by a value below 1. You get tunnels, echoes and smears.
- This is TouchDesigner's signature trick (Feedback TOP).

### 10. Stars and shooting stars (as built)

- Hash a grid of cells to place one star per cell, with a random chance of
  each cell having a star.
- Draw each star as a **pixel-sized Gaussian**, with the radius measured in
  pixels so it stays crisp at any resolution.
- Brightness follows `hash³`: many faint stars, a few bright ones.
- Bright stars get **4-point diffraction spikes**:
  `exp(−|dy|)·exp(−|dx|/L) + exp(−|dx|)·exp(−|dy|/L)`.
- Twinkle: `1 − k·(0.5 + 0.5·sin(t·rate + phase))`.
- Shooting stars: a few slots, each repeating on a randomised period.
  - While active, the head moves along a direction.
  - Distance to the segment behind the head gives a thin line that fades
    toward the tail, plus a glow at the head.
  - It fades in and out over its lifetime, and random cycles are skipped.

### 11. Glass hit on kick (as built)

- **Shake**: a random uv offset multiplied by a hit envelope that decays
  quickly (`exp(−9t)`).
- **Shockwave**: a ring `exp(−((r − front)·10)²)` expanding from the impact
  point. It displaces uv along the radius.
- **Cracks**: Voronoi cells in log-polar coordinates around the impact point.
  The edge is where `F2 − F1` is small, and each shard is offset slightly to
  refract. They fade over about one second.
- **Flash**: a short additive white.

### 12. Making it crisp ("çok net")

- Render at full resolution or higher (supersampling), then downscale.
- Size thin elements in **pixels** (`px = 1/resolution.y`), not in scene units.
- Keep the hero image out of warp and feedback. Composite it after those
  effects.
- Use HDR (16-bit float) buffers for feedback and particles, then tone map
  (ACES) at the end. Keep bloom subtle with a high threshold.
- Additive, many-faint beats few-bright: thousands of 1-px lines look silky;
  thick lines look cheap.

### 13. Dark mountain and star waterfall

- The mountain is a **heightmap**: a 3D mesh, or a depth map estimated from a
  photo by AI. Light it almost not at all, with only a thin rim light.
- Water is particles:
  - spawn them at the top and add gravity;
  - on contact, **project the velocity onto the surface tangent** so they
    slide along the rock and follow the steepest descent;
  - off an edge they fall freely, hit the next rock and slide again.
  - In 2.5D: move the particles along the negative gradient of the heightmap.
- Render white-blue points with additive blending, short speed trails and
  bloom, against a near-black mountain.
- Tools:
  - TouchDesigner GPU particles with heightmap collision;
  - Unreal Niagara with distance-field collision;
  - Houdini for offline renders.


---

<!-- source: 03-touchdesigner-guide.md -->

## TouchDesigner guide for THE EYE

### Basics (explain to the artist in plain Turkish)

- **Operator families:**
  - **TOP**: images and textures (GPU). This is where the visuals are.
  - **CHOP**: channels and numbers (audio, MIDI, LFOs).
  - **SOP**: geometry.
  - **POP**: GPU point and particle operators in recent builds.
  - **DAT**: text, tables, scripts.
  - **COMP**: containers, cameras, windows, UI.
  - **MAT**: materials.
- Data flows along wires, left to right. Only operators of the same family
  connect to each other.
- **Expressions**: any parameter can be driven by Python, for example
  `absTime.seconds` or `op('kick')[0]`.
- **Custom parameters**: add a page to a COMP so the whole patch is
  controlled from one panel.
- **Perform mode / Window COMP**: show the output fullscreen on a projector.
- **Licence**: the free Non-Commercial licence is limited to 1280×1280 output.
  Shows need a Commercial or Pro licence.
- Hardware: an NVIDIA RTX card is strongly recommended for millions of
  particles.

### GLSL TOP rules (TouchDesigner dialect)

- Put the shader in a Text DAT and point the GLSL TOP's **Pixel Shader**
  parameter (`pixeldat`) at it.
- TouchDesigner provides the version line and its uniforms. You write:
  - `out vec4 fragColor;`
  - `void main(){ ... fragColor = TDOutputSwizzle(color); }`
- Built-ins:
  - `vUV.st`: texture coordinate, 0–1, with the origin at bottom-left.
  - `sTD2DInputs[i]`: the input textures, in wiring order.
  - `uTDOutputInfo.res.zw`: output width and height in pixels.
- Pass numbers into the shader in one of two ways:
  - the GLSL TOP's Vectors/Uniforms page (check the parameter names for the
    installed build with the docs tools);
  - the robust way, used in the builder: 1×1 **Constant TOPs** in
    `rgba32float`, with expressions on `colorr/g/b/alpha`, read with
    `texelFetch(sTD2DInputs[i], ivec2(0), 0)`.
- Set **Output Resolution** to Custom 1920×1080. Use `rgba16float` for
  feedback buffers.
- Before setting any parameter, check its exact name with
  `td_doc_read("GLSL_TOP")` and similar. Names can differ between builds.

### Feedback loop pattern

```
constant(black) → feedbackTOP ──┐
                 (par.top = 'flow')
flow (GLSL TOP) ← feedback, params ...   # reads the previous frame, writes the new one
```

The Feedback TOP's `top` parameter points to the node whose output it feeds
back. Its wired input is used for the first frame and resets.

### Audio → kick chain

```
audiodeviceinCHOP → audiofilterCHOP (low-pass ≈ 120 Hz) → analyzeCHOP (RMS power)
                  → lagCHOP (fast attack, ~0.15 s release) → nullCHOP 'kick'
```

Use it in expressions as
`min(1, op('kick')[0].eval() * gain)`.

For sharp hits, detect onsets: fire when the value crosses about 0.55, and
re-arm when it drops below about 0.3. A Trigger CHOP or a CHOP Execute DAT can
do this.

### The COSMIC EYE network (`touchdesigner/build_cosmic_eye.py`)

Running the script in the Textport builds `/project1/cosmic_eye`:

```
exec(open(r'C:/TheEye/build_cosmic_eye.py', encoding='utf-8').read())
```

Set `IMAGE_PATH` at the top first, or later on the component's page.

| Node | Role |
|---|---|
| `audio_in → lowpass → level → smooth → kick` | kick envelope from the audio input |
| `params0..3` (Constant TOP 1×1 float) | time, kick, and the custom parameters packed into textures |
| `stars` (GLSL) | crisp starfield, twinkle, spikes, shooting stars, faint nebula |
| `black → feedback ⇄ flow` (GLSL) | single-pixel sparks around the image edge, advected by curl noise: hair-thin cosmic threads |
| `image` (Movie File In) | the COSMIC EYE picture |
| `composite` (GLSL) | stars + image (soft circular edge) + threads + kick shake, shockwave and flash |
| `OUT` (Null), `window1` | output and fullscreen window |

Custom page **Cosmic Eye**: Image File, Image Size, Image Edge Softness, Star
Brightness, Star Density, Twinkle, Shooting Stars, Thread Brightness, Thread
Length, Flow Speed, Swirl, Kick Sensitivity, Kick Shake.

Status: the GLSL was compile-checked. The script has not yet been run inside
TouchDesigner. It prints `THE EYE: could not set …` for any parameter name
that differs and keeps going. **First task in Claude Desktop:** run it, read
`td_logs`, fix the warnings, and take a screenshot of `OUT`.

### Next builds (in order)

1. **3D cosmic particles** (POPs or GLSL compute):
   - 1–4 million points in a curl-noise flow around a sphere shell;
   - rendered as points or lines with additive blending, a slowly orbiting
     camera, and depth fade;
   - kick makes them burst outward.
   - Composite them behind and in front of the image using depth.
2. **Physarum organism**:
   - agents in a GLSL compute shader or POPs, with a trail texture plus
     diffuse and decay (see `02-visual-techniques.md` §4);
   - colour the trails with the violet → blue → cyan palette and warm cores;
   - the audio low band pushes deposit amount; the highs push sensor angle.
3. **Star waterfall over a dark mountain**:
   - a heightmap from a photo (depth AI) or noise;
   - GPU particles sliding down the gradient, with additive white-blue points
     and trails.
4. **Link to the web dashboard**:
   - an **OSC In CHOP** on port 7000, fed by `npm run bridge` in the
     repository, gives channels `eye/mix`, `eye/param/*`, `eye/audio/*`;
   - or a **Web Server DAT** on port 9980 with
     `touchdesigner/eye_webserver_callbacks.py`, so the dashboard's TAKE,
     sliders and MIDI drive TouchDesigner.

### Performance tips

- Keep resolution at 1920×1080 unless needed. Use 16-bit float buffers and
  avoid 32-bit except for particle state.
- Cook only what is visible. Turn off viewers on heavy nodes.
- Watch the Performance Monitor. Lower the particle count before lowering
  resolution, because sharpness matters most.


---

<!-- source: 04-scene-recipes.md -->

## Scene recipes the artist wants

### 1. COSMIC EYE (main template)

- Centre: `cosmic-eye.jpg`, sharp, with a soft circular edge (softness about
  0.35–0.55). Size: the sphere is about 60% of the screen height. No warp on
  the image.
- Background: point stars, with density about 0.55, twinkle about 0.5, and
  spikes on the bright ones.
- Shooting stars: a rate of about 0.35, meaning one every few seconds, with
  random gaps.
- Around the image: cosmic threads or a 3D particle cloud:
  - violet, blue and cyan, with warm orange embers near the core;
  - swirling slowly;
  - bursting outward on every kick.
- Kick: light shake (about 0.12–0.4), a soft shockwave, a 4% flash. No cracks
  by default.

### 2. Living capillary organism

- Physarum simulation, with millions of agents in 2D or 3D.
- Trails are single-pixel, rendered with additive blending, high decay
  (0.95–0.98) and a little diffusion.
- Palette: deep violet → electric blue → cyan, with warm cores where the
  trails are dense.
- Optionally seed agents from the eye or image so the organism grows out of
  it.
- Audio: kick boosts deposit and adds a radial push; highs widen the sensor
  angle.

### 3. Glass hit on the kick

- Kick Impact: shake, shockwave from a random point near the centre,
  Voronoi glass cracks that fade in about 1 s, and a short flash.
- Video version: a clip of a robot or fist hitting glass, played in
  ON KICK mode with the cue point just before the hit, so every kick restarts
  the clip on the hit.

### 4. Dancing robot

- Free stock clips found:
  - Pexels "Futuristic Robot Dancing Under Neon Lights":
    https://www.pexels.com/video/futuristic-robot-dancing-under-neon-lights-29770096/
  - Pixabay "Robot, Dance, Fun": https://pixabay.com/videos/robot-dance-fun-168502/
- Use it as a backdrop video, in ON BEAT mode, with glass cracks on the kick
  and the eye floating in front.

### 5. Star waterfall over a dark mountain

- A near-black mountain (heightmap or depth-estimated photo) with only a rim
  light.
- Thousands of white-blue star particles:
  - spawn at the peaks;
  - slide along the rock surface following the steepest descent;
  - fall off edges onto the next rock.
- Short trails, additive blending, subtle bloom.
- The kick sends a "surge" of extra particles.

### 6. Character swap (dancer → robot or creature)

- Offline: AI motion transfer, which needs video generation credits. Only
  use it with consent if a real person is involved.
- Live: StreamDiffusion in TouchDesigner on a camera feed. It needs a strong
  NVIDIA GPU, and the look is dreamy rather than exact.


---

<!-- source: 05-audio-midi-ableton.md -->

## Audio, MIDI, Ableton and the protocol

### Audio bands (used by the dashboard)

| Band | Range | Typical target |
|---|---|---|
| Kick | 35–120 Hz | pupil size, impact, particle burst |
| Bass | 60–250 Hz | tentacle curl, swirl |
| Mid | 250–2000 Hz | liquid distortion |
| High | 4–14 kHz | particle density, twinkle |
| Synth / SH-4 | 300–3000 Hz, its own input channel | iris morph, threads |

- Envelope: fast attack, slower release, to give a punchy but smooth result.
- Kick onset: fire when the kick crosses about 0.55, and re-arm below about
  0.3.

### Getting Ableton audio in

- **Option A, loopback or interface.** Route Ableton's master, or a dedicated
  return for the Roland SH-4, to a loopback device (BlackHole, Loopback,
  VB-Cable) or to the inputs of a multichannel interface. In TouchDesigner use
  an Audio Device In CHOP. In the dashboard, choose INPUT and pick a channel
  per band.
- **Option B, OSC levels.** A Max for Live envelope follower sends
  `/eye/audio/kick 0.8` (or `/eye/audio k b m h s`) to the bridge on UDP 7001,
  or straight to TouchDesigner's OSC In.

### Tempo

- Ableton → MIDI Clock: in Preferences → Link/Tempo/MIDI, turn on Clock for
  the output port. The dashboard follows it (shown as `MIDI CLK`). In
  TouchDesigner use a MIDI In CHOP or the beat CHOP.
- Alternatively send OSC `/eye/bpm 128`.

### MIDI

- The dashboard has MIDI LEARN: click a control, then move a knob. CC values
  map 0–1 to the parameter range; notes act as buttons.
- Button targets: `btn:take`, `cut`, `blackout`, `freeze`, `random`, `prev`,
  `next`, `tap`, `auto`, `hit`.
- Continuous targets: `mix`, `master`, `trans.duration`, `trans.intensity`,
  `audio.reactivity`, `param:<key>`.

### WebSocket protocol (dashboard ↔ TouchDesigner or bridge, JSON)

- Outbound:
  - `hello` with the list of parameters;
  - `frame` at about 30 Hz:
    `{t, bpm, beat, mix, master, blackout, freeze, transition, a:{id,name,kind,params}, b, audio}`;
  - `event` with name `take`, `cut`, `committed` or `hit`.
- Inbound:
  - `{type:'audio', levels:{kick,…}}`
  - `{type:'control', target:'btn:take', value:1}`
  - `{type:'bpm', bpm:128}`

### OSC map (`npm run bridge -- --osc-out 127.0.0.1:7000 --osc-in 7001`)

- Out to TouchDesigner (one bundle per frame):
  - `/eye/mix`, `/eye/master`, `/eye/blackout`, `/eye/freeze`, `/eye/bpm`,
    `/eye/beat`, `/eye/transition`;
  - `/eye/scene/a`, `/eye/scene/a/kind`, `/eye/scene/b`;
  - `/eye/param/<key>`, `/eye/audio/<band>`;
  - `/eye/event/<name>`.
- In from Ableton or TouchDesigner:
  - `/eye/audio/<band> f`, `/eye/audio f f f f f`;
  - `/eye/bpm f`;
  - `/eye/control/btn/take 1`, `/eye/control/mix 0.5`,
    `/eye/control/param/glow 0.8`.


---

<!-- source: 06-references.md -->

## References

### Wikipedia (concepts)

- Superformula: https://en.wikipedia.org/wiki/Superformula
- Perlin noise: https://en.wikipedia.org/wiki/Perlin_noise
- Simplex noise: https://en.wikipedia.org/wiki/Simplex_noise
- Fractional Brownian motion: https://en.wikipedia.org/wiki/Fractional_Brownian_motion
- Curl (mathematics): https://en.wikipedia.org/wiki/Curl_(mathematics)
- Particle system: https://en.wikipedia.org/wiki/Particle_system
- Physarum polycephalum: https://en.wikipedia.org/wiki/Physarum_polycephalum
- Reaction–diffusion system: https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system
- Turing pattern: https://en.wikipedia.org/wiki/Turing_pattern
- Diffusion-limited aggregation: https://en.wikipedia.org/wiki/Diffusion-limited_aggregation
- Voronoi diagram: https://en.wikipedia.org/wiki/Voronoi_diagram
- Signed distance function: https://en.wikipedia.org/wiki/Signed_distance_function
- Volume ray casting: https://en.wikipedia.org/wiki/Volume_ray_casting
- Subsurface scattering: https://en.wikipedia.org/wiki/Subsurface_scattering
- Bloom (shader effect): https://en.wikipedia.org/wiki/Bloom_(shader_effect)
- Tone mapping: https://en.wikipedia.org/wiki/Tone_mapping
- Heightmap: https://en.wikipedia.org/wiki/Heightmap
- Diffraction spike: https://en.wikipedia.org/wiki/Diffraction_spike
- Meteoroid (shooting stars): https://en.wikipedia.org/wiki/Meteoroid
- Video feedback: https://en.wikipedia.org/wiki/Video_feedback
- VJing: https://en.wikipedia.org/wiki/VJing

### Papers and articles

- Robert Bridson, "Curl-Noise for Procedural Fluid Flow" (SIGGRAPH 2007).
- Jeff Jones, "Characteristics of pattern formation and evolution in
  approximations of Physarum transport networks" (Artificial Life, 2010).
- Sage Jenson, "Physarum" (article and artworks). Search for
  "Sage Jenson physarum".
- Karl Sims, Reaction-Diffusion tutorial: https://www.karlsims.com/rd.html
- Inigo Quilez, articles on SDFs, raymarching and noise:
  https://iquilezles.org/articles/
- TouchDesigner documentation: https://docs.derivative.ca/

### YouTube examples (found by search; check that each still works)

Physarum or organism:
- Slimemold (Physarum) GLSL simulation in TouchDesigner: https://www.youtube.com/watch?v=O3vVrvGdNE8
- 3D Slimemold, POP GLSL TouchDesigner: https://www.youtube.com/watch?v=yYe7TqMcNEA
- 3D Physarum, TouchDesigner Tutorial 10: https://www.youtube.com/watch?v=TI-RNH-p-Ys
- Slime Mold Physarum Simulation, C++ and compute shaders: https://www.youtube.com/watch?v=vVrQjbX2zLc
- Drawing with Digital Slime Mold: https://www.youtube.com/shorts/GcYPEmR5Y54

Particles and curl noise (the chosen style is "Cosmic Particles"):
- [TD Drop #27] Cosmic Particles, TouchDesigner tutorial: https://www.youtube.com/watch?v=V2nENY6KOqQ
- TouchDesigner _03 Curl Noise: https://www.youtube.com/watch?v=DkSwEY-m9GA
- Build a Swirling Dust Terrain: https://www.youtube.com/watch?v=ZW-rkNnFQMg
- Fluid Point Surface with Particles: https://www.youtube.com/watch?v=51vF9svIafA
- Particle Noise Vortex: https://www.youtube.com/watch?v=UmA6tIZg0mw

Waterfall and terrain:
- Interactive Particle Waterfall, TouchDesigner: https://www.youtube.com/watch?v=QcDv6i-bM9U
- Terrain Particle System, Part 3 (Houdini, heightmaps): https://www.youtube.com/watch?v=9fJsi_qUhn0
- Unreal Engine 5 Waterfall Tutorial: https://www.youtube.com/watch?v=414t3mf3ilc
- Houdini to Niagara: https://www.youtube.com/watch?v=GAn1Za1MYW4

### Free stock video

- Pexels robot videos: https://www.pexels.com/search/videos/robot/
- Pixabay dancing robot videos: https://pixabay.com/videos/search/dancing%20robot/
- Mixkit robot videos: https://mixkit.co/free-stock-video/robot/
