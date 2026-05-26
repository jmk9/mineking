import { useEffect, useRef } from 'react';
import { drawThemePreview } from '../render/renderer';
import type { Theme } from '../render/theme';
import { useGlyphs } from './useGlyphs';

/** A small canvas preview of a theme: two numbers, a flag, a mine. */
export function ThemeSwatch({ theme, cell = 34 }: { theme: Theme; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const glyphV = useGlyphs(theme);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cell * 4;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(cell * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${cell}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawThemePreview(ctx, theme, cell);
  }, [theme, cell, glyphV]);

  return <canvas ref={ref} style={{ borderRadius: 6, display: 'block' }} />;
}
