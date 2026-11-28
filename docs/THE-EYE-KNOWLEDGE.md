# THE EYE — TouchDesigner Knowledge Base

Single reference for building **THE EYE** visuals in **TouchDesigner** with Claude Desktop
+ the TouchDesigner MCP. (This file is only about the visuals and TouchDesigner — the separate
web dashboard is intentionally left out.)

## How to use (Claude Desktop)

1. Create a Project in Claude Desktop (e.g. "THE EYE") and add this file to its knowledge.
2. Paste the block below into the project's custom instructions.
3. Make sure the TouchDesigner MCP is connected and TouchDesigner is running.
4. Ask e.g.: *"Build the COSMIC EYE network in TouchDesigner (section 'The COSMIC EYE network')
   and show me a screenshot of OUT."*

### Project instructions (paste into Claude Desktop)

```
You are helping a Turkish-speaking generative audiovisual artist build THE EYE,
a live visual performance in TouchDesigner. Always answer in Turkish, simply and
briefly. The artist is not a programmer: explain what to click, never assume
coding knowledge. Use the TouchDesigner MCP tools to build and check networks
yourself, and take a screenshot of the output TOP before saying it works.
Never invent operator parameter names: check them with td_doc_read / td_doc_search
before setting them. Report honestly what you could and could not verify.
```

Supporting files (in the `the-eye` repository, `touchdesigner/` and `public/templates/`):
`build_cosmic_eye.py` (builds the COSMIC EYE network) and `cosmic-eye.jpg` (main template image).


---

## Project brief

### The artist and the goal
- Turkish-speaking generative audiovisual performer. Wants answers in **Turkish**, short and practical,
  click-by-click (not a programmer).
- THE EYE is **a musical instrument for generative visuals**, played live with music from **Ableton Live**,
  MIDI controllers and projectors.
- Central motif: a **surreal eye** surrounded by living procedural matter — tentacles, superformula geometry,
  fractals, liquid distortion, particles, feedback, glitch.

### Aesthetic
- Dark black/charcoal with **purple, electric blue and subtle cyan** accents; cinematic, minimal, futuristic.
- **Extreme sharpness** ("çok net"). The artist was blown away by a live visual that was:
  - **as thin as capillaries** ("kılcal damar kadar ince") — hair-thin, single-pixel filaments;
  - **3D-looking** — depth, wrap-around, parallax;
  - **like a living organism** — growing, breathing, flowing.
  → most likely physarum simulation and/or curl-noise particle flow with trails, additive blending at high
  resolution (see Visual techniques).
