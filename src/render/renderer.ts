import type { GameState } from '../game/types';
import type { Theme } from './theme';
import { shade } from './color';
import { getGlyph } from './glyphCache';

/** Draw a glyph image fitted (with padding) into a cell. */
function drawGlyphImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  s: number,
): void {
  const pad = s * 0.12;
  ctx.drawImage(img, x + pad, y + pad, s - pad * 2, s - pad * 2);
}

export interface RenderOptions {
  cellSize: number;
  theme: Theme;
}

/**
 * Draw the whole board onto a 2D canvas context. The canvas is expected to be
 * sized to (cols*cellSize, rows*cellSize) in CSS pixels and scaled by dpr.
 */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  opts: RenderOptions,
): void {
  const { cellSize, theme } = opts;
  const w = state.cols * cellSize;
  const h = state.rows * cellSize;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      drawCell(ctx, state, r, c, opts);
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  r: number,
  c: number,
  opts: RenderOptions,
): void {
  const { cellSize: s, theme } = opts;
  const x = c * s;
  const y = r * s;
  const cell = state.grid[r][c];
  const pad = Math.max(1, Math.floor(s * 0.04));

  if (cell.state === 'revealed') {
    if (cell.isMine) {
      // hit/exposed mine
      ctx.fillStyle = state.status === 'lost' ? theme.mineHitBg : theme.revealed;
      ctx.fillRect(x, y, s, s);
      strokeCell(ctx, x, y, s, theme.revealedBorder);
      drawMine(ctx, x, y, s, theme);
    } else {
      ctx.fillStyle = theme.revealed;
      ctx.fillRect(x, y, s, s);
      strokeCell(ctx, x, y, s, theme.revealedBorder);
      if (cell.adjacent > 0) drawNumber(ctx, cell.adjacent, x, y, s, theme);
    }
    return;
  }

  // hidden or flagged: raised, beveled tile for a tactile look
  const tx = x + pad;
  const ty = y + pad;
  const ts = s - pad * 2;
  ctx.fillStyle = theme.hidden;
  ctx.fillRect(tx, ty, ts, ts);
  drawBevel(ctx, tx, ty, ts, shade(theme.hidden, 26), shade(theme.hidden, -28));

  if (cell.state === 'flagged') drawFlag(ctx, x, y, s, theme);
}

/** Light top/left + dark bottom/right edges to make a tile look raised. */
function drawBevel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  light: string,
  dark: string,
): void {
  const w = Math.max(1.5, s * 0.08);
  ctx.lineWidth = w;
  ctx.strokeStyle = light;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + s);
  ctx.lineTo(x + w / 2, y + w / 2);
  ctx.lineTo(x + s, y + w / 2);
  ctx.stroke();
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x + s - w / 2, y);
  ctx.lineTo(x + s - w / 2, y + s - w / 2);
  ctx.lineTo(x, y + s - w / 2);
  ctx.stroke();
}

function strokeCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}

function drawNumber(
  ctx: CanvasRenderingContext2D,
  n: number,
  x: number,
  y: number,
  s: number,
  theme: Theme,
): void {
  const img = getGlyph(theme.numberImages?.[n]);
  if (img) {
    drawGlyphImage(ctx, img, x, y, s);
    return;
  }
  ctx.fillStyle = theme.numberColors[n] ?? '#fff';
  ctx.font = `bold ${Math.floor(s * 0.6)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x + s / 2, y + s / 2 + s * 0.04);
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, theme: Theme): void {
  const img = getGlyph(theme.flagImage);
  if (img) {
    drawGlyphImage(ctx, img, x, y, s);
    return;
  }
  const cx = x + s / 2;
  const poleTop = y + s * 0.2;
  const poleBottom = y + s * 0.8;
  // pole
  ctx.strokeStyle = theme.flagPole;
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx, poleTop);
  ctx.lineTo(cx, poleBottom);
  ctx.stroke();

  ctx.fillStyle = theme.flag;
  ctx.beginPath();
  if (theme.flagShape === 'banner') {
    // rectangle with a notched (swallowtail) right edge
    const w = s * 0.3;
    const h = s * 0.22;
    ctx.moveTo(cx, poleTop);
    ctx.lineTo(cx + w, poleTop);
    ctx.lineTo(cx + w * 0.7, poleTop + h / 2);
    ctx.lineTo(cx + w, poleTop + h);
    ctx.lineTo(cx, poleTop + h);
  } else if (theme.flagShape === 'pennant') {
    // long thin pennant
    ctx.moveTo(cx, poleTop);
    ctx.lineTo(cx + s * 0.34, poleTop + s * 0.08);
    ctx.lineTo(cx, poleTop + s * 0.16);
  } else {
    // triangle
    ctx.moveTo(cx, poleTop);
    ctx.lineTo(cx - s * 0.26, poleTop + s * 0.13);
    ctx.lineTo(cx, poleTop + s * 0.26);
  }
  ctx.closePath();
  ctx.fill();
}

function drawMine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, theme: Theme): void {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const radius = s * 0.22;
  ctx.fillStyle = theme.mine;
  ctx.strokeStyle = theme.mine;
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  // spikes
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius * 1.6, cy + Math.sin(a) * radius * 1.6);
    ctx.stroke();
  }
  // body
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a small sample strip for a theme: a couple of numbers, a flag, and a
 * mine, on the theme's tiles. Used by the theme picker. Canvas should be sized
 * (4*cell, cell) in CSS px and scaled by dpr beforehand.
 */
export function drawThemePreview(ctx: CanvasRenderingContext2D, theme: Theme, cell: number): void {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, cell * 4, cell);

  const samples = [
    { kind: 'num', n: 1 },
    { kind: 'num', n: 3 },
    { kind: 'flag' },
    { kind: 'mine' },
  ] as const;

  samples.forEach((sample, i) => {
    const x = i * cell;
    if (sample.kind === 'flag') {
      ctx.fillStyle = theme.hidden;
      ctx.fillRect(x + 1, 1, cell - 2, cell - 2);
      strokeCell(ctx, x + 1, 1, cell - 2, theme.hiddenBorder);
      drawFlag(ctx, x, 0, cell, theme);
    } else {
      ctx.fillStyle = sample.kind === 'mine' ? theme.mineHitBg : theme.revealed;
      ctx.fillRect(x, 0, cell, cell);
      strokeCell(ctx, x, 0, cell, theme.revealedBorder);
      if (sample.kind === 'mine') drawMine(ctx, x, 0, cell, theme);
      else drawNumber(ctx, sample.n, x, 0, cell, theme);
    }
  });
}

/** Convert a canvas pixel coordinate to a board cell. Returns null if outside. */
export function pointToCell(
  px: number,
  py: number,
  state: GameState,
  cellSize: number,
): { r: number; c: number } | null {
  const c = Math.floor(px / cellSize);
  const r = Math.floor(py / cellSize);
  if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return null;
  return { r, c };
}
