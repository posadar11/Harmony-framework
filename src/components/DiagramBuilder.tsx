import { useEffect, useMemo, useRef, useState } from "react";
import type { DomainCircle } from "@/lib/diagram-types";
import { DEFAULT_COLORS } from "@/lib/diagram-types";
import {
  clamp,
  constrainDomainToCanvas,
  domainRadiusRatio,
  domainTimeShare,
  estimateUniqueCoverage,
  PRESENTATION_YOU_RADIUS_RATIO,
  YOU_RADIUS_RATIO,
} from "@/lib/diagram-geometry";

interface Props {
  circles: DomainCircle[];
  onChange: (circles: DomainCircle[]) => void;
  /** Compact renders a smaller canvas for side-by-side compare views */
  compact?: boolean;
  /** Draw a fixed central "You" circle and treat other circles as domains around it. */
  showYou?: boolean;
  /** Large canvas-only view for live presentation; circles remain draggable. */
  presentationMode?: boolean;
  /** Restore the presentation demonstration to its starting state. */
  onResetPresentation?: () => void;
}

const MIN_R = 30;
const MAX_R = 165;
const STATIC_LABEL_PADDING = 10;
const MIN_ALLOCATION = 5;
const ALLOCATION_STEP = 5;
const DRAG_THRESHOLD_PX = 7;

function radiusFor(percent: number, canvasSize: number) {
  const base = MIN_R + (MAX_R - MIN_R) * (percent / 100);
  // Scale radius relative to a 520px baseline so compact canvases still look right.
  return base * (canvasSize / 520);
}

function getStaticLabelSize(text: string, canvasSize: number) {
  const maxWidth = Math.max(110, canvasSize - STATIC_LABEL_PADDING * 2);
  const naturalWidth = text.length * 5.9 + 14;
  const width = Math.min(maxWidth, naturalWidth);
  const lines = Math.max(1, Math.ceil(naturalWidth / maxWidth));
  return { width, height: lines * 16 + 5, maxWidth };
}