- Liked / wants:
  - the **COSMIC EYE** image (eye-shaped nebula: orange core, violet-blue shell, starfield) — the **main template**;
  - **stars** in the background with **occasional shooting stars**, all adjustable;
  - the **"Cosmic Particles"** style (TouchDesigner tutorial *TD Drop #27*);
  - on every **kick**, something **hits glass**;
  - a **dark mountain with light flowing down like a waterfall of white stars**, rock to rock;
  - a **robot** character (dancing or hitting glass) is fine instead of a real person.

### The main template: COSMIC EYE
- `cosmic-eye.jpg` in the centre: **pin-sharp** (no warp/feedback on the image), soft circular edge blending
  into the starfield.
- Background: crisp point stars (some with 4-point diffraction spikes), twinkle, slow drift, occasional
  shooting stars, faint violet-blue nebula haze — all adjustable.
- Around the image: thin flowing "cosmic threads" / a 3D particle cloud; kick → outward burst + light shake +
  shockwave (optional glass cracks, flash).

### Status
- `build_cosmic_eye.py` builds the COSMIC EYE network in TouchDesigner. Its GLSL was compile-checked, but it
  has **not been run inside TouchDesigner yet** → first task: run it, check `td_logs`, fix any
  parameter-name warnings, screenshot `OUT`.
- Nothing tested on real hardware yet (GPU, MIDI controller, Ableton, projector).

### Working rules
- Never fake an integration — if something is not connected, say so.
- Never put API keys in files or git.
- Ask before spending credits (e.g. AI video generation).
- If something is only partly possible, say so plainly and offer the realistic path.

---

## Visual techniques

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

### 10. Stars and shooting stars

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

### 11. Glass hit on kick

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

## TouchDesigner guide

#### Basics (explain to the artist in plain Turkish)

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

#### GLSL TOP rules (TouchDesigner dialect)

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

#### Feedback loop pattern

```
constant(black) → feedbackTOP ──┐
                 (par.top = 'flow')
flow (GLSL TOP) ← feedback, params ...   # reads the previous frame, writes the new one
```

The Feedback TOP's `top` parameter points to the node whose output it feeds
back. Its wired input is used for the first frame and resets.

#### Audio → kick chain

```
audiodeviceinCHOP → audiofilterCHOP (low-pass ≈ 120 Hz) → analyzeCHOP (RMS power)
                  → lagCHOP (fast attack, ~0.15 s release) → nullCHOP 'kick'
```

Use it in expressions as
`min(1, op('kick')[0].eval() * gain)`.

For sharp hits, detect onsets: fire when the value crosses about 0.55, and
re-arm when it drops below about 0.3. A Trigger CHOP or a CHOP Execute DAT can
do this.

#### The COSMIC EYE network (`touchdesigner/build_cosmic_eye.py`)

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

#### Next builds (in order)

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

#### Performance tips

- Keep resolution at 1920×1080 unless needed. Use 16-bit float buffers and
  avoid 32-bit except for particle state.
- Cook only what is visible. Turn off viewers on heavy nodes.
- Watch the Performance Monitor. Lower the particle count before lowering
  resolution, because sharpness matters most.

---

## Scene recipes

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
- Video version: a clip of a robot or fist hitting glass in a Movie File In
  TOP; on every kick, jump the playhead to a cue point just before the hit
  (cue/trigger from the kick onset), so every kick lands on the hit.

### 4. Dancing robot

- Free stock clips found:
  - Pexels "Futuristic Robot Dancing Under Neon Lights":
    https://www.pexels.com/video/futuristic-robot-dancing-under-neon-lights-29770096/
  - Pixabay "Robot, Dance, Fun": https://pixabay.com/videos/robot-dance-fun-168502/
- Use it as a backdrop video, retriggered on the beat, with glass cracks on
  the kick and the eye floating in front.

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

## Audio, MIDI and Ableton

### Audio bands
| Band | Range | Typical target |
|---|---|---|
| Kick | 35–120 Hz | impact, particle burst, image pulse |
| Bass | 60–250 Hz | swirl, curl |
| Mid | 250–2000 Hz | liquid distortion |
| High | 4–14 kHz | particle density, twinkle |
| Synth / SH-4 | 300–3000 Hz (own input channel) | thread brightness, morph |

- Envelope: fast attack, slower release (punchy but smooth).
- Kick onset: fire when kick crosses ~0.55, re-arm below ~0.3 (Trigger CHOP or a CHOP Execute DAT).
- In TouchDesigner: Audio Device In CHOP → Audio Filter CHOP (band) → Analyze CHOP (RMS power) → Lag CHOP →
  Null CHOP; one chain per band. (Audio Spectrum CHOP is an alternative for many bands at once.)

### Getting Ableton audio into TouchDesigner
- **Loopback / interface:** route Ableton's master (or a dedicated return for the Roland SH-4) to a loopback
  device (BlackHole / Loopback / VB-Cable) or a multichannel interface, then use Audio Device In CHOP and
  pick channels per band.
- **OSC levels:** a Max for Live envelope follower sends e.g. `/eye/audio/kick 0.8` to TouchDesigner's
  OSC In CHOP.

### Tempo and MIDI
- Ableton → **MIDI Clock** (Preferences → Link/Tempo/MIDI → Clock on the output port); in TouchDesigner
  read it with MIDI In CHOP / a beat CHOP. Ableton Link is also supported in TouchDesigner.
- MIDI controllers: MIDI In CHOP (or MIDI In Map) → map CCs (0–1) to the custom parameters of the
  component; notes as triggers (e.g. glass hit, next scene, blackout).

---

## References

#### Wikipedia (concepts)

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

#### Papers and articles

- Robert Bridson, "Curl-Noise for Procedural Fluid Flow" (SIGGRAPH 2007).
- Jeff Jones, "Characteristics of pattern formation and evolution in
  approximations of Physarum transport networks" (Artificial Life, 2010).
- Sage Jenson, "Physarum" (article and artworks). Search for
  "Sage Jenson physarum".
- Karl Sims, Reaction-Diffusion tutorial: https://www.karlsims.com/rd.html
- Inigo Quilez, articles on SDFs, raymarching and noise:
  https://iquilezles.org/articles/
- TouchDesigner documentation: https://docs.derivative.ca/

#### YouTube examples (found by search; check that each still works)

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

#### Free stock video

- Pexels robot videos: https://www.pexels.com/search/videos/robot/
- Pixabay dancing robot videos: https://pixabay.com/videos/search/dancing%20robot/
- Mixkit robot videos: https://mixkit.co/free-stock-video/robot/
