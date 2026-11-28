# Project brief: THE EYE

## The artist and the goal

- The artist is a Turkish-speaking generative audiovisual performer. They want
  answers in Turkish, short and practical. They are not a programmer, so give
  click-by-click steps.
- THE EYE is **a musical instrument for generative visuals**, not an admin
  dashboard. It is played live with music from Ableton Live, with MIDI
  controllers and projectors.
- Central motif: a **surreal, hyper-real eye** surrounded by living,
  procedural matter: tentacles, superformula geometry, fractals, liquid
  distortion, particles, feedback and glitch.

## Aesthetic

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

## The main template: COSMIC EYE

- The image `public/templates/cosmic-eye.jpg` sits in the centre. It must stay
  pin-sharp, with no warp or feedback on the image itself, and a soft circular
  edge blends it into the starfield.
- Background: crisp point stars, some with four-point diffraction spikes,
  twinkling, slow drift, occasional shooting stars and a faint violet-blue
  nebula haze. Every part is adjustable.
- Around the image: thin flowing "cosmic threads" or a 3D particle cloud. Kick
  makes them burst outward. On the kick there is also a light shake and a
  shockwave, and optionally glass cracks and a flash.

## Current status (late November 2026)

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

## Open issues

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

## Working rules learned so far

- Never fake an integration. If something is not connected, say
  DISCONNECTED and use a clearly labelled simulated or demo mode.
- Do not put API keys in code or in git. Use environment variables.
- Get the user's consent before spending credits (for example on AI video
  generation).
- When asked for something only partly possible, say so plainly and offer
  the realistic path.
