import { useEffect, useState } from 'react';
import { loadGlyph } from '../render/glyphCache';
import type { Theme } from '../render/theme';

/** Collect every glyph data-URL referenced by a theme. */
export function glyphUrls(theme: Theme): string[] {
  const urls: string[] = [];
  if (theme.flagImage) urls.push(theme.flagImage);
  if (theme.numberImages) {
    for (const u of Object.values(theme.numberImages)) if (u) urls.push(u);
  }
  return urls;
}

/**
 * Ensure a theme's glyph images are decoded into the cache. Returns a version
 * counter that bumps when new images finish loading, so callers can redraw.
 */
export function useGlyphs(theme: Theme): number {
  const [version, setVersion] = useState(0);
  const key = glyphUrls(theme).join('|');

  useEffect(() => {
    let cancelled = false;
    const urls = glyphUrls(theme);
    if (urls.length === 0) return;
    Promise.all(urls.map(loadGlyph)).then(() => {
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return version;
}