export function DiagramBuilder({
  circles,
  onChange,
  compact = false,
  showYou = false,
  presentationMode = false,
  onResetPresentation,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef(circles);
  const [size, setSize] = useState(compact ? 340 : 520);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);

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

  useEffect(() => {
    const cancelGesture = () => {
      dragRef.current = null;
    };
    window.addEventListener("blur", cancelGesture);
    return () => window.removeEventListener("blur", cancelGesture);
  }, []);

  const replaceCircles = (next: DomainCircle[]) => {
    circlesRef.current = next;
    onChange(next);
  };

  const youRadiusRatio = presentationMode ? PRESENTATION_YOU_RADIUS_RATIO : YOU_RADIUS_RATIO;

  const update = (id: string, patch: Partial<DomainCircle>) => {
    replaceCircles(circlesRef.current.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const grossAllocation = circles
    .filter((circle) => circle.enabled)
    .reduce((sum, circle) => sum + domainTimeShare(circle, youRadiusRatio), 0);
  const uniqueCoverage = useMemo(
    () => estimateUniqueCoverage(circles, 120, youRadiusRatio),
    [circles, youRadiusRatio],
  );
  const remainingCoverage = Math.max(0, 100 - uniqueCoverage);
  const sharedAllocation = Math.max(0, grossAllocation - uniqueCoverage);

  const updateAllocation = (id: string, requested: number) => {
    const percent = Math.round(clamp(requested, MIN_ALLOCATION, 100));
    const circle = circlesRef.current.find((item) => item.id === id);
    if (!circle) return;
    const position = constrainDomainToCanvas(circle.x, circle.y, percent, youRadiusRatio);
    update(id, { percent, ...position });
  };

  const toggleCircle = (circle: DomainCircle) => {
    if (circle.enabled) {
      update(circle.id, { enabled: false });
      return;
    }
    const percent = Math.max(MIN_ALLOCATION, Math.min(100, circle.percent || 20));
    const position = constrainDomainToCanvas(circle.x, circle.y, percent, youRadiusRatio);
    update(circle.id, { enabled: true, percent, ...position });
  };

  const remove = (id: string) => replaceCircles(circlesRef.current.filter((c) => c.id !== id));

  const addCustom = () => {
    const customCount = circles.filter((c) => c.custom).length;
    if (customCount >= 2) return;
    const color = DEFAULT_COLORS[6 + customCount] ?? DEFAULT_COLORS[0];
    replaceCircles([
      ...circlesRef.current,
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
    e.stopPropagation();
    if (dragRef.current && dragRef.current.pointerId !== e.pointerId) return;
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    setSelected(c.id);
    dragRef.current = {
      id: c.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: c.x,
      startY: c.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    const deltaX = e.clientX - drag.startClientX;
    const deltaY = e.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const circle = circlesRef.current.find((item) => item.id === drag.id);
    if (!circle) return;
    const desiredX = drag.startX + deltaX / rect.width;
    const desiredY = drag.startY + deltaY / rect.height;
    const position = showYou
      ? constrainDomainToCanvas(desiredX, desiredY, circle.percent, youRadiusRatio)
      : { x: clamp(desiredX, 0.05, 0.95), y: clamp(desiredY, 0.05, 0.95) };
    update(drag.id, {
      ...position,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    if (canvasRef.current?.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const customCount = circles.filter((c) => c.custom).length;
  const youR = size * youRadiusRatio;

  return (
    <div className="space-y-4">
      <div
        ref={canvasRef}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
        className="relative w-full rounded-2xl border border-border bg-card/60 venn-bg overflow-hidden touch-none select-none"
        style={{
          aspectRatio: "1 / 1",
          maxHeight: presentationMode ? 680 : compact ? 380 : 560,
          maxWidth: presentationMode ? 680 : undefined,
          marginInline: presentationMode ? "auto" : undefined,
        }}
      >
        <p className="absolute bottom-2 left-0 right-0 z-30 text-center text-[11px] text-muted-foreground pointer-events-none">
          {presentationMode
            ? "Drag circles into You to see the shared value"
            : "Drag in or out of You · overlap domains to show shared time"}
        </p>
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
              ? size * domainRadiusRatio(c.percent, youRadiusRatio)
              : radiusFor(c.percent, size);
            const position = showYou
              ? constrainDomainToCanvas(c.x, c.y, c.percent, youRadiusRatio)
              : c;
            const cx = position.x * size;
            const cy = position.y * size;
            const isSel = selected === c.id;
            return (
              <div
                key={c.id}
                onPointerDown={(e) => onPointerDown(e, c)}
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
                  zIndex: isSel ? 10 : 1,
                }}
              >
                <span
                  className="px-2 text-[11px] md:text-xs font-medium text-foreground/85 pointer-events-none"
                  style={{ maxWidth: r * 1.7 }}
                >
                  {showYou
                    ? `${c.label} · ${Math.round(domainTimeShare(c, youRadiusRatio))}%`
                    : c.label}
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

      {presentationMode && (
        <div className="mx-auto w-full max-w-[680px] rounded-2xl border border-border bg-card/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-foreground">Change each circle's size</p>
            {onResetPresentation && (
              <button
                type="button"
                onClick={onResetPresentation}
                className="rounded-full border border-border px-3 py-1 text-[11px] text-foreground hover:border-accent"
              >
                Reset to 50 · outside
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {circles
              .filter((circle) => circle.enabled)
              .map((circle) => (
                <label key={circle.id} className="rounded-xl bg-muted/55 px-2 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] text-foreground/80">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: circle.color }}
                    />
                    <span className="truncate">{circle.label}</span>
                  </span>
                  <input
                    type="range"
                    min={MIN_ALLOCATION}
                    max={100}
                    step={1}
                    value={circle.percent}
                    onChange={(event) =>
                      updateAllocation(circle.id, Number.parseInt(event.target.value, 10))
                    }
                    className="mt-2 w-full accent-[var(--accent)]"
                    aria-label={`Circle size for ${circle.label}`}
                  />
                  <span className="mt-0.5 block text-center font-mono text-[10px] text-muted-foreground">
                    Size {Math.round(circle.percent)}
                  </span>
                </label>
              ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Size changes the category circle. Position changes how much of it enters You.
          </p>
        </div>
      )}

      {showYou && !presentationMode && (
        <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-foreground/80">
          <span className="font-medium text-foreground">How it works:</span> the part of a domain
          inside You is its percentage of your time. Move it outward to reduce that share. Where
          domains overlap inside You, that time is shared and counts only once overall.
        </div>
      )}

      {!presentationMode && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Unique time accounted for</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Overlapping domains share time, so the overlap counts only once overall.
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm text-foreground">
              {Math.round(uniqueCoverage)}% / 100%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${clamp(uniqueCoverage, 0, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {Math.round(uniqueCoverage)}% is occupied by the people, responsibilities, and
              activities shown.
            </span>{" "}
            The remaining {Math.round(remainingCoverage)}% is unoccupied personal time—time that is
            entirely yours and is not spent with others, working, participating in community, or
            doing a hobby.
            {sharedAllocation >= 1 &&
              ` Approximately ${Math.round(sharedAllocation)}% is shared across domains.`}
          </p>
        </div>
      )}

      {!presentationMode && (
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
                  onClick={() => toggleCircle(c)}
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
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: c.color }} />
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
                  {Math.round(domainTimeShare(c))}%
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
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={!c.enabled || c.percent <= MIN_ALLOCATION}
                  onClick={() => updateAllocation(c.id, c.percent - ALLOCATION_STEP)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-lg text-foreground disabled:opacity-35"
                  aria-label={`Reduce ${c.label}`}
                >
                  −
                </button>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${c.id}-allocation`} className="sr-only">
                    Circle size for {c.label}
                  </label>
                  <input
                    id={`${c.id}-allocation`}
                    type="range"
                    min={MIN_ALLOCATION}
                    max={100}
                    step={1}
                    value={c.percent}
                    disabled={!c.enabled}
                    onChange={(e) => updateAllocation(c.id, parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--accent)] disabled:opacity-35"
                  />
                  <p className="mt-1 text-center text-[11px] text-muted-foreground">
                    Circle size · position determines the share inside You
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!c.enabled || c.percent >= 100}
                  onClick={() => updateAllocation(c.id, c.percent + ALLOCATION_STEP)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-lg text-foreground disabled:opacity-35"
                  aria-label={`Increase ${c.label}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!presentationMode && customCount < 2 && (
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
  const youR = size * YOU_RADIUS_RATIO;
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
            const r = showYou ? size * domainRadiusRatio(c.percent) : radiusFor(c.percent, size);
            const position = showYou ? constrainDomainToCanvas(c.x, c.y, c.percent) : c;
            const cx = showYou ? position.x * size : clamp(position.x * size, r + 2, size - r - 2);
            const cy = showYou ? position.y * size : clamp(position.y * size, r + 2, size - r - 2);
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
            const r = showYou ? size * domainRadiusRatio(c.percent) : radiusFor(c.percent, size);
            const position = showYou ? constrainDomainToCanvas(c.x, c.y, c.percent) : c;
            const cx = showYou ? position.x * size : clamp(position.x * size, r + 2, size - r - 2);
            const cy = showYou ? position.y * size : clamp(position.y * size, r + 2, size - r - 2);
            const share = c.timeShare ?? domainTimeShare({ ...c, ...position });
            const text = showYou ? `${c.label} · ${Math.round(share)}%` : c.label;
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
              p.x = clamp(
                p.x,
                STATIC_LABEL_PADDING + p.w / 2,
                size - STATIC_LABEL_PADDING - p.w / 2,
              );
              p.y = clamp(
                p.y,
                STATIC_LABEL_PADDING + p.h / 2,
                size - STATIC_LABEL_PADDING - p.h / 2,
              );
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
