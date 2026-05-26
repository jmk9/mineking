import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { drawBoard, pointToCell } from '../render/renderer';
import type { Theme } from '../render/theme';
import { useGlyphs } from './useGlyphs';

interface Props {
  state: GameState;
  cellSize: number;
  theme: Theme;
  onCellTap: (r: number, c: number) => void;
}

const TAP_MOVE_TOLERANCE = 14; // px; beyond this a pointer gesture is a scroll, not a tap
const LOUPE_SIZE = 116; // css px of the magnifier
const LOUPE_MAG = 2.5; // magnification factor
const LOUPE_OFFSET_Y = 28; // how far above the finger the loupe floats

interface LoupePos {
  clientX: number;
  clientY: number;
}

export function BoardCanvas({ state, cellSize, theme, onCellTap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const [loupe, setLoupe] = useState<LoupePos | null>(null);

  const boardCssW = state.cols * cellSize;
  const boardCssH = state.rows * cellSize;
  const glyphV = useGlyphs(theme); // bumps when custom glyph images finish loading

  // Redraw the board whenever the game state, size, theme, or glyphs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(boardCssW * dpr);
    canvas.height = Math.round(boardCssH * dpr);
    canvas.style.width = `${boardCssW}px`;
    canvas.style.height = `${boardCssH}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBoard(ctx, state, { cellSize, theme });
  }, [state, cellSize, theme, boardCssW, boardCssH, glyphV]);

  const localPoint = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /** Draw a magnified crop of the board around (px,py) into the loupe canvas. */
  const drawLoupe = (px: number, py: number) => {
    const board = canvasRef.current;
    const lc = loupeRef.current;
    if (!board || !lc) return;

    const dprBoard = board.width / boardCssW;
    const dprL = window.devicePixelRatio || 1;
    lc.width = Math.round(LOUPE_SIZE * dprL);
    lc.height = Math.round(LOUPE_SIZE * dprL);

    const srcCss = LOUPE_SIZE / LOUPE_MAG; // css px of board shown in the loupe
    // center the crop on the finger, but keep it inside the board edges
    const cx = Math.max(srcCss / 2, Math.min(boardCssW - srcCss / 2, px));
    const cy = Math.max(srcCss / 2, Math.min(boardCssH - srcCss / 2, py));
    const sxCss = cx - srcCss / 2;
    const syCss = cy - srcCss / 2;

    const ctx = lc.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, lc.width, lc.height);
    ctx.drawImage(
      board,
      sxCss * dprBoard,
      syCss * dprBoard,
      srcCss * dprBoard,
      srcCss * dprBoard,
      0,
      0,
      lc.width,
      lc.height,
    );

    ctx.setTransform(dprL, 0, 0, dprL, 0, 0);

    // highlight the targeted cell
    const cell = pointToCell(px, py, state, cellSize);
    if (cell) {
      const lx = ((cell.c * cellSize - sxCss) / srcCss) * LOUPE_SIZE;
      const ly = ((cell.r * cellSize - syCss) / srcCss) * LOUPE_SIZE;
      const lsize = (cellSize / srcCss) * LOUPE_SIZE;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, ly, lsize, lsize);
    }

    // red dot marking the exact press point
    const dotX = ((px - sxCss) / srcCss) * LOUPE_SIZE;
    const dotY = ((py - syCss) / srcCss) * LOUPE_SIZE;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  };

  const handleDown = (e: React.PointerEvent) => {
    const p = localPoint(e);
    downPos.current = p;
    drawLoupe(p.x, p.y);
    setLoupe({ clientX: e.clientX, clientY: e.clientY });
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!downPos.current) return;
    const p = localPoint(e);
    drawLoupe(p.x, p.y);
    setLoupe({ clientX: e.clientX, clientY: e.clientY });
  };

  const endInteraction = () => {
    downPos.current = null;
    setLoupe(null);
  };

  const handleUp = (e: React.PointerEvent) => {
    const start = downPos.current;
    endInteraction();
    if (!start) return;
    const end = localPoint(e);
    if (Math.hypot(end.x - start.x, end.y - start.y) > TAP_MOVE_TOLERANCE) return; // was a pan
    const cell = pointToCell(end.x, end.y, state, cellSize);
    if (cell) onCellTap(cell.r, cell.c);
  };

  // Place the loupe above the finger, clamped to the viewport.
  const loupeStyle: React.CSSProperties | undefined = loupe
    ? {
        position: 'fixed',
        left: Math.max(8, Math.min(window.innerWidth - LOUPE_SIZE - 8, loupe.clientX - LOUPE_SIZE / 2)),
        top: Math.max(8, loupe.clientY - LOUPE_SIZE - LOUPE_OFFSET_Y),
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        borderRadius: '50%',
        border: '3px solid #38bdf8',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        zIndex: 50,
      }
    : undefined;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={endInteraction}
        style={{ touchAction: 'manipulation', display: 'block' }}
      />
      <canvas ref={loupeRef} style={loupeStyle} hidden={!loupe} />
    </>
  );
}
