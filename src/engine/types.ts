import type { ParamValues } from './params';

/** Generator families implemented by the scene shader (uKind). */
export const SCENE_KINDS = [
  'eye',
  'bloom',
  'tunnel',
  'liquid',
  'geometric',
  'particles',
  'abstract',
] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

export const KIND_LABEL: Record<SceneKind, string> = {
  eye: 'Eye Organism',
  bloom: 'Organic Bloom',
  tunnel: 'Fractal Tunnel',
  liquid: 'Liquid Field',
  geometric: 'Superformula Lattice',
  particles: 'Particle Vortex',
  abstract: 'Kali Fractal',
};

/** center: the image replaces the eye; background: the image is the backdrop */
export type ImageMode = 'center' | 'background';

/** how a video clip follows the music */
export type VideoPlay = 'loop' | 'kick' | 'beat';

/** Image or video layer of a scene (field kept as `image` for compatibility). */
export interface SceneImage {
  id: string; // key in the browser media store (IndexedDB)
  mode: ImageMode;
  kind?: 'image' | 'video';
  play?: VideoPlay;
  /** beat mode: restart every N beats */
  beats?: number;
}

export interface Scene {
  id: string;
  name: string;
  kind: SceneKind;
  params: ParamValues;
  image?: SceneImage;
  /** Claude's explanation of how it tuned the scene for the image */
  aiNote?: string;
}

export const TRANSITIONS = [
  'morph',
  'liquid',
  'dissolve',
  'feedback',
  'glitch',
  'tunnel',
  'particles',
] as const;
export type TransitionType = (typeof TRANSITIONS)[number];

export const TRANSITION_LABEL: Record<TransitionType, string> = {
  morph: 'Morph',
  liquid: 'Liquid',
  dissolve: 'Dissolve',
  feedback: 'Feedback',
  glitch: 'Glitch',
  tunnel: 'Tunnel',
  particles: 'Particle Explosion',
};

export interface SceneRender {
  kind: SceneKind;
  params: ParamValues;
  /** per-scene seed so duplicated scenes can diverge */
  seed: number;
  image?: SceneImage | null;
  /** controller's video playback time, so the output window can follow it */
  videoTime?: number;
}

/** A kick "hit": drives the glass-impact effect */
export interface ImpactState {
  hit: number; // 1 at the moment of impact, decays quickly
  age: number; // seconds since the last impact
  x: number; // impact point, 0..1 screen space
  y: number;
  seed: number;
}

/**
 * Everything the visual engine needs to draw one frame. This is the ONLY
 * contract between controller and engine; it is serialisable so the same
 * frame can be sent to a pop-out output window or an external renderer.
 */
export interface EngineFrame {
  time: number;
  beat: number; // continuous beat count
  pulse: number; // 0..1 beat / kick envelope
  freeze: boolean;
  a: SceneRender;
  b: SceneRender | null;
  mix: number; // 0..1 A→B
  transition: { type: TransitionType; intensity: number };
  master: number; // 0..1.5
  blackout: number; // 0..1 (1 = black)
  renderScale: number; // internal resolution multiplier
  impact?: ImpactState;
}

/** BroadcastChannel name used to stream frames to the pop-out output window. */
export const OUTPUT_CHANNEL = 'the-eye-output';
