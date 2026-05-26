/** Shade a #rrggbb hex toward white (positive %) or black (negative %). */
export function shade(hex: string, percent: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const r = Math.round(((num >> 16) & 0xff) * (1 - p) + t * p);
  const g = Math.round(((num >> 8) & 0xff) * (1 - p) + t * p);
  const b = Math.round((num & 0xff) * (1 - p) + t * p);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Perceived luminance 0-255; useful to decide light vs dark. */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 128;
  const num = parseInt(m[1], 16);
  return 0.299 * ((num >> 16) & 0xff) + 0.587 * ((num >> 8) & 0xff) + 0.114 * (num & 0xff);
}
