import type { WeeklyAllocation } from "@/lib/weekly-allocation";

interface WeeklyPieChartProps {
  allocations: WeeklyAllocation[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

function buildGradient(allocations: WeeklyAllocation[]) {
  let position = 0;
  const stops = allocations
    .filter((allocation) => allocation.percent > 0)
    .map((allocation) => {
      const start = position;
      position += allocation.percent;
      return `${allocation.color} ${start}% ${position}%`;
    });
  return stops.length > 0 ? `conic-gradient(from -90deg, ${stops.join(", ")})` : "var(--muted)";
}

function pieLabelLines(label: string) {
  if (label === "Close relationships") return ["Close", "relationships"];
  if (label === "Time for myself") return ["Time for", "yourself"];

  const words = label.trim().split(/\s+/);
  if (words.length < 2 || label.length <= 13) return [label];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function buildPieLabels(allocations: WeeklyAllocation[]) {
  let position = 0;

  return allocations.map((allocation, index) => {
    const midpoint = position + allocation.percent / 2;
    position += allocation.percent;

    const angle = ((midpoint * 3.6 - 90) * Math.PI) / 180;
    const radius =
      allocation.percent >= 28
        ? 22
        : allocation.percent >= 14
          ? 29
          : allocation.percent >= 8
            ? 34
            : index % 2 === 0
              ? 38
              : 31;

    return {
      ...allocation,
      lines: pieLabelLines(allocation.label),
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius,
      small: allocation.percent < 10,
    };
  });
}

export function WeeklyPieChart({
  allocations,
  title = "Your typical week",
  subtitle = "A 100% view of how your week is distributed.",
  compact = false,
}: WeeklyPieChartProps) {
  const visible = allocations.filter((allocation) => allocation.percent > 0);
  const pieLabels = buildPieLabels(visible);

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Exercise 1 · Your result</p>
        <h2 className="mt-2 font-serif text-2xl text-foreground md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div
        className={`mt-7 grid items-center gap-7 ${compact ? "md:grid-cols-[1fr_1.15fr]" : "md:grid-cols-2"}`}
      >
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background/50 p-5">
          <div
            className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-full border-2 border-foreground/20 shadow-sm"
            style={{ background: buildGradient(visible) }}
            role="img"
            aria-label={visible
              .map((allocation) => `${allocation.label}: ${Math.round(allocation.percent)}%`)
              .join(", ")}
          >
            {pieLabels.map((allocation) => (
              <span
                key={allocation.id}
                className={`pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center font-semibold leading-[1.05] text-foreground ${
                  allocation.small ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"
                }`}
                style={{
                  left: `${allocation.left}%`,
                  top: `${allocation.top}%`,
                  WebkitTextStroke: allocation.small
                    ? "2.5px rgba(255,255,255,0.96)"
                    : "3.5px rgba(255,255,255,0.96)",
                  paintOrder: "stroke fill",
                  filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.6))",
                }}
                aria-hidden="true"
              >
                {allocation.lines.map((line) => (
                  <span key={line} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {visible.map((allocation) => {
            const bubbleSize = 14 + Math.sqrt(allocation.percent / 100) * 34;
            return (
              <div
                key={allocation.id}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3"
              >
                <span
                  className="shrink-0 rounded-full border border-foreground/15"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    backgroundColor: allocation.color,
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                  {allocation.label}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {Math.round(allocation.percent)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
