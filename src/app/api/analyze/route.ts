import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { clampParam, PARAM_GROUPS, PARAMS } from '@/engine/params';
import { KIND_LABEL, SCENE_KINDS } from '@/engine/types';

/**
 * POST /api/analyze  { image: "data:image/jpeg;base64,…", hint?: string }
 *
 * Claude looks at the image and designs a THE EYE scene around it: which
 * generator to use, whether the image replaces the eye or becomes the
 * backdrop, and values for every visual parameter.
 * Needs ANTHROPIC_API_KEY in the server environment (Vercel → Settings →
 * Environment Variables).
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'claude-opus-5-5';

const ParamsSchema = z.object(
  Object.fromEntries(PARAMS.map((p) => [p.key, z.number()])) as Record<string, z.ZodNumber>,
);

const DesignSchema = z.object({
  name: z.string(),
  kind: z.enum(SCENE_KINDS),
  imageMode: z.enum(['center', 'background']),
  params: ParamsSchema,
  note: z.string(),
});

const PARAM_DOC = PARAM_GROUPS.map((g) => {
  const lines = PARAMS.filter((p) => p.group === g.id).map(
    (p) => `  - ${p.key} (${p.label}): ${p.min} … ${p.max}, default ${p.def}`,
  );
  return `${g.label}:\n${lines.join('\n')}`;
}).join('\n');

const SYSTEM = `You are the visual director of THE EYE, a real-time generative audiovisual performance system used live by a VJ.
The performer uploads an image; you design one scene around it.

Generators ("kind"):
${SCENE_KINDS.map((k) => `- ${k}: ${KIND_LABEL[k]}`).join('\n')}
Every generator can show a surreal eye in the centre surrounded by tentacles, superformula rings, fractal filaments, liquid distortion and particles.

The image becomes a texture layer:
- imageMode "center": the image replaces the eye in the middle, cut out by a superformula-shaped edge (imgEdge), sized by eyeSize, with tentacles growing from behind it. Best for a single clear subject: a face, an eye, an object, a logo, a creature.
- imageMode "background": the image fills the screen behind the effects, liquid-warped (imgWarp) and slowly rotated. Best for landscapes, textures, abstract or full-frame images.

Parameters (stay inside the ranges):
${PARAM_DOC}

Guidance:
- Match the mood, palette, energy and shapes of the image. Organic subjects → tentacles/bloom/liquid; architecture or symmetry → geometric/superformula; space, night, light → particles/tunnel/fractal.
- hue rotates ALL colours including the image, so keep hue near 0 (or near 1) unless a deliberate shift serves the image; saturation 1 keeps the image's own colours.
- Keep the image readable: imgMix 0.85–1, imgWarp 0.15–0.5, moderate feedback (fbAmount ≤ 0.6) and glitch ≤ 0.2 unless the image calls for chaos.
- In "center" mode choose eyeSize 0.45–0.8 so the image has presence; in "background" mode keep effects around the centre lighter so the image shows.
- This is a live instrument: leave headroom so audio modulation can push parameters further.

Return:
- name: a short evocative scene name in UPPERCASE, max 24 characters.
- note: 1–2 sentences in Turkish telling the performer what you saw in the image and the choices you made.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables and redeploy.' },
      { status: 503 },
    );
  }

  let body: { image?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(body.image ?? '');
  if (!m) return Response.json({ error: 'Expected an image data URL (jpeg/png/webp/gif).' }, { status: 400 });
  if (m[2].length > 6_000_000) return Response.json({ error: 'Image too large.' }, { status: 413 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(DesignSchema) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: m[1] as 'image/jpeg', data: m[2] },
            },
            {
              type: 'text',
              text: body.hint?.trim()
                ? `Design a scene for this image. Performer's note: ${body.hint.trim().slice(0, 500)}`
                : 'Design a scene for this image.',
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return Response.json({ error: 'Claude declined to analyse this image.' }, { status: 422 });
    }
    const design = response.parsed_output;
    if (!design) return Response.json({ error: 'Claude returned no usable design.' }, { status: 502 });

    const params: Record<string, number> = {};
    for (const p of PARAMS) {
      const v = design.params[p.key];
      params[p.key] = clampParam(p.key, Number.isFinite(v) ? v : p.def);
    }
    return Response.json({
      name: design.name.toUpperCase().slice(0, 24),
      kind: design.kind,
      imageMode: design.imageMode,
      params,
      note: design.note,
      model: response.model,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: 'The Anthropic API key was rejected.' }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'Rate limited by the Anthropic API — try again in a moment.' }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Anthropic API error ${error.status}: ${error.message}` }, { status: 502 });
    }
    return Response.json({ error: (error as Error).message || 'Analysis failed.' }, { status: 500 });
  }
}
