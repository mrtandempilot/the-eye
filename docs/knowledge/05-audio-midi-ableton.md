# Audio, MIDI, Ableton and the protocol

## Audio bands (used by the dashboard)

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

## Getting Ableton audio in

- **Option A, loopback or interface.** Route Ableton's master, or a dedicated
  return for the Roland SH-4, to a loopback device (BlackHole, Loopback,
  VB-Cable) or to the inputs of a multichannel interface. In TouchDesigner use
  an Audio Device In CHOP. In the dashboard, choose INPUT and pick a channel
  per band.
- **Option B, OSC levels.** A Max for Live envelope follower sends
  `/eye/audio/kick 0.8` (or `/eye/audio k b m h s`) to the bridge on UDP 7001,
  or straight to TouchDesigner's OSC In.

## Tempo

- Ableton → MIDI Clock: in Preferences → Link/Tempo/MIDI, turn on Clock for
  the output port. The dashboard follows it (shown as `MIDI CLK`). In
  TouchDesigner use a MIDI In CHOP or the beat CHOP.
- Alternatively send OSC `/eye/bpm 128`.

## MIDI

- The dashboard has MIDI LEARN: click a control, then move a knob. CC values
  map 0–1 to the parameter range; notes act as buttons.
- Button targets: `btn:take`, `cut`, `blackout`, `freeze`, `random`, `prev`,
  `next`, `tap`, `auto`, `hit`.
- Continuous targets: `mix`, `master`, `trans.duration`, `trans.intensity`,
  `audio.reactivity`, `param:<key>`.

## WebSocket protocol (dashboard ↔ TouchDesigner or bridge, JSON)

- Outbound:
  - `hello` with the list of parameters;
  - `frame` at about 30 Hz:
    `{t, bpm, beat, mix, master, blackout, freeze, transition, a:{id,name,kind,params}, b, audio}`;
  - `event` with name `take`, `cut`, `committed` or `hit`.
- Inbound:
  - `{type:'audio', levels:{kick,…}}`
  - `{type:'control', target:'btn:take', value:1}`
  - `{type:'bpm', bpm:128}`

## OSC map (`npm run bridge -- --osc-out 127.0.0.1:7000 --osc-in 7001`)

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
