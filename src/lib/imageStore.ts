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

export const putImage = (id: string, dataUrl: string) => tx('readwrite', (s) => s.put(dataUrl, id));
export const getImage = (id: string) => tx<string | undefined>('readonly', (s) => s.get(id));
export const deleteImage = (id: string) => tx('readwrite', (s) => s.delete(id));

/** Downscale a user image to a JPEG data URL (long edge ≤ max). */
export async function fileToDataUrl(file: Blob, max = 1280, quality = 0.88): Promise<string> {
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
