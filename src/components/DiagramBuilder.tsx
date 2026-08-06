import { useEffect, useRef, useState } from "react";
import type { DomainCircle } from "@/lib/diagram-types";
import { DEFAULT_COLORS } from "@/lib/diagram-types";

interface Props {
  circles: DomainCircle[];
  onChange: (circles: DomainCircle[]) => void;
  /** Compact renders a smaller canvas for side-by-side compare views */
  compact?: boolean;
  /** Draw a fixed central "You" circle and treat other circles as domains around it. */
  showYou?: boolean;
}

const MIN_R = 30;
const MAX_R = 165;
const STATIC_LABEL_PADDING = 10;

function radiusFor(percent: number, canvasSize: number) {
  const base = MIN_R + (MAX_R - MIN_R) * (percent / 100);
  // Scale radius relative to a 520px baseline so compact canvases still look right.
  return base * (canvasSize / 520);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStaticLabelSize(text: string, canvasSize: number) {
  const maxWidth = Math.max(110, canvasSize - STATIC_LABEL_PADDING * 2);
  const naturalWidth = text.length * 5.9 + 14;
  const width = Math.min(maxWidth, naturalWidth);
  const lines = Math.max(1, Math.ceil(naturalWidth / maxWidth));
  return { width, height: lines * 16 + 5, maxWidth };
}

function circleIntersectionPercent(cx: number, cy: number, r: number, center: number, youR: number) {
  const d = Math.hypot(cx - center, cy - center);
  let area = 0;
  if (d >= youR + r) area = 0;
  else if (d <= Math.abs(youR - r)) area = Math.PI * Math.min(youR, r) ** 2;
  else {
    const clampUnit = (v: number) => Math.min(1, Math.max(-1, v));
    const a1 = youR * youR * Math.acos(clampUnit((d * d + youR * youR - r * r) / (2 * d * youR)));
    const a2 = r * r * Math.acos(clampUnit((d * d + r * r - youR * youR) / (2 * d * r)));
    const a3 = 0.5 * Math.sqrt(Math.max(0, (-d + youR + r) * (d + youR - r) * (d - youR + r) * (d + youR + r)));
    area = a1 + a2 - a3;
  }
  return Math.round((area / (Math.PI * youR * youR)) * 100);
}

export function DiagramBuilder({ circles, onChange, compact = false, showYou = false }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(compact ? 340 : 520);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setSize(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const update = (id: string, patch: Partial<DomainCircle>) =>
    onChange(circles.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const remove = (id: string) => onChange(circles.filter((c) => c.id !== id));

  const addCustom = () => {
    const customCount = circles.filter((c) => c.custom).length;
    if (customCount >= 2) return;
    const color = DEFAULT_COLORS[6 + customCount] ?? DEFAULT_COLORS[0];
    onChange([
      ...circles,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: `Custom ${customCount + 1}`,
        percent: 20,
        x: 0.5,
        y: 0.5,
        enabled: true,
        color,
        custom: true,
      },
    ]);
  };

  const onPointerDown = (e: React.PointerEvent, c: DomainCircle) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelected(c.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = c.x * rect.width;
    const cy = c.y * rect.height;
    dragRef.current = {
      id: c.id,
      dx: e.clientX - rect.left - cx,
      dy: e.clientY - rect.top - cy,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragRef.current.dx) / rect.width;
    const y = (e.clientY - rect.top - dragRef.current.dy) / rect.height;
    update(dragRef.current.id, {
      x: Math.max(0.05, Math.min(0.95, x)),
      y: Math.max(0.05, Math.min(0.95, y)),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const customCount = circles.filter((c) => c.custom).length;
  const youR = size * 0.28;

  return (
    <div className="space-y-4">
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full rounded-2xl border border-border bg-card/60 venn-bg overflow-hidden touch-none select-none"
        style={{ aspectRatio: "1 / 1", maxHeight: compact ? 380 : 560 }}
      >
        {showYou && (
          <>
            <div
              className="absolute rounded-full border border-foreground/30 pointer-events-none"
              style={{
                width: youR * 2,
                height: youR * 2,
                left: size / 2 - youR,
                top: size / 2 - youR,
                background: "color-mix(in oklab, var(--foreground) 6%, transparent)",
              }}
            />
            <span
              className="absolute z-20 font-serif text-xl font-semibold text-foreground pointer-events-none"
              style={{ left: 0, right: 0, top: size / 2 - 14, textAlign: "center" }}
            >
              You
            </span>
          </>
        )}
        {circles
          .filter((c) => c.enabled)
          .map((c) => {
            const r = showYou
              ? youR * Math.sqrt(Math.max(0, c.percent) / 100)
              : radiusFor(c.percent, size);
            const cx = c.x * size;
            const cy = c.y * size;
            const isSel = selected === c.id;
            const overlap = showYou ? circleIntersectionPercent(cx, cy, r, size / 2, youR) : null;
            return (
              <div
                key={c.id}
                onPointerDown={(e) => onPointerDown(e, c)}
                onClick={() => setSelected(c.id)}
                className="absolute rounded-full flex items-center justify-center text-center cursor-grab active:cursor-grabbing transition-shadow"
                style={{
                  width: r * 2,
                  height: r * 2,
                  left: cx - r,
                  top: cy - r,
                  background: `${c.color}55`,
                  border: `1.5px solid ${c.color}`,
                  boxShadow: isSel ? `0 0 0 2px ${c.color}` : "none",
                  mixBlendMode: "multiply",
                }}
              >
                <span
                  className="px-2 text-[11px] md:text-xs font-medium text-foreground/85 pointer-events-none"
                  style={{ maxWidth: r * 1.7 }}
                >
                  {showYou ? `${c.label} · ${overlap}%` : c.label}
                </span>
              </div>
            );
          })}
        {circles.filter((c) => c.enabled).length === 0 && !showYou && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground italic">
            Turn a domain on below to place its circle.
          </div>
        )}
      </div>

      <ul className="grid gap-2">
        {circles.map((c) => (
          <li
            key={c.id}
            className={`rounded-xl border bg-background/60 px-3 py-2.5 ${
              c.enabled ? "border-border" : "border-border/50 opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => update(c.id, { enabled: !c.enabled })}
                aria-label={c.enabled ? `Hide ${c.label}` : `Show ${c.label}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  c.enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                    c.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ background: c.color }}
              />
              {renaming === c.id ? (
                <input
                  autoFocus
                  defaultValue={c.label}
                  onBlur={(e) => {
                    update(c.id, { label: e.target.value.trim() || c.label });
                    setRenaming(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="flex-1 min-w-0 bg-transparent border-b border-border outline-none text-foreground text-sm"
                />
              ) : (
                <button
                  onClick={() => setRenaming(c.id)}
                  className="flex-1 min-w-0 text-left text-sm text-foreground truncate hover:text-accent"
                  title="Click to rename"
                >
                  {c.label}
                </button>
              )}
              <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">
                {Math.round(c.percent)}%
              </span>
              {c.custom && (
                <button
                  onClick={() => remove(c.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${c.label}`}
                >
                  ×
                </button>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={c.percent}
              disabled={!c.enabled}
              onChange={(e) => update(c.id, { percent: parseInt(e.target.value, 10) })}
              className="mt-2 w-full accent-[var(--accent)]"
              aria-label={`Size of ${c.label}`}
            />
          </li>
        ))}
      </ul>

      {customCount < 2 && (
        <button
          onClick={addCustom}
          className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
        >
          + Add a domain ({customCount}/2 custom)
        </button>
      )}
    </div>
  );
}

export function StaticDiagram({
  title,
  circles,
  showYou = false,
}: {
  title: string;
  circles: DomainCircle[];
  /** When true, draw a central "You" circle and size each domain as a % of its area. */
  showYou?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(340);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const youR = size * 0.28;
  return (
    <div>
      {title && <p className="mb-2 text-center font-serif text-lg text-foreground">{title}</p>}
      <div
        ref={ref}
        className="relative w-full rounded-2xl border border-border bg-card/60 venn-bg overflow-hidden"
        style={{ aspectRatio: "1 / 1" }}
      >
        {showYou && (
          <>
            <div
              className="absolute rounded-full border border-foreground/30"
              style={{
                width: youR * 2,
                height: youR * 2,
                left: size / 2 - youR,
                top: size / 2 - youR,
                background: "color-mix(in oklab, var(--foreground) 6%, transparent)",
              }}
            />
            <span
              className="absolute font-serif text-foreground/70 pointer-events-none"
              style={{ left: 0, right: 0, top: size / 2 - 10, textAlign: "center", fontSize: 14 }}
            >
              You
            </span>
          </>
        )}
        {circles
          .filter((c) => c.enabled)
          .map((c) => {
            const r = showYou
              ? youR * Math.sqrt(Math.max(0, c.percent) / 100)
              : radiusFor(c.percent, size);
            // Clamp center so the entire circle fits inside the canvas
            // (never clipped by the rounded card edge).
            const cx = clamp(c.x * size, r + 2, size - r - 2);
            const cy = clamp(c.y * size, r + 2, size - r - 2);
            return (
              <div
                key={c.id}
                className="absolute rounded-full"
                style={{
                  width: r * 2,
                  height: r * 2,
                  left: cx - r,
                  top: cy - r,
                  background: `${c.color}55`,
                  border: `1.5px solid ${c.color}`,
                  mixBlendMode: "multiply",
                }}
              />
            );
          })}
        {(() => {
          const enabled = circles.filter((c) => c.enabled);
          // First pass: compute preferred position + size for every label.
          type LabelPlacement = {
            id: string;
            text: string;
            w: number;
            h: number;
            maxW: number;
            x: number;
            y: number;
          };
          const placements: LabelPlacement[] = enabled.map((c) => {
            const r = showYou
              ? youR * Math.sqrt(Math.max(0, c.percent) / 100)
              : radiusFor(c.percent, size);
            const cx = clamp(c.x * size, r + 2, size - r - 2);
            const cy = clamp(c.y * size, r + 2, size - r - 2);
            let overlapLabel = "";
            if (showYou) {
              overlapLabel = ` · ${circleIntersectionPercent(cx, cy, r, size / 2, youR)}%`;
            }
            const text = `${c.label}${overlapLabel}`;
            const sz = getStaticLabelSize(text, size);
            const dx = cx - size / 2;
            const dy = cy - size / 2;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const outsideX = cx + ux * (r + 14);
            const outsideY = cy + uy * (r + 14);
            const insideX = cx - ux * Math.min(r * 0.45, 34);
            const insideY = cy - uy * Math.min(r * 0.45, 34);
            const halfW = sz.width / 2;
            const halfH = sz.height / 2;
            const outsideWouldClip =
              outsideX - halfW < STATIC_LABEL_PADDING ||
              outsideX + halfW > size - STATIC_LABEL_PADDING ||
              outsideY - halfH < STATIC_LABEL_PADDING ||
              outsideY + halfH > size - STATIC_LABEL_PADDING;
            const forceInside = !!c.labelInside;
            const px = forceInside ? cx : outsideWouldClip ? insideX : outsideX;
            const py = forceInside ? cy : outsideWouldClip ? insideY : outsideY;
            return {
              id: c.id,
              text,
              w: sz.width,
              h: sz.height,
              maxW: sz.maxWidth,
              x: clamp(px, STATIC_LABEL_PADDING + halfW, size - STATIC_LABEL_PADDING - halfW),
              y: clamp(py, STATIC_LABEL_PADDING + halfH, size - STATIC_LABEL_PADDING - halfH),
            };
          });
          // Second pass: iterative pairwise separation so labels never overlap.
          const gap = 4;
          for (let iter = 0; iter < 40; iter++) {
            let moved = false;
            for (let i = 0; i < placements.length; i++) {
              for (let j = i + 1; j < placements.length; j++) {
                const a = placements[i];
                const b = placements[j];
                const minX = (a.w + b.w) / 2 + gap;
                const minY = (a.h + b.h) / 2 + gap;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const overlapX = minX - Math.abs(dx);
                const overlapY = minY - Math.abs(dy);
                if (overlapX > 0 && overlapY > 0) {
                  moved = true;
                  // push apart along the axis of least penetration
                  if (overlapY < overlapX) {
                    const shift = overlapY / 2 + 0.5;
                    const sign = dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy);
                    a.y -= sign * shift;
                    b.y += sign * shift;
                  } else {
                    const shift = overlapX / 2 + 0.5;
                    const sign = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
                    a.x -= sign * shift;
                    b.x += sign * shift;
                  }
                }
              }
            }
            // clamp back into the canvas after each pass
            for (const p of placements) {
              p.x = clamp(p.x, STATIC_LABEL_PADDING + p.w / 2, size - STATIC_LABEL_PADDING - p.w / 2);
              p.y = clamp(p.y, STATIC_LABEL_PADDING + p.h / 2, size - STATIC_LABEL_PADDING - p.h / 2);
            }
            if (!moved) break;
          }
          return placements.map((p) => (
            <span
              key={`${p.id}-label`}
              className="absolute block rounded px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight text-foreground pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                width: p.w,
                maxWidth: p.maxW,
                transform: "translate(-50%, -50%)",
                background: "color-mix(in oklab, var(--background) 94%, transparent)",
                boxShadow: "0 1px 8px color-mix(in oklab, var(--foreground) 10%, transparent)",
              }}
            >
              {p.text}
            </span>
          ));
        })()}
      </div>
    </div>
  );
}
