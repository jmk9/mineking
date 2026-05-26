/**
 * Module-level cache of decoded glyph images (data URLs -> HTMLImageElement).
 * The renderer reads from here synchronously; components call `loadGlyph` and
 * re-render once images are ready.
 */
const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<void>>();

export function getGlyph(url: string | undefined): HTMLImageElement | undefined {
  if (!url) return undefined;
  return cache.get(url);
}

export function loadGlyph(url: string): Promise<void> {
  if (cache.has(url)) return Promise.resolve();
  const existing = pending.get(url);
  if (existing) return existing;
  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(url, img);
      pending.delete(url);
      resolve();
    };
    img.onerror = () => {
      pending.delete(url);
      resolve();
    };
    img.src = url;
  });
  pending.set(url, p);
  return p;
}
