import { clampParam, PARAM_BY_KEY } from '@/engine/params';
import { KIND_PRESETS, uid } from '@/engine/presets';
import { SCENE_KINDS, type ImageMode, type Scene, type SceneKind, type TransitionType } from '@/engine/types';
import { deleteImage, fileToDataUrl, getImage, putImage } from '@/lib/imageStore';
import { live, store, type AppState, type AudioChannelCfg, type MidiMapping } from './appState';

/* ------------------------------------------------------------------ events
 * Small event bus so integrations (TouchDesigner bridge, output window…)
 * can observe discrete performance events without coupling to the UI.
 */
type PerfEvent =
  | { type: 'take'; from: string; to: string; transition: TransitionType; duration: number }
  | { type: 'cut'; to: string }
  | { type: 'committed'; a: string; b: string };
const listeners = new Set<(e: PerfEvent) => void>();
export const onPerfEvent = (fn: (e: PerfEvent) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = (e: PerfEvent) => listeners.forEach((fn) => fn(e));

/* ------------------------------------------------------------------ scenes */
const S = () => store.get();

function nextSceneId(after: string, dir = 1): string {
  const list = S().scenes;
  const i = list.findIndex((s) => s.id === after);
  if (list.length === 0) return after;
  return list[(i + dir + list.length) % list.length].id;
}

export function selectScene(id: string) {
  store.set({ selectedId: id });
}

export function addScene(kind: SceneKind = 'eye') {
  const id = uid();
  const n = S().scenes.filter((s) => s.kind === kind).length + 1;
  const scene: Scene = { id, name: `NEW SCENE ${n}`, kind, params: { ...KIND_PRESETS[kind] } };
  store.set((s) => ({ scenes: [...s.scenes, scene], selectedId: id }));
  return id;
}

export function duplicateScene(id: string) {
  const src = S().scenes.find((s) => s.id === id);
  if (!src) return;
  const copy: Scene = { ...src, id: uid(), name: `${src.name} COPY`, params: { ...src.params } };
  store.set((s) => {
    const i = s.scenes.findIndex((x) => x.id === id);
    const scenes = [...s.scenes];
    scenes.splice(i + 1, 0, copy);
    return { scenes, selectedId: copy.id };
  });
}

export function deleteScene(id: string) {
  const st = S();
  const imgId = st.scenes.find((x) => x.id === id)?.image?.id;
  if (st.scenes.length <= 2) return; // A and B always need a scene
  if (st.transitioning && (id === st.slotA || id === st.slotB)) return;
  const scenes = st.scenes.filter((s) => s.id !== id);
  const patch: Partial<AppState> = { scenes };
  if (st.slotA === id) patch.slotA = scenes[0].id;
  const a = patch.slotA ?? st.slotA;
  if (st.slotB === id || st.slotB === a) {
    patch.slotB = scenes.find((s) => s.id !== a)!.id;
  }
  if (st.selectedId === id) patch.selectedId = a;
  const thumbs = { ...st.thumbs };
  delete thumbs[id];
  patch.thumbs = thumbs;
  store.set(patch);
  if (imgId) releaseImage(imgId);
}

export function renameScene(id: string, name: string) {
  const clean = name.trim().slice(0, 40) || 'UNTITLED';
  store.set((s) => ({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, name: clean } : x)) }));
}

export function moveScene(id: string, toIndex: number) {
  store.set((s) => {
    const scenes = [...s.scenes];
    const from = scenes.findIndex((x) => x.id === id);
    if (from < 0) return {};
    const [it] = scenes.splice(from, 1);
    scenes.splice(Math.max(0, Math.min(scenes.length, toIndex)), 0, it);
    return { scenes };
  });
}

export function setSceneKind(id: string, kind: SceneKind) {
  store.set((s) => ({
    scenes: s.scenes.map((x) => (x.id === id ? { ...x, kind } : x)),
  }));
}

