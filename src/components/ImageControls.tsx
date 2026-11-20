'use client';

import { useEffect, useRef, useState } from 'react';
import type { Scene } from '@/engine/types';
import { cx } from '@/lib/cx';
import { getImage } from '@/lib/imageStore';
import * as A from '@/state/actions';
import { store } from '@/state/appState';
import { useStoreSlice } from '@/state/createStore';
import { Seg } from './ui/primitives';

export function ImagePicker({ onFile, children, className, title }: { onFile: (f: File) => void; children: React.ReactNode; className?: string; title?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" title={title} className={className} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
    </>
  );
}

function SourcePreview({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    getImage(id).then((u) => live && setUrl(u ?? null)).catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Scene image" className="h-16 w-16 shrink-0 rounded-md border border-line-2 object-cover" />
  ) : (
    <div className="h-16 w-16 shrink-0 animate-pulse rounded-md border border-line-2 bg-panel-2" />
  );
}

export default function ImageControls({ scene }: { scene: Scene }) {
  const ai = useStoreSlice(store, (s) => ({
    busy: s.aiBusy.includes(scene.id),
    error: s.aiError?.sceneId === scene.id ? s.aiError.message : null,
  }));
  const [hint, setHint] = useState('');
  const btn = 'h-7 rounded-md border px-2 text-[10px] font-bold tracking-[.12em] transition-colors disabled:opacity-40';

  if (!scene.image) {
    return (
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[11px] text-mute">No image in this scene</span>
        <ImagePicker
          className={cx(btn, 'ml-auto border-violet/50 bg-violet/15 text-violet-hi hover:bg-violet/25')}
          title="Add an image to this scene and let Claude tune it"
          onFile={(f) => A.setSceneImage(scene.id, f, true)}
        >
          + IMAGE · AI
        </ImagePicker>
      </div>
    );
  }

  return (
    <div className="border-b border-line px-3 py-2.5">
      <div className="flex gap-3">
        <SourcePreview id={scene.image.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="label">Image</span>
            <Seg
              className="ml-auto"
              value={scene.image.mode}
              onChange={(m) => A.setImageMode(scene.id, m)}
              options={[
                { v: 'center', l: 'CENTER', title: 'Image replaces the eye' },
                { v: 'background', l: 'BACKDROP', title: 'Image fills the background' },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={ai.busy}
              onClick={() => A.aiTune(scene.id, hint)}
              className={cx(btn, ai.busy ? 'border-cyan bg-cyan/15 text-cyan' : 'border-cyan/60 bg-cyan/10 text-cyan hover:bg-cyan/20')}
              title="Claude looks at the image and sets the generator, mode and every parameter"
            >
              {ai.busy ? 'CLAUDE IS LOOKING…' : '✦ AI TUNE'}
            </button>
            <ImagePicker className={cx(btn, 'border-line-2 text-dim hover:text-text')} onFile={(f) => A.setSceneImage(scene.id, f, false)} title="Replace the image, keep the settings">
              REPLACE
            </ImagePicker>
            <button type="button" className={cx(btn, 'border-line-2 text-mute hover:text-tally')} onClick={() => A.removeSceneImage(scene.id)}>
              REMOVE
            </button>
          </div>
        </div>
      </div>
      <input
        type="text"
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter' && !ai.busy) A.aiTune(scene.id, hint);
        }}
        placeholder="Optional note for Claude, e.g. “dark, slow, more tentacles”"
        className="mt-2 h-7 w-full px-2 text-[11px]"
        maxLength={300}
      />
      {ai.busy && <div className="mt-2 h-[2px] overflow-hidden rounded bg-white/5"><div className="h-full w-1/3 animate-[aiBar_1.2s_ease-in-out_infinite] bg-cyan" /></div>}
      {ai.error && (
        <p className="mt-2 flex items-start gap-2 text-[11px] text-tally">
          <span className="flex-1">{ai.error}</span>
          <button type="button" className="text-mute hover:text-text" onClick={A.clearAiError}>✕</button>
        </p>
      )}
      {scene.aiNote && !ai.busy && (
        <p className="mt-2 rounded-md border border-cyan/20 bg-cyan/[.05] px-2 py-1.5 text-[11px] leading-relaxed text-dim">
          <span className="font-bold text-cyan">✦ Claude: </span>
          {scene.aiNote}
        </p>
      )}
    </div>
  );
}
