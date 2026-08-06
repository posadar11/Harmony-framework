import { useEffect, useRef, useState } from "react";
import type { Circle, RelationshipType, VennState } from "@/lib/venn-types";
import { TYPE_COLORS, TYPE_LABELS, makeCircle } from "@/lib/venn-types";
import { useLocalStorage } from "@/lib/storage";

const SIZE = 520;
const CENTER = SIZE / 2;
const SELF_R = 110;

/** Read a circle's stored size value as a "sizing" percent (own area). Handles legacy fraction values (<= 1.5). */
function pctOf(c: Circle) {
  return c.size <= 1.5 ? Math.round(c.size * c.size * 100) : Math.round(c.size);
}
/** Radius derived from the stored sizing value. */
function radiusFromPct(pct: number) {
  return SELF_R * Math.sqrt(Math.max(0, pct) / 100);
}
/** Lens area of two circles at center distance d. */
function lensArea(R: number, r: number, d: number) {
  if (d >= R + r) return 0;
  if (d <= Math.abs(R - r)) return Math.PI * Math.min(R, r) ** 2;
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const a1 = R * R * Math.acos(clamp((d * d + R * R - r * r) / (2 * d * R)));
  const a2 = r * r * Math.acos(clamp((d * d + r * r - R * R) / (2 * d * r)));
  const a3 = 0.5 * Math.sqrt(Math.max(0, (-d + R + r) * (d + R - r) * (d - R + r) * (d + R + r)));
  return a1 + a2 - a3;
}
/** Percent of the You circle covered by this domain circle. */
function overlapWithYouPct(c: Circle) {
  const r = radiusFromPct(pctOf(c));
  const d = SELF_R * c.distance;
  return Math.round((lensArea(SELF_R, r, d) / (Math.PI * SELF_R * SELF_R)) * 100);
}

interface Props {
  storageKey?: string;
  compact?: boolean;
}

