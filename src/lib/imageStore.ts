/**
 * Browser-side image store (IndexedDB). Images are kept out of localStorage
 * because they are far larger than the 5 MB quota allows.
 */
const DB = 'the-eye';
const STORE = 'images';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/** Stored media: a JPEG data URL for images, a Blob for videos. */
export type StoredMedia = string | Blob;

export const putImage = (id: string, data: StoredMedia) => tx('readwrite', (s) => s.put(data, id));
/** `asset:/path` ids point at bundled files in /public (templates). */
export const getImage = (id: string): Promise<StoredMedia | undefined> =>
  id.startsWith('asset:') ? Promise.resolve(id.slice(6)) : tx<StoredMedia | undefined>('readonly', (s) => s.get(id));

/** Any image source (data URL or same-origin path) → data URL. */
export async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  return fileToDataUrl(await (await fetch(src)).blob());
}
export const posterKey = (id: string) => id + ':poster';

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export function createVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.onloadeddata = () => resolve(v);
    v.onerror = () => reject(new Error('Video could not be decoded (try MP4/H.264 or WebM).'));
    v.src = src;
    v.load();
  });
}

/** Grab a still frame (~1 s in) from a video as a JPEG data URL. */
export async function videoPoster(blob: Blob, max = 1280): Promise<string> {
  const url = URL.createObjectURL(blob);
  try {
    const v = await createVideoElement(url);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = Math.min(1, (v.duration || 2) * 0.25);
    });
    const k = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(v.videoWidth * k));
    c.height = Math.max(1, Math.round(v.videoHeight * k));
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export const deleteImage = async (id: string) => {
  if (id.startsWith('asset:')) return;
  await tx('readwrite', (s) => s.delete(id));
  await tx('readwrite', (s) => s.delete(posterKey(id)));
};

/** Downscale a user image to a JPEG data URL (long edge ≤ max). */
export async function fileToDataUrl(file: Blob, max = 2048, quality = 0.92): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return c.toDataURL('image/jpeg', quality);
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be decoded'));
    img.src = src;
  });
}
