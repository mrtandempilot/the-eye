# TouchDesigner guide for THE EYE

## Basics (explain to the artist in plain Turkish)

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

## GLSL TOP rules (TouchDesigner dialect)

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

## Feedback loop pattern

```
constant(black) → feedbackTOP ──┐
                 (par.top = 'flow')
flow (GLSL TOP) ← feedback, params ...   # reads the previous frame, writes the new one
```

The Feedback TOP's `top` parameter points to the node whose output it feeds
back. Its wired input is used for the first frame and resets.

## Audio → kick chain

```
audiodeviceinCHOP → audiofilterCHOP (low-pass ≈ 120 Hz) → analyzeCHOP (RMS power)
                  → lagCHOP (fast attack, ~0.15 s release) → nullCHOP 'kick'
```

Use it in expressions as
`min(1, op('kick')[0].eval() * gain)`.

For sharp hits, detect onsets: fire when the value crosses about 0.55, and
re-arm when it drops below about 0.3. A Trigger CHOP or a CHOP Execute DAT can
do this.

## The COSMIC EYE network (`touchdesigner/build_cosmic_eye.py`)

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

## Next builds (in order)

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

## Performance tips

- Keep resolution at 1920×1080 unless needed. Use 16-bit float buffers and
  avoid 32-bit except for particle state.
- Cook only what is visible. Turn off viewers on heavy nodes.
- Watch the Performance Monitor. Lower the particle count before lowering
  resolution, because sharpness matters most.
