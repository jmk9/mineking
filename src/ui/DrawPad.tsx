import { useEffect, useRef, useState } from 'react';
import { GLYPH_PX } from './imageUtil';

const SIZE = 256; // css drawing surface
const COLORS = ['#ef4444', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a855f7', '#ffffff', '#0f172a'];

interface Props {
  title: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function DrawPad({ title, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#ef4444');
  const [erasing, setErasing] = useState(false);
  const [brush, setBrush] = useState(14);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = point(e);
    stroke(e); // dot on tap
  };

  const stroke = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(e);
    const from = last.current ?? p;
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = erasing ? brush * 1.6 : brush;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const out = document.createElement('canvas');
    out.width = GLYPH_PX;
    out.height = GLYPH_PX;
    out.getContext('2d')!.drawImage(canvasRef.current!, 0, 0, GLYPH_PX, GLYPH_PX);
    onSave(out.toDataURL('image/png'));
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div className="editor-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>{title} 그리기</span>
          <button className="picker-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="drawpad-wrap">
          <canvas
            ref={canvasRef}
            className="drawpad"
            style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
            onPointerDown={start}
            onPointerMove={stroke}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
          />
        </div>

        <div className="swatch-row">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${!erasing && color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setErasing(false);
              }}
            />
          ))}
          <button className={`tool ${erasing ? 'active' : ''}`} onClick={() => setErasing((v) => !v)}>
            지우개
          </button>
        </div>

        <div className="brush-row">
          <span>굵기</span>
          <input
            type="range"
            min={4}
            max={36}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
          <button className="tool" onClick={clear}>
            전체 지우기
          </button>
        </div>

        <button className="result-btn" onClick={save}>
          저장
        </button>
      </div>
    </div>
  );
}
