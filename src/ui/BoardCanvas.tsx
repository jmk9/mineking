import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { drawBoard, pointToCell } from '../render/renderer';
import type { Theme } from '../render/theme';
import { useGlyphs } from './useGlyphs';

export type TapKind = 'auto' | 'reveal' | 'flag' | 'longpress';

interface Props {
  state: GameState;
  cellSize: number;
  theme: Theme;
  loupeEnabled?: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  onCellTap: (r: number, c: number, kind: TapKind) => void;
}

const TAP_MOVE_TOLERANCE = 14; // px; beyond this a pointer gesture is a scroll, not a tap
const LOUPE_SIZE = 116; // css px of the magnifier
const LOUPE_MAG = 2.5; // magnification factor
const LOUPE_OFFSET_Y = 28; // how far above the finger the loupe floats
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const LONG_PRESS_MS = 450; // hold this long to invert the current mode

interface LoupePos {
  clientX: number;
  clientY: number;
}

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function BoardCanvas({
  state,
  cellSize,
  theme,
  loupeEnabled = true,
  zoom,
  onZoomChange,
  onCellTap,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const [loupe, setLoupe] = useState<LoupePos | null>(null);
  // Multi-touch pinch tracking
  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchRef = useRef<{ initialDist: number; initialZoom: number } | null>(null);
  // Long-press: timer + a flag so the eventual pointerup skips the normal tap.
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const boardCssW = state.cols * cellSize;
  const boardCssH = state.rows * cellSize;
  const glyphV = useGlyphs(theme);

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

  const drawLoupe = (px: number, py: number) => {
    const board = canvasRef.current;
    const lc = loupeRef.current;
    if (!board || !lc) return;

    const dprBoard = board.width / boardCssW;
    const dprL = window.devicePixelRatio || 1;
    lc.width = Math.round(LOUPE_SIZE * dprL);
    lc.height = Math.round(LOUPE_SIZE * dprL);

    const srcCss = LOUPE_SIZE / LOUPE_MAG;
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

    const cell = pointToCell(px, py, state, cellSize);
    if (cell) {
      const lx = ((cell.c * cellSize - sxCss) / srcCss) * LOUPE_SIZE;
      const ly = ((cell.r * cellSize - syCss) / srcCss) * LOUPE_SIZE;
      const lsize = (cellSize / srcCss) * LOUPE_SIZE;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, ly, lsize, lsize);
    }

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

  // -------- single-touch handlers (tap / loupe) --------
  const startSingle = (e: React.PointerEvent) => {
    const p = localPoint(e);
    downPos.current = p;
    longPressFired.current = false;
    if (loupeEnabled) {
      drawLoupe(p.x, p.y);
      setLoupe({ clientX: e.clientX, clientY: e.clientY });
    }
    // Touch-only long-press. Mouse already has right-click for flag, so
    // there's no need to repurpose hold-to-flag on desktop.
    if (e.pointerType !== 'mouse') {
      clearLongPress();
      longPressTimer.current = window.setTimeout(() => {
        const start = downPos.current;
        if (!start) return;
        const cell = pointToCell(start.x, start.y, state, cellSize);
        if (!cell) return;
        longPressFired.current = true;
        // Tiny haptic so the user knows the long-press registered (Android
        // honors this; iOS silently ignores).
        try { navigator.vibrate?.(15); } catch { /* ignore */ }
        setLoupe(null);
        onCellTap(cell.r, cell.c, 'longpress');
      }, LONG_PRESS_MS);
    }
  };

  const moveSingle = (e: React.PointerEvent) => {
    if (!downPos.current) return;
    const p = localPoint(e);
    // Any meaningful drag means the user is panning, not holding — cancel
    // the pending long-press so a swipe never accidentally toggles.
    if (Math.hypot(p.x - downPos.current.x, p.y - downPos.current.y) > TAP_MOVE_TOLERANCE) {
      clearLongPress();
    }
    if (loupeEnabled) {
      drawLoupe(p.x, p.y);
      setLoupe({ clientX: e.clientX, clientY: e.clientY });
    }
  };

  const endSingle = (e: React.PointerEvent) => {
    clearLongPress();
    const start = downPos.current;
    downPos.current = null;
    setLoupe(null);
    if (!start) return;
    // Long-press already dispatched the action — don't fire a normal tap on lift.
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    const end = localPoint(e);
    if (Math.hypot(end.x - start.x, end.y - start.y) > TAP_MOVE_TOLERANCE) return;
    const cell = pointToCell(end.x, end.y, state, cellSize);
    if (!cell) return;
    let kind: TapKind = 'auto';
    if (e.pointerType === 'mouse') {
      kind = e.button === 2 ? 'flag' : 'reveal';
    }
    onCellTap(cell.r, cell.c, kind);
  };

  const cancelSingle = () => {
    clearLongPress();
    downPos.current = null;
    longPressFired.current = false;
    setLoupe(null);
  };

  // -------- combined dispatcher (single tap + pinch) --------
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (pointers.current.size === 2) {
      // entering pinch — cancel any single-touch interaction
      cancelSingle();
      const pts = Array.from(pointers.current.values()).slice(0, 2);
      pinchRef.current = { initialDist: dist(pts[0], pts[1]), initialZoom: zoom };
      return;
    }
    if (pointers.current.size === 1) startSingle(e);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinchRef.current && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values()).slice(0, 2);
      const newDist = dist(pts[0], pts[1]);
      if (newDist > 0) {
        const ratio = newDist / pinchRef.current.initialDist;
        const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchRef.current.initialZoom * ratio));
        onZoomChange(z);
      }
      return;
    }
    if (!pinchRef.current) moveSingle(e);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);

    if (pinchRef.current) {
      // pinch ends as soon as any finger lifts; remaining finger doesn't become a tap
      if (pointers.current.size < 2) {
        pinchRef.current = null;
        cancelSingle();
      }
      return;
    }
    endSingle(e);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchRef.current = null;
    cancelSingle();
  };

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
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          touchAction: 'pan-x pan-y',
          display: 'block',
          // Block iOS Safari's long-press callout/selection so our own
          // long-press handler can run without the share menu intercepting.
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      />
      <canvas ref={loupeRef} style={loupeStyle} hidden={!loupe} />
    </>
  );
}