export function setParam(sceneId: string, key: string, value: number) {
  if (!PARAM_BY_KEY[key]) return;
  const v = clampParam(key, value);
  store.set((s) => ({
    scenes: s.scenes.map((x) => (x.id === sceneId ? { ...x, params: { ...x.params, [key]: v } } : x)),
  }));
}

export function resetParams(sceneId: string, keys?: string[]) {
  store.set((s) => ({
    scenes: s.scenes.map((x) => {
      if (x.id !== sceneId) return x;
      const preset = KIND_PRESETS[x.kind];
      const params = { ...x.params };
      for (const k of keys ?? Object.keys(preset)) params[k] = preset[k];
      return { ...x, params };
    }),
  }));
}

export function editTargetSceneId() {
  const s = S();
  return s.editTarget === 'A' ? s.slotA : s.slotB;
}

export function setEditTarget(t: 'A' | 'B') {
  store.set({ editTarget: t });
}

/* ------------------------------------------------------------------ images + AI */
function releaseImage(imgId: string) {
  if (!S().scenes.some((x) => x.image?.id === imgId)) deleteImage(imgId).catch(() => {});
}

function patchScene(id: string, p: Partial<Scene>) {
  store.set((s) => ({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
}

function nameFromFile(file: File) {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return (base || 'IMAGE').toUpperCase().slice(0, 24);
}

/** New scene built around an uploaded image; Claude then tunes it. */
export async function createSceneFromImage(file: File, autoTune = true) {
  const dataUrl = await fileToDataUrl(file);
  const imgId = 'img-' + uid();
  await putImage(imgId, dataUrl);
  const id = uid();
  const scene: Scene = {
    id,
    name: nameFromFile(file),
    kind: 'eye',
    params: { ...KIND_PRESETS.eye, eyeSize: 0.62 },
    image: { id: imgId, mode: 'center' },
  };
  store.set((s) => ({ scenes: [...s.scenes, scene], selectedId: id }));
  if (!S().transitioning && S().slotA !== id) store.set({ slotB: id, editTarget: 'B' });
  if (autoTune) await aiTune(id);
  return id;
}

/** Replace (or add) the image of an existing scene. */
export async function setSceneImage(sceneId: string, file: File, autoTune = false) {
  const dataUrl = await fileToDataUrl(file);
  const imgId = 'img-' + uid();
  await putImage(imgId, dataUrl);
  const old = S().scenes.find((x) => x.id === sceneId)?.image;
  patchScene(sceneId, { image: { id: imgId, mode: old?.mode ?? 'center' } });
  if (old) releaseImage(old.id);
  if (autoTune) await aiTune(sceneId);
}

export function setImageMode(sceneId: string, mode: ImageMode) {
  const img = S().scenes.find((x) => x.id === sceneId)?.image;
  if (img) patchScene(sceneId, { image: { ...img, mode } });
}

export function removeSceneImage(sceneId: string) {
  const img = S().scenes.find((x) => x.id === sceneId)?.image;
  if (!img) return;
  patchScene(sceneId, { image: undefined, aiNote: undefined });
  releaseImage(img.id);
}

/** Ask Claude (server route /api/analyze) to design the scene around its image. */
export async function aiTune(sceneId: string, hint?: string) {
  const sc = S().scenes.find((x) => x.id === sceneId);
  if (!sc?.image || S().aiBusy.includes(sceneId)) return;
  store.set((s) => ({ aiBusy: [...s.aiBusy, sceneId], aiError: null }));
  try {
    const image = await getImage(sc.image.id);
    if (!image) throw new Error('Image not found in this browser.');
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, hint }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status}).`);
    const cur = S().scenes.find((x) => x.id === sceneId);
    if (!cur?.image) return;
    patchScene(sceneId, {
      name: typeof data.name === 'string' && data.name ? data.name : cur.name,
      kind: SCENE_KINDS.includes(data.kind) ? data.kind : cur.kind,
      params: { ...cur.params, ...data.params },
      image: { ...cur.image, mode: data.imageMode === 'background' ? 'background' : 'center' },
      aiNote: typeof data.note === 'string' ? data.note : undefined,
    });
  } catch (e) {
    store.set({ aiError: { sceneId, message: (e as Error).message } });
  } finally {
    store.set((s) => ({ aiBusy: s.aiBusy.filter((x) => x !== sceneId) }));
  }
}

export function clearAiError() {
  store.set({ aiError: null });
}

/* ------------------------------------------------------------------ A / B */
export function cueB(id: string) {
  const s = S();
  if (s.transitioning) return;
  if (id === s.slotA) return;
  store.set({ slotB: id, selectedId: id });
}

let tStart = 0; // mix value when the automatic transition started
let tElapsed = 0;
let manualHold = false;

function ease(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Start an automatic transition A → B using the current settings. */
export function take() {
  const s = S();
  if (s.transitioning || s.slotA === s.slotB) return;
  tStart = live.mix;
  tElapsed = 0;
  manualHold = false;
  store.set({ transitioning: true });
  emit({ type: 'take', from: s.slotA, to: s.slotB, transition: s.transition.type, duration: s.transition.duration });
}

/** Instant switch to B. */
export function cut() {
  const s = S();
  if (s.slotA === s.slotB) return;
  emit({ type: 'cut', to: s.slotB });
  commit();
}

function commit() {
  const s = S();
  const a = s.slotB;
  const b = nextSceneId(a, 1) === a ? s.slotA : nextSceneId(a, 1);
  live.mix = 0;
  manualHold = false;
  store.set({ slotA: a, slotB: b === a ? s.slotA : b, transitioning: false });
  emit({ type: 'committed', a, b });
}

/** Called once per frame by the runtime. */
export function stepTransition(dt: number) {
  const s = S();
  if (!s.transitioning) return;
  const dur = Math.max(0.05, s.transition.duration);
  tElapsed += dt;
  const k = Math.min(1, tElapsed / (dur * (1 - tStart) || dur));
  live.mix = tStart + (1 - tStart) * ease(k);
  if (k >= 1) commit();
}

/** T-bar / MIDI fader. */
export function setManualMix(v: number) {
  const s = S();
  if (s.transitioning) return;
  manualHold = true;
  live.mix = Math.max(0, Math.min(1, v));
  if (live.mix >= 0.999) commit();
}
export function releaseManualMix() {
  if (!manualHold) return;
  manualHold = false;
  if (live.mix < 0.01) live.mix = 0;
}

export function takeTo(id: string) {
  const s = S();
  if (s.transitioning || id === s.slotA) return;
  store.set({ slotB: id });
  take();
}
export function nextScene() {
  takeTo(nextSceneId(S().slotA, 1));
}
export function prevScene() {
  takeTo(nextSceneId(S().slotA, -1));
}
export function randomScene() {
  const s = S();
  const pool = s.scenes.filter((x) => x.id !== s.slotA);
  if (!pool.length) return;
  takeTo(pool[Math.floor(Math.random() * pool.length)].id);
}

export function setTransition(p: Partial<AppState['transition']>) {
  store.set((s) => ({ transition: { ...s.transition, ...p } }));
}

/* ------------------------------------------------------------------ perf */
export function setMaster(v: number) {
  store.set({ master: Math.max(0, Math.min(1.5, v)) });
}
export function toggleFreeze(v?: boolean) {
  store.set((s) => ({ freeze: v ?? !s.freeze }));
}
export function toggleBlackout(v?: boolean) {
  store.set((s) => ({ blackout: v ?? !s.blackout }));
}
export function setBpm(bpm: number, source: AppState['bpmSource'] = 'internal') {
  store.set({ bpm: Math.max(40, Math.min(220, Math.round(bpm * 10) / 10)), bpmSource: source });
}

let taps: number[] = [];
export function tapTempo() {
  const now = performance.now();
  taps = taps.filter((t) => now - t < 2500);
  taps.push(now);
  if (taps.length >= 2) {
    const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    setBpm(60000 / iv, 'tap');
  }
  // re-align downbeat
  live.beat = Math.round(live.beat);
}

export function setRenderScale(v: number) {
  store.set({ renderScale: v });
}

/* ------------------------------------------------------------------ audio */
export function setAudio(p: Partial<AppState['audio']>) {
  store.set((s) => ({ audio: { ...s.audio, ...p } }));
}
export function setAudioChannel(id: string, p: Partial<AudioChannelCfg>) {
  store.set((s) => ({
    audio: { ...s.audio, channels: s.audio.channels.map((c) => (c.id === id ? { ...c, ...p } : c)) },
  }));
}

/* ------------------------------------------------------------------ midi */
export function setMidi(p: Partial<AppState['midi']>) {
  store.set((s) => ({ midi: { ...s.midi, ...p } }));
}
export function toggleMidiLearn() {
  const m = S().midi;
  setMidi({ learn: !m.learn, learnTarget: null });
}
export function setLearnTarget(target: string | null) {
  setMidi({ learnTarget: target });
}
export function addMidiMapping(m: MidiMapping) {
  const maps = S().midi.mappings.filter(
    (x) => x.target !== m.target && !(x.type === m.type && x.channel === m.channel && x.number === m.number),
  );
  setMidi({ mappings: [...maps, m], learnTarget: null });
}
export function clearMidiMapping(target: string) {
  setMidi({ mappings: S().midi.mappings.filter((x) => x.target !== target) });
}

/* ------------------------------------------------------------------ td */
export function setTd(p: Partial<AppState['td']>) {
  store.set((s) => ({ td: { ...s.td, ...p } }));
}

/* ------------------------------------------------------------------ persistence */
const KEY = 'the-eye/v1';

export function loadPersisted() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    const s = S();
    const scenes: Scene[] = Array.isArray(d.scenes) && d.scenes.length >= 2 ? d.scenes : s.scenes;
    const has = (id: string) => scenes.some((x) => x.id === id);
    store.set({
      scenes: scenes.map((x) => ({ ...x, params: { ...KIND_PRESETS[x.kind], ...x.params } })),
      slotA: has(d.slotA) ? d.slotA : scenes[0].id,
      slotB: has(d.slotB) && d.slotB !== d.slotA ? d.slotB : scenes[1].id,
      transition: { ...s.transition, ...(d.transition || {}) },
      bpm: typeof d.bpm === 'number' ? d.bpm : s.bpm,
      renderScale: typeof d.renderScale === 'number' ? d.renderScale : s.renderScale,
      audio: {
        ...s.audio,
        reactivity: d.audio?.reactivity ?? s.audio.reactivity,
        channels: Array.isArray(d.audio?.channels) ? d.audio.channels : s.audio.channels,
      },
      midi: { ...s.midi, mappings: Array.isArray(d.midi?.mappings) ? d.midi.mappings : [] },
      td: { ...s.td, url: d.td?.url || s.td.url, enabled: d.td?.enabled ?? s.td.enabled },
    });
  } catch {
    /* ignore corrupt storage */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function startPersistence() {
  return store.subscribe((s, prev) => {
    if (
      s.scenes === prev.scenes && s.slotA === prev.slotA && s.slotB === prev.slotB &&
      s.transition === prev.transition && s.bpm === prev.bpm && s.audio === prev.audio &&
      s.midi.mappings === prev.midi.mappings && s.td.url === prev.td.url &&
      s.td.enabled === prev.td.enabled && s.renderScale === prev.renderScale
    ) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const st = store.get();
        localStorage.setItem(KEY, JSON.stringify({
          scenes: st.scenes, slotA: st.slotA, slotB: st.slotB, transition: st.transition,
          bpm: st.bpm, renderScale: st.renderScale,
          audio: { reactivity: st.audio.reactivity, channels: st.audio.channels },
          midi: { mappings: st.midi.mappings },
          td: { url: st.td.url, enabled: st.td.enabled },
        }));
      } catch {
        /* storage full / blocked */
      }
    }, 400);
  });
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  location.reload();
}
