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
 * Provider (server environment, e.g. Vercel → Settings → Environment Variables):
 *   OPENROUTER_API_KEY  → OpenRouter, model OPENROUTER_MODEL
 *                         (default anthropic/claude-haiku-5.5)
 *   ANTHROPIC_API_KEY   → Anthropic API directly, model ANTHROPIC_MODEL
 *                         (default claude-opus-5-5)
 * If both are set, OpenRouter is used.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-5.5';
const OPENROUTER_BASE = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

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
- Kick Impact (impShake, impRipple, impCrack, impFlash) makes the screen react like glass being hit on every kick: subtle for calm images, strong (cracks) for aggressive, dark or industrial images.
- Video parameters (vidSpeed, vidCue) only matter for video clips; the image you see may be a still from a video — keep vidSpeed near 1.
- This is a live instrument: leave headroom so audio modulation can push parameters further.

Return:
- name: a short evocative scene name in UPPERCASE, max 24 characters.
- note: 1–2 sentences in Turkish telling the performer what you saw in the image and the choices you made.`;

type Design = z.infer<typeof DesignSchema>;

class AnalyzeError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function userText(hint?: string) {
  return hint?.trim()
    ? `Design a scene for this image. Performer's note: ${hint.trim().slice(0, 500)}`
    : 'Design a scene for this image.';
}

// ---------------------------------------------------------------- Anthropic
async function viaAnthropic(mediaType: string, data: string, hint?: string): Promise<{ design: Design; model: string }> {
  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 16000,
      // server-side refusal fallback is not offered on Haiku models
      ...(ANTHROPIC_MODEL.includes('haiku')
        ? {}
        : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
      output_config: { effort: 'medium', format: betaZodOutputFormat(DesignSchema) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg', data } },
            { type: 'text', text: userText(hint) },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') throw new AnalyzeError('Claude declined to analyse this image.', 422);
    if (!response.parsed_output) throw new AnalyzeError('Claude returned no usable design.', 502);
    return { design: response.parsed_output, model: response.model };
  } catch (error) {
    if (error instanceof AnalyzeError) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new AnalyzeError('The Anthropic API key was rejected.', 502);
    if (error instanceof Anthropic.RateLimitError) throw new AnalyzeError('Rate limited by the Anthropic API — try again in a moment.', 429);
    if (error instanceof Anthropic.APIError) throw new AnalyzeError(`Anthropic API error ${error.status}: ${error.message}`, 502);
    throw error;
  }
}

// ---------------------------------------------------------------- OpenRouter
function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const a = text.indexOf('{');
    const b = text.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(text.slice(a, b + 1));
    throw new Error('no JSON');
  }
}

async function viaOpenRouter(dataUrl: string, hint?: string): Promise<{ design: Design; model: string }> {
  const { $schema: _drop, ...schema } = z.toJSONSchema(DesignSchema) as Record<string, unknown>;
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'THE EYE',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: userText(hint) + '\nReply with the JSON object only.' },
          ],
        },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'scene_design', strict: true, schema } },
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.error?.message || res.statusText;
    if (res.status === 401) throw new AnalyzeError('The OpenRouter API key was rejected.', 502);
    if (res.status === 402) throw new AnalyzeError('OpenRouter: not enough credits on the account.', 402);
    if (res.status === 429) throw new AnalyzeError('Rate limited by OpenRouter — try again in a moment.', 429);
    throw new AnalyzeError(`OpenRouter error ${res.status}: ${msg}`, 502);
  }
  const text: unknown = body?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new AnalyzeError('The model returned no answer.', 502);
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    throw new AnalyzeError('The model did not return valid JSON.', 502);
  }
  // tolerate missing params: fill them from the defaults before validating
  if (parsed && typeof parsed === 'object') {
    const p = parsed as { params?: Record<string, unknown> };
    p.params = { ...Object.fromEntries(PARAMS.map((d) => [d.key, d.def])), ...(p.params ?? {}) };
  }
  const check = DesignSchema.safeParse(parsed);
  if (!check.success) throw new AnalyzeError('The model returned an incomplete scene design.', 502);
  return { design: check.data, model: String(body?.model ?? OPENROUTER_MODEL) };
}

// ---------------------------------------------------------------- handler
export async function POST(req: Request) {
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
  if (!useOpenRouter && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    // diagnostics: names only, never values
    const seen = Object.keys(process.env).filter((k) => /OPENROUTER|ANTHROPIC/i.test(k));
    const where = process.env.VERCEL_ENV ?? 'local';
    return Response.json(
      {
        error:
          `No AI key on the server (environment: ${where}; related variables seen: ${seen.length ? seen.join(', ') : 'none'}). ` +
          'Add OPENROUTER_API_KEY in Vercel → Settings → Environment Variables for this environment, then redeploy.',
      },
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

  try {
    const { design, model } = useOpenRouter
      ? await viaOpenRouter(body.image!, body.hint)
      : await viaAnthropic(m[1], m[2], body.hint);
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
      model,
      provider: useOpenRouter ? 'openrouter' : 'anthropic',
    });
  } catch (error) {
    if (error instanceof AnalyzeError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: (error as Error).message || 'Analysis failed.' }, { status: 500 });
  }
}
