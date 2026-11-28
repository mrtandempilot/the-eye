# Scene recipes the artist wants

## 1. COSMIC EYE (main template)

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

## 2. Living capillary organism

- Physarum simulation, with millions of agents in 2D or 3D.
- Trails are single-pixel, rendered with additive blending, high decay
  (0.95–0.98) and a little diffusion.
- Palette: deep violet → electric blue → cyan, with warm cores where the
  trails are dense.
- Optionally seed agents from the eye or image so the organism grows out of
  it.
- Audio: kick boosts deposit and adds a radial push; highs widen the sensor
  angle.

## 3. Glass hit on the kick

- Kick Impact: shake, shockwave from a random point near the centre,
  Voronoi glass cracks that fade in about 1 s, and a short flash.
- Video version: a clip of a robot or fist hitting glass, played in
  ON KICK mode with the cue point just before the hit, so every kick restarts
  the clip on the hit.

## 4. Dancing robot

- Free stock clips found:
  - Pexels "Futuristic Robot Dancing Under Neon Lights":
    https://www.pexels.com/video/futuristic-robot-dancing-under-neon-lights-29770096/
  - Pixabay "Robot, Dance, Fun": https://pixabay.com/videos/robot-dance-fun-168502/
- Use it as a backdrop video, in ON BEAT mode, with glass cracks on the kick
  and the eye floating in front.

## 5. Star waterfall over a dark mountain

- A near-black mountain (heightmap or depth-estimated photo) with only a rim
  light.
- Thousands of white-blue star particles:
  - spawn at the peaks;
  - slide along the rock surface following the steepest descent;
  - fall off edges onto the next rock.
- Short trails, additive blending, subtle bloom.
- The kick sends a "surge" of extra particles.

## 6. Character swap (dancer → robot or creature)

- Offline: AI motion transfer, which needs video generation credits. Only
  use it with consent if a real person is involved.
- Live: StreamDiffusion in TouchDesigner on a camera feed. It needs a strong
  NVIDIA GPU, and the look is dreamy rather than exact.
