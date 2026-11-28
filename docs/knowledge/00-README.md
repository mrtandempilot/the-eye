# THE EYE: knowledge base

These files cover everything decided and learned so far on **THE EYE**, a
generative audiovisual performance project. They are written for a Claude
Desktop project that has the **TouchDesigner MCP** connected, so Claude can
build the visuals directly in TouchDesigner on the artist's computer.

## How to use (Claude Desktop)

1. Create a new Project in Claude Desktop, for example "THE EYE".
2. Add every `.md` file in this folder to the project's knowledge.
3. Paste the "Project instructions" block below into the project's custom
   instructions.
4. Make sure the TouchDesigner MCP is connected (in Claude Desktop settings
   under Connectors / MCP) and that TouchDesigner is running.
5. In chat, ask for example: "Build the COSMIC EYE network in TouchDesigner
   following 03-touchdesigner-guide.md."

### Project instructions (paste into Claude Desktop)

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

## Files

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