export function VennDiagram({ storageKey = "hor.venn", compact = false }: Props) {
  const [state, setState] = useLocalStorage<VennState>(storageKey, { current: [], ideal: [] });
  const [mode, setMode] = useState<"current" | "ideal">("current");
  const [compare, setCompare] = useState(false);

  const setCircles = (next: Circle[]) =>
    setState((s) => ({ ...s, [mode]: next }));

  const addCircle = (type: RelationshipType) => {
    const list = state[mode];
    setCircles([...list, makeCircle(type, undefined, list.length)]);
  };

  const removeCircle = (id: string) =>
    setCircles(state[mode].filter((c) => c.id !== id));

  const updateCircle = (id: string, patch: Partial<Circle>) =>
    setCircles(state[mode].map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
            <button
              onClick={() => setMode("current")}
              className={`rounded-full px-4 py-1.5 transition-colors ${mode === "current" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Current
            </button>
            <button
              onClick={() => setMode("ideal")}
              className={`rounded-full px-4 py-1.5 transition-colors ${mode === "ideal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Ideal
            </button>
          </div>
          <button
            onClick={() => setCompare((v) => !v)}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground/80 hover:border-accent transition-colors"
          >
            {compare ? "Single view" : "Compare side by side"}
          </button>
        </div>
      )}

      {compare && !compact ? (
        <div className="grid gap-6 md:grid-cols-2">
          <StaticVenn title="Current" circles={state.current} />
          <StaticVenn title="Ideal" circles={state.ideal} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/60 p-4 venn-bg">
          <DraggableCanvas
            circles={state[mode]}
            onUpdate={updateCircle}
            onRemove={removeCircle}
          />
        </div>
      )}

      {!compact && (
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-sm font-medium text-foreground mb-2">Add a circle</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as RelationshipType[]).map((t) => (
              <button
                key={t}
                onClick={() => addCircle(t)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground/85 hover:border-accent transition-colors"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLORS[t] }} />
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Drag a circle toward the <strong>You</strong> circle to show how much of you it gets.
            Drag circles into each other to show which relationships are <em>intertwined</em> (e.g. a colleague who is also a close friend). Use the <strong>Size</strong> slider to show how much time and energy that circle takes up. Click a label to rename. Saved automatically.
          </p>
        </div>
      )}
    </div>
  );
}

function DraggableCanvas({
  circles,
  onUpdate,
  onRemove,
}: {
  circles: Circle[];
  onUpdate: (id: string, patch: Partial<Circle>) => void;
  onRemove: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * SIZE - CENTER;
      const y = ((e.clientY - rect.top) / rect.height) * SIZE - CENTER;
      const dist = Math.hypot(x, y);
      const angle = Math.atan2(y, x);
      const distance = Math.max(0.05, Math.min(1.5, dist / SELF_R));
      onUpdate(dragging, { distance, angle });
    };
    const onUp = () => setDragging(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, onUpdate]);

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto select-none touch-none"
      >
        {/* Self circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={SELF_R}
          fill="color-mix(in oklab, var(--circle-self) 18%, transparent)"
          stroke="var(--circle-self)"
          strokeWidth="1.5"
        />
        <text
          x={CENTER}
          y={CENTER + 5}
          textAnchor="middle"
          className="font-serif"
          fontSize="18"
          fill="var(--foreground)"
        >
          You
        </text>

        {circles.map((c) => {
          const pct = overlapWithYouPct(c);
          const r = radiusFromPct(pctOf(c));
          const cx = CENTER + Math.cos(c.angle) * SELF_R * c.distance;
          const cy = CENTER + Math.sin(c.angle) * SELF_R * c.distance;
          return (
            <g key={c.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={`color-mix(in oklab, ${TYPE_COLORS[c.type]} 28%, transparent)`}
                stroke={TYPE_COLORS[c.type]}
                strokeWidth="1.5"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.preventDefault();
                  setDragging(c.id);
                }}
              />
              <text
                x={cx}
                y={cy - r - 8}
                textAnchor="middle"
                fontSize="13"
                fill="var(--foreground)"
                className="cursor-pointer"
                onClick={() => setEditing(c.id)}
              >
                {c.label} · {pct}%
              </text>
            </g>
          );
        })}
      </svg>

      {circles.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
          <p className="text-sm text-muted-foreground italic">
            Add a circle below to begin.
          </p>
        </div>
      )}

      {circles.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {circles.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-md border border-border/70 bg-background/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[c.type] }} />
                {editing === c.id ? (
                  <input
                    autoFocus
                    defaultValue={c.label}
                    onBlur={(e) => {
                      onUpdate(c.id, { label: e.target.value || c.label });
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="flex-1 bg-transparent border-b border-border outline-none text-foreground"
                  />
                ) : (
                  <button
                    onClick={() => setEditing(c.id)}
                    className="truncate text-left text-foreground hover:text-accent"
                  >
                    {c.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => onRemove(c.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${c.label}`}
              >
                remove
              </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-12 shrink-0">Size</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pctOf(c)}
                  onChange={(e) => onUpdate(c.id, { size: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-[var(--accent)]"
                  aria-label={`Size of ${c.label}`}
                />
                <span className="w-16 text-right font-mono">{overlapWithYouPct(c)}% you</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StaticVenn({ title, circles }: { title: string; circles: Circle[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 venn-bg">
      <p className="mb-2 text-center font-serif text-lg text-foreground">{title}</p>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={SELF_R}
          fill="color-mix(in oklab, var(--circle-self) 18%, transparent)"
          stroke="var(--circle-self)"
          strokeWidth="1.5"
        />
        <text x={CENTER} y={CENTER + 5} textAnchor="middle" fontSize="18" fill="var(--foreground)">
          You
        </text>
        {circles.map((c) => {
          const pct = overlapWithYouPct(c);
          const r = radiusFromPct(pctOf(c));
          const cx = CENTER + Math.cos(c.angle) * SELF_R * c.distance;
          const cy = CENTER + Math.sin(c.angle) * SELF_R * c.distance;
          return (
            <g key={c.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={`color-mix(in oklab, ${TYPE_COLORS[c.type]} 28%, transparent)`}
                stroke={TYPE_COLORS[c.type]}
                strokeWidth="1.5"
              />
              <text x={cx} y={cy - r - 8} textAnchor="middle" fontSize="13" fill="var(--foreground)">
                {c.label} · {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}