# Visual techniques: what makes each look

Each section explains how a technique works and what it looks like. All of
them run in real time on a GPU, as GLSL shaders, which work in TouchDesigner
GLSL TOPs or WebGL.

---

## 1. Noise and fBm: the raw material of organic motion

- **Value / Perlin / Simplex noise**: a smooth random field. Sampling it with
  time gives motion that looks natural.
- **fBm (fractal Brownian motion)**: add several octaves of noise, each with
  double the frequency and half the amplitude. The result looks like clouds,
  nebulae or flesh.
- **Domain warping**: feed the output of noise into the coordinates of more
  noise, `f(p + f(p + f(p)))`. This gives liquid, marbled, alien-tissue
  textures.

## 2. Curl noise: silky, swirling flow

- Take a smooth noise field ψ and use its **curl** as a velocity field.
  - 2D: `v = (∂ψ/∂y, −∂ψ/∂x)`
  - 3D: curl of a 3-component noise field.
- Curl fields are **divergence-free**, so particles never bunch up or vanish.
  They swirl like smoke or ink in water.
- Compute it with finite differences:
  `v.x = (ψ(p+ey) − ψ(p−ey))/2e`, and so on.
- Classic reference: Bridson, "Curl-Noise for Procedural Fluid Flow" (2007).

## 3. Particles flowing with trails: "hair-thin threads"

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

## 4. Physarum (slime mould): "a living organism of capillaries"

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

## 5. Reaction-diffusion (Gray-Scott): coral, brain, skin

- Two chemicals A and B:
  - `A' = A + (Da∇²A − AB² + f(1−A))·dt`
  - `B' = B + (Db∇²B + AB² − (k+f)B)·dt`
- Different feed and kill values (f, k) give spots, stripes, mazes or
  mitosis.
- It runs as a feedback GLSL loop: two channels in one texture.
- Reference: Karl Sims' tutorial.

## 6. Branching growth: veins, roots, lightning

- **DLA (diffusion-limited aggregation)**: random walkers stick to a growing
  cluster. The result is coral or frost branching.
- **Space colonization**: branches grow toward attractor points. This gives
  realistic leaf veins and blood-vessel trees.

## 7. Gielis superformula: organic geometry

- `r(φ) = ( |cos(mφ/4)/a|^n2 + |sin(mφ/4)/b|^n3 )^(−1/n1)`
- `m` sets the symmetry. `n1`, `n2` and `n3` move the shape between circles,
  stars, flowers, starfish and cells.
- Used for iris morph, petal blooms, ring patterns and lattices.

## 8. Raymarching / SDF: true 3D in a shader

- Describe the shape as a signed distance function. March a ray from the
  camera in steps equal to the distance until it hits the surface.
- Get normals from the distance gradient, then add lighting, soft shadows,
  ambient occlusion and **subsurface scattering** (light passing through, so
  surfaces look fleshy and translucent).
- Fractals such as the Mandelbulb or kaleidoscopic IFS make alien organisms.
- **Volumetric rendering** (marching through a density field and accumulating
  light) makes glowing nebulae and clouds.

## 9. Feedback: memory and trails

- Feed the previous frame back in, slightly zoomed, rotated or displaced, and
  multiplied by a value below 1. You get tunnels, echoes and smears.
- This is TouchDesigner's signature trick (Feedback TOP).

## 10. Stars and shooting stars (as built)

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

## 11. Glass hit on kick (as built)

- **Shake**: a random uv offset multiplied by a hit envelope that decays
  quickly (`exp(−9t)`).
- **Shockwave**: a ring `exp(−((r − front)·10)²)` expanding from the impact
  point. It displaces uv along the radius.
- **Cracks**: Voronoi cells in log-polar coordinates around the impact point.
  The edge is where `F2 − F1` is small, and each shard is offset slightly to
  refract. They fade over about one second.
- **Flash**: a short additive white.

## 12. Making it crisp ("çok net")

- Render at full resolution or higher (supersampling), then downscale.
- Size thin elements in **pixels** (`px = 1/resolution.y`), not in scene units.
- Keep the hero image out of warp and feedback. Composite it after those
  effects.
- Use HDR (16-bit float) buffers for feedback and particles, then tone map
  (ACES) at the end. Keep bloom subtle with a high threshold.
- Additive, many-faint beats few-bright: thousands of 1-px lines look silky;
  thick lines look cheap.

## 13. Dark mountain and star waterfall

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
